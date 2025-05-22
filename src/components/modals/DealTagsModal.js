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

// Styled components
const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
  
  h2 {
    margin: 0;
    color: #00ff00;
    font-family: 'Courier New', monospace;
  }
  
  button {
    background: none;
    border: none;
    color: #00ff00;
    font-size: 18px;
    cursor: pointer;
    
    &:hover {
      color: #fff;
    }
  }
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
`;

const TagItem = styled.div`
  display: flex;
  align-items: center;
  background-color: ${props => props.$selected ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 255, 0, 0.1)'};
  border: 1px solid #00ff00;
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 255, 0, 0.2);
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.3);
  }
`;

const TagsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  padding-top: 15px;
  border-top: 1px solid #333;
`;

const SearchContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
`;

const SearchInput = styled.input`
  background-color: #222;
  color: #fff;
  border: 1px solid #444;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Courier New', monospace;
  width: 100%;
  
  &:focus {
    outline: none;
    border-color: #00ff00;
    box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
  }
  
  &::placeholder {
    color: #666;
  }
`;

const TagsTitle = styled.h3`
  color: #00ff00;
  font-family: 'Courier New', monospace;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  
  svg {
    stroke: #00ff00;
  }
`;

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 150px;
  overflow-y: auto;
  background-color: #1a1a1a;
  border: 1px solid #333;
  border-top: none;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #222;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: #00ff00;
    border-radius: 3px;
  }
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  color: #ccc;
  
  &:hover {
    background-color: #333;
    color: #00ff00;
  }
  
  &.highlight {
    background-color: #333;
    color: #00ff00;
  }
`;

// Modal styles
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#121212',
    color: '#00ff00',
    border: '1px solid #00ff00',
    borderRadius: '4px',
    padding: '20px',
    maxWidth: '80%',
    maxHeight: '80%',
    overflow: 'auto'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

