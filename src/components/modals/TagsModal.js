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
  border-bottom: 1px solid #333;

  h2 {
    margin: 0;
    font-size: 1.25rem;
    color: #00ff00;
    font-weight: 600;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
    color: #ffffff;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      color: #ff5555;
    }
  }
`;

const Section = styled.div`
  margin-bottom: 15px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: bold;
  color: #00ff00;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 0.75rem;
  border-radius: 4px;
  background-color: #222;
  color: #00ff00;
  font-weight: 500;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
  border: 1px solid #00ff00;
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
    color: #00ff00;
    cursor: pointer;
    
    &:hover { 
      color: #ff5555; 
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
  border: 1px solid #444;
  border-radius: 4px;
  font-size: 14px;
  color: #eee;
  background-color: #222;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #00ff00;
  }

  &:hover {
    background-color: #333;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
`;

const SuggestionsContainer = styled.div`
  margin-top: 8px;
  border: 1px solid #444;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
  background-color: #222;
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: none;
  border: none;
  border-bottom: 1px solid #333;
  cursor: pointer;
  font-size: 0.875rem;
  color: #eee;
  transition: background-color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #333;
    color: #00ff00;
  }
`;

const NewTagButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #333;
  color: #00ff00;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;

  &:hover {
    background-color: #444;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-top: 12px;
  
  &.success {
    background-color: rgba(0, 255, 0, 0.1);
    color: #00ff00;
  }
  
  &.error {
    background-color: rgba(255, 70, 70, 0.2);
    color: #ff9999;
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
  display: flex;
  align-items: center;
  gap: 8px;
  
  &.primary {
    background-color: #00ff00;
    color: black;
    border: none;
    
    &:hover {
      background-color: #00dd00;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  &.secondary {
    background-color: transparent;
    color: #ccc;
    border: 1px solid #555;
    
    &:hover {
      background-color: #333;
    }
  }
`;

// Helper function to get tag colors - always return black with green now
const getTagColor = (tagName) => {
  return { bg: '#222', text: '#00ff00', border: '#00ff00' };
};

