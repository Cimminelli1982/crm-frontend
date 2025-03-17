import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const ModalContainer = styled.div`
  padding: 24px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  
  h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #111827;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
`;

const SearchInput = styled.div`
  position: relative;
  margin-bottom: 16px;
  
  input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    
    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
    }
  }
  
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
`;

const ContactsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 3px;
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  .checkbox {
    width: 18px;
    height: 18px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.2s;
    
    &.checked {
      background-color: #2563eb;
      border-color: #2563eb;
    }
  }
  
  .contact-info {
    flex: 1;
    
    .name {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 500;
    }
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 24px;
  color: #6b7280;
  font-size: 0.875rem;
`;

const AttendeesModal = ({ isOpen, onRequestClose, meeting, onAddAttendee }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen]);
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('first_name');
        
      if (error) throw error;
      
      setContacts(data.map(contact => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`
      })));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };
  
  const handleContactSelect = async (contact) => {
    try {
      await onAddAttendee(contact.id);
      onRequestClose();
    } catch (error) {
      console.error('Error selecting contact:', error);
    }
  };
  
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
          padding: 0,
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '500px',
          maxWidth: '95%',
          maxHeight: '90vh',
          overflow: 'hidden'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <ModalContainer>
        <ModalHeader>
          <h2>Add Attendees</h2>
          <CloseButton onClick={onRequestClose}>
            <FiX size={20} />
          </CloseButton>
        </ModalHeader>
        
        <SearchInput>
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchInput>
        
        <ContactsList>
          {loading ? (
            <NoResults>Loading contacts...</NoResults>
          ) : filteredContacts.length === 0 ? (
            <NoResults>No contacts found</NoResults>
          ) : (
            filteredContacts.map(contact => (
              <ContactItem
                key={contact.id}
                onClick={() => handleContactSelect(contact)}
              >
                <div className={`checkbox ${selectedContacts.includes(contact.id) ? 'checked' : ''}`}>
                  {selectedContacts.includes(contact.id) && <FiCheck size={12} />}
                </div>
                <div className="contact-info">
                  <div className="name">{contact.name}</div>
                </div>
              </ContactItem>
            ))
          )}
        </ContactsList>
      </ModalContainer>
    </Modal>
  );
};

export default AttendeesModal; 