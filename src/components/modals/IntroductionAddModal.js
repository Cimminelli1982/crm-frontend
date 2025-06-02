import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiUsers, FiBriefcase, FiFileText, FiTag, FiActivity, FiSave } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';

// Setup Modal for React
Modal.setAppElement('#root');

// Modal styles
const modalStyles = {
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'relative',
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    backgroundColor: '#121212',
    border: '1px solid #00ff00',
    borderRadius: '8px',
    padding: '0',
    width: '600px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
  }
};

// Styled components
const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #333;
  background-color: #1a1a1a;
  
  h2 {
    color: #00ff00;
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 18px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  button {
    background: none;
    border: none;
    color: #00ff00;
    cursor: pointer;
    font-size: 20px;
    padding: 4px;
    
    &:hover {
      color: #ffffff;
    }
  }
`;

const ModalContent = styled.div`
  padding: 24px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  color: #00ff00;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  
  svg {
    opacity: 0.8;
  }
`;

const formControlStyles = `
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-radius: 4px;
  color: #ccc;
  padding: 10px 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  font-family: 'Courier New', monospace;
  
  &:focus {
    border-color: #00ff00;
    outline: none;
    box-shadow: 0 0 0 1px rgba(0, 255, 0, 0.3);
  }
  
  &::placeholder {
    color: #555;
  }
`;

const FormInput = styled.input`
  ${formControlStyles}
  height: 42px;
`;

const FormTextarea = styled.textarea`
  ${formControlStyles}
  min-height: 100px;
  resize: vertical;
`;

const FormSelect = styled.select`
  ${formControlStyles}
  height: 42px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2300ff00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  
  option {
    background-color: #1a1a1a;
    color: #ccc;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #333;
`;

const SaveButton = styled.button`
  background-color: rgba(0, 255, 0, 0.1);
  color: #00ff00;
  border: 1px solid #00ff00;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-family: 'Courier New', monospace;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  background-color: transparent;
  color: #666;
  border: 1px solid #666;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-family: 'Courier New', monospace;
  transition: all 0.2s;
  
  &:hover {
    color: #999;
    border-color: #999;
  }
`;

const ErrorMessage = styled.div`
  color: #ff5555;
  font-size: 12px;
  margin-top: 4px;
  font-family: 'Courier New', monospace;
`;

const AutocompleteContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SuggestionsDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #1a1a1a;
  border: 1px solid #00ff00;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 8px rgba(0, 255, 0, 0.2);

  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const SuggestionItem = styled.div`
  padding: 10px 12px;
  color: #ccc;
  cursor: pointer;
  border-bottom: 1px solid #333;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
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
  font-family: 'Courier New', monospace;
  font-size: 14px;
  transition: all 0.2s ease;
  background-color: rgba(0, 255, 0, 0.05);
  font-style: italic;

  &:hover {
    background-color: rgba(0, 255, 0, 0.15);
    color: #00ff00;
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
  font-family: 'Courier New', monospace;
  font-size: 12px;
  text-align: center;
`;

const IntroductionAddModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    peopleIntroduced: '',
    relatedCompanies: '',
    notes: '',
    category: '',
    status: 'Requested'
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
  const [companySearchTimeout, setCompanySearchTimeout] = useState(null);

  // Category options from SimpleIntroductions
  const categoryOptions = [
    'Dealflow',
    'Portfolio Company',
    'Karma Points'
  ];

  // Status options from SimpleIntroductions
  const statusOptions = [
    'Promised',
    'Requested',
    'Done and Dusted',
    'Aborted',
    'Done, but need monitoring'
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        peopleIntroduced: '',
        relatedCompanies: '',
        notes: '',
        category: '',
        status: 'Requested'
      });
      setErrors({});
      setContactSuggestions([]);
      setShowSuggestions(false);
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
    }
  }, [isOpen]);

  // Fetch contact suggestions based on search term
  const fetchContactSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setContactSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      const suggestions = data.map(contact => ({
        id: contact.contact_id,
        name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
        firstName: contact.first_name,
        lastName: contact.last_name,
        isExisting: true
      })).filter(contact => contact.name); // Filter out contacts with no name

      // If no exact matches and searchTerm looks like a name, add "Create new contact" option
      const hasExactMatch = suggestions.some(s => 
        s.name.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (!hasExactMatch && searchTerm.trim() && /^[a-zA-Z\s]+$/.test(searchTerm.trim())) {
        suggestions.push({
          id: 'create-new',
          name: searchTerm.trim(),
          isExisting: false,
          isCreateNew: true
        });
      }

      setContactSuggestions(suggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching contact suggestions:', error);
      setContactSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Fetch company suggestions based on search term
  const fetchCompanySuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('company_id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      const suggestions = data.map(company => ({
        id: company.company_id,
        name: company.name,
        isExisting: true
      })).filter(company => company.name); // Filter out companies with no name

      // If no exact matches and searchTerm looks like a company name, add "Create new company" option
      const hasExactMatch = suggestions.some(s => 
        s.name.toLowerCase() === searchTerm.toLowerCase()
      );
      
      if (!hasExactMatch && searchTerm.trim() && searchTerm.trim().length >= 2) {
        suggestions.push({
          id: 'create-new-company',
          name: searchTerm.trim(),
          isExisting: false,
          isCreateNew: true
        });
      }

      setCompanySuggestions(suggestions);
      setShowCompanySuggestions(true);
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
      setCompanySuggestions([]);
      setShowCompanySuggestions(false);
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

  // Create new company in database
  const createNewCompany = async (companyName) => {
    try {
      const companyData = {
        name: companyName.trim(),
        created_at: new Date().toISOString(),
        category: 'Inbox' // Default category
      };

      const { data, error } = await supabase
        .from('companies')
        .insert([companyData])
        .select('company_id, name')
        .single();

      if (error) throw error;

      toast.success(`New company "${companyName}" created successfully!`);
      
      return {
        id: data.company_id,
        name: data.name,
        isExisting: true
      };
    } catch (error) {
      console.error('Error creating new company:', error);
      toast.error(`Failed to create company: ${error.message}`);
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

    // Handle contact suggestions for peopleIntroduced field
    if (name === 'peopleIntroduced') {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set new timeout to debounce search
      const newTimeout = setTimeout(() => {
        const lines = value.split('\n');
        const currentLine = lines[lines.length - 1];
        const words = currentLine.split(/[,\s]+/);
        const lastWord = words[words.length - 1];
        
        fetchContactSuggestions(lastWord);
      }, 300);

      setSearchTimeout(newTimeout);
    }

    // Handle company suggestions for relatedCompanies field
    if (name === 'relatedCompanies') {
      // Clear existing timeout
      if (companySearchTimeout) {
        clearTimeout(companySearchTimeout);
      }

      // Set new timeout to debounce search
      const newTimeout = setTimeout(() => {
        const words = value.split(/[,\s]+/);
        const lastWord = words[words.length - 1];
        
        fetchCompanySuggestions(lastWord);
      }, 300);

      setCompanySearchTimeout(newTimeout);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = async (suggestion) => {
    const currentValue = formData.peopleIntroduced;
    const lines = currentValue.split('\n');
    const currentLine = lines[lines.length - 1];
    const words = currentLine.split(/([,\s]+)/); // Keep separators
    
    let finalSuggestion = suggestion;
    
    // If this is a "create new contact" suggestion, create the contact first
    if (suggestion.isCreateNew) {
      const newContact = await createNewContact(suggestion.name);
      if (newContact) {
        finalSuggestion = newContact;
      } else {
        // If creation failed, still use the name but don't treat it as a contact
        finalSuggestion = suggestion;
      }
    }
    
    // Replace the last word with the selected suggestion
    if (words.length > 0) {
      words[words.length - 1] = finalSuggestion.name;
    }
    
    lines[lines.length - 1] = words.join('');
    const newValue = lines.join('\n');
    
    setFormData(prev => ({
      ...prev,
      peopleIntroduced: newValue
    }));
    
    setShowSuggestions(false);
    setContactSuggestions([]);
  };

  // Handle company suggestion selection
  const handleCompanySuggestionClick = async (suggestion) => {
    const currentValue = formData.relatedCompanies;
    const words = currentValue.split(/([,\s]+)/); // Keep separators
    
    let finalSuggestion = suggestion;
    
    // If this is a "create new company" suggestion, create the company first
    if (suggestion.isCreateNew) {
      const newCompany = await createNewCompany(suggestion.name);
      if (newCompany) {
        finalSuggestion = newCompany;
      } else {
        // If creation failed, still use the name but don't treat it as a company
        finalSuggestion = suggestion;
      }
    }
    
    // Replace the last word with the selected suggestion
    if (words.length > 0) {
      words[words.length - 1] = finalSuggestion.name;
    }
    
    const newValue = words.join('');
    
    setFormData(prev => ({
      ...prev,
      relatedCompanies: newValue
    }));
    
    setShowCompanySuggestions(false);
    setCompanySuggestions([]);
  };

  // Handle clicking outside suggestions
  const handleFieldBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  // Handle clicking outside company suggestions
  const handleCompanyFieldBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowCompanySuggestions(false);
    }, 150);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      if (companySearchTimeout) {
        clearTimeout(companySearchTimeout);
      }
    };
  }, [searchTimeout, companySearchTimeout]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.peopleIntroduced.trim()) {
      newErrors.peopleIntroduced = 'People introduced is required';
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
      // For now, we'll create a basic introduction record
      // Note: This assumes the database schema - you may need to adjust based on actual schema
      const introductionData = {
        text: formData.notes,
        category: formData.category,
        status: formData.status,
        introduction_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
        // TODO: Handle contact_ids and company relationships properly
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

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={modalStyles}
      contentLabel="Add New Introduction"
    >
      <ModalHeader>
        <h2>
          <FiUsers />
          Add New Introduction
        </h2>
        <button onClick={handleClose} disabled={saving}>
          <FiX />
        </button>
      </ModalHeader>
      
      <ModalContent>
        <FormContainer>
          <FormGroup>
            <FormLabel>
              <FiUsers />
              People Introduced *
            </FormLabel>
            <AutocompleteContainer>
              <FormTextarea
                name="peopleIntroduced"
                value={formData.peopleIntroduced}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                onFocus={() => {
                  // Re-trigger search if there's existing text
                  if (formData.peopleIntroduced) {
                    const lines = formData.peopleIntroduced.split('\n');
                    const currentLine = lines[lines.length - 1];
                    const words = currentLine.split(/[,\s]+/);
                    const lastWord = words[words.length - 1];
                    if (lastWord.length >= 2) {
                      fetchContactSuggestions(lastWord);
                    }
                  }
                }}
                placeholder="Start typing names to see suggestions..."
                rows={3}
              />
              {showSuggestions && (
                <SuggestionsDropdown>
                  {contactSuggestions.length > 0 ? (
                    contactSuggestions.map((suggestion) => {
                      if (suggestion.isCreateNew) {
                        return (
                          <CreateContactSuggestion
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            Create new contact: {suggestion.name}
                          </CreateContactSuggestion>
                        );
                      } else {
                        return (
                          <SuggestionItem
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion.name}
                          </SuggestionItem>
                        );
                      }
                    })
                  ) : (
                    <NoSuggestions>No contacts found</NoSuggestions>
                  )}
                </SuggestionsDropdown>
              )}
            </AutocompleteContainer>
            {errors.peopleIntroduced && (
              <ErrorMessage>{errors.peopleIntroduced}</ErrorMessage>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <FiBriefcase />
              Related Companies
            </FormLabel>
            <AutocompleteContainer>
              <FormInput
                name="relatedCompanies"
                value={formData.relatedCompanies}
                onChange={handleInputChange}
                onBlur={handleCompanyFieldBlur}
                onFocus={() => {
                  // Re-trigger search if there's existing text
                  if (formData.relatedCompanies) {
                    const words = formData.relatedCompanies.split(/[,\s]+/);
                    const lastWord = words[words.length - 1];
                    if (lastWord.length >= 2) {
                      fetchCompanySuggestions(lastWord);
                    }
                  }
                }}
                placeholder="Start typing company names to see suggestions..."
              />
              {showCompanySuggestions && (
                <SuggestionsDropdown>
                  {companySuggestions.length > 0 ? (
                    companySuggestions.map((suggestion) => {
                      if (suggestion.isCreateNew) {
                        return (
                          <CreateContactSuggestion
                            key={suggestion.id}
                            onClick={() => handleCompanySuggestionClick(suggestion)}
                          >
                            Create new company: {suggestion.name}
                          </CreateContactSuggestion>
                        );
                      } else {
                        return (
                          <SuggestionItem
                            key={suggestion.id}
                            onClick={() => handleCompanySuggestionClick(suggestion)}
                          >
                            {suggestion.name}
                          </SuggestionItem>
                        );
                      }
                    })
                  ) : (
                    <NoSuggestions>No companies found</NoSuggestions>
                  )}
                </SuggestionsDropdown>
              )}
            </AutocompleteContainer>
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <FiFileText />
              Notes
            </FormLabel>
            <FormTextarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter introduction notes..."
              rows={4}
            />
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <FiTag />
              Category *
            </FormLabel>
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
          </FormGroup>

          <FormGroup>
            <FormLabel>
              <FiActivity />
              Status
            </FormLabel>
            <FormSelect
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              {statusOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </FormSelect>
          </FormGroup>
        </FormContainer>

        <ButtonContainer>
          <CancelButton onClick={handleClose} disabled={saving}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSave} disabled={saving}>
            <FiSave />
            {saving ? 'Saving...' : 'Save Introduction'}
          </SaveButton>
        </ButtonContainer>
      </ModalContent>
    </Modal>
  );
};

export default IntroductionAddModal; 