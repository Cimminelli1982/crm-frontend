import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTasks, FaPlus, FaSearch, FaFolder, FaSave, FaTrash, FaCheck,
  FaLink, FaUser, FaBuilding, FaDollarSign, FaSync, FaExternalLinkAlt,
  FaChevronRight, FaChevronDown, FaCalendarAlt, FaFlag, FaFilter,
  FaClock, FaCheckCircle, FaCircle, FaInbox, FaBirthdayCake, FaHome, FaBriefcase,
  FaExclamationTriangle
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

// Project options for filtering
const PROJECTS = [
  { id: 'all', label: 'All Projects', color: '#6B7280' },
  { id: 'Inbox', label: 'Inbox', color: '#808080' },
  { id: 'Work', label: 'Work', color: '#4073ff' },
  { id: 'Personal', label: 'Personal', color: '#b8255f' },
  { id: 'Birthdays 🎂', label: 'Birthdays', color: '#db4035' },
];

// Status sections
const STATUS_SECTIONS = [
  { id: 'open', label: 'Open', icon: FaCircle, color: '#10B981' },
  { id: 'completed', label: 'Completed', icon: FaCheckCircle, color: '#6B7280' },
];

// Date categorization helpers
const getQuarterEndMonth = (date) => {
  const month = date.getMonth();
  if (month < 3) return 2; // Q1: Jan-Mar, ends in March (index 2)
  if (month < 6) return 5; // Q2: Apr-Jun, ends in June (index 5)
  if (month < 9) return 8; // Q3: Jul-Sep, ends in September (index 8)
  return 11; // Q4: Oct-Dec, ends in December (index 11)
};

const isThisWeek = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  // Start of week (Monday)
  const startOfWeek = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Adjust for Monday start
  startOfWeek.setDate(now.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  // End of week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return date >= startOfWeek && date < endOfWeek;
};

const isThisMonth = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  // Same month and year, but NOT this week
  return date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear() &&
         !isThisWeek(dateStr);
};

const isThisSprint = (dateStr) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();

  // Not this week and not this month
  if (isThisWeek(dateStr) || isThisMonth(dateStr)) return false;

  // Check if in current quarter
  const quarterEndMonth = getQuarterEndMonth(now);
  const quarterEndDate = new Date(now.getFullYear(), quarterEndMonth + 1, 0); // Last day of quarter

  // Must be after this month but within the quarter
  const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return date > endOfThisMonth && date <= quarterEndDate;
};

const isSomeday = (task) => {
  // No due date OR due date beyond current quarter
  if (!task.due_date) return true;

  const date = new Date(task.due_date);
  const now = new Date();
  const quarterEndMonth = getQuarterEndMonth(now);
  const quarterEndDate = new Date(now.getFullYear(), quarterEndMonth + 1, 0);

  return date > quarterEndDate;
};

// Task Item Component
const TaskItem = ({ task, theme, selectedTask, loadTask, handleComplete, getPriorityColor, onDragStart, onInlineEdit, editingTaskId }) => {
  const [localName, setLocalName] = React.useState(task.content);
  const inputRef = React.useRef(null);
  const isEditing = editingTaskId === task.task_id;

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setLocalName(task.content);
  }, [task.content]);

  const handleSaveInline = () => {
    if (localName.trim() && localName.trim() !== task.content) {
      onInlineEdit(task, localName.trim());
    } else {
      onInlineEdit(null); // Exit edit mode even if no change
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInline();
    } else if (e.key === 'Escape') {
      setLocalName(task.content);
      onInlineEdit(null); // Cancel editing
    }
  };

  return (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, task)}
    onClick={() => loadTask(task)}
    style={{
      padding: '8px 10px',
      borderRadius: '6px',
      background: selectedTask?.task_id === task.task_id
        ? (theme === 'dark' ? '#374151' : '#E5E7EB')
        : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
      border: `1px solid ${selectedTask?.task_id === task.task_id
        ? '#3B82F6'
        : (theme === 'dark' ? '#374151' : '#E5E7EB')}`,
      cursor: 'grab',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}
  >
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleComplete(task.task_id);
      }}
      style={{
        width: '14px',
        height: '14px',
        borderRadius: '50%',
        border: `2px solid ${getPriorityColor(task.priority)}`,
        flexShrink: 0,
        marginTop: '2px',
        cursor: 'pointer',
      }}
      title="Complete task"
    />
    <div style={{ flex: 1, minWidth: 0 }}>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleSaveInline}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            padding: '2px 4px',
            borderRadius: '4px',
            border: `1px solid #3B82F6`,
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            fontSize: '12px',
            fontWeight: 500,
            outline: 'none',
          }}
        />
      ) : (
        <div
          onDoubleClick={(e) => {
            e.stopPropagation();
            onInlineEdit(task);
          }}
          style={{
            fontWeight: 500,
            fontSize: '12px',
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'text',
          }}
          title="Double-click to edit"
        >
          {task.content}
        </div>
      )}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginTop: '3px',
        flexWrap: 'wrap',
      }}>
        {task.due_string && (
          <span style={{
            fontSize: '9px',
            padding: '1px 4px',
            borderRadius: '3px',
            background: task.due_date && new Date(task.due_date) < new Date()
              ? '#FEE2E2'
              : (theme === 'dark' ? '#374151' : '#F3F4F6'),
            color: task.due_date && new Date(task.due_date) < new Date()
              ? '#DC2626'
              : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
          }}>
            {task.due_string}
          </span>
        )}
        {task.todoist_project_name && task.todoist_project_name !== 'Inbox' && (
          <span style={{
            fontSize: '9px',
            padding: '1px 4px',
            borderRadius: '3px',
            background: theme === 'dark' ? '#374151' : '#F3F4F6',
            color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
          }}>
            {task.todoist_project_name}
          </span>
        )}
      </div>
    </div>
  </div>
  );
};

