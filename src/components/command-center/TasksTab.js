import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTasks, FaSave, FaTrash, FaCheck, FaSync, FaExternalLinkAlt,
  FaUser, FaBuilding, FaDollarSign, FaLink, FaCalendarAlt, FaFlag,
  FaList, FaEdit, FaChevronDown, FaChevronRight, FaPlus,
  FaInbox, FaBirthdayCake, FaHome, FaBriefcase, FaTimes, FaSearch
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

/**
 * TasksTab - Task editor following NotesTab UI pattern
 *
 * Features:
 * 1. Dropdown to select task (with "Create New Task" at bottom)
 * 2. Link panel for contact/company/deal associations
 * 3. Task editor with content, description, due date, priority, project
 * 4. Sync with Todoist
 */
const TasksTab = ({
  theme,
  contactId,
  contactName = '',
  contactCompanies = [],
  contactDeals = [],
  onTaskCreated,
}) => {
  // All tasks (from contact, companies, deals)
  const [allTasks, setAllTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // View mode: 'editor' or 'list'
  const [viewMode, setViewMode] = useState('list');
  const [expandedSections, setExpandedSections] = useState({ open: true, completed: false });

  // Selected task
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Associate modal state
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedToAssociate, setSelectedToAssociate] = useState([]);
  const [associateSearch, setAssociateSearch] = useState('');

  // Editor state
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [dueString, setDueString] = useState('');
  const [priority, setPriority] = useState(1);
  const [projectName, setProjectName] = useState('Inbox');
  const [saving, setSaving] = useState(false);

  // Linking state
  const [showLinkPanel, setShowLinkPanel] = useState(true);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [linkedDeals, setLinkedDeals] = useState([]);

  // Contact search modal state
  const [showContactSearchModal, setShowContactSearchModal] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactSearchResults, setContactSearchResults] = useState([]);
  const [contactSearchLoading, setContactSearchLoading] = useState(false);
  const [linkedContactsInfo, setLinkedContactsInfo] = useState([]); // [{contact_id, name}]

  // Fetch all tasks linked to contact, their companies, and their deals
  const fetchAllTasks = useCallback(async () => {
    if (!contactId) return;

    setLoading(true);
    try {
      const taskMap = new Map();

      // 1. Contact tasks
      const { data: contactLinks } = await supabase
        .from('task_contacts')
        .select('task_id')
        .eq('contact_id', contactId);

      if (contactLinks) {
        contactLinks.forEach(l => taskMap.set(l.task_id, { source: 'contact' }));
      }

      // 2. Company tasks
      if (contactCompanies.length > 0) {
        const companyIds = contactCompanies.map(c => c.company_id);
        const { data: companyLinks } = await supabase
          .from('task_companies')
          .select('task_id, company_id')
          .in('company_id', companyIds);

        if (companyLinks) {
          companyLinks.forEach(l => {
            const company = contactCompanies.find(c => c.company_id === l.company_id);
            taskMap.set(l.task_id, { source: 'company', companyName: company?.name });
          });
        }
      }

      // 3. Deal tasks
      if (contactDeals.length > 0) {
        const dealIds = contactDeals.map(d => d.deal_id);
        const { data: dealLinks } = await supabase
          .from('task_deals')
          .select('task_id, deal_id')
          .in('deal_id', dealIds);

        if (dealLinks) {
          dealLinks.forEach(l => {
            const deal = contactDeals.find(d => d.deal_id === l.deal_id);
            taskMap.set(l.task_id, { source: 'deal', dealName: deal?.opportunity });
          });
        }
      }

      // Fetch actual tasks
      const taskIds = Array.from(taskMap.keys());
      if (taskIds.length === 0) {
        setAllTasks([]);
        setCompletedTasks([]);
        setLoading(false);
        return;
      }

      // Fetch open tasks
      const { data: openTasks } = await supabase
        .from('tasks')
        .select('*')
        .in('task_id', taskIds)
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false });

      // Fetch completed tasks
      const { data: closedTasks } = await supabase
        .from('tasks')
        .select('*')
        .in('task_id', taskIds)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);

      // Attach source info
      const openTasksWithSource = (openTasks || []).map(task => ({
        ...task,
        ...taskMap.get(task.task_id)
      }));

      const completedTasksWithSource = (closedTasks || []).map(task => ({
        ...task,
        ...taskMap.get(task.task_id)
      }));

      setAllTasks(openTasksWithSource);
      setCompletedTasks(completedTasksWithSource);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [contactId, contactCompanies, contactDeals]);

  // Initial fetch
  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks]);

  // Load task into editor
  useEffect(() => {
    if (selectedTaskId && !isCreating) {
      const task = allTasks.find(t => t.task_id === selectedTaskId);
      if (task) {
        setContent(task.content || '');
        setDescription(task.description || '');
        setDueString(task.due_string || task.due_date || '');
        setPriority(task.priority || 1);
        setProjectName(task.todoist_project_name || 'Inbox');
        loadTaskLinks(task.task_id);
      }
    }
  }, [selectedTaskId, allTasks, isCreating]);

  // Load task links
  const loadTaskLinks = async (taskId) => {
    try {
      const [contactsRes, companiesRes, dealsRes] = await Promise.all([
        supabase.from('task_contacts').select('contact_id, contacts(first_name, last_name)').eq('task_id', taskId),
        supabase.from('task_companies').select('company_id').eq('task_id', taskId),
        supabase.from('task_deals').select('deal_id').eq('task_id', taskId),
      ]);

      const contactIds = contactsRes.data?.map(r => r.contact_id) || [];
      const contactInfos = contactsRes.data?.map(r => ({
        contact_id: r.contact_id,
        name: r.contacts ? `${r.contacts.first_name || ''} ${r.contacts.last_name || ''}`.trim() : 'Unknown'
      })) || [];

      setLinkedContacts(contactIds);
      setLinkedContactsInfo(contactInfos);
      setLinkedCompanies(companiesRes.data?.map(r => r.company_id) || []);
      setLinkedDeals(dealsRes.data?.map(r => r.deal_id) || []);
    } catch (err) {
      console.error('Error loading task links:', err);
    }
  };

  // Search contacts for linking
  const searchContacts = async (query) => {
    if (!query || query.length < 2) {
      setContactSearchResults([]);
      return;
    }

    setContactSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('contact_id, first_name, last_name')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      // Filter out already linked contacts
      const filtered = (data || []).filter(c => !linkedContacts.includes(c.contact_id));
      setContactSearchResults(filtered);
    } catch (err) {
      console.error('Error searching contacts:', err);
    } finally {
      setContactSearchLoading(false);
    }
  };

  // Add contact to task
  const addContactToTask = async (contact) => {
    const taskId = selectedTaskId;

    if (!taskId) {
      // For new tasks, just update local state
      if (!linkedContacts.includes(contact.contact_id)) {
        setLinkedContacts(prev => [...prev, contact.contact_id]);
        setLinkedContactsInfo(prev => [...prev, {
          contact_id: contact.contact_id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        }]);
      }
    } else {
      // For existing tasks, save to DB
      try {
        await supabase.from('task_contacts').insert({
          task_id: taskId,
          contact_id: contact.contact_id
        });
        setLinkedContacts(prev => [...prev, contact.contact_id]);
        setLinkedContactsInfo(prev => [...prev, {
          contact_id: contact.contact_id,
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
        }]);
        toast.success('Contact linked');
      } catch (err) {
        console.error('Error adding contact:', err);
        toast.error('Failed to link contact');
      }
    }

    // Clear search
    setContactSearchQuery('');
    setContactSearchResults([]);
  };

  // Remove contact from task
  const removeContactFromTask = async (contactIdToRemove) => {
    const taskId = selectedTaskId;

    if (!taskId) {
      // For new tasks, just update local state
      setLinkedContacts(prev => prev.filter(id => id !== contactIdToRemove));
      setLinkedContactsInfo(prev => prev.filter(c => c.contact_id !== contactIdToRemove));
    } else {
      // For existing tasks, delete from DB
      try {
        await supabase.from('task_contacts').delete()
          .eq('task_id', taskId)
          .eq('contact_id', contactIdToRemove);
        setLinkedContacts(prev => prev.filter(id => id !== contactIdToRemove));
        setLinkedContactsInfo(prev => prev.filter(c => c.contact_id !== contactIdToRemove));
        toast.success('Contact unlinked');
      } catch (err) {
        console.error('Error removing contact:', err);
        toast.error('Failed to unlink contact');
      }
    }
  };

  // Save task
  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('Task content is required');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        content: content.trim(),
        description: description.trim() || null,
        due_string: dueString || null,
        priority: priority,
        todoist_project_name: projectName,
        updated_at: new Date().toISOString(),
      };

      // Parse due_string to due_date if it looks like a date
      if (dueString) {
        const dateMatch = dueString.match(/^\d{4}-\d{2}-\d{2}$/);
        if (dateMatch) {
          taskData.due_date = dueString;
        }
      }

      let taskId = selectedTaskId;

      if (isCreating) {
        // Create new task
        const { data: newTask, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            status: 'open',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        taskId = newTask.task_id;

        // Link to contact by default
        if (contactId && linkedContacts.includes(contactId)) {
          await supabase.from('task_contacts').insert({
            task_id: taskId,
            contact_id: contactId,
          });
        }

        // Link to companies
        for (const companyId of linkedCompanies) {
          await supabase.from('task_companies').insert({
            task_id: taskId,
            company_id: companyId,
          });
        }

        // Link to deals
        for (const dealId of linkedDeals) {
          await supabase.from('task_deals').insert({
            task_id: taskId,
            deal_id: dealId,
          });
        }

        toast.success('Task created');
        setSelectedTaskId(taskId);
        setIsCreating(false);
      } else {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('task_id', selectedTaskId);

        if (error) throw error;

        // Sync to Todoist if has todoist_id
        const task = allTasks.find(t => t.task_id === selectedTaskId);
        if (task?.todoist_id) {
          try {
            await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: taskData.content,
                description: taskData.description,
                due_string: taskData.due_string,
                priority: taskData.priority,
              }),
            });
          } catch (syncErr) {
            console.warn('Failed to sync to Todoist:', syncErr);
          }
        }

        toast.success('Task saved');
      }

      fetchAllTasks();
      onTaskCreated?.();
    } catch (err) {
      console.error('Error saving task:', err);
      toast.error('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  // Complete task (accepts optional taskId for list view, defaults to selectedTaskId)
  const handleComplete = async (taskId = null) => {
    const idToComplete = taskId || selectedTaskId;
    if (!idToComplete) return;

    try {
      const task = allTasks.find(t => t.task_id === idToComplete);

      // Update in Supabase
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('task_id', idToComplete);

      // Sync to Todoist
      if (task?.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}/close`, {
            method: 'POST',
          });
        } catch (syncErr) {
          console.warn('Failed to sync completion to Todoist:', syncErr);
        }
      }

      toast.success('Task completed!');

      // Only reset editor if completing the currently selected task
      if (idToComplete === selectedTaskId) {
        setSelectedTaskId(null);
        setContent('');
        setDescription('');
      }

      fetchAllTasks();
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task');
    }
  };

  // Delete task
  const handleDelete = async () => {
    if (!selectedTaskId || !window.confirm('Delete this task?')) return;

    try {
      const task = allTasks.find(t => t.task_id === selectedTaskId);

      // Delete from Supabase (cascade handles junction tables)
      await supabase.from('tasks').delete().eq('task_id', selectedTaskId);

      // Sync to Todoist
      if (task?.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}`, {
            method: 'DELETE',
          });
        } catch (syncErr) {
          console.warn('Failed to sync deletion to Todoist:', syncErr);
        }
      }

      toast.success('Task deleted');
      setSelectedTaskId(null);
      setContent('');
      setDescription('');
      fetchAllTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Failed to delete task');
    }
  };

  // Sync from Todoist
  const handleSyncFromTodoist = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks`);
      if (!response.ok) throw new Error('Failed to fetch from Todoist');

      const { tasks: todoistTasks } = await response.json();

      // Upsert tasks into Supabase
      for (const tt of todoistTasks) {
        const { data: existing } = await supabase
          .from('tasks')
          .select('task_id, updated_at, synced_at')
          .eq('todoist_id', tt.id)
          .single();

        const taskData = {
          todoist_id: tt.id,
          content: tt.content,
          description: tt.description || null,
          due_date: tt.due?.date || null,
          due_datetime: tt.due?.datetime || null,
          due_string: tt.due?.string || null,
          priority: tt.priority || 1,
          status: tt.is_completed ? 'completed' : 'open',
          todoist_project_id: tt.project_id,
          todoist_url: tt.url,
          synced_at: new Date().toISOString(),
        };

        if (existing) {
          const supabaseUpdated = new Date(existing.updated_at);
          const lastSync = existing.synced_at ? new Date(existing.synced_at) : new Date(0);

          if (supabaseUpdated <= lastSync) {
            await supabase
              .from('tasks')
              .update(taskData)
              .eq('task_id', existing.task_id);
          }
        } else {
          await supabase
            .from('tasks')
            .insert({
              ...taskData,
              created_at: new Date().toISOString(),
            });
        }
      }

      // === ORPHAN DETECTION ===
      // Find tasks in Supabase that are "open" but weren't returned by Todoist
      const syncedTodoistIds = todoistTasks.map(tt => tt.id);

      const { data: orphanTasks } = await supabase
        .from('tasks')
        .select('task_id, todoist_id, content')
        .eq('status', 'open')
        .not('todoist_id', 'is', null);

      const orphans = (orphanTasks || []).filter(t => !syncedTodoistIds.includes(t.todoist_id));

      if (orphans.length > 0) {
        console.log(`[Sync] Found ${orphans.length} orphan tasks to check`);

        for (const orphan of orphans) {
          try {
            const orphanResponse = await fetch(`${BACKEND_URL}/todoist/tasks/${orphan.todoist_id}`);

            if (orphanResponse.status === 404) {
              console.log(`[Sync] Task "${orphan.content}" deleted in Todoist, marking completed`);
              await supabase
                .from('tasks')
                .update({
                  status: 'completed',
                  completed_at: new Date().toISOString(),
                  synced_at: new Date().toISOString()
                })
                .eq('task_id', orphan.task_id);
            } else if (orphanResponse.ok) {
              const { task: todoistTask } = await orphanResponse.json();
              console.log(`[Sync] Updating orphan task "${orphan.content}" - completed: ${todoistTask.is_completed}`);
              await supabase
                .from('tasks')
                .update({
                  content: todoistTask.content,
                  description: todoistTask.description || null,
                  due_date: todoistTask.due?.date || null,
                  due_datetime: todoistTask.due?.datetime || null,
                  due_string: todoistTask.due?.string || null,
                  priority: todoistTask.priority || 1,
                  status: todoistTask.is_completed ? 'completed' : 'open',
                  completed_at: todoistTask.is_completed ? new Date().toISOString() : null,
                  synced_at: new Date().toISOString(),
                })
                .eq('task_id', orphan.task_id);
            }
          } catch (err) {
            console.error(`[Sync] Error checking orphan task ${orphan.todoist_id}:`, err);
          }
        }
      }

      toast.success(`Synced from Todoist${orphans.length > 0 ? ` (${orphans.length} orphans resolved)` : ''}`);
      fetchAllTasks();
    } catch (err) {
      console.error('Error syncing from Todoist:', err);
      toast.error('Failed to sync from Todoist');
    } finally {
      setSyncing(false);
    }
  };

  // Toggle link
  const toggleLink = async (type, id) => {
    if (!selectedTaskId && !isCreating) return;

    const taskId = selectedTaskId;
    if (!taskId) {
      // For new tasks, just update local state
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
      const table = type === 'contact' ? 'task_contacts' : type === 'company' ? 'task_companies' : 'task_deals';
      const idField = type === 'contact' ? 'contact_id' : type === 'company' ? 'company_id' : 'deal_id';
      const linkedArray = type === 'contact' ? linkedContacts : type === 'company' ? linkedCompanies : linkedDeals;
      const setLinked = type === 'contact' ? setLinkedContacts : type === 'company' ? setLinkedCompanies : setLinkedDeals;

      if (linkedArray.includes(id)) {
        // Remove link
        await supabase.from(table).delete().eq('task_id', taskId).eq(idField, id);
        setLinked(prev => prev.filter(x => x !== id));
        toast.success('Link removed');
      } else {
        // Add link
        await supabase.from(table).insert({ task_id: taskId, [idField]: id });
        setLinked(prev => [...prev, id]);
        toast.success('Link added');
      }
    } catch (err) {
      console.error('Error toggling link:', err);
      toast.error('Failed to update link');
    }
  };

  // Open in Todoist
  const openInTodoist = () => {
    const task = allTasks.find(t => t.task_id === selectedTaskId);
    if (task?.todoist_url) {
      window.open(task.todoist_url, '_blank');
    }
  };

  // Fetch tasks not already linked to this contact (for associate modal)
  const fetchAvailableTasks = async () => {
    if (!contactId) return;

    setLoadingAvailable(true);
    try {
      // Get task IDs already linked to this contact
      const { data: linkedTasks } = await supabase
        .from('task_contacts')
        .select('task_id')
        .eq('contact_id', contactId);

      const linkedIds = linkedTasks?.map(t => t.task_id) || [];

      // Fetch all open tasks not linked to this contact
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (linkedIds.length > 0) {
        query = query.not('task_id', 'in', `(${linkedIds.join(',')})`);
      }

      const { data: tasks } = await query;
      setAvailableTasks(tasks || []);
      setSelectedToAssociate([]);
    } catch (err) {
      console.error('Error fetching available tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoadingAvailable(false);
    }
  };

  // Open associate modal
  const openAssociateModal = () => {
    setShowAssociateModal(true);
    setAssociateSearch('');
    fetchAvailableTasks();
  };

  // Filter available tasks by search
  const filteredAvailableTasks = availableTasks.filter(task => {
    if (!associateSearch.trim()) return true;
    const search = associateSearch.toLowerCase();
    return (
      task.content?.toLowerCase().includes(search) ||
      task.description?.toLowerCase().includes(search) ||
      task.todoist_project_name?.toLowerCase().includes(search) ||
      task.due_string?.toLowerCase().includes(search)
    );
  });

  // Toggle task selection for association
  const toggleTaskSelection = (taskId) => {
    setSelectedToAssociate(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Associate selected tasks with contact
  const handleAssociateTasks = async () => {
    if (selectedToAssociate.length === 0) {
      toast.error('No tasks selected');
      return;
    }

    try {
      // Insert links for all selected tasks
      const links = selectedToAssociate.map(taskId => ({
        task_id: taskId,
        contact_id: contactId,
      }));

      const { error } = await supabase
        .from('task_contacts')
        .insert(links);

      if (error) throw error;

      toast.success(`${selectedToAssociate.length} task(s) associated`);
      setShowAssociateModal(false);
      setSelectedToAssociate([]);
      fetchAllTasks();
    } catch (err) {
      console.error('Error associating tasks:', err);
      toast.error('Failed to associate tasks');
    }
  };

  const selectedTask = allTasks.find(t => t.task_id === selectedTaskId);
  const hasContent = selectedTaskId || isCreating;

  // Get priority color
  const getPriorityColor = (p) => {
    switch (p) {
      case 4: return '#dc3545';
      case 3: return '#fd7e14';
      case 2: return '#ffc107';
      default: return '#6c757d';
    }
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
    background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
    color: theme === 'dark' ? '#F9FAFB' : '#111827',
    fontSize: '13px',
  };

  return (
    <div style={containerStyle}>
      {/* Header: Actions - only show in editor mode */}
      {viewMode === 'editor' && hasContent && (
      <div style={{ padding: '12px', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}` }}>
        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              ...buttonStyle,
              background: theme === 'dark' ? '#374151' : '#E5E7EB',
              color: theme === 'dark' ? '#D1D5DB' : '#374151',
            }}
            title="Back to List"
          >
            <FaList size={11} />
            List
          </button>

          <button
            onClick={() => setShowLinkPanel(!showLinkPanel)}
                style={{
                  ...buttonStyle,
                  background: showLinkPanel
                    ? '#10B981'
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
                <>
                  <button
                    onClick={handleComplete}
                    style={{
                      ...buttonStyle,
                      background: '#3B82F6',
                      color: '#FFFFFF',
                    }}
                    title="Complete"
                  >
                    <FaCheck size={11} />
                  </button>

                  {selectedTask?.todoist_url && (
                    <button
                      onClick={openInTodoist}
                      style={{
                        ...buttonStyle,
                        background: theme === 'dark' ? '#374151' : '#E5E7EB',
                        color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      }}
                      title="Open in Todoist"
                    >
                      <FaExternalLinkAlt size={11} />
                    </button>
                  )}

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
                </>
              )}
        </div>
      </div>
      )}

      {/* Link Panel (collapsible) - only in editor mode */}
      {viewMode === 'editor' && hasContent && showLinkPanel && (
        <div style={{
          padding: '12px',
          borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
          background: theme === 'dark' ? '#111827' : '#F3F4F6',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            marginBottom: '10px',
            textTransform: 'uppercase',
          }}>
            Link Task To
          </div>

          {/* Contacts */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              fontSize: '10px',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}>
              <FaUser size={9} /> Contacts ({linkedContacts.length})
            </div>

            {/* Linked contacts as chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {linkedContactsInfo.map(contact => (
                <div
                  key={contact.contact_id}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    background: theme === 'dark' ? '#064E3B' : '#D1FAE5',
                    border: '1px solid #10B981',
                    color: '#10B981',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <FaCheck size={8} />
                  {contact.name || 'Unknown'}
                  <button
                    onClick={() => removeContactFromTask(contact.contact_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#10B981',
                      cursor: 'pointer',
                      padding: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <FaTimes size={9} />
                  </button>
                </div>
              ))}
            </div>

            {/* Search input for adding contacts */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={contactSearchQuery}
                onChange={(e) => {
                  setContactSearchQuery(e.target.value);
                  searchContacts(e.target.value);
                }}
                placeholder="Search contacts to add..."
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  paddingRight: '30px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '11px',
                  boxSizing: 'border-box',
                }}
              />
              <FaSearch
                size={10}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                }}
              />
            </div>

            {/* Search results dropdown */}
            {contactSearchResults.length > 0 && (
              <div style={{
                marginTop: '4px',
                background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                borderRadius: '6px',
                maxHeight: '150px',
                overflowY: 'auto',
              }}>
                {contactSearchResults.map(contact => (
                  <div
                    key={contact.contact_id}
                    onClick={() => addContactToTask(contact)}
                    style={{
                      padding: '8px 10px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                      borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    }}
                    onMouseEnter={(e) => e.target.style.background = theme === 'dark' ? '#374151' : '#F3F4F6'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <FaPlus size={9} style={{ marginRight: '6px' }} />
                    {contact.first_name} {contact.last_name}
                  </div>
                ))}
              </div>
            )}

            {contactSearchLoading && (
              <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginTop: '4px' }}>
                Searching...
              </div>
            )}
          </div>

          {/* Companies */}
          {contactCompanies.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {contactCompanies.map(company => (
                  <button
                    key={company.company_id}
                    onClick={() => toggleLink('company', company.company_id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${linkedCompanies.includes(company.company_id) ? '#10B981' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                      background: linkedCompanies.includes(company.company_id)
                        ? (theme === 'dark' ? '#064E3B' : '#D1FAE5')
                        : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                      color: linkedCompanies.includes(company.company_id)
                        ? '#10B981'
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
            </div>
          )}

          {/* Deals */}
          {contactDeals.length > 0 && (
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
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {contactDeals.map(deal => (
                  <button
                    key={deal.deal_id}
                    onClick={() => toggleLink('deal', deal.deal_id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${linkedDeals.includes(deal.deal_id) ? '#10B981' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                      background: linkedDeals.includes(deal.deal_id)
                        ? (theme === 'dark' ? '#064E3B' : '#D1FAE5')
                        : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                      color: linkedDeals.includes(deal.deal_id)
                        ? '#10B981'
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
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
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
        ) : viewMode === 'list' ? (
          /* LIST VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Open Tasks Section */}
            <div>
              <div
                onClick={() => setExpandedSections(prev => ({ ...prev, open: !prev.open }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: expandedSections.open ? '8px' : '0',
                }}
              >
                {expandedSections.open ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                <span style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                }}>
                  Open
                </span>
                <span style={{
                  fontSize: '12px',
                  color: '#10B981',
                  fontWeight: 600,
                  marginLeft: 'auto',
                }}>
                  {allTasks.length}
                </span>
              </div>

              {expandedSections.open && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {allTasks.length === 0 && (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      fontSize: '13px',
                    }}>
                      No open tasks
                    </div>
                  )}
                  {allTasks.map(task => (
                      <div
                        key={task.task_id}
                        onClick={() => {
                          setSelectedTaskId(task.task_id);
                          setIsCreating(false);
                          setViewMode('editor');
                        }}
                        style={{
                          padding: '10px 12px',
                          background: theme === 'dark' ? '#374151' : '#FFFFFF',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handleComplete(task.task_id);
                          }}
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${getPriorityColor(task.priority)}`,
                            flexShrink: 0,
                            cursor: 'pointer',
                            marginTop: '2px',
                          }}
                          title="Complete task"
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 500,
                            fontSize: '13px',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {task.content}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            marginTop: '4px',
                            flexWrap: 'wrap',
                          }}>
                            {task.due_string && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: task.due_date && new Date(task.due_date) < new Date()
                                  ? '#FEE2E2'
                                  : (theme === 'dark' ? '#1F2937' : '#F3F4F6'),
                                color: task.due_date && new Date(task.due_date) < new Date()
                                  ? '#DC2626'
                                  : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                              }}>
                                {task.due_string}
                              </span>
                            )}
                            {task.todoist_project_name && (
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                              }}>
                                {task.todoist_project_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Add Task Button */}
                    <div
                      onClick={() => {
                        setSelectedTaskId(null);
                        setIsCreating(true);
                        setViewMode('editor');
                        setContent('');
                        setDescription('');
                        setDueString('');
                        setPriority(4);
                        setLinkedContacts(contactId ? [contactId] : []);
                        setLinkedContactsInfo(contactId ? [{ contact_id: contactId, name: contactName || 'Current Contact' }] : []);
                        setLinkedCompanies([]);
                        setLinkedDeals([]);
                      }}
                      style={{
                        padding: '10px 12px',
                        background: 'transparent',
                        borderRadius: '8px',
                        border: `1px dashed ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        fontSize: '12px',
                      }}
                    >
                      <FaPlus size={10} />
                      Add Task
                    </div>
                    {/* Associate Button */}
                    <div
                      onClick={openAssociateModal}
                      style={{
                        padding: '10px 12px',
                        background: 'transparent',
                        borderRadius: '8px',
                        border: `1px dashed ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        fontSize: '12px',
                      }}
                    >
                      <FaLink size={10} />
                      Associate Existing Task
                    </div>
                </div>
              )}
            </div>

            {/* Completed Tasks Section */}
            <div style={{ marginTop: '8px' }}>
              <div
                onClick={() => setExpandedSections(prev => ({ ...prev, completed: !prev.completed }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: expandedSections.completed ? '8px' : '0',
                }}
              >
                {expandedSections.completed ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                <span style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                }}>
                  Completed
                </span>
                <span style={{
                  fontSize: '12px',
                  color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                  fontWeight: 600,
                  marginLeft: 'auto',
                }}>
                  {completedTasks.length}
                </span>
              </div>

              {expandedSections.completed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {completedTasks.length === 0 ? (
                    <div style={{
                      padding: '16px',
                      textAlign: 'center',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      fontSize: '13px',
                    }}>
                      No completed tasks
                    </div>
                  ) : (
                    completedTasks.map(task => (
                      <div
                        key={task.task_id}
                        onClick={() => {
                          setSelectedTaskId(task.task_id);
                          setIsCreating(false);
                          setViewMode('editor');
                        }}
                        style={{
                          padding: '10px 12px',
                          background: theme === 'dark' ? '#374151' : '#FFFFFF',
                          borderRadius: '8px',
                          border: `1px solid ${theme === 'dark' ? '#4B5563' : '#E5E7EB'}`,
                          cursor: 'pointer',
                          opacity: 0.7,
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}>
                          <FaCheck size={12} style={{ color: '#10B981', flexShrink: 0 }} />
                          <div style={{
                            fontWeight: 500,
                            fontSize: '13px',
                            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            textDecoration: 'line-through',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {task.content}
                          </div>
                        </div>
                        {task.completed_at && (
                          <div style={{
                            fontSize: '11px',
                            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                            marginTop: '4px',
                            marginLeft: '22px',
                          }}>
                            Completed {new Date(task.completed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : !hasContent ? (
          /* EDITOR VIEW - No task selected */
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            textAlign: 'center',
          }}>
            <FaTasks size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              {allTasks.length === 0 ? 'No tasks yet' : 'Select a task'}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {allTasks.length === 0
                ? 'Create your first task from the dropdown above'
                : 'Choose a task from the dropdown or create a new one'
              }
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Task Content (Title) */}
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Task content..."
              style={{
                ...inputStyle,
                fontSize: '16px',
                fontWeight: 600,
              }}
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={4}
              style={{
                ...inputStyle,
                resize: 'vertical',
                minHeight: '80px',
              }}
            />

            {/* Due Date */}
            <div>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <FaCalendarAlt size={10} /> Due Date
              </label>
              <input
                type="text"
                value={dueString}
                onChange={(e) => setDueString(e.target.value)}
                placeholder="e.g., tomorrow, next monday, 2024-12-31"
                style={inputStyle}
              />
              {/* Quick Date Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                {[
                  { label: 'This Week', value: 'friday' },
                  { label: 'This Month', value: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-20`; })() },
                  { label: 'This Sprint', value: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-15`; })() },
                  { label: 'Someday', value: '' },
                ].map(opt => (
                  <button
                    key={opt.label}
                    onClick={() => setDueString(opt.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${dueString === opt.value ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                      background: dueString === opt.value
                        ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                        : (theme === 'dark' ? '#1F2937' : '#F9FAFB'),
                      color: dueString === opt.value
                        ? '#3B82F6'
                        : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                      fontSize: '10px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <FaFlag size={10} /> Priority
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4].map(p => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: priority === p
                        ? `2px solid ${getPriorityColor(p)}`
                        : `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: priority === p
                        ? `${getPriorityColor(p)}20`
                        : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                      color: priority === p
                        ? getPriorityColor(p)
                        : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    P{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Project */}
            <div>
              <label style={{
                fontSize: '11px',
                fontWeight: 600,
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                marginBottom: '6px',
                display: 'block',
              }}>
                Project
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { name: 'Inbox', icon: FaInbox },
                  { name: 'Birthday', icon: FaBirthdayCake },
                  { name: 'Personal', icon: FaHome },
                  { name: 'Work', icon: FaBriefcase },
                ].map(proj => {
                  const Icon = proj.icon;
                  const isSelected = projectName === proj.name;
                  return (
                    <button
                      key={proj.name}
                      onClick={() => setProjectName(proj.name)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${isSelected ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                        background: isSelected
                          ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                          : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                        color: isSelected
                          ? '#3B82F6'
                          : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                        fontSize: '11px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Icon size={12} />
                      {proj.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Todoist Info (if linked) */}
            {selectedTask?.todoist_id && (
              <div style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                fontSize: '11px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              }}>
                <span style={{ fontWeight: 600 }}>Todoist ID:</span> {selectedTask.todoist_id}
                {selectedTask.synced_at && (
                  <span style={{ marginLeft: '12px' }}>
                    <span style={{ fontWeight: 600 }}>Last synced:</span> {new Date(selectedTask.synced_at).toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Associate Task Modal */}
      {showAssociateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: '12px',
            width: '500px',
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  }}>
                    Associate Tasks
                  </h3>
                  <p style={{
                    margin: '4px 0 0 0',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  }}>
                    Select tasks to link with this contact
                  </p>
                </div>
                <button
                  onClick={() => setShowAssociateModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  ×
                </button>
              </div>
              {/* Search Input */}
              <input
                type="text"
                value={associateSearch}
                onChange={(e) => setAssociateSearch(e.target.value)}
                placeholder="Search tasks..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                  background: theme === 'dark' ? '#374151' : '#FFFFFF',
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '12px 20px',
            }}>
              {loadingAvailable ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  Loading tasks...
                </div>
              ) : availableTasks.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  No available tasks to associate
                </div>
              ) : filteredAvailableTasks.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  No tasks match "{associateSearch}"
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredAvailableTasks.map(task => (
                    <div
                      key={task.task_id}
                      onClick={() => toggleTaskSelection(task.task_id)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: `2px solid ${selectedToAssociate.includes(task.task_id) ? '#10B981' : (theme === 'dark' ? '#374151' : '#E5E7EB')}`,
                        background: selectedToAssociate.includes(task.task_id)
                          ? (theme === 'dark' ? '#064E3B' : '#D1FAE5')
                          : (theme === 'dark' ? '#374151' : '#F9FAFB'),
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '4px',
                        border: `2px solid ${selectedToAssociate.includes(task.task_id) ? '#10B981' : (theme === 'dark' ? '#6B7280' : '#D1D5DB')}`,
                        background: selectedToAssociate.includes(task.task_id) ? '#10B981' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}>
                        {selectedToAssociate.includes(task.task_id) && (
                          <FaCheck size={10} style={{ color: '#FFFFFF' }} />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: 500,
                          fontSize: '13px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          {task.content}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '6px',
                          flexWrap: 'wrap',
                        }}>
                          {task.due_string && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            }}>
                              {task.due_string}
                            </span>
                          )}
                          {task.todoist_project_name && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                              color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            }}>
                              {task.todoist_project_name}
                            </span>
                          )}
                          <span style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: `${getPriorityColor(task.priority)}20`,
                            color: getPriorityColor(task.priority),
                          }}>
                            P{task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 20px',
              borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontSize: '12px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              }}>
                {selectedToAssociate.length} selected
                {associateSearch && ` · ${filteredAvailableTasks.length} of ${availableTasks.length} shown`}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAssociateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                    background: 'transparent',
                    color: theme === 'dark' ? '#D1D5DB' : '#374151',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssociateTasks}
                  disabled={selectedToAssociate.length === 0}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    background: selectedToAssociate.length > 0 ? '#10B981' : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                    color: selectedToAssociate.length > 0 ? '#FFFFFF' : (theme === 'dark' ? '#6B7280' : '#9CA3AF'),
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: selectedToAssociate.length > 0 ? 'pointer' : 'not-allowed',
                  }}
                >
                  Associate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksTab;
