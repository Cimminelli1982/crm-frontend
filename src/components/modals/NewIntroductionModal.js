import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiX, FiSave, FiSearch, FiFilter, FiInfo, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

// Modal styles
const modalStyle = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '0',
    border: 'none',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    width: '800px',
    maxWidth: '95%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000
  }
};

// Container with consistent padding
const Container = styled.div`
  padding: 28px;
  box-sizing: border-box;
`;

// Styled header with bottom border
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #111827;
  }
`;

// Close button styling
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
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
    color: #1f2937;
  }
`;

// Scrollable content area
const Content = styled.div`
  max-height: calc(90vh - 180px);
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 16px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(200, 200, 200, 0.5);
    border-radius: 10px;
  }
`;

// Two-column layout
const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  box-sizing: border-box;
`;

// Form group container
const FormGroup = styled.div`
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
`;

// Form field label
const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

// Date input field
const DateInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

// Select dropdown
const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

// Textarea for notes
const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #111827;
  min-height: 120px;
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
  }
`;

// Search row with filter button
const SearchRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16px;
`;

// Search input container
const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
`;

// Search icon positioning
const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

// Search input field
const SearchInput = styled.input`
  width: 100%;
  padding: 10px 10px 10px 36px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Filter toggle button
const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: ${props => props.active ? '#e0f2fe' : 'white'};
  color: ${props => props.active ? '#0369a1' : '#6b7280'};
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: ${props => props.active ? '#bae6fd' : '#f3f4f6'};
  }
`;

// Filter options panel
const FilterOptions = styled.div`
  display: ${props => props.visible ? 'block' : 'none'};
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  width: 100%;
  box-sizing: border-box;
`;

// Filter section group
const FilterGroup = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 8px;
    display: block;
  }
`;

// Checkbox options container
const CheckboxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  margin-top: 8px;
`;

// Individual checkbox option
const CheckboxOption = styled.label`
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
  color: #4b5563;
  cursor: pointer;
  
  input {
    margin-right: 6px;
  }
`;

// Contact suggestions dropdown
const SuggestionsContainer = styled.div`
  position: relative;
  margin-top: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 100%;
  box-sizing: border-box;
`;

// Individual suggestion item
const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;

  &:hover {
    background-color: #f3f4f6;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }
`;

// Selected contacts list
const ContactsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

// Individual contact tag
const ContactTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background-color: #e5e7eb;
  color: #374151;
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;

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

// Introduction history container
const IntroHistoryContainer = styled.div`
  margin-top: 16px;
  background-color: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 16px;
  width: 100%;
  box-sizing: border-box;
`;

// History header
const IntroHistoryHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

// History items list
const IntroHistoryList = styled.div`
  max-height: 180px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: rgba(200, 200, 200, 0.5);
    border-radius: 10px;
  }
`;

// Individual history item
const IntroHistoryItem = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8125rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  .intro-date {
    color: #6b7280;
    font-size: 0.75rem;
    margin-bottom: 2px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .intro-rationale {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    margin-left: 8px;
    background-color: ${props => {
      switch (props.rationale) {
        case 'Karma Points': return '#DCFCE7';
        case 'Dealflow Related': return '#FEF3C7';
        case 'Portfolio Company Related': return '#DBEAFE';
        default: return '#F3F4F6';
      }
    }};
    color: ${props => {
      switch (props.rationale) {
        case 'Karma Points': return '#166534';
        case 'Dealflow Related': return '#92400E';
        case 'Portfolio Company Related': return '#1E40AF';
        default: return '#374151';
      }
    }};
  }
  
  .intro-note {
    color: #4b5563;
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

// Rationale badge
const RationaleBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background-color: ${props => {
    switch (props.type) {
      case 'Karma Points': return '#DCFCE7';
      case 'Dealflow Related': return '#FEF3C7';
      case 'Portfolio Company Related': return '#DBEAFE';
      default: return '#F3F4F6';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'Karma Points': return '#166534';
      case 'Dealflow Related': return '#92400E';
      case 'Portfolio Company Related': return '#1E40AF';
      default: return '#374151';
    }
  }};
`;

// Truncated text with tooltip on hover
const TruncatedText = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 0;
    top: 100%;
    background: #1f2937;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    white-space: normal;
    max-width: 300px;
    word-wrap: break-word;
    z-index: 1000;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
