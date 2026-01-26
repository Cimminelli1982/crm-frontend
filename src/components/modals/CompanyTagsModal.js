import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { supabase } from '../../lib/supabaseClient';

// Styled Components
const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const ModalTitle = styled.h3`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  }
`;

const ModalBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const Section = styled.div`
  margin-bottom: 24px;
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
`;

const ItemsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  min-height: 32px;
`;

const ItemTag = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: ${props => props.theme === 'light' ? '#FEF3C7' : '#78350F'};
  color: ${props => props.theme === 'light' ? '#92400E' : '#FDE68A'};
  border: 1px solid ${props => props.theme === 'light' ? '#FDE68A' : '#F59E0B'};
  border-radius: 20px;
  font-size: 0.875rem;
  gap: 8px;
  max-width: 200px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 140px;
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: ${props => props.theme === 'light' ? '#EF4444' : '#F87171'};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyMessage = styled.div`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-style: italic;
  padding: 8px;
`;

const SearchContainer = styled.div`
  margin-bottom: 12px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${props => props.theme === 'light' ? '#D1D5DB' : '#4B5563'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  border-radius: 8px;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  }

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const SuggestionsContainer = styled.div`
  border: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#374151'};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SuggestionItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  transition: background-color 0.2s;

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#4B5563'};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const NoResults = styled.div`
  padding: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.875rem;
  text-align: center;
