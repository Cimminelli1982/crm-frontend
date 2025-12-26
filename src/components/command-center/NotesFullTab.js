import React, { useState, useEffect, useCallback } from 'react';
import {
  FaStickyNote, FaPlus, FaSearch, FaFolder, FaSave, FaTrash,
  FaLink, FaUser, FaBuilding, FaHandshake, FaDollarSign,
  FaChevronRight, FaChevronDown, FaEdit, FaTimes, FaSync,
  FaBold, FaItalic, FaListUl, FaListOl, FaQuoteRight, FaCode,
  FaUndo, FaRedo
} from 'react-icons/fa';
import { SiObsidian } from 'react-icons/si';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

// Note types for categorization
const NOTE_TYPES = [
  { id: 'general', label: 'General', icon: FaStickyNote, color: '#8B5CF6' },
  { id: 'meeting', label: 'Meeting', icon: FaFolder, color: '#3B82F6' },
  { id: 'idea', label: 'Idea', icon: FaStickyNote, color: '#F59E0B' },
  { id: 'project', label: 'Project', icon: FaFolder, color: '#10B981' },
];

// TipTap Toolbar component
const EditorToolbar = ({ editor, theme }) => {
  if (!editor) return null;

  const buttonStyle = {
    padding: '6px 8px',
    borderRadius: '4px',
    border: 'none',
    background: 'transparent',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const activeStyle = {
    ...buttonStyle,
    background: theme === 'dark' ? '#374151' : '#E5E7EB',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
  };

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2px',
      padding: '8px',
      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
      background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    }}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={editor.isActive('bold') ? activeStyle : buttonStyle}
        title="Bold (Cmd+B)"
      >
        <FaBold size={12} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={editor.isActive('italic') ? activeStyle : buttonStyle}
        title="Italic (Cmd+I)"
      >
        <FaItalic size={12} />
      </button>

      <div style={{ width: '1px', background: theme === 'dark' ? '#374151' : '#E5E7EB', margin: '0 6px' }} />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        style={editor.isActive('heading', { level: 1 }) ? activeStyle : buttonStyle}
        title="Heading 1"
      >
        <span style={{ fontWeight: 700, fontSize: '12px' }}>H1</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        style={editor.isActive('heading', { level: 2 }) ? activeStyle : buttonStyle}
        title="Heading 2"
      >
        <span style={{ fontWeight: 700, fontSize: '12px' }}>H2</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        style={editor.isActive('heading', { level: 3 }) ? activeStyle : buttonStyle}
        title="Heading 3"
      >
        <span style={{ fontWeight: 700, fontSize: '12px' }}>H3</span>
      </button>

      <div style={{ width: '1px', background: theme === 'dark' ? '#374151' : '#E5E7EB', margin: '0 6px' }} />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={editor.isActive('bulletList') ? activeStyle : buttonStyle}
        title="Bullet List"
      >
        <FaListUl size={12} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={editor.isActive('orderedList') ? activeStyle : buttonStyle}
        title="Numbered List"
      >
        <FaListOl size={12} />
      </button>

      <div style={{ width: '1px', background: theme === 'dark' ? '#374151' : '#E5E7EB', margin: '0 6px' }} />

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        style={editor.isActive('blockquote') ? activeStyle : buttonStyle}
        title="Quote"
      >
        <FaQuoteRight size={12} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        style={editor.isActive('codeBlock') ? activeStyle : buttonStyle}
        title="Code Block"
      >
        <FaCode size={12} />
      </button>

      <div style={{ width: '1px', background: theme === 'dark' ? '#374151' : '#E5E7EB', margin: '0 6px' }} />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        style={{ ...buttonStyle, opacity: editor.can().undo() ? 1 : 0.4 }}
        title="Undo (Cmd+Z)"
      >
        <FaUndo size={12} />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        style={{ ...buttonStyle, opacity: editor.can().redo() ? 1 : 0.4 }}
        title="Redo (Cmd+Shift+Z)"
      >
        <FaRedo size={12} />
      </button>
    </div>
  );
};

