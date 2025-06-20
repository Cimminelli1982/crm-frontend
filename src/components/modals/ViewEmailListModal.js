import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiMail, FiUser, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002; /* Higher than other modals */
`;

const ModalContainer = styled.div`
  background-color: #111;
  border: 2px solid #00ff00;
  border-radius: 8px;
  width: 90%;
  max-width: 1000px;
  height: 80%;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
  background-color: #000;
`;

const ModalTitle = styled.h2`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #00ff00;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: #ffffff;
  }
`;

const ModalContent = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #111;
  box-sizing: border-box;
  width: 100%;
`;

const ContactsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #333;
`;

const ContactCount = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
`;

const ContactsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ContactsHeaderRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #000;
  border: 1px solid #333;
  border-radius: 4px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const HeaderCell = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const ContactItem = styled.div`
  background-color: #000;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 15px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #00ff00;
  }
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ContactName = styled.div`
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const NameWithIcon = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #ff0000;
    background-color: rgba(255, 0, 0, 0.1);
  }
`;

const ContactEmail = styled.div`
  color: #cccccc;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LoadingText = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 40px;
  font-size: 18px;
`;

const EmptyState = styled.div`
  color: #666;
  font-family: 'Courier New', monospace;
  text-align: center;
  padding: 40px;
  font-size: 16px;
`;

const AddNewButton = styled.button`
  background-color: #000;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 8px 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
  }
`;

const AddContactSection = styled.div`
  background-color: #000;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
  display: ${props => props.$show ? 'block' : 'none'};
  box-sizing: border-box;
  width: 100%;