const TagsModal = ({ isOpen, onRequestClose, contact, meeting, deal, onTagAdded, onTagRemoved }) => {
  const [currentTags, setCurrentTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Determine if we're in meeting or contact context
  const isMeetingContext = !!meeting;
  const entityId = isMeetingContext ? meeting.id : contact?.contact_id;
  
  // Debug context information
  console.log('TagsModal context:', { 
    isMeetingContext, 
    entityId, 
    meetingInfo: meeting,
    contactInfo: contact,
    isOpen // Add isOpen state to the log to help debugging
  });
  
  // Fetch current tags for the entity (contact or meeting)
  const fetchCurrentTags = async () => {
    try {
      console.log(`Fetching tags for ${isMeetingContext ? 'meeting' : 'contact'} with ID: ${entityId}`);
      
      // Different table and field based on context
      const tableName = isMeetingContext ? 'meetings_tags' : 'contact_tags';
      const idField = isMeetingContext ? 'meeting_id' : 'contact_id';
      
      console.log(`Querying table: ${tableName}, idField: ${idField}, id: ${entityId}`);
      
      // Direct query - first try to see what's in the table
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
        const tagIds = data.map(item => item.tag_id).filter(id => id);
        console.log('Found tag IDs:', tagIds);
        
        if (tagIds.length === 0) {
          console.log('No valid tag IDs found, clearing currentTags');
          setCurrentTags([]);
          return;
        }
        
        // Fetch tag details
        let tagsData;
        const { data: initialTagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')  // Select all fields instead of just id, name, tag_name
          .in('tag_id', tagIds);  // Use tag_id field instead of id
        
        if (tagsError) {
          console.error('Error fetching tag details:', tagsError);
          // Try alternative approach using 'id' instead of 'tag_id'
          const { data: altTagsData, error: altTagsError } = await supabase
            .from('tags')
            .select('*')
            .in('id', tagIds);
            
          if (altTagsError) {
            console.error('Alternative tag fetch also failed:', altTagsError);
            throw tagsError;
          }
          
          // If alternative approach worked
          console.log('Alternative tag fetch succeeded:', altTagsData);
          tagsData = altTagsData;
        } else {
          tagsData = initialTagsData;
        }
        
        console.log('Tags details:', tagsData);
        
        // Combine the data
        const combinedData = data.map(item => {
          // Match based on either id or tag_id field
          const tagInfo = tagsData?.find(tag => 
            (tag.id === item.tag_id) || (tag.tag_id === item.tag_id)
          );
          
          return {
            id: item.entry_id || item.id,  // connection ID
            tag_id: item.tag_id,        // tag ID 
            name: tagInfo?.name || tagInfo?.tag_name || 'Unknown tag'
          };
        }).filter(tag => tag.name !== 'Unknown tag'); // Filter out tags without names
        
        console.log('Setting currentTags to:', combinedData);
        setCurrentTags(combinedData);
      } else {
        console.log('No tags found, clearing currentTags');
        setCurrentTags([]);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
      setMessage({ type: 'error', text: 'Failed to load tags' });
      // Don't completely fail - at least show an empty list
      setCurrentTags([]);
    }
  };

  // Fetch tag suggestions based on search term
  const fetchTagSuggestions = async (search) => {
    try {
      let query = supabase.from('tags').select('*');
      
      if (search) {
        // Use ilike on just the name field instead of complex OR filtering
        // This is more compatible with all Supabase versions
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      
      console.log('Raw tag suggestions from DB:', data);
      
      // Make sure each tag has the tag_id property
      const processedData = data.map(tag => ({
        ...tag,
        // Use tag_id if available, otherwise use id
        tag_id: tag.tag_id || tag.id,
        // Make sure the name is populated
        name: tag.name || tag.tag_name || 'Unnamed Tag'
      }));

      // Filter out tags that are already assigned
      const filteredSuggestions = processedData.filter(tag => 
        !currentTags.some(currentTag => currentTag.tag_id === tag.tag_id)
      );

      console.log('Filtered tag suggestions:', filteredSuggestions);
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
      console.log(`Removing tag ID ${tagToRemove.tag_id} from ${isMeetingContext ? 'meeting' : 'contact'} ${entityId}`);
      
      // Different table based on context
      const tableName = isMeetingContext ? 'meetings_tags' : 'contact_tags';
      const idField = isMeetingContext ? 'meeting_id' : 'contact_id';
      
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
      
      // Notify parent component if callback is provided
      if (onTagRemoved && typeof onTagRemoved === 'function') {
        onTagRemoved(tagToRemove);
      }
      
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
      console.log('Full tag object to add:', tagToAdd);
      
      // Get the correct tag ID - could be in either id or tag_id property
      const tagId = tagToAdd.tag_id || tagToAdd.id;
      
      console.log(`Adding tag ${tagId} to ${isMeetingContext ? 'meeting' : 'contact'} ${entityId}`);
      
      if (!entityId) {
        console.error('Missing entity ID. Cannot add tag.');
        throw new Error('Missing entity ID');
      }
      
      if (!tagId) {
        console.error('Missing tag ID. Cannot add tag.');
        throw new Error('Missing tag ID');
      }
      
      // Different table and fields based on context
      const tableName = isMeetingContext ? 'meetings_tags' : 'contact_tags';
      const idFieldName = isMeetingContext ? 'meeting_id' : 'contact_id';
      
      // Create insertion object
      const insertData = {
        tag_id: tagId
      };
      insertData[idFieldName] = entityId;
      
      console.log('Inserting data:', insertData, 'into table:', tableName);
      
      // Test table permissions - try simple select first
      console.log(`Testing table permissions for ${tableName}`);
      const { data: testData, error: testError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (testError) {
        console.error(`Permission test for ${tableName} failed:`, testError);
      } else {
        console.log(`Permission test for ${tableName} passed. Sample data:`, testData);
      }
      
      // Verify the tag isn't already associated
      console.log(`Checking if tag ${tagId} is already associated with ${idFieldName}=${entityId}`);
      const { data: existingTag, error: checkError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idFieldName, entityId)
        .eq('tag_id', tagId);
      
      if (checkError) {
        console.error('Error checking existing tag:', checkError);
        throw checkError;
      }
      
      console.log('Existing tag check result:', existingTag);
      
      // If tag already exists, don't try to insert again
      if (existingTag && existingTag.length > 0) {
        console.log('Tag already exists for this entity, skipping insertion');
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
        tagId,
        fullInsertData: insertData
      });
      
      // Add connection in the appropriate table
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
      
      // Notify parent component if callback is provided
      if (onTagAdded && typeof onTagAdded === 'function') {
        onTagAdded({
          tag_id: tagToAdd.tag_id || tagToAdd.id,
          name: tagToAdd.name || tagToAdd.tag_name || 'Unnamed Tag'
        });
      }
      
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
      console.log(`Creating new tag "${searchTerm}" for ${isMeetingContext ? 'meeting' : 'contact'}`);
      
      if (!entityId) {
        console.error('Missing entity ID. Cannot add tag.');
        throw new Error('Missing entity ID');
      }
      
      // Check if tag with this name already exists - handle errors gracefully
      let existingTagsByName = [];
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .ilike('name', searchTerm.trim());
          
        if (!error && data) {
          existingTagsByName = data;
        }
      } catch (searchError) {
        console.error('Error searching for existing tags (continuing anyway):', searchError);
        // Continue even if this fails - we'll just create a new tag
      }
      
      let tagToUse;
      
      // If tag already exists, use it instead of creating a new one
      if (existingTagsByName && existingTagsByName.length > 0) {
        console.log('Tag with this name already exists, using existing tag');
        const existingTag = existingTagsByName[0];
        // Make sure it has tag_id
        tagToUse = {
          ...existingTag,
          tag_id: existingTag.tag_id || existingTag.id
        };
        console.log('Using existing tag with ID:', tagToUse.tag_id);
      } else {
        // Create new tag if it doesn't exist
        try {
          // Insert with minimal fields
          const { data: newTag, error: createError } = await supabase
            .from('tags')
            .insert({ 
              name: searchTerm.trim()
            })
            .select();
    
          if (createError) {
            console.error('Error creating tag:', createError);
            throw createError;
          }
          
          console.log('New tag created:', newTag);
          // Make sure it has tag_id
          if (newTag && newTag.length > 0) {
            tagToUse = {
              ...newTag[0],
              tag_id: newTag[0].tag_id || newTag[0].id
            };
          } else {
            throw new Error('Tag created but no data returned');
          }
          console.log('New tag has ID:', tagToUse.tag_id);
        } catch (createErr) {
          console.error('Failed to create tag with standard approach:', createErr);
          // Try a simpler approach with minimal fields
          try {
            const { data: simpleTag, error: simpleError } = await supabase
              .from('tags')
              .insert({ name: searchTerm.trim() })
              .select();
              
            if (simpleError) throw simpleError;
            
            if (simpleTag && simpleTag.length > 0) {
              tagToUse = {
                ...simpleTag[0],
                tag_id: simpleTag[0].tag_id || simpleTag[0].id,
                name: searchTerm.trim()
              };
            } else {
              throw new Error('Tag created but no data returned');
            }
          } catch (fallbackErr) {
            console.error('Failed to create tag with fallback approach:', fallbackErr);
            throw fallbackErr;
          }
        }
      }

      // Different table and field based on context
      const tableName = isMeetingContext ? 'meetings_tags' : 'contact_tags';
      const idFieldName = isMeetingContext ? 'meeting_id' : 'contact_id';
      
      // Check if this tag is already associated with the entity
      let shouldAddTag = true;
      try {
        const { data: existingConnection, error: checkError } = await supabase
          .from(tableName)
          .select('*')
          .eq(idFieldName, entityId)
          .eq('tag_id', tagToUse.tag_id);
          
        if (!checkError && existingConnection && existingConnection.length > 0) {
          console.log('Tag already associated with this entity');
          shouldAddTag = false;
          setMessage({ type: 'success', text: 'Tag already exists' });
          await fetchCurrentTags();
          setSearchTerm('');
          setShowSuggestions(false);
          
          // Notify parent component even for existing tags
          if (onTagAdded && typeof onTagAdded === 'function') {
            onTagAdded({
              tag_id: tagToUse.tag_id,
              name: tagToUse.name || tagToUse.tag_name || searchTerm.trim()
            });
          }
          
          return;
        }
      } catch (checkErr) {
        console.error('Error checking existing connection (continuing anyway):', checkErr);
        // Continue anyway - worst case we'll get a unique constraint error
      }
      
      if (shouldAddTag) {
        // Create insertion object
        const insertData = {
          tag_id: tagToUse.tag_id
        };
        insertData[idFieldName] = entityId;
        
        console.log('Connecting tag:', insertData);
        
        // Then add the connection
        try {
          const { error: connectError } = await supabase
            .from(tableName)
            .insert(insertData);
            
          if (connectError) {
            console.error('Error connecting tag:', connectError);
            throw connectError;
          }
        } catch (insertErr) {
          console.error('Failed to insert tag connection:', insertErr);
          throw insertErr;
        }

        // Refresh current tags
        await fetchCurrentTags();
        
        // Notify parent component if callback is provided
        if (onTagAdded && typeof onTagAdded === 'function') {
          onTagAdded({
            tag_id: tagToUse.tag_id,
            name: tagToUse.name || tagToUse.tag_name || searchTerm.trim()
          });
        }
        
        setSearchTerm('');
        setShowSuggestions(false);
        setMessage({ type: 'success', text: existingTagsByName && existingTagsByName.length > 0 ? 'Existing tag added successfully' : 'New tag created and added successfully' });
      }
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
          border: '1px solid #333',
          backgroundColor: '#121212',
          color: '#e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
          maxWidth: '500px',
          width: '90%',
          minHeight: '360px'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000
        }
      }}
    >
      <div style={{ padding: '1rem' }}>
        <ModalHeader>
          <h2>Manage Tags</h2>
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
                  key={suggestion.tag_id || suggestion.id}
                  onClick={() => handleAddTag(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name} {suggestion.tag_id || suggestion.id ? '' : '(Missing ID)'}
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
              border: '3px solid #222', 
              borderTop: '3px solid #00ff00', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite' 
            }}></div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default TagsModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 