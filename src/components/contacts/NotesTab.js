import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import styled from 'styled-components';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiClock } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'react-hot-toast';

// Styled components for the Notes tab
const NotesContainer = styled.div`
  padding: 0 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: white;
  background-color: ${props => props.secondary ? '#6c757d' : '#000000'};
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.secondary ? '#5a6268' : '#333333'};
  }

  &:disabled {
    background-color: #e9ecef;
    color: #6c757d;
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
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: white;
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
`;

const NoteTitle = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #111827;
`;

const NoteDate = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
`;

const NoteContent = styled.div`
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
  
  .ProseMirror {
    outline: none;
    
    ul, ol {
      padding-left: 1rem;
    }
    
    p {
      margin: 0.5rem 0;
    }
    
    h1, h2, h3 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    blockquote {
      border-left: 3px solid #e5e7eb;
      padding-left: 1rem;
      color: #6b7280;
      margin-left: 0;
    }
  }
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
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
  
  &:hover {
    color: ${props => props.delete ? '#ef4444' : '#000000'};
    background-color: ${props => props.delete ? '#fee2e2' : '#f3f4f6'};
  }
`;

const EditorContainer = styled.div`
  margin-top: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const EditorToolbar = styled.div`
  display: flex;
  background-color: #f9fafb;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const ToolbarButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;
  background: none;
  border: none;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 4px;
  
  &:hover {
    background-color: #f3f4f6;
  }
  
  &.is-active {
    background-color: #e5e7eb;
    color: #111827;
  }
