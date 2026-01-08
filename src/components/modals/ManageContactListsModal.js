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
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ListTypeLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${props => props.listType === 'static'
    ? (props.theme === 'light' ? '#DBEAFE' : '#1E3A8A')
    : (props.theme === 'light' ? '#FEF3C7' : '#78350F')};
  color: ${props => props.listType === 'static'
    ? (props.theme === 'light' ? '#1D4ED8' : '#93C5FD')
    : (props.theme === 'light' ? '#92400E' : '#FDE68A')};
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
  background: ${props => props.theme === 'light' ? '#DBEAFE' : '#1E3A8A'};
  color: ${props => props.theme === 'light' ? '#1D4ED8' : '#93C5FD'};
  border: 1px solid ${props => props.theme === 'light' ? '#93C5FD' : '#3B82F6'};
  border-radius: 20px;
  font-size: 0.875rem;
  gap: 8px;
  max-width: 250px;

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
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
  max-height: 250px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;

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

const SuggestionInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SuggestionName = styled.span`
  font-weight: 500;
`;

const SuggestionDescription = styled.span`
  font-size: 0.75rem;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
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

const InfoText = styled.p`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  font-size: 0.75rem;
  margin: 0 0 12px 0;
  font-style: italic;
`;

const ManageContactListsModal = ({
  isOpen,
  onClose,
  contact,
  theme = 'dark',
  onListsUpdated
}) => {
  const [contactLists, setContactLists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch contact's lists (only static lists - can be manually added)
  const fetchContactLists = async () => {
    if (!contact?.contact_id) return;

    try {
      const { data, error } = await supabase
        .from('email_list_members')
        .select(`
          list_member_id,
          list_id,
          email_lists (
            list_id,
            name,
            description,
            list_type
          )
        `)
        .eq('contact_id', contact.contact_id)
        .eq('is_active', true);

      if (error) throw error;
      setContactLists(data || []);
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    }
  };

  useEffect(() => {
    if (isOpen && contact?.contact_id) {
      fetchContactLists();
      setSearchTerm('');
      setShowSuggestions(false);
      setMessage({ type: '', text: '' });
    }
  }, [isOpen, contact?.contact_id]);

  // Fetch list suggestions (only static lists can be manually added)
  const fetchListSuggestions = async (search) => {
    try {
      let query = supabase
        .from('email_lists')
        .select('*')
        .eq('is_active', true)
        .eq('list_type', 'static') // Only static lists can be manually managed
        .order('name');

      if (search.length >= 2) {
        query = query.ilike('name', `%${search}%`);
      }

      const { data, error } = await query.limit(15);

      if (error) throw error;

      // Filter out lists already connected
      const filteredSuggestions = data.filter(list => {
        return !contactLists.some(membership => membership.list_id === list.list_id);
      });

      setSuggestions(filteredSuggestions);
    } catch (error) {
      console.error('Error fetching list suggestions:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchListSuggestions(searchTerm);
      setShowSuggestions(true);
    }
  }, [searchTerm, contactLists, isOpen]);

  const handleAddToList = async (listToAdd) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('email_list_members')
        .insert({
          list_id: listToAdd.list_id,
          contact_id: contact.contact_id,
          added_by: 'User',
          is_active: true
        });

      if (error) throw error;

      await fetchContactLists();
      if (onListsUpdated) onListsUpdated();
      setSearchTerm('');
      setMessage({ type: 'success', text: `Added to "${listToAdd.name}"` });
    } catch (error) {
      console.error('Error adding to list:', error);
      setMessage({ type: 'error', text: `Failed to add to list: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (membership) => {
    try {
      setLoading(true);

      // Check if this is a dynamic list - cannot remove from dynamic lists
      if (membership.email_lists?.list_type === 'dynamic') {
        setMessage({ type: 'error', text: 'Cannot remove from dynamic lists. Update the contact to change dynamic list membership.' });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('email_list_members')
        .delete()
        .eq('list_member_id', membership.list_member_id);

      if (error) throw error;

      await fetchContactLists();
      if (onListsUpdated) onListsUpdated();
      setMessage({ type: 'success', text: 'Removed from list' });
    } catch (error) {
      console.error('Error removing from list:', error);
      setMessage({ type: 'error', text: 'Failed to remove from list' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async () => {
    try {
      setLoading(true);

      // Check if list already exists
      const { data: existingLists } = await supabase
        .from('email_lists')
        .select('*')
        .ilike('name', searchTerm.trim())
        .limit(1);

      let listToUse;

      if (existingLists && existingLists.length > 0) {
        listToUse = existingLists[0];
      } else {
        const { data, error } = await supabase
          .from('email_lists')
          .insert({
            name: searchTerm.trim(),
            list_type: 'static',
            created_by: 'User',
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;
        listToUse = data;
      }

      if (listToUse) {
        await handleAddToList(listToUse);
      }
    } catch (error) {
      console.error('Error creating list:', error);
      setMessage({ type: 'error', text: 'Failed to create list' });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Separate static and dynamic lists
  const staticLists = contactLists.filter(m => m.email_lists?.list_type === 'static');
  const dynamicLists = contactLists.filter(m => m.email_lists?.list_type === 'dynamic');

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
        <ModalTitle theme={theme}>Manage Lists</ModalTitle>
        <CloseButton theme={theme} onClick={onClose}>×</CloseButton>
      </ModalHeader>

      <ModalBody theme={theme}>
        {/* Static Lists Section */}
        <Section>
          <SectionTitle theme={theme}>
            Static Lists
            <ListTypeLabel theme={theme} listType="static">Manual</ListTypeLabel>
          </SectionTitle>
          <InfoText theme={theme}>Lists where you manually add or remove contacts</InfoText>
          <ItemsList>
            {staticLists.map((membership, index) => (
              <ItemTag key={index} theme={theme}>
                <span>{membership.email_lists?.name || 'Unknown List'}</span>
                <RemoveButton
                  theme={theme}
                  onClick={() => handleRemoveFromList(membership)}
                  disabled={loading}
                  title="Remove from list"
                >
                  ×
                </RemoveButton>
              </ItemTag>
            ))}
            {staticLists.length === 0 && (
              <EmptyMessage theme={theme}>Not in any static lists</EmptyMessage>
            )}
          </ItemsList>
        </Section>

        {/* Dynamic Lists Section */}
        {dynamicLists.length > 0 && (
          <Section>
            <SectionTitle theme={theme}>
              Dynamic Lists
              <ListTypeLabel theme={theme} listType="dynamic">Auto</ListTypeLabel>
            </SectionTitle>
            <InfoText theme={theme}>Lists based on contact attributes (cannot be manually changed)</InfoText>
            <ItemsList>
              {dynamicLists.map((membership, index) => (
                <ItemTag key={index} theme={theme} style={{
                  background: theme === 'light' ? '#FEF3C7' : '#78350F',
                  color: theme === 'light' ? '#92400E' : '#FDE68A',
                  border: `1px solid ${theme === 'light' ? '#FDE68A' : '#F59E0B'}`
                }}>
                  <span>{membership.email_lists?.name || 'Unknown List'}</span>
                </ItemTag>
              ))}
            </ItemsList>
          </Section>
        )}

        {/* Add to List Section */}
        <Section>
          <SectionTitle theme={theme}>Add to Static List</SectionTitle>
          <SearchContainer>
            <SearchInput
              theme={theme}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or create a list..."
            />
          </SearchContainer>

          {showSuggestions && (
            <SuggestionsContainer theme={theme}>
              {suggestions.map(suggestion => (
                <SuggestionItem
                  key={suggestion.list_id}
                  theme={theme}
                  onClick={() => handleAddToList(suggestion)}
                  disabled={loading}
                >
                  <SuggestionInfo>
                    <SuggestionName>{suggestion.name}</SuggestionName>
                    {suggestion.description && (
                      <SuggestionDescription theme={theme}>
                        {suggestion.description}
                      </SuggestionDescription>
                    )}
                  </SuggestionInfo>
                  <ListTypeLabel theme={theme} listType="static">Static</ListTypeLabel>
                </SuggestionItem>
              ))}
              {suggestions.length === 0 && searchTerm.length >= 2 && (
                <NoResults theme={theme}>No lists found</NoResults>
              )}
              {suggestions.length === 0 && searchTerm.length < 2 && (
                <NoResults theme={theme}>No available static lists</NoResults>
              )}
              {searchTerm.length >= 2 && (
                <CreateButton
                  theme={theme}
                  onClick={handleCreateList}
                  disabled={loading}
                >
                  + Create "{searchTerm}" as new static list
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
        <DoneButton theme={theme} onClick={onClose}>Done</DoneButton>
      </ModalFooter>
    </Modal>
  );
};

export default ManageContactListsModal;
