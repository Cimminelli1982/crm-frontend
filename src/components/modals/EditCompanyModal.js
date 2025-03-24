import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiSearch, FiEdit } from 'react-icons/fi';
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ErrorMessage = styled.div`
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 6px;
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
      background-color: #333333;
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

const Section = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 12px;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  font-size: 0.75rem;
  border-radius: 9999px;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#4b5563'};
  font-weight: 500;
`;

const TagRemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  display: flex;
  align-items: center;
`;

const TagInput = styled.div`
  position: relative;
  margin-top: 8px;
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: white;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
`;

const Suggestion = styled.div`
  padding: 8px 12px;
  font-size: 0.875rem;
  cursor: pointer;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const NewTagButton = styled.div`
  padding: 8px 12px;
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: #f3f4f6;
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
`;

const ListContainer = styled.div`
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
`;

const ListItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const ListItemText = styled.div`
  font-size: 0.875rem;
  color: #1f2937;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #ef4444;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background-color: #fee2e2;
  }
`;

// Company categories
const COMPANY_CATEGORIES = [
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

// Helper function to get tag colors - for consistent coloring
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

// Helper function to get city flag emoji
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
  const countryCode = cityCountryMap[cityName] || 'unknown';
  
  // If unknown, return the city name without a flag
  if (countryCode === 'unknown') {
    return null;
  }
  
  // Convert country code to flag emoji
  return countryCode
    .toUpperCase()
    .replace(/./g, char => 
      String.fromCodePoint(char.charCodeAt(0) + 127397)
    );
};

