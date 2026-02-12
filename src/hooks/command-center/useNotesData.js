import { useState, useEffect, useCallback } from 'react';
import {
  FaStickyNote, FaFolder, FaUser, FaBuilding, FaHandshake, FaFile,
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

// Folder icons and colors for Obsidian folders
const FOLDER_CONFIG = {
  '': { icon: FaFile, color: '#6B7280', emoji: '📄', label: 'Root' },
  'Favourites': { icon: FaFolder, color: '#F59E0B', emoji: '⭐' },
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

const useNotesData = (activeTab) => {
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

  // Fetch sync status on mount (only when notes tab active)
  useEffect(() => {
    if (activeTab === 'notes') {
      fetchSyncStatus();
    }
  }, [activeTab]);

  // Fetch notes when tab becomes active
  useEffect(() => {
    if (activeTab === 'notes') {
      fetchNotes();
    }
  }, [activeTab, fetchNotes]);

  // Fetch linked entities when selected note changes
  useEffect(() => {
    if (selectedNote) {
      fetchLinkedEntities(selectedNote.note_id);
    }
  }, [selectedNote, fetchLinkedEntities]);

  // Filter notes
  const filteredNotes = notes.filter(note => {
    const matchesSearch = !searchQuery ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.markdown_content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.text?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === null || (note.folder_path || '') === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  // Get unique folders from notes
  const uniqueFolders = [...new Set(notes.map(n => n.folder_path ?? ''))].sort();

  const notesByFolder = uniqueFolders.reduce((acc, folder) => {
    acc[folder] = filteredNotes.filter(n => (n.folder_path ?? '') === folder);
    return acc;
  }, {});

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
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
        text: editContent,
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

  return {
    // State
    notes, loading, searchQuery, setSearchQuery,
    selectedFolder, setSelectedFolder,
    expandedFolders, setExpandedFolders,
    selectedNote, setSelectedNote,
    isEditing, setIsEditing,
    editTitle, setEditTitle,
    editContent, setEditContent,
    editNoteType, setEditNoteType,
    editFolderPath, setEditFolderPath,
    saving,
    viewMode, setViewMode,
    isCreating, setIsCreating,
    // Linked entities
    linkedContacts, linkedCompanies, linkedDeals, linkedIntroductions,
    // Link modal
    showLinkModal, setShowLinkModal,
    linkType, setLinkType,
    linkSearchQuery, setLinkSearchQuery,
    linkSearchResults, linkSearching,
    // Sync
    syncing, lastSyncAt,
    // Computed
    filteredNotes, uniqueFolders, notesByFolder,
    FOLDER_CONFIG,
    // Handlers
    handleSelectNote, handleCreateNew, handleSave, handleDelete,
    handleObsidianSync, searchEntities, handleLinkEntity, handleUnlinkEntity,
    fetchNotes,
  };
};

export default useNotesData;
