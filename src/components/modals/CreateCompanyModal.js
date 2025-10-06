import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { FiX, FiSave, FiCheck, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Styled components with theme support
const ModalContainer = styled.div`
  width: 100%;
  max-width: 600px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#E5E7EB' : '#374151')
    : '#333'};
`;

const Title = styled.h2`
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : '#fff'};
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#6B7280' : '#9CA3AF')
    : '#00ff00'};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 5px;
  border-radius: 4px;

  &:hover {
    background: ${props => props.$isNewCrm
      ? (props.theme === 'light' ? '#F3F4F6' : '#374151')
      : '#333'};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#374151' : '#D1D5DB')
    : '#00ff00'};
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#FFFFFF' : '#374151')
    : '#333'};
  border: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
    : '#444'};
  border-radius: 4px;
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : '#fff'};
  font-size: 14px;
  height: 40px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.$isNewCrm
      ? '#3B82F6'
      : '#00ff00'};
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#FFFFFF' : '#374151')
    : '#333'};
  border: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
    : '#444'};
  border-radius: 4px;
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : '#fff'};
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${props => props.$isNewCrm
      ? '#3B82F6'
      : '#00ff00'};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#FFFFFF' : '#374151')
    : '#333'};
  border: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
    : '#444'};
  border-radius: 4px;
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : '#fff'};
  font-size: 14px;
  height: 40px;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%23aaa' stroke-width='1.5' viewBox='0 0 10 6'><polyline points='1,1 5,5 9,1'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;

  &:focus {
    outline: none;
    border-color: ${props => props.$isNewCrm
      ? '#3B82F6'
      : '#00ff00'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: ${props => props.$isNewCrm ? '8px' : '4px'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &.primary {
    background: ${props => props.$isNewCrm
      ? '#3B82F6'
      : '#333'};
    color: ${props => props.$isNewCrm
      ? '#FFFFFF'
      : '#00ff00'};
    border: 1px solid ${props => props.$isNewCrm
      ? '#3B82F6'
      : '#00ff00'};

    &:hover {
      background: ${props => props.$isNewCrm
        ? '#2563EB'
        : '#444'};
    }
  }

  &.cancel {
    background: ${props => props.$isNewCrm
      ? (props.theme === 'light' ? '#F3F4F6' : '#374151')
      : 'transparent'};
    color: ${props => props.$isNewCrm
      ? (props.theme === 'light' ? '#374151' : '#F9FAFB')
      : '#fff'};
    border: 1px solid ${props => props.$isNewCrm
      ? (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
      : '#555'};

    &:hover {
      background: ${props => props.$isNewCrm
        ? (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
        : '#333'};
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid ${props => props.$isNewCrm
    ? '#3B82F6'
    : '#00ff00'};
  border-radius: 4px;
  color: ${props => props.$isNewCrm
    ? '#3B82F6'
    : '#00ff00'};
  font-size: 12px;
`;

const TagButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: ${props => props.$isNewCrm
    ? '#6B7280'
    : '#00ff00'};
  cursor: pointer;
  padding: 2px;

  &:hover {
    color: ${props => props.$isNewCrm
      ? '#EF4444'
      : '#ff5555'};
  }
`;

const TagsSearchInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#FFFFFF' : '#374151')
    : '#333'};
  border: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
    : '#444'};
  border-radius: 4px;
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : '#fff'};
  font-size: 14px;
  height: 40px;
  box-sizing: border-box;
  margin-bottom: 10px;

  &:focus {
    outline: none;
    border-color: ${props => props.$isNewCrm
      ? '#3B82F6'
      : '#00ff00'};
  }
`;

const TagSuggestions = styled.div`
  background: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#FFFFFF' : '#374151')
    : '#222'};
  border: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#D1D5DB' : '#4B5563')
    : '#444'};
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: -5px;
  margin-bottom: 10px;
  z-index: 10;
  position: relative;
`;

const TagSuggestion = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#E5E7EB' : '#4B5563')
    : '#333'};
  color: ${props => props.$isNewCrm
    ? (props.theme === 'light' ? '#111827' : '#F9FAFB')
    : '#fff'};

  &:hover {
    background: ${props => props.$isNewCrm
      ? (props.theme === 'light' ? '#F3F4F6' : '#4B5563')
      : '#333'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

// Company categories enum values
const COMPANY_CATEGORIES = [
  "Not Set",
  "Inbox",
  "Professional Investor",
  "Startup",
  "Corporate",
  "Corporation",
  "Advisory",
  "SME",
  "Institution",
  "Media",
  "Skip"
];

// Relationship types enum values
const RELATIONSHIP_TYPES = [
  "not_set",
  "employee",
  "founder",
  "advisor",
  "manager",
  "investor",
  "other"
];

const CreateCompanyModal = ({
  isOpen,
  onRequestClose,
  initialName = '',
  contactId,
  contactEmail = '',
  theme = 'dark',
  isNewCrm = false,
  onCompanyCreated = () => {}
}) => {
  // Extract domain from email if provided
  const extractDomainFromEmail = (email) => {
    if (!email || !email.includes('@')) return '';
    return email.substring(email.indexOf('@') + 1);
  };

  // State for company data
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    linkedin: '',
    category: 'Inbox',
    description: ''
  });
  
  // State for relationship if contact is provided
  const [relationship, setRelationship] = useState('not_set');
  const [isPrimary, setIsPrimary] = useState(false);
  
  // State for tags
  const [tags, setTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // Refs
  const nameInputRef = useRef(null);
  
  // Initialize form with initial name and domain if provided
  useEffect(() => {
    if (isOpen) {
      setCompanyData(prev => ({
        ...prev,
        name: initialName,
        website: extractDomainFromEmail(contactEmail)
      }));

      // Focus the name input when modal opens
      if (nameInputRef.current) {
        setTimeout(() => {
          nameInputRef.current.focus();
        }, 100);
      }
    }
  }, [isOpen, initialName, contactEmail]);
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle searching for tags
  const handleTagSearch = async (searchTerm) => {
    setTagSearch(searchTerm);
    
    if (searchTerm.length < 2) {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(10);
        
      if (error) throw error;
      
      // Filter out tags that are already added
      const filteredSuggestions = data.filter(tag => 
        !tags.some(t => t.tag_id === tag.tag_id)
      );
      
      setTagSuggestions(filteredSuggestions);
      setShowTagSuggestions(true);
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };
  
  // Handle tag search key press
  const handleTagSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (tagSearch.trim().length < 2) return;
      
      // If there's a matching suggestion, select it
      const exactMatch = tagSuggestions.find(
        s => s.name.toLowerCase() === tagSearch.toLowerCase()
      );
      
      if (exactMatch) {
        handleAddTag(exactMatch);
      } else {
        // Create a new tag
        handleCreateTag();
      }
    }
  };
  
  // Handle adding a tag
  const handleAddTag = async (tagToAdd) => {
    try {
      // Check if tag is already added
      if (tags.some(t => t.tag_id === tagToAdd.tag_id)) {
        return;
      }
      
      // Add to state
      setTags([...tags, {
        tag_id: tagToAdd.tag_id,
        name: tagToAdd.name
      }]);
      
      // Clear search
      setTagSearch('');
      setShowTagSuggestions(false);
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  };
  
  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!tagSearch.trim()) return;
    
    try {
      // Check if tag already exists
      const { data: existingTags, error: searchError } = await supabase
        .from('tags')
        .select('tag_id, name')
        .eq('name', tagSearch.trim());
        
      if (searchError) throw searchError;
      
      let tagToAdd;
      
      if (existingTags && existingTags.length > 0) {
        // Use existing tag
        tagToAdd = existingTags[0];
      } else {
        // Create new tag
        const { data, error } = await supabase
          .from('tags')
          .insert({ name: tagSearch.trim() })
          .select()
          .single();
          
        if (error) throw error;
        
        tagToAdd = data;
      }
      
      // Add tag to list
      handleAddTag(tagToAdd);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagId) => {
    setTags(tags.filter(tag => tag.tag_id !== tagId));
  };
  
  // Handle form submission
  const handleCreateCompany = async () => {
    // Validate form
    if (!companyData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    
    try {
      // Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyData.name.trim(),
          website: companyData.website.trim(),
          linkedin: companyData.linkedin.trim(),
          category: companyData.category,
          description: companyData.description.trim(),
          created_by: 'User',
          last_modified_by: 'User'
        })
        .select()
        .single();
        
      if (companyError) throw companyError;
      
      // Add tags if there are any
      if (tags.length > 0) {
        const tagsToInsert = tags.map(tag => ({
          company_id: company.company_id,
          tag_id: tag.tag_id
        }));
        
        const { error: tagsError } = await supabase
          .from('company_tags')
          .insert(tagsToInsert);
          
        if (tagsError) {
          console.error('Error adding tags:', tagsError);
          // Don't throw, just log error and continue
        }
      }
      
      // Associate with contact if contactId is provided
      let associationData = null;
      if (contactId) {
        associationData = await supabase
          .from('contact_companies')
          .insert({
            contact_id: contactId,
            company_id: company.company_id,
            relationship: relationship,
            is_primary: isPrimary
          })
          .select();
          
        if (associationData.error) throw associationData.error;
        
        console.log('Company association data:', associationData.data);
      }
      
      toast.success(`${company.name} created successfully`);
      
      // Call the callback with the association data
      onCompanyCreated({
        company,
        tags,
        relationship: contactId ? relationship : null,
        isPrimary: contactId ? isPrimary : false,
        data: contactId ? associationData?.data?.[0] : null // Include the response data for contact_companies
      });
      
      // Close the modal
      onRequestClose();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error('Failed to create company');
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
          padding: '25px',
          border: isNewCrm
            ? 'none'
            : '1px solid #444',
          borderRadius: isNewCrm ? '12px' : '8px',
          backgroundColor: isNewCrm
            ? (theme === 'light' ? '#FFFFFF' : '#1F2937')
            : '#111',
          color: isNewCrm
            ? (theme === 'light' ? '#111827' : '#F9FAFB')
            : '#fff',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000
        }
      }}
    >
      <ModalContainer>
        <Header theme={theme} $isNewCrm={isNewCrm}>
          <Title theme={theme} $isNewCrm={isNewCrm}>Create New Company</Title>
          <CloseButton theme={theme} $isNewCrm={isNewCrm} onClick={onRequestClose}>
            <FiX size={20} />
          </CloseButton>
        </Header>
        
        <FormGroup>
          <FormLabel theme={theme} $isNewCrm={isNewCrm}>Company Name *</FormLabel>
          <Input
            theme={theme}
            $isNewCrm={isNewCrm} 
            ref={nameInputRef}
            type="text" 
            value={companyData.name} 
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter company name"
          />
        </FormGroup>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <FormGroup style={{ flex: 1 }}>
            <FormLabel theme={theme} $isNewCrm={isNewCrm}>Domain</FormLabel>
            <Input
              theme={theme}
              $isNewCrm={isNewCrm} 
              type="text" 
              value={companyData.website} 
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="e.g. example.com"
            />
          </FormGroup>
          
          <FormGroup style={{ flex: 1 }}>
            <FormLabel theme={theme} $isNewCrm={isNewCrm}>LinkedIn URL</FormLabel>
            <Input
              theme={theme}
              $isNewCrm={isNewCrm} 
              type="text" 
              value={companyData.linkedin} 
              onChange={(e) => handleInputChange('linkedin', e.target.value)}
              placeholder="e.g. linkedin.com/company/example"
            />
          </FormGroup>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <FormGroup style={{ flex: 1 }}>
            <FormLabel theme={theme} $isNewCrm={isNewCrm}>Category</FormLabel>
            <Select
              theme={theme}
              $isNewCrm={isNewCrm} 
              value={companyData.category} 
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              {COMPANY_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Select>
          </FormGroup>
          
          {contactId && (
            <FormGroup style={{ flex: 1 }}>
              <FormLabel theme={theme} $isNewCrm={isNewCrm}>Relationship</FormLabel>
              <Select
                theme={theme}
                $isNewCrm={isNewCrm} 
                value={relationship} 
                onChange={(e) => setRelationship(e.target.value)}
              >
                {RELATIONSHIP_TYPES.map(type => (
                  <option key={type} value={type}>
                    {type === 'not_set' ? 'Not Set' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </Select>
            </FormGroup>
          )}
        </div>
        
        {contactId && (
          <FormGroup>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                style={{ marginRight: '10px' }}
              />
              <label htmlFor="isPrimary" style={{
                color: isNewCrm
                  ? (theme === 'light' ? '#111827' : '#F9FAFB')
                  : '#fff'
              }}>
                Set as primary company
              </label>
            </div>
          </FormGroup>
        )}
        
        <FormGroup>
          <FormLabel theme={theme} $isNewCrm={isNewCrm}>Description</FormLabel>
          <Textarea
            theme={theme}
            $isNewCrm={isNewCrm} 
            value={companyData.description} 
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter company description..."
          />
        </FormGroup>
        
        <FormGroup>
          <FormLabel theme={theme} $isNewCrm={isNewCrm}>Tags</FormLabel>
          <div style={{ position: 'relative' }}>
            <TagsSearchInput
              theme={theme}
              $isNewCrm={isNewCrm} 
              type="text" 
              value={tagSearch} 
              onChange={(e) => handleTagSearch(e.target.value)}
              onKeyDown={handleTagSearchKeyDown}
              placeholder="Search or add tags (press Enter to create)"
            />
            
            {showTagSuggestions && tagSuggestions.length > 0 && (
              <TagSuggestions theme={theme} $isNewCrm={isNewCrm}>
                {tagSuggestions.map(tag => (
                  <TagSuggestion
                    key={tag.tag_id}
                    theme={theme}
                    $isNewCrm={isNewCrm}
                    onClick={() => handleAddTag(tag)}
                  >
                    {tag.name}
                  </TagSuggestion>
                ))}
              </TagSuggestions>
            )}
            
            {showTagSuggestions && tagSearch.trim() && !tagSuggestions.find(s => s.name.toLowerCase() === tagSearch.toLowerCase()) && (
              <TagSuggestions theme={theme} $isNewCrm={isNewCrm}>
                <TagSuggestion theme={theme} $isNewCrm={isNewCrm} onClick={handleCreateTag}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiPlus size={14} /> Create "{tagSearch}" tag
                  </span>
                </TagSuggestion>
              </TagSuggestions>
            )}
          </div>
          
          {tags.length > 0 ? (
            <TagsContainer>
              {tags.map(tag => (
                <Tag key={tag.tag_id} $isNewCrm={isNewCrm}>
                  {tag.name}
                  <TagButton $isNewCrm={isNewCrm} onClick={() => handleRemoveTag(tag.tag_id)}>
                    <FiX size={10} />
                  </TagButton>
                </Tag>
              ))}
            </TagsContainer>
          ) : (
            <div style={{
              color: isNewCrm
                ? (theme === 'light' ? '#6B7280' : '#9CA3AF')
                : '#999',
              fontSize: '14px',
              marginTop: '10px'
            }}>
              No tags added
            </div>
          )}
        </FormGroup>
        
        <ButtonGroup>
          <Button className="cancel" theme={theme} $isNewCrm={isNewCrm} onClick={onRequestClose}>
            Cancel
          </Button>
          <Button className="primary" theme={theme} $isNewCrm={isNewCrm} onClick={handleCreateCompany}>
            <FiSave size={16} /> Create Company
          </Button>
        </ButtonGroup>
      </ModalContainer>
    </Modal>
  );
};

export default CreateCompanyModal;