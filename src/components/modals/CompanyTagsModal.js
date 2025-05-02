import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FiX, FiPlus, FiSearch } from 'react-icons/fi';
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
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 1rem;
  background-color: ${props => props.color || '#f3f4f6'};
  color: ${props => props.textColor || '#4b5563'};
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid black;
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
    color: #6b7280;
    cursor: pointer;
    
    &:hover { 
      color: #ef4444; 
    }
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
  width: 90%;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px;
  padding-left: 36px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background-color: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  &:hover {
    background-color: #f3f4f6;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
`;

const SuggestionsContainer = styled.div`
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: none;
  border: none;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  font-size: 0.875rem;
  color: #374151;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f3f4f6;
  }
`;

const NewTagButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #000000;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #333333;
  }

  &:disabled {
    background-color: #E9ECEF;
    color: #6c757d;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-top: 12px;
  
  &.success {
    background-color: #f3f4f6;
    color: #4b5563;
  }
  
  &.error {
    background-color: #fef2f2;
    color: #dc2626;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 15px;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background-color: #000000;
    color: white;
    border: none;
    
    &:hover {
      background-color: #333333;
    }

    &:disabled {
      background-color: #E9ECEF;
      color: #6c757d;
      cursor: not-allowed;
    }
  }
  
  &.secondary {
    background-color: #6C757D;
    color: white;
    border: none;
    
    &:hover {
      background-color: #5A6268;
    }
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
  
  const sum = tagName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = sum % colors.length;
  
  return colors[index];
};

const CompanyTagsModal = ({ isOpen, onRequestClose, company }) => {
  const [currentTags, setCurrentTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const entityId = company?.id;
  
  // Fetch current tags for the company
  const fetchCurrentTags = async () => {
    try {
      console.log(`Fetching tags for company with ID: ${entityId}`);
      
      // Use correct table name from schema
      const tableName = 'company_tags';
      const idField = 'company_id';
      
      console.log(`Querying table: ${tableName}, idField: ${idField}, id: ${entityId}`);
      
      // Direct query to see what's in the table
      let { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq(idField, entityId);
      
      console.log('Raw tag connections data:', data);
      
      if (error) {
        console.error('Error fetching raw tags:', error);
        throw error;
      }
      
      // Now get the actual tags
      if (data && data.length > 0) {
        // Get all tag ids
        const tagIds = data.map(item => item.tag_id);
        console.log('Found tag IDs:', tagIds);
        
        // Fetch tag details
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('tag_id, name')
          .in('tag_id', tagIds);
        
        if (tagsError) {
          console.error('Error fetching tag details:', tagsError);
          throw tagsError;
        }
        
        console.log('Tags details:', tagsData);
        
        // Combine the data
        const combinedData = data.map(item => {
          const tagInfo = tagsData.find(tag => tag.tag_id === item.tag_id);
          return {
            id: item.entry_id,     // connection ID
            tag_id: item.tag_id,   // tag ID 
            name: tagInfo?.name || 'Unknown tag'
          };
        });
        
        console.log('Setting currentTags to:', combinedData);
        setCurrentTags(combinedData);
      } else {
        console.log('No tags found, clearing currentTags');
        setCurrentTags([]);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setMessage({ type: 'error', text: 'Failed to load tags' });
    }
  };

  // Fetch tag suggestions based on search term
  const fetchTagSuggestions = async (search) => {
    try {
      let query = supabase.from('tags').select('tag_id, name');
      
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;

      // Filter out tags that are already assigned
      const filteredSuggestions = data.filter(tag => 
        !currentTags.some(currentTag => currentTag.tag_id === tag.tag_id)
      );

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen && entityId) {
      fetchCurrentTags();
    }
  }, [isOpen, entityId]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      fetchTagSuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleRemoveTag = async (tagToRemove) => {
    try {
      setLoading(true);
      console.log(`Removing tag ID ${tagToRemove.tag_id} from company ${entityId}`);
      
      // Use correct company_tags table
      const tableName = 'company_tags';
      const idField = 'company_id';
      
      // Use the combination of entity_id and tag_id to identify the record to delete
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idField, entityId)
        .eq('tag_id', tagToRemove.tag_id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Either fetch tags again to ensure UI is in sync with database
      await fetchCurrentTags();
      setMessage({ type: 'success', text: 'Tag removed successfully' });
    } catch (error) {
      console.error('Error removing tag:', error);
      setMessage({ type: 'error', text: 'Failed to remove tag' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = async (tagToAdd) => {
    try {
      setLoading(true);
      console.log(`Adding tag ${tagToAdd.tag_id} to company ${entityId}`);
      
      if (!entityId) {
        console.error('Missing company ID. Cannot add tag.');
        throw new Error('Missing company ID');
      }
      
      // Use company_tags table
      const tableName = 'company_tags';
      const idFieldName = 'company_id';
      
      // Create insertion object
      const insertData = {
        tag_id: tagToAdd.tag_id,
        company_id: entityId
      };
      
      console.log('Inserting data:', insertData, 'into table:', tableName);
      
      // Verify the tag isn't already associated
      console.log(`Checking if tag ${tagToAdd.tag_id} is already associated with ${idFieldName}=${entityId}`);
      const { data: existingTag, error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idFieldName, entityId)
        .eq('tag_id', tagToAdd.tag_id);
      
      if (checkError) {
        console.error('Error checking existing tag:', checkError);
        throw checkError;
      }
      
      console.log('Existing tag check result:', existingTag);
      
      // If tag already exists, don't try to insert again
      if (existingTag && existingTag.length > 0) {
        console.log('Tag already exists for this company, skipping insertion');
        setMessage({ type: 'success', text: 'Tag already exists' });
        
        // Refresh current tags just to be sure UI is in sync
        await fetchCurrentTags();
        
        setSearchTerm('');
        setShowSuggestions(false);
        return;
      }
      
      // Log all data before insertion
      console.log('About to insert tag connection with data:', {
        tableName,
        idFieldName,
        entityId,
        tagId: tagToAdd.tag_id,
        fullInsertData: insertData
      });
      
      // Add connection in the company_tags table
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }
      
      console.log('Insert successful, result:', insertedData);

      // Refresh current tags
      await fetchCurrentTags();
      
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'Tag added successfully' });
    } catch (error) {
      console.error('Error adding tag:', error);
      console.error('Error details:', error.message, error.code, error.details);
      setMessage({ type: 'error', text: `Failed to add tag: ${error.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      console.log(`Creating new tag "${searchTerm}" for company`);
      
      if (!entityId) {
        console.error('Missing company ID. Cannot add tag.');
        throw new Error('Missing company ID');
      }
      
      // Check if tag with this name already exists
      const { data: existingTagsByName, error: searchError } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', searchTerm.trim());
        
      if (searchError) {
        console.error('Error searching for existing tags:', searchError);
        throw searchError;
      }
      
      let tagToUse;
      
      // If tag already exists, use it instead of creating a new one
      if (existingTagsByName && existingTagsByName.length > 0) {
        console.log('Tag with this name already exists, using existing tag');
        tagToUse = existingTagsByName[0];
      } else {
        // Create new tag if it doesn't exist
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({ 
            name: searchTerm.trim()
          })
          .select()
          .single();
  
        if (createError) {
          console.error('Error creating tag:', createError);
          throw createError;
        }
        
        console.log('New tag created:', newTag);
        tagToUse = newTag;
      }

      // Use company_tags table
      const tableName = 'company_tags';
      const idFieldName = 'company_id';
      
      // Check if this tag is already associated with the company
      const { data: existingConnection, error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idFieldName, entityId)
        .eq('tag_id', tagToUse.tag_id);
        
      if (checkError) {
        console.error('Error checking existing connection:', checkError);
        throw checkError;
      }
      
      // If connection already exists, don't create a duplicate
      if (existingConnection && existingConnection.length > 0) {
        console.log('Tag already associated with this company');
        setMessage({ type: 'success', text: 'Tag already exists' });
        await fetchCurrentTags();
        setSearchTerm('');
        setShowSuggestions(false);
        return;
      }
      
      // Create insertion object
      const insertData = {
        tag_id: tagToUse.tag_id,
        company_id: entityId
      };
      
      console.log('Connecting tag:', insertData);
      
      // Then add the connection
      const { error: connectError } = await supabase
        .from(tableName)
        .insert(insertData);

      if (connectError) {
        console.error('Error connecting tag:', connectError);
        throw connectError;
      }

      // Refresh current tags
      await fetchCurrentTags();
      
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: tagToUse === existingTagsByName ? 'Existing tag added successfully' : 'New tag created and added successfully' });
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage({ type: 'error', text: 'Failed to create tag' });
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
          borderRadius: '16px',
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
          <h2>Manage Company Tags</h2>
          <button onClick={onRequestClose} aria-label="Close modal">
            <FiX size={20} />
          </button>
        </ModalHeader>

        <Section>
          <SectionTitle>Current Tags</SectionTitle>
          <TagsList>
            {currentTags.map(tag => {
              const color = getTagColor(tag.name);
              return (
                <Tag 
                  key={tag.id} 
                  color={color.bg}
                  textColor={color.text}
                >
                  <span title={tag.name}>{tag.name.length > 25 ? `${tag.name.substring(0, 25)}...` : tag.name}</span>
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    disabled={loading}
                  >
                    <FiX size={14} />
                  </button>
                </Tag>
              );
            })}
            {currentTags.length === 0 && (
              <span style={{ color: '#6c757d', fontStyle: 'italic', padding: '4px' }}>
                No tags assigned
              </span>
            )}
          </TagsList>
        </Section>

        <Section>
          <SectionTitle>Add Tags</SectionTitle>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={16} />
            </SearchIcon>
            <SearchInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or create new tag..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.id}
                  onClick={() => handleAddTag(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name}
                </SuggestionItem>
              ))}
              {searchTerm.trim() && !suggestions.find(s => s.name.toLowerCase() === searchTerm.toLowerCase()) && (
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
        </ButtonGroup>

        {loading && (
          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <div className="spinner" style={{ 
              width: '20px', 
              height: '20px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #000000', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CompanyTagsModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);