`;

const EditorField = styled.div`
  padding: 16px;
  background-color: white;
  
  .ProseMirror {
    min-height: 150px;
    outline: none;
    
    ul, ol {
      padding-left: 1rem;
    }
    
    p {
      margin: 0.5rem 0;
    }
    
    h1, h2, h3 {
      margin-top: 1rem;
      margin-bottom: 0.5rem;
    }
    
    blockquote {
      border-left: 3px solid #e5e7eb;
      padding-left: 1rem;
      color: #6b7280;
      margin-left: 0;
    }
  }
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 14px;
  margin-bottom: 12px;
  
  &:focus {
    outline: none;
    border-color: #000000;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-size: 14px;
`;

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <EditorToolbar>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        Bold
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        Italic
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        Bullet List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
      >
        Numbered List
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
      >
        Heading
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
      >
        Quote
      </ToolbarButton>
    </EditorToolbar>
  );
};

const NotesTab = ({ contact }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  
  // Create the TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '<p>Start writing your note here...</p>',
  });
  
  // Fetch notes for the contact
  const fetchNotes = async () => {
    if (!contact?.id) return;
    
    setLoading(true);
    
    try {
      // Query notes via the junction table
      const { data: noteIds, error: junctionError } = await supabase
        .from('notes_contacts')
        .select('note_id')
        .eq('contact_id', contact.id);
        
      if (junctionError) throw junctionError;
      
      if (!noteIds || noteIds.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }
      
      // Extract note IDs
      const ids = noteIds.map(item => item.note_id);
      
      // Fetch the actual notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .in('id', ids)
        .order('created_at', { ascending: false });
        
      if (notesError) throw notesError;
      
      setNotes(notesData || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle creating a new note
  const handleCreateNote = async () => {
    if (!contact?.id || !editor) return;
    
    try {
      const noteContent = editor.getJSON();
      
      // Create the note
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
          title: noteTitle || 'Untitled Note',
          content: noteContent,
        })
        .select()
        .single();
        
      if (noteError) throw noteError;
      
      // Associate the note with the contact
      const { error: junctionError } = await supabase
        .from('notes_contacts')
        .insert({
          note_id: note.id,
          contact_id: contact.id,
        });
        
      if (junctionError) throw junctionError;
      
      // Reset the editor
      editor.commands.clearContent();
      setNoteTitle('');
      setIsAddingNote(false);
      
      // Refresh notes
      fetchNotes();
      
      toast.success('Note created successfully');
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Failed to create note');
    }
  };
  
  // Handle updating a note
  const handleUpdateNote = async () => {
    if (!isEditingNote || !editor) return;
    
    try {
      const noteContent = editor.getJSON();
      
      // Update the note
      const { error } = await supabase
        .from('notes')
        .update({
          title: noteTitle || 'Untitled Note',
          content: noteContent,
        })
        .eq('id', isEditingNote);
        
      if (error) throw error;
      
      // Reset the editor
      editor.commands.clearContent();
      setNoteTitle('');
      setIsEditingNote(null);
      
      // Refresh notes
      fetchNotes();
      
      toast.success('Note updated successfully');
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
      // Delete the note (cascade will handle the junction table)
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);
        
      if (error) throw error;
      
      // Refresh notes
      fetchNotes();
      
      toast.success('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };
  
  // Handle editing a note
  const handleEditNote = (note) => {
    setIsEditingNote(note.id);
    setNoteTitle(note.title);
    
    // Set the editor content
    if (editor) {
      editor.commands.setContent(note.content);
    }
  };
  
  // Cancel adding/editing a note
  const handleCancel = () => {
    setIsAddingNote(false);
    setIsEditingNote(null);
    setNoteTitle('');
    
    if (editor) {
      editor.commands.clearContent();
    }
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
  
  // Fetch notes when contact changes
  useEffect(() => {
    if (contact?.id) {
      fetchNotes();
    }
  }, [contact?.id]);
  
  // Loading state
  if (loading && !isAddingNote && !isEditingNote) {
    return (
      <NotesContainer>
        <Header>
          <Title>Notes</Title>
        </Header>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading notes...</div>
      </NotesContainer>
    );
  }
  
  return (
    <NotesContainer>
      <Header>
        <Title>Notes</Title>
        {!isAddingNote && !isEditingNote && (
          <Button onClick={() => setIsAddingNote(true)}>
            <FiPlus size={16} />
            Add New Note
          </Button>
        )}
      </Header>
      
      {/* Note Editor */}
      {(isAddingNote || isEditingNote) && (
        <div>
          <TitleInput
            type="text"
            placeholder="Note Title"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
          />
          
          <EditorContainer>
            <MenuBar editor={editor} />
            <EditorField>
              <EditorContent editor={editor} />
            </EditorField>
          </EditorContainer>
          
          <ButtonGroup>
            <Button secondary onClick={handleCancel}>
              <FiX size={16} />
              Cancel
            </Button>
            <Button onClick={isEditingNote ? handleUpdateNote : handleCreateNote}>
              <FiSave size={16} />
              {isEditingNote ? 'Update Note' : 'Save Note'}
            </Button>
          </ButtonGroup>
        </div>
      )}
      
      {/* Notes List */}
      {!isAddingNote && !isEditingNote && (
        <>
          {notes.length > 0 ? (
            <NotesList>
              {notes.map(note => (
                <NoteCard key={note.id}>
                  <NoteHeader>
                    <NoteTitle>{note.title}</NoteTitle>
                    <NoteDate>
                      <FiClock size={12} />
                      {formatDate(note.created_at)}
                    </NoteDate>
                  </NoteHeader>
                  
                  <NoteContent>
                    <div className="ProseMirror" dangerouslySetInnerHTML={{
                      __html: renderNoteContent(note.content)
                    }} />
                  </NoteContent>
                  
                  <NoteActions>
                    <ActionButton onClick={() => handleEditNote(note)}>
                      <FiEdit2 size={16} />
                    </ActionButton>
                    <ActionButton delete onClick={() => handleDeleteNote(note.id)}>
                      <FiTrash2 size={16} />
                    </ActionButton>
                  </NoteActions>
                </NoteCard>
              ))}
            </NotesList>
          ) : (
            <EmptyState>
              <p>No notes found for this contact.</p>
              <p>Click "Add New Note" to create one.</p>
            </EmptyState>
          )}
        </>
      )}
    </NotesContainer>
  );
};

// Helper function to render note content
const renderNoteContent = (content) => {
  if (!content) return '<p>No content</p>';
  
  // If the content is a string, return it as is
  if (typeof content === 'string') return content;
  
  // If the content is a JSON object from TipTap, render it
  try {
    // Simple plain text rendering for demo purposes
    // In a real implementation, you'd want to use a more sophisticated rendering method
    if (content.type === 'doc' && content.content && Array.isArray(content.content)) {
      let html = '';
      content.content.forEach(node => {
        if (node.type === 'paragraph' && node.content && Array.isArray(node.content)) {
          html += '<p>';
          node.content.forEach(textNode => {
            let text = textNode.text || '';
            if (textNode.marks && Array.isArray(textNode.marks)) {
              textNode.marks.forEach(mark => {
                if (mark.type === 'bold') text = `<strong>${text}</strong>`;
                if (mark.type === 'italic') text = `<em>${text}</em>`;
              });
            }
            html += text;
          });
          html += '</p>';
        } else if (node.type === 'heading' && node.content && Array.isArray(node.content)) {
          const level = node.attrs?.level || 3;
          html += `<h${level}>`;
          node.content.forEach(textNode => {
            html += textNode.text || '';
          });
          html += `</h${level}>`;
        } else if (node.type === 'bulletList' && node.content && Array.isArray(node.content)) {
          html += '<ul>';
          node.content.forEach(listItem => {
            if (listItem.type === 'listItem' && listItem.content && Array.isArray(listItem.content)) {
              html += '<li>';
              listItem.content.forEach(paragraphNode => {
                if (paragraphNode.type === 'paragraph' && paragraphNode.content && Array.isArray(paragraphNode.content)) {
                  paragraphNode.content.forEach(textNode => {
                    html += textNode.text || '';
                  });
                }
              });
              html += '</li>';
            }
          });
          html += '</ul>';
        }
      });
      return html || '<p>No content</p>';
    }
  } catch (error) {
    console.error('Error rendering note content:', error);
    return '<p>Error displaying note content</p>';
  }
  
  return '<p>Unknown content format</p>';
};

export default NotesTab;