const TasksFullTab = ({ theme, onLinkedContactsChange }) => {
  // Tasks list state
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('Inbox');
  const [expandedSections, setExpandedSections] = useState({
    open: true,
    thisWeek: true,
    thisMonth: true,
    thisSprint: true,
    someday: false,
    completed: false
  });

  // Selected task state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueString, setEditDueString] = useState('');
  const [editPriority, setEditPriority] = useState(1);
  const [editProjectName, setEditProjectName] = useState('Inbox');
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [todoistCount, setTodoistCount] = useState(null);

  // New task state
  const [isCreating, setIsCreating] = useState(false);

  // Inline editing state
  const [editingTaskId, setEditingTaskId] = useState(null);

  // Linked entities state
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [linkedCompanies, setLinkedCompanies] = useState([]);
  const [linkedDeals, setLinkedDeals] = useState([]);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState([]);
  const [linkSearching, setLinkSearching] = useState(false);

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch open tasks
      const { data: openTasks, error: openError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_contacts(contact:contacts(contact_id, first_name, last_name, profile_image_url, show_missing)),
          task_companies(company:companies(company_id, name)),
          task_deals(deal:deals(deal_id, opportunity))
        `)
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (openError) throw openError;

      // Fetch completed tasks (limit to 100)
      const { data: closedTasks, error: closedError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_contacts(contact:contacts(contact_id, first_name, last_name, profile_image_url, show_missing)),
          task_companies(company:companies(company_id, name)),
          task_deals(deal:deals(deal_id, opportunity))
        `)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(100);

      if (closedError) throw closedError;

      setTasks(openTasks || []);
      setCompletedTasks(closedTasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Fetch Todoist task count to compare with Supabase
  const fetchTodoistCount = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/todoist/tasks`);
      if (res.ok) {
        const { tasks: todoistTasks } = await res.json();
        setTodoistCount(todoistTasks?.length || 0);
      }
    } catch (e) {
      console.warn('Failed to fetch Todoist count:', e);
    }
  }, []);

  useEffect(() => {
    fetchTodoistCount();
  }, [fetchTodoistCount]);

  // Calculate Supabase open task count
  const supabaseOpenCount = tasks.filter(t => t.status === 'open').length;
  const syncMismatch = todoistCount !== null && todoistCount !== supabaseOpenCount;

  // Notify parent when linkedContacts changes (for shared right panel)
  useEffect(() => {
    onLinkedContactsChange?.(linkedContacts);
  }, [linkedContacts, onLinkedContactsChange]);

  // Load task into editor
  const loadTask = useCallback((task) => {
    setSelectedTask(task);
    setEditContent(task.content || '');
    setEditDescription(task.description || '');
    setEditDueString(task.due_string || task.due_date || '');
    setEditPriority(task.priority || 1);
    setEditProjectName(task.todoist_project_name || 'Inbox');
    setIsEditing(true);
    setIsCreating(false);

    // Set linked entities
    setLinkedContacts(task.task_contacts?.map(tc => tc.contact).filter(Boolean) || []);
    setLinkedCompanies(task.task_companies?.map(tc => tc.company).filter(Boolean) || []);
    setLinkedDeals(task.task_deals?.map(td => td.deal).filter(Boolean) || []);
  }, []);

  // Start new task
  const startNewTask = () => {
    setSelectedTask(null);
    setEditContent('');
    setEditDescription('');
    setEditDueString('');
    setEditPriority(1);
    setEditProjectName('Inbox');
    setIsEditing(true);
    setIsCreating(true);
    setLinkedContacts([]);
    setLinkedCompanies([]);
    setLinkedDeals([]);
  };

  // Save task
  const handleSave = async () => {
    if (!editContent.trim()) {
      toast.error('Task content is required');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        content: editContent.trim(),
        description: editDescription.trim() || null,
        due_string: editDueString || null,
        priority: editPriority,
        todoist_project_name: editProjectName,
        updated_at: new Date().toISOString(),
      };

      // Parse due_string to due_date if it looks like a date
      if (editDueString && /^\d{4}-\d{2}-\d{2}$/.test(editDueString)) {
        taskData.due_date = editDueString;
      }

      let savedTask;

      if (isCreating) {
        // First create in Todoist to get todoist_id
        let todoistId = null;
        let todoistUrl = null;
        let todoistProjectId = null;

        // Get project_id from project name
        let targetProjectId = null;
        if (editProjectName) {
          try {
            const projectsRes = await fetch(`${BACKEND_URL}/todoist/projects`);
            if (projectsRes.ok) {
              const { projects } = await projectsRes.json();
              const proj = projects.find(p => p.name === editProjectName);
              if (proj) targetProjectId = proj.id;
            }
          } catch (e) {
            console.warn('Failed to fetch projects:', e);
          }
        }

        const todoistPayload = {
          content: taskData.content,
          description: taskData.description,
          due_string: taskData.due_string,
          priority: taskData.priority,
        };
        if (targetProjectId) {
          todoistPayload.project_id = targetProjectId;
        }

        const todoistResponse = await fetch(`${BACKEND_URL}/todoist/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todoistPayload),
        });

        if (todoistResponse.ok) {
          const todoistTask = await todoistResponse.json();
          todoistId = todoistTask.task?.id || todoistTask.id;
          todoistUrl = todoistTask.task?.url || todoistTask.url;
          todoistProjectId = todoistTask.task?.project_id || todoistTask.project_id;
        } else {
          const errText = await todoistResponse.text();
          console.error('Todoist create failed:', errText);
          toast.error('Failed to create in Todoist');
          setSaving(false);
          return; // Don't create orphan task in Supabase
        }

        // Then save to Supabase with todoist_id
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            status: 'open',
            todoist_id: todoistId,
            todoist_url: todoistUrl,
            todoist_project_id: todoistProjectId,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        savedTask = data;
        toast.success('Task created!');
      } else {
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('task_id', selectedTask.task_id)
          .select()
          .single();

        if (error) throw error;
        savedTask = data;

        // Sync to Todoist if linked
        if (selectedTask?.todoist_id) {
          try {
            await fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
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

        toast.success('Task saved!');
      }

      setSelectedTask(savedTask);
      setIsCreating(false);
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  // Complete task
  const handleComplete = async (taskId) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (!task) return;

    try {
      await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('task_id', taskId);

      // Sync to Todoist
      if (task?.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}/close`, {
            method: 'POST',
          });
        } catch (syncErr) {
          console.warn('Failed to sync to Todoist:', syncErr);
        }
      }

      toast.success('Task completed!');

      if (selectedTask?.task_id === taskId) {
        setSelectedTask(null);
        setIsEditing(false);
      }

      fetchTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  // Delete task
  const handleDelete = async () => {
    if (!selectedTask || !window.confirm('Delete this task?')) return;

    try {
      await supabase.from('tasks').delete().eq('task_id', selectedTask.task_id);

      // Sync to Todoist
      if (selectedTask?.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
            method: 'DELETE',
          });
        } catch (syncErr) {
          console.warn('Failed to sync deletion to Todoist:', syncErr);
        }
      }

      toast.success('Task deleted');
      setSelectedTask(null);
      setIsEditing(false);
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  // Sync from Todoist (calls backend endpoint)
  const handleSyncFromTodoist = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/sync`, { method: 'POST' });
      if (!response.ok) throw new Error('Sync failed');

      toast.success('Synced from Todoist');
      fetchTasks();
      fetchTodoistCount();
    } catch (error) {
      console.error('Error syncing from Todoist:', error);
      toast.error('Failed to sync from Todoist');
    } finally {
      setSyncing(false);
    }
  };

  // Link entity search
  const searchEntities = async (type, query) => {
    if (!query.trim()) {
      setLinkSearchResults([]);
      return;
    }

    setLinkSearching(true);
    try {
      let results = [];
      if (type === 'contact') {
        const { data } = await supabase
          .from('contacts')
          .select('contact_id, first_name, last_name, profile_image_url')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
          .limit(10);
        results = data || [];
      } else if (type === 'company') {
        const { data } = await supabase
          .from('companies')
          .select('company_id, name')
          .ilike('name', `%${query}%`)
          .limit(10);
        results = data || [];
      } else if (type === 'deal') {
        const { data } = await supabase
          .from('deals')
          .select('deal_id, opportunity')
          .ilike('opportunity', `%${query}%`)
          .limit(10);
        results = data || [];
      }
      setLinkSearchResults(results);
    } catch (error) {
      console.error('Error searching entities:', error);
    } finally {
      setLinkSearching(false);
    }
  };

  // Add link
  const addLink = async (entity) => {
    if (!selectedTask) return;

    try {
      if (linkType === 'contact') {
        await supabase.from('task_contacts').insert({
          task_id: selectedTask.task_id,
          contact_id: entity.contact_id,
        });
        setLinkedContacts(prev => [...prev, entity]);
      } else if (linkType === 'company') {
        await supabase.from('task_companies').insert({
          task_id: selectedTask.task_id,
          company_id: entity.company_id,
        });
        setLinkedCompanies(prev => [...prev, entity]);
      } else if (linkType === 'deal') {
        await supabase.from('task_deals').insert({
          task_id: selectedTask.task_id,
          deal_id: entity.deal_id,
        });
        setLinkedDeals(prev => [...prev, entity]);
      }
      toast.success('Link added');
      setShowLinkModal(false);
      setLinkSearchQuery('');
      setLinkSearchResults([]);
      fetchTasks(); // Refresh to see updated links
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
    }
  };

  // Remove link
  const removeLink = async (type, id) => {
    if (!selectedTask) return;

    try {
      if (type === 'contact') {
        await supabase.from('task_contacts').delete()
          .eq('task_id', selectedTask.task_id)
          .eq('contact_id', id);
        setLinkedContacts(prev => prev.filter(c => c.contact_id !== id));
      } else if (type === 'company') {
        await supabase.from('task_companies').delete()
          .eq('task_id', selectedTask.task_id)
          .eq('company_id', id);
        setLinkedCompanies(prev => prev.filter(c => c.company_id !== id));
      } else if (type === 'deal') {
        await supabase.from('task_deals').delete()
          .eq('task_id', selectedTask.task_id)
          .eq('deal_id', id);
        setLinkedDeals(prev => prev.filter(d => d.deal_id !== id));
      }
      toast.success('Link removed');
      fetchTasks(); // Refresh to see updated links
    } catch (error) {
      console.error('Error removing link:', error);
      toast.error('Failed to remove link');
    }
  };

  // Inline edit handler
  const handleInlineEdit = async (task, newContent) => {
    // If task is null, just cancel editing
    if (!task) {
      setEditingTaskId(null);
      return;
    }

    // If no newContent, start editing mode
    if (!newContent) {
      setEditingTaskId(task.task_id);
      return;
    }

    // Save the new content
    setEditingTaskId(null);

    try {
      // Update in Supabase
      await supabase
        .from('tasks')
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', task.task_id);

      // Sync to Todoist if linked
      if (task.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent }),
          });
        } catch (syncErr) {
          console.warn('Failed to sync to Todoist:', syncErr);
        }
      }

      // Update local state immediately for better UX
      setTasks(prev => prev.map(t =>
        t.task_id === task.task_id ? { ...t, content: newContent } : t
      ));

      // Also update selectedTask if it's the one being edited
      if (selectedTask?.task_id === task.task_id) {
        setSelectedTask(prev => ({ ...prev, content: newContent }));
        setEditContent(newContent);
      }

      toast.success('Task updated');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
      fetchTasks(); // Refresh to get correct state
    }
  };

  // Auto-save field helper
  const saveField = async (field, value, todoistField = null) => {
    if (!selectedTask || isCreating) return;

    const updates = { [field]: value, updated_at: new Date().toISOString() };

    // Handle due_date parsing
    if (field === 'due_string') {
      if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        updates.due_date = value;
      } else if (!value) {
        updates.due_date = null;
      }
    }

    try {
      // Sync to Todoist FIRST for project changes (to get project_id)
      if (selectedTask.todoist_id && field === 'todoist_project_name') {
        // Fetch projects to get project_id from project name
        const projectsResponse = await fetch(`${BACKEND_URL}/todoist/projects`);
        if (projectsResponse.ok) {
          const { projects } = await projectsResponse.json();
          const targetProject = projects.find(p => p.name === value);
          if (targetProject) {
            updates.todoist_project_id = targetProject.id;
            const todoistRes = await fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ project_id: targetProject.id }),
            });
            if (!todoistRes.ok) {
              console.error('[Todoist PATCH failed]', await todoistRes.text());
              toast.error('Failed to update Todoist');
              return;
            }
            console.log('[Todoist PATCH success] project_id:', targetProject.id, targetProject.name);
          }
        }
      } else if (selectedTask.todoist_id) {
        // Sync other fields to Todoist
        const todoistPayload = {};
        if (todoistField) {
          todoistPayload[todoistField] = value;
        } else if (field === 'due_string') {
          todoistPayload.due_string = value || null;
        } else {
          todoistPayload[field] = value;
        }
        fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(todoistPayload),
        }).catch(console.warn);
      }

      // Update Supabase
      await supabase
        .from('tasks')
        .update(updates)
        .eq('task_id', selectedTask.task_id);

      // Update local state
      setTasks(prev => prev.map(t => t.task_id === selectedTask.task_id ? { ...t, ...updates } : t));
      setSelectedTask(prev => ({ ...prev, ...updates }));
      toast.success('Saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    }
  };

  // Get priority color
  const getPriorityColor = (p) => {
    switch (p) {
      case 4: return '#dc3545';
      case 3: return '#fd7e14';
      case 2: return '#ffc107';
      default: return '#6c757d';
    }
  };

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCategory, setDragOverCategory] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, category) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCategory(category);
  };

  const handleDragLeave = () => {
    setDragOverCategory(null);
  };

  const handleDrop = async (e, targetCategory) => {
    e.preventDefault();
    setDragOverCategory(null);

    if (!draggedTask) return;

    // Calculate new due_date based on target category
    const now = new Date();
    let newDueDate = null;
    let newDueString = null;

    switch (targetCategory) {
      case 'thisWeek': {
        // Set to Friday of this week (avoids timezone edge cases)
        const day = now.getDay();
        // Days until Friday: Sun=5, Mon=4, Tue=3, Wed=2, Thu=1, Fri=0, Sat=6 (next Fri)
        const daysUntilFriday = day === 0 ? 5 : (day <= 5 ? 5 - day : 6);
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() + daysUntilFriday);
        // Use local date format to avoid UTC timezone issues
        newDueDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        newDueString = 'friday';
        break;
      }
      case 'thisMonth': {
        // Set to 15th of this month (middle of month, after this week)
        const targetDate = new Date(now.getFullYear(), now.getMonth(), 20);
        // Use local date format to avoid UTC timezone issues
        newDueDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        newDueString = newDueDate;
        break;
      }
      case 'thisSprint': {
        // Set to 15th of next month within the quarter
        const quarterEndMonth = getQuarterEndMonth(now);
        let targetDate;
        if (now.getMonth() < quarterEndMonth) {
          // Set to next month
          targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 15);
        } else {
          // Already in last month of quarter, set to end of quarter
          targetDate = new Date(now.getFullYear(), quarterEndMonth + 1, 0);
        }
        // Use local date format to avoid UTC timezone issues
        newDueDate = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
        newDueString = newDueDate;
        break;
      }
      case 'someday': {
        // Remove due date
        newDueDate = null;
        newDueString = null;
        break;
      }
      default:
        return;
    }

    try {
      // Update in Supabase
      await supabase
        .from('tasks')
        .update({
          due_date: newDueDate,
          due_string: newDueString,
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', draggedTask.task_id);

      // Sync to Todoist if linked
      if (draggedTask.todoist_id) {
        try {
          // Use due_date (ISO format) for Todoist, not due_string
          const todoistPayload = newDueDate
            ? { due_date: newDueDate }
            : { due_date: null };

          await fetch(`${BACKEND_URL}/todoist/tasks/${draggedTask.todoist_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todoistPayload),
          });
        } catch (syncErr) {
          console.warn('Failed to sync to Todoist:', syncErr);
        }
      }

      toast.success(`Moved to ${targetCategory.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
      fetchTasks();
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    }

    setDraggedTask(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery ||
      task.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'all' ||
      task.todoist_project_name === selectedProject;
    return matchesSearch && matchesProject;
  });

  // Categorize open tasks by due date
  const thisWeekTasks = filteredTasks.filter(t => isThisWeek(t.due_date));
  const thisMonthTasks = filteredTasks.filter(t => isThisMonth(t.due_date));
  const thisSprintTasks = filteredTasks.filter(t => isThisSprint(t.due_date));
  const somedayTasks = filteredTasks.filter(t => isSomeday(t));

  const filteredCompletedTasks = completedTasks.filter(task => {
    const matchesSearch = !searchQuery ||
      task.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'all' ||
      task.todoist_project_name === selectedProject;
    return matchesSearch && matchesProject;
  });

  // Styles
  const containerStyle = {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
  };

  const columnStyle = {
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    overflow: 'hidden',
  };

  const headerStyle = {
    padding: '16px',
    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
    background: theme === 'dark' ? '#111827' : '#F9FAFB',
  };

  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
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
    outline: 'none',
  };

  return (
    <div style={containerStyle}>
      {/* Left Column: Filters + Task List */}
      <div style={{ ...columnStyle, width: '320px', minWidth: '280px' }}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: theme === 'dark' ? '#F9FAFB' : '#111827',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <FaTasks /> Tasks
              {syncMismatch && (
                <span
                  title={`Sync needed: Supabase ${supabaseOpenCount} vs Todoist ${todoistCount}`}
                  style={{
                    color: '#F59E0B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  onClick={handleSyncFromTodoist}
                >
                  <FaExclamationTriangle size={14} />
                </span>
              )}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSyncFromTodoist}
                disabled={syncing}
                style={{
                  ...buttonStyle,
                  padding: '6px 10px',
                  background: theme === 'dark' ? '#374151' : '#E5E7EB',
                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                  opacity: syncing ? 0.6 : 1,
                }}
                title="Sync from Todoist"
              >
                <FaSync size={12} className={syncing ? 'fa-spin' : ''} />
              </button>
              <button
                onClick={startNewTask}
                style={{
                  ...buttonStyle,
                  padding: '6px 10px',
                  background: '#10B981',
                  color: '#FFFFFF',
                }}
                title="New Task"
              >
                <FaPlus size={12} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <FaSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              fontSize: '12px',
            }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              style={{ ...inputStyle, paddingLeft: '36px' }}
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            style={{
              ...inputStyle,
              cursor: 'pointer',
            }}
          >
            {PROJECTS.map(proj => (
              <option key={proj.id} value={proj.id}>{proj.label}</option>
            ))}
          </select>
        </div>

        {/* Task List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {loading ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
            }}>
              Loading...
            </div>
          ) : (
            <>
              {/* Open Tasks Header */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, open: !prev.open }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                    cursor: 'pointer',
                    marginBottom: '8px',
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
                    marginLeft: 'auto',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#10B981',
                  }}>
                    {filteredTasks.length}
                  </span>
                </div>

                {expandedSections.open && (
                  <div style={{ paddingLeft: '12px' }}>
                    {/* Inbox: flat list without subcategories */}
                    {selectedProject === 'Inbox' ? (
                      filteredTasks.length === 0 ? (
                        <div style={{
                          padding: '40px 20px',
                          textAlign: 'center',
                          color: theme === 'dark' ? '#10B981' : '#059669',
                        }}>
                          <FaCheckCircle size={48} style={{ marginBottom: '12px', opacity: 0.8 }} />
                          <div style={{ fontSize: '16px', fontWeight: 600 }}>All done!</div>
                          <div style={{ fontSize: '13px', marginTop: '4px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
                            No tasks in Inbox
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {filteredTasks.map(task => (
                            <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                          ))}
                        </div>
                      )
                    ) : filteredTasks.length === 0 ? (
                      <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#10B981' : '#059669',
                      }}>
                        <FaCheckCircle size={48} style={{ marginBottom: '12px', opacity: 0.8 }} />
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>All done!</div>
                        <div style={{ fontSize: '13px', marginTop: '4px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
                          No tasks in {selectedProject}
                        </div>
                      </div>
                    ) : (
                      <>
                    {/* This Week */}
                    <div
                      style={{ marginBottom: '12px' }}
                      onDragOver={(e) => handleDragOver(e, 'thisWeek')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'thisWeek')}
                    >
                      <div
                        onClick={() => setExpandedSections(prev => ({ ...prev, thisWeek: !prev.thisWeek }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: dragOverCategory === 'thisWeek'
                            ? (theme === 'dark' ? '#4B5563' : '#D1D5DB')
                            : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                          border: dragOverCategory === 'thisWeek' ? '2px dashed #EF4444' : '2px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '6px',
                          transition: 'all 0.2s',
                        }}
                      >
                        {expandedSections.thisWeek ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />}
                        <FaClock size={10} style={{ color: '#EF4444' }} />
                        <span style={{
                          fontWeight: 500,
                          fontSize: '12px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          This Week
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#EF4444',
                        }}>
                          {thisWeekTasks.length}
                        </span>
                      </div>
                      {expandedSections.thisWeek && thisWeekTasks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {thisWeekTasks.map(task => (
                            <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* This Month */}
                    <div
                      style={{ marginBottom: '12px' }}
                      onDragOver={(e) => handleDragOver(e, 'thisMonth')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'thisMonth')}
                    >
                      <div
                        onClick={() => setExpandedSections(prev => ({ ...prev, thisMonth: !prev.thisMonth }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: dragOverCategory === 'thisMonth'
                            ? (theme === 'dark' ? '#4B5563' : '#D1D5DB')
                            : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                          border: dragOverCategory === 'thisMonth' ? '2px dashed #F59E0B' : '2px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '6px',
                          transition: 'all 0.2s',
                        }}
                      >
                        {expandedSections.thisMonth ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />}
                        <FaCalendarAlt size={10} style={{ color: '#F59E0B' }} />
                        <span style={{
                          fontWeight: 500,
                          fontSize: '12px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          This Month
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#F59E0B',
                        }}>
                          {thisMonthTasks.length}
                        </span>
                      </div>
                      {expandedSections.thisMonth && thisMonthTasks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {thisMonthTasks.map(task => (
                            <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* This Sprint */}
                    <div
                      style={{ marginBottom: '12px' }}
                      onDragOver={(e) => handleDragOver(e, 'thisSprint')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'thisSprint')}
                    >
                      <div
                        onClick={() => setExpandedSections(prev => ({ ...prev, thisSprint: !prev.thisSprint }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: dragOverCategory === 'thisSprint'
                            ? (theme === 'dark' ? '#4B5563' : '#D1D5DB')
                            : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                          border: dragOverCategory === 'thisSprint' ? '2px dashed #8B5CF6' : '2px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '6px',
                          transition: 'all 0.2s',
                        }}
                      >
                        {expandedSections.thisSprint ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />}
                        <FaFlag size={10} style={{ color: '#8B5CF6' }} />
                        <span style={{
                          fontWeight: 500,
                          fontSize: '12px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          This Sprint
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#8B5CF6',
                        }}>
                          {thisSprintTasks.length}
                        </span>
                      </div>
                      {expandedSections.thisSprint && thisSprintTasks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {thisSprintTasks.map(task => (
                            <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Someday */}
                    <div
                      style={{ marginBottom: '12px' }}
                      onDragOver={(e) => handleDragOver(e, 'someday')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'someday')}
                    >
                      <div
                        onClick={() => setExpandedSections(prev => ({ ...prev, someday: !prev.someday }))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: dragOverCategory === 'someday'
                            ? (theme === 'dark' ? '#4B5563' : '#D1D5DB')
                            : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                          border: dragOverCategory === 'someday' ? '2px dashed #6B7280' : '2px solid transparent',
                          cursor: 'pointer',
                          marginBottom: '6px',
                          transition: 'all 0.2s',
                        }}
                      >
                        {expandedSections.someday ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />}
                        <FaCircle size={10} style={{ color: '#6B7280' }} />
                        <span style={{
                          fontWeight: 500,
                          fontSize: '12px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          Someday
                        </span>
                        <span style={{
                          marginLeft: 'auto',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#6B7280',
                        }}>
                          {somedayTasks.length}
                        </span>
                      </div>
                      {expandedSections.someday && somedayTasks.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {somedayTasks.map(task => (
                            <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                          ))}
                        </div>
                      )}
                    </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Completed Tasks */}
              <div>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, completed: !prev.completed }))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                    cursor: 'pointer',
                    marginBottom: '8px',
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
                    marginLeft: 'auto',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                  }}>
                    {filteredCompletedTasks.length}
                  </span>
                </div>

                {expandedSections.completed && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredCompletedTasks.length === 0 ? (
                      <div style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        fontSize: '13px',
                      }}>
                        No completed tasks
                      </div>
                    ) : (
                      filteredCompletedTasks.map(task => (
                        <div
                          key={task.task_id}
                          onClick={() => loadTask(task)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: selectedTask?.task_id === task.task_id
                              ? (theme === 'dark' ? '#374151' : '#E5E7EB')
                              : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
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
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle Column: Task Editor */}
      <div style={{ ...columnStyle, flex: 1, minWidth: '400px' }}>
        {!isEditing ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
          }}>
            <FaTasks size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <div style={{ fontSize: '16px', fontWeight: 500 }}>Select a task</div>
            <div style={{ fontSize: '13px', marginTop: '8px' }}>
              or create a new one
            </div>
          </div>
        ) : (
          <>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#F9FAFB' : '#111827',
                }}>
                  {isCreating ? 'New Task' : 'Edit Task'}
                </h3>
                {selectedTask?.todoist_url && (
                  <button
                    onClick={() => window.open(selectedTask.todoist_url, '_blank')}
                    style={{
                      ...buttonStyle,
                      background: theme === 'dark' ? '#374151' : '#E5E7EB',
                      color: theme === 'dark' ? '#D1D5DB' : '#374151',
                    }}
                  >
                    <FaExternalLinkAlt size={12} />
                  </button>
                )}
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
              {/* Content */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginBottom: '6px',
                  display: 'block',
                }}>
                  Task
                </label>
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onBlur={() => {
                    if (editContent.trim() && editContent.trim() !== selectedTask?.content) {
                      saveField('content', editContent.trim());
                    }
                  }}
                  placeholder="What needs to be done?"
                  style={{
                    ...inputStyle,
                    fontSize: '16px',
                    fontWeight: 500,
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginBottom: '6px',
                  display: 'block',
                }}>
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  onBlur={() => {
                    const newDesc = editDescription.trim() || null;
                    if (newDesc !== (selectedTask?.description || null)) {
                      saveField('description', newDesc);
                    }
                  }}
                  placeholder="Add details..."
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    minHeight: '100px',
                  }}
                />
              </div>

              {/* Due Date */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <FaCalendarAlt size={11} /> Due Date
                </label>
                <input
                  type="text"
                  value={editDueString}
                  onChange={(e) => setEditDueString(e.target.value)}
                  onBlur={() => {
                    if (editDueString !== (selectedTask?.due_string || '')) {
                      saveField('due_string', editDueString || null);
                    }
                  }}
                  placeholder="e.g., tomorrow, next monday, 2024-12-31"
                  style={inputStyle}
                />
                {/* Quick Date Buttons */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {[
                    { label: 'This Week', value: 'friday', getDate: () => {
                      const now = new Date();
                      const day = now.getDay();
                      const daysUntilFriday = day === 0 ? 5 : (day <= 5 ? 5 - day : 6);
                      const friday = new Date(now);
                      friday.setDate(now.getDate() + daysUntilFriday);
                      return `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`;
                    }},
                    { label: 'This Month', value: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-20`; })() },
                    { label: 'This Sprint', value: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 2).padStart(2, '0')}-15`; })() },
                    { label: 'Someday', value: '' },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      onClick={async () => {
                        const dateValue = opt.getDate ? opt.getDate() : opt.value;
                        setEditDueString(opt.value || dateValue);
                        await saveField('due_string', dateValue || null);
                        fetchTasks(); // Refresh to update categories
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${editDueString === opt.value ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                        background: editDueString === opt.value
                          ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                          : (theme === 'dark' ? '#1F2937' : '#F9FAFB'),
                        color: editDueString === opt.value
                          ? '#3B82F6'
                          : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                        fontSize: '11px',
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
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <FaFlag size={11} /> Priority
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        setEditPriority(p);
                        saveField('priority', p);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: editPriority === p
                          ? `2px solid ${getPriorityColor(p)}`
                          : `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                        background: editPriority === p
                          ? `${getPriorityColor(p)}20`
                          : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                        color: editPriority === p
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

              {/* Linked To Section (moved from right column) */}
              {!isCreating && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                    <FaLink size={11} /> Linked To
                  </label>

                  {/* Contacts */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '6px',
                    }}>
                      <FaUser size={9} /> Contacts
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => { setLinkType('contact'); setShowLinkModal(true); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3B82F6',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '2px 6px',
                        }}
                      >
                        + Add
                      </button>
                      {linkedContacts.length === 0 ? (
                        <span style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                          No contacts linked
                        </span>
                      ) : (
                        linkedContacts.map(contact => (
                          <div
                            key={contact.contact_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                              fontSize: '12px',
                              color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            }}
                          >
                            {contact.first_name} {contact.last_name}
                            <button
                              onClick={() => removeLink('contact', contact.contact_id)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0', display: 'flex' }}
                            >
                              <FaTrash size={9} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Companies */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '6px',
                    }}>
                      <FaBuilding size={9} /> Companies
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => { setLinkType('company'); setShowLinkModal(true); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3B82F6',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '2px 6px',
                        }}
                      >
                        + Add
                      </button>
                      {linkedCompanies.length === 0 ? (
                        <span style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                          No companies linked
                        </span>
                      ) : (
                        linkedCompanies.map(company => (
                          <div
                            key={company.company_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                              fontSize: '12px',
                              color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            }}
                          >
                            {company.name}
                            <button
                              onClick={() => removeLink('company', company.company_id)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0', display: 'flex' }}
                            >
                              <FaTrash size={9} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Deals */}
                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginBottom: '6px',
                    }}>
                      <FaDollarSign size={9} /> Deals
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => { setLinkType('deal'); setShowLinkModal(true); }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3B82F6',
                          cursor: 'pointer',
                          fontSize: '11px',
                          padding: '2px 6px',
                        }}
                      >
                        + Add
                      </button>
                      {linkedDeals.length === 0 ? (
                        <span style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                          No deals linked
                        </span>
                      ) : (
                        linkedDeals.map(deal => (
                          <div
                            key={deal.deal_id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                              fontSize: '12px',
                              color: theme === 'dark' ? '#F9FAFB' : '#111827',
                            }}
                          >
                            {deal.opportunity}
                            <button
                              onClick={() => removeLink('deal', deal.deal_id)}
                              style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0', display: 'flex' }}
                            >
                              <FaTrash size={9} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Project */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  marginBottom: '6px',
                  display: 'block',
                }}>
                  Project
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { name: 'Inbox', icon: FaInbox },
                    { name: 'Birthdays 🎂', icon: FaBirthdayCake },
                    { name: 'Personal', icon: FaHome },
                    { name: 'Work', icon: FaBriefcase },
                  ].map(proj => {
                    const Icon = proj.icon;
                    const isSelected = editProjectName === proj.name;
                    return (
                      <button
                        key={proj.name}
                        onClick={() => {
                          setEditProjectName(proj.name);
                          saveField('todoist_project_name', proj.name);
                          // Select next task in list
                          const currentIndex = filteredTasks.findIndex(t => t.task_id === selectedTask?.task_id);
                          if (currentIndex !== -1 && filteredTasks.length > 1) {
                            const nextTask = filteredTasks[currentIndex + 1] || filteredTasks[currentIndex - 1];
                            if (nextTask) {
                              setTimeout(() => loadTask(nextTask), 100);
                            }
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: `1px solid ${isSelected ? '#3B82F6' : (theme === 'dark' ? '#4B5563' : '#D1D5DB')}`,
                          background: isSelected
                            ? (theme === 'dark' ? '#1E3A5F' : '#DBEAFE')
                            : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                          color: isSelected
                            ? '#3B82F6'
                            : (theme === 'dark' ? '#9CA3AF' : '#6B7280'),
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <Icon size={14} />
                        {proj.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginBottom: '16px' }}>
                {isCreating ? (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#10B981',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: saving ? 'not-allowed' : 'pointer',
                      opacity: saving ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <FaPlus size={14} />
                    {saving ? 'Creating...' : 'Create Task'}
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedTask?.status === 'open' && (
                      <button
                        onClick={() => handleComplete(selectedTask.task_id)}
                        style={{
                          flex: 1,
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#3B82F6',
                          color: '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                        }}
                      >
                        <FaCheck size={14} />
                        Complete
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <FaTrash size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Todoist Info */}
              {selectedTask?.todoist_id && (
                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                  fontSize: '11px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  <div><strong>Todoist ID:</strong> {selectedTask.todoist_id}</div>
                  {selectedTask.synced_at && (
                    <div style={{ marginTop: '4px' }}>
                      <strong>Last synced:</strong> {new Date(selectedTask.synced_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
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
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
            borderRadius: '12px',
            width: '400px',
            maxHeight: '500px',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 600,
                color: theme === 'dark' ? '#F9FAFB' : '#111827',
              }}>
                Link {linkType === 'contact' ? 'Contact' : linkType === 'company' ? 'Company' : 'Deal'}
              </h3>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkSearchQuery('');
                  setLinkSearchResults([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <input
                type="text"
                value={linkSearchQuery}
                onChange={(e) => {
                  setLinkSearchQuery(e.target.value);
                  searchEntities(linkType, e.target.value);
                }}
                placeholder={`Search ${linkType}s...`}
                style={inputStyle}
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 16px' }}>
              {linkSearching ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  Searching...
                </div>
              ) : linkSearchResults.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                }}>
                  {linkSearchQuery ? 'No results found' : 'Type to search'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {linkSearchResults.map(entity => (
                    <div
                      key={entity.contact_id || entity.company_id || entity.deal_id}
                      onClick={() => addLink(entity)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: theme === 'dark' ? '#374151' : '#F3F4F6',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      }}
                    >
                      {linkType === 'contact'
                        ? `${entity.first_name} ${entity.last_name}`
                        : linkType === 'company'
                        ? entity.name
                        : entity.opportunity}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksFullTab;
