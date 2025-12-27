import React, { useState, useEffect, useCallback } from 'react';
import {
  FaStickyNote, FaPlus, FaRobot, FaSave, FaTrash,
  FaUser, FaBuilding, FaDollarSign, FaLink, FaTimes, FaCheck,
  FaFolder
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import MDEditor from '@uiw/react-md-editor';

// Folder options for organizing notes
const FOLDERS = [
  { id: 'Inbox', label: 'Inbox' },
  { id: 'CRM/Contacts', label: 'CRM / Contacts' },
  { id: 'CRM/Companies', label: 'CRM / Companies' },
  { id: 'CRM/Deals', label: 'CRM / Deals' },
  { id: 'CRM/Introductions', label: 'CRM / Introductions' },
  { id: 'Personal/Ideas', label: 'Personal / Ideas' },
  { id: 'Personal/Projects', label: 'Personal / Projects' },
  { id: 'Work/Meetings', label: 'Work / Meetings' },
  { id: 'Work/Research', label: 'Work / Research' },
  { id: 'Archive', label: 'Archive' },
];

/**
 * NotesTab - Notes editor following CompanyDetailsTab UI pattern
 *
 * Features:
 * 1. Dropdown to select note (with "Create New Note" at bottom)
 * 2. Full-space markdown editor
 * 3. AI Proofread + linking to contact/company/deal
 */
const NotesTab = ({
  theme,
  contactId,
  contactCompanies = [],
  contactDeals = [],
  onNoteCreated,
}) => {
  // All notes (from contact, companies, deals)
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected note
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Editor state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [folderPath, setFolderPath] = useState('CRM/Contacts');
  const [saving, setSaving] = useState(false);

  // Linking state
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [linkedDeals, setLinkedDeals] = useState([]);

  // Search state for linking
  const [contactSearch, setContactSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [companySearchResults, setCompanySearchResults] = useState([]);
  const [dealSearchResults, setDealSearchResults] = useState([]);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [searchingCompanies, setSearchingCompanies] = useState(false);
  const [searchingDeals, setSearchingDeals] = useState(false);

  // Fetch all notes linked to contact, their companies, and their deals
  const fetchAllNotes = useCallback(async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const noteMap = new Map();

      // 1. Contact notes
      const { data: contactLinks } = await supabase
        .from('notes_contacts')
        .select('note_id')
        .eq('contact_id', contactId);

      if (contactLinks) {
        contactLinks.forEach(l => noteMap.set(l.note_id, { source: 'contact' }));
      }

      // 2. Company notes
      if (contactCompanies.length > 0) {
        const companyIds = contactCompanies.map(c => c.company_id);
        const { data: companyLinks } = await supabase
          .from('note_companies')
          .select('note_id, company_id')
          .in('company_id', companyIds);

        if (companyLinks) {
          companyLinks.forEach(l => {
            const company = contactCompanies.find(c => c.company_id === l.company_id);
            noteMap.set(l.note_id, { source: 'company', companyName: company?.name });
          });
        }
      }

      // 3. Deal notes
      if (contactDeals.length > 0) {
        const dealIds = contactDeals.map(d => d.deal_id);
        const { data: dealLinks } = await supabase
          .from('note_deals')
          .select('note_id, deal_id')
          .in('deal_id', dealIds);

        if (dealLinks) {
          dealLinks.forEach(l => {
            const deal = contactDeals.find(d => d.deal_id === l.deal_id);
            noteMap.set(l.note_id, { source: 'deal', dealName: deal?.opportunity });
          });
        }
      }

      // Fetch actual notes
      const noteIds = Array.from(noteMap.keys());
      if (noteIds.length === 0) {
        setAllNotes([]);
        setLoading(false);
        return;
      }

      const { data: notes } = await supabase
        .from('notes')
        .select('*')
        .in('note_id', noteIds)
        .order('last_modified_at', { ascending: false });

      // Attach source info
      const notesWithSource = (notes || []).map(note => ({
        ...note,
        ...noteMap.get(note.note_id)
      }));

      setAllNotes(notesWithSource);
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [contactId, contactCompanies, contactDeals]);

  // Initial fetch
  useEffect(() => {
    fetchAllNotes();
  }, [fetchAllNotes]);

  // Load note into editor
  useEffect(() => {
    if (selectedNoteId && !isCreating) {
      const note = allNotes.find(n => n.note_id === selectedNoteId);
      if (note) {
        setTitle(note.title || '');
        setContent(note.markdown_content || note.text || '');
        setFolderPath(note.folder_path || 'Inbox');
        loadNoteLinks(note.note_id);
      }
    }
  }, [selectedNoteId, allNotes, isCreating]);

  // Load note links
  const loadNoteLinks = async (noteId) => {
    try {
      const [contactsRes, companiesRes, dealsRes] = await Promise.all([
        supabase.from('notes_contacts').select('contact_id').eq('note_id', noteId),
        supabase.from('note_companies').select('company_id').eq('note_id', noteId),
        supabase.from('note_deals').select('deal_id').eq('note_id', noteId),
      ]);

      setLinkedContacts(contactsRes.data?.map(r => r.contact_id) || []);
      setLinkedCompanies(companiesRes.data?.map(r => r.company_id) || []);
      setLinkedDeals(dealsRes.data?.map(r => r.deal_id) || []);
    } catch (err) {
      console.error('Error loading note links:', err);
    }
  };

  // Handle dropdown change
  const handleDropdownChange = (e) => {
    const value = e.target.value;
    if (value === '__create__') {
      setSelectedNoteId(null);
      setIsCreating(true);
      setTitle('');
      setContent('');
      setFolderPath('CRM/Contacts');
      setLinkedContacts([contactId]);
      setLinkedCompanies([]);
      setLinkedDeals([]);
    } else {
      setSelectedNoteId(value);
      setIsCreating(false);
    }
  };

  // Save note
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const noteData = {
        title: title.trim(),
        markdown_content: content,
        text: content,
        folder_path: folderPath,
        file_name: `${title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`,
        last_modified_by: 'User',
        last_modified_at: new Date().toISOString(),
      };

      let noteId = selectedNoteId;

      if (isCreating) {
        // Create new note
        const { data: newNote, error } = await supabase
          .from('notes')
          .insert({ ...noteData, note_type: 'general', created_by: 'User' })
          .select()
          .single();

        if (error) throw error;
        noteId = newNote.note_id;

        // Link to contact by default
        if (contactId) {
          await supabase.from('notes_contacts').insert({
            note_id: noteId,
            contact_id: contactId,
          });
        }

        toast.success('Note created');
        setSelectedNoteId(noteId);
        setIsCreating(false);
      } else {
        // Update existing note
        const { error } = await supabase
          .from('notes')
          .update(noteData)
          .eq('note_id', selectedNoteId);

        if (error) throw error;
        toast.success('Note saved');
      }

      fetchAllNotes();
      onNoteCreated?.();
    } catch (err) {
      console.error('Error saving note:', err);
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  // Delete note
  const handleDelete = async () => {
    if (!selectedNoteId || !window.confirm('Delete this note?')) return;

    try {
      await supabase.from('notes').delete().eq('note_id', selectedNoteId);
      toast.success('Note deleted');
      setSelectedNoteId(null);
      setTitle('');
      setContent('');
      fetchAllNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
      toast.error('Failed to delete note');
    }
  };

  // AI Proofread
  const handleProofread = async () => {
    if (!content.trim()) {
      toast.error('No content to proofread');
      return;
    }

    const toastId = toast.loading('AI proofreading...');
    try {
      const response = await fetch('https://command-center-backend-production.up.railway.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Proofread and improve this markdown note. Fix grammar, spelling, and improve clarity while keeping the same meaning and markdown formatting. Return ONLY the improved text, no explanations:\n\n${content}`,
          context: { type: 'proofread' }
        })
      });
      const data = await response.json();
      if (data.response) {
        setContent(data.response);
        toast.success('Content improved', { id: toastId });
      } else {
        toast.error('No response from AI', { id: toastId });
      }
    } catch (err) {
      console.error('Proofread error:', err);
      toast.error('Failed to proofread', { id: toastId });
    }
  };

  // Toggle link
  const toggleLink = async (type, id) => {
    if (!selectedNoteId && !isCreating) return;

    const noteId = selectedNoteId;
    if (!noteId) {
      // For new notes, just update local state
      if (type === 'contact') {
        setLinkedContacts(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
      } else if (type === 'company') {
        setLinkedCompanies(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
      } else if (type === 'deal') {
        setLinkedDeals(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
      }
      return;
    }

    try {
      const table = type === 'contact' ? 'notes_contacts' : type === 'company' ? 'note_companies' : 'note_deals';
      const idField = type === 'contact' ? 'contact_id' : type === 'company' ? 'company_id' : 'deal_id';
      const linkedArray = type === 'contact' ? linkedContacts : type === 'company' ? linkedCompanies : linkedDeals;
      const setLinked = type === 'contact' ? setLinkedContacts : type === 'company' ? setLinkedCompanies : setLinkedDeals;

      if (linkedArray.includes(id)) {
        // Remove link
        await supabase.from(table).delete().eq('note_id', noteId).eq(idField, id);
        setLinked(prev => prev.filter(x => x !== id));
        toast.success('Link removed');
      } else {
        // Add link
        await supabase.from(table).insert({ note_id: noteId, [idField]: id });
        setLinked(prev => [...prev, id]);
        toast.success('Link added');
      }
    } catch (err) {
      console.error('Error toggling link:', err);
      toast.error('Failed to update link');
    }
  };

  // Search contacts
  const searchContacts = useCallback(async (query) => {
    if (!query.trim()) {
      setContactSearchResults([]);
      return;
    }
    setSearchingContacts(true);
    try {
      const { data } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(5);
      setContactSearchResults(data || []);
    } catch (err) {
      console.error('Error searching contacts:', err);
    } finally {
      setSearchingContacts(false);
    }
  }, []);

  // Search companies
  const searchCompanies = useCallback(async (query) => {
    if (!query.trim()) {
      setCompanySearchResults([]);
      return;
    }
    setSearchingCompanies(true);
    try {
      const { data } = await supabase
        .from('companies')
        .select('company_id, name')
        .ilike('name', `%${query}%`)
        .limit(5);
      setCompanySearchResults(data || []);
    } catch (err) {
      console.error('Error searching companies:', err);
    } finally {
      setSearchingCompanies(false);
    }
  }, []);

  // Search deals
  const searchDeals = useCallback(async (query) => {
    if (!query.trim()) {
      setDealSearchResults([]);
      return;
    }
    setSearchingDeals(true);
    try {
      const { data } = await supabase
        .from('deals')
        .select('deal_id, opportunity, stage')
        .ilike('opportunity', `%${query}%`)
        .limit(5);
      setDealSearchResults(data || []);
    } catch (err) {
      console.error('Error searching deals:', err);
    } finally {
      setSearchingDeals(false);
    }
  }, []);

  // Debounced search handlers
  useEffect(() => {
    const timer = setTimeout(() => {
      if (contactSearch) searchContacts(contactSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [contactSearch, searchContacts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (companySearch) searchCompanies(companySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [companySearch, searchCompanies]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dealSearch) searchDeals(dealSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [dealSearch, searchDeals]);

  const selectedNote = allNotes.find(n => n.note_id === selectedNoteId);
  const hasContent = selectedNoteId || isCreating;

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  };

  const dropdownStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#374151' : '#FFFFFF',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const buttonStyle = {
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const sectionStyle = {
    padding: '12px',
    background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
  };

  return (
    <div style={containerStyle} data-color-mode={theme}>
      {/* Header: Dropdown + Actions */}
      <div style={{ padding: '12px', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}` }}>
        {/* Note Selector Dropdown */}
        <select
          value={isCreating ? '__create__' : (selectedNoteId || '')}
          onChange={handleDropdownChange}
          style={dropdownStyle}
        >
          <option value="" disabled>Select a note...</option>
          {allNotes.map(note => (
            <option key={note.note_id} value={note.note_id}>
              {note.title}
              {note.source === 'company' && note.companyName ? ` (${note.companyName})` : ''}
              {note.source === 'deal' && note.dealName ? ` (${note.dealName})` : ''}
            </option>
          ))}
          <option value="__create__" style={{ fontWeight: 600 }}>
            + Create New Note
          </option>
        </select>

        {/* Action Buttons */}
        {hasContent && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button
              onClick={handleProofread}
              style={{
                ...buttonStyle,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFFFFF',
              }}
              title="AI Proofread"
            >
              <FaRobot size={11} />
              AI Proofread
            </button>

            <button
              onClick={() => setShowLinkPanel(!showLinkPanel)}
              style={{
                ...buttonStyle,
                background: showLinkPanel
                  ? '#8B5CF6'
                  : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                color: showLinkPanel
                  ? '#FFFFFF'
                  : (theme === 'dark' ? '#D1D5DB' : '#374151'),
              }}
              title="Link to entities"
            >
              <FaLink size={11} />
              Link
            </button>

            <div style={{ flex: 1 }} />

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...buttonStyle,
                background: '#10B981',
                color: '#FFFFFF',
                opacity: saving ? 0.6 : 1,
              }}
              title="Save"
            >
              <FaSave size={11} />
              {saving ? 'Saving...' : 'Save'}
            </button>

            {!isCreating && (
              <button
                onClick={handleDelete}
                style={{
                  ...buttonStyle,
                  background: '#EF4444',
                  color: '#FFFFFF',
                }}
                title="Delete"
              >
                <FaTrash size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Link Panel (collapsible) */}
      {hasContent && showLinkPanel && (
        <div style={{
          padding: '12px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          background: theme === 'dark' ? '#111827' : '#F3F4F6',
          maxHeight: '300px',
          overflowY: 'auto',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            marginBottom: '10px',
            textTransform: 'uppercase',
          }}>
            Link Note To
          </div>

          {/* Contacts Section */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '10px',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <FaUser size={9} /> Contacts
            </div>
            {/* Search input */}
            <input
              type="text"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts..."
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '11px',
                marginBottom: '6px',
              }}
            />
            {/* Search results */}
            {contactSearchResults.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                {contactSearchResults.map(c => (
                  <button
                    key={c.contact_id}
                    onClick={() => {
                      toggleLink('contact', c.contact_id);
                      setContactSearch('');
                      setContactSearchResults([]);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${linkedContacts.includes(c.contact_id) ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                      background: linkedContacts.includes(c.contact_id)
                        ? (theme === 'dark' ? '#4C1D95' : '#EDE9FE')
                        : (theme === 'dark' ? '#374151' : '#F3F4F6'),
                      color: linkedContacts.includes(c.contact_id)
                        ? '#8B5CF6'
                        : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {linkedContacts.includes(c.contact_id) && <FaCheck size={8} />}
                    {c.first_name} {c.last_name}
                  </button>
                ))}
              </div>
            )}
            {searchingContacts && <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Searching...</div>}
            {/* Suggestion: Current contact */}
            <div style={{ fontSize: '9px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>Suggested:</div>
            <button
              onClick={() => toggleLink('contact', contactId)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${linkedContacts.includes(contactId) ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                background: linkedContacts.includes(contactId)
                  ? (theme === 'dark' ? '#4C1D95' : '#EDE9FE')
                  : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                color: linkedContacts.includes(contactId)
                  ? '#8B5CF6'
                  : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {linkedContacts.includes(contactId) && <FaCheck size={9} />}
              Current Contact
            </button>
          </div>

          {/* Companies Section */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '10px',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <FaBuilding size={9} /> Companies
            </div>
            {/* Search input */}
            <input
              type="text"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Search companies..."
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '11px',
                marginBottom: '6px',
              }}
            />
            {/* Search results */}
            {companySearchResults.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                {companySearchResults.map(c => (
                  <button
                    key={c.company_id}
                    onClick={() => {
                      toggleLink('company', c.company_id);
                      setCompanySearch('');
                      setCompanySearchResults([]);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${linkedCompanies.includes(c.company_id) ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                      background: linkedCompanies.includes(c.company_id)
                        ? (theme === 'dark' ? '#4C1D95' : '#EDE9FE')
                        : (theme === 'dark' ? '#374151' : '#F3F4F6'),
                      color: linkedCompanies.includes(c.company_id)
                        ? '#8B5CF6'
                        : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {linkedCompanies.includes(c.company_id) && <FaCheck size={8} />}
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            {searchingCompanies && <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Searching...</div>}
            {/* Suggestions: Contact's companies */}
            {contactCompanies.length > 0 && (
              <>
                <div style={{ fontSize: '9px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>Suggested:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {contactCompanies.map(company => (
                    <button
                      key={company.company_id}
                      onClick={() => toggleLink('company', company.company_id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${linkedCompanies.includes(company.company_id) ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                        background: linkedCompanies.includes(company.company_id)
                          ? (theme === 'dark' ? '#4C1D95' : '#EDE9FE')
                          : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                        color: linkedCompanies.includes(company.company_id)
                          ? '#8B5CF6'
                          : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {linkedCompanies.includes(company.company_id) && <FaCheck size={9} />}
                      {company.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Deals Section */}
          <div>
            <div style={{
              fontSize: '10px',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <FaDollarSign size={9} /> Deals
            </div>
            {/* Search input */}
            <input
              type="text"
              value={dealSearch}
              onChange={(e) => setDealSearch(e.target.value)}
              placeholder="Search deals..."
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
                fontSize: '11px',
                marginBottom: '6px',
              }}
            />
            {/* Search results */}
            {dealSearchResults.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                {dealSearchResults.map(d => (
                  <button
                    key={d.deal_id}
                    onClick={() => {
                      toggleLink('deal', d.deal_id);
                      setDealSearch('');
                      setDealSearchResults([]);
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${linkedDeals.includes(d.deal_id) ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                      background: linkedDeals.includes(d.deal_id)
                        ? (theme === 'dark' ? '#4C1D95' : '#EDE9FE')
                        : (theme === 'dark' ? '#374151' : '#F3F4F6'),
                      color: linkedDeals.includes(d.deal_id)
                        ? '#8B5CF6'
                        : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {linkedDeals.includes(d.deal_id) && <FaCheck size={8} />}
                    {d.opportunity}
                  </button>
                ))}
              </div>
            )}
            {searchingDeals && <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Searching...</div>}
            {/* Suggestions: Contact's deals */}
            {contactDeals.length > 0 && (
              <>
                <div style={{ fontSize: '9px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginBottom: '4px' }}>Suggested:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {contactDeals.map(deal => (
                    <button
                      key={deal.deal_id}
                      onClick={() => toggleLink('deal', deal.deal_id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${linkedDeals.includes(deal.deal_id) ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                        background: linkedDeals.includes(deal.deal_id)
                          ? (theme === 'dark' ? '#4C1D95' : '#EDE9FE')
                          : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                        color: linkedDeals.includes(deal.deal_id)
                          ? '#8B5CF6'
                          : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {linkedDeals.includes(deal.deal_id) && <FaCheck size={9} />}
                      {deal.opportunity}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          }}>
            Loading...
          </div>
        ) : !hasContent ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            textAlign: 'center',
          }}>
            <FaStickyNote size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {allNotes.length === 0 ? 'No notes yet' : 'Select a note'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {allNotes.length === 0
                ? 'Create your first note from the dropdown above'
                : 'Choose a note from the dropdown or create a new one'
              }
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
            {/* Title + Folder Row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              />
              {/* Folder Selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FaFolder size={12} color={theme === 'dark' ? '#9CA3AF' : '#6B7280'} />
                <select
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    fontSize: '12px',
                    cursor: 'pointer',
                    minWidth: '150px',
                  }}
                >
                  {FOLDERS.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Markdown Editor */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || '')}
                preview="live"
                height="100%"
                visibleDragbar={false}
                style={{
                  height: '100%',
                  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesTab;