// TipTap Rich Text Editor component
const RichTextEditor = ({ content, onChange, theme, editable = true }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
    ],
    content: content || '',
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const editorContainerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    overflow: 'hidden',
  };

  return (
    <div style={editorContainerStyle}>
      {editable && <EditorToolbar editor={editor} theme={theme} />}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <EditorContent
          editor={editor}
          style={{
            height: '100%',
            padding: '16px',
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        />
      </div>
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 200px;
        }
        .ProseMirror p {
          margin: 0 0 0.75em 0;
        }
        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 1em 0 0.5em 0;
        }
        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
        }
        .ProseMirror h3 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 1em 0 0.5em 0;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.25em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid ${theme === 'dark' ? '#6B7280' : '#D1D5DB'};
          padding-left: 1em;
          margin: 0.5em 0;
          color: ${theme === 'dark' ? '#9CA3AF' : '#6B7280'};
        }
        .ProseMirror pre {
          background: ${theme === 'dark' ? '#111827' : '#F3F4F6'};
          border-radius: 6px;
          padding: 0.75em 1em;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
          overflow-x: auto;
        }
        .ProseMirror code {
          background: ${theme === 'dark' ? '#374151' : '#E5E7EB'};
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.9em;
        }
        .ProseMirror pre code {
          background: none;
          padding: 0;
        }
        .editor-link {
          color: #3B82F6;
          text-decoration: underline;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: ${theme === 'dark' ? '#6B7280' : '#9CA3AF'};
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

const NotesFullTab = ({ theme }) => {
  // Notes list state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteType, setSelectedNoteType] = useState(null);
  const [expandedTypes, setExpandedTypes] = useState({ general: true, meeting: true, idea: true, project: true });

  // Selected note state
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editNoteType, setEditNoteType] = useState('general');
  const [saving, setSaving] = useState(false);

  // New note state
  const [isCreating, setIsCreating] = useState(false);

  // Linked entities state
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [linkedDeals, setLinkedDeals] = useState([]);
  const [linkedIntroductions, setLinkedIntroductions] = useState([]);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState(null); // 'contact', 'company', 'deal', 'introduction'
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState([]);
  const [linkSearching, setLinkSearching] = useState(false);

  // Obsidian sync state
  const [syncing, setSyncing] = useState(false);
  const OBSIDIAN_SYNC_URL = 'http://localhost:3003';

  // Sync from Obsidian inbox
  const handleObsidianSync = async () => {
    setSyncing(true);
    try {
      // Fetch inbox content from local server
      const response = await fetch(`${OBSIDIAN_SYNC_URL}/inbox`);
      if (!response.ok) throw new Error('Failed to connect to Obsidian sync server');

      const { content } = await response.json();

      // Check if there's content to sync
      const trimmedContent = content?.replace(/^#\s*Inbox\s*\n*/i, '').trim();
      if (!trimmedContent) {
        toast('Inbox is empty', { icon: '📭' });
        return;
      }

      // Create new note in Supabase
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: `Obsidian Inbox - ${new Date().toLocaleDateString()}`,
          text: trimmedContent,
          note_type: 'general',
          obsidian_path: 'Inbox.md',
          created_by: 'User',
          last_modified_by: 'User',
        })
        .select()
        .single();

      if (error) throw error;

      // Archive and clear inbox on local server
      const archiveResponse = await fetch(`${OBSIDIAN_SYNC_URL}/archive`, { method: 'POST' });
      if (!archiveResponse.ok) {
        toast.error('Note saved but failed to archive inbox');
      }

      // Refresh notes list and select the new note
      setNotes(prev => [data, ...prev]);
      setSelectedNote(data);
      setEditTitle(data.title);
      setEditText(data.text);
      setEditNoteType(data.note_type);
      setIsEditing(false);
      setIsCreating(false);

      toast.success('Synced from Obsidian!');
    } catch (error) {
      console.error('Obsidian sync error:', error);
      if (error.message.includes('Failed to fetch')) {
        toast.error('Obsidian sync server not running. Start it with: cd obsidian-sync-server && npm start');
      } else {
        toast.error(error.message || 'Failed to sync');
      }
    } finally {
      setSyncing(false);
    }
  };

  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('last_modified_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch linked entities for selected note
  const fetchLinkedEntities = useCallback(async (noteId) => {
    if (!noteId) {
      setLinkedContacts([]);
      setLinkedCompanies([]);
      setLinkedDeals([]);
      setLinkedIntroductions([]);
      return;
    }

    try {
      // Fetch linked contacts
      const { data: contactLinks } = await supabase
        .from('note_contacts')
        .select('contact_id, contacts(contact_id, first_name, last_name)')
        .eq('note_id', noteId);
      setLinkedContacts(contactLinks?.map(l => l.contacts).filter(Boolean) || []);

      // Fetch linked companies
      const { data: companyLinks } = await supabase
        .from('note_companies')
        .select('company_id, companies(company_id, name)')
        .eq('note_id', noteId);
      setLinkedCompanies(companyLinks?.map(l => l.companies).filter(Boolean) || []);

      // Fetch linked deals
      const { data: dealLinks } = await supabase
        .from('note_deals')
        .select('deal_id, deals(deal_id, opportunity)')
        .eq('note_id', noteId);
      setLinkedDeals(dealLinks?.map(l => l.deals).filter(Boolean) || []);

      // Fetch linked introductions
      const { data: introLinks } = await supabase
        .from('note_introductions')
        .select('introduction_id, introductions(introduction_id, status, introduction_date)')
        .eq('note_id', noteId);
      setLinkedIntroductions(introLinks?.map(l => l.introductions).filter(Boolean) || []);

    } catch (error) {
      console.error('Error fetching linked entities:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Fetch linked entities when note is selected
  useEffect(() => {
    if (selectedNote) {
      fetchLinkedEntities(selectedNote.note_id);
    }
  }, [selectedNote, fetchLinkedEntities]);

  // Filter notes by search and type
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedNoteType || note.note_type === selectedNoteType;
    return matchesSearch && matchesType;
  });

  // Group notes by type
  const notesByType = NOTE_TYPES.reduce((acc, type) => {
    acc[type.id] = filteredNotes.filter(n => n.note_type === type.id);
    return acc;
  }, {});

  // Handle note selection
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditText(note.text || '');
    setEditNoteType(note.note_type || 'general');
    setIsEditing(false);
    setIsCreating(false);
  };

  // Handle create new note
  const handleCreateNew = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditText('');
    setEditNoteType('general');
    setIsCreating(true);
    setIsEditing(true);
    setLinkedContacts([]);
    setLinkedCompanies([]);
    setLinkedDeals([]);
    setLinkedIntroductions([]);
  };

  // Handle save note
  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      if (isCreating) {
        // Create new note
        const { data, error } = await supabase
          .from('notes')
          .insert({
            title: editTitle.trim(),
            text: editText,
            note_type: editNoteType,
            created_by: 'User',
            last_modified_by: 'User',
          })
          .select()
          .single();

        if (error) throw error;

        setNotes(prev => [data, ...prev]);
        setSelectedNote(data);
        setIsCreating(false);
        toast.success('Note created!');
      } else {
        // Update existing note
        const { data, error } = await supabase
          .from('notes')
          .update({
            title: editTitle.trim(),
            text: editText,
            note_type: editNoteType,
            last_modified_by: 'User',
            last_modified_at: new Date().toISOString(),
          })
          .eq('note_id', selectedNote.note_id)
          .select()
          .single();

        if (error) throw error;

        setNotes(prev => prev.map(n => n.note_id === data.note_id ? data : n));
        setSelectedNote(data);
        toast.success('Note saved!');
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete note
  const handleDelete = async () => {
    if (!selectedNote || !window.confirm('Delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('note_id', selectedNote.note_id);

      if (error) throw error;

      setNotes(prev => prev.filter(n => n.note_id !== selectedNote.note_id));
      setSelectedNote(null);
      setIsEditing(false);
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  // Search for entities to link
  const searchEntities = async (type, query) => {
    if (!query.trim()) {
      setLinkSearchResults([]);
      return;
    }

    setLinkSearching(true);
    try {
      let data = [];
      if (type === 'contact') {
        const { data: results } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .limit(10);
        data = results || [];
      } else if (type === 'company') {
        const { data: results } = await supabase
          .from('companies')
          .select('company_id, name')
          .ilike('name', `%${query}%`)
          .limit(10);
        data = results || [];
      } else if (type === 'deal') {
        const { data: results } = await supabase
          .from('deals')
          .select('deal_id, opportunity')
          .ilike('opportunity', `%${query}%`)
          .limit(10);
        data = results || [];
      } else if (type === 'introduction') {
        const { data: results } = await supabase
          .from('introductions')
          .select('introduction_id, status, introduction_date')
          .limit(10);
        data = results || [];
      }
      setLinkSearchResults(data);
    } catch (error) {
      console.error('Error searching entities:', error);
    } finally {
      setLinkSearching(false);
    }
  };

  // Handle link entity
  const handleLinkEntity = async (entity) => {
    if (!selectedNote) return;

    try {
      const tableName = `note_${linkType}s`;
      const idField = `${linkType}_id`;

      const { error } = await supabase
        .from(tableName)
        .insert({
          note_id: selectedNote.note_id,
          [idField]: entity[idField],
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Already linked');
          return;
        }
        throw error;
      }

      // Refresh linked entities
      fetchLinkedEntities(selectedNote.note_id);
      setShowLinkModal(false);
      setLinkSearchQuery('');
      setLinkSearchResults([]);
      toast.success('Linked!');
    } catch (error) {
      console.error('Error linking entity:', error);
      toast.error('Failed to link');
    }
  };

  // Handle unlink entity
  const handleUnlinkEntity = async (type, entityId) => {
    if (!selectedNote) return;

    try {
      const tableName = `note_${type}s`;
      const idField = `${type}_id`;

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('note_id', selectedNote.note_id)
        .eq(idField, entityId);

      if (error) throw error;

      fetchLinkedEntities(selectedNote.note_id);
      toast.success('Unlinked');
    } catch (error) {
      console.error('Error unlinking:', error);
      toast.error('Failed to unlink');
    }
  };

  // Styles
  const panelStyle = {
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle = {
    padding: '12px 16px',
    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  };

  const searchInputStyle = {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#374151' : '#F9FAFB',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px',
    outline: 'none',
  };

  const buttonStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    background: '#8B5CF6',
    color: 'white',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const noteItemStyle = (isSelected) => ({
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: isSelected
      ? (theme === 'dark' ? '#374151' : '#EEF2FF')
      : 'transparent',
    transition: 'background 0.15s',
  });

  const sectionHeaderStyle = {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    background: theme === 'dark' ? '#111827' : '#F3F4F6',
    fontSize: '12px',
    fontWeight: 600,
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    textTransform: 'uppercase',
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* LEFT PANEL - Notes List */}
      <div style={{ ...panelStyle, width: '20%', minWidth: '250px', flexShrink: 0 }}>
        {/* Header with search and add button */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <FaSearch size={14} style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <button
            onClick={handleObsidianSync}
            disabled={syncing}
            style={{
              ...buttonStyle,
              background: '#7C3AED',
              opacity: syncing ? 0.7 : 1,
            }}
            title="Sync from Obsidian Inbox"
          >
            {syncing ? <FaSync size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <SiObsidian size={12} />}
          </button>
          <button onClick={handleCreateNew} style={buttonStyle}>
            <FaPlus size={12} />
          </button>
        </div>

        {/* CSS for spin animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Notes list grouped by type */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Loading...
            </div>
          ) : (
            NOTE_TYPES.map(type => (
              <div key={type.id}>
                {/* Type header */}
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setExpandedTypes(prev => ({ ...prev, [type.id]: !prev[type.id] }))}
                >
                  {expandedTypes[type.id] ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <type.icon size={12} style={{ color: type.color }} />
                  <span>{type.label}</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                    {notesByType[type.id]?.length || 0}
                  </span>
                </div>

                {/* Notes in this type */}
                {expandedTypes[type.id] && notesByType[type.id]?.map(note => (
                  <div
                    key={note.note_id}
                    style={noteItemStyle(selectedNote?.note_id === note.note_id)}
                    onClick={() => handleSelectNote(note)}
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
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    }}>
                      {new Date(note.last_modified_at || note.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}

          {!loading && filteredNotes.length === 0 && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}>
              <FaStickyNote size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div>No notes yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Click + to create one
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL - Note Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#111827' : '#F9FAFB' }}>
        {(selectedNote || isCreating) ? (
          <>
            {/* Editor header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            }}>
              {isEditing ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note title..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              ) : (
                <h2 style={{
                  flex: 1,
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                }}>
                  {selectedNote?.title}
                </h2>
              )}

              {/* Note type selector */}
              {isEditing && (
                <select
                  value={editNoteType}
                  onChange={(e) => setEditNoteType(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                >
                  {NOTE_TYPES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        if (isCreating) {
                          setIsCreating(false);
                          setSelectedNote(null);
                        }
                        setIsEditing(false);
                      }}
                      style={{
                        ...buttonStyle,
                        background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                        color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      }}
                    >
                      <FaTimes size={12} />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        ...buttonStyle,
                        background: '#10B981',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      <FaSave size={12} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      style={{ ...buttonStyle, background: '#3B82F6' }}
                    >
                      <FaEdit size={12} />
                      Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      style={{ ...buttonStyle, background: '#EF4444' }}
                    >
                      <FaTrash size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Editor content */}
            <div style={{ flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {isEditing ? (
                <RichTextEditor
                  content={editText}
                  onChange={setEditText}
                  theme={theme}
                  editable={true}
                />
              ) : (
                selectedNote?.text ? (
                  <RichTextEditor
                    content={selectedNote.text}
                    onChange={() => {}}
                    theme={theme}
                    editable={false}
                  />
                ) : (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontStyle: 'italic',
                    minHeight: '200px',
                  }}>
                    No content yet. Click Edit to add content.
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          }}>
            <FaStickyNote size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>Select a note or create a new one</div>
            <button onClick={handleCreateNew} style={buttonStyle}>
              <FaPlus size={12} />
              New Note
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Actions & Links */}
      <div style={{ ...panelStyle, width: '25%', minWidth: '280px', borderRight: 'none', borderLeft: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}` }}>
        {selectedNote && !isCreating && (
          <>
            {/* Linked Entities */}
            <div style={headerStyle}>
              <span style={{ fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                <FaLink size={12} style={{ marginRight: '8px' }} />
                Linked Entities
              </span>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {/* Contacts */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <FaUser size={10} /> Contacts ({linkedContacts.length})
                  </span>
                  <button
                    onClick={() => { setLinkType('contact'); setShowLinkModal(true); }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <FaPlus size={8} />
                  </button>
                </div>
                {linkedContacts.map(c => (
                  <div
                    key={c.contact_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                      {c.first_name} {c.last_name}
                    </span>
                    <button
                      onClick={() => handleUnlinkEntity('contact', c.contact_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Companies */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <FaBuilding size={10} /> Companies ({linkedCompanies.length})
                  </span>
                  <button
                    onClick={() => { setLinkType('company'); setShowLinkModal(true); }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <FaPlus size={8} />
                  </button>
                </div>
                {linkedCompanies.map(c => (
                  <div
                    key={c.company_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                      {c.name}
                    </span>
                    <button
                      onClick={() => handleUnlinkEntity('company', c.company_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Deals */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <FaDollarSign size={10} /> Deals ({linkedDeals.length})
                  </span>
                  <button
                    onClick={() => { setLinkType('deal'); setShowLinkModal(true); }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <FaPlus size={8} />
                  </button>
                </div>
                {linkedDeals.map(d => (
                  <div
                    key={d.deal_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                      {d.opportunity}
                    </span>
                    <button
                      onClick={() => handleUnlinkEntity('deal', d.deal_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Introductions */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <FaHandshake size={10} /> Introductions ({linkedIntroductions.length})
                  </span>
                  <button
                    onClick={() => { setLinkType('introduction'); setShowLinkModal(true); }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <FaPlus size={8} />
                  </button>
                </div>
                {linkedIntroductions.map(i => (
                  <div
                    key={i.introduction_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <span style={{ color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                      {i.status} - {new Date(i.introduction_date).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleUnlinkEntity('introduction', i.introduction_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '2px',
                      }}
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note metadata */}
            <div style={{
              padding: '12px 16px',
              borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              fontSize: '11px',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}>
              <div>Created: {new Date(selectedNote.created_at).toLocaleString()}</div>
              <div>Modified: {new Date(selectedNote.last_modified_at || selectedNote.created_at).toLocaleString()}</div>
            </div>
          </>
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: '12px',
            padding: '20px',
            width: '400px',
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
              }}>
                Link {linkType}
              </h3>
              <button
                onClick={() => { setShowLinkModal(false); setLinkSearchQuery(''); setLinkSearchResults([]); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  cursor: 'pointer',
                }}
              >
                <FaTimes size={16} />
              </button>
            </div>

            <input
              type="text"
              placeholder={`Search ${linkType}s...`}
              value={linkSearchQuery}
              onChange={(e) => {
                setLinkSearchQuery(e.target.value);
                searchEntities(linkType, e.target.value);
              }}
              style={{
                ...searchInputStyle,
                marginBottom: '12px',
              }}
            />

            <div style={{ flex: 1, overflow: 'auto' }}>
              {linkSearching ? (
                <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                  Searching...
                </div>
              ) : linkSearchResults.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                  {linkSearchQuery ? 'No results' : 'Type to search'}
                </div>
              ) : (
                linkSearchResults.map(result => (
                  <div
                    key={result[`${linkType}_id`]}
                    onClick={() => handleLinkEntity(result)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginBottom: '4px',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '13px',
                    }}
                  >
                    {linkType === 'contact' && `${result.first_name} ${result.last_name}`}
                    {linkType === 'company' && result.name}
                    {linkType === 'deal' && result.opportunity}
                    {linkType === 'introduction' && `${result.status} - ${new Date(result.introduction_date).toLocaleDateString()}`}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesFullTab;