`;

const SearchInput = styled.input`
  background-color: #111;
  border: 2px solid #333;
  color: #ffffff;
  padding: 10px 15px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  border-radius: 4px;
  outline: none;
  transition: all 0.2s ease;
  width: 100%;
  margin-bottom: 15px;
  box-sizing: border-box;
  
  &:focus {
    border-color: #00ff00;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const ContactSearchResults = styled.div`
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #333;
  border-radius: 4px;
  background-color: #111;
`;

const SearchResultItem = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #222;
    border-left: 3px solid #00ff00;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SearchResultName = styled.div`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
`;

const SearchResultEmail = styled.div`
  color: #ccc;
  font-family: 'Courier New', monospace;
  font-size: 12px;
`;

const AddContactButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 15px;
`;

const CancelButton = styled.button`
  background-color: #111;
  border: 2px solid #666;
  color: #ccc;
  padding: 8px 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #999;
    color: #fff;
  }
`;

const ViewEmailListModal = ({ isOpen, onClose, onListUpdated, emailList }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    if (isOpen && emailList) {
      fetchMembers();
    }
  }, [isOpen, emailList]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchContacts();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchContacts = async () => {
    try {
      setSearchLoading(true);
      
      // Search for contacts that are not already in this list
      const existingContactIds = members.map(member => member.contact_id);
      
      // Build the query step by step
      let query = supabase
        .from('contacts')
        .select(`
          contact_id,
          first_name,
          last_name,
          contact_emails!inner(email, is_primary)
        `);

      // Add search filters
      if (searchTerm.includes('@')) {
        // If search term looks like an email, search in contact_emails
        query = query.ilike('contact_emails.email', `%${searchTerm}%`);
      } else {
        // Handle full name search (first name + last name)
        const searchWords = searchTerm.trim().split(/\s+/);
        
        if (searchWords.length === 1) {
          // Single word - search in both first_name and last_name
          query = query.or(`first_name.ilike.%${searchWords[0]}%,last_name.ilike.%${searchWords[0]}%`);
        } else if (searchWords.length >= 2) {
          // Multiple words - assume first word is first name, rest is last name
          const firstName = searchWords[0];
          const lastName = searchWords.slice(1).join(' ');
          query = query.or(`and(first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%),and(first_name.ilike.%${lastName}%,last_name.ilike.%${firstName}%),first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`);
        }
      }

      // Only add the exclusion filter if there are existing contacts
      if (existingContactIds.length > 0) {
        query = query.not('contact_id', 'in', `(${existingContactIds.join(',')})`);
      }

      query = query.limit(10);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Process results to get primary email
      const processedResults = data?.map(contact => {
        const primaryEmail = contact.contact_emails.find(e => e.is_primary)?.email || 
                           contact.contact_emails[0]?.email || 'No email';
        
        return {
          contact_id: contact.contact_id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown Name',
          email: primaryEmail,
          first_name: contact.first_name,
          last_name: contact.last_name
        };
      }) || [];

      setSearchResults(processedResults);
    } catch (err) {
      console.error('Error searching contacts:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddContact = async (contact) => {
    try {
      setAddingContact(true);
      
      const listId = emailList.list_id || emailList.email_list_id || emailList.uuid || emailList.id;
      
      if (!listId) {
        throw new Error('No valid list ID found');
      }

      // Add the contact to the email list
      const memberData = {
        list_id: listId,
        contact_id: contact.contact_id,
        email_address: contact.email,
        added_at: new Date().toISOString()
      };

      let insertResult;
      
      // Try different field names for the list relationship
      insertResult = await supabase
        .from('email_list_members')
        .insert([memberData])
        .select();

      if (insertResult.error && insertResult.error.code === '42703') {
        // Try with email_list_uuid
        const memberDataAlt = {
          ...memberData,
          email_list_uuid: listId
        };
        delete memberDataAlt.list_id;
        
        insertResult = await supabase
          .from('email_list_members')
          .insert([memberDataAlt])
          .select();
      }

      if (insertResult.error && insertResult.error.code === '42703') {
        // Try with email_list_id
        const memberDataAlt2 = {
          ...memberData,
          email_list_id: listId
        };
        delete memberDataAlt2.list_id;
        
        insertResult = await supabase
          .from('email_list_members')
          .insert([memberDataAlt2])
          .select();
      }

      if (insertResult.error) {
        throw insertResult.error;
      }

      // Update the total_contacts count in the email_lists table
      const newMemberCount = members.length + 1;
      
      let updateResult;
      updateResult = await supabase
        .from('email_lists')
        .update({ total_contacts: newMemberCount })
        .eq('list_id', listId);

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update({ total_contacts: newMemberCount })
          .eq('email_list_id', listId);
      }

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update({ total_contacts: newMemberCount })
          .eq('uuid', listId);
      }

      // Add the new member to local state
      const newMember = {
        id: insertResult.data[0].id || insertResult.data[0].list_member_id,
        name: contact.name,
        email: contact.email,
        contact_id: contact.contact_id,
        contact: {
          first_name: contact.first_name,
          last_name: contact.last_name
        }
      };

      setMembers(prev => [...prev, newMember]);
      
      // Remove from search results
      setSearchResults(prev => prev.filter(r => r.contact_id !== contact.contact_id));
      
      // Reset search
      setSearchTerm('');
      setShowAddContact(false);
      
      // Notify parent component to refresh its data
      if (onListUpdated) {
        onListUpdated();
      }
      
      console.log('Contact added successfully');

    } catch (err) {
      console.error('Error adding contact to list:', err);
      alert(`Error adding contact: ${err.message}`);
    } finally {
      setAddingContact(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddContact(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveContact = async (member) => {
    if (!window.confirm(`Are you sure you want to remove "${member.name}" from this email list?`)) {
      return;
    }

    try {
      // Get the list ID using the same flexible detection
      const listId = emailList.list_id || emailList.email_list_id || emailList.uuid || emailList.id;
      
      if (!listId) {
        throw new Error('No valid list ID found');
      }

      // Get the member ID using flexible detection
      const memberId = member.id || member._originalMember?.id || member._originalMember?.list_member_id || member._originalMember?.uuid;
      
      if (!memberId) {
        console.error('Member object:', member);
        throw new Error('No valid member ID found');
      }

      console.log('Attempting to delete member with ID:', memberId);

      // Remove the member from email_list_members table
      let deleteResult;
      
      // Try with different possible primary key field names
      deleteResult = await supabase
        .from('email_list_members')
        .delete()
        .eq('id', memberId);

      if (deleteResult.error && deleteResult.error.code === '42703') {
        // Try with list_member_id
        deleteResult = await supabase
          .from('email_list_members')
          .delete()
          .eq('list_member_id', memberId);
      }

      if (deleteResult.error && deleteResult.error.code === '42703') {
        // Try with uuid
        deleteResult = await supabase
          .from('email_list_members')
          .delete()
          .eq('uuid', memberId);
      }

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      // Update the total_contacts count in the email_lists table
      const newMemberCount = members.length - 1;
      
      let updateResult;
      updateResult = await supabase
        .from('email_lists')
        .update({ total_contacts: newMemberCount })
        .eq('list_id', listId);

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update({ total_contacts: newMemberCount })
          .eq('email_list_id', listId);
      }

      if (updateResult.error && updateResult.error.code === '42703') {
        updateResult = await supabase
          .from('email_lists')
          .update({ total_contacts: newMemberCount })
          .eq('uuid', listId);
      }

      // Remove from local state
      setMembers(prev => prev.filter(m => m.id !== member.id));
      
      // Notify parent component to refresh its data
      if (onListUpdated) {
        onListUpdated();
      }
      
      console.log('Contact removed successfully');

    } catch (err) {
      console.error('Error removing contact from list:', err);
      alert(`Error removing contact: ${err.message}`);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the list ID using the same flexible detection as in MailingListsModal
      const listId = emailList.list_id || emailList.email_list_id || emailList.uuid || emailList.id;
      
      if (!listId) {
        throw new Error('No valid list ID found');
      }

      // First, let's get a sample record to see the actual structure
      console.log('Fetching members for list ID:', listId);
      
      // Try to get all records first to see the structure
      const { data: sampleData, error: sampleError } = await supabase
        .from('email_list_members')
        .select('*')
        .limit(1);
        
      if (sampleData && sampleData.length > 0) {
        console.log('Email list members table structure:', Object.keys(sampleData[0]));
        console.log('Sample record:', sampleData[0]);
      }

      // Try different possible field names for the email list relationship
      let data, error;
      
      // Try with list_id first
      const result1 = await supabase
        .from('email_list_members')
        .select(`
          *,
          contacts!inner (
            contact_id,
            first_name,
            last_name
          )
        `)
        .eq('list_id', listId);
        
      if (result1.error && result1.error.code === '42703') {
        // Try with email_list_uuid
        const result2 = await supabase
          .from('email_list_members')
          .select(`
            *,
            contacts!inner (
              contact_id,
              first_name,
              last_name
            )
          `)
          .eq('email_list_uuid', listId);
          
        if (result2.error && result2.error.code === '42703') {
          // Try with uuid
          const result3 = await supabase
            .from('email_list_members')
            .select(`
              *,
              contacts!inner (
                contact_id,
                first_name,
                last_name
              )
            `)
            .eq('uuid', listId);
            
          data = result3.data;
          error = result3.error;
        } else {
          data = result2.data;
          error = result2.error;
        }
      } else {
        data = result1.data;
        error = result1.error;
      }

      if (error) {
        throw error;
      }

      // Process the data to flatten contact information
      const processedMembers = data?.map(member => ({
        id: member.id || member.list_member_id || member.uuid,
        name: `${member.contacts?.first_name || ''} ${member.contacts?.last_name || ''}`.trim() || 'Unknown Name',
        email: member.email_address || 'No email',
        contact_id: member.contact_id,
        contact: member.contacts,
        // Keep the original member data for debugging
        _originalMember: member
      })) || [];

      setMembers(processedMembers);
    } catch (err) {
      console.error('Error fetching email list members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiMail />
            {emailList?.name || 'Email List'} - Members
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ModalContent>
          <ContactsHeader>
            <ContactCount>
              Total Contacts: {members.length}
            </ContactCount>
            <AddNewButton onClick={() => setShowAddContact(!showAddContact)}>
              <FiPlus size={14} />
              ADD NEW
            </AddNewButton>
          </ContactsHeader>

          <AddContactSection $show={showAddContact}>
            <SearchInput
              type="text"
              placeholder="Search contacts by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            {searchLoading && (
              <div style={{ color: '#00ff00', textAlign: 'center', padding: '10px' }}>
                Searching...
              </div>
            )}
            
            {searchResults.length > 0 && (
              <ContactSearchResults>
                {searchResults.map((contact) => (
                  <SearchResultItem 
                    key={contact.contact_id}
                    onClick={() => handleAddContact(contact)}
                    style={{ opacity: addingContact ? 0.5 : 1, cursor: addingContact ? 'not-allowed' : 'pointer' }}
                  >
                    <SearchResultName>{contact.name}</SearchResultName>
                    <SearchResultEmail>{contact.email}</SearchResultEmail>
                  </SearchResultItem>
                ))}
              </ContactSearchResults>
            )}
            
            {searchTerm.length >= 2 && !searchLoading && searchResults.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No contacts found or all matching contacts are already in this list
              </div>
            )}
            
            <AddContactButtons>
              <CancelButton onClick={handleCancelAdd}>
                CANCEL
              </CancelButton>
            </AddContactButtons>
          </AddContactSection>

          <ContactsHeaderRow>
            <HeaderCell>Name</HeaderCell>
            <HeaderCell>Email</HeaderCell>
          </ContactsHeaderRow>
          
          {loading ? (
            <LoadingText>Loading contacts...</LoadingText>
          ) : error ? (
            <EmptyState>Error loading contacts: {error}</EmptyState>
          ) : members.length === 0 ? (
            <EmptyState>No contacts found in this email list</EmptyState>
          ) : (
            <ContactsGrid>
              {members.map((member) => (
                <ContactItem key={member.id}>
                  <ContactInfo>
                    <ContactName>
                      <NameWithIcon>
                        <FiUser size={16} />
                        {member.name}
                      </NameWithIcon>
                      <RemoveButton 
                        onClick={() => handleRemoveContact(member)}
                        title={`Remove ${member.name} from this list`}
                      >
                        <FiTrash2 size={16} />
                      </RemoveButton>
                    </ContactName>
                    <ContactEmail>
                      <FiMail size={14} />
                      {member.email}
                    </ContactEmail>
                  </ContactInfo>
                </ContactItem>
              ))}
            </ContactsGrid>
          )}
        </ModalContent>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default ViewEmailListModal; 