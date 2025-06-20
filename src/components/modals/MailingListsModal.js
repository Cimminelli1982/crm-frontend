import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiMail } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import CreateNewListModal from './CreateNewListModal';
import ViewEmailListModal from './ViewEmailListModal';

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
  z-index: 1000;
`;

const ModalContainer = styled.div`
  background-color: #111;
  border: 2px solid #00ff00;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  height: 80%;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  position: relative;
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
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 2px;
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
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const AddNewButton = styled.button`
  background-color: #000;
  border: 2px solid #00ff00;
  color: #00ff00;
  padding: 10px 20px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #00ff00;
    color: #000;
  }
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ListItem = styled.div`
  background-color: #000;
  border: 2px solid #333;
  border-radius: 4px;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #00ff00;
  }
`;

const ListInfo = styled.div`
  color: #ffffff;
  font-family: 'Courier New', monospace;
  font-size: 16px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  background-color: #111;
  border: 1px solid #333;
  color: #ffffff;
  padding: 8px 16px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #00ff00;
    color: #00ff00;
  }
  
  &.open {
    &:hover {
      background-color: #00ff00;
      color: #000;
    }
  }
  
  &.duplicate {
    &:hover {
      background-color: #ffaa00;
      color: #000;
    }
  }
  
  &.delete {
    &:hover {
      background-color: #ff0000;
      color: #000;
    }
  }
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