const DealTagsModal = ({ isOpen, onRequestClose, deal, onTagsUpdated }) => {
  const [availableTags, setAvailableTags] = useState([]);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen && deal) {
      const effectiveDealId = deal.deal_id || deal.id;
      console.log("DealTagsModal opened with deal:", effectiveDealId, deal.opportunity);
      
      if (!effectiveDealId) {
        console.error("DealTagsModal opened with deal missing ID:", deal);
      }
      
      fetchAvailableTags();
    } else if (isOpen && !deal) {
      console.error("DealTagsModal opened but no deal was provided!");
    }
  }, [isOpen, deal]);

  // Store deal in local state to prevent issues if parent component's state changes
  const [localDeal, setLocalDeal] = useState(null);
  
  // Update local deal when prop changes
  useEffect(() => {
    if (deal) {
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
    }
  }, [deal]);

  // Fetch all available tags from the database
  const fetchAvailableTags = async () => {
    // Continue even if deal is missing - we'll just show available tags
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')  // Explicitly select the fields we need
        .order('name');
        
      if (error) throw error;
      
      console.log("Available tags fetched:", data?.length);
      
      // Verify that each tag has tag_id
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
      toast.error('Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new tag
  const handleCreateTag = async (tagName) => {
    if (!deal || !tagName.trim()) return null;
    
    try {
      setLoading(true);
      
      // Check if tag already exists (case insensitive)
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', tagName.trim());
        
      if (checkError) throw checkError;
      
      if (existingTags && existingTags.length > 0) {
        // Tag already exists, use it
        const existingTag = existingTags[0];
        console.log("Using existing tag:", existingTag);
        
        // Try to add this tag to the deal
        await addTagToDeal(existingTag.tag_id);
        
        return existingTag.tag_id;
      }
      
      // Create new tag
      const { data, error } = await supabase
        .from('tags')
        .insert({ name: tagName.trim() })
        .select('tag_id, name')
        .single();
        
      if (error) throw error;
      
      console.log("New tag created:", data);
      
      // Add this new tag to the deal
      await addTagToDeal(data.tag_id);
      
      // Refresh available tags
      fetchAvailableTags();
      
      toast.success(`Created new tag "${tagName.trim()}"`);
      return data.tag_id;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Failed to create tag');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to check if a string is a valid UUID
  const isValidUUID = (id) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return typeof id === 'string' && uuidRegex.test(id);
  };

  // Add a tag to the current deal
  const addTagToDeal = async (tagId) => {
    // Use localDeal as a fallback if deal prop changes
    const dealToUse = deal || localDeal;
    
    // Debug what we actually have
    console.log("addTagToDeal called with:", {
      tagId,
      dealProp: deal ? {
        id: deal.id,
        deal_id: deal.deal_id,
        opportunity: deal.opportunity
      } : null,
      localDealState: localDeal ? {
        id: localDeal.id,
        deal_id: localDeal.deal_id, 
        opportunity: localDeal.opportunity
      } : null
    });
    
    if (!dealToUse) {
      console.error("Cannot add tag: No deal object available");
      toast.error("Cannot add tag: No deal selected");
      return false;
    }
    
    // Check if we're missing both id and deal_id
    if (!dealToUse.deal_id && !dealToUse.id) {
      console.error("Cannot add tag: Deal is missing both id and deal_id", dealToUse);
      toast.error("Cannot add tag: Deal missing ID information");
      return false;
    }
    
    // Ensure we have a deal_id even if it's not directly available
    const effectiveDealId = dealToUse.deal_id || dealToUse.id;
    
    // Validate the deal ID is a proper UUID before proceeding
    if (!isValidUUID(effectiveDealId)) {
      console.error("Cannot add tag: Deal ID is not a valid UUID", effectiveDealId);
      toast.error("Cannot add tag: Invalid deal ID format");
      return false;
    }
    
    if (!effectiveDealId || !tagId) {
      console.error("Cannot add tag: Missing deal or tag ID", { 
        hasDeal: !!dealToUse, 
        hasId: dealToUse?.id,
        dealId: dealToUse?.deal_id,
        effectiveDealId,
        tagId 
      });
      toast.error("Cannot add tag: Missing deal information");
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
        toast.info("This tag is already on the deal");
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
      
      toast.success("Tag added successfully");
      
      // Notify parent component about the change
      if (onTagsUpdated) {
        // Fetch the updated deal tags
        // Get all tags for this deal
        const { data: tagConnections, error: fetchError } = await supabase
          .from('deal_tags')
          .select('tag_id')
          .eq('deal_id', effectiveDealId);
          
        if (fetchError) {
          console.error("Error fetching updated tags:", fetchError);
          return true; // Still consider the operation successful
        }
        
        // If no tags, return empty array
        if (!tagConnections || tagConnections.length === 0) {
          onTagsUpdated([]);
          return true;
        }
        
        // Now fetch the tag details
        const tagIds = tagConnections.map(tc => tc.tag_id);
        const { data: tagDetails, error: tagDetailsError } = await supabase
          .from('tags')
          .select('tag_id, name')
          .in('tag_id', tagIds);
          
        if (tagDetailsError) {
          console.error("Error fetching tag details:", tagDetailsError);
          return true; // Still consider the operation successful
        }
        
        // Send the tag details back to the parent
        onTagsUpdated(tagDetails || []);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding tag to deal:', error);
      toast.error('Failed to add tag to deal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove a tag from the current deal
  const removeTagFromDeal = async (tagId) => {
    // Use localDeal as a fallback if deal prop changes
    const dealToUse = deal || localDeal;
    
    // Ensure we have a deal_id even if it's not directly available
    const effectiveDealId = dealToUse?.deal_id || dealToUse?.id;
    
    if (!dealToUse || !effectiveDealId || !tagId) {
      console.error("Cannot remove tag: Missing deal or tag ID", {
        hasDeal: !!dealToUse,
        hasId: dealToUse?.id,
        dealId: dealToUse?.deal_id,
        effectiveDealId,
        tagId
      });
      toast.error("Cannot remove tag: Missing deal information");
      return false;
    }
    
    // Validate the deal ID is a proper UUID before proceeding
    if (!isValidUUID(effectiveDealId)) {
      console.error("Cannot remove tag: Deal ID is not a valid UUID", effectiveDealId);
      toast.error("Cannot remove tag: Invalid deal ID format");
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
      
      toast.success("Tag removed successfully");
      
      // Notify parent component about the change
      if (onTagsUpdated) {
        // Fetch the updated deal tags
        // Get all tags for this deal
        const { data: tagConnections, error: fetchError } = await supabase
          .from('deal_tags')
          .select('tag_id')
          .eq('deal_id', effectiveDealId);
          
        if (fetchError) {
          console.error("Error fetching updated tags:", fetchError);
          return true; // Still consider the operation successful
        }
        
        // If no tags, return empty array
        if (!tagConnections || tagConnections.length === 0) {
          onTagsUpdated([]);
          return true;
        }
        
        // Now fetch the tag details
        const tagIds = tagConnections.map(tc => tc.tag_id);
        const { data: tagDetails, error: tagDetailsError } = await supabase
          .from('tags')
          .select('tag_id, name')
          .in('tag_id', tagIds);
          
        if (tagDetailsError) {
          console.error("Error fetching tag details:", tagDetailsError);
          return true; // Still consider the operation successful
        }
        
        // Send the tag details back to the parent
        onTagsUpdated(tagDetails || []);
      }
      
      return true;
    } catch (error) {
      console.error('Error removing tag from deal:', error);
      toast.error('Failed to remove tag from deal');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle input change in search field
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setTagSearchTerm(value);
    setShowSuggestions(value.trim().length > 0);
  };

  // Filter available tags based on search term
  const filteredTags = tagSearchTerm.trim() === '' 
    ? availableTags 
    : availableTags.filter(tag => 
        tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
      );

  // Check if we need to show the "Create New Tag" option
  const showCreateOption = tagSearchTerm.trim() !== '' && 
    !filteredTags.some(tag => tag.name.toLowerCase() === tagSearchTerm.toLowerCase());

  // Handle tag click for adding
  const handleTagClick = (tagId) => {
    // Use localDeal as a fallback if deal prop is null or undefined
    const currentDeal = deal || localDeal;
    
    // Attempt to determine a valid deal ID, with robust error handling
    let effectiveDealId;
    try {
      if (!currentDeal) {
        console.warn("No deal selected for tag operation");
        toast.error("Cannot add tag: No deal selected");
        return;
      } 
      
      effectiveDealId = currentDeal.deal_id || currentDeal.id;
      
      // Validate the deal ID is a proper UUID
      if (!effectiveDealId || !isValidUUID(effectiveDealId)) {
        console.error("Invalid deal ID format:", effectiveDealId);
        toast.error("Cannot add tag: Invalid deal format");
        return;
      }
      
      console.log("Tag click - using deal:", effectiveDealId, "tag:", tagId);
      
      // Check if tagId is properly formatted before proceeding
      if (!tagId) {
        console.error("Invalid tag ID:", tagId);
        toast.error("Invalid tag selected");
        return;
      }
      
      addTagToDeal(tagId);
    } catch (err) {
      console.error("Error in handleTagClick:", err);
      toast.error("An error occurred while processing the tag");
    }
  };

  // Handle tag click for removing
  const handleTagRemoveClick = (tagId) => {
    // Use localDeal as a fallback if deal prop is null or undefined
    const currentDeal = deal || localDeal;
    
    // Attempt to determine a valid deal ID, with robust error handling
    let effectiveDealId;
    try {
      if (!currentDeal) {
        console.warn("No deal selected for tag removal");
        toast.error("Cannot remove tag: No deal selected");
        return;
      } 
      
      effectiveDealId = currentDeal.deal_id || currentDeal.id;
      
      // Validate the deal ID is a proper UUID
      if (!effectiveDealId || !isValidUUID(effectiveDealId)) {
        console.error("Invalid deal ID format for removal:", effectiveDealId);
        toast.error("Cannot remove tag: Invalid deal format");
        return;
      }
      
      console.log("Tag removal - using deal:", effectiveDealId, "tag:", tagId);
      
      // Check if tagId is properly formatted before proceeding
      if (!tagId) {
        console.error("Invalid tag ID:", tagId);
        toast.error("Invalid tag selected");
        return;
      }
      
      removeTagFromDeal(tagId);
    } catch (err) {
      console.error("Error in handleTagRemoveClick:", err);
      toast.error("An error occurred while processing the tag removal");
    }
  };

  // Handle creating and adding a new tag
  const handleCreateAndAddTag = () => {
    if (!tagSearchTerm.trim()) return;
    
    handleCreateTag(tagSearchTerm.trim());
    setTagSearchTerm('');
    setShowSuggestions(false);
  };

  // If no deal is provided, show an error message instead of the regular UI
  if (!deal) {
    console.warn("DealTagsModal received null deal");
    
    if (isOpen) {
      return (
        <Modal
          isOpen={isOpen}
          onRequestClose={onRequestClose}
          style={modalStyles}
          contentLabel="Manage Tags"
        >
          <ModalContent>
            <ModalHeader>
              <h2>Cannot Manage Tags</h2>
              <button onClick={onRequestClose}>✕</button>
            </ModalHeader>
            <div style={{ padding: '20px', color: '#ff6666', textAlign: 'center' }}>
              <p>No valid deal was selected. Please try again by selecting a deal first.</p>
              <button 
                onClick={onRequestClose}
                style={{ 
                  marginTop: '20px', 
                  padding: '8px 16px', 
                  background: 'transparent',
                  border: '1px solid #00ff00',
                  color: '#00ff00',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </ModalContent>
        </Modal>
      );
    }
    return null;
  } else if (!deal.id && !deal.deal_id) {
    console.warn("DealTagsModal received deal without id or deal_id", deal);
    // Continue to render, the validation in the tag operations will prevent API calls
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={() => {
        console.log("Closing DealTagsModal for deal:", deal?.deal_id);
        onRequestClose();
        setTagSearchTerm(''); // Clear search term when modal is closed
      }}
      style={modalStyles}
      contentLabel="Manage Tags"
    >
      <ModalContent>
        <ModalHeader>
          <h2>Manage Tags for {deal?.opportunity || 'Deal'}</h2>
          <button onClick={onRequestClose}>✕</button>
        </ModalHeader>

        {/* Current deal tags */}
        <div>
          <TagsTitle>
            <FiTag size={16} />
            CURRENT TAGS
          </TagsTitle>
          <TagsContainer>
            {deal?.tags && Array.isArray(deal.tags) && deal.tags.length > 0 ? (
              deal.tags.map((tag, index) => (
                <TagItem 
                  key={tag.tag_id || `tag-${index}`} 
                  $selected={true}
                  onClick={() => tag.tag_id ? handleTagRemoveClick(tag.tag_id) : null}
                >
                  {tag.name || 'Unnamed Tag'}
                  <span style={{ marginLeft: '6px', fontSize: '12px' }}>✕</span>
                </TagItem>
              ))
            ) : (
              <div style={{ color: '#888', fontStyle: 'italic' }}>No tags yet</div>
            )}
          </TagsContainer>
        </div>

        {/* Search for tags */}
        <TagsSection>
          <TagsTitle>
            <FiSearch size={16} />
            ADD TAGS
          </TagsTitle>
          <SearchContainer>
            <div style={{ position: 'relative' }}>
              <SearchInput
                type="text"
                placeholder="Search or type new tag name..."
                value={tagSearchTerm}
                onChange={handleSearchChange}
              />
              {showSuggestions && (
                <SuggestionsContainer>
                  {filteredTags.length > 0 ? (
                    filteredTags
                      .filter(tag => {
                        // Safely filter existing tags
                        if (!deal?.tags || !Array.isArray(deal.tags)) return true;
                        return !deal.tags.some(t => t && t.tag_id && t.tag_id === tag.tag_id);
                      })
                      .map(tag => (
                        <SuggestionItem 
                          key={tag.tag_id || `suggestion-${tag.name}`}
                          onClick={() => tag.tag_id ? handleTagClick(tag.tag_id) : null}
                        >
                          {tag.name || 'Unnamed Tag'}
                          <span style={{ marginLeft: '6px', fontSize: '12px' }}>+</span>
                        </SuggestionItem>
                      ))
                  ) : (
                    <SuggestionItem style={{ fontStyle: 'italic', color: '#888' }}>
                      No matching tags found
                    </SuggestionItem>
                  )}
                  
                  {showCreateOption && (
                    <SuggestionItem 
                      style={{ 
                        color: '#00ff00', 
                        borderTop: '1px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onClick={handleCreateAndAddTag}
                    >
                      <FiPlus size={14} /> Create "{tagSearchTerm}"
                    </SuggestionItem>
                  )}
                </SuggestionsContainer>
              )}
            </div>
          </SearchContainer>
        </TagsSection>
        
        {loading && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>
            Loading...
          </div>
        )}
      </ModalContent>
    </Modal>
  );
};

export default DealTagsModal;