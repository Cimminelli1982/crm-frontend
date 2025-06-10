import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiClock, FiFileText, FiInfo, FiUser } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Styled components
const ModalContent = styled.div`
  padding: 24px;
  max-height: 80vh;
  overflow-y: auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #333;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #00ff00;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ContactName = styled.span`
  color: #ffffff;
  font-weight: 400;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: white;
  background-color: ${props => props.$secondary ? '#6c757d' : '#00ff00'};
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$secondary ? '#5a6268' : '#33ff33'};
  }

  &:disabled {
    background-color: #333;
    color: #666;
    cursor: not-allowed;
  }
`;

const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
`;

const NoteCard = styled.div`
  padding: 16px;
  border: 1px solid #333;
  border-radius: 8px;
  background-color: #1a1a1a;
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #333;
`;

const NoteTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
`;

const NoteDate = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #888;
`;

const NoteContent = styled.div`
  font-size: 14px;
  color: #e0e0e0;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const NoteActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  
  &:hover {
    color: #00ff00;
    background-color: #001100;
  }
`;

const EditorContainer = styled.div`
  margin-top: 20px;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1a1a1a;
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 12px;
  background-color: #222;
  border: none;
  border-bottom: 1px solid #333;
  color: #ffffff;
  font-size: 16px;
  outline: none;
  
  &::placeholder {
    color: #666;
  }
`;

const ContentTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 16px;
  background-color: #1a1a1a;
  border: none;
  color: #ffffff;
  font-size: 14px;
  line-height: 1.5;
  outline: none;
  resize: vertical;
  font-family: inherit;
  
  &::placeholder {
    color: #666;
  }
`;

const EditorActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px;
  background-color: #222;
  border-top: 1px solid #333;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #888;
`;

