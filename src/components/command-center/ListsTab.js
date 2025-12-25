import React, { useState, useEffect, useCallback } from 'react';
import {
  FaList, FaPlus, FaSearch, FaUsers, FaTrash, FaMagic,
  FaChevronRight, FaChevronDown, FaTimes, FaEnvelope,
  FaRocket, FaCog, FaSync
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const ListsTab = ({ theme, profileImageModal }) => {
  // Lists state
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({ dynamic: true, static: true });

  // Selected list state
  const [selectedList, setSelectedList] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Create list modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListType, setNewListType] = useState('static');
  const [creating, setCreating] = useState(false);

  // Add member modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactEmails, setContactEmails] = useState([]);
  const [selectedEmailId, setSelectedEmailId] = useState(null);
  const [addingMember, setAddingMember] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Filters state (for dynamic lists)
  const [filters, setFilters] = useState(null);
  const [loadingFilters, setLoadingFilters] = useState(false);

  // Inline edit state
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  // Fetch all lists
  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
      toast.error('Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch members for selected list
  const fetchMembers = useCallback(async (listId) => {
    if (!listId) {
      setMembers([]);
      return;
    }

    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('email_list_members')
        .select(`
          list_member_id,
          is_active,
          membership_type,
          added_at,
          contact_id,
          contacts (
            contact_id,
            first_name,
            last_name,
            profile_image_url
          ),
          email_id,
          contact_emails (
            email
          )
        `)
        .eq('list_id', listId)
        .eq('is_active', true)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Fetch filters for dynamic list
  const fetchFilters = useCallback(async (listId) => {
    if (!listId) {
      setFilters(null);
      return;
    }

    setLoadingFilters(true);
    try {
      // Fetch all filter types in parallel
      const [scoresRes, categoriesRes, tagsRes, citiesRes, kitRes, completenessRes] = await Promise.all([
        supabase.from('email_list_filter_scores').select('score').eq('list_id', listId),
        supabase.from('email_list_filter_categories').select('category').eq('list_id', listId),
        supabase.from('email_list_filter_tags').select('tag_id, tags(name)').eq('list_id', listId),
        supabase.from('email_list_filter_cities').select('city_name').eq('list_id', listId),
        supabase.from('email_list_filter_kit').select('frequency').eq('list_id', listId),
        supabase.from('email_list_filter_completeness').select('max_score, exclude_marked_complete').eq('list_id', listId),
      ]);

      setFilters({
        scores: scoresRes.data?.map(r => r.score) || [],
        categories: categoriesRes.data?.map(r => r.category) || [],
        tags: tagsRes.data?.map(r => r.tags?.name).filter(Boolean) || [],
        cities: citiesRes.data?.map(r => r.city_name) || [],
        keepInTouch: kitRes.data?.map(r => r.frequency) || [],
        completeness: completenessRes.data?.[0] || null,
      });
    } catch (error) {
      console.error('Error fetching filters:', error);
      setFilters(null);
    } finally {
      setLoadingFilters(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Fetch members when list is selected
  useEffect(() => {
    if (selectedList) {
      fetchMembers(selectedList.list_id);
      // Fetch filters for dynamic lists
      if (selectedList.list_type === 'dynamic') {
        fetchFilters(selectedList.list_id);
      } else {
        setFilters(null);
      }
    }
  }, [selectedList, fetchMembers, fetchFilters]);

  // Filter lists by search
  const filteredLists = lists.filter(list =>
    !searchQuery ||
    list.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    list.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group lists by type
  const dynamicLists = filteredLists.filter(l => l.list_type === 'dynamic');
  const staticLists = filteredLists.filter(l => l.list_type === 'static');

  // Handle list selection
  const handleSelectList = (list) => {
    setSelectedList(list);
  };

  // Handle create list
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      toast.error('List name is required');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('email_lists')
        .insert({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          list_type: newListType,
          is_active: true,
          created_by: 'User',
          last_modified_by: 'User',
        })
        .select()
        .single();

      if (error) throw error;

      setLists(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowCreateModal(false);
      setNewListName('');
      setNewListDescription('');
      setNewListType('static');
      setSelectedList(data);
      toast.success('List created!');
    } catch (error) {
      console.error('Error creating list:', error);
      toast.error('Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  // Handle delete list
  const handleDeleteList = async () => {
    if (!selectedList || !window.confirm(`Delete "${selectedList.name}"? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('email_lists')
        .update({ is_active: false })
        .eq('list_id', selectedList.list_id);

      if (error) throw error;

      setLists(prev => prev.filter(l => l.list_id !== selectedList.list_id));
      setSelectedList(null);
      setMembers([]);
      toast.success('List deleted');
    } catch (error) {
      console.error('Error deleting list:', error);
      toast.error('Failed to delete list');
    }
  };

  // Search contacts for add member
  const searchContacts = async (query) => {
    if (!query.trim() || query.length < 2) {
      setMemberSearchResults([]);
      return;
    }

    setSearchingMembers(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name, profile_image_url')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .neq('category', 'Skip')
        .limit(10);

      if (error) throw error;
      setMemberSearchResults(data || []);
    } catch (error) {
      console.error('Error searching contacts:', error);
    } finally {
      setSearchingMembers(false);
    }
  };

  // Fetch emails for selected contact
  const fetchContactEmails = async (contactId) => {
    try {
      const { data, error } = await supabase
        .from('contact_emails')
        .select('email_id, email, is_primary')
        .eq('contact_id', contactId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContactEmails(data || []);
      if (data && data.length > 0) {
        setSelectedEmailId(data[0].email_id);
      }
    } catch (error) {
      console.error('Error fetching contact emails:', error);
      setContactEmails([]);
    }
  };

  // Handle contact selection
  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setContactEmails([]);
    setSelectedEmailId(null);
    fetchContactEmails(contact.contact_id);
  };

  // Handle add member
  const handleAddMember = async () => {
    if (!selectedList || !selectedContact || !selectedEmailId) {
      toast.error('Please select a contact and email');
      return;
    }

    // Check if already a member
    const existingMember = members.find(m => m.contact_id === selectedContact.contact_id);
    if (existingMember) {
      toast.error('Contact is already a member of this list');
      return;
    }

    setAddingMember(true);
    try {
      const { data, error } = await supabase
        .from('email_list_members')
        .insert({
          list_id: selectedList.list_id,
          contact_id: selectedContact.contact_id,
          email_id: selectedEmailId,
          membership_type: 'manual',
          is_active: true,
          added_by: 'User',
        })
        .select(`
          list_member_id,
          is_active,
          membership_type,
          added_at,
          contact_id,
          contacts (
            contact_id,
            first_name,
            last_name,
            profile_image_url
          ),
          email_id,
          contact_emails (
            email
          )
        `)
        .single();

      if (error) throw error;

      setMembers(prev => [data, ...prev]);
      setShowAddMemberModal(false);
      setMemberSearchQuery('');
      setMemberSearchResults([]);
      setSelectedContact(null);
      setContactEmails([]);
      setSelectedEmailId(null);
      toast.success('Member added!');
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // Handle remove member
  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this member from the list?')) return;

    try {
      const { error } = await supabase
        .from('email_list_members')
        .update({ is_active: false })
        .eq('list_member_id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.list_member_id !== memberId));
      toast.success('Member removed');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  // Handle refresh dynamic list
  const handleRefreshList = async () => {
    if (!selectedList || selectedList.list_type !== 'dynamic' || refreshing) return;

    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .rpc('refresh_dynamic_list', { p_list_id: selectedList.list_id });

      if (error) throw error;

      const result = data?.[0] || { added: 0, removed: 0 };

      // Reload members
      await fetchMembers(selectedList.list_id);

      toast.success(`Refreshed: ${result.added} added, ${result.removed} removed`);
    } catch (error) {
      console.error('Error refreshing list:', error);
      toast.error('Failed to refresh list');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle save list name
  const handleSaveName = async () => {
    if (!selectedList || !editedName.trim() || editedName.trim() === selectedList.name) {
      setEditingName(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('email_lists')
        .update({
          name: editedName.trim(),
          last_modified_by: 'User',
          last_modified_at: new Date().toISOString()
        })
        .eq('list_id', selectedList.list_id);

      if (error) throw error;

      // Update local state
      const updatedList = { ...selectedList, name: editedName.trim() };
      setSelectedList(updatedList);
      setLists(prev => prev.map(l =>
        l.list_id === selectedList.list_id ? updatedList : l
      ).sort((a, b) => a.name.localeCompare(b.name)));

      toast.success('List renamed');
    } catch (error) {
      console.error('Error renaming list:', error);
      toast.error('Failed to rename list');
    } finally {
      setEditingName(false);
    }
  };

  // Handle save description
  const handleSaveDescription = async () => {
    if (!selectedList || editedDescription.trim() === (selectedList.description || '')) {
      setEditingDescription(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('email_lists')
        .update({
          description: editedDescription.trim() || null,
          last_modified_by: 'User',
          last_modified_at: new Date().toISOString()
        })
        .eq('list_id', selectedList.list_id);

      if (error) throw error;

      // Update local state
      const updatedList = { ...selectedList, description: editedDescription.trim() || null };
      setSelectedList(updatedList);
      setLists(prev => prev.map(l =>
        l.list_id === selectedList.list_id ? updatedList : l
      ));

      toast.success('Description updated');
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error('Failed to update description');
    } finally {
      setEditingDescription(false);
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

  const listItemStyle = (isSelected) => ({
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

  const memberCardStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
  };

  const avatarStyle = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
    fontSize: '14px',
    fontWeight: 600,
    flexShrink: 0,
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      {/* LEFT PANEL - Lists */}
      <div style={{ ...panelStyle, width: '20%', minWidth: '250px', flexShrink: 0 }}>
        {/* Header with search and add button */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <FaSearch size={14} style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} />
            <input
              type="text"
              placeholder="Search lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <button onClick={() => setShowCreateModal(true)} style={buttonStyle}>
            <FaPlus size={12} />
          </button>
        </div>

        {/* Lists grouped by type */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              Loading...
            </div>
          ) : (
            <>
              {/* Dynamic Lists Section */}
              <div>
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setExpandedSections(prev => ({ ...prev, dynamic: !prev.dynamic }))}
                >
                  {expandedSections.dynamic ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaMagic size={12} style={{ color: '#8B5CF6' }} />
                  <span>Dynamic</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                    {dynamicLists.length}
                  </span>
                </div>

                {expandedSections.dynamic && dynamicLists.map(list => (
                  <div
                    key={list.list_id}
                    style={listItemStyle(selectedList?.list_id === list.list_id)}
                    onClick={() => handleSelectList(list)}
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <FaMagic size={10} style={{ color: '#8B5CF6' }} />
                      {list.name}
                    </div>
                    {list.description && (
                      <div style={{
                        fontSize: '11px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {list.description}
                      </div>
                    )}
                  </div>
                ))}

                {expandedSections.dynamic && dynamicLists.length === 0 && (
                  <div style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontStyle: 'italic',
                  }}>
                    No dynamic lists
                  </div>
                )}
              </div>

              {/* Static Lists Section */}
              <div>
                <div
                  style={sectionHeaderStyle}
                  onClick={() => setExpandedSections(prev => ({ ...prev, static: !prev.static }))}
                >
                  {expandedSections.static ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaList size={12} style={{ color: '#3B82F6' }} />
                  <span>Static</span>
                  <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                    {staticLists.length}
                  </span>
                </div>

                {expandedSections.static && staticLists.map(list => (
                  <div
                    key={list.list_id}
                    style={listItemStyle(selectedList?.list_id === list.list_id)}
                    onClick={() => handleSelectList(list)}
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <FaList size={10} style={{ color: '#3B82F6' }} />
                      {list.name}
                    </div>
                    {list.description && (
                      <div style={{
                        fontSize: '11px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {list.description}
                      </div>
                    )}
                  </div>
                ))}

                {expandedSections.static && staticLists.length === 0 && (
                  <div style={{
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontStyle: 'italic',
                  }}>
                    No static lists
                  </div>
                )}
              </div>
            </>
          )}

          {!loading && filteredLists.length === 0 && searchQuery && (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}>
              <FaList size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div>No lists match your search</div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL - Members */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#111827' : '#F9FAFB' }}>
        {selectedList ? (
          <>
            {/* List header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            }}>
              <div style={{ flex: 1 }}>
                {editingName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedList.list_type === 'dynamic' ? (
                      <FaMagic size={14} style={{ color: '#8B5CF6' }} />
                    ) : (
                      <FaList size={14} style={{ color: '#3B82F6' }} />
                    )}
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleSaveName}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                      autoFocus
                      style={{
                        fontSize: '18px',
                        fontWeight: 600,
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        background: theme === 'dark' ? '#374151' : '#F3F4F6',
                        border: `2px solid ${theme === 'dark' ? '#6366F1' : '#8B5CF6'}`,
                        borderRadius: '6px',
                        padding: '4px 8px',
                        outline: 'none',
                        minWidth: '200px',
                      }}
                    />
                  </div>
                ) : (
                  <h2
                    onClick={() => {
                      setEditedName(selectedList.name);
                      setEditingName(true);
                    }}
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                    }}
                    title="Click to edit name"
                  >
                    {selectedList.list_type === 'dynamic' ? (
                      <FaMagic size={14} style={{ color: '#8B5CF6' }} />
                    ) : (
                      <FaList size={14} style={{ color: '#3B82F6' }} />
                    )}
                    {selectedList.name}
                  </h2>
                )}
                {editingDescription ? (
                  <input
                    type="text"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    onBlur={handleSaveDescription}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveDescription();
                      if (e.key === 'Escape') setEditingDescription(false);
                    }}
                    autoFocus
                    placeholder="Add description..."
                    style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#D1D5DB' : '#4B5563',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      border: `1px solid ${theme === 'dark' ? '#6366F1' : '#8B5CF6'}`,
                      borderRadius: '4px',
                      padding: '4px 8px',
                      marginTop: '4px',
                      outline: 'none',
                      width: '100%',
                      maxWidth: '400px',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => {
                      setEditedDescription(selectedList.description || '');
                      setEditingDescription(true);
                    }}
                    style={{
                      fontSize: '12px',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginTop: '4px',
                      cursor: 'pointer',
                      minHeight: '18px',
                    }}
                    title="Click to edit description"
                  >
                    {selectedList.description || <span style={{ fontStyle: 'italic', opacity: 0.6 }}>Add description...</span>}
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: theme === 'dark' ? '#374151' : '#F3F4F6',
                fontSize: '13px',
                color: theme === 'dark' ? '#D1D5DB' : '#374151',
              }}>
                <FaUsers size={12} />
                {members.length} members
              </div>

              {/* Add Member button - only for static lists */}
              {selectedList.list_type === 'static' && (
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  style={{
                    ...buttonStyle,
                    background: '#10B981',
                  }}
                  title="Add member"
                >
                  <FaPlus size={12} />
                  Add Member
                </button>
              )}

              {/* Refresh button - only for dynamic lists */}
              {selectedList.list_type === 'dynamic' && (
                <button
                  onClick={handleRefreshList}
                  disabled={refreshing}
                  style={{
                    ...buttonStyle,
                    background: '#8B5CF6',
                    opacity: refreshing ? 0.7 : 1,
                  }}
                  title="Refresh list members"
                >
                  <FaSync size={12} style={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none'
                  }} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              )}

              <button
                onClick={handleDeleteList}
                style={{
                  ...buttonStyle,
                  background: '#EF4444',
                  padding: '8px',
                }}
                title="Delete list"
              >
                <FaTrash size={12} />
              </button>
            </div>

            {/* Members list */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {loadingMembers ? (
                <div style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                  Loading members...
                </div>
              ) : members.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                }}>
                  <FaUsers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>No members yet</div>
                  <div style={{ fontSize: '12px', marginBottom: '16px' }}>
                    {selectedList.list_type === 'dynamic'
                      ? 'Configure filters, then refresh to populate members'
                      : 'Add contacts to this list manually'}
                  </div>
                  {selectedList.list_type === 'static' && (
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      style={{
                        ...buttonStyle,
                        background: '#10B981',
                      }}
                    >
                      <FaPlus size={12} />
                      Add First Member
                    </button>
                  )}
                  {selectedList.list_type === 'dynamic' && (
                    <button
                      onClick={handleRefreshList}
                      disabled={refreshing}
                      style={{
                        ...buttonStyle,
                        background: '#8B5CF6',
                        opacity: refreshing ? 0.7 : 1,
                      }}
                    >
                      <FaSync size={12} style={{
                        animation: refreshing ? 'spin 1s linear infinite' : 'none'
                      }} />
                      {refreshing ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  )}
                </div>
              ) : (
                members.map(member => (
                  <div key={member.list_member_id} style={memberCardStyle}>
                    <div
                      style={{ cursor: member.contacts ? 'pointer' : 'default' }}
                      onClick={() => member.contacts && profileImageModal?.openModal(member.contacts)}
                      title={member.contacts ? 'Edit profile image' : ''}
                    >
                      {member.contacts?.profile_image_url ? (
                        <img
                          src={member.contacts.profile_image_url}
                          alt=""
                          style={{ ...avatarStyle, objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={avatarStyle}>
                          {member.contacts?.first_name?.[0] || '?'}
                          {member.contacts?.last_name?.[0] || ''}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      }}>
                        {member.contacts?.first_name} {member.contacts?.last_name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        <FaEnvelope size={10} />
                        {member.contact_emails?.email || 'No email'}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '10px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: member.membership_type === 'computed'
                        ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                        : (theme === 'dark' ? '#1F2937' : '#F3F4F6'),
                      color: member.membership_type === 'computed'
                        ? (theme === 'dark' ? '#93C5FD' : '#2563EB')
                        : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                    }}>
                      {member.membership_type === 'computed' ? 'Auto' : 'Manual'}
                    </div>
                    {/* Remove button for manual members in static lists */}
                    {selectedList.list_type === 'static' && member.membership_type === 'manual' && (
                      <button
                        onClick={() => handleRemoveMember(member.list_member_id)}
                        style={{
                          padding: '6px',
                          borderRadius: '4px',
                          border: 'none',
                          background: 'transparent',
                          color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                          cursor: 'pointer',
                        }}
                        title="Remove member"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                ))
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
            <FaList size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', marginBottom: '8px' }}>Select a list or create a new one</div>
            <button onClick={() => setShowCreateModal(true)} style={buttonStyle}>
              <FaPlus size={12} />
              New List
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL - Action Center */}
      <div style={{
        ...panelStyle,
        width: '25%',
        minWidth: '280px',
        borderRight: 'none',
        borderLeft: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
      }}>
        <div style={headerStyle}>
          <span style={{
            fontWeight: 600,
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FaCog size={12} />
            {selectedList?.list_type === 'dynamic' ? 'Filters' : 'Action Center'}
          </span>
        </div>

        {/* Show filters for dynamic lists */}
        {selectedList?.list_type === 'dynamic' ? (
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            {loadingFilters ? (
              <div style={{ textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                Loading filters...
              </div>
            ) : filters && (filters.scores.length > 0 || filters.categories.length > 0 || filters.tags.length > 0 || filters.cities.length > 0 || filters.keepInTouch.length > 0 || filters.completeness) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Scores */}
                {filters.scores.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      Score
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {filters.scores.map(score => (
                        <span key={score} style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: theme === 'dark' ? '#7C3AED' : '#EDE9FE',
                          color: theme === 'dark' ? '#F3E8FF' : '#6D28D9',
                          fontWeight: 500,
                        }}>
                          ⭐ {score}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {filters.categories.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      Category
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {filters.categories.map(cat => (
                        <span key={cat} style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: theme === 'dark' ? '#1E40AF' : '#DBEAFE',
                          color: theme === 'dark' ? '#BFDBFE' : '#1E40AF',
                          fontWeight: 500,
                        }}>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {filters.tags.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      Tags
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {filters.tags.map(tag => (
                        <span key={tag} style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: theme === 'dark' ? '#065F46' : '#D1FAE5',
                          color: theme === 'dark' ? '#A7F3D0' : '#065F46',
                          fontWeight: 500,
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cities */}
                {filters.cities.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      Cities
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {filters.cities.map(city => (
                        <span key={city} style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: theme === 'dark' ? '#92400E' : '#FEF3C7',
                          color: theme === 'dark' ? '#FDE68A' : '#92400E',
                          fontWeight: 500,
                        }}>
                          📍 {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Keep in Touch */}
                {filters.keepInTouch.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      Keep in Touch
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {filters.keepInTouch.map(freq => (
                        <span key={freq} style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: theme === 'dark' ? '#BE185D' : '#FCE7F3',
                          color: theme === 'dark' ? '#FBCFE8' : '#BE185D',
                          fontWeight: 500,
                        }}>
                          🔄 {freq}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completeness */}
                {filters.completeness && (
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}>
                      Completeness
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: theme === 'dark' ? '#DC2626' : '#FEE2E2',
                        color: theme === 'dark' ? '#FECACA' : '#DC2626',
                        fontWeight: 500,
                      }}>
                        📊 ≤ {filters.completeness.max_score}%
                      </span>
                      {filters.completeness.exclude_marked_complete && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: theme === 'dark' ? '#7C2D12' : '#FFEDD5',
                          color: theme === 'dark' ? '#FDBA74' : '#9A3412',
                          fontWeight: 500,
                        }}>
                          Not marked complete
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Filter logic explanation */}
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                  fontSize: '11px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  lineHeight: 1.5,
                }}>
                  <strong>Logic:</strong> AND between filter types, OR within same type
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                textAlign: 'center',
              }}>
                <FaMagic size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>No filters configured</div>
                <div style={{ fontSize: '11px', lineHeight: 1.5 }}>
                  This dynamic list has no filter criteria yet
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          }}>
            <FaRocket size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '8px',
              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            }}>
              Coming Soon
            </div>
            <div style={{
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: 1.5,
            }}>
              Send campaigns, manage filters, and track analytics
            </div>
          </div>
        )}
      </div>

      {/* Create List Modal */}
      {showCreateModal && (
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
            padding: '24px',
            width: '400px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
              }}>
                Create New List
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '6px',
              }}>
                List Name *
              </label>
              <input
                type="text"
                placeholder="Enter list name..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '6px',
              }}>
                Description
              </label>
              <textarea
                placeholder="Enter description..."
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  minHeight: '80px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '6px',
              }}>
                List Type
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setNewListType('static')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${newListType === 'static' ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                    background: newListType === 'static'
                      ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                      : 'transparent',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FaList size={16} style={{ color: '#3B82F6' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Static</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>Manual members</span>
                </button>
                <button
                  onClick={() => setNewListType('dynamic')}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: `2px solid ${newListType === 'dynamic' ? '#8B5CF6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                    background: newListType === 'dynamic'
                      ? (theme === 'dark' ? '#2E1065' : '#EDE9FE')
                      : 'transparent',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <FaMagic size={16} style={{ color: '#8B5CF6' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>Dynamic</span>
                  <span style={{ fontSize: '10px', opacity: 0.7 }}>Auto from filters</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={creating || !newListName.trim()}
                style={{
                  ...buttonStyle,
                  opacity: creating || !newListName.trim() ? 0.7 : 1,
                }}
              >
                {creating ? 'Creating...' : 'Create List'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
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
            padding: '24px',
            width: '450px',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
              }}>
                Add Member to {selectedList?.name}
              </h3>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setMemberSearchQuery('');
                  setMemberSearchResults([]);
                  setSelectedContact(null);
                  setContactEmails([]);
                  setSelectedEmailId(null);
                }}
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

            {/* Search contacts */}
            {!selectedContact ? (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    marginBottom: '6px',
                  }}>
                    Search Contact
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaSearch size={14} style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} />
                    <input
                      type="text"
                      placeholder="Type name to search..."
                      value={memberSearchQuery}
                      onChange={(e) => {
                        setMemberSearchQuery(e.target.value);
                        searchContacts(e.target.value);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: theme === 'dark' ? '#374151' : '#FFFFFF',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        fontSize: '14px',
                        outline: 'none',
                      }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* Search results */}
                <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px' }}>
                  {searchingMembers ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                      Searching...
                    </div>
                  ) : memberSearchResults.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                      {memberSearchQuery.length >= 2 ? 'No contacts found' : 'Type at least 2 characters to search'}
                    </div>
                  ) : (
                    memberSearchResults.map(contact => (
                      <div
                        key={contact.contact_id}
                        onClick={() => handleSelectContact(contact)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          marginBottom: '4px',
                          background: theme === 'dark' ? '#374151' : '#F3F4F6',
                        }}
                      >
                        {contact.profile_image_url ? (
                          <img
                            src={contact.profile_image_url}
                            alt=""
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                          }}>
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          }}>
                            {contact.first_name} {contact.last_name}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Selected contact */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? '#374151' : '#F3F4F6',
                  marginBottom: '16px',
                }}>
                  {selectedContact.profile_image_url ? (
                    <img
                      src={selectedContact.profile_image_url}
                      alt=""
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    }}>
                      {selectedContact.first_name?.[0]}{selectedContact.last_name?.[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    }}>
                      {selectedContact.first_name} {selectedContact.last_name}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedContact(null);
                      setContactEmails([]);
                      setSelectedEmailId(null);
                    }}
                    style={{
                      padding: '6px',
                      borderRadius: '4px',
                      border: 'none',
                      background: 'transparent',
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      cursor: 'pointer',
                    }}
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Email selection */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    marginBottom: '6px',
                  }}>
                    Select Email Address
                  </label>
                  {contactEmails.length === 0 ? (
                    <div style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: theme === 'dark' ? '#374151' : '#F3F4F6',
                      color: theme === 'dark' ? '#EF4444' : '#DC2626',
                      fontSize: '13px',
                    }}>
                      This contact has no email addresses
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {contactEmails.map(email => (
                        <div
                          key={email.email_id}
                          onClick={() => setSelectedEmailId(email.email_id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: `2px solid ${selectedEmailId === email.email_id ? '#10B981' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                            background: selectedEmailId === email.email_id
                              ? (theme === 'dark' ? '#064E3B' : '#D1FAE5')
                              : 'transparent',
                          }}
                        >
                          <FaEnvelope size={12} style={{ color: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} />
                          <span style={{
                            flex: 1,
                            fontSize: '13px',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          }}>
                            {email.email}
                          </span>
                          {email.is_primary && (
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: theme === 'dark' ? '#1E3A5F' : '#DBEAFE',
                              color: theme === 'dark' ? '#93C5FD' : '#2563EB',
                            }}>
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setMemberSearchQuery('');
                  setMemberSearchResults([]);
                  setSelectedContact(null);
                  setContactEmails([]);
                  setSelectedEmailId(null);
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: theme === 'dark' ? '#4B5563' : '#E5E7EB',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={addingMember || !selectedContact || !selectedEmailId}
                style={{
                  ...buttonStyle,
                  background: '#10B981',
                  opacity: addingMember || !selectedContact || !selectedEmailId ? 0.7 : 1,
                }}
              >
                {addingMember ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListsTab;
