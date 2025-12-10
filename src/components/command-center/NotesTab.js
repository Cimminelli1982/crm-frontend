import React from 'react';
import { FaStickyNote, FaExternalLinkAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { ActionCard, ActionCardHeader, ActionCardContent, ActionCardButtons, SmallBtn } from '../../pages/CommandCenterPage.styles';

const NotesTab = ({
  theme,
  contactNotes,
  loadingNotes,
  getNoteTypeIcon,
  resetNoteForm,
  setNoteModalOpen,
  openInObsidian,
  openEditNote,
  onDeleteNote,
}) => {
  return (
    <>
      {/* Add New Note Button */}
      <ActionCard theme={theme} style={{ cursor: 'pointer' }} onClick={() => { resetNoteForm(); setNoteModalOpen(true); }}>
        <ActionCardContent theme={theme} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
          <FaStickyNote style={{ color: '#8B5CF6' }} />
          <span style={{ fontWeight: 600 }}>Add New Note</span>
        </ActionCardContent>
      </ActionCard>

      {/* Loading state */}
      {loadingNotes && (
        <div style={{ padding: '20px', textAlign: 'center', color: theme === 'light' ? '#6B7280' : '#9CA3AF' }}>
          Loading notes...
        </div>
      )}

      {/* Existing Notes Section */}
      {!loadingNotes && contactNotes.length > 0 && (
        <>
          <div style={{
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: theme === 'light' ? '#6B7280' : '#9CA3AF',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Related Notes ({contactNotes.length})
          </div>
          {contactNotes.map(note => (
            <ActionCard key={note.note_id} theme={theme}>
              <ActionCardHeader theme={theme}>
                <span style={{ fontWeight: '600' }}>{getNoteTypeIcon(note.note_type)} {note.title}</span>
              </ActionCardHeader>
              <ActionCardContent theme={theme}>
                {note.summary && (
                  <div style={{
                    fontSize: '12px',
                    color: theme === 'light' ? '#6B7280' : '#9CA3AF',
                    marginBottom: '4px',
                    lineHeight: '1.4'
                  }}>
                    {note.summary}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: theme === 'light' ? '#9CA3AF' : '#6B7280' }}>
                  {note.note_type} • {new Date(note.created_at).toLocaleDateString()}
                </div>
              </ActionCardContent>
              <ActionCardButtons>
                <SmallBtn theme={theme} onClick={() => note.obsidian_path && openInObsidian(note.obsidian_path)} title="Open in Obsidian">
                  <FaExternalLinkAlt />
                </SmallBtn>
                <SmallBtn theme={theme} onClick={() => openEditNote(note)} title="Edit">
                  <FaEdit />
                </SmallBtn>
                <SmallBtn theme={theme} $variant="danger" onClick={() => onDeleteNote(note.note_id, note.obsidian_path)} title="Delete">
                  <FaTrash />
                </SmallBtn>
              </ActionCardButtons>
            </ActionCard>
          ))}
        </>
      )}

      {/* Empty state */}
      {!loadingNotes && contactNotes.length === 0 && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          color: theme === 'light' ? '#9CA3AF' : '#6B7280',
          fontSize: '13px'
        }}>
          No notes yet for contacts in this thread
        </div>
      )}
    </>
  );
};

export default NotesTab;
