import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX, FiMail } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import CreateNewListModal from './CreateNewListModal';

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
    // TODO: Implement open functionality
    console.log('Open list:', listId);
  };

  const handleDuplicate = (listId) => {
    // TODO: Implement duplicate functionality
    console.log('Duplicate list:', listId);
  };

  const handleDelete = (listId) => {
    // TODO: Implement delete functionality
    console.log('Delete list:', listId);
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
              {emailLists.map((list) => (
                <ListItem key={list.id}>
                  <ListInfo>
                    {list.list_type || 'Unknown'} - {list.name || 'Unnamed List'} - {list.contact_count || 0} contacts
                  </ListInfo>
                  <ActionButtons>
                    <ActionButton 
                      className="open"
                      onClick={() => handleOpen(list.id)}
                    >
                      OPEN
                    </ActionButton>
                    <ActionButton 
                      className="duplicate"
                      onClick={() => handleDuplicate(list.id)}
                    >
                      DUPLICATE
                    </ActionButton>
                    <ActionButton 
                      className="delete"
                      onClick={() => handleDelete(list.id)}
                    >
                      DELETE
                    </ActionButton>
                  </ActionButtons>
                </ListItem>
              ))}
            </ListContainer>
          )}
        </ModalContent>
      </ModalContainer>
      
      <CreateNewListModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </ModalOverlay>
  );
};

export default MailingListsModal; 