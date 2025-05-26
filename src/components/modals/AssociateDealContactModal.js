import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FiX, FiPlus, FiSearch, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Styled components
const ModalContainer = styled.div`
  width: 100%;
  max-width: 600px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  color: #00ff00;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 5px;
  border-radius: 4px;

  &:hover {
    background: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #00ff00;
  font-size: 14px;
  font-weight: 500;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 40px 10px 12px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  height: 40px;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
`;

const ResultsContainer = styled.div`
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
`;

const ResultItem = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #333;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    background: #333;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ResultInfo = styled.div`
  flex: 1;
`;

const ResultName = styled.div`
  color: #fff;
  font-weight: 500;
  margin-bottom: 4px;
`;

const ResultDetail = styled.div`
  color: #999;
  font-size: 12px;
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  color: #00ff00;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  margin-left: 5px;
  border-radius: 4px;

  &:hover {
    background: #444;
  }
`;

const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #999;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #333;
    color: #00ff00;
    border: 1px solid #00ff00;
    
    &:hover {
      background: #444;
    }
  }
  
  &.cancel {
    background: transparent;
    color: #fff;
    border: 1px solid #555;
    
    &:hover {
      background: #333;
    }
  }
`;

const RelationshipSelect = styled.select`
  width: 100%;
  padding: 10px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%23aaa' stroke-width='1.5' viewBox='0 0 10 6'><polyline points='1,1 5,5 9,1'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  height: 40px;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

// Define relationship types
const RELATIONSHIP_TYPES = [
  "introducer",
  "co-investor",
  "advisor",
  "proposer",
  "other"
];

const AssociateDealContactModal = ({ 
  isOpen, 
  onRequestClose, 
  dealId,
  onContactAssociated = () => {}
}) => {
  // State for the search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  
  // State for selected contact and relationship
  const [selectedContact, setSelectedContact] = useState(null);
  const [relationship, setRelationship] = useState('other');
  
  // Refs
  const searchInputRef = useRef(null);
  const searchTimeout = useRef(null);
  
  // Focus the search input when the modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 100);
    }
    
    // Clear state when modal opens
    if (isOpen) {
      setSearchTerm('');
      setSearchResults([]);
      setSelectedContact(null);
      setRelationship('other');
      setNoResults(false);
      
      // Debug dealId
      console.log('AssociateDealContactModal opened with dealId:', dealId);
    }
  }, [isOpen, dealId]);
  
  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (value.length < 2) {
      setSearchResults([]);
      setNoResults(false);
      return;
    }
    
    // Set a new timeout for search
    searchTimeout.current = setTimeout(() => {
      searchContacts(value);
    }, 300);
  };
  
  // Handle search with Enter key
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (searchTerm.length < 2) return;
      
      // Clear previous timeout and search immediately
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      searchContacts(searchTerm);
    }
  };
  
  // Search contacts in Supabase
  const searchContacts = async (term) => {
    setLoading(true);
    
    try {
      // Get existing associations to filter out already associated contacts
      const { data: existingAssociations, error: associationsError } = await supabase
        .from('deals_contacts')
        .select('contact_id')
        .eq('deal_id', dealId);
        
      if (associationsError) throw associationsError;
      
      const existingContactIds = new Set(existingAssociations.map(a => a.contact_id));
      
      // Search for contacts by name
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        .order('last_name', { ascending: true })
        .limit(20);
        
      if (error) throw error;
      
      // Filter out already associated contacts
      const filteredResults = data.filter(contact => !existingContactIds.has(contact.contact_id));
      
      setSearchResults(filteredResults);
      setNoResults(filteredResults.length === 0);
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast.error('Failed to search contacts');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle selecting a contact
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setSearchResults([]);
    setSearchTerm(`${contact.first_name} ${contact.last_name}`);
  };
  
  // Handle creating a new contact
  const handleCreateNewContact = () => {
    // Close this modal and signal to parent to open a new contact modal
    onRequestClose();
    // Signal to parent component to open new contact modal with the search term
    onContactAssociated({ action: 'create_new', searchTerm });
  };
  
  // Handle associating the contact
  const handleAssociateContact = async () => {
    if (!selectedContact) {
      toast.error('Please select a contact to associate');
      return;
    }
    
    console.log('handleAssociateContact - dealId:', dealId, 'type:', typeof dealId);
    console.log('handleAssociateContact - selectedContact:', selectedContact);
    
    if (!dealId) {
      console.error('Missing deal ID when trying to associate contact', { 
        dealId, 
        contactId: selectedContact?.contact_id 
      });
      toast.error('Cannot associate contact: Missing deal ID');
      return;
    }
    
    try {
      // Show loading state
      toast.loading('Associating contact...', { id: 'associate-contact' });
      
      console.log('Associating contact to deal', { 
        dealId: dealId,
        dealIdType: typeof dealId,
        contactId: selectedContact.contact_id,
        contactName: `${selectedContact.first_name} ${selectedContact.last_name}`,
        relationship: relationship
      });
      
      // Associate the contact with the deal
      const { data, error } = await supabase
        .from('deals_contacts')
        .insert({
          deal_id: String(dealId),
          contact_id: selectedContact.contact_id,
          relationship: relationship
        })
        .select();
        
      if (error) {
        console.error('Database error when associating contact:', error);
        throw error;
      }
      
      console.log('Contact association successful:', data);
      
      // Dismiss loading toast and show success
      toast.dismiss('associate-contact');
      toast.success(`${selectedContact.first_name} ${selectedContact.last_name} associated successfully`);
      
      // Call the callback with the response data
      onContactAssociated({ 
        action: 'associated',
        contact: selectedContact,
        relationship: relationship,
        data: data?.[0] // Include the response data for the deals_contacts entry
      });
      
      // Close the modal
      onRequestClose();
    } catch (error) {
      console.error('Error associating contact:', error);
      toast.dismiss('associate-contact');
      toast.error(`Failed to associate contact: ${error.message || 'Unknown error'}`);
    }
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '25px',
          border: '1px solid #444',
          borderRadius: '8px',
          backgroundColor: '#111',
          color: '#fff',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000
        }
      }}
    >
      <ModalContainer>
        <Header>
          <Title>Associate Contact with Deal</Title>
          <CloseButton onClick={onRequestClose}>
            <FiX size={20} />
          </CloseButton>
        </Header>
        
        <SearchContainer>
          <SearchInput 
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search for a contact by name..."
          />
          <SearchIcon>
            <FiSearch size={16} />
          </SearchIcon>
        </SearchContainer>
        
        {loading && (
          <EmptyMessage>Searching...</EmptyMessage>
        )}
        
        {!loading && searchTerm.length >= 2 && (
          <>
            {searchResults.length > 0 ? (
              <ResultsContainer>
                {searchResults.map(contact => (
                  <ResultItem key={contact.contact_id} onClick={() => handleSelectContact(contact)}>
                    <ResultInfo>
                      <ResultName>{contact.first_name} {contact.last_name}</ResultName>
                      <ResultDetail>
                        {contact.job_role || 'No job role'} • {contact.mobile || 'No mobile'}
                      </ResultDetail>
                    </ResultInfo>
                    <ActionButton title="View details">
                      <FiExternalLink size={16} />
                    </ActionButton>
                  </ResultItem>
                ))}
              </ResultsContainer>
            ) : noResults ? (
              <ResultsContainer>
                <EmptyMessage>
                  No contacts found with that name.
                  <div style={{ marginTop: '10px' }}>
                    <Button className="primary" onClick={handleCreateNewContact}>
                      <FiPlus size={14} /> Create New Contact
                    </Button>
                  </div>
                </EmptyMessage>
              </ResultsContainer>
            ) : null}
          </>
        )}
        
        {selectedContact && (
          <>
            <FormGroup style={{ marginTop: '20px' }}>
              <FormLabel>Relationship to Deal</FormLabel>
              <RelationshipSelect
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
              >
                {RELATIONSHIP_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </RelationshipSelect>
            </FormGroup>
          </>
        )}
        
        <ButtonGroup>
          <Button className="cancel" onClick={onRequestClose}>
            Cancel
          </Button>
          <Button 
            className="primary" 
            onClick={handleAssociateContact}
            disabled={!selectedContact}
          >
            {selectedContact ? `Associate ${selectedContact.first_name} ${selectedContact.last_name}` : 'Select a Contact'}
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </Modal>
  );
};

export default AssociateDealContactModal;