`;

const CreateButton = styled.button`
  width: 100%;
  text-align: left;
  padding: 12px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#4B5563'};
  cursor: pointer;
  font-size: 0.875rem;
  color: ${props => props.theme === 'light' ? '#059669' : '#10B981'};
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.2s;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};

  &:hover {
    background: ${props => props.theme === 'light' ? '#F3F4F6' : '#6B7280'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 0.875rem;

  ${props => {
    if (props.type === 'success') {
      return `
        background: ${props.theme === 'light' ? '#D1FAE5' : '#064E3B'};
        color: ${props.theme === 'light' ? '#065F46' : '#6EE7B7'};
      `;
    } else if (props.type === 'error') {
      return `
        background: ${props.theme === 'light' ? '#FEE2E2' : '#7F1D1D'};
        color: ${props.theme === 'light' ? '#B91C1C' : '#FCA5A5'};
      `;
    } else if (props.type === 'info') {
      return `
        background: ${props.theme === 'light' ? '#EFF6FF' : '#1E3A8A'};
        color: ${props.theme === 'light' ? '#1D4ED8' : '#DBEAFE'};
      `;
    }
  }}
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  display: flex;
  justify-content: flex-end;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
`;

const DoneButton = styled.button`
  background: ${props => props.theme === 'light' ? '#3B82F6' : '#60A5FA'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme === 'light' ? '#2563EB' : '#3B82F6'};
  }
`;

const CompanyTagsModal = ({
  isOpen,
  onRequestClose,
  company,
  theme = 'light'
}) => {
  const [currentTags, setCurrentTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const entityId = company?.id;

  // Fetch current tags for the company
  const fetchCurrentTags = async () => {
    if (!entityId) return;

    try {
      const { data, error } = await supabase
        .from('company_tags')
        .select('entry_id, tag_id, tags(tag_id, name)')
        .eq('company_id', entityId);

      if (error) throw error;
      setCurrentTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      setMessage({ type: 'error', text: 'Failed to load tags' });
    }
  };

  // Fetch tag suggestions based on search term
  const fetchTagSuggestions = async (search) => {
    try {
      if (search.length < 2) {
        setSuggestions([]);
        return;
      }

      const { data, error } = await supabase
        .from('tags')
        .select('tag_id, name')
        .ilike('name', `%${search}%`)
        .limit(10);

      if (error) throw error;

      // Filter out tags that are already assigned
      const filteredSuggestions = data.filter(tag =>
        !currentTags.some(ct => ct.tags?.tag_id === tag.tag_id || ct.tag_id === tag.tag_id)
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
  }, [searchTerm, currentTags]);

  const handleRemoveTag = async (tagToRemove) => {
    try {
      setLoading(true);
      const tagId = tagToRemove.tags?.tag_id || tagToRemove.tag_id;

      const { error } = await supabase
        .from('company_tags')
        .delete()
        .eq('company_id', entityId)
        .eq('tag_id', tagId);

      if (error) throw error;

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
      const tagId = tagToAdd.tag_id;

      // Check if already associated
      const { data: existingTag } = await supabase
        .from('company_tags')
        .select('*')
        .eq('company_id', entityId)
        .eq('tag_id', tagId)
        .single();

      if (existingTag) {
        setMessage({ type: 'info', text: 'Tag already exists' });
        setSearchTerm('');
        setShowSuggestions(false);
        return;
      }

      const { error } = await supabase
        .from('company_tags')
        .insert({
          company_id: entityId,
          tag_id: tagId
        });

      if (error) throw error;

      await fetchCurrentTags();
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: 'success', text: 'Tag added successfully' });
    } catch (error) {
      console.error('Error adding tag:', error);
      setMessage({ type: 'error', text: `Failed to add tag: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);

      // Check if tag with this name already exists
      const { data: existingTags } = await supabase
        .from('tags')
        .select('*')
        .ilike('name', searchTerm.trim())
        .limit(1);

      let tagToUse;

      if (existingTags && existingTags.length > 0) {
        tagToUse = existingTags[0];
      } else {
        const { data: newTag, error } = await supabase
          .from('tags')
          .insert({ name: searchTerm.trim() })
          .select()
          .single();

        if (error) throw error;
        tagToUse = newTag;
      }

      if (tagToUse) {
        await handleAddTag(tagToUse);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
      setMessage({ type: 'error', text: 'Failed to create tag' });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
          padding: '0',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          backgroundColor: theme === 'light' ? '#FFFFFF' : '#1F2937',
          border: `1px solid ${theme === 'light' ? '#E5E7EB' : '#374151'}`,
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 9999
        }
      }}
    >
      <ModalHeader theme={theme}>
        <ModalTitle theme={theme}>Manage Company Tags</ModalTitle>
        <CloseButton theme={theme} onClick={onRequestClose}>×</CloseButton>
      </ModalHeader>

      <ModalBody theme={theme}>
        <Section>
          <SectionTitle theme={theme}>Current Tags</SectionTitle>
          <ItemsList>
            {currentTags.map((tagRelation, index) => (
              <ItemTag key={tagRelation.entry_id || index} theme={theme}>
                <span>{tagRelation.tags?.name || 'Unknown'}</span>
                <RemoveButton
                  theme={theme}
                  onClick={() => handleRemoveTag(tagRelation)}
                  disabled={loading}
                >
                  ×
                </RemoveButton>
              </ItemTag>
            ))}
            {currentTags.length === 0 && (
              <EmptyMessage theme={theme}>No tags assigned</EmptyMessage>
            )}
          </ItemsList>
        </Section>

        <Section>
          <SectionTitle theme={theme}>Add Tags</SectionTitle>
          <SearchContainer>
            <SearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or create a tag..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer theme={theme}>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.tag_id}
                  theme={theme}
                  onClick={() => handleAddTag(suggestion)}
                  disabled={loading}
                >
                  {suggestion.name}
                </SuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <NoResults theme={theme}>No tags found</NoResults>
              )}
              {searchTerm.length >= 2 && (
                <CreateButton
                  theme={theme}
                  onClick={handleCreateTag}
                  disabled={loading}
                >
                  + Create "{searchTerm}" as new tag
                </CreateButton>
              )}
            </SuggestionsContainer>
          )}
        </Section>

        {message.text && (
          <Message theme={theme} type={message.type}>
            {message.text}
          </Message>
        )}
      </ModalBody>

      <ModalFooter theme={theme}>
        <DoneButton theme={theme} onClick={onRequestClose}>Done</DoneButton>
      </ModalFooter>
    </Modal>
  );
};

export default CompanyTagsModal;
