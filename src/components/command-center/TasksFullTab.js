import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTasks, FaPlus, FaSearch, FaFolder, FaSave, FaTrash, FaCheck,
  FaLink, FaUser, FaBuilding, FaDollarSign, FaSync, FaExternalLinkAlt,
  FaChevronRight, FaChevronDown, FaCalendarAlt, FaFlag, FaFilter,
  FaClock, FaCheckCircle, FaCircle
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
  { id: 'Team', label: 'Team', color: '#7ecc49' },
  { id: 'Birthdays', label: 'Birthdays', color: '#db4035' },
  { id: 'Aborted', label: 'Aborted', color: '#ccac93' },
];

// Status sections
const STATUS_SECTIONS = [
  { id: 'open', label: 'Open', icon: FaCircle, color: '#10B981' },
  { id: 'completed', label: 'Completed', icon: FaCheckCircle, color: '#6B7280' },
];

const TasksFullTab = ({ theme }) => {
  // Tasks list state
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('all');
  const [expandedSections, setExpandedSections] = useState({ open: true, completed: false });

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

  // New task state
  const [isCreating, setIsCreating] = useState(false);

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
          task_contacts(contact:contacts(contact_id, first_name, last_name, profile_image_url)),
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
          task_contacts(contact:contacts(contact_id, first_name, last_name, profile_image_url)),
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
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            status: 'open',
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

  // Sync from Todoist
  const handleSyncFromTodoist = async () => {
    setSyncing(true);
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks`);
      if (!response.ok) throw new Error('Failed to fetch from Todoist');

      const { tasks: todoistTasks } = await response.json();

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
          await supabase.from('tasks').insert({
            ...taskData,
            created_at: new Date().toISOString(),
          });
        }
      }

      toast.success('Synced from Todoist');
      fetchTasks();
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
    } catch (error) {
      console.error('Error removing link:', error);
      toast.error('Failed to remove link');
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery ||
      task.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'all' ||
      task.todoist_project_name === selectedProject;
    return matchesSearch && matchesProject;
  });

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
              {/* Open Tasks */}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredTasks.length === 0 ? (
                      <div style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                        fontSize: '13px',
                      }}>
                        No open tasks
                      </div>
                    ) : (
                      filteredTasks.map(task => (
                        <div
                          key={task.task_id}
                          onClick={() => loadTask(task)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            background: selectedTask?.task_id === task.task_id
                              ? (theme === 'dark' ? '#374151' : '#E5E7EB')
                              : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                            border: `1px solid ${selectedTask?.task_id === task.task_id
                              ? '#3B82F6'
                              : (theme === 'dark' ? '#374151' : '#E5E7EB')}`,
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
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              border: `2px solid ${getPriorityColor(task.priority)}`,
                              flexShrink: 0,
                              marginTop: '2px',
                              cursor: 'pointer',
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
                              gap: '6px',
                              marginTop: '4px',
                              flexWrap: 'wrap',
                            }}>
                              {task.due_string && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
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
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: theme === 'dark' ? '#374151' : '#F3F4F6',
                                  color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                                }}>
                                  {task.todoist_project_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      ...buttonStyle,
                      background: '#10B981',
                      color: '#FFFFFF',
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    <FaSave size={12} />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  {!isCreating && selectedTask?.status === 'open' && (
                    <button
                      onClick={() => handleComplete(selectedTask.task_id)}
                      style={{
                        ...buttonStyle,
                        background: '#3B82F6',
                        color: '#FFFFFF',
                      }}
                    >
                      <FaCheck size={12} />
                      Complete
                    </button>
                  )}
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
                  {!isCreating && (
                    <button
                      onClick={handleDelete}
                      style={{
                        ...buttonStyle,
                        background: '#EF4444',
                        color: '#FFFFFF',
                      }}
                    >
                      <FaTrash size={12} />
                    </button>
                  )}
                </div>
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
                  placeholder="e.g., tomorrow, next monday, 2024-12-31"
                  style={inputStyle}
                />
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
                      onClick={() => setEditPriority(p)}
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
                <select
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                  }}
                >
                  {PROJECTS.filter(p => p.id !== 'all').map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.label}</option>
                  ))}
                </select>
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

      {/* Right Column: Linked Entities */}
      <div style={{ ...columnStyle, width: '280px', minWidth: '240px', borderRight: 'none' }}>
        <div style={headerStyle}>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: theme === 'dark' ? '#F9FAFB' : '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <FaLink /> Linked To
          </h3>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {!isEditing || isCreating ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
              fontSize: '13px',
            }}>
              {isCreating ? 'Save task first to add links' : 'Select a task to see links'}
            </div>
          ) : (
            <>
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
                    <FaUser size={10} /> Contacts
                  </span>
                  <button
                    onClick={() => {
                      setLinkType('contact');
                      setShowLinkModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3B82F6',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    + Add
                  </button>
                </div>
                {linkedContacts.length === 0 ? (
                  <div style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontStyle: 'italic',
                  }}>
                    No contacts linked
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {linkedContacts.map(contact => (
                      <div
                        key={contact.contact_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          {contact.first_name} {contact.last_name}
                        </span>
                        <button
                          onClick={() => removeLink('contact', contact.contact_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <FaBuilding size={10} /> Companies
                  </span>
                  <button
                    onClick={() => {
                      setLinkType('company');
                      setShowLinkModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3B82F6',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    + Add
                  </button>
                </div>
                {linkedCompanies.length === 0 ? (
                  <div style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontStyle: 'italic',
                  }}>
                    No companies linked
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {linkedCompanies.map(company => (
                      <div
                        key={company.company_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          {company.name}
                        </span>
                        <button
                          onClick={() => removeLink('company', company.company_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deals */}
              <div>
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
                    <FaDollarSign size={10} /> Deals
                  </span>
                  <button
                    onClick={() => {
                      setLinkType('deal');
                      setShowLinkModal(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3B82F6',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    + Add
                  </button>
                </div>
                {linkedDeals.length === 0 ? (
                  <div style={{
                    fontSize: '12px',
                    color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                    fontStyle: 'italic',
                  }}>
                    No deals linked
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {linkedDeals.map(deal => (
                      <div
                        key={deal.deal_id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: theme === 'dark' ? '#1F2937' : '#F3F4F6',
                        }}
                      >
                        <span style={{
                          fontSize: '13px',
                          color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        }}>
                          {deal.opportunity}
                        </span>
                        <button
                          onClick={() => removeLink('deal', deal.deal_id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            padding: '2px',
                          }}
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
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
