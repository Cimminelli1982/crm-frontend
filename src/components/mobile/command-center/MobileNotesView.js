import React, { useState } from 'react';
import styled from 'styled-components';
import { FaStickyNote, FaSearch, FaChevronDown, FaChevronRight, FaPlus, FaFolder, FaArrowLeft } from 'react-icons/fa';
import { format } from 'date-fns';

// Folder config
const FOLDER_CONFIG = {
  '': { emoji: '📄', label: 'Root' },
  'Inbox': { emoji: '📥', label: 'Inbox' },
  '📥 Inbox': { emoji: '📥', label: 'Inbox' },
  '📅 Daily Notes': { emoji: '📅', label: 'Daily Notes' },
  '🏢 Business': { emoji: '🏢', label: 'Business' },
  '💭 Ideas & Philosophy': { emoji: '💭', label: 'Ideas' },
  '🤝 Meetings': { emoji: '🤝', label: 'Meetings' },
  '👥 People': { emoji: '👥', label: 'People' },
  '📚 Learning': { emoji: '📚', label: 'Learning' },
  '🍳 Recipes': { emoji: '🍳', label: 'Recipes' },
  default: { emoji: '📁', label: '' },
};

/**
 * MobileNotesView - Notes list and detail view optimized for mobile
 */
const MobileNotesView = ({
  notes = [],
  selectedNote,
  onSelectNote,
  onCreateNote,
  onSearch,
  loading,
  theme = 'dark',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'

  // Filter notes by search
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title?.toLowerCase().includes(query) ||
      note.markdown_content?.toLowerCase().includes(query) ||
      note.text?.toLowerCase().includes(query)
    );
  });

  // Group by folder
  const notesByFolder = filteredNotes.reduce((acc, note) => {
    const folder = note.folder_path || '';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(note);
    return acc;
  }, {});

  const uniqueFolders = Object.keys(notesByFolder).sort();

  const toggleFolder = (folder) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folder]: prev[folder] === false ? true : false,
    }));
  };

  const isFolderExpanded = (folder) => {
    return expandedFolders[folder] !== false;
  };

  const getFolderConfig = (folder) => {
    return FOLDER_CONFIG[folder] || { ...FOLDER_CONFIG.default, label: folder };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d');
    } catch {
      return '';
    }
  };

  const handleSelectNote = (note) => {
    onSelectNote?.(note);
    setViewMode('detail');
  };

  const handleBack = () => {
    setViewMode('list');
    onSelectNote?.(null);
  };

  // Detail View
  if (viewMode === 'detail' && selectedNote) {
    return (
      <Container theme={theme}>
        <DetailHeader theme={theme}>
          <BackButton theme={theme} onClick={handleBack}>
            <FaArrowLeft size={16} />
          </BackButton>
          <DetailTitle theme={theme}>
            {selectedNote.title}
          </DetailTitle>
        </DetailHeader>

        <DetailMeta theme={theme}>
          <span>{getFolderConfig(selectedNote.folder_path).emoji} {selectedNote.folder_path || 'Root'}</span>
          <span>•</span>
          <span>{formatDate(selectedNote.last_modified_at || selectedNote.created_at)}</span>
        </DetailMeta>

        <DetailContent theme={theme}>
          <NoteText theme={theme}>
            {selectedNote.markdown_content || selectedNote.text || 'No content'}
          </NoteText>
        </DetailContent>
      </Container>
    );
  }

  // List View
  return (
    <Container theme={theme}>
      {/* Search Header */}
      <SearchHeader theme={theme}>
        <SearchContainer theme={theme}>
          <FaSearch size={14} />
          <SearchInput
            theme={theme}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
          />
        </SearchContainer>
        {onCreateNote && (
          <CreateButton theme={theme} onClick={onCreateNote}>
            <FaPlus size={14} />
          </CreateButton>
        )}
      </SearchHeader>

      {/* Notes List */}
      <NotesList>
        {loading ? (
          <LoadingState theme={theme}>
            <FaStickyNote size={32} style={{ opacity: 0.3 }} />
            <span>Loading notes...</span>
          </LoadingState>
        ) : filteredNotes.length === 0 ? (
          <EmptyState theme={theme}>
            <FaStickyNote size={48} style={{ opacity: 0.3 }} />
            <EmptyTitle theme={theme}>
              {searchQuery ? 'No notes found' : 'No notes'}
            </EmptyTitle>
            <EmptyText theme={theme}>
              {searchQuery ? 'Try a different search' : 'Create your first note'}
            </EmptyText>
          </EmptyState>
        ) : (
          uniqueFolders.map(folder => {
            const folderNotes = notesByFolder[folder] || [];
            const isExpanded = isFolderExpanded(folder);
            const config = getFolderConfig(folder);

            return (
              <FolderSection key={folder || '_root'}>
                <FolderHeader
                  theme={theme}
                  onClick={() => toggleFolder(folder)}
                >
                  <FolderLeft>
                    <FolderEmoji>{config.emoji}</FolderEmoji>
                    <FolderName theme={theme}>
                      {config.label || folder || 'Root'}
                    </FolderName>
                    <NoteCount theme={theme}>{folderNotes.length}</NoteCount>
                  </FolderLeft>
                  <ChevronIcon theme={theme}>
                    {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                  </ChevronIcon>
                </FolderHeader>

                {isExpanded && (
                  <FolderContent>
                    {folderNotes.map(note => (
                      <NoteItem
                        key={note.note_id}
                        theme={theme}
                        onClick={() => handleSelectNote(note)}
                      >
                        <NoteTitle theme={theme}>{note.title}</NoteTitle>
                        <NotePreview theme={theme}>
                          {(note.markdown_content || note.text || '').substring(0, 60)}
                          {(note.markdown_content || note.text || '').length > 60 && '...'}
                        </NotePreview>
                        <NoteMeta theme={theme}>
                          {formatDate(note.last_modified_at || note.created_at)}
                        </NoteMeta>
                      </NoteItem>
                    ))}
                  </FolderContent>
                )}
              </FolderSection>
            );
          })
        )}
      </NotesList>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme === 'light' ? '#F9FAFB' : '#111827'};
`;

const SearchHeader = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const SearchContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};

  &::placeholder {
    color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
  }
`;

const CreateButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: none;
  background: #8B5CF6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active {
    opacity: 0.9;
  }
