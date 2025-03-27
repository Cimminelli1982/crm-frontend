import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiSearch, FiExternalLink, FiUser, FiMapPin, FiTag, FiEdit, FiPlus, FiSave } from 'react-icons/fi';
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

const SearchForm = styled.form`
  display: flex;
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.75rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

// Field search components
const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 10px;
  width: 100%;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  width: 300px;
  max-height: 200px;
  overflow-y: auto;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
  margin-top: 2px;
`;

const SuggestionItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: none;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  background-color: transparent;
  color: #4b5563;
  border: none;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const SearchButton = styled.button`
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  background-color: #000000;
  color: white;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #333333;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  width: 100%;
  height: calc(100% - 140px);
  overflow: hidden;
`;

const DataCard = styled.div`
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;

  &.loading {
    opacity: 0.7;
  }
`;

const CardHeader = styled.div`
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
  }
`;

const CardBody = styled.div`
  padding: 16px;
  overflow-y: auto;
  flex: 1;
`;

const FieldGroup = styled.div`
  margin-bottom: 16px;
`;

const FieldLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 4px;
  text-transform: uppercase;
`;

const FieldValue = styled.div`
  font-size: 0.875rem;
  color: #111827;
  word-wrap: break-word;
  
  &.empty {
    color: #9ca3af;
    font-style: italic;
  }
`;

const EditableInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const CategorySelect = styled.select`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  background-color: white;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const EditableTextArea = styled.textarea`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  min-height: 80px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  padding: 2px;
  margin-left: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #2563eb;
  }
`;

const SaveButton = styled.button`
  padding: 8px 16px;
  background-color: #10B981;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #059669;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 16px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#4b5563'};
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
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
    margin-left: 4px;

    &:hover {
      opacity: 1;
    }
  }
`;

const CitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const City = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 16px;
  background-color: #e0f2fe;
  color: #0369a1;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
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
    margin-left: 4px;

    &:hover {
      opacity: 1;
    }
  }
`;

const ContactsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const Contact = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 0.75rem;
  border-radius: 16px;
  background-color: white;
  color: black;
  border: 2px solid black;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  font-weight: 500;
  margin: 2px;
  
  span {
    display: flex;
    align-items: center;
    justify-content: center;
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
    margin-left: 4px;

    &:hover {
      opacity: 1;
    }
  }
`;

const Message = styled.div`
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 0.875rem;

  &.info {
    background-color: #e0f2fe;
    color: #0369a1;
  }

  &.error {
    background-color: #fee2e2;
    color: #b91c1c;
  }
`;

