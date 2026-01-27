import React, { useState, useEffect, useCallback } from 'react';
import {
  FaStickyNote, FaPlus, FaSearch, FaFolder, FaSave, FaTrash,
  FaLink, FaUser, FaBuilding, FaHandshake, FaDollarSign,
  FaChevronRight, FaChevronDown, FaEdit, FaTimes, FaSync,
  FaFolderOpen, FaFile, FaEye, FaPen
} from 'react-icons/fa';
import { SiObsidian } from 'react-icons/si';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';

// Folder icons and colors for Obsidian folders
const FOLDER_CONFIG = {
  '': { icon: FaFile, color: '#6B7280', emoji: '📄', label: 'Root' },
  'Inbox': { icon: FaFolder, color: '#8B5CF6', emoji: '📥' },
  '📥 Inbox': { icon: FaFolder, color: '#8B5CF6', emoji: '📥' },
  '📅 Daily Notes': { icon: FaStickyNote, color: '#3B82F6', emoji: '📅' },
  '🏢 Business': { icon: FaBuilding, color: '#10B981', emoji: '🏢' },
  '💭 Ideas & Philosophy': { icon: FaStickyNote, color: '#F59E0B', emoji: '💭' },
  '🤝 Meetings': { icon: FaHandshake, color: '#EC4899', emoji: '🤝' },
  '👥 People': { icon: FaUser, color: '#6366F1', emoji: '👥' },
  '📚 Learning': { icon: FaFolder, color: '#14B8A6', emoji: '📚' },
  '🍳 Recipes': { icon: FaFolder, color: '#F97316', emoji: '🍳' },
  '🛠️ Setup': { icon: FaFolder, color: '#64748B', emoji: '🛠️' },
  '📎 Resources': { icon: FaFolder, color: '#A855F7', emoji: '📎' },
  'default': { icon: FaFolder, color: '#6B7280', emoji: '📁' },
};