const EditCompanyModal = ({ isOpen, onRequestClose, company }) => {
  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companyCategory, setCompanyCategory] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  
  // Tags states
  const [tags, setTags] = useState([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Cities states
  const [cities, setCities] = useState([]);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  
  // Contacts states
  const [contacts, setContacts] = useState([]);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [contactSuggestions, setContactSuggestions] = useState([]);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load company data when modal opens
  useEffect(() => {
    if (isOpen && company) {
      // Set basic company info
      setCompanyName(company.name || '');
      setCompanyWebsite(company.website || '');
      setCompanyLinkedin(company.linkedin || '');
      setCompanyCategory(company.category || '');
      setCompanyDescription(company.description || '');
      
      // Load related data
      setTags(company.tags || []);
      setCities(company.cities || []);
      setContacts(company.contacts || []);
      
      // Reset UI states
      setError('');
      setMessage({ type: '', text: '' });
    }
  }, [isOpen, company]);

  // Handle tag search
  useEffect(() => {
    const fetchTagSuggestions = async () => {
      if (!tagSearchTerm || tagSearchTerm.length < 2) {
        setTagSuggestions([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .ilike('name', `%${tagSearchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out already added tags
        const filteredSuggestions = data.filter(tag => 
          !tags.some(existingTag => existingTag.id === tag.id)
        );
        
        setTagSuggestions(filteredSuggestions);
        setShowTagSuggestions(filteredSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
      }
    };
    
    fetchTagSuggestions();
  }, [tagSearchTerm, tags]);

  // Handle city search
  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (!citySearchTerm || citySearchTerm.length < 2) {
        setCitySuggestions([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('*')
          .ilike('name', `%${citySearchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out already added cities
        const filteredSuggestions = data.filter(city => 
          !cities.some(existingCity => existingCity.id === city.id)
        );
        
        setCitySuggestions(filteredSuggestions);
        setShowCitySuggestions(filteredSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      }
    };
    
    fetchCitySuggestions();
  }, [citySearchTerm, cities]);

  // Handle contact search
  useEffect(() => {
    const fetchContactSuggestions = async () => {
      if (!contactSearchTerm || contactSearchTerm.length < 2) {
        setContactSuggestions([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .or(`first_name.ilike.%${contactSearchTerm}%,last_name.ilike.%${contactSearchTerm}%,email.ilike.%${contactSearchTerm}%`)
          .limit(10);
          
        if (error) throw error;
        
        // Filter out already added contacts
        const filteredSuggestions = data.filter(contact => 
          !contacts.some(existingContact => existingContact.id === contact.id)
        );
        
        setContactSuggestions(filteredSuggestions);
        setShowContactSuggestions(filteredSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching contact suggestions:', error);
      }
    };
    
    fetchContactSuggestions();
  }, [contactSearchTerm, contacts]);
  
  // Handle tag add/remove
  const handleAddTag = async (tag) => {
    setTags([...tags, tag]);
    setTagSearchTerm('');
    setShowTagSuggestions(false);
  };
  
  const handleRemoveTag = (tagId) => {
    setTags(tags.filter(tag => tag.id !== tagId));
  };
  
  const handleCreateTag = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: tagSearchTerm.trim() })
        .select()
        .single();
        
      if (error) throw error;
      
      handleAddTag(data);
    } catch (error) {
      console.error('Error creating tag:', error);
      setError('Failed to create tag: ' + error.message);
    }
  };
  
  // Handle city add/remove
  const handleAddCity = (city) => {
    setCities([...cities, city]);
    setCitySearchTerm('');
    setShowCitySuggestions(false);
  };
  
  const handleRemoveCity = (cityId) => {
    setCities(cities.filter(city => city.id !== cityId));
  };
  
  const handleCreateCity = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .insert({ name: citySearchTerm.trim() })
        .select()
        .single();
        
      if (error) throw error;
      
      handleAddCity(data);
    } catch (error) {
      console.error('Error creating city:', error);
      setError('Failed to create city: ' + error.message);
    }
  };
  
  // Handle contact add/remove
  const handleAddContact = (contact) => {
    setContacts([...contacts, contact]);
    setContactSearchTerm('');
    setShowContactSuggestions(false);
  };
  
  const handleRemoveContact = (contactId) => {
    setContacts(contacts.filter(contact => contact.id !== contactId));
  };
  
  // Format contact name for display
  const formatContactName = (contact) => {
    if (!contact) return "";
    return `${contact.first_name || ""} ${contact.last_name || ""}`.trim() || contact.email || "Unknown";
  };

  // Save the company
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    
    if (!companyCategory) {
      setError('Company category is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Format website and LinkedIn URLs if provided
      let formattedWebsite = companyWebsite.trim();
      if (formattedWebsite && !formattedWebsite.match(/^https?:\/\//)) {
        formattedWebsite = 'https://' + formattedWebsite;
      }
      
      let formattedLinkedin = companyLinkedin.trim();
      
      // Update company
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          name: companyName.trim(),
          website: formattedWebsite,
          linkedin: formattedLinkedin,
          category: companyCategory,
          description: companyDescription.trim(),
          modified_at: new Date()
        })
        .eq('id', company.id)
        .select();
        
      if (updateError) throw updateError;
      
      // Handle tags relationships
      // First, get existing tag relationships
      const { data: existingTags, error: existingTagsError } = await supabase
        .from('companies_tags')
        .select('tag_id')
        .eq('company_id', company.id);
        
      if (existingTagsError) throw existingTagsError;
      
      // Determine which tags to add and which to remove
      const existingTagIds = existingTags.map(tag => tag.tag_id);
      const newTagIds = tags.map(tag => tag.id);
      
      const tagsToAdd = newTagIds.filter(id => !existingTagIds.includes(id));
      const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));
      
      // Remove tags that are no longer associated
      if (tagsToRemove.length > 0) {
        const { error: removeTagsError } = await supabase
          .from('companies_tags')
          .delete()
          .eq('company_id', company.id)
          .in('tag_id', tagsToRemove);
          
        if (removeTagsError) throw removeTagsError;
      }
      
      // Add new tags
      if (tagsToAdd.length > 0) {
        const tagConnections = tagsToAdd.map(tagId => ({
          company_id: company.id,
          tag_id: tagId
        }));
        
        const { error: addTagsError } = await supabase
          .from('companies_tags')
          .insert(tagConnections);
          
        if (addTagsError) throw addTagsError;
      }
      
      // Handle cities relationships
      // First, get existing city relationships
      const { data: existingCities, error: existingCitiesError } = await supabase
        .from('companies_cities')
        .select('city_id')
        .eq('company_id', company.id);
        
      if (existingCitiesError) throw existingCitiesError;
      
      // Determine which cities to add and which to remove
      const existingCityIds = existingCities.map(city => city.city_id);
      const newCityIds = cities.map(city => city.id);
      
      const citiesToAdd = newCityIds.filter(id => !existingCityIds.includes(id));
      const citiesToRemove = existingCityIds.filter(id => !newCityIds.includes(id));
      
      // Remove cities that are no longer associated
      if (citiesToRemove.length > 0) {
        const { error: removeCitiesError } = await supabase
          .from('companies_cities')
          .delete()
          .eq('company_id', company.id)
          .in('city_id', citiesToRemove);
          
        if (removeCitiesError) throw removeCitiesError;
      }
      
      // Add new cities
      if (citiesToAdd.length > 0) {
        const cityConnections = citiesToAdd.map(cityId => ({
          company_id: company.id,
          city_id: cityId
        }));
        
        const { error: addCitiesError } = await supabase
          .from('companies_cities')
          .insert(cityConnections);
          
        if (addCitiesError) throw addCitiesError;
      }
      
      // Handle contacts relationships
      // First, get existing contact relationships
      const { data: existingContacts, error: existingContactsError } = await supabase
        .from('contact_companies')
        .select('contact_id')
        .eq('company_id', company.id);
        
      if (existingContactsError) throw existingContactsError;
      
      // Determine which contacts to add and which to remove
      const existingContactIds = existingContacts.map(contact => contact.contact_id);
      const newContactIds = contacts.map(contact => contact.id);
      
      const contactsToAdd = newContactIds.filter(id => !existingContactIds.includes(id));
      const contactsToRemove = existingContactIds.filter(id => !newContactIds.includes(id));
      
      // Remove contacts that are no longer associated
      if (contactsToRemove.length > 0) {
        const { error: removeContactsError } = await supabase
          .from('contact_companies')
          .delete()
          .eq('company_id', company.id)
          .in('contact_id', contactsToRemove);
          
        if (removeContactsError) throw removeContactsError;
      }
      
      // Add new contacts
      if (contactsToAdd.length > 0) {
        const contactConnections = contactsToAdd.map(contactId => ({
          company_id: company.id,
          contact_id: contactId
        }));
        
        const { error: addContactsError } = await supabase
          .from('contact_companies')
          .insert(contactConnections);
          
        if (addContactsError) throw addContactsError;
      }
      
      setMessage({ type: 'success', text: 'Company updated successfully' });
      
      // Wait a moment to show the success message before closing
      setTimeout(() => {
        onRequestClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error updating company:', error);
      setError('Failed to update company: ' + error.message);
    } finally {
      setLoading(false);
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
          maxWidth: '700px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Edit Company: {company?.name}</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {message.text && <Message className={message.type}>{message.text}</Message>}
        
        <form onSubmit={handleSubmit}>
          <Section>
            <SectionTitle>Basic Information</SectionTitle>
            
            <FormGroup>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="companyCategory">Category *</Label>
              <Select 
                id="companyCategory"
                value={companyCategory}
                onChange={(e) => setCompanyCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {COMPANY_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </Select>
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="companyDescription">Description</Label>
              <TextArea
                id="companyDescription"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Enter company description"
              />
            </FormGroup>
          </Section>
          
          <Section>
            <SectionTitle>Links</SectionTitle>
            
            <FormGroup>
              <Label htmlFor="companyWebsite">Website</Label>
              <Input
                id="companyWebsite"
                type="text"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </FormGroup>
            
            <FormGroup>
              <Label htmlFor="companyLinkedin">LinkedIn</Label>
              <Input
                id="companyLinkedin"
                type="text"
                value={companyLinkedin}
                onChange={(e) => setCompanyLinkedin(e.target.value)}
                placeholder="LinkedIn URL or username"
              />
            </FormGroup>
          </Section>
          
          <Section>
            <SectionTitle>Tags</SectionTitle>
            
            <TagsContainer>
              {tags.map(tag => {
                const color = getTagColor(tag.name);
                return (
                  <Tag 
                    key={tag.id} 
                    color={color.bg}
                    textColor={color.text}
                  >
                    {tag.name}
                    <TagRemoveButton 
                      onClick={() => handleRemoveTag(tag.id)}
                      type="button"
                    >
                      ×
                    </TagRemoveButton>
                  </Tag>
                );
              })}
            </TagsContainer>
            
            <TagInput>
              <Input
                type="text"
                value={tagSearchTerm}
                onChange={(e) => setTagSearchTerm(e.target.value)}
                placeholder="Search for tags or add new ones"
                onFocus={() => {
                  if (tagSuggestions.length > 0) {
                    setShowTagSuggestions(true);
                  }
                }}
              />
              
              {showTagSuggestions && (
                <SuggestionsContainer>
                  {tagSuggestions.map(tag => (
                    <Suggestion 
                      key={tag.id}
                      onClick={() => handleAddTag(tag)}
                    >
                      {tag.name}
                    </Suggestion>
                  ))}
                  
                  {tagSearchTerm.trim() && !tagSuggestions.some(tag => 
                    tag.name.toLowerCase() === tagSearchTerm.toLowerCase()
                  ) && (
                    <NewTagButton onClick={handleCreateTag}>
                      <FiPlus size={14} />
                      Create "{tagSearchTerm}"
                    </NewTagButton>
                  )}
                </SuggestionsContainer>
              )}
            </TagInput>
          </Section>
          
          <Section>
            <SectionTitle>Cities</SectionTitle>
            
            {cities.length > 0 && (
              <ListContainer>
                {cities.map(city => (
                  <ListItem key={city.id}>
                    <ListItemText>
                      {getFlagEmoji(city.name) && (
                        <span style={{ marginRight: '5px' }}>
                          {getFlagEmoji(city.name)}
                        </span>
                      )}
                      {city.name}
                    </ListItemText>
                    <RemoveButton 
                      onClick={() => handleRemoveCity(city.id)}
                      type="button"
                    >
                      ×
                    </RemoveButton>
                  </ListItem>
                ))}
              </ListContainer>
            )}
            
            <TagInput>
              <Input
                type="text"
                value={citySearchTerm}
                onChange={(e) => setCitySearchTerm(e.target.value)}
                placeholder="Search for cities or add new ones"
                onFocus={() => {
                  if (citySuggestions.length > 0) {
                    setShowCitySuggestions(true);
                  }
                }}
              />
              
              {showCitySuggestions && (
                <SuggestionsContainer>
                  {citySuggestions.map(city => (
                    <Suggestion 
                      key={city.id}
                      onClick={() => handleAddCity(city)}
                    >
                      {getFlagEmoji(city.name) && (
                        <span style={{ marginRight: '5px' }}>
                          {getFlagEmoji(city.name)}
                        </span>
                      )}
                      {city.name}
                    </Suggestion>
                  ))}
                  
                  {citySearchTerm.trim() && !citySuggestions.some(city => 
                    city.name.toLowerCase() === citySearchTerm.toLowerCase()
                  ) && (
                    <NewTagButton onClick={handleCreateCity}>
                      <FiPlus size={14} />
                      Create "{citySearchTerm}"
                    </NewTagButton>
                  )}
                </SuggestionsContainer>
              )}
            </TagInput>
          </Section>
          
          <Section>
            <SectionTitle>Associated Contacts</SectionTitle>
            
            {contacts.length > 0 && (
              <ListContainer>
                {contacts.map(contact => (
                  <ListItem key={contact.id}>
                    <ListItemText>
                      {formatContactName(contact)}
                    </ListItemText>
                    <RemoveButton 
                      onClick={() => handleRemoveContact(contact.id)}
                      type="button"
                    >
                      ×
                    </RemoveButton>
                  </ListItem>
                ))}
              </ListContainer>
            )}
            
            <TagInput>
              <Input
                type="text"
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                placeholder="Search for contacts"
                onFocus={() => {
                  if (contactSuggestions.length > 0) {
                    setShowContactSuggestions(true);
                  }
                }}
              />
              
              {showContactSuggestions && (
                <SuggestionsContainer>
                  {contactSuggestions.map(contact => (
                    <Suggestion 
                      key={contact.id}
                      onClick={() => handleAddContact(contact)}
                    >
                      {formatContactName(contact)}
                      {contact.email && (
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {contact.email}
                        </div>
                      )}
                    </Suggestion>
                  ))}
                </SuggestionsContainer>
              )}
            </TagInput>
          </Section>
          
          <ButtonGroup>
            <Button 
              type="button" 
              className="secondary" 
              onClick={onRequestClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </ButtonGroup>
        </form>
      </div>
    </Modal>
  );
};

export default EditCompanyModal;