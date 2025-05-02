import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';
import { 
  FiX, 
  FiPlus,
  FiEdit,
  FiEdit2,
  FiUsers,
  FiCopy,
  FiSave,
  FiExternalLink,
  FiGitMerge
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Styled components
const ModalContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
`;

const Sidebar = styled.div`
  width: 25%;
  background-color: #222;
  padding: 20px 0;
  border-right: 1px solid #333;
  flex-shrink: 0;
`;

const Content = styled.div`
  width: 75%;
  padding: 20px;
  overflow-y: auto;
  max-height: 80vh;
  flex-grow: 1;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 20px;
  background: ${props => props.active ? '#333' : 'transparent'};
  color: ${props => props.active ? '#00ff00' : '#fff'};
  border: none;
  text-align: left;
  font-size: 15px;
  transition: all 0.2s;
  cursor: pointer;
  border-left: 3px solid ${props => props.active ? '#00ff00' : 'transparent'};

  &:hover {
    background: #333;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: #00ff00;
  font-size: 14px;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  height: 36px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 10px;
  height: 36px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' stroke='%23aaa' stroke-width='1.5' viewBox='0 0 10 6'><polyline points='1,1 5,5 9,1'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  background: #333;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  min-height: 100px;
  resize: vertical;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  min-height: 40px;
  padding: 10px;
  background: #333;
  border-radius: 4px;
  border: 1px solid #444;
`;

const Tag = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 5px;
  background: #444;
  color: #00ff00;
  border: 1px solid #00ff00;
  border-radius: 3px;
  font-size: 0.7rem;
`;

const TagButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #00ff00;
  cursor: pointer;
  padding: 2px;

  &:hover {
    color: #ff5555;
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
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #333;
    color: #00ff00;
    border: 1px solid #00ff00;
    
    &:hover {
      background: #444;
    }
  }
  
  &.cancel {
    background: transparent;
    color: #fff;
    border: 1px solid #555;
    
    &:hover {
      background: #333;
    }
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  color: #fff;
  font-size: 20px;
  font-weight: 500;
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  color: #00ff00;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 5px;
  border-radius: 4px;

  &:hover {
    background: #333;
  }
`;

const NoDataMessage = styled.div`
  color: #999;
  text-align: center;
  padding: 30px;
  font-size: 15px;
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

const NewEditCompanyModal = ({ 
  isOpen, 
  onRequestClose, 
  company, 
  contactId = null,
  onCompanyUpdated = () => {} 
}) => {
  // State for tabs
  const [activeTab, setActiveTab] = useState('edit');
  
  // State for company data
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    linkedin: '',
    category: 'Inbox',
    description: '',
    relationship: 'not_set'
  });
  
  // State for tags
  const [tags, setTags] = useState([]);
  const [tagSearch, setTagSearch] = useState('');
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  
  // State for related contacts
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // State for duplicate companies
  const [possibleDuplicates, setPossibleDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  
  // State for editing company name inline
  const [editingHeaderName, setEditingHeaderName] = useState(false);
  
  // Load company data when modal opens
  useEffect(() => {
    if (isOpen && company?.company_id) {
      loadCompanyData();
      loadCompanyTags();
      
      if (activeTab === 'related') {
        loadRelatedContacts();
      } else if (activeTab === 'duplicates') {
        checkForDuplicates();
      }
    }
  }, [isOpen, company, activeTab]);
  
  // Load company data
  const loadCompanyData = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('company_id', company.company_id)
        .single();
        
      if (error) throw error;
      
      // Load relationship if contactId is provided
      let relationship = 'not_set';
      
      if (contactId) {
        const { data: contactCompany, error: relError } = await supabase
          .from('contact_companies')
          .select('relationship')
          .eq('contact_id', contactId)
          .eq('company_id', company.company_id)
          .single();
          
        if (!relError && contactCompany) {
          relationship = contactCompany.relationship;
        }
      }
      
      setCompanyData({
        ...data,
        relationship
      });
    } catch (error) {
      console.error('Error loading company data:', error);
      toast.error('Failed to load company data');
    }
  };
  
  // Load company tags
  const loadCompanyTags = async () => {
    try {
      const { data, error } = await supabase
        .from('company_tags')
        .select(`
          entry_id,
          tag_id,
          tags (
            tag_id,
            name
          )
        `)
        .eq('company_id', company.company_id);
        
      if (error) throw error;
      
      // Format tags
      const formattedTags = data.map(item => ({
        id: item.entry_id,
        tag_id: item.tag_id,
        name: item.tags?.name || 'Unknown'
      }));
      
      setTags(formattedTags);
    } catch (error) {
      console.error('Error loading company tags:', error);
      toast.error('Failed to load company tags');
    }
  };
  
  // Load related contacts
  const loadRelatedContacts = async () => {
    if (!company?.company_id) return;
    
    setLoadingRelated(true);
    
    try {
      const { data, error } = await supabase
        .from('contact_companies')
        .select(`
          contact_companies_id,
          relationship,
          contacts (
            contact_id,
            first_name,
            last_name,
            job_role,
            linkedin
          )
        `)
        .eq('company_id', company.company_id);
        
      if (error) throw error;
      
      // Format contacts
      const formattedContacts = data
        .filter(item => item.contacts) // Filter out any null contacts
        .map(item => ({
          id: item.contact_companies_id,
          contact_id: item.contacts.contact_id,
          name: `${item.contacts.first_name || ''} ${item.contacts.last_name || ''}`.trim(),
          job_role: item.contacts.job_role,
          linkedin: item.contacts.linkedin,
          relationship: item.relationship
        }));
      
      setRelatedContacts(formattedContacts);
    } catch (error) {
      console.error('Error loading related contacts:', error);
      toast.error('Failed to load related contacts');
    } finally {
      setLoadingRelated(false);
    }
  };
  
  // Check for possible duplicate companies
  const checkForDuplicates = async () => {
    if (!company?.company_id) return;
    
    setLoadingDuplicates(true);
    
    try {
      let duplicates = [];
      let seenIds = new Set();
      
      // 1. Try exact name match if name exists
      if (companyData.name) {
        const { data: nameMatches, error: nameError } = await supabase
          .from('companies')
          .select('*')
          .neq('company_id', company.company_id) // Exclude this company
          .ilike('name', companyData.name);
          
        if (nameError) throw nameError;
        
        // Add to results and tracking set
        if (nameMatches && nameMatches.length > 0) {
          duplicates.push(...nameMatches);
          nameMatches.forEach(match => seenIds.add(match.company_id));
        }
        
        // Try similar names
        const words = companyData.name.split(' ').filter(w => w.length > 3);
        
        if (words.length > 0) {
          const searchPromises = words.map(word => 
            supabase
              .from('companies')
              .select('*')
              .neq('company_id', company.company_id)
              .ilike('name', `%${word}%`)
              .limit(5)
          );
          
          const results = await Promise.all(searchPromises);
          
          // Combine results
          const nameWordMatches = results.flatMap(result => result.data || []);
          
          // Add non-duplicates to our list
          for (const match of nameWordMatches) {
            if (!seenIds.has(match.company_id)) {
              duplicates.push(match);
              seenIds.add(match.company_id);
            }
          }
        }
      }
      
      // 2. Try domain matching if website exists
      if (companyData.website) {
        // Get base domain without www, http, etc
        const normalizedDomain = companyData.website
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0]
          .toLowerCase();
        
        if (normalizedDomain && normalizedDomain.length > 3) {
          // Search for exact domain
          const { data: exactDomainMatches, error: domainError1 } = await supabase
            .from('companies')
            .select('*')
            .neq('company_id', company.company_id);
            
          if (domainError1) throw domainError1;
          
          // Filter domain matches manually to handle different variations
          const domainMatches = exactDomainMatches.filter(c => {
            if (!c.website) return false;
            
            const companyDomain = c.website
              .replace(/^https?:\/\//, '')
              .replace(/^www\./, '')
              .split('/')[0]
              .toLowerCase();
              
            return companyDomain === normalizedDomain || 
                   companyDomain.includes(normalizedDomain) || 
                   normalizedDomain.includes(companyDomain);
          });
          
          // Add non-duplicates to our list
          for (const match of domainMatches) {
            if (!seenIds.has(match.company_id)) {
              duplicates.push(match);
              seenIds.add(match.company_id);
            }
          }
        }
      }
      
      // Limit to 20 total results
      duplicates = duplicates.slice(0, 20);
      
      setPossibleDuplicates(duplicates);
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      toast.error('Failed to check for duplicates');
    } finally {
      setLoadingDuplicates(false);
    }
  };
  
  // Handle merging companies
  const handleMergeCompany = async (duplicateId) => {
    // Use toast.confirm instead of the global confirm
    const confirmed = window.confirm('Are you sure you want to merge these companies? This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    
    try {
      toast.loading('Merging companies...');
      
      // 1. Get tags from both companies and combine them
      const [tagsResult, contactsResult] = await Promise.all([
        // Get tags from duplicate company
        supabase
          .from('company_tags')
          .select(`
            tag_id,
            tags (name)
          `)
          .eq('company_id', duplicateId),
          
        // Get contacts associated with duplicate company  
        supabase
          .from('contact_companies')
          .select(`
            contact_id,
            relationship
          `)
          .eq('company_id', duplicateId)
      ]);
      
      if (tagsResult.error) throw tagsResult.error;
      if (contactsResult.error) throw contactsResult.error;
      
      // 2. Add tags from duplicate to main company if they don't exist
      if (tagsResult.data && tagsResult.data.length > 0) {
        // Get existing tags on main company
        const { data: existingTags, error: existingTagsError } = await supabase
          .from('company_tags')
          .select('tag_id')
          .eq('company_id', company.company_id);
          
        if (existingTagsError) throw existingTagsError;
        
        const existingTagIds = new Set(existingTags.map(t => t.tag_id));
        
        // Filter out tags that already exist
        const tagsToAdd = tagsResult.data.filter(t => !existingTagIds.has(t.tag_id));
        
        // Add new tags
        if (tagsToAdd.length > 0) {
          const tagsToInsert = tagsToAdd.map(t => ({
            company_id: company.company_id,
            tag_id: t.tag_id
          }));
          
          const { error: addTagsError } = await supabase
            .from('company_tags')
            .insert(tagsToInsert);
            
          if (addTagsError) throw addTagsError;
        }
      }
      
      // 3. Transfer contacts from duplicate to main company
      if (contactsResult.data && contactsResult.data.length > 0) {
        // Get existing contact associations on main company
        const { data: existingContacts, error: existingContactsError } = await supabase
          .from('contact_companies')
          .select('contact_id')
          .eq('company_id', company.company_id);
          
        if (existingContactsError) throw existingContactsError;
        
        const existingContactIds = new Set(existingContacts.map(c => c.contact_id));
        
        // For duplicate contacts, update to point to main company
        const contactsToUpdate = contactsResult.data.filter(c => !existingContactIds.has(c.contact_id));
        
        if (contactsToUpdate.length > 0) {
          // Update contact associations to point to the main company
          for (const contact of contactsToUpdate) {
            const { error: updateContactError } = await supabase
              .from('contact_companies')
              .update({ company_id: company.company_id })
              .eq('contact_id', contact.contact_id)
              .eq('company_id', duplicateId);
              
            if (updateContactError) throw updateContactError;
          }
        }
      }
      
      // 4. Mark the duplicate company as deleted (or delete if preferred)
      const { error: deleteError } = await supabase
        .from('companies')
        .update({ 
          name: `[MERGED] ${companyData.name}`,
          last_modified_at: new Date(),
          last_modified_by: 'User'
        })
        .eq('company_id', duplicateId);
        
      if (deleteError) throw deleteError;
      
      // Refresh data
      toast.dismiss();
      toast.success('Companies merged successfully');
      
      // Reload duplicates list
      checkForDuplicates();
      
      // Refresh company data
      loadCompanyData();
      loadCompanyTags();
      
    } catch (error) {
      console.error('Error merging companies:', error);
      toast.dismiss();
      toast.error('Failed to merge companies');
    }
  };
  
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
  
  // Handle adding a tag
  const handleAddTag = async (tagToAdd) => {
    try {
      // Check if tag is already added
      if (tags.some(t => t.tag_id === tagToAdd.tag_id)) {
        return;
      }
      
      // Add to database
      const { data, error } = await supabase
        .from('company_tags')
        .insert({
          company_id: company.company_id,
          tag_id: tagToAdd.tag_id
        })
        .select();
        
      if (error) throw error;
      
      // Add to state
      setTags([...tags, {
        id: data[0].entry_id,
        tag_id: tagToAdd.tag_id,
        name: tagToAdd.name
      }]);
      
      // Clear search
      setTagSearch('');
      setShowTagSuggestions(false);
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
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
      
      // Add tag to company
      await handleAddTag(tagToAdd);
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = async (tagId) => {
    try {
      // Remove from database
      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('entry_id', tagId);
        
      if (error) throw error;
      
      // Remove from state
      setTags(tags.filter(tag => tag.id !== tagId));
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };
  
  // Handle saving changes
  const handleSave = async () => {
    try {
      // Update company in the companies table
      const { error: companyError } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          website: companyData.website,
          linkedin: companyData.linkedin,
          category: companyData.category,
          description: companyData.description,
          last_modified_at: new Date(),
          last_modified_by: 'User'
        })
        .eq('company_id', company.company_id);
        
      if (companyError) throw companyError;
      
      // Update relationship if contactId is provided
      if (contactId) {
        const { error: relationshipError } = await supabase
          .from('contact_companies')
          .update({
            relationship: companyData.relationship
          })
          .eq('contact_id', contactId)
          .eq('company_id', company.company_id);
          
        if (relationshipError) throw relationshipError;
      }
      
      toast.success('Company updated successfully');
      onCompanyUpdated();
      onRequestClose();
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to update company');
    }
  };
  
  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'edit':
        return (
          <>
            <FormGroup>
              <FormLabel>Description</FormLabel>
              <Textarea 
                value={companyData.description || ''} 
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter company description..."
              />
            </FormGroup>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <FormGroup style={{ flex: 1 }}>
                <FormLabel>Domain</FormLabel>
                <Input 
                  type="text" 
                  value={companyData.website || ''} 
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="e.g. example.com"
                />
              </FormGroup>
              
              <FormGroup style={{ flex: 1 }}>
                <FormLabel>LinkedIn URL</FormLabel>
                <Input 
                  type="text" 
                  value={companyData.linkedin || ''} 
                  onChange={(e) => handleInputChange('linkedin', e.target.value)}
                  placeholder="e.g. linkedin.com/company/example"
                />
              </FormGroup>
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <FormGroup style={{ flex: 1 }}>
                <FormLabel>Category</FormLabel>
                <Select 
                  value={companyData.category || ''} 
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {COMPANY_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Select>
              </FormGroup>
              
              {contactId && (
                <FormGroup style={{ flex: 1 }}>
                  <FormLabel>Relationship</FormLabel>
                  <Select 
                    value={companyData.relationship || 'not_set'} 
                    onChange={(e) => handleInputChange('relationship', e.target.value)}
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
            
            <FormGroup>
              <FormLabel>Tags</FormLabel>
              <div style={{ position: 'relative' }}>
                <Input 
                  type="text" 
                  value={tagSearch} 
                  onChange={(e) => handleTagSearch(e.target.value)}
                  placeholder="Search or add tags..."
                />
                
                {showTagSuggestions && tagSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    background: '#333',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    zIndex: 10,
                    marginTop: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {tagSuggestions.map(tag => (
                      <div 
                        key={tag.tag_id}
                        style={{
                          padding: '8px 12px',
                          borderBottom: '1px solid #444',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleAddTag(tag)}
                      >
                        {tag.name}
                      </div>
                    ))}
                  </div>
                )}
                
                {showTagSuggestions && tagSearch.trim() && !tagSuggestions.find(s => s.name.toLowerCase() === tagSearch.toLowerCase()) && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    width: '100%',
                    background: '#333',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    zIndex: 10,
                    marginTop: '4px',
                    padding: '8px 12px'
                  }}>
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        color: '#00ff00',
                        border: 'none',
                        padding: '4px 0',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={handleCreateTag}
                    >
                      <FiPlus size={16} /> Create "{tagSearch}" tag
                    </button>
                  </div>
                )}
              </div>
            </FormGroup>
            
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '6px', 
              marginTop: '10px', 
              marginBottom: '20px' 
            }}>
              {tags.length > 0 ? (
                tags.map(tag => (
                  <div key={tag.id} style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    borderRadius: '3px',
                    border: '1px solid #00ff00',
                    color: '#00ff00'
                  }}>
                    {tag.name}
                    <span 
                      onClick={() => handleRemoveTag(tag.id)}
                      style={{ 
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <FiX size={10} />
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#999', fontSize: '14px' }}>No tags added</div>
              )}
            </div>
            
            <ButtonGroup>
              <Button className="cancel" onClick={onRequestClose}>
                Cancel
              </Button>
              <Button className="primary" onClick={handleSave}>
                <FiSave size={16} /> Save Changes
              </Button>
            </ButtonGroup>
          </>
        );
        
      case 'related':
        return (
          <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <FormGroup>
              <FormLabel>Related Contacts</FormLabel>
            </FormGroup>
            
            {loadingRelated ? (
              <div style={{ textAlign: 'center', padding: '30px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Loading related contacts...
              </div>
            ) : relatedContacts.length > 0 ? (
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#333' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '30%' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '30%' }}>Job Role</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '30%' }}>Relationship</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedContacts.map(contact => (
                      <tr key={contact.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '10px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.name || 'Unnamed'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.job_role || '—'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {contact.relationship === 'not_set' ? 'Not Set' : contact.relationship.charAt(0).toUpperCase() + contact.relationship.slice(1)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#00ff00', 
                                cursor: 'pointer' 
                              }}
                              title="View Contact"
                            >
                              <FiExternalLink size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NoDataMessage>No related contacts found</NoDataMessage>
              </div>
            )}
            
            <ButtonGroup>
              <Button className="cancel" onClick={onRequestClose}>
                Close
              </Button>
            </ButtonGroup>
          </div>
        );
        
      case 'duplicates':
        return (
          <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <FormGroup>
              <FormLabel>Possible Duplicate Companies</FormLabel>
            </FormGroup>
            
            {loadingDuplicates ? (
              <div style={{ textAlign: 'center', padding: '30px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Checking for duplicates...
              </div>
            ) : possibleDuplicates.length > 0 ? (
              <div style={{ overflowX: 'auto', flex: 1 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ background: '#333' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '35%' }}>Name</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '30%' }}>Website</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '25%' }}>Category</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#00ff00', fontSize: '14px', borderBottom: '1px solid #444', width: '10%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {possibleDuplicates.map(duplicate => (
                      <tr key={duplicate.company_id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '10px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {duplicate.name || 'Unnamed'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {duplicate.website || '—'}
                        </td>
                        <td style={{ padding: '10px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {duplicate.category || '—'}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                            <button
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#00ff00', 
                                cursor: 'pointer' 
                              }}
                              title="View Company"
                            >
                              <FiExternalLink size={16} />
                            </button>
                            <button
                              onClick={() => handleMergeCompany(duplicate.company_id)}
                              style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#00ff00', 
                                cursor: 'pointer' 
                              }}
                              title="Merge this company into current company"
                            >
                              <FiGitMerge size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <NoDataMessage>No possible duplicates found</NoDataMessage>
              </div>
            )}
            
            <ButtonGroup>
              <Button className="cancel" onClick={onRequestClose}>
                Close
              </Button>
            </ButtonGroup>
          </div>
        );
        
      default:
        return null;
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
          padding: 0,
          border: '1px solid #444',
          borderRadius: '8px',
          backgroundColor: '#111',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          width: '900px',
          height: '600px',
          overflow: 'hidden'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000
        }
      }}
    >
      <ModalContainer>
        <Sidebar>
          <TabButton 
            active={activeTab === 'edit'} 
            onClick={() => setActiveTab('edit')}
          >
            <FiEdit2 size={18} /> Edit Company
          </TabButton>
          <TabButton 
            active={activeTab === 'related'} 
            onClick={() => setActiveTab('related')}
          >
            <FiUsers size={18} /> Related Contacts
          </TabButton>
          <TabButton 
            active={activeTab === 'duplicates'} 
            onClick={() => setActiveTab('duplicates')}
          >
            <FiCopy size={18} /> Duplicates
          </TabButton>
        </Sidebar>
        
        <Content>
          <Header>
            <Title style={{ display: 'flex', alignItems: 'center' }}>
              {activeTab === 'edit' ? (
                <>
                  {editingHeaderName ? (
                    <input
                      type="text"
                      value={companyData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onBlur={() => setEditingHeaderName(false)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setEditingHeaderName(false);
                        } else if (e.key === 'Escape') {
                          setEditingHeaderName(false);
                        }
                      }}
                      autoFocus
                      style={{
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #00ff00',
                        color: '#fff',
                        fontSize: '20px',
                        fontWeight: '500',
                        padding: '2px 0',
                        width: '100%',
                        maxWidth: '300px',
                        outline: 'none'
                      }}
                    />
                  ) : (
                    <span 
                      style={{ 
                        display: 'inline-block', 
                        borderBottom: '1px dotted #00ff00', 
                        padding: '2px',
                        cursor: 'pointer'
                      }}
                      onClick={() => setEditingHeaderName(true)}
                    >
                      {companyData.name || 'Unnamed Company'} <FiEdit size={14} style={{ verticalAlign: 'middle', marginLeft: '5px' }} />
                    </span>
                  )}
                </>
              ) : activeTab === 'related' ? (
                `${companyData.name || 'Company'} - Related Contacts`
              ) : (
                `${companyData.name || 'Company'} - Duplicates`
              )}
            </Title>
            <CloseButton onClick={onRequestClose}>
              <FiX size={20} />
            </CloseButton>
          </Header>
          
          {renderContent()}
        </Content>
      </ModalContainer>
    </Modal>
  );
};

export default NewEditCompanyModal;