import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSearch, FiCheck } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const ModalContainer = styled.div`
  padding: 16px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  width: 100%;
  
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
  width: 100%;
  box-sizing: border-box;
  
  input {
    width: 100%;
    padding: 8px 12px 8px 36px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
    box-sizing: border-box;
    
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
  max-height: 370px;
  overflow-y: auto;
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 4px;
  width: 100%;
  box-sizing: border-box;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.7);
    border-radius: 4px;
    border: 2px solid #f1f1f1;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.9);
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
    width: 16px;
    height: 16px;
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    margin-right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: all 0.2s;
    flex-shrink: 0;
    
    &.checked {
      background-color: #2563eb;
      border-color: #2563eb;
    }
  }
  
  .contact-info {
    flex: 1;
    overflow: hidden;
    
    .name {
      font-size: 0.875rem;
      color: #111827;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .company {
      font-size: 0.75rem;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

const NoResults = styled.div`
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-size: 0.875rem;
  width: 100%;
  box-sizing: border-box;
  border: 1px dashed #e5e7eb;
  border-radius: 8px;
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
  
  // Function to search contacts when user types 3+ characters
  const searchContacts = async (searchText) => {
    if (!searchText || searchText.length < 3) {
      setContacts([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Searching for:', searchText);
      
      // Simple approach that works more reliably
      // First try first_name
      const { data: firstNameData, error: firstNameError } = await supabase
        .from('contacts')
        .select('*')
        .ilike('first_name', `%${searchText}%`)
        .not('contact_category', 'eq', 'Skip')
        .limit(20);
      
      if (firstNameError) {
        console.error('First name search error:', firstNameError);
        throw firstNameError;
      }
      
      // Then try last_name
      const { data: lastNameData, error: lastNameError } = await supabase
        .from('contacts')
        .select('*')
        .ilike('last_name', `%${searchText}%`)
        .not('contact_category', 'eq', 'Skip')
        .limit(20);
      
      if (lastNameError) {
        console.error('Last name search error:', lastNameError);
        throw lastNameError;
      }
      
      // Combine the results
      const combinedData = [...firstNameData];
      
      // Add last name matches that aren't already in the results
      lastNameData.forEach(contact => {
        if (!combinedData.some(c => c.id === contact.id)) {
          combinedData.push(contact);
        }
      });
      
      const data = combinedData;
      
      console.log('Raw search results:', data);
      
      // Map the results to our UI format
      const formattedContacts = data.map(contact => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name || ''}`,
        company: contact.company_name || ''
      }));
      
      setContacts(formattedContacts);
      console.log('Formatted contacts:', formattedContacts);
    } catch (error) {
      console.error('Error searching contacts:', error);
      toast.error('Failed to search contacts');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchContacts = () => {
    // Initial state - not loading anything until search
    setLoading(false);
    setContacts([]);
  };
  
  const handleContactSelect = async (contact) => {
    try {
      await onAddAttendee(contact.id);
      onRequestClose();
    } catch (error) {
      console.error('Error selecting contact:', error);
    }
  };
  
  // Trigger search when the search term changes
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.length >= 3) {
        searchContacts(searchTerm);
      } else {
        setContacts([]);
      }
    }, 300); // Debounce search for better performance
    
    return () => clearTimeout(delaySearch);
  }, [searchTerm]);
  
  // Only show contacts list if search term has at least 3 characters
  const showContactsList = searchTerm.length >= 3;
  
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
          width: '350px',
          maxWidth: '95%',
          maxHeight: '500px',
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
            placeholder="Search by name or surname (min 3 chars)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </SearchInput>
        
        {showContactsList ? (
          <ContactsList>
            {loading ? (
              <NoResults>Loading contacts...</NoResults>
            ) : contacts.length === 0 ? (
              <NoResults>No contacts found</NoResults>
            ) : (
              contacts.map(contact => (
                <ContactItem
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                >
                  <div className={`checkbox ${selectedContacts.includes(contact.id) ? 'checked' : ''}`}>
                    {selectedContacts.includes(contact.id) && <FiCheck size={12} />}
                  </div>
                  <div className="contact-info">
                    <div className="name">{contact.name}</div>
                    {contact.company && <div className="company">{contact.company}</div>}
                  </div>
                </ContactItem>
              ))
            )}
          </ContactsList>
        ) : (
          <NoResults>Type at least 3 characters to search</NoResults>
        )}
      </ModalContainer>
    </Modal>
  );
};

export default AttendeesModal; 