const ContactNotesModal = ({ isOpen, onRequestClose, contact, onNotesUpdated }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  // State for editing contact bio/description
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editedBio, setEditedBio] = useState('');

  // Check if contact has bio/description (assuming there might be a bio field)
  const hasBio = contact?.bio && contact.bio.trim().length > 0;
  
  // Check if bio is meaningful (not just placeholder text)
  const hasMeaningfulBio = () => {
    if (!hasBio) return false;
    
    const bio = contact.bio.trim().toLowerCase();
    const placeholderTexts = [
      'no specific information found',
      'no information found',
      'no bio available',
      'bio not available',
      'no details available',
      'information not available',
      'no data available',
      'not specified',
      'n/a',
      'tbd',
      'to be determined',
      'unknown',
      'no bio',
      'no info'
    ];
    
    // Check if bio is just a placeholder
    const isPlaceholder = placeholderTexts.some(placeholder => 
      bio === placeholder || 
      bio.includes(placeholder)
    );
    
    return !isPlaceholder;
  };

  // Fetch notes for the contact
  const fetchNotes = async () => {
    if (!contact?.contact_id) return;
    
    setLoading(true);
    
    try {
      // Query notes via the junction table
      const { data: noteIds, error: junctionError } = await supabase
        .from('notes_contacts')
        .select('note_id')
        .eq('contact_id', contact.contact_id);
        
      if (junctionError) throw junctionError;
      
      if (!noteIds || noteIds.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }
      
      // Extract note IDs and filter out null values
      const ids = noteIds
        .map(item => item.note_id)
        .filter(id => id !== null && id !== undefined);
      
      if (ids.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }
      
      // Try different possible primary key column names
      let notesData = null;
      let notesError = null;
      
      // First try with 'note_id' as primary key
      const { data: notesData1, error: notesError1 } = await supabase
        .from('notes')
        .select('*')
        .in('note_id', ids)
        .order('created_at', { ascending: false });
        
      if (!notesError1) {
        notesData = notesData1;
      } else {
        // If that fails, try with 'id' as primary key
        const { data: notesData2, error: notesError2 } = await supabase
          .from('notes')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: false });
          
        if (!notesError2) {
          notesData = notesData2;
        } else {
          // If both fail, throw the original error
          throw notesError1;
        }
      }
      
      // Normalize the content field (handle both 'text' and 'content' fields)
      const normalizedNotes = (notesData || []).map(note => ({
        ...note,
        id: note.id || note.note_id, // Normalize ID field
        content: note.content || note.text || ''
      }));
      
      // Check for orphaned references and clean them up
      const foundNoteIds = normalizedNotes.map(note => note.id);
      const orphanedIds = ids.filter(id => !foundNoteIds.includes(id));
      
      if (orphanedIds.length > 0) {
        console.log(`Found ${orphanedIds.length} orphaned note references for contact ${contact.contact_id}, cleaning up...`);
        
        // Clean up orphaned references (optional - you might want to skip this)
        try {
          await supabase
            .from('notes_contacts')
            .delete()
            .eq('contact_id', contact.contact_id)
            .in('note_id', orphanedIds);
        } catch (cleanupError) {
          console.error('Error cleaning up orphaned note references:', cleanupError);
          // Don't throw here, just log the error
        }
      }
      
      setNotes(normalizedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
      setNotes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new note
  const handleCreateNote = async () => {
    if (!contact?.contact_id || !noteContent.trim()) return;
    
    try {
      // Create the note - try with 'text' field first, fallback to 'content'
      let createdNote = null;
      
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
          title: noteTitle.trim() || 'Untitled Note',
          text: noteContent.trim(), // Try 'text' field first
        })
        .select()
        .single();
        
      if (noteError) {
        // If 'text' field fails, try 'content' field
        if (noteError.message.includes('text')) {
          const { data: note2, error: noteError2 } = await supabase
            .from('notes')
            .insert({
              title: noteTitle.trim() || 'Untitled Note',
              content: noteContent.trim(),
            })
            .select()
            .single();
            
          if (noteError2) throw noteError2;
          createdNote = note2;
        } else {
          throw noteError;
        }
      } else {
        createdNote = note;
      }
      
      // Get the note ID (handle different column names)
      const noteId = createdNote.id || createdNote.note_id;
      
      if (!noteId) {
        throw new Error('Failed to get note ID from created note');
      }
      
      // Associate the note with the contact
      const { error: junctionError } = await supabase
        .from('notes_contacts')
        .insert({
          note_id: noteId,
          contact_id: contact.contact_id,
        });
        
      if (junctionError) throw junctionError;
      
      // Reset the form
      setNoteTitle('');
      setNoteContent('');
      setIsAddingNote(false);
      
      // Refresh notes
      fetchNotes();
      
      toast.success('Note created successfully');
      
      // Notify parent component to refresh its notes
      if (onNotesUpdated) {
        onNotesUpdated();
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };

  // Handle updating a note
  const handleUpdateNote = async () => {
    if (!isEditingNote || !noteContent.trim()) return;
    
    try {
      // Try different combinations of primary key and content field names
      let updateSuccess = false;
      
      // Try with note_id and text field
      const { error: error1 } = await supabase
        .from('notes')
        .update({
          title: noteTitle.trim() || 'Untitled Note',
          text: noteContent.trim(),
        })
        .eq('note_id', isEditingNote);
        
      if (!error1) {
        updateSuccess = true;
      } else {
        // Try with id and text field
        const { error: error2 } = await supabase
          .from('notes')
          .update({
            title: noteTitle.trim() || 'Untitled Note',
            text: noteContent.trim(),
          })
          .eq('id', isEditingNote);
          
        if (!error2) {
          updateSuccess = true;
        } else {
          // Try with note_id and content field
          const { error: error3 } = await supabase
            .from('notes')
            .update({
              title: noteTitle.trim() || 'Untitled Note',
              content: noteContent.trim(),
            })
            .eq('note_id', isEditingNote);
            
          if (!error3) {
            updateSuccess = true;
          } else {
            // Try with id and content field
            const { error: error4 } = await supabase
              .from('notes')
              .update({
                title: noteTitle.trim() || 'Untitled Note',
                content: noteContent.trim(),
              })
              .eq('id', isEditingNote);
              
            if (!error4) {
              updateSuccess = true;
            } else {
              throw error4;
            }
          }
        }
      }
      
      if (updateSuccess) {
        // Reset the form
        setNoteTitle('');
        setNoteContent('');
        setIsEditingNote(null);
        
        // Refresh notes
        fetchNotes();
        
        toast.success('Note updated successfully');
        
        // Notify parent component to refresh its notes
        if (onNotesUpdated) {
          onNotesUpdated();
        }
      }
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  // Handle deleting a note
  const handleDeleteNote = async (noteId) => {
    if (!noteId) return;
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }
    
    try {
      // Try different primary key column names
      let deleteSuccess = false;
      
      // Try with note_id first
      const { error: error1 } = await supabase
        .from('notes')
        .delete()
        .eq('note_id', noteId);
        
      if (!error1) {
        deleteSuccess = true;
      } else {
        // Try with id
        const { error: error2 } = await supabase
          .from('notes')
          .delete()
          .eq('id', noteId);
          
        if (!error2) {
          deleteSuccess = true;
        } else {
          throw error2;
        }
      }
      
      if (deleteSuccess) {
        // Refresh notes
        fetchNotes();
        
        toast.success('Note deleted successfully');
        
        // Notify parent component to refresh its notes
        if (onNotesUpdated) {
          onNotesUpdated();
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Handle editing a note
  const handleEditNote = (note) => {
    setIsEditingNote(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
  };
  
  // Handle editing contact bio
  const handleEditBio = () => {
    setIsEditingBio(true);
    setEditedBio(contact.bio || '');
  };
  
  // Handle saving contact bio
  const handleSaveBio = async () => {
    if (!contact?.contact_id) return;
    
    try {
      const { error } = await supabase
        .from('contacts')
        .update({ bio: editedBio.trim() })
        .eq('contact_id', contact.contact_id);
        
      if (error) throw error;
      
      // Update the local contact object
      contact.bio = editedBio.trim();
      
      setIsEditingBio(false);
      setEditedBio('');
      
      toast.success('Contact bio updated successfully');
    } catch (error) {
      console.error('Error updating contact bio:', error);
      toast.error('Failed to update contact bio');
    }
  };
  
  // Handle canceling bio edit
  const handleCancelBioEdit = () => {
    setIsEditingBio(false);
    setEditedBio('');
  };

  // Cancel adding/editing a note
  const handleCancel = () => {
    setIsAddingNote(false);
    setIsEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Fetch notes when modal opens
  useEffect(() => {
    if (isOpen && contact?.contact_id) {
      fetchNotes();
    }
  }, [isOpen, contact?.contact_id]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      setNotes([]);
      setIsAddingNote(false);
      setIsEditingNote(null);
      setNoteTitle('');
      setNoteContent('');
      setLoading(false);
      setIsEditingBio(false);
      setEditedBio('');
    }
  }, [isOpen]);

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
          width: '600px',
          maxWidth: '90vw',
          maxHeight: '90vh',
          padding: '0',
          border: '1px solid #333',
          backgroundColor: '#121212',
          borderRadius: '8px',
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          zIndex: 1000,
        },
      }}
    >
      <ModalContent>
        <Header>
          <Title>
            <FiUser />
            Notes - <ContactName>{contact?.first_name} {contact?.last_name}</ContactName>
          </Title>
          <Button onClick={() => setIsAddingNote(true)} disabled={isAddingNote || isEditingNote}>
            <FiPlus size={16} />
            Add Note
          </Button>
        </Header>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
            Loading notes...
          </div>
        ) : (
          <>
            {/* Unified Notes List - includes contact bio as first item if it exists */}
            {(hasMeaningfulBio() || notes.length > 0) ? (
              <NotesList>
                {/* Contact Bio as first note if it exists */}
                {hasMeaningfulBio() && (
                  <NoteCard>
                    <NoteHeader>
                      <NoteTitle>Contact Bio</NoteTitle>
                      <NoteDate>
                        <FiInfo size={12} />
                        Built-in field
                      </NoteDate>
                    </NoteHeader>
                    {isEditingBio ? (
                      <>
                        <ContentTextarea
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          placeholder="Enter contact bio..."
                          style={{ minHeight: '100px', marginBottom: '12px' }}
                        />
                        <NoteActions>
                          <ActionButton onClick={handleCancelBioEdit} title="Cancel">
                            <FiX size={14} />
                          </ActionButton>
                          <ActionButton onClick={handleSaveBio} title="Save Bio">
                            <FiSave size={14} />
                          </ActionButton>
                        </NoteActions>
                      </>
                    ) : (
                      <>
                        <NoteContent 
                          onClick={handleEditBio}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            padding: '8px',
                            borderRadius: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#2a2a2a';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                          }}
                          title="Click to edit contact bio"
                        >
                          {contact.bio}
                        </NoteContent>
                        <NoteActions>
                          <ActionButton 
                            onClick={handleEditBio} 
                            title="Edit Contact Bio"
                          >
                            <FiEdit2 size={14} />
                          </ActionButton>
                        </NoteActions>
                      </>
                    )}
                  </NoteCard>
                )}
                
                {/* Regular notes */}
                {notes.map(note => (
                  <NoteCard key={note.id}>
                    <NoteHeader>
                      <NoteTitle>{note.title}</NoteTitle>
                      <NoteDate>
                        <FiClock size={12} />
                        {formatDate(note.created_at)}
                      </NoteDate>
                    </NoteHeader>
                    <NoteContent 
                      onClick={() => handleEditNote(note)}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s ease',
                        padding: '8px',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#2a2a2a';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                      title="Click to edit this note"
                    >
                      {note.content}
                    </NoteContent>
                    <NoteActions>
                      <ActionButton onClick={() => handleEditNote(note)} title="Edit Note">
                        <FiEdit2 size={14} />
                      </ActionButton>
                      <ActionButton $delete onClick={() => handleDeleteNote(note.id)} title="Delete Note">
                        <FiTrash2 size={14} />
                      </ActionButton>
                    </NoteActions>
                  </NoteCard>
                ))}
              </NotesList>
            ) : !isAddingNote && !isEditingNote ? (
              <EmptyState>
                <FiFileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No notes found for this contact.</p>
                <p>Click "Add Note" to create the first note.</p>
              </EmptyState>
            ) : null}

            {/* Add/Edit Note Form */}
            {(isAddingNote || isEditingNote) && (
              <EditorContainer>
                <TitleInput
                  type="text"
                  placeholder="Note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                />
                <ContentTextarea
                  placeholder="Write your note here..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                />
                <EditorActions>
                  <Button $secondary onClick={handleCancel}>
                    <FiX size={16} />
                    Cancel
                  </Button>
                  <Button onClick={isEditingNote ? handleUpdateNote : handleCreateNote}>
                    <FiSave size={16} />
                    {isEditingNote ? 'Update' : 'Save'} Note
                  </Button>
                </EditorActions>
              </EditorContainer>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default ContactNotesModal; 