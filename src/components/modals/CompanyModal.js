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

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 12px;
`;

const CompaniesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding: 5px 0;
  min-height: 32px;
`;

const CompanyTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background-color: ${props => props.color || '#e0f2fe'};
  color: ${props => props.textColor || '#0369a1'};
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

const NewCompanyButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: #f3f4f6;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5e7eb;
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
    background-color: #3b82f6;
    color: white;
    border: none;

    &:hover {
      background-color: #2563eb;
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

// Add new styled components for the form fields
const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TagsSection = styled(Section)`
  margin-top: 20px;
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
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#374151'};
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

const NewTagButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background-color: #f3f4f6;
  cursor: pointer;
  font-size: 0.875rem;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e5e7eb;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
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

// Categories array
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

// New Company Modal for creating new companies
const NewCompanyModal = ({ isOpen, onClose, onSave }) => {
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyCategory, setCompanyCategory] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCompanyName('');
      setCompanyWebsite('');
      setCompanyCategory('');
      setCompanyDescription('');
      setSelectedTags([]);
      setSearchTerm('');
      setError('');
    }
  }, [isOpen]);

  // Fetch tag suggestions
  const fetchTagSuggestions = async (search) => {
    try {
      if (!search || search.length < 3) {
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
    fetchTagSuggestions(searchTerm);
  }, [searchTerm]);

  const handleAddTag = async (tag) => {
    setSelectedTags([...selectedTags, tag]);
    setSearchTerm('');
    setShowTagSuggestions(false);
  };

  const handleRemoveTag = (tagId) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };

  const handleCreateTag = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: searchTerm.trim() })
        .select()
        .single();

      if (error) throw error;

      handleAddTag(data);
    } catch (err) {
      console.error('Error creating new tag:', err);
      setError('Failed to create new tag');
    }
  };

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
    if (!companyDescription.trim()) {
      setError('Company description is required');
      return;
    }

    try {
      setLoading(true);

      // Format website URL if provided
      let formattedWebsite = companyWebsite.trim();
      if (formattedWebsite && !formattedWebsite.match(/^https?:\/\//)) {
        formattedWebsite = 'https://' + formattedWebsite;
      }

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName.trim(),
          website: formattedWebsite,
          category: companyCategory,
          description: companyDescription.trim()
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // Add tags if any
      if (selectedTags.length > 0) {
        const tagConnections = selectedTags.map(tag => ({
          company_id: company.id,
          tag_id: tag.id
        }));

        const { error: tagsError } = await supabase
          .from('companies_tags')
          .insert(tagConnections);

        if (tagsError) throw tagsError;
      }

      onSave(company);
      onClose();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Failed to create company. Please try again.');
    } finally {
      setLoading(false);
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
          border: 'none',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1100
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Create New Company</h2>
          <button onClick={onClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
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
            <Label htmlFor="companyWebsite">Website</Label>
            <Input
              id="companyWebsite"
              type="text"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="www.example.com"
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
              <option value="">Select a category...</option>
              {COMPANY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="companyDescription">Description *</Label>
            <TextArea
              id="companyDescription"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              placeholder="Enter company description..."
              required
            />
          </FormGroup>

          <TagsSection>
            <SectionTitle>Tags</SectionTitle>
            <TagsList>
              {selectedTags.map(tag => {
                const color = getTagColor(tag.name);
                return (
                  <Tag 
                    key={tag.id} 
                    color={color.bg}
                    textColor={color.text}
                  >
                    <span>{tag.name}</span>
                    <button onClick={() => handleRemoveTag(tag.id)}>
                      <FiX size={14} />
                    </button>
                  </Tag>
                );
              })}
            </TagsList>

            <SearchContainer>
              <SearchIcon>
                <FiSearch size={16} />
              </SearchIcon>
              <SearchInput
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or create new tag..."
                onFocus={() => setShowTagSuggestions(true)}
              />
            </SearchContainer>

            {showTagSuggestions && searchTerm.length >= 3 && (
              <SuggestionsContainer>
                {tagSuggestions.map(suggestion => (
                  <SuggestionItem
                    key={suggestion.id}
                    onClick={() => handleAddTag(suggestion)}
                  >
                    {suggestion.name}
                  </SuggestionItem>
                ))}
                {searchTerm.trim() && !tagSuggestions.find(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
                  <NewTagButton
                    onClick={handleCreateTag}
                    disabled={loading}
                  >
                    <FiPlus size={14} />
                    Create "{searchTerm}"
                  </NewTagButton>
                )}
              </SuggestionsContainer>
            )}
          </TagsSection>

          {error && (
            <Message className="error">
              {error}
            </Message>
          )}

          <ButtonGroup>
            <Button 
              type="button" 
              className="secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Company'}
            </Button>
          </ButtonGroup>
        </form>
      </div>
    </Modal>
  );
};

// Helper function to get company colors - using a consistent blue palette for companies
const getCompanyColor = () => {
  return { bg: '#e0f2fe', text: '#0369a1' }; // Sky blue
};

const CompanyModal = ({ isOpen, onRequestClose, contact }) => {
  const [relatedCompanies, setRelatedCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);

  // Fetch related companies for the contact
  const fetchRelatedCompanies = async () => {
    try {
      console.log('Fetching related companies for contact ID:', contact.id);
      
      // First check if the contact_companies table exists
      const { count, error: checkError } = await supabase
        .from('contact_companies')
        .select('*', { count: 'exact', head: true });
      
      if (checkError) {
        console.error('Error checking contact_companies table:', checkError);
        setMessage({ type: 'error', text: 'Error accessing the database' });
        return;
      }
      
      console.log('contact_companies table exists, fetching relationships');
      
      // Use a more explicit join syntax
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          id, 
          contact_id,
          company_id,
          companies:company_id (
            id, 
            name, 
            website
          )
        `)
        .eq('contact_id', contact.id);

      if (error) {
        console.error('Error fetching related companies:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('Related companies data:', data);
      
      if (!data || data.length === 0) {
        console.log('No related companies found for this contact');
        setRelatedCompanies([]);
        return;
      }
      
      // Transform the data
      const transformedData = data.map(item => {
        // Check if companies is an object or just an ID
        if (item.companies && typeof item.companies === 'object') {
          return {
            id: item.id,
            company_id: item.company_id,
            name: item.companies.name,
            website: item.companies.website
          };
        } else {
          // If company_id is just an ID, we need to fetch the company details
          console.log('Got company ID without details, need to fetch company:', item.company_id);
          return {
            id: item.id,
            company_id: item.company_id,
            name: 'Loading...',
            website: ''
          };
        }
      });
      
      setRelatedCompanies(transformedData);
      
      // If any companies are missing details, fetch them
      const missingDetailCompanies = transformedData.filter(company => company.name === 'Loading...');
      if (missingDetailCompanies.length > 0) {
        fetchMissingCompanyDetails(missingDetailCompanies);
      }
    } catch (error) {
      console.error('Error fetching related companies:', error);
      setMessage({ type: 'error', text: 'Failed to load companies' });
    }
  };
  
  // Helper function to fetch missing company details
  const fetchMissingCompanyDetails = async (companiesWithMissingDetails) => {
    try {
      const companyIds = companiesWithMissingDetails.map(company => company.company_id);
      console.log('Fetching details for companies:', companyIds);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .in('id', companyIds);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Update the related companies with the fetched details
        setRelatedCompanies(prevCompanies => {
          const updatedCompanies = [...prevCompanies];
          data.forEach(companyData => {
            const index = updatedCompanies.findIndex(company => company.company_id === companyData.id);
            if (index !== -1) {
              updatedCompanies[index] = {
                ...updatedCompanies[index],
                name: companyData.name,
                website: companyData.website
              };
            }
          });
          return updatedCompanies;
        });
      }
    } catch (error) {
      console.error('Error fetching missing company details:', error);
    }
  };

  // Fetch company suggestions based on search term
  const fetchCompanySuggestions = async (search) => {
    try {
      if (search.length < 3) {
        setSuggestions([]);
        return;
      }

      let query = supabase.from('companies').select('*');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      // Filter out companies that are already connected
      const filteredSuggestions = data.filter(company => 
        !relatedCompanies.some(related => related.company_id === company.id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching company suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && contact) {
      fetchRelatedCompanies();
    }
  }, [isOpen, contact]);

  useEffect(() => {
    // Only search when at least 3 characters are entered
    if (searchTerm.length >= 3) {
      fetchCompanySuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleUnlinkCompany = async (companyToRemove) => {
    try {
      setLoading(true);
      console.log('Unlinking company from contact:', {
        contact_id: contact.id,
        company_id: companyToRemove.company_id,
        relation_id: companyToRemove.id,
        company_name: companyToRemove.name
      });
      
      const { data, error } = await supabase
        .from('contact_companies')
        .delete()
        .eq('id', companyToRemove.id)
        .select();

      if (error) {
        console.error('Error unlinking company:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('Company unlinked successfully, response:', data);
      
      setRelatedCompanies(relatedCompanies.filter(company => company.id !== companyToRemove.id));
      setMessage({ type: 'success', text: 'Company unlinked successfully' });
    } catch (error) {
      console.error('Error unlinking company:', error);
      setMessage({ type: 'error', text: `Failed to unlink company: ${error.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (companyToAdd) => {
    try {
      setLoading(true);
      console.log('Adding company to contact:', {
        contact_id: contact.id,
        company_id: companyToAdd.id,
        company_name: companyToAdd.name
      });
      
      // First check if this association already exists
      const { data: existingCheck, error: checkError } = await supabase
        .from('contact_companies')
        .select('id')
        .eq('contact_id', contact.id)
        .eq('company_id', companyToAdd.id);
        
      if (checkError) {
        console.error('Error checking existing company relation:', checkError);
        throw checkError;
      }
      
      if (existingCheck && existingCheck.length > 0) {
        console.log('Association already exists', existingCheck);
        setMessage({ type: 'info', text: 'This company is already linked to the contact' });
        setLoading(false);
        return;
      }
      
      // Add connection in contact_companies table
      const { data, error } = await supabase
        .from('contact_companies')
        .insert({
          contact_id: contact.id,
          company_id: companyToAdd.id
        })
        .select();

      if (error) {
        console.error('Error linking company:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }
      
      console.log('Company linked successfully, response:', data);

      // Refresh related companies
      await fetchRelatedCompanies();
      
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'Company linked successfully' });
    } catch (error) {
      console.error('Error linking company:', error);
      setMessage({ type: 'error', text: `Failed to link company: ${error.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCompany = (newCompany) => {
    // Add the newly created company to the contact
    handleAddCompany(newCompany);
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

  // Helper function to check the database table structure
  const checkDatabaseStructure = async () => {
    try {
      setLoading(true);
      setMessage({ type: 'info', text: 'Checking database structure...' });
      
      // Check contact_companies table
      console.log('Checking contact_companies table structure...');
      const { data: contactCompaniesData, error: contactCompaniesError } = await supabase
        .from('contact_companies')
        .select('*')
        .limit(1);
        
      if (contactCompaniesError) {
        console.error('Error accessing contact_companies table:', contactCompaniesError);
        setMessage({ type: 'error', text: 'Error accessing contact_companies table' });
        return;
      }
      
      console.log('contact_companies sample:', contactCompaniesData);
      
      // Check companies table
      console.log('Checking companies table structure...');
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .limit(1);
        
      if (companiesError) {
        console.error('Error accessing companies table:', companiesError);
        setMessage({ type: 'error', text: 'Error accessing companies table' });
        return;
      }
      
      console.log('companies sample:', companiesData);
      
      // Try to join tables
      console.log('Testing join between tables...');
      const { data: joinData, error: joinError } = await supabase
        .from('contact_companies')
        .select('*, company:company_id(*)')
        .limit(1);
        
      if (joinError) {
        console.error('Error joining tables:', joinError);
        setMessage({ type: 'error', text: 'Error joining tables' });
        return;
      }
      
      console.log('Join result:', joinData);
      
      setMessage({ type: 'success', text: 'Database structure check completed. See console for details.' });
    } catch (error) {
      console.error('Error checking database structure:', error);
      setMessage({ type: 'error', text: 'Error checking database structure' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            <h2>Manage Companies</h2>
            <button onClick={onRequestClose} aria-label="Close modal">
              <FiX size={20} />
            </button>
          </ModalHeader>

          <Section>
            <SectionTitle>Related Companies</SectionTitle>
            <CompaniesList>
              {relatedCompanies.map(company => {
                const color = getCompanyColor();
                return (
                  <CompanyTag 
                    key={company.id} 
                    color={color.bg}
                    textColor={color.text}
                  >
                    <span title={company.name}>{company.name.length > 25 ? `${company.name.substring(0, 25)}...` : company.name}</span>
                    <button 
                      onClick={() => handleUnlinkCompany(company)}
                      disabled={loading}
                      title="Unlink company"
                    >
                      <FiX size={14} />
                    </button>
                  </CompanyTag>
                );
              })}
              {relatedCompanies.length === 0 && (
                <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                  No companies linked
                </span>
              )}
            </CompaniesList>
          </Section>

          <Section>
            <SectionTitle>Add Companies</SectionTitle>
            <SearchContainer>
              <SearchIcon>
                <FiSearch size={16} />
              </SearchIcon>
              <SearchInput
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for a company (type at least 3 letters)..."
              />
            </SearchContainer>

            {showSuggestions && (
              <SuggestionsContainer>
                {suggestions.map(suggestion => (
                  <SuggestionItem
                    key={suggestion.id}
                    onClick={() => handleAddCompany(suggestion)}
                    disabled={loading}
                  >
                    {suggestion.name}
                    {suggestion.website && (
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        {suggestion.website}
                      </span>
                    )}
                  </SuggestionItem>
                ))}
                {suggestions.length === 0 && searchTerm.length >= 3 && (
                  <div style={{ padding: '8px 12px', color: '#6c757d', fontSize: '0.875rem' }}>
                    No companies found
                  </div>
                )}
                {searchTerm.length >= 3 && (
                  <NewCompanyButton
                    onClick={() => setShowNewCompanyModal(true)}
                    disabled={loading}
                  >
                    <FiPlus size={14} />
                    Create new company
                  </NewCompanyButton>
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
            {process.env.NODE_ENV === 'development' && (
              <Button 
                className="secondary" 
                onClick={checkDatabaseStructure}
                disabled={loading}
              >
                Debug DB
              </Button>
            )}
          </ButtonGroup>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <div className="spinner" style={{ 
                width: '20px', 
                height: '20px', 
                border: '3px solid #f3f3f3', 
                borderTop: '3px solid #007BFF', 
                borderRadius: '50%', 
                animation: 'spin 1s linear infinite' 
              }}></div>
            </div>
          )}
        </div>
      </Modal>

      {/* New Company Modal */}
      <NewCompanyModal 
        isOpen={showNewCompanyModal}
        onClose={() => setShowNewCompanyModal(false)}
        onSave={handleCreateCompany}
      />
    </>
  );
};

export default CompanyModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 