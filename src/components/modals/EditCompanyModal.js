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
  color: ${props => props.$textColor || '#4b5563'};
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

const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
  overflow-x: auto;

  @media (max-width: 640px) {
    margin: -20px -20px 20px -20px;
    padding: 0 20px;
  }
`;

const Tab = styled.button`
  background: none;
  border: none;
  padding: 12px 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.$active ? '#3b82f6' : '#6b7280'};
  border-bottom: 3px solid ${props => props.$active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  position: relative;

  &:hover {
    color: #3b82f6;
    background-color: #f8fafc;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  @media (max-width: 640px) {
    padding: 10px 16px;
    font-size: 0.8rem;
  }
`;

const TabContent = styled.div`
  display: ${props => props.$active ? 'block' : 'none'};
  animation: ${props => props.$active ? 'fadeIn 0.2s ease-in' : 'none'};

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const NextButton = styled(Button)`
  margin-left: auto;

  &.next-button {
    background-color: #3b82f6;
    color: white;
    border: none;

    &:hover {
      background-color: #2563eb;
    }
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

// Company categories - matches database enum exactly
const COMPANY_CATEGORIES = [
  'Advisory',
  'Corporate',
  'Corporation',
  'Inbox',
  'Institution',
  'Media',
  'Not Set',
  'Professional Investor',
  'SME',
  'Skip',
  'Startup'
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

  // Handle null/undefined tag names
  if (!tagName || typeof tagName !== 'string') {
    return colors[0]; // Return first color as default
  }

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
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('basic');

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');
  const [companyCategory, setCompanyCategory] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');

  // Domains states (replacing single website)
  const [domains, setDomains] = useState([]);
  const [domainSearchTerm, setDomainSearchTerm] = useState('');

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

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Tab definitions
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: '📝' },
    { id: 'links', label: 'Links', icon: '🔗' },
    { id: 'related', label: 'Related', icon: '🏷️' }
  ];

  // Tab navigation helpers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].id);
    }
  };

  // Load company data when modal opens
  useEffect(() => {
    if (isOpen && company) {
      // Reset to first tab
      setActiveTab('basic');

      // Set basic company info
      setCompanyName(company.name || '');
      setCompanyLinkedin(company.linkedin || '');
      setCompanyCategory(company.category || '');
      setCompanyDescription(company.description || '');

      // Load domains from company_domains table
      loadCompanyDomains();

      // Load related data
      setTags(company.tags || []);
      setCities(company.cities || []);

      // Reset UI states
      setError('');
      setMessage({ type: '', text: '' });
    }
  }, [isOpen, company]);

  // Load company domains
  const loadCompanyDomains = async () => {
    if (!company?.company_id) return;

    try {
      const { data: domainsData, error: domainsError } = await supabase
        .from('company_domains')
        .select('id, domain, is_primary, created_at')
        .eq('company_id', company.company_id)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

      if (domainsError) throw domainsError;

      // Add the id field to each domain for tracking
      const processedDomains = (domainsData || []).map(d => ({
        ...d,
        isExisting: true // Flag to indicate this is from database
      }));

      setDomains(processedDomains);
    } catch (error) {
      console.error('Error loading company domains:', error);
      // Fallback to legacy website field if domains table fails
      if (company.website) {
        setDomains([{
          domain: company.website.replace(/^https?:\/\//, ''),
          is_primary: true,
          isLegacy: true // Flag to indicate this came from legacy field
        }]);
      }
    }
  };

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
          !tags.some(existingTag => (existingTag.tag_id || existingTag.id) === (tag.tag_id || tag.id))
        );
        
        setTagSuggestions(filteredSuggestions);
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
          !cities.some(existingCity => (existingCity.city_id || existingCity.id) === (city.city_id || city.id))
        );
        
        setCitySuggestions(filteredSuggestions);
        setShowCitySuggestions(filteredSuggestions.length > 0);
      } catch (error) {
        console.error('Error fetching city suggestions:', error);
      }
    };
    
    fetchCitySuggestions();
  }, [citySearchTerm, cities]);


  // Handle domain add/remove
  const handleAddDomain = () => {
    const domainToAdd = domainSearchTerm.trim();
    if (!domainToAdd) return;

    // Clean up the domain (remove protocol, trailing slash)
    const cleanDomain = domainToAdd.replace(/^https?:\/\//, '').replace(/\/$/, '');

    // Check if domain already exists
    if (domains.some(d => d.domain === cleanDomain)) {
      setError('Domain already exists');
      return;
    }

    const newDomain = {
      domain: cleanDomain,
      is_primary: domains.length === 0, // First domain is primary by default
      isNew: true // Flag to indicate this is a new domain
    };

    setDomains([...domains, newDomain]);
    setDomainSearchTerm('');
    setError(''); // Clear any previous errors
  };

  const handleRemoveDomain = (domainToRemove) => {
    const updatedDomains = domains.filter(d => d.domain !== domainToRemove.domain);

    // If we removed the primary domain, make the first remaining domain primary
    if (domainToRemove.is_primary && updatedDomains.length > 0) {
      updatedDomains[0].is_primary = true;
    }

    setDomains(updatedDomains);
  };

  const handleSetPrimaryDomain = (domainToMakePrimary) => {
    setDomains(domains.map(d => ({
      ...d,
      is_primary: d.domain === domainToMakePrimary.domain
    })));
  };

  // Handle tag add/remove
  const handleAddTag = async (tag) => {
    setTags([...tags, tag]);
    setTagSearchTerm('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId) => {
    setTags(tags.filter(tag => (tag.tag_id || tag.id) !== tagId));
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
    setCities(cities.filter(city => (city.city_id || city.id) !== cityId));
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
      
      let formattedLinkedin = companyLinkedin.trim();

      // Update company (remove website field since we now use company_domains)
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          name: companyName.trim(),
          linkedin: formattedLinkedin,
          category: companyCategory,
          description: companyDescription.trim(),
          last_modified_at: new Date()
        })
        .eq('company_id', company.company_id)
        .select();

      if (updateError) throw updateError;

      // Handle domains relationships
      // First, get existing domain relationships
      const { data: existingDomains, error: existingDomainsError } = await supabase
        .from('company_domains')
        .select('id, domain, is_primary')
        .eq('company_id', company.company_id);

      if (existingDomainsError) throw existingDomainsError;

      // Determine which domains to add, update, and remove
      const existingDomainsList = existingDomains.map(d => d.domain);
      const newDomainsList = domains.map(d => d.domain);

      const domainsToAdd = domains.filter(d => d.isNew && !existingDomainsList.includes(d.domain));
      const domainsToRemove = existingDomains.filter(d => !newDomainsList.includes(d.domain));
      const domainsToUpdate = domains.filter(d => d.isExisting && existingDomainsList.includes(d.domain));

      // Remove domains that are no longer associated
      if (domainsToRemove.length > 0) {
        const { error: removeDomainsError } = await supabase
          .from('company_domains')
          .delete()
          .eq('company_id', company.company_id)
          .in('id', domainsToRemove.map(d => d.id));

        if (removeDomainsError) throw removeDomainsError;
      }

      // Add new domains
      if (domainsToAdd.length > 0) {
        const domainConnections = domainsToAdd.map(domain => ({
          company_id: company.company_id,
          domain: domain.domain,
          is_primary: domain.is_primary
        }));

        const { error: addDomainsError } = await supabase
          .from('company_domains')
          .insert(domainConnections);

        if (addDomainsError) throw addDomainsError;
      }

      // Update existing domains (mainly for primary status changes)
      for (const domain of domainsToUpdate) {
        const existingDomain = existingDomains.find(d => d.domain === domain.domain);
        if (existingDomain && existingDomain.is_primary !== domain.is_primary) {
          const { error: updateDomainError } = await supabase
            .from('company_domains')
            .update({ is_primary: domain.is_primary })
            .eq('id', existingDomain.id);

          if (updateDomainError) throw updateDomainError;
        }
      }
      
      // Handle tags relationships
      // First, get existing tag relationships
      const { data: existingTags, error: existingTagsError } = await supabase
        .from('company_tags')
        .select('tag_id')
        .eq('company_id', company.company_id);
        
      if (existingTagsError) throw existingTagsError;
      
      // Determine which tags to add and which to remove
      const existingTagIds = existingTags.map(tag => tag.tag_id);
      const newTagIds = tags.map(tag => tag.tag_id || tag.id);

      const tagsToAdd = newTagIds.filter(id => !existingTagIds.includes(id));
      const tagsToRemove = existingTagIds.filter(id => !newTagIds.includes(id));

      // Remove tags that are no longer associated
      if (tagsToRemove.length > 0) {
        const { error: removeTagsError } = await supabase
          .from('company_tags')
          .delete()
          .eq('company_id', company.company_id)
          .in('tag_id', tagsToRemove);

        if (removeTagsError) throw removeTagsError;
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        const tagConnections = tagsToAdd.map(tagId => ({
          company_id: company.company_id,
          tag_id: tagId
        }));

        const { error: addTagsError } = await supabase
          .from('company_tags')
          .insert(tagConnections);

        if (addTagsError) throw addTagsError;
      }
      
      // Handle cities relationships
      // First, get existing city relationships
      const { data: existingCities, error: existingCitiesError } = await supabase
        .from('company_cities')
        .select('city_id')
        .eq('company_id', company.company_id);

      if (existingCitiesError) throw existingCitiesError;

      // Determine which cities to add and which to remove
      const existingCityIds = existingCities.map(city => city.city_id);
      const newCityIds = cities.map(city => city.city_id || city.id);

      const citiesToAdd = newCityIds.filter(id => !existingCityIds.includes(id));
      const citiesToRemove = existingCityIds.filter(id => !newCityIds.includes(id));

      // Remove cities that are no longer associated
      if (citiesToRemove.length > 0) {
        const { error: removeCitiesError } = await supabase
          .from('company_cities')
          .delete()
          .eq('company_id', company.company_id)
          .in('city_id', citiesToRemove);

        if (removeCitiesError) throw removeCitiesError;
      }

      // Add new cities
      if (citiesToAdd.length > 0) {
        const cityConnections = citiesToAdd.map(cityId => ({
          company_id: company.company_id,
          city_id: cityId
        }));

        const { error: addCitiesError } = await supabase
          .from('company_cities')
          .insert(cityConnections);

        if (addCitiesError) throw addCitiesError;
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
        
        {/* Tab Navigation */}
        <TabContainer>
          {tabs.map(tab => (
            <Tab
              key={tab.id}
              $active={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              type="button"
            >
              <span style={{ marginRight: '6px' }}>{tab.icon}</span>
              {tab.label}
            </Tab>
          ))}
        </TabContainer>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          <TabContent $active={activeTab === 'basic'}>
            <Section>
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
                  rows="4"
                />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <NextButton
                  type="button"
                  className="next-button"
                  onClick={handleNextTab}
                >
                  Next: Links →
                </NextButton>
              </div>
            </Section>
          </TabContent>

          {/* Links Tab */}
          <TabContent $active={activeTab === 'links'}>
            <Section>
              <SectionTitle>Domains</SectionTitle>

              {domains.length > 0 && (
                <ListContainer>
                  {domains.map((domain, index) => (
                    <ListItem key={`domain-${domain.domain}-${index}`}>
                      <ListItemText>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{domain.domain}</span>
                          {domain.is_primary && (
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#3b82f6',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '500'
                            }}>
                              Primary
                            </span>
                          )}
                        </div>
                      </ListItemText>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {!domain.is_primary && domains.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryDomain(domain)}
                            style={{
                              background: 'none',
                              border: '1px solid #d1d5db',
                              cursor: 'pointer',
                              color: '#6b7280',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            Set Primary
                          </button>
                        )}
                        <RemoveButton
                          onClick={() => handleRemoveDomain(domain)}
                          type="button"
                        >
                          ×
                        </RemoveButton>
                      </div>
                    </ListItem>
                  ))}
                </ListContainer>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <Input
                  type="text"
                  value={domainSearchTerm}
                  onChange={(e) => setDomainSearchTerm(e.target.value)}
                  placeholder="example.com"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDomain();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  type="button"
                  className="secondary"
                  onClick={handleAddDomain}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <FiPlus size={14} style={{ marginRight: '4px' }} />
                  Add
                </Button>
              </div>

              <FormGroup style={{ marginTop: '20px' }}>
                <Label htmlFor="companyLinkedin">LinkedIn</Label>
                <Input
                  id="companyLinkedin"
                  type="text"
                  value={companyLinkedin}
                  onChange={(e) => setCompanyLinkedin(e.target.value)}
                  placeholder="LinkedIn URL or username"
                />
              </FormGroup>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <Button
                  type="button"
                  className="secondary"
                  onClick={handlePrevTab}
                >
                  ← Back
                </Button>
                <NextButton
                  type="button"
                  className="next-button"
                  onClick={handleNextTab}
                >
                  Next: Related →
                </NextButton>
              </div>
            </Section>
          </TabContent>

          {/* Related Tab */}
          <TabContent $active={activeTab === 'related'}>
            <Section>
              <SectionTitle>Tags</SectionTitle>

              <TagsContainer>
                {tags.map((tag, index) => {
                  const color = getTagColor(tag.name);
                  const tagId = tag.tag_id || tag.id || index;
                  return (
                    <Tag
                      key={`tag-${tagId}-${index}`}
                      color={color.bg}
                      $textColor={color.text}
                    >
                      {tag.name}
                      <TagRemoveButton
                        onClick={() => handleRemoveTag(tagId)}
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
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                />

                {showTagSuggestions && (
                  <SuggestionsContainer>
                    {tagSuggestions.map((tag, index) => (
                      <Suggestion
                        key={`suggestion-${tag.id || tag.tag_id}-${index}`}
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

            <Section style={{ marginTop: '30px' }}>
              <SectionTitle>Cities</SectionTitle>

              {cities.length > 0 && (
                <ListContainer>
                  {cities.map((city, index) => {
                    const cityId = city.city_id || city.id || index;
                    return (
                      <ListItem key={`city-${cityId}-${index}`}>
                        <ListItemText>
                          {getFlagEmoji(city.name) && (
                            <span style={{ marginRight: '5px' }}>
                              {getFlagEmoji(city.name)}
                            </span>
                          )}
                          {city.name}
                        </ListItemText>
                        <RemoveButton
                          onClick={() => handleRemoveCity(cityId)}
                          type="button"
                        >
                          ×
                        </RemoveButton>
                      </ListItem>
                    );
                  })}
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
                    {citySuggestions.map((city, index) => (
                      <Suggestion
                        key={`city-suggestion-${city.city_id || city.id}-${index}`}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
              <Button
                type="button"
                className="secondary"
                onClick={handlePrevTab}
              >
                ← Back
              </Button>
            </div>
          </TabContent>

          <ButtonGroup style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
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