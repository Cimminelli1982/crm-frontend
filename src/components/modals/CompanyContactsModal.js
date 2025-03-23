import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiSearch, FiUser } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import styled from 'styled-components';

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #111827;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #1f2937;
      background-color: #f3f4f6;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 12px;
`;

const ContactsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const ContactBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: #4b5563;
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }

  button {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: inherit;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 1;
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
  width: 90%;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SuggestionsContainer = styled.div`
  position: relative;
  margin-top: 5px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: #f3f4f6;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;

  &.success {
    background-color: #d1fae5;
    color: #065f46;
  }

  &.error {
    background-color: #fee2e2;
    color: #b91c1c;
  }
  
  &.info {
    background-color: #e0f2fe;
    color: #0369a1;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background-color: black;
    color: white;
    border: none;

    &:hover {
      background-color: #333;
    }
  }

  &.secondary {
    background-color: white;
    color: #4b5563;
    border: 1px solid #d1d5db;

    &:hover {
      background-color: #f9fafb;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const formatContactName = (contact) => {
  if (!contact) return "";
  return `${contact.first_name || ""} ${contact.last_name || ""}`.trim();
};

const CompanyContactsModal = ({ isOpen, onRequestClose, company, onContactClick }) => {
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch related contacts for the company
  const fetchRelatedContacts = async () => {
    try {
      console.log('Fetching related contacts for company ID:', company.id);
      
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          contact_id,
          contacts:contact_id(id, first_name, last_name, email)
        `)
        .eq('company_id', company.id);

      if (error) throw error;

      const contacts = data.map(item => ({
        id: item.contact_id,
        first_name: item.contacts.first_name,
        last_name: item.contacts.last_name,
        email: item.contacts.email
      }));

      console.log('Fetched contacts:', contacts);
      setRelatedContacts(contacts);
    } catch (error) {
      console.error('Error fetching related contacts:', error);
      setMessage({ type: 'error', text: 'Failed to load contacts' });
    }
  };

  // Fetch contact suggestions based on search term
  const fetchContactSuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out contacts that are already connected
      const filteredSuggestions = data.filter(contact => 
        !relatedContacts.some(related => related.id === contact.id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching contact suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && company) {
      fetchRelatedContacts();
    }
  }, [isOpen, company]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchContactSuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleUnlinkContact = async (contactToRemove) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('company_id', company.id)
        .eq('contact_id', contactToRemove.id);

      if (error) throw error;
      
      setRelatedContacts(relatedContacts.filter(contact => contact.id !== contactToRemove.id));
      setMessage({ type: 'success', text: 'Contact unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking contact:', error);
      setMessage({ type: 'error', text: 'Failed to unlink contact' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (contactToAdd) => {
    try {
      setLoading(true);
      console.log('Adding contact:', contactToAdd);
      console.log('Company:', company);
      
      // Ensure company.id is treated as an integer if needed
      const companyId = parseInt(company.id, 10);
      if (isNaN(companyId)) {
        throw new Error('Invalid company ID');
      }
      
      // Check if already associated
      const { data: existingCheck, error: checkError } = await supabase
        .from('contact_companies')
        .select('company_id, contact_id')
        .eq('company_id', companyId)
        .eq('contact_id', contactToAdd.id);
        
      if (checkError) {
        console.error('Error checking existing contact association:', checkError);
        throw checkError;
      }
      
      console.log('Existing check result:', existingCheck);
      
      if (existingCheck && existingCheck.length > 0) {
        console.log('Contact already linked:', existingCheck);
        setMessage({ type: 'info', text: 'This contact is already linked to the company' });
        return;
      }
      
      const newAssociation = {
        company_id: companyId,
        contact_id: contactToAdd.id,
        created_at: new Date().toISOString()
      };
      console.log('Creating new association:', newAssociation);
      
      const { data, error } = await supabase
        .from('contact_companies')
        .insert(newAssociation)
        .select();

      if (error) {
        console.error('Error inserting contact association:', error);
        throw error;
      }

      console.log('Successfully added contact:', data);
      await fetchRelatedContacts();
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'Contact linked successfully' });
    } catch (error) {
      console.error('Error linking contact:', error);
      setMessage({ type: 'error', text: `Failed to link contact: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

  const handleContactClick = async (contactId) => {
    if (contactId) {
      try {
        // Get full contact details
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', contactId)
          .single();
          
        if (error) throw error;
        
        // Close this modal
        onRequestClose();
        
        // Open the contact modal via window event
        window.dispatchEvent(new CustomEvent('openContactModal', { detail: data }));
      } catch (error) {
        console.error('Error fetching contact details:', error);
      }
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
          padding: '20px',
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '500px',
          width: '90%',
          minHeight: '360px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Manage Company Contacts</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <Section>
          <SectionTitle>Company Contacts</SectionTitle>
          <ContactsList>
            {relatedContacts.map(contact => (
              <ContactBadge 
                key={contact.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleContactClick(contact.id)}
              >
                <span title={formatContactName(contact)}>{formatContactName(contact)}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlinkContact(contact);
                  }}
                  disabled={loading}
                  title="Unlink contact"
                >
                  <FiX size={14} />
                </button>
              </ContactBadge>
            ))}
            {relatedContacts.length === 0 && (
              <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                No contacts linked
              </span>
            )}
          </ContactsList>
        </Section>

        <Section>
          <SectionTitle>Add Contacts</SectionTitle>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={16} />
            </SearchIcon>
            <SearchInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a contact (name or email)..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.id}
                  onClick={() => handleAddContact(suggestion)}
                  disabled={loading}
                >
                  {formatContactName(suggestion)}
                  {suggestion.email && <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{suggestion.email}</span>}
                </SuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <div style={{ padding: '8px 12px', color: '#6c757d', fontSize: '0.875rem' }}>
                  No contacts found
                </div>
              )}
            </SuggestionsContainer>
          )}
        </Section>

        {message.text && (
          <Message className={message.type}>
            {message.text}
          </Message>
        )}

        <ButtonGroup>
          <Button className="primary" onClick={onRequestClose}>
            Done
          </Button>
        </ButtonGroup>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div className="spinner" style={{ 
              width: '20px', 
              height: '20px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #000000', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CompanyContactsModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);