const NotesFullTab = ({ theme, onLinkedContactsChange, onLinkedCompaniesChange, onLinkedDealsChange }) => {
  // Notes list state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});

  // Selected note state
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editNoteType, setEditNoteType] = useState('general');
  const [editFolderPath, setEditFolderPath] = useState('Inbox');
  const [saving, setSaving] = useState(false);

  // Preview mode: 'edit' | 'preview' | 'split'
  const [viewMode, setViewMode] = useState('split');

  // New note state
  const [isCreating, setIsCreating] = useState(false);

  // Linked entities state
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [linkedDeals, setLinkedDeals] = useState([]);
  const [linkedIntroductions, setLinkedIntroductions] = useState([]);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState([]);
  const [linkSearching, setLinkSearching] = useState(false);

  // Obsidian sync state
  const [syncing, setSyncing] = useState(false);
  // Sync state
  const [lastSyncAt, setLastSyncAt] = useState(null);

  // Fetch sync status
  const fetchSyncStatus = async () => {
    try {
      const { data } = await supabase
        .from('obsidian_sync_state')
        .select('last_sync_at, sync_direction, files_synced')
        .eq('id', 'main')
        .single();
      if (data) {
        setLastSyncAt(data.last_sync_at);
      }
    } catch (e) {
      console.log('No sync state found');
    }
  };

  // Refresh notes and show sync status
  const handleObsidianSync = async () => {
    setSyncing(true);
    try {
      // Refresh notes from Supabase
      await fetchNotes();
      await fetchSyncStatus();

      const syncTime = lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : 'never';
      toast.success(`Notes refreshed! Last Obsidian sync: ${syncTime}`, {
        icon: '🔄',
        duration: 3000,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh notes');
    } finally {
      setSyncing(false);
    }
  };

  // Fetch sync status on mount
  useEffect(() => {
    fetchSyncStatus();
  }, []);

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
      const { data: contactLinks } = await supabase
        .from('notes_contacts')
        .select('contact_id, contacts(contact_id, first_name, last_name)')
        .eq('note_id', noteId);
      setLinkedContacts(contactLinks?.map(l => l.contacts).filter(Boolean) || []);

      const { data: companyLinks } = await supabase
        .from('note_companies')
        .select('company_id, companies(company_id, name)')
        .eq('note_id', noteId);
      setLinkedCompanies(companyLinks?.map(l => l.companies).filter(Boolean) || []);

      const { data: dealLinks } = await supabase
        .from('note_deals')
        .select('deal_id, deals(deal_id, opportunity)')
        .eq('note_id', noteId);
      setLinkedDeals(dealLinks?.map(l => l.deals).filter(Boolean) || []);

      const { data: introLinks } = await supabase
        .from('note_introductions')
        .select('introduction_id, introductions(introduction_id, status, introduction_date)')
        .eq('note_id', noteId);
      setLinkedIntroductions(introLinks?.map(l => l.introductions).filter(Boolean) || []);

    } catch (error) {
      console.error('Error fetching linked entities:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (selectedNote) {
      fetchLinkedEntities(selectedNote.note_id);
    }
  }, [selectedNote, fetchLinkedEntities]);

  // Notify parent of linked entities changes
  useEffect(() => {
    if (onLinkedContactsChange) {
      onLinkedContactsChange(linkedContacts);
    }
  }, [linkedContacts, onLinkedContactsChange]);

  useEffect(() => {
    if (onLinkedCompaniesChange) {
      onLinkedCompaniesChange(linkedCompanies);
    }
  }, [linkedCompanies, onLinkedCompaniesChange]);

  useEffect(() => {
    if (onLinkedDealsChange) {
      onLinkedDealsChange(linkedDeals);
    }
  }, [linkedDeals, onLinkedDealsChange]);

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.markdown_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === null || (note.folder_path || '') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // Get unique folders from notes - keep empty string for root files
  const uniqueFolders = [...new Set(notes.map(n => n.folder_path ?? ''))].sort();

  const notesByFolder = uniqueFolders.reduce((acc, folder) => {
    acc[folder] = filteredNotes.filter(n => (n.folder_path ?? '') === folder);
    return acc;
  }, {});

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    // Prefer markdown_content, fallback to text
    setEditContent(note.markdown_content || note.text || '');
    setEditNoteType(note.note_type || 'general');
    setEditFolderPath(note.folder_path || 'Inbox');
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
    setEditNoteType('general');
    setEditFolderPath('Inbox');
    setIsCreating(true);
    setIsEditing(true);
    setLinkedContacts([]);
    setLinkedCompanies([]);
    setLinkedDeals([]);
    setLinkedIntroductions([]);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        title: editTitle.trim(),
        markdown_content: editContent,
        text: editContent, // Keep text field for backward compat
        note_type: editNoteType,
        folder_path: editFolderPath,
        file_name: `${editTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
        last_modified_by: 'User',
        last_modified_at: new Date().toISOString(),
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from('notes')
          .insert({
            ...noteData,
            created_by: 'User',
          })
          .select()
          .single();

        if (error) throw error;
        setNotes(prev => [data, ...prev]);
        setSelectedNote(data);
        setIsCreating(false);
        toast.success('Note created!');
      } else {
        const { data, error } = await supabase
          .from('notes')
          .update(noteData)
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

  const handleLinkEntity = async (entity) => {
    if (!selectedNote) return;

    try {
      const tableName = linkType === 'contact' ? 'notes_contacts' : `note_${linkType}s`;
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

  const handleUnlinkEntity = async (type, entityId) => {
    if (!selectedNote) return;

    try {
      const tableName = type === 'contact' ? 'notes_contacts' : `note_${type}s`;
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

  const viewModeButtonStyle = (active) => ({
    padding: '6px 10px',
    borderRadius: '6px',
    border: 'none',
    background: active ? (theme === 'dark' ? '#4B5563' : '#E5E7EB') : 'transparent',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  });

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }} data-color-mode={theme}>
      {/* LEFT PANEL - Notes List */}
      <div style={{ ...panelStyle, width: '20%', minWidth: '250px', flexShrink: 0 }}>
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
            {syncing ? <FaSync size={12} className="spin" /> : <SiObsidian size={12} />}
          </button>
        </div>

        <style>{`
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        {/* Quick folder filter - top folders */}
        <div style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          display: 'flex',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedFolder(null)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: 'none',
              background: selectedFolder === null ? '#8B5CF6' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
              color: selectedFolder === null ? 'white' : (theme === 'dark' ? '#D1D5DB' : '#374151'),
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            All ({notes.length})
          </button>
          {uniqueFolders.slice(0, 5).map(folder => {
            const config = FOLDER_CONFIG[folder] || FOLDER_CONFIG.default;
            const displayName = config.label || folder || 'Root';
            return (
              <button
                key={folder || '_root'}
                onClick={() => setSelectedFolder(folder)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: 'none',
                  background: selectedFolder === folder ? '#8B5CF6' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                  color: selectedFolder === folder ? 'white' : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {config.emoji} {displayName}
              </button>
            );
          })}
        </div>

        {/* Notes list by folder */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Loading...
            </div>
          ) : (
            uniqueFolders.map(folder => {
              const folderConfig = FOLDER_CONFIG[folder] || FOLDER_CONFIG.default;
              const FolderIcon = folderConfig.icon;
              const folderNotes = notesByFolder[folder] || [];
              const isExpanded = expandedFolders[folder] !== false; // Default to expanded

              return (
                <div key={folder}>
                  <div
                    style={sectionHeaderStyle}
                    onClick={() => setExpandedFolders(prev => ({ ...prev, [folder]: !isExpanded }))}
                  >
                    {isExpanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                    <span style={{ fontSize: '12px' }}>{folderConfig.emoji || '📁'}</span>
                    <span>{folderConfig.label || folder || 'Root'}</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                      {folderNotes.length}
                    </span>
                  </div>

                  {isExpanded && folderNotes.map(note => (
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
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}>
                        <span>{note.file_name || note.title}</span>
                        <span>{new Date(note.last_modified_at || note.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })
          )}

          {!loading && filteredNotes.length === 0 && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}>
              <FaStickyNote size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div>No notes yet</div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL - Markdown Editor */}
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

              {/* View mode toggle */}
              {isEditing && (
                <div style={{ display: 'flex', gap: '4px', background: theme === 'dark' ? '#374151' : '#E5E7EB', borderRadius: '8px', padding: '2px' }}>
                  <button style={viewModeButtonStyle(viewMode === 'edit')} onClick={() => setViewMode('edit')}>
                    <FaPen size={10} /> Edit
                  </button>
                  <button style={viewModeButtonStyle(viewMode === 'split')} onClick={() => setViewMode('split')}>
                    Split
                  </button>
                  <button style={viewModeButtonStyle(viewMode === 'preview')} onClick={() => setViewMode('preview')}>
                    <FaEye size={10} /> Preview
                  </button>
                </div>
              )}

              {/* Folder selector - uses actual folders from Obsidian */}
              {isEditing && (
                <select
                  value={editFolderPath}
                  onChange={(e) => setEditFolderPath(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#374151' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                >
                  {uniqueFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {FOLDER_CONFIG[folder]?.emoji || '📁'} {folder}
                    </option>
                  ))}
                  {/* Allow creating new folder */}
                  {!uniqueFolders.includes(editFolderPath) && editFolderPath && (
                    <option value={editFolderPath}>{editFolderPath} (new)</option>
                  )}
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
                      onClick={handleCreateNew}
                      style={{
                        ...buttonStyle,
                        background: '#10B981',
                      }}
                    >
                      <FaStickyNote size={12} />
                      New
                    </button>
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

            {/* Markdown Editor Content - Scrollable area */}
            <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
              {isEditing ? (
                <MDEditor
                  value={editContent}
                  onChange={(val) => setEditContent(val || '')}
                  preview={viewMode === 'edit' ? 'edit' : viewMode === 'preview' ? 'preview' : 'live'}
                  height="100%"
                  style={{ minHeight: '300px' }}
                  visibleDragbar={false}
                />
              ) : (
                <div style={{
                  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <MDEditor.Markdown
                    source={selectedNote?.markdown_content || selectedNote?.text || ''}
                    style={{
                      background: 'transparent',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer Actions Bar - Fixed at bottom like email Reply/Forward */}
            {!isCreating && (
              <div style={{
                padding: '12px 16px',
                borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}>
                {/* Link buttons */}
                <button
                  onClick={() => { setLinkType('contact'); setShowLinkModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    background: theme === 'dark' ? '#374151' : '#F3F4F6',
                    color: theme === 'dark' ? '#F9FAFB' : '#374151',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <FaUser size={12} />
                  Contact {linkedContacts.length > 0 && <span style={{ background: '#3B82F6', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedContacts.length}</span>}
                </button>

                <button
                  onClick={() => { setLinkType('company'); setShowLinkModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    background: theme === 'dark' ? '#374151' : '#F3F4F6',
                    color: theme === 'dark' ? '#F9FAFB' : '#374151',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <FaBuilding size={12} />
                  Company {linkedCompanies.length > 0 && <span style={{ background: '#8B5CF6', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedCompanies.length}</span>}
                </button>

                <button
                  onClick={() => { setLinkType('deal'); setShowLinkModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    background: theme === 'dark' ? '#374151' : '#F3F4F6',
                    color: theme === 'dark' ? '#F9FAFB' : '#374151',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <FaDollarSign size={12} />
                  Deal {linkedDeals.length > 0 && <span style={{ background: '#10B981', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedDeals.length}</span>}
                </button>

                <button
                  onClick={() => { setLinkType('introduction'); setShowLinkModal(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    background: theme === 'dark' ? '#374151' : '#F3F4F6',
                    color: theme === 'dark' ? '#F9FAFB' : '#374151',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <FaHandshake size={12} />
                  Intro {linkedIntroductions.length > 0 && <span style={{ background: '#EC4899', color: 'white', padding: '0 6px', borderRadius: '10px', fontSize: '11px' }}>{linkedIntroductions.length}</span>}
                </button>

                {/* Linked items chips */}
                <div style={{ flex: 1 }} />

                {linkedContacts.map(c => (
                  <span key={c.contact_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', background: '#DBEAFE', color: '#1D4ED8', fontSize: '12px' }}>
                    <FaUser size={10} /> {c.first_name}
                    <FaTimes size={10} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => handleUnlinkEntity('contact', c.contact_id)} />
                  </span>
                ))}
                {linkedCompanies.map(c => (
                  <span key={c.company_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', background: '#EDE9FE', color: '#6D28D9', fontSize: '12px' }}>
                    <FaBuilding size={10} /> {c.name}
                    <FaTimes size={10} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => handleUnlinkEntity('company', c.company_id)} />
                  </span>
                ))}
                {linkedDeals.map(d => (
                  <span key={d.deal_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', background: '#D1FAE5', color: '#065F46', fontSize: '12px' }}>
                    <FaDollarSign size={10} /> {d.opportunity}
                    <FaTimes size={10} style={{ cursor: 'pointer', marginLeft: '2px' }} onClick={() => handleUnlinkEntity('deal', d.deal_id)} />
                  </span>
                ))}

                {/* Metadata on the right */}
                <div style={{ marginLeft: 'auto', fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
                  {selectedNote?.folder_path || 'Inbox'} • {new Date(selectedNote?.last_modified_at || selectedNote?.created_at).toLocaleDateString()}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Empty state header with New button on right */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            }}>
              <button
                onClick={handleCreateNew}
                style={{
                  ...buttonStyle,
                  background: '#10B981',
                }}
              >
                <FaStickyNote size={12} />
                New
              </button>
            </div>

            {/* Empty state content */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}>
              <FaStickyNote size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px' }}>Select a note or create a new one</div>
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
                style={{ background: 'none', border: 'none', color: theme === 'dark' ? '#9CA3AF' : '#6B7280', cursor: 'pointer' }}
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
              style={{ ...searchInputStyle, marginBottom: '12px' }}
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