`;

const NotesList = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

const FolderSection = styled.div`
  margin-bottom: 4px;
`;

const FolderHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#1F2937'};
  border: none;
  cursor: pointer;
`;

const FolderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const FolderEmoji = styled.span`
  font-size: 16px;
`;

const FolderName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
`;

const NoteCount = styled.span`
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
  padding: 2px 8px;
  border-radius: 10px;
`;

const ChevronIcon = styled.span`
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const FolderContent = styled.div``;

const NoteItem = styled.div`
  padding: 14px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#111827'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#1F2937'};
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#F9FAFB' : '#1F2937'};
  }
`;

const NoteTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin-bottom: 4px;
`;

const NotePreview = styled.div`
  font-size: 13px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  line-height: 1.4;
  margin-bottom: 4px;
`;

const NoteMeta = styled.div`
  font-size: 11px;
  color: ${props => props.theme === 'light' ? '#9CA3AF' : '#6B7280'};
`;

// Detail View Styles
const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const BackButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: ${props => props.theme === 'light' ? '#F3F4F6' : '#374151'};
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:active {
    background: ${props => props.theme === 'light' ? '#E5E7EB' : '#4B5563'};
  }
`;

const DetailTitle = styled.h1`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 0;
  flex: 1;
`;

const DetailMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  background: ${props => props.theme === 'light' ? '#FFFFFF' : '#1F2937'};
  border-bottom: 1px solid ${props => props.theme === 'light' ? '#E5E7EB' : '#374151'};
`;

const DetailContent = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
`;

const NoteText = styled.div`
  font-size: 15px;
  line-height: 1.7;
  color: ${props => props.theme === 'light' ? '#374151' : '#D1D5DB'};
  white-space: pre-wrap;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 12px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
`;

const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${props => props.theme === 'light' ? '#111827' : '#F9FAFB'};
  margin: 16px 0 8px;
`;

const EmptyText = styled.p`
  font-size: 14px;
  color: ${props => props.theme === 'light' ? '#6B7280' : '#9CA3AF'};
  margin: 0;
`;

export default MobileNotesView;