const ExternalLink = styled.a`
  color: #2563eb;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &:hover {
    text-decoration: underline;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

// Helper function to get tag colors
const getTagColor = (tagName) => {
  const colors = [
    { bg: '#fee2e2', text: '#b91c1c' }, // Red
    { bg: '#fef3c7', text: '#92400e' }, // Amber
    { bg: '#ecfccb', text: '#3f6212' }, // Lime
    { bg: '#d1fae5', text: '#065f46' }, // Emerald
    { bg: '#e0f2fe', text: '#0369a1' }, // Sky
    { bg: '#ede9fe', text: '#5b21b6' }, // Violet
    { bg: '#fae8ff', text: '#86198f' }, // Fuchsia
    { bg: '#fce7f3', text: '#9d174d' }  // Pink
  ];
  
  // Generate a consistent index based on the tag name
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % colors.length;
  
  return colors[index];
};

// Get flag emoji from city name
const getFlagEmoji = (cityName) => {
  // Map of some cities to their country codes
  const cityCountryMap = {
    'New York': 'US',
    'San Francisco': 'US',
    'Los Angeles': 'US',
    'Chicago': 'US',
    'London': 'GB',
    'Berlin': 'DE',
    'Paris': 'FR',
    'Rome': 'IT',
    'Madrid': 'ES',
    'Amsterdam': 'NL',
    'Tokyo': 'JP',
    'Sydney': 'AU',
    'Singapore': 'SG',
    'Hong Kong': 'HK',
    'Dubai': 'AE',
    'Mumbai': 'IN',
    'Toronto': 'CA',
    'Zurich': 'CH',
    'Milan': 'IT',
    'Barcelona': 'ES',
    'Stockholm': 'SE',
  };
  
  // Extract country code or default to question mark
  const countryCode = cityCountryMap[cityName] || null;
  
  // If unknown, return null
  if (!countryCode) {
    return null;
  }
  
  // Convert country code to flag emoji
  return countryCode
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
};

const AddCompanyModal = ({ isOpen, onRequestClose, onSuccess }) => {
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Data from different sources
  const [supabaseData, setSupabaseData] = useState(null);
  const [airtableData, setAirtableData] = useState(null);
  const [hubspotData, setHubspotData] = useState(null);
  
  // Editable fields for Supabase
  const [editMode, setEditMode] = useState({});
  const [editableData, setEditableData] = useState({
    name: '',
    website: '',
    category: '',
    description: '',
    linkedin: ''
  });
  
  // Editable related data
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [showCityInput, setShowCityInput] = useState(false);
  const [showContactInput, setShowContactInput] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  
  // Track if data has been modified
  const [isModified, setIsModified] = useState(false);
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  const resetForm = () => {
    setWebsite('');
    setMessage({ type: '', text: '' });
    setSupabaseData(null);
    setAirtableData(null);
    setHubspotData(null);
    setEditMode({});
    setEditableData({
      name: '',
      website: '',
      category: '',
      description: '',
      linkedin: ''
    });
    setSelectedTags([]);
    setSelectedCities([]);
    setTagSearchTerm('');
    setCitySearchTerm('');
    setContactSearchTerm('');
    setTagSuggestions([]);
    setCitySuggestions([]);
    setContactSuggestions([]);
    setShowTagInput(false);
    setShowCityInput(false);
    setShowContactInput(false);
    setShowTagSuggestions(false);
    setShowCitySuggestions(false);
    setShowContactSuggestions(false);
    setIsModified(false);
  };
  
  // Format website URL
  const formatWebsite = (url) => {
    if (!url) return '';
    
    // Remove protocol and www
    let formatted = url.trim().toLowerCase();
    formatted = formatted.replace(/^(https?:\/\/)?(www\.)?/i, '');
    
    // Remove path and query
    formatted = formatted.split('/')[0];
    
    return formatted;
  };
  
  // Toggle edit mode for a field
  const toggleEditMode = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  // Handle field change
  const handleFieldChange = (field, value) => {
    setEditableData(prev => ({
      ...prev,
      [field]: value
    }));
    setIsModified(true);
  };
  
  // Fetch tag suggestions based on search term
  const fetchTagSuggestions = async (search) => {
    try {
      if (!search || search.length < 2) {
        setTagSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already selected tags
      const filteredSuggestions = data.filter(tag => 
        !selectedTags.some(selectedTag => selectedTag.id === tag.id)
      );

      setTagSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching tag suggestions:', err);
    }
  };
  
  // Handle tag search
  useEffect(() => {
    fetchTagSuggestions(tagSearchTerm);
  }, [tagSearchTerm]);
  
  // Handle adding a tag
  const handleAddTag = (tag) => {
    setSelectedTags(prev => [...prev, tag]);
    setTagSearchTerm('');
    setShowTagSuggestions(false);
    setIsModified(true);
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagId) => {
    setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
    setIsModified(true);
  };
  
  // Handle creating a new tag
  const handleCreateTag = async () => {
    try {
      if (!tagSearchTerm.trim()) return;
      
      // Check if tag already exists
      const { data: existingTags, error: searchError } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', tagSearchTerm.trim())
        .single();
        
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Error searching for existing tag:', searchError);
        throw searchError;
      }
      
      // If tag exists, add it
      if (existingTags) {
        handleAddTag(existingTags);
        return;
      }
      
      // Create new tag
      const { data, error } = await supabase
        .from('tags')
        .insert({ 
          name: tagSearchTerm.trim(),
          tag_name: tagSearchTerm.trim() // For compatibility
        })
        .select()
        .single();

      if (error) throw error;

      handleAddTag(data);
    } catch (err) {
      console.error('Error creating new tag:', err);
      setMessage({ type: 'error', text: 'Failed to create new tag' });
    }
  };
  
  // Fetch city suggestions based on search term
  const fetchCitySuggestions = async (search) => {
    try {
      if (!search || search.length < 2) {
        setCitySuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already selected cities
      const filteredSuggestions = data.filter(city => 
        !selectedCities.some(selectedCity => selectedCity.id === city.id)
      );

      setCitySuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching city suggestions:', err);
    }
  };
  
  // Handle city search
  useEffect(() => {
    fetchCitySuggestions(citySearchTerm);
  }, [citySearchTerm]);
  
  // Handle adding a city
  const handleAddCity = (city) => {
    setSelectedCities(prev => [...prev, city]);
    setCitySearchTerm('');
    setShowCitySuggestions(false);
    setIsModified(true);
  };
  
  // Handle removing a city
  const handleRemoveCity = (cityId) => {
    setSelectedCities(prev => prev.filter(city => city.id !== cityId));
    setIsModified(true);
  };
  
  // Handle creating a new city
  const handleCreateCity = async () => {
    try {
      if (!citySearchTerm.trim()) return;
      
      // Check if city already exists
      const { data: existingCities, error: searchError } = await supabase
        .from('cities')
        .select('*')
        .ilike('name', citySearchTerm.trim())
        .single();
        
      if (searchError && searchError.code !== 'PGRST116') {
        console.error('Error searching for existing city:', searchError);
        throw searchError;
      }
      
      // If city exists, add it
      if (existingCities) {
        handleAddCity(existingCities);
        return;
      }
      
      // Create new city
      const { data, error } = await supabase
        .from('cities')
        .insert({ 
          name: citySearchTerm.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      handleAddCity(data);
    } catch (err) {
      console.error('Error creating new city:', err);
      setMessage({ type: 'error', text: 'Failed to create new city' });
    }
  };
  
  // Fetch contact suggestions based on search term
  const fetchContactSuggestions = async (search) => {
    try {
      if (!search || search.length < 2) {
        setContactSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email')
        .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out already selected contacts
      const filteredSuggestions = data.filter(contact => 
        !selectedContacts.some(selectedContact => selectedContact.id === contact.id)
      );

      setContactSuggestions(filteredSuggestions);
    } catch (err) {
      console.error('Error fetching contact suggestions:', err);
    }
  };
  
  // Handle contact search
  useEffect(() => {
    fetchContactSuggestions(contactSearchTerm);
  }, [contactSearchTerm]);
  
  // Handle adding a contact
  const handleAddContact = (contact) => {
    setSelectedContacts(prev => [...prev, contact]);
    setContactSearchTerm('');
    setShowContactSuggestions(false);
    setIsModified(true);
  };
  
  // Handle removing a contact
  const handleRemoveContact = (contactId) => {
    setSelectedContacts(prev => prev.filter(contact => contact.id !== contactId));
    setIsModified(true);
  };
  
  // Save changes to Supabase
  const handleSaveChanges = async () => {
    if (!isModified) return;
    
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Format website
      let formattedWebsite = editableData.website.trim();
      if (formattedWebsite && !formattedWebsite.match(/^https?:\/\//)) {
        formattedWebsite = 'https://' + formattedWebsite;
      }
      
      // Format LinkedIn
      let formattedLinkedin = editableData.linkedin.trim();
      if (formattedLinkedin && !formattedLinkedin.match(/^https?:\/\//)) {
        formattedLinkedin = 'https://' + formattedLinkedin;
      }
      
      // Validate required fields
      if (!editableData.name.trim()) {
        setMessage({ type: 'error', text: 'Company name is required' });
        setSaving(false);
        return;
      }
      
      const updateData = {
        name: editableData.name.trim(),
        website: formattedWebsite,
        category: editableData.category.trim(),
        description: editableData.description.trim(),
        linkedin: formattedLinkedin,
        modified_at: new Date().toISOString()
      };
      
      let result;
      let companyId;
      
      if (supabaseData?.id) {
        // Update existing company
        const { data, error } = await supabase
          .from('companies')
          .update(updateData)
          .eq('id', supabaseData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        companyId = supabaseData.id;
        
        // Update existing tags
        // First, get existing tag connections
        const { data: existingTags, error: getTagsError } = await supabase
          .from('companies_tags')
          .select('tag_id')
          .eq('company_id', companyId);
          
        if (getTagsError) throw getTagsError;
        
        // Find tags to remove (ones that exist in DB but not in selectedTags)
        const existingTagIds = existingTags.map(t => t.tag_id);
        const selectedTagIds = selectedTags.map(t => t.id);
        
        // Tags to remove
        const tagsToRemove = existingTagIds.filter(id => !selectedTagIds.includes(id));
        
        // Tags to add
        const tagsToAdd = selectedTagIds.filter(id => !existingTagIds.includes(id));
        
        // Remove tags that were unselected
        if (tagsToRemove.length > 0) {
          const { error: removeTagsError } = await supabase
            .from('companies_tags')
            .delete()
            .eq('company_id', companyId)
            .in('tag_id', tagsToRemove);
            
          if (removeTagsError) throw removeTagsError;
        }
        
        // Add new tags
        if (tagsToAdd.length > 0) {
          const newTagConnections = tagsToAdd.map(tagId => ({
            company_id: companyId,
            tag_id: tagId
          }));
          
          const { error: addTagsError } = await supabase
            .from('companies_tags')
            .insert(newTagConnections);
            
          if (addTagsError) throw addTagsError;
        }
        
        // Update existing cities
        // First, get existing city connections
        const { data: existingCities, error: getCitiesError } = await supabase
          .from('companies_cities')
          .select('city_id')
          .eq('company_id', companyId);
          
        if (getCitiesError) throw getCitiesError;
        
        // Find cities to remove (ones that exist in DB but not in selectedCities)
        const existingCityIds = existingCities.map(c => c.city_id);
        const selectedCityIds = selectedCities.map(c => c.id);
        
        // Cities to remove
        const citiesToRemove = existingCityIds.filter(id => !selectedCityIds.includes(id));
        
        // Cities to add
        const citiesToAdd = selectedCityIds.filter(id => !existingCityIds.includes(id));
        
        // Remove cities that were unselected
        if (citiesToRemove.length > 0) {
          const { error: removeCitiesError } = await supabase
            .from('companies_cities')
            .delete()
            .eq('company_id', companyId)
            .in('city_id', citiesToRemove);
            
          if (removeCitiesError) throw removeCitiesError;
        }
        
        // Add new cities
        if (citiesToAdd.length > 0) {
          const newCityConnections = citiesToAdd.map(cityId => ({
            company_id: companyId,
            city_id: cityId
          }));
          
          const { error: addCitiesError } = await supabase
            .from('companies_cities')
            .insert(newCityConnections);
            
          if (addCitiesError) throw addCitiesError;
        }
        
        // Update existing contacts
        // First, get existing contact connections
        const { data: existingContacts, error: getContactsError } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', companyId);
          
        if (getContactsError) throw getContactsError;
        
        // Find contacts to remove (ones that exist in DB but not in selectedContacts)
        const existingContactIds = existingContacts.map(c => c.contact_id);
        const selectedContactIds = selectedContacts.map(c => c.id);
        
        // Contacts to remove
        const contactsToRemove = existingContactIds.filter(id => !selectedContactIds.includes(id));
        
        // Contacts to add
        const contactsToAdd = selectedContactIds.filter(id => !existingContactIds.includes(id));
        
        // Remove contacts that were unselected
        if (contactsToRemove.length > 0) {
          const { error: removeContactsError } = await supabase
            .from('contact_companies')
            .delete()
            .eq('company_id', companyId)
            .in('contact_id', contactsToRemove);
            
          if (removeContactsError) throw removeContactsError;
        }
        
        // Add new contacts
        if (contactsToAdd.length > 0) {
          const newContactConnections = contactsToAdd.map(contactId => ({
            company_id: companyId,
            contact_id: contactId
          }));
          
          const { error: addContactsError } = await supabase
            .from('contact_companies')
            .insert(newContactConnections);
            
          if (addContactsError) throw addContactsError;
        }
        
        setMessage({ type: 'info', text: 'Company updated successfully' });
      } else {
        // Create new company
        const { data, error } = await supabase
          .from('companies')
          .insert({
            ...updateData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        companyId = result.id;
        
        // Add tags if any
        if (selectedTags.length > 0) {
          const tagConnections = selectedTags.map(tag => ({
            company_id: companyId,
            tag_id: tag.id
          }));
          
          const { error: tagsError } = await supabase
            .from('companies_tags')
            .insert(tagConnections);
          
          if (tagsError) {
            console.error('Error adding tags:', tagsError);
            // Continue even if tag adding fails
          }
        }
        
        // Add cities if any
        if (selectedCities.length > 0) {
          const cityConnections = selectedCities.map(city => ({
            company_id: companyId,
            city_id: city.id
          }));
          
          const { error: citiesError } = await supabase
            .from('companies_cities')
            .insert(cityConnections);
          
          if (citiesError) {
            console.error('Error adding cities:', citiesError);
            // Continue even if city adding fails
          }
        }
        
        // Add contacts if any
        if (selectedContacts.length > 0) {
          const contactConnections = selectedContacts.map(contact => ({
            company_id: companyId,
            contact_id: contact.id
          }));
          
          const { error: contactsError } = await supabase
            .from('contact_companies')
            .insert(contactConnections);
          
          if (contactsError) {
            console.error('Error adding contacts:', contactsError);
            // Continue even if contact adding fails
          }
        }
        
        setMessage({ type: 'info', text: 'Company created successfully' });
      }
      
      // Refresh all related data (tags, cities, contacts)
      const { data: refreshedTags } = await supabase
        .from('companies_tags')
        .select(`
          tag_id,
          tags:tag_id(id, name)
        `)
        .eq('company_id', companyId);
        
      const { data: refreshedCities } = await supabase
        .from('companies_cities')
        .select(`
          city_id,
          cities:city_id(id, name)
        `)
        .eq('company_id', companyId);
        
      const { data: refreshedContacts } = await supabase
        .from('contact_companies')
        .select(`
          contact_id,
          contacts:contact_id(id, first_name, last_name, email)
        `)
        .eq('company_id', companyId);
      
      // Process data
      const tags = refreshedTags ? refreshedTags.map(t => t.tags).filter(Boolean) : [];
      const cities = refreshedCities ? refreshedCities.map(c => c.cities).filter(Boolean) : [];
      const contacts = refreshedContacts ? refreshedContacts.map(c => c.contacts).filter(Boolean) : [];
      
      // Update company data
      setSupabaseData({
        ...result,
        tags,
        cities,
        contacts
      });
      
      // Update selected tags, cities, and contacts
      setSelectedTags(tags);
      setSelectedCities(cities);
      setSelectedContacts(contacts);
      
      // Exit edit mode
      setEditMode({});
      setIsModified(false);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      console.error('Error saving company:', err);
      setMessage({ type: 'error', text: `Failed to save company: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!website.trim()) {
      setMessage({ type: 'error', text: 'Please enter a website' });
      return;
    }
    
    try {
      setLoading(true);
      
      // Format website for search
      const formattedWebsite = formatWebsite(website);
      
      // Search for company in Supabase
      const { data: supabaseCompany, error: supabaseError } = await supabase
        .from('companies')
        .select('*')
        .ilike('website', `%${formattedWebsite}%`)
        .limit(1)
        .single();
      
      if (supabaseError && supabaseError.code !== 'PGRST116') {
        console.error('Supabase search error:', supabaseError);
        throw supabaseError;
      }
      
      // If company found in Supabase, load related data
      if (supabaseCompany) {
        // Load tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('companies_tags')
          .select(`
            tag_id,
            tags:tag_id(id, name)
          `)
          .eq('company_id', supabaseCompany.id);
        
        if (tagsError) {
          console.error('Error loading tags:', tagsError);
        }
        
        // Load cities
        const { data: citiesData, error: citiesError } = await supabase
          .from('companies_cities')
          .select(`
            city_id,
            cities:city_id(id, name)
          `)
          .eq('company_id', supabaseCompany.id);
        
        if (citiesError) {
          console.error('Error loading cities:', citiesError);
        }
        
        // Load contacts
        const { data: contactsData, error: contactsError } = await supabase
          .from('contact_companies')
          .select(`
            contact_id,
            contacts:contact_id(id, first_name, last_name, email)
          `)
          .eq('company_id', supabaseCompany.id);
        
        if (contactsError) {
          console.error('Error loading contacts:', contactsError);
        }
        
        // Process the tags and cities for state
        const tags = tagsData ? tagsData.map(t => t.tags).filter(Boolean) : [];
        const cities = citiesData ? citiesData.map(c => c.cities).filter(Boolean) : [];
        const contacts = contactsData ? contactsData.map(c => c.contacts).filter(Boolean) : [];
        
        // Add related data to company
        const companyWithRelations = {
          ...supabaseCompany,
          tags,
          cities,
          contacts
        };
        
        setSupabaseData(companyWithRelations);
        
        // Initialize editable data
        setEditableData({
          name: companyWithRelations.name || '',
          website: companyWithRelations.website || '',
          category: companyWithRelations.category || '',
          description: companyWithRelations.description || '',
          linkedin: companyWithRelations.linkedin || ''
        });
        
        // Set selected tags, cities, and contacts
        setSelectedTags(tags);
        setSelectedCities(cities);
        setSelectedContacts(contacts);
      } else {
        setSupabaseData(null);
        
        // Initialize editable data with the searched website
        setEditableData({
          name: '',
          website: website.trim(),
          category: '',
          description: '',
          linkedin: ''
        });
      }
      
      // For now, other data sources are not implemented
      setAirtableData(null);
      setHubspotData(null);
      
      // Show message if no data found
      if (!supabaseCompany) {
        setMessage({ type: 'info', text: 'No data found in any source for this website. You can edit the fields and save to create a new company.' });
      }
    } catch (err) {
      console.error('Error searching for company:', err);
      setMessage({ type: 'error', text: 'Failed to search for company. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Render a data card for each source
  const renderDataCard = (source, data, isLoading) => {
    const isSupabase = source === 'Supabase';
    
    // Predefined categories matching CompanyModal.js
    const categoryOptions = [
      'Skip',
      'Advisory',
      'Corporation',
      'Institution',
      'Professional Investor',
      'SME',
      'Startup',
      'Supplier',
      'Media',
      'Team'
    ];
  
    // For editable fields (only for Supabase)
    const renderEditableField = (field, label, multiline = false) => {
      const value = isSupabase ? editableData[field] : (data?.[field] || '');
      const isEmpty = !value;
      
      return (
        <FieldGroup>
          <FieldLabel style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {label}
            {isSupabase && (
              <EditButton onClick={() => toggleEditMode(field)} title={`Edit ${label}`}>
                <FiEdit size={14} />
              </EditButton>
            )}
          </FieldLabel>
          
          {isSupabase && editMode[field] ? (
            multiline ? (
              <EditableTextArea
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
                autoFocus
              />
            ) : field === 'category' ? (
              <CategorySelect
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                autoFocus
              >
                <option value="">Select a category</option>
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </CategorySelect>
            ) : (
              <EditableInput
                type="text"
                value={value}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                placeholder={`Enter ${label.toLowerCase()}`}
                autoFocus
              />
            )
          ) : field === 'website' || field === 'linkedin' ? (
            <FieldValue className={isEmpty ? 'empty' : ''}>
              {!isEmpty ? (
                <ExternalLink href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer">
                  {value} <FiExternalLink size={12} />
                </ExternalLink>
              ) : (
                `No ${label.toLowerCase()} available`
              )}
            </FieldValue>
          ) : (
            <FieldValue className={isEmpty ? 'empty' : ''}>
              {value || `No ${label.toLowerCase()} available`}
            </FieldValue>
          )}
        </FieldGroup>
      );
    };
    
    return (
      <DataCard className={isLoading ? 'loading' : ''}>
        <CardHeader>
          <h3>{source}</h3>
          {isSupabase && isModified && (
            <SaveButton onClick={handleSaveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </SaveButton>
          )}
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <LoadingSpinner>
              <div className="spinner" style={{ 
                width: '30px', 
                height: '30px', 
                border: '3px solid #f3f3f3', 
                borderTop: '3px solid #000000', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></div>
            </LoadingSpinner>
          ) : (!data && !isSupabase) ? (
            <div style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>
              No data available
            </div>
          ) : (
            <>
              {renderEditableField('name', 'Name')}
              {renderEditableField('website', 'Website')}
              
              {/* Category field */}
              <FieldGroup>
                <FieldLabel>Category</FieldLabel>
                {isSupabase ? (
                  editableData.category ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FieldValue>{editableData.category}</FieldValue>
                      <CategorySelect
                        value={editableData.category}
                        onChange={(e) => {
                          handleFieldChange('category', e.target.value);
                          setIsModified(true);
                        }}
                        style={{ 
                          width: 'auto', 
                          minWidth: '120px', 
                          marginLeft: 'auto',
                          padding: '2px 24px 2px 8px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <option value="">Select a category</option>
                        {categoryOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </CategorySelect>
                    </div>
                  ) : (
                    <CategorySelect
                      value={editableData.category || ''}
                      onChange={(e) => {
                        handleFieldChange('category', e.target.value);
                        setIsModified(true);
                      }}
                    >
                      <option value="">Select a category</option>
                      {categoryOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </CategorySelect>
                  )
                ) : (
                  <FieldValue className={!data?.category ? 'empty' : ''}>
                    {data?.category || 'No category available'}
                  </FieldValue>
                )}
              </FieldGroup>
              
              {/* Description field with Apollo button */}
              <FieldGroup>
                <FieldLabel style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>Description</span>
                    {isSupabase && (
                      <button 
                        onClick={() => {
                          // Only proceed if we have a company ID and website
                          if (supabaseData?.id && editableData.website) {
                            // Show loading message with debug info
                            const debugMsg = `CompanyID: ${supabaseData.id}, Website: ${editableData.website}`;
                            console.log('Apollo debug info (Description):', debugMsg);
                            setMessage({ type: 'info', text: `Fetching description from Apollo... ${debugMsg}` });

                            const requestBody = {
                              companyId: supabaseData.id,
                              website: editableData.website
                            };
                            console.log('Request Body:', JSON.stringify(requestBody));

                            // Call the Apollo function with the specific URL
                            fetch('https://crm-editor-frontend.netlify.app/.netlify/functions/apollo-website-description-enrich', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify(requestBody),
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.error) {
                                setMessage({ type: 'error', text: `Apollo error: ${data.error}` });
                                return;
                              }
                              
                              // Update the fields with data from Apollo, but don't save yet
                              if (data.data.description) {
                                handleFieldChange('description', data.data.description);
                              }
                              
                              // If we got LinkedIn data and don't have it already, update that too
                              if (data.data.linkedin && !editableData.linkedin) {
                                handleFieldChange('linkedin', data.data.linkedin);
                              }
                              
                              // Show message about Apollo enrichment with review prompt
                              setMessage({ 
                                type: 'info', 
                                text: 'Data retrieved from Apollo. Review and save changes if the information is correct.' 
                              });
                              
                              // Mark form as modified so user knows they need to save
                              setIsModified(true);
                            })
                            .catch(error => {
                              console.error('Error calling Apollo enrichment:', error);
                              setMessage({ type: 'error', text: 'Failed to get description from Apollo' });
                            });
                          } else {
                            // Show message if missing required data
                            setMessage({ 
                              type: 'error', 
                              text: !supabaseData?.id 
                                ? 'Save company first to use Apollo enrichment' 
                                : 'Website is required for Apollo enrichment'
                            });
                          }
                        }} 
                        style={{ 
                          backgroundColor: 'black', 
                          color: 'white', 
                          border: 'none', 
                          padding: '1px 5px', 
                          borderRadius: '3px', 
                          fontSize: '0.6rem',
                          cursor: 'pointer',
                          height: '16px',
                          lineHeight: '1',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        Apollo
                      </button>
                    )}
                  </div>
                  <div>
                    {isSupabase && (
                      <EditButton onClick={() => toggleEditMode('description')} title="Edit Description">
                        <FiEdit size={14} />
                      </EditButton>
                    )}
                  </div>
                </FieldLabel>
                
                {isSupabase && editMode['description'] ? (
                  <EditableTextArea
                    value={editableData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    placeholder="Enter description"
                    autoFocus
                  />
                ) : (
                  <FieldValue className={!editableData.description ? 'empty' : ''}>
                    {editableData.description || 'No description available'}
                  </FieldValue>
                )}
              </FieldGroup>
              
              {/* LinkedIn field with Apollo button */}
              <FieldGroup>
                <FieldLabel style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>LinkedIn</span>
                    {isSupabase && (
                      <button 
                        onClick={() => {
                          // Only proceed if we have a company ID and website
                          if (supabaseData?.id && editableData.website) {
                            // Show loading message
                            setMessage({ type: 'info', text: 'Fetching LinkedIn from Apollo...' });

                            // Call the LinkedIn-specific Apollo function
                            fetch('https://crm-editor-frontend.netlify.app/.netlify/functions/apollo-website-linkedin-enrich', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                companyId: supabaseData.id,
                                website: editableData.website
                              }),
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.error) {
                                setMessage({ type: 'error', text: `Apollo error: ${data.error}` });
                                return;
                              }
                              
                              // Update the LinkedIn field if available
                              if (data.data.linkedin) {
                                handleFieldChange('linkedin', data.data.linkedin);
                                setMessage({ 
                                  type: 'info', 
                                  text: 'LinkedIn URL found from Apollo. Review and save changes if correct.' 
                                });
                                setIsModified(true);
                              } else {
                                setMessage({ type: 'info', text: 'No LinkedIn data found in Apollo' });
                              }
                            })
                            .catch(error => {
                              console.error('Error calling Apollo enrichment:', error);
                              setMessage({ type: 'error', text: 'Failed to get LinkedIn from Apollo' });
                            });
                          } else {
                            // Show message if missing required data
                            setMessage({ 
                              type: 'error', 
                              text: !supabaseData?.id 
                                ? 'Save company first to use Apollo enrichment' 
                                : 'Website is required for Apollo enrichment'
                            });
                          }
                        }} 
                        style={{ 
                          backgroundColor: 'black', 
                          color: 'white', 
                          border: 'none', 
                          padding: '1px 5px', 
                          borderRadius: '3px', 
                          fontSize: '0.6rem',
                          cursor: 'pointer',
                          height: '16px',
                          lineHeight: '1',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        Apollo
                      </button>
                    )}
                  </div>
                  <div>
                    {isSupabase && (
                      <EditButton onClick={() => toggleEditMode('linkedin')} title="Edit LinkedIn">
                        <FiEdit size={14} />
                      </EditButton>
                    )}
                  </div>
                </FieldLabel>
                
                {isSupabase && editMode['linkedin'] ? (
                  <EditableInput
                    type="text"
                    value={editableData.linkedin}
                    onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                    placeholder="Enter LinkedIn URL"
                    autoFocus
                  />
                ) : (
                  <FieldValue className={!editableData.linkedin ? 'empty' : ''}>
                    {editableData.linkedin ? (
                      <ExternalLink href={editableData.linkedin.startsWith('http') ? editableData.linkedin : `https://${editableData.linkedin}`} target="_blank" rel="noopener noreferrer">
                        {editableData.linkedin} <FiExternalLink size={12} />
                      </ExternalLink>
                    ) : (
                      'No LinkedIn available'
                    )}
                  </FieldValue>
                )}
              </FieldGroup>
              
              {/* Tags Section */}
              <FieldGroup>
                <FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiTag size={14} /> Tags
                  </div>
                </FieldLabel>
                
                {isSupabase ? (
                  // Editable tags section for Supabase
                  <>
                    <TagsList>
                      {selectedTags.length > 0 ? (
                        selectedTags.map(tag => {
                          const color = getTagColor(tag.name);
                          return (
                            <Tag key={tag.id} color={color.bg} textColor={color.text}>
                              <span>{tag.name}</span>
                              <button onClick={() => handleRemoveTag(tag.id)} title="Remove tag">
                                <FiX size={12} />
                              </button>
                            </Tag>
                          );
                        })
                      ) : (
                        <FieldValue className="empty">No tags selected</FieldValue>
                      )}
                      
                      {!showTagInput && (
                        <AddButton onClick={() => setShowTagInput(true)}>
                          <FiPlus size={12} />
                          Add Tag
                        </AddButton>
                      )}
                    </TagsList>
                    
                    {showTagInput && (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                          <input 
                            type="text"
                            value={tagSearchTerm}
                            onChange={(e) => setTagSearchTerm(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '2px 8px',
                              border: '1px solid #d1d5db',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
                              outline: 'none'
                            }}
                            onFocus={() => setShowTagSuggestions(true)}
                            autoFocus
                          />
                          <AddButton 
                            onClick={() => {
                              setShowTagInput(false);
                              setTagSearchTerm('');
                              setShowTagSuggestions(false);
                            }}
                            style={{ margin: 0 }}
                          >
                            <FiX size={12} />
                            Cancel
                          </AddButton>
                        </div>
                        
                        {tagSearchTerm.length >= 3 && (
                          <SuggestionsContainer style={{ width: '300px' }}>
                            {tagSuggestions.map(suggestion => (
                              <SuggestionItem
                                key={suggestion.id}
                                onClick={() => {
                                  handleAddTag(suggestion);
                                  setShowTagInput(false);
                                }}
                              >
                                {suggestion.name}
                              </SuggestionItem>
                            ))}
                            {tagSuggestions.length === 0 && tagSearchTerm.trim() && (
                              <SuggestionItem onClick={() => {
                                handleCreateTag();
                                setShowTagInput(false);
                              }}>
                                <FiPlus size={14} style={{ marginRight: '5px' }} />
                                Create tag "{tagSearchTerm}"
                              </SuggestionItem>
                            )}
                          </SuggestionsContainer>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  // Read-only tags section for other sources
                  <>
                    {data?.tags && data.tags.length > 0 ? (
                      <TagsList>
                        {data.tags.map(tag => {
                          if (!tag) return null;
                          const color = getTagColor(tag.name);
                          return (
                            <Tag key={tag.id} color={color.bg} textColor={color.text}>
                              {tag.name}
                            </Tag>
                          );
                        })}
                      </TagsList>
                    ) : (
                      <FieldValue className="empty">No tags available</FieldValue>
                    )}
                  </>
                )}
              </FieldGroup>
              
              {/* Cities Section */}
              <FieldGroup>
                <FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiMapPin size={14} /> Cities
                  </div>
                </FieldLabel>
                
                {isSupabase ? (
                  // Editable cities section for Supabase
                  <>
                    <CitiesList>
                      {selectedCities.length > 0 ? (
                        selectedCities.map(city => {
                          const flag = getFlagEmoji(city.name);
                          return (
                            <City key={city.id}>
                              {flag && <span style={{ marginRight: '4px' }}>{flag}</span>}
                              <span>{city.name}</span>
                              <button onClick={() => handleRemoveCity(city.id)} title="Remove city">
                                <FiX size={12} />
                              </button>
                            </City>
                          );
                        })
                      ) : (
                        <FieldValue className="empty">No cities selected</FieldValue>
                      )}
                      
                      {!showCityInput && (
                        <AddButton onClick={() => setShowCityInput(true)}>
                          <FiPlus size={12} />
                          Add City
                        </AddButton>
                      )}
                    </CitiesList>
                    
                    {showCityInput && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                        <input 
                          type="text"
                          value={citySearchTerm}
                          onChange={(e) => setCitySearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '2px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                          onFocus={() => setShowCitySuggestions(true)}
                          autoFocus
                        />
                        <AddButton 
                          onClick={() => {
                            setShowCityInput(false);
                            setCitySearchTerm('');
                            setShowCitySuggestions(false);
                          }}
                          style={{ margin: 0 }}
                        >
                          <FiX size={12} />
                          Cancel
                        </AddButton>
                      </div>
                    )}
                    
                    {showCitySuggestions && citySearchTerm.length >= 2 && (
                      <SuggestionsContainer>
                        {citySuggestions.map(suggestion => (
                          <SuggestionItem
                            key={suggestion.id}
                            onClick={() => handleAddCity(suggestion)}
                          >
                            {suggestion.name}
                          </SuggestionItem>
                        ))}
                        {citySuggestions.length === 0 && citySearchTerm.trim() && (
                          <SuggestionItem onClick={handleCreateCity}>
                            <FiPlus size={14} style={{ marginRight: '5px' }} />
                            Create city "{citySearchTerm}"
                          </SuggestionItem>
                        )}
                      </SuggestionsContainer>
                    )}
                  </>
                ) : (
                  // Read-only cities section for other sources
                  <>
                    {data?.cities && data.cities.length > 0 ? (
                      <CitiesList>
                        {data.cities.map(city => {
                          if (!city) return null;
                          const flag = getFlagEmoji(city.name);
                          return (
                            <City key={city.id}>
                              {flag && <span style={{ marginRight: '4px' }}>{flag}</span>}
                              {city.name}
                            </City>
                          );
                        })}
                      </CitiesList>
                    ) : (
                      <FieldValue className="empty">No cities available</FieldValue>
                    )}
                  </>
                )}
              </FieldGroup>
              
              {/* Contacts Section */}
              <FieldGroup>
                <FieldLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiUser size={14} /> Related Contacts
                  </div>
                </FieldLabel>
                
                {isSupabase ? (
                  // Editable contacts section for Supabase
                  <>
                    <ContactsList>
                      {selectedContacts.length > 0 ? (
                        selectedContacts.map(contact => (
                          <Contact key={contact.id}>
                            <span>{contact.first_name} {contact.last_name}</span>
                            <button onClick={() => handleRemoveContact(contact.id)} title="Remove contact">
                              <FiX size={12} />
                            </button>
                          </Contact>
                        ))
                      ) : (
                        <FieldValue className="empty">No contacts selected</FieldValue>
                      )}
                      
                      {!showContactInput && (
                        <AddButton onClick={() => setShowContactInput(true)}>
                          <FiPlus size={12} />
                          Add Contact
                        </AddButton>
                      )}
                    </ContactsList>
                    
                    {showContactInput && (
                      <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px', gap: '8px' }}>
                        <input 
                          type="text"
                          value={contactSearchTerm}
                          onChange={(e) => setContactSearchTerm(e.target.value)}
                          style={{
                            flex: 1,
                            padding: '2px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            outline: 'none'
                          }}
                          onFocus={() => setShowContactSuggestions(true)}
                          autoFocus
                        />
                        <AddButton 
                          onClick={() => {
                            setShowContactInput(false);
                            setContactSearchTerm('');
                            setShowContactSuggestions(false);
                          }}
                          style={{ margin: 0 }}
                        >
                          <FiX size={12} />
                          Cancel
                        </AddButton>
                      </div>
                    )}
                    
                    {showContactSuggestions && contactSearchTerm.length >= 2 && (
                      <SuggestionsContainer>
                        {contactSuggestions.map(suggestion => (
                          <SuggestionItem
                            key={suggestion.id}
                            onClick={() => handleAddContact(suggestion)}
                          >
                            {suggestion.first_name} {suggestion.last_name} {suggestion.email ? `(${suggestion.email})` : ''}
                          </SuggestionItem>
                        ))}
                        {contactSuggestions.length === 0 && contactSearchTerm.trim() && (
                          <SuggestionItem>
                            No matching contacts found
                          </SuggestionItem>
                        )}
                      </SuggestionsContainer>
                    )}
                  </>
                ) : (
                  // Read-only contacts section for other sources
                  <>
                    {data?.contacts && data.contacts.length > 0 ? (
                      <ContactsList>
                        {data.contacts.map(contact => {
                          if (!contact) return null;
                          return (
                            <Contact key={contact.id}>
                              <span>{contact.first_name} {contact.last_name}</span>
                            </Contact>
                          );
                        })}
                      </ContactsList>
                    ) : (
                      <FieldValue className="empty">No contacts available</FieldValue>
                    )}
                  </>
                )}
              </FieldGroup>
              
              {isSupabase && !data && (
                <SaveButton
                  onClick={handleSaveChanges}
                  disabled={saving || !editableData.name.trim()}
                  style={{ marginTop: '20px', width: '100%' }}
                >
                  {saving ? 'Creating...' : 'Create New Company'}
                </SaveButton>
              )}
            </>
          )}
        </CardBody>
      </DataCard>
    );
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
          width: '80%',
          height: '80%',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100
        }
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ModalHeader>
          <h2>Add Company</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>
        
        <SearchForm onSubmit={handleSubmit}>
          <SearchInput
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Enter company website (e.g., example.com)"
            required
          />
          <SearchButton type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </SearchButton>
        </SearchForm>
        
        {message.text && (
          <Message className={message.type}>
            {message.text}
          </Message>
        )}
        
        <ResultsGrid>
          {renderDataCard('Supabase', supabaseData, loading)}
          {renderDataCard('Airtable', airtableData, loading)}
          {renderDataCard('HubSpot', hubspotData, loading)}
        </ResultsGrid>
      </div>
    </Modal>
  );
};

export default AddCompanyModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);