`;

// Validation/info message
const ValidationMessage = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.8125rem;
  color: ${props => props.type === 'error' ? '#b91c1c' : '#6b7280'};
  margin-top: 6px;
  padding: ${props => props.type === 'error' ? '8px 10px' : '4px 0'};
  background-color: ${props => props.type === 'error' ? '#fee2e2' : 'transparent'};
  border-radius: ${props => props.type === 'error' ? '4px' : '0'};
  overflow-wrap: break-word;
  word-wrap: break-word;
`;

// Button container
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
`;

// Base button style
const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
`;

// Cancel button
const CancelButton = styled(Button)`
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
  
  &:hover {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
`;

// Save/create button
const SaveButton = styled(Button)`
  background-color: #2563eb;
  color: white;
  border: none;
  white-space: nowrap;
  
  &:hover {
    background-color: #1d4ed8;
  }
  
  &:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
`;

const NewIntroductionModal = ({ isOpen, onRequestClose, preSelectedContact, editingIntro }) => {
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [rationale, setRationale] = useState('');
  const [note, setNote] = useState('');
  const [introDate, setIntroDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilters, setCategoryFilters] = useState([]);
  const [introHistory, setIntroHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  // List of contact categories for filtering
  const contactCategories = [
    'Founder', 
    'Professional Investor', 
    'Advisor', 
    'Team', 
    'Friend and Family', 
    'Manager', 
    'Institution', 
    'Media', 
    'Student', 
    'Supplier'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      if (editingIntro) {
        // If editing, populate the form with existing data
        setSelectedContacts([]);  // Will be populated after contacts are fetched
        setRationale(editingIntro.introduction_rationale);
        setNote(editingIntro.introduction_note);
        setIntroDate(format(new Date(editingIntro.intro_date), 'yyyy-MM-dd'));
      } else if (preSelectedContact) {
        setSelectedContacts([preSelectedContact]);
        fetchPreviousIntroductions([preSelectedContact.id]);
      }
    } else {
      // Reset form when modal closes
      setSelectedContacts(preSelectedContact ? [preSelectedContact] : []);
      setRationale('');
      setNote('');
      setIntroDate(new Date().toISOString().split('T')[0]);
      setSearchTerm('');
      setSuggestions([]);
      setIntroHistory([]);
      setValidationErrors({});
      setShowFilters(false);
      setCategoryFilters([]);
    }
  }, [isOpen, preSelectedContact, editingIntro]);

  const fetchContacts = async (search = '') => {
    try {
      let query = supabase
        .from('contacts')
        .select('id, first_name, last_name, contact_category')
        .order('first_name');

      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      
      // Apply category filters if any are selected
      if (categoryFilters.length > 0) {
        query = query.in('contact_category', categoryFilters);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (editingIntro) {
        // If editing, set the selected contacts from the existing introduction
        const selectedContactsData = data.filter(contact => 
          editingIntro.contacts_introduced.includes(contact.id)
        );
        setSelectedContacts(selectedContactsData);
        fetchPreviousIntroductions(selectedContactsData.map(c => c.id));
      }

      // Filter out already selected contacts
      const filteredContacts = data.filter(contact => 
        !selectedContacts.some(selected => selected.id === contact.id)
      );

      if (search) {
        setSuggestions(filteredContacts);
      } else {
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    }
  };

  const fetchPreviousIntroductions = async (contactIds) => {
    if (contactIds.length < 2) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('contact_introductions')
        .select('*')
        .contains('contacts_introduced', contactIds)
        .order('intro_date', { ascending: false });
      
      if (error) throw error;
      
      // Filter to only show intros that include all selected contacts
      const relevantIntros = data.filter(intro => {
        // Check if all selected contactIds are included in this intro
        return contactIds.every(id => intro.contacts_introduced.includes(id));
      });
      
      setIntroHistory(relevantIntros);
    } catch (error) {
      console.error('Error fetching introduction history:', error);
      toast.error('Failed to load introduction history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchContacts(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, categoryFilters]);

  useEffect(() => {
    // Check for previous introductions when selected contacts change
    if (selectedContacts.length >= 2) {
      fetchPreviousIntroductions(selectedContacts.map(c => c.id));
    } else {
      setIntroHistory([]);
    }
    
    // Validate selected contacts
    validateForm('selectedContacts', selectedContacts);
  }, [selectedContacts]);

  const handleContactSelect = (contact) => {
    setSelectedContacts(prev => [...prev, contact]);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleRemoveContact = (contactId) => {
    setSelectedContacts(prev => prev.filter(contact => contact.id !== contactId));
  };
  
  const handleCategoryFilterChange = (category) => {
    setCategoryFilters(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };
  
  const validateForm = (field, value) => {
    const errors = {...validationErrors};
    
    switch (field) {
      case 'selectedContacts':
        if (!value || value.length < 2) {
          errors.selectedContacts = 'Please select at least two contacts for the introduction';
        } else {
          delete errors.selectedContacts;
        }
        break;
      case 'rationale':
        if (!value) {
          errors.rationale = 'Please select a rationale for the introduction';
        } else {
          delete errors.rationale;
        }
        break;
      case 'introDate':
        if (!value) {
          errors.introDate = 'Please select a date for the introduction';
        } else {
          delete errors.introDate;
        }
        break;
      default:
        // Validate all fields
        if (!selectedContacts || selectedContacts.length < 2) {
          errors.selectedContacts = 'Please select at least two contacts for the introduction';
        } else {
          delete errors.selectedContacts;
        }
        
        if (!rationale) {
          errors.rationale = 'Please select a rationale for the introduction';
        } else {
          delete errors.rationale;
        }
        
        if (!introDate) {
          errors.introDate = 'Please select a date for the introduction';
        } else {
          delete errors.introDate;
        }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    // Validate all form fields
    if (!validateForm()) {
      // If there are validation errors, scroll to the first error
      if (Object.keys(validationErrors).length > 0) {
        const firstErrorField = document.getElementById(Object.keys(validationErrors)[0]);
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const introData = {
        intro_date: introDate,
        contacts_introduced: selectedContacts.map(contact => contact.id),
        introduction_rationale: rationale,
        introduction_note: note,
        created_by: userData.user.id,
        created_at: new Date().toISOString()
      };

      let error;

      if (editingIntro) {
        // Update existing introduction
        const { error: updateError } = await supabase
          .from('contact_introductions')
          .update({
            intro_date: introDate,
            contacts_introduced: selectedContacts.map(contact => contact.id),
            introduction_rationale: rationale,
            introduction_note: note
          })
          .eq('intro_id', editingIntro.intro_id);
        error = updateError;
      } else {
        // Create new introduction
        const { error: insertError } = await supabase
          .from('contact_introductions')
          .insert(introData)
          .select();
        error = insertError;
      }

      if (error) throw error;

      toast.success(`Introduction ${editingIntro ? 'updated' : 'created'} successfully`);
      onRequestClose();
    } catch (error) {
      console.error(`Error ${editingIntro ? 'updating' : 'creating'} introduction:`, error);
      toast.error(`Failed to ${editingIntro ? 'update' : 'create'} introduction`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={modalStyle}
      ariaHideApp={false}
    >
      <Container>
        <Header>
          <h2>{editingIntro ? 'Edit Introduction' : 'New Introduction'}</h2>
          <CloseButton onClick={onRequestClose}>
            <FiX size={18} />
          </CloseButton>
        </Header>

        <Content>
          <TwoColumnLayout>
            <FormGroup>
              <Label htmlFor="introDate">Introduction Date</Label>
              <DateInput
                id="introDate"
                type="date"
                value={introDate}
                onChange={(e) => {
                  setIntroDate(e.target.value);
                  validateForm('introDate', e.target.value);
                }}
              />
              {validationErrors.introDate && (
                <ValidationMessage type="error">
                  <FiAlertTriangle size={14} />
                  {validationErrors.introDate}
                </ValidationMessage>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="rationale">Introduction Rationale</Label>
              <Select 
                id="rationale"
                value={rationale} 
                onChange={(e) => {
                  setRationale(e.target.value);
                  validateForm('rationale', e.target.value);
                }}
              >
                <option value="">Select a rationale...</option>
                <option value="Karma Points">Karma Points</option>
                <option value="Dealflow Related">Dealflow Related</option>
                <option value="Portfolio Company Related">Portfolio Company Related</option>
              </Select>
              {validationErrors.rationale && (
                <ValidationMessage type="error">
                  <FiAlertTriangle size={14} />
                  {validationErrors.rationale}
                </ValidationMessage>
              )}
            </FormGroup>
          </TwoColumnLayout>

          <FormGroup id="selectedContacts">
            <Label>Select Contacts to Introduce</Label>
            <ContactsList>
              {selectedContacts.map(contact => (
                <ContactTag key={contact.id}>
                  <span>{contact.first_name} {contact.last_name}</span>
                  <button onClick={() => handleRemoveContact(contact.id)}>
                    <FiX size={14} />
                  </button>
                </ContactTag>
              ))}
            </ContactsList>
            {validationErrors.selectedContacts && (
              <ValidationMessage type="error">
                <FiAlertTriangle size={14} />
                {validationErrors.selectedContacts}
              </ValidationMessage>
            )}

            <SearchRow>
              <SearchContainer>
                <SearchIcon>
                  <FiSearch size={16} />
                </SearchIcon>
                <SearchInput
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search contacts (type at least 2 letters)..."
                />
              </SearchContainer>
              <FilterButton 
                active={showFilters} 
                onClick={() => setShowFilters(!showFilters)}
                title="Filter contacts"
              >
                <FiFilter size={16} />
              </FilterButton>
            </SearchRow>

            <FilterOptions visible={showFilters}>
              <FilterGroup>
                <label>Filter by contact category:</label>
                <CheckboxContainer>
                  {contactCategories.map(category => (
                    <CheckboxOption key={category}>
                      <input 
                        type="checkbox" 
                        checked={categoryFilters.includes(category)}
                        onChange={() => handleCategoryFilterChange(category)}
                      />
                      {category}
                    </CheckboxOption>
                  ))}
                </CheckboxContainer>
              </FilterGroup>
            </FilterOptions>

            {showSuggestions && suggestions.length > 0 && (
              <SuggestionsContainer>
                {suggestions.map(contact => (
                  <SuggestionItem
                    key={contact.id}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <span>{contact.first_name} {contact.last_name}</span>
                    {contact.contact_category && (
                      <small style={{ color: '#6b7280' }}>{contact.contact_category}</small>
                    )}
                  </SuggestionItem>
                ))}
              </SuggestionsContainer>
            )}
            
            {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && (
              <ValidationMessage>
                No contacts found matching "{searchTerm}"
              </ValidationMessage>
            )}
          </FormGroup>

          {selectedContacts.length >= 2 && introHistory.length > 0 && (
            <IntroHistoryContainer>
              <IntroHistoryHeader>
                <h4>
                  <FiInfo size={16} />
                  Previous Introductions
                </h4>
              </IntroHistoryHeader>
              <IntroHistoryList>
                {introHistory.map(intro => (
                  <IntroHistoryItem 
                    key={intro.intro_id} 
                    rationale={intro.introduction_rationale}
                  >
                    <div className="intro-date">
                      <FiCalendar size={12} />
                      {format(new Date(intro.intro_date), 'dd MMM yyyy')}
                      <RationaleBadge type={intro.introduction_rationale}>
                        {intro.introduction_rationale}
                      </RationaleBadge>
                    </div>
                    {intro.introduction_note && (
                      <TruncatedText data-tooltip={intro.introduction_note} className="intro-note">
                        {intro.introduction_note}
                      </TruncatedText>
                    )}
                  </IntroHistoryItem>
                ))}
              </IntroHistoryList>
            </IntroHistoryContainer>
          )}

          <FormGroup>
            <Label htmlFor="note">Note</Label>
            <TextArea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any additional context about this introduction..."
            />
            <ValidationMessage>
              <FiInfo size={14} />
              This note will help you remember the context of this introduction later.
            </ValidationMessage>
          </FormGroup>
        </Content>

        <ButtonContainer>
          <CancelButton onClick={onRequestClose}>
            Cancel
          </CancelButton>
          <SaveButton onClick={handleSubmit} disabled={isSubmitting}>
            <FiSave size={16} />
            {isSubmitting ? 
              (editingIntro ? 'Updating...' : 'Creating...') : 
              (editingIntro ? 'Update' : 'Create')
            }
          </SaveButton>
        </ButtonContainer>
      </Container>
    </Modal>
  );
};

export default NewIntroductionModal;