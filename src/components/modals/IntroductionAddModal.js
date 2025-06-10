import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiUsers, FiBriefcase, FiFileText, FiTag, FiActivity, FiSave, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';

// Setup Modal for React
Modal.setAppElement('#root');

// Styled components matching TagsModal
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #00ff00;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ffffff;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #ff5555;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #00ff00;
  display: flex;
  align-items: center;
  gap: 6px;
  
  svg {
    opacity: 0.8;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  color: #eee;
  background-color: #222;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:hover {
    background-color: #333;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  color: #eee;
  background-color: #222;
  min-height: 100px;
  resize: vertical;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:hover {
    background-color: #333;
  }
  
  &::placeholder {
    color: #666;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  color: #eee;
  background-color: #222;
  box-sizing: border-box;
  cursor: pointer;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:hover {
    background-color: #333;
  }
  
  option {
    background-color: #222;
    color: #eee;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 8px;
  width: 100%;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const SuggestionsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #222;
  border: 1px solid #444;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  width: 100%;

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #333;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const SuggestionItem = styled.div`
  padding: 10px 12px;
  color: #eee;
  cursor: pointer;
  border-bottom: 1px solid #333;
  font-size: 14px;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    background-color: #333;
    color: #00ff00;
  }

  &:last-child {
    border-bottom: none;
  }
`;

const CreateContactSuggestion = styled.div`
  padding: 10px 12px;
  color: #00ff00;
  cursor: pointer;
  border-bottom: 1px solid #333;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: rgba(0, 255, 0, 0.05);
  font-style: italic;
  width: 100%;
  box-sizing: border-box;

  &:hover {
    background-color: rgba(0, 255, 0, 0.15);
  }

  &:last-child {
    border-bottom: none;
  }

  &:before {
    content: "✨ ";
    margin-right: 4px;
  }
`;

const NoSuggestions = styled.div`
  padding: 10px 12px;
  color: #666;
  font-style: italic;
  font-size: 12px;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #333;
`;

const Button = styled.button`
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.primary {
    background-color: #00ff00;
    color: black;
    border: none;
    
    &:hover {
      background-color: #00dd00;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: #ccc;
    border: 1px solid #555;
    
    &:hover {
      background-color: #333;
    }
  }
`;

const ErrorMessage = styled.div`
  color: #ff5555;
  font-size: 12px;
  margin-top: 4px;
`;

const Message = styled.div`
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 12px;
  
  &.success {
    background-color: rgba(0, 255, 0, 0.1);
    color: #00ff00;
  }
  
  &.error {
    background-color: rgba(255, 70, 70, 0.2);
    color: #ff9999;
  }
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const Tag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 4px;
  background-color: ${props => props.color || '#222'};
  color: ${props => props.textColor || '#00ff00'};
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid #00ff00;
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
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 0.25rem;
    color: #00ff00;
    cursor: pointer;
    
    &:hover { 
      color: #ff5555; 
    }
  }
`;

const IntroductionAddModal = ({ isOpen, onClose, onSave, preselectedContact }) => {
  const [formData, setFormData] = useState({
    notes: '',
    category: '',
    status: 'Requested'
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track selected contacts separately like TagsModal tracks currentTags
  const [selectedContacts, setSelectedContacts] = useState([]);

  // Category options from SimpleIntroductions
  const categoryOptions = [
    'Dealflow',
    'Portfolio Company',
    'Karma Points'
  ];

  // Status options from SimpleIntroductions - updated to match database enum
  const statusOptions = [
    'Promised',
    'Requested',
    'Done & Dust',
    'Aborted',
    'Done, but need to monitor'
  ];

  // Reset form when modal opens/closes and handle preselected contact
  useEffect(() => {
    if (isOpen) {
      setFormData({
        notes: '',
        category: '',
        status: 'Requested'
      });
      setErrors({});
      setContactSuggestions([]);
      setShowSuggestions(false);
      setSearchTerm('');
      
      // If there's a preselected contact, add it to selectedContacts
      if (preselectedContact) {
        const formattedContact = {
          id: preselectedContact.contact_id,
          name: `${preselectedContact.first_name || ''} ${preselectedContact.last_name || ''}`.trim(),
          firstName: preselectedContact.first_name,
          lastName: preselectedContact.last_name,
          isExisting: true
        };
        setSelectedContacts([formattedContact]);
      } else {
        setSelectedContacts([]);
      }
    }
  }, [isOpen, preselectedContact]);

  // Handle contact search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    console.log('Search term changed:', value); // Debug log

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout to debounce search
    const newTimeout = setTimeout(() => {
      console.log('Triggering search for:', value); // Debug log
      fetchContactSuggestions(value);
    }, 300);

    setSearchTimeout(newTimeout);
  };

  // Fetch contact suggestions based on search term
  const fetchContactSuggestions = async (searchTerm) => {
    console.log('fetchContactSuggestions called with:', searchTerm); // Debug log
    
    if (!searchTerm || searchTerm.length < 2) {
      console.log('Search term too short, clearing suggestions'); // Debug log
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      console.log('Fetching contacts from database...'); // Debug log
      
      // For full name searches, we need to search across concatenated names
      // as well as individual first/last name fields
      const searchTermLower = searchTerm.toLowerCase().trim();
      const searchParts = searchTermLower.split(/\s+/).filter(part => part.length > 0);
      
      let query = supabase
        .from('contacts')
        .select('contact_id, first_name, last_name');

      if (searchParts.length === 1) {
        // Single word search - search in both first and last name
        query = query.or(`first_name.ilike.%${searchTermLower}%,last_name.ilike.%${searchTermLower}%`);
      } else if (searchParts.length === 2) {
        // Two words - likely first and last name
        const [firstPart, lastPart] = searchParts;
        query = query.or(`and(first_name.ilike.%${firstPart}%,last_name.ilike.%${lastPart}%),and(first_name.ilike.%${lastPart}%,last_name.ilike.%${firstPart}%),first_name.ilike.%${searchTermLower}%,last_name.ilike.%${searchTermLower}%`);
      } else {
        // Multiple words - search each part in first/last names and full search term
        const firstPart = searchParts[0];
        const lastPart = searchParts[searchParts.length - 1];
        query = query.or(`and(first_name.ilike.%${firstPart}%,last_name.ilike.%${lastPart}%),first_name.ilike.%${searchTermLower}%,last_name.ilike.%${searchTermLower}%`);
      }
      
      const { data, error } = await query.limit(10);

      if (error) throw error;

      console.log('Raw contact data from DB:', data); // Debug log

      const suggestions = data.map(contact => ({
        id: contact.contact_id,
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        firstName: contact.first_name,
        lastName: contact.last_name,
        isExisting: true
      })).filter(contact => contact.name); // Filter out contacts with no name

      console.log('Processed suggestions:', suggestions); // Debug log

      // Filter out contacts that are already selected
      const filteredSuggestions = suggestions.filter(suggestion => 
        !selectedContacts.some(selected => selected.id === suggestion.id)
      );

      console.log('Filtered suggestions (after removing selected):', filteredSuggestions); // Debug log

      // If no exact matches and searchTerm looks like a name, add "Create new contact" option
      const hasExactMatch = filteredSuggestions.some(s => 
        s.name.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (!hasExactMatch && searchTerm.trim() && /^[a-zA-Z\s]+$/.test(searchTerm.trim())) {
        filteredSuggestions.push({
          id: 'create-new',
          name: searchTerm.trim(),
          isExisting: false,
          isCreateNew: true
        });
        console.log('Added create new contact option'); // Debug log
      }

      console.log('Final suggestions:', filteredSuggestions); // Debug log
      setContactSuggestions(filteredSuggestions);
      setShowSuggestions(true);
      console.log('showSuggestions set to true'); // Debug log
    } catch (error) {
      console.error('Error fetching contact suggestions:', error);
      setContactSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Create new contact in database
  const createNewContact = async (fullName) => {
    try {
      // Parse the full name into first and last name
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      const contactData = {
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        category: 'Inbox' // Default category
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert([contactData])
        .select('contact_id, first_name, last_name')
        .single();

      if (error) throw error;

      toast.success(`New contact "${fullName}" created successfully!`);
      
      return {
        id: data.contact_id,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        firstName: data.first_name,
        lastName: data.last_name,
        isExisting: true
      };
    } catch (error) {
      console.error('Error creating new contact:', error);
      toast.error(`Failed to create contact: ${error.message}`);
      return null;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle adding a contact (similar to handleAddTag in TagsModal)
  const handleAddContact = async (contactToAdd) => {
    try {
      let finalContact = contactToAdd;
      
      // If this is a "create new contact" suggestion, create the contact first
      if (contactToAdd.isCreateNew) {
        const newContact = await createNewContact(contactToAdd.name);
        if (newContact) {
          finalContact = newContact;
        } else {
          return; // Failed to create contact
        }
      }
      
      // Add to selected contacts
      setSelectedContacts(prev => [...prev, finalContact]);
      
      // Clear search
      setSearchTerm('');
      setShowSuggestions(false);
      setContactSuggestions([]);
      
      toast.success(`Contact "${finalContact.name}" added`);
      
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error(`Failed to add contact: ${error.message}`);
    }
  };

  // Handle removing a contact (similar to handleRemoveTag in TagsModal)
  const handleRemoveContact = (contactToRemove) => {
    setSelectedContacts(prev => 
      prev.filter(contact => contact.id !== contactToRemove.id)
    );
    toast.success(`Contact "${contactToRemove.name}" removed`);
  };

  // Handle creating a new contact from search term
  const handleCreateContact = async () => {
    if (!searchTerm.trim()) return;

    await handleAddContact({
      id: 'create-new',
      name: searchTerm.trim(),
      isCreateNew: true
    });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Handle search focus/blur
  const handleSearchFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (selectedContacts.length === 0) {
      newErrors.selectedContacts = 'At least one contact is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      // Prepare the introduction data with all required fields
      const introductionData = {
        text: formData.notes || '',
        category: formData.category,
        status: formData.status,
        introduction_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        contact_ids: selectedContacts.map(contact => contact.id),
        introduction_tool: 'email'
      };

      const { data, error } = await supabase
        .from('introductions')
        .insert([introductionData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Introduction added successfully!');
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(data);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Error saving introduction:', error);
      toast.error(`Failed to save introduction: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          padding: '20px',
          border: '1px solid #333',
          backgroundColor: '#121212',
          color: '#e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>
            <FiUsers />
            Add New Introduction
          </h2>
          <button onClick={onClose} disabled={saving}>
            <FiX size={20} />
          </button>
        </ModalHeader>
        
        <Section>
          <SectionTitle>
            <FiUsers />
            Selected Contacts *
          </SectionTitle>
          <TagsList>
            {selectedContacts.map(contact => (
              <Tag 
                key={contact.id} 
                color="#222"
                textColor="#00ff00"
              >
                <span title={contact.name}>{contact.name.length > 25 ? `${contact.name.substring(0, 25)}...` : contact.name}</span>
                <button 
                  onClick={() => handleRemoveContact(contact)}
                  disabled={saving}
                >
                  <FiX size={14} />
                </button>
              </Tag>
            ))}
            {selectedContacts.length === 0 && (
              <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                No contacts selected
              </span>
            )}
          </TagsList>
          {errors.selectedContacts && (
            <ErrorMessage>{errors.selectedContacts}</ErrorMessage>
          )}
        </Section>

        <Section>
          <SectionTitle>
            <FiSearch />
            Add Contacts
          </SectionTitle>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={16} />
            </SearchIcon>
            <FormInput
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              placeholder="Search or create new contact..."
              style={{ paddingLeft: '36px' }}
            />
            
            {showSuggestions && (
              <SuggestionsDropdown>
                {contactSuggestions.length > 0 ? (
                  contactSuggestions.map(suggestion => {
                    if (suggestion.isCreateNew) {
                      return (
                        <CreateContactSuggestion
                          key={suggestion.id}
                          onClick={() => handleAddContact(suggestion)}
                        >
                          Create new contact: {suggestion.name}
                        </CreateContactSuggestion>
                      );
                    } else {
                      return (
                        <SuggestionItem
                          key={suggestion.id}
                          onClick={() => handleAddContact(suggestion)}
                        >
                          {suggestion.name}
                        </SuggestionItem>
                      );
                    }
                  })
                ) : searchTerm.length >= 2 ? (
                  <NoSuggestions>No contacts found</NoSuggestions>
                ) : null}
              </SuggestionsDropdown>
            )}
          </SearchContainer>
          
          {/* Debug information */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
              Debug: searchTerm="{searchTerm}", showSuggestions={showSuggestions.toString()}, 
              suggestions={contactSuggestions.length}, selected={selectedContacts.length}
            </div>
          )}
        </Section>

        <Section>
          <SectionTitle>
            <FiFileText />
            Notes
          </SectionTitle>
          <FormTextarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Enter introduction notes..."
            rows={4}
          />
        </Section>

        <Section>
          <SectionTitle>
            <FiTag />
            Category *
          </SectionTitle>
          <FormSelect
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">Select category...</option>
            {categoryOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </FormSelect>
          {errors.category && (
            <ErrorMessage>{errors.category}</ErrorMessage>
          )}
        </Section>

        <Section>
          <SectionTitle>
            <FiActivity />
            Status
          </SectionTitle>
          <FormSelect
            name="status"
            value={formData.status}
            onChange={handleInputChange}
          >
            {statusOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </FormSelect>
        </Section>

        <ButtonGroup>
          <Button className="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button className="primary" onClick={handleSave} disabled={saving}>
            <FiSave />
            {saving ? 'Saving...' : 'Save Introduction'}
          </Button>
        </ButtonGroup>

        {saving && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div className="spinner" style={{ 
              width: '20px', 
              height: '20px', 
              border: '3px solid #222', 
              borderTop: '3px solid #00ff00', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default IntroductionAddModal;

// Add CSS for spinner matching TagsModal
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 