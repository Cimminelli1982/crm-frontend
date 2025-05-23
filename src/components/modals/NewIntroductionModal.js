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
    border: '1px solid #333',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
    backgroundColor: '#121212',
    color: '#e0e0e0',
    width: '800px',
    maxWidth: '95%',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
  border-bottom: 1px solid #333;
  
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #00ff00;
  }
`;

// Close button styling
const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ffffff;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  
  &:hover {
    color: #ff5555;
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
  color: #00ff00;
`;

// Date input field
const DateInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #eee;
  background-color: #222;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:hover {
    background-color: #333;
  }
`;

// Select dropdown
const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #eee;
  background-color: #222;
  box-sizing: border-box;
  
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

// Textarea for notes
const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #eee;
  background-color: #222;
  min-height: 120px;
  resize: vertical;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
  }
  
  &:hover {
    background-color: #333;
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
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #eee;
  background-color: #222;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: #00ff00;
  }
  
  &:hover {
    background-color: #333;
  }
`;

// Filter toggle button
const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: ${props => props.active ? '#333' : '#222'};
  color: ${props => props.active ? '#00ff00' : '#ccc'};
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background-color: ${props => props.active ? '#444' : '#333'};
  }
`;

// Filter options panel
const FilterOptions = styled.div`
  display: ${props => props.visible ? 'block' : 'none'};
  margin-bottom: 16px;
  padding: 16px;
  background-color: #222;
  border-radius: 6px;
  border: 1px solid #444;
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
  color: #ccc;
  cursor: pointer;
  
  input {
    margin-right: 6px;
    accent-color: #00ff00;
  }
`;

// Contact suggestions dropdown
const SuggestionsContainer = styled.div`
  position: relative;
  margin-top: 4px;
  border: 1px solid #444;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
  background-color: #222;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
  color: #eee;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;

  &:hover {
    background-color: #333;
    color: #00ff00;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #333;
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
  background-color: #222;
  color: #00ff00;
  border-radius: 16px;
  font-size: 0.875rem;
  gap: 6px;
  border: 1px solid #00ff00;

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
      color: #ff5555;
    }
  }
