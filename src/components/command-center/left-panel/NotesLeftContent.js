import {
  EmailList,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import { FaStickyNote, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import CollapsibleSection from './CollapsibleSection';

const NotesLeftContent = ({
  theme,
  filteredNotes,
  notesByFolder,
  uniqueFolders,
  expandedFolders,
  setExpandedFolders,
  selectedNote,
  handleSelectNote,
  loading,
  FOLDER_CONFIG,
}) => {
  return (
    <EmailList>
      {loading ? (
        <EmptyState theme={theme}>Loading...</EmptyState>
      ) : filteredNotes.length === 0 ? (
        <EmptyState theme={theme}>
          <FaStickyNote size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <div>No notes yet</div>
        </EmptyState>
      ) : (
        uniqueFolders.map(folder => {
          const folderConfig = FOLDER_CONFIG[folder] || FOLDER_CONFIG.default;
          const folderNotes = notesByFolder[folder] || [];
          if (folderNotes.length === 0) return null;
          const isExpanded = expandedFolders[folder] !== false;

          return (
            <CollapsibleSection
              key={folder || '_root'}
              theme={theme}
              title={`${folderConfig.emoji || '📁'} ${folderConfig.label || folder || 'Root'}`}
              count={folderNotes.length}
              isOpen={isExpanded}
              onToggle={() => setExpandedFolders(prev => ({ ...prev, [folder]: !isExpanded }))}
            >
              {folderNotes.map(note => (
                <div
                  key={note.note_id}
                  onClick={() => handleSelectNote(note)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    background: selectedNote?.note_id === note.note_id
                      ? (theme === 'dark' ? '#374151' : '#EEF2FF')
                      : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    marginBottom: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {note.title}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                      {note.file_name || note.title}
                    </span>
                    <span style={{ flexShrink: 0 }}>
                      {new Date(note.last_modified_at || note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </CollapsibleSection>
          );
        })
      )}
    </EmailList>
  );
};

export default NotesLeftContent;