const MailingListsModal = ({ isOpen, onClose }) => {
  const [emailLists, setEmailLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedEmailList, setSelectedEmailList] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchEmailLists();
    }
  }, [isOpen]);

  const fetchEmailLists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setEmailLists(data || []);
      
      // Log the data structure to see available fields
      if (data && data.length > 0) {
        console.log('Email list data structure:', Object.keys(data[0]));
        console.log('Sample email list:', data[0]);
      }
    } catch (err) {
      console.error('Error fetching email lists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleOpen = (listId) => {
    // Find the selected email list
    const selectedList = emailLists.find(list => 
      list.list_id === listId || 
      list.email_list_id === listId || 
      list.uuid === listId ||
      list.id === listId
    );

    if (selectedList) {
      setSelectedEmailList(selectedList);
      setIsViewModalOpen(true);
    }
  };

  const handleDuplicate = async (listId) => {
    try {
      // Find the list to duplicate
      const originalList = emailLists.find(list => 
        list.list_id === listId || 
        list.email_list_id === listId || 
        list.uuid === listId ||
        list.id === listId
      );

      if (!originalList) {
        throw new Error('Original list not found');
      }

      // Create a duplicate with modified name
      const duplicateList = {
        ...originalList,
        name: `Copy of ${originalList.name || 'Unnamed List'}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove the primary key field(s) so a new one gets generated
      delete duplicateList.list_id;
      delete duplicateList.email_list_id;
      delete duplicateList.uuid;
      delete duplicateList.id;

      // Insert the duplicate into the database
      const { data, error } = await supabase
        .from('email_lists')
        .insert([duplicateList])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const newEmailList = data[0];
        const newListId = newEmailList.list_id || newEmailList.email_list_id || newEmailList.uuid || newEmailList.id;
        
        // Now copy all members from the original list to the new list
        if (newListId) {
          try {
            console.log('Original list ID:', listId);
            console.log('New list ID:', newListId);
            
            // Get all members from the original list - try different field names
            let originalMembers = null;
            let membersError = null;
            
            // Try list_id first
            const result1 = await supabase
              .from('email_list_members')
              .select('*')
              .eq('list_id', listId);
              
            if (result1.error && result1.error.code === '42703') {
              // Try email_list_uuid
              const result2 = await supabase
                .from('email_list_members')
                .select('*')
                .eq('email_list_uuid', listId);
                
              if (result2.error && result2.error.code === '42703') {
                // Try email_list_id
                const result3 = await supabase
                  .from('email_list_members')
                  .select('*')
                  .eq('email_list_id', listId);
                  
                originalMembers = result3.data;
                membersError = result3.error;
              } else {
                originalMembers = result2.data;
                membersError = result2.error;
              }
            } else {
              originalMembers = result1.data;
              membersError = result1.error;
            }

            if (membersError) {
              throw membersError;
            }

            console.log('Found original members:', originalMembers?.length || 0);

            if (originalMembers && originalMembers.length > 0) {
                              // Create new member records for the duplicated list
                const newMembers = originalMembers.map(member => {
                  const newMember = { ...member };
                  
                  console.log('Original member:', member);
                  
                  // Remove the original IDs so new ones get generated
                  delete newMember.id;
                  delete newMember.member_id;
                  delete newMember.list_member_id; // This is the actual primary key field
                  
                  // Set the new list ID using the same field name structure as original
                  if (member.list_id !== undefined) {
                    newMember.list_id = newListId;
                  } else if (member.email_list_uuid !== undefined) {
                    newMember.email_list_uuid = newListId;
                  } else if (member.email_list_id !== undefined) {
                    newMember.email_list_id = newListId;
                  }
                  
                  // Update timestamp - use added_at instead of created_at
                  newMember.added_at = new Date().toISOString();
                  
                  // Remove any fields that don't exist in the table
                  delete newMember.created_at;
                  delete newMember.updated_at;
                  
                  console.log('New member to insert:', newMember);
                  
                  return newMember;
                });

              // Insert all the new members
              console.log('Inserting', newMembers.length, 'new members');
              const { data: insertedMembers, error: insertMembersError } = await supabase
                .from('email_list_members')
                .insert(newMembers)
                .select();

              if (insertMembersError) {
                console.error('Error duplicating email list members:', insertMembersError);
                alert(`Email list duplicated but failed to copy members: ${insertMembersError.message}`);
              } else {
                console.log(`Successfully duplicated ${newMembers.length} members`);
                console.log('Inserted members:', insertedMembers);
              }
            } else {
              console.log('No members found in original list to duplicate');
            }
          } catch (membersErr) {
            console.error('Error copying email list members:', membersErr);
            alert(`Email list duplicated but failed to copy members: ${membersErr.message}`);
          }
        }

        // Add the new duplicate to the local state
        setEmailLists(prev => [newEmailList, ...prev]);
        console.log('Email list duplicated successfully');
      }

    } catch (err) {
      console.error('Error duplicating email list:', err);
      alert(`Error duplicating email list: ${err.message}`);
    }
  };

  const handleDelete = async (listId) => {
    if (!window.confirm('Are you sure you want to delete this email list? This action cannot be undone.')) {
      return;
    }

    try {
      // Try common primary key field names
      let deleteResult;
      
      // First try with list_id
      deleteResult = await supabase
        .from('email_lists')
        .delete()
        .eq('list_id', listId);

      if (deleteResult.error && deleteResult.error.code === '42703') {
        // If list_id doesn't exist, try with email_list_id
        deleteResult = await supabase
          .from('email_lists')
          .delete()
          .eq('email_list_id', listId);
      }

      if (deleteResult.error && deleteResult.error.code === '42703') {
        // If email_list_id doesn't exist, try with uuid
        deleteResult = await supabase
          .from('email_lists')
          .delete()
          .eq('uuid', listId);
      }

      if (deleteResult.error) {
        throw deleteResult.error;
      }

      // Remove the deleted list from the local state using the same identifier
      setEmailLists(prev => prev.filter(list => 
        list.list_id !== listId && 
        list.email_list_id !== listId && 
        list.uuid !== listId &&
        list.id !== listId
      ));
      
      console.log('Email list deleted successfully');
    } catch (err) {
      console.error('Error deleting email list:', err);
      alert(`Error deleting email list: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <FiMail style={{ marginRight: '10px' }} />
            Mailing Lists
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <FiX />
          </CloseButton>
        </ModalHeader>
        
        <ModalContent>
          <HeaderSection>
            <div></div>
            <AddNewButton onClick={handleAddNew}>
              ADD NEW
            </AddNewButton>
          </HeaderSection>
          
          {loading ? (
            <LoadingText>Loading mailing lists...</LoadingText>
          ) : error ? (
            <EmptyState>Error loading lists: {error}</EmptyState>
          ) : emailLists.length === 0 ? (
            <EmptyState>No mailing lists found</EmptyState>
          ) : (
            <ListContainer>
              {emailLists.map((list) => {
                // Use the first available primary key field
                const listId = list.list_id || list.email_list_id || list.uuid || list.id;
                
                return (
                  <ListItem key={listId}>
                    <ListInfo>
                      {list.list_type || 'Unknown'} - {list.name || 'Unnamed List'} - {list.total_contacts || 0} contacts
                    </ListInfo>
                    <ActionButtons>
                      <ActionButton 
                        className="open"
                        onClick={() => handleOpen(listId)}
                      >
                        OPEN
                      </ActionButton>
                      <ActionButton 
                        className="duplicate"
                        onClick={() => handleDuplicate(listId)}
                      >
                        DUPLICATE
                      </ActionButton>
                      <ActionButton 
                        className="delete"
                        onClick={() => handleDelete(listId)}
                      >
                        DELETE
                      </ActionButton>
                    </ActionButtons>
                  </ListItem>
                );
              })}
            </ListContainer>
          )}
        </ModalContent>
      </ModalContainer>
      
      <CreateNewListModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <ViewEmailListModal 
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedEmailList(null);
        }}
        emailList={selectedEmailList}
      />
    </ModalOverlay>
  );
};

export default MailingListsModal; 