`;

// Introduction history container
const IntroHistoryContainer = styled.div`
  margin-top: 16px;
  background-color: #222;
  border-radius: 6px;
  border: 1px solid #444;
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
    color: #00ff00;
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
  border-bottom: 1px solid #333;
  font-size: 0.8125rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  .intro-date {
    color: #ccc;
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
        case 'Karma Points': return '#143601';
        case 'Dealflow': return '#2C1A00';
        case 'Portfolio Company': return '#0A1C2E';
        default: return '#222';
      }
    }};
    color: ${props => {
      switch (props.rationale) {
        case 'Karma Points': return '#00ff00';
        case 'Dealflow': return '#FFBB00';
        case 'Portfolio Company': return '#47A3FF';
        default: return '#ccc';
      }
    }};
  }
  
  .intro-note {
    color: #aaa;
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
      case 'Karma Points': return '#143601';
      case 'Dealflow': return '#2C1A00';
      case 'Portfolio Company': return '#0A1C2E';
      default: return '#222';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'Karma Points': return '#00ff00';
      case 'Dealflow': return '#FFBB00';
      case 'Portfolio Company': return '#47A3FF';
      default: return '#ccc';
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
    background: #333;
    color: #00ff00;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 0.875rem;
    white-space: normal;
    max-width: 300px;
    word-wrap: break-word;
    z-index: 1000;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    border: 1px solid #444;
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
  border-top: 1px solid #333;
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
  background-color: transparent;
  color: #ccc;
  border: 1px solid #555;
  
  &:hover {
    background-color: #333;
  }
`;

// Save/create button
const SaveButton = styled(Button)`
  background-color: #00ff00;
  color: black;
  border: none;
  white-space: nowrap;
  
  &:hover {
    background-color: #00dd00;
  }
  
  &:disabled {
    background-color: #006600;
    color: #88ff88;
    cursor: not-allowed;
  }
`;

const NewIntroductionModal = ({ isOpen, onRequestClose, preSelectedContact, editingIntro }) => {
  // Debug logging for props
  useEffect(() => {
    if (isOpen && editingIntro) {
      console.log("Edit Introduction Modal opened with:", {
        introId: editingIntro.intro_id,
        date: editingIntro.intro_date,
        contactsIntroduced: editingIntro.contacts_introduced,
        rationale: editingIntro.introduction_rationale,
        note: editingIntro.introduction_note
      });
    }
  }, [isOpen, editingIntro]);
  
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
        
        // Map from the introductions table fields to the form fields
        setRationale(editingIntro.introduction_rationale || editingIntro.category);
        setNote(editingIntro.introduction_note || editingIntro.text);
        
        // Handle different date field names
        const dateField = editingIntro.intro_date || editingIntro.introduction_date;
        setIntroDate(format(new Date(dateField), 'yyyy-MM-dd'));
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
        .select('contact_id, first_name, last_name, category')
        .order('first_name');

      // If we're in edit mode, make sure we fetch ALL contacts included in the introduction
      if (editingIntro && !search) {
        // First, fetch contacts specifically included in the introduction
        // Handle both field names for contacts array
        const contactsArray = editingIntro.contacts_introduced || editingIntro.contact_ids || [];
        
        const { data: introContacts, error: introError } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, category')
          .in('contact_id', contactsArray);
          
        if (introError) throw introError;
        
        // Then fetch other contacts for the dropdown (if searching)
        if (search) {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
        }
        
        // Apply category filters if any are selected
        if (categoryFilters.length > 0) {
          query = query.in('category', categoryFilters);
        }
        
        const { data: otherContacts, error } = await query;
        if (error) throw error;
        
        // Combine the results, prioritizing intro contacts
        const allContacts = [...introContacts];
        
        // Add other contacts that aren't already in the intro contacts
        otherContacts.forEach(contact => {
          if (!allContacts.some(c => c.id === contact.id)) {
            allContacts.push(contact);
          }
        });
        
        // Set selected contacts from the introduction
        setSelectedContacts(introContacts);
        setContacts(allContacts);
        fetchPreviousIntroductions(introContacts.map(c => c.id));
        
        return;
      }
      
      // Standard search case
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }
      
      // Apply category filters if any are selected
      if (categoryFilters.length > 0) {
        query = query.in('category', categoryFilters);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter out already selected contacts
      const filteredContacts = data.filter(contact => 
        !selectedContacts.some(selected => selected.contact_id === contact.contact_id)
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
    // Only show introduction history when we have at least one contact
    if (!contactIds || contactIds.length < 1) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('introductions')
        .select('*')
        .contains('contact_ids', contactIds)
        .order('introduction_date', { ascending: false });
      
      if (error) throw error;
      
      // Filter to only show intros that include all selected contacts
      const relevantIntros = data ? data.filter(intro => {
        // Check if all selected contactIds are included in this intro
        return contactIds.every(id => (intro.contact_ids || []).includes(id));
      }) : [];
      
      // Map the data to match the expected format
      const mappedIntros = relevantIntros.map(intro => ({
        intro_id: intro.introduction_id,
        contacts_introduced: intro.contact_ids,
        intro_date: intro.introduction_date,
        introduction_rationale: intro.category, // Assuming category can serve as rationale
        introduction_note: intro.text,
        created_by: intro.created_by,
        created_at: intro.created_at
      }));
      
      setIntroHistory(mappedIntros);
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
    if (selectedContacts.length >= 1) {
      fetchPreviousIntroductions(selectedContacts.map(c => c.contact_id));
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
    setSelectedContacts(prev => prev.filter(contact => contact.contact_id !== contactId));
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
    console.log(`Validating ${field || 'all fields'}`);
    const errors = {...validationErrors};
    
    switch (field) {
      case 'selectedContacts':
        if (!value || value.length < 1) {
          console.log(`Selected contacts validation failed: ${value?.length || 0} contacts selected, need at least 1`);
          errors.selectedContacts = 'Please select at least one contact';
        } else {
          console.log(`Selected contacts validation passed: ${value.length} contacts`);
          delete errors.selectedContacts;
        }
        break;
      case 'rationale':
        if (!value) {
          console.log('Rationale validation failed: No rationale selected');
          errors.rationale = 'Please select a rationale for the introduction';
        } else {
          console.log(`Rationale validation passed: "${value}" selected`);
          delete errors.rationale;
        }
        break;
      case 'introDate':
        if (!value) {
          console.log('Introduction date validation failed: No date selected');
          errors.introDate = 'Please select a date for the introduction';
        } else {
          console.log(`Introduction date validation passed: "${value}" selected`);
          delete errors.introDate;
        }
        break;
      default:
        // Validate all fields
        console.log('Validating all fields at once');
        console.log(`- Selected contacts: ${selectedContacts?.length || 0}`);
        console.log(`- Rationale: "${rationale || ''}"`);
        console.log(`- Intro date: "${introDate || ''}"`);
        
        if (!selectedContacts || selectedContacts.length < 1) {
          console.log(`Selected contacts validation failed: ${selectedContacts?.length || 0} contacts selected, need at least 1`);
          errors.selectedContacts = 'Please select at least one contact';
        } else {
          console.log(`Selected contacts validation passed: ${selectedContacts.length} contacts`);
          delete errors.selectedContacts;
        }
        
        if (!rationale) {
          console.log('Rationale validation failed: No rationale selected');
          errors.rationale = 'Please select a rationale for the introduction';
        } else {
          delete errors.rationale;
        }
        
        if (!introDate) {
          console.log('Introduction date validation failed: No date selected');
          errors.introDate = 'Please select a date for the introduction';
        } else {
          delete errors.introDate;
        }
    }
    
    // Filter out any empty error messages to prevent them from blocking validation
    const filteredErrors = {};
    Object.entries(errors).forEach(([key, value]) => {
      if (value !== '') {
        filteredErrors[key] = value;
      }
    });
    
    const isValid = Object.keys(filteredErrors).length === 0;
    console.log(`Validation result: ${isValid ? 'VALID' : 'INVALID'}, errors:`, filteredErrors);
    
    setValidationErrors(filteredErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    console.log("Introduction form submission started");
    console.log("Current form data:", {
      introDate,
      selectedContacts: selectedContacts.map(c => ({id: c.contact_id, name: `${c.first_name} ${c.last_name}`})),
      rationale,
      note,
      validationErrors: Object.keys(validationErrors)
    });
    
    // Validate all form fields
    if (!validateForm()) {
      console.log("Validation failed", validationErrors);
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
    console.log("Validation passed, submitting form");

    try {
      const { data: userData } = await supabase.auth.getUser();
      console.log("Authenticated user:", userData?.user?.id);
      
      // Map to the introductions table structure
      const introData = {
        introduction_date: introDate,
        contact_ids: selectedContacts.map(contact => contact.contact_id),
        category: rationale, // Using rationale as category
        text: note, // Using note as text
        introduction_tool: 'email', // Changed from 'Web' to match enum
        status: 'Done & Dust', // Changed from 'Completed' to match enum
        created_by: 'User' // Use the enum value, not user ID
      };
      
      console.log("Contact IDs to be stored:", introData.contact_ids);

      console.log("Prepared introduction data:", introData);
      let error;

      if (editingIntro) {
        // Update existing introduction
        const updateData = {
          introduction_date: introDate,
          contact_ids: selectedContacts.map(contact => contact.contact_id),
          category: rationale,
          text: note,
          last_modified_by: 'User' // Use the enum value, not user ID
        };
        
        console.log("Updating introduction with data:", updateData);
        console.log("Introduction ID to update:", editingIntro.intro_id || editingIntro.introduction_id);
        
        // Check which ID field we should use
        const idField = editingIntro.intro_id ? 'intro_id' : 'introduction_id';
        const idValue = editingIntro.intro_id || editingIntro.introduction_id;
        
        console.log(`Using ID field: ${idField} with value: ${idValue}`);
        
        const { data: updatedData, error: updateError } = await supabase
          .from('introductions')
          .update(updateData)
          .eq('introduction_id', idValue) // Use the correct ID field
          .select(); // Add select() to return the updated data
        
        error = updateError;
        
        if (error) {
          console.error("Update error:", error);
        }
        
        // If there's data returned, log it for debugging
        if (updatedData) {
          console.log("Updated introduction returned data:", updatedData);
        }
      } else {
        // Create new introduction
        console.log("Creating new introduction");
        const { data: insertData, error: insertError } = await supabase
          .from('introductions')
          .insert(introData)
          .select();
          
        console.log("Insert result:", insertData);
        error = insertError;
        
        if (error) {
          console.error("Insert error:", error);
        }
      }

      if (error) throw error;

      console.log("Operation completed successfully");
      toast.success(`Introduction ${editingIntro ? 'updated' : 'created'} successfully`);
      
      // Force a small delay to ensure the DB operation completes before closing
      setTimeout(() => {
        console.log("Closing modal after successful operation");
        onRequestClose();
      }, 500);
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
                <option value="Dealflow">Dealflow</option>
                <option value="Portfolio Company">Portfolio Company</option>
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
                <ContactTag key={contact.contact_id}>
                  <span>{contact.first_name} {contact.last_name}</span>
                  <button onClick={() => handleRemoveContact(contact.contact_id)}>
                    <FiX size={14} />
                  </button>
                </ContactTag>
              ))}
            </ContactsList>

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
                    key={contact.contact_id}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <span>{contact.first_name} {contact.last_name}</span>
                    {contact.category && (
                      <small style={{ color: '#6b7280' }}>{contact.category}</small>
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

          {/* Only show previous introductions when NOT in edit mode */}
          {selectedContacts.length >= 1 && introHistory.length > 0 && !editingIntro && (
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