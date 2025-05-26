import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Modal from 'react-modal';
import { FiX, FiTag, FiPlus, FiSearch } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-toastify';

// Set the app element for react-modal
if (typeof window !== 'undefined') {
  Modal.setAppElement('#root');
}

// Styled components matching TagsModal
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
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 255, 0, 0.1);
  }

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

  &::placeholder {
    color: #666;
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

const DealTagsModal = ({ isOpen, onRequestClose, deal, onTagsUpdated }) => {
  const [currentTags, setCurrentTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen && deal) {
      const effectiveDealId = deal.deal_id || deal.id;
      console.log("DealTagsModal opened with deal:", effectiveDealId, deal.opportunity);
      console.log("Full deal object received:", deal);
      
      if (!effectiveDealId) {
        console.error("DealTagsModal opened with deal missing ID:", deal);
      }
      
      fetchCurrentTags();
      fetchAvailableTags();
    } else if (isOpen && !deal) {
      console.error("DealTagsModal opened but no deal was provided!");
      console.log("isOpen:", isOpen, "deal:", deal);
    }
  }, [isOpen, deal]);

  // Store deal in local state to prevent issues if parent component's state changes
  const [localDeal, setLocalDeal] = useState(null);
  
  // Update local deal when prop changes
  useEffect(() => {
    // Only process deal data when the modal is actually open
    if (isOpen && deal) {
      // Ensure deal_id is available - use id as fallback
      const effectiveDealId = deal.deal_id || deal.id;
      
      // Log the entire deal object for debugging
      console.log("Deal received in DealTagsModal:", { 
        id: deal.id,
        deal_id: deal.deal_id,
        effectiveDealId,
        opportunity: deal.opportunity,
        hasTags: !!deal.tags,
        tagCount: deal.tags?.length
      });
      
      // Fix tags if missing and ensure deal_id is set
      const dealWithTags = {
        ...deal,
        deal_id: effectiveDealId, // Ensure deal_id is always set
        tags: deal.tags || [] // Ensure tags always exists
      };
      
      setLocalDeal(dealWithTags);
      setCurrentTags(dealWithTags.tags || []);
    } else if (!isOpen) {
      // Clear local state when modal is closed
      setLocalDeal(null);
      setCurrentTags([]);
      setSearchTerm('');
      setMessage({ type: '', text: '' });
    }
  }, [deal, isOpen]);

  // Fetch current tags for the deal
  const fetchCurrentTags = async () => {
    const dealToUse = deal || localDeal;
    const effectiveDealId = dealToUse?.deal_id || dealToUse?.id;
    
    if (!effectiveDealId) {
      console.error("Cannot fetch current tags: No deal ID available");
      return;
    }

    try {
      console.log("Fetching current tags for deal:", effectiveDealId);
      
      // Get tag connections for this deal
      const { data: tagConnections, error: connectionsError } = await supabase
        .from('deal_tags')
        .select('tag_id')
        .eq('deal_id', effectiveDealId);
        
      if (connectionsError) throw connectionsError;
      
      if (!tagConnections || tagConnections.length === 0) {
        setCurrentTags([]);
        return;
      }
      
      // Get tag details
      const tagIds = tagConnections.map(tc => tc.tag_id);
      const { data: tagDetails, error: detailsError } = await supabase
        .from('tags')
        .select('tag_id, name')
        .in('tag_id', tagIds);
        
      if (detailsError) throw detailsError;
      
      setCurrentTags(tagDetails || []);
    } catch (error) {
      console.error('Error fetching current tags:', error);
      setMessage({ type: 'error', text: 'Failed to load current tags' });
    }
  };

  // Fetch all available tags from the database
  const fetchAvailableTags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .order('name');
        
      if (error) throw error;
      
      console.log("Available tags fetched:", data?.length);
      
      const validTags = data?.filter(tag => {
        if (!tag.tag_id) {
          console.warn("Found tag without tag_id:", tag);
          return false;
        }
        return true;
      }) || [];
      
      setAvailableTags(validTags);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setMessage({ type: 'error', text: 'Failed to load tags' });
    } finally {
      setLoading(false);
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
    if (searchTerm.length >= 2) {
      fetchTagSuggestions(searchTerm);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, currentTags]);

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return typeof id === 'string' && uuidRegex.test(id);
  };

  // Add a tag to the current deal
  const handleAddTag = async (tagToAdd) => {
    const dealToUse = deal || localDeal;
    const effectiveDealId = dealToUse?.deal_id || dealToUse?.id;
    
    if (!dealToUse || !effectiveDealId) {
      console.error("Cannot add tag: No deal object available");
      setMessage({ type: 'error', text: "Cannot add tag: No deal selected" });
      return false;
    }
    
    if (!isValidUUID(effectiveDealId)) {
      console.error("Cannot add tag: Deal ID is not a valid UUID", effectiveDealId);
      setMessage({ type: 'error', text: "Cannot add tag: Invalid deal ID format" });
      return false;
    }
    
    const tagId = tagToAdd.tag_id || tagToAdd.id;
    
    if (!tagId) {
      console.error("Cannot add tag: Missing tag ID", tagToAdd);
      setMessage({ type: 'error', text: "Cannot add tag: Missing tag information" });
      return false;
    }
    
    try {
      setLoading(true);
      
      console.log(`Adding tag ${tagId} to deal ${effectiveDealId}`);
      
      // Check if this tag is already on the deal
      const { data: existingTag, error: checkError } = await supabase
        .from('deal_tags')
        .select('*')
        .eq('deal_id', effectiveDealId)
        .eq('tag_id', tagId)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingTag) {
        console.log("Tag already exists on this deal");
        setMessage({ type: 'success', text: "This tag is already on the deal" });
        return true;
      }
      
      // Add the tag
      const { error } = await supabase
        .from('deal_tags')
        .insert({
          deal_id: effectiveDealId,
          tag_id: tagId
        });
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: "Tag added successfully" });
      
      // Refresh current tags
      await fetchCurrentTags();
      
      // Notify parent component about the change
      if (onTagsUpdated) {
        const updatedTags = [...currentTags, tagToAdd];
        onTagsUpdated(updatedTags);
      }
      
      // Clear search
      setSearchTerm('');
      setShowSuggestions(false);
      
      return true;
    } catch (error) {
      console.error('Error adding tag to deal:', error);
      setMessage({ type: 'error', text: 'Failed to add tag to deal' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove a tag from the current deal
  const handleRemoveTag = async (tagToRemove) => {
    const dealToUse = deal || localDeal;
    const effectiveDealId = dealToUse?.deal_id || dealToUse?.id;
    
    if (!dealToUse || !effectiveDealId) {
      console.error("Cannot remove tag: No deal object available");
      setMessage({ type: 'error', text: "Cannot remove tag: No deal selected" });
      return false;
    }
    
    if (!isValidUUID(effectiveDealId)) {
      console.error("Cannot remove tag: Deal ID is not a valid UUID", effectiveDealId);
      setMessage({ type: 'error', text: "Cannot remove tag: Invalid deal ID format" });
      return false;
    }
    
    const tagId = tagToRemove.tag_id;
    
    if (!tagId) {
      console.error("Cannot remove tag: Missing tag ID", tagToRemove);
      setMessage({ type: 'error', text: "Cannot remove tag: Missing tag information" });
      return false;
    }
    
    try {
      setLoading(true);
      
      console.log(`Removing tag ${tagId} from deal ${effectiveDealId}`);
      
      // Remove the tag
      const { error } = await supabase
        .from('deal_tags')
        .delete()
        .eq('deal_id', effectiveDealId)
        .eq('tag_id', tagId);
        
      if (error) throw error;
      
      setMessage({ type: 'success', text: "Tag removed successfully" });
      
      // Refresh current tags
      await fetchCurrentTags();
      
      // Notify parent component about the change
      if (onTagsUpdated) {
        const updatedTags = currentTags.filter(tag => tag.tag_id !== tagId);
        onTagsUpdated(updatedTags);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing tag from deal:', error);
      setMessage({ type: 'error', text: 'Failed to remove tag from deal' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setLoading(true);
      
      // Check if tag already exists (case insensitive)
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', searchTerm.trim());
        
      if (checkError) throw checkError;
      
      if (existingTags && existingTags.length > 0) {
        // Tag already exists, use it
        const existingTag = existingTags[0];
        console.log("Using existing tag:", existingTag);
        
        // Try to add this tag to the deal
        await handleAddTag(existingTag);
        return;
      }
      
      // Create new tag
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: searchTerm.trim() })
        .select('tag_id, name')
        .single();
        
      if (error) throw error;
      
      console.log("New tag created:", data);
      
      // Add this new tag to the deal
      await handleAddTag(data);
      
      // Refresh available tags
      fetchAvailableTags();
      
      setMessage({ type: 'success', text: `Created new tag "${searchTerm.trim()}"` });
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage({ type: 'error', text: 'Failed to create tag' });
    } finally {
      setLoading(false);
    }
  };

  // Handle input change in search field
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // If no deal is provided, show an error message instead of the regular UI
  if (!deal) {
    console.warn("DealTagsModal received null deal");
    
    if (isOpen) {
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
              <h2>Cannot Manage Tags</h2>
              <button onClick={onRequestClose}>
                <FiX size={20} />
              </button>
            </ModalHeader>
            <div style={{ padding: '20px', color: '#ff6666', textAlign: 'center' }}>
              <p>No valid deal was selected. Please try again by selecting a deal first.</p>
              <Button className="primary" onClick={onRequestClose} style={{ marginTop: '20px' }}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      );
    }
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        console.log("Closing DealTagsModal for deal:", deal?.deal_id);
        onRequestClose();
        setSearchTerm(''); // Clear search term when modal is closed
        setMessage({ type: '', text: '' }); // Clear messages
      }}
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
            {currentTags.map(tag => (
              <Tag 
                key={tag.tag_id} 
                onClick={() => handleRemoveTag(tag)}
              >
                <span title={tag.name}>{tag.name.length > 25 ? `${tag.name.substring(0, 25)}...` : tag.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag);
                  }}
                  disabled={loading}
                >
                  <FiX size={14} />
                </button>
              </Tag>
            ))}
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
              onChange={handleSearchChange}
              placeholder="Search or create new tag..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.tag_id}
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

        {message && message.text && (
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

export default DealTagsModal;

// Add CSS for spinner
const style = document.createElement('style');
style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);