import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

/**
 * Custom hook for managing tasks from Supabase with Todoist sync
 * Tasks can be associated with contacts, companies, deals, and notes
 */
const useSupabaseTasks = (contactId = null) => {
  // Tasks state
  const [tasks, setTasks] = useState([]);           // Tasks for selected contact
  const [allTasks, setAllTasks] = useState([]);     // All open tasks
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueString, setNewTaskDueString] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [newTaskProjectName, setNewTaskProjectName] = useState('Inbox');
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);
  const [selectedDealIds, setSelectedDealIds] = useState([]);
  const [saving, setSaving] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState('contact'); // 'contact' | 'all'

  // Fetch tasks for a specific contact
  const fetchContactTasks = useCallback(async () => {
    if (!contactId) {
      setTasks([]);
      return;
    }

    setLoading(true);
    try {
      // Get task IDs associated with this contact
      const { data: taskLinks, error: linkError } = await supabase
        .from('task_contacts')
        .select('task_id')
        .eq('contact_id', contactId);

      if (linkError) throw linkError;

      if (!taskLinks || taskLinks.length === 0) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const taskIds = taskLinks.map(l => l.task_id);

      // Fetch the actual tasks with all associations
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          task_contacts(
            contact:contacts(contact_id, first_name, last_name, profile_image_url)
          ),
          task_companies(
            company:companies(company_id, name)
          ),
          task_deals(
            deal:deals(deal_id, opportunity)
          )
        `)
        .in('task_id', taskIds)
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);
    } catch (error) {
      console.error('Error fetching contact tasks:', error);
      toast.error('Failed to load tasks');
    }
    setLoading(false);
  }, [contactId]);

  // Fetch all open tasks
  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          task_contacts(
            contact:contacts(contact_id, first_name, last_name, profile_image_url)
          ),
          task_companies(
            company:companies(company_id, name)
          ),
          task_deals(
            deal:deals(deal_id, opportunity)
          )
        `)
        .eq('status', 'open')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      setAllTasks(data || []);
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      toast.error('Failed to load tasks');
    }
    setLoading(false);
  }, []);

  // Load tasks when contactId changes or viewMode changes
  useEffect(() => {
    if (viewMode === 'contact') {
      fetchContactTasks();
    } else {
      fetchAllTasks();
    }
  }, [contactId, viewMode, fetchContactTasks, fetchAllTasks]);

  // Reset form
  const resetTaskForm = useCallback(() => {
    setNewTaskContent('');
    setNewTaskDescription('');
    setNewTaskDueString('');
    setNewTaskPriority(1);
    setNewTaskProjectName('Inbox');
    setSelectedContactIds(contactId ? [contactId] : []);
    setSelectedCompanyIds([]);
    setSelectedDealIds([]);
    setEditingTask(null);
  }, [contactId]);

  // Create or update a task
  const handleSaveTask = useCallback(async () => {
    if (!newTaskContent.trim()) {
      toast.error('Task content is required');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        content: newTaskContent.trim(),
        description: newTaskDescription.trim() || null,
        due_string: newTaskDueString || null,
        priority: newTaskPriority,
        todoist_project_name: newTaskProjectName,
        updated_at: new Date().toISOString()
      };

      // Parse due_string to due_date if it looks like a date
      if (newTaskDueString) {
        const dateMatch = newTaskDueString.match(/^\d{4}-\d{2}-\d{2}$/);
        if (dateMatch) {
          taskData.due_date = newTaskDueString;
        }
      }

      let savedTask;

      if (editingTask) {
        // Update existing task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('task_id', editingTask.task_id)
          .select()
          .single();

        if (error) throw error;
        savedTask = data;

        // Update associations - delete old ones and insert new
        await supabase.from('task_contacts').delete().eq('task_id', savedTask.task_id);
        await supabase.from('task_companies').delete().eq('task_id', savedTask.task_id);
        await supabase.from('task_deals').delete().eq('task_id', savedTask.task_id);
      } else {
        // Create new task
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            status: 'open',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        savedTask = data;
      }

      // Insert associations
      if (selectedContactIds.length > 0) {
        await supabase.from('task_contacts').insert(
          selectedContactIds.map(cid => ({ task_id: savedTask.task_id, contact_id: cid }))
        );
      }
      if (selectedCompanyIds.length > 0) {
        await supabase.from('task_companies').insert(
          selectedCompanyIds.map(cid => ({ task_id: savedTask.task_id, company_id: cid }))
        );
      }
      if (selectedDealIds.length > 0) {
        await supabase.from('task_deals').insert(
          selectedDealIds.map(did => ({ task_id: savedTask.task_id, deal_id: did }))
        );
      }

      // Sync to Todoist if needed
      if (savedTask.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${savedTask.todoist_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: savedTask.content,
              description: savedTask.description,
              due_string: savedTask.due_string,
              priority: savedTask.priority
            })
          });
        } catch (syncError) {
          console.warn('Failed to sync to Todoist:', syncError);
        }
      }

      toast.success(editingTask ? 'Task updated!' : 'Task created!');
      setTaskModalOpen(false);
      resetTaskForm();

      // Refresh tasks
      if (viewMode === 'contact') {
        fetchContactTasks();
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
    setSaving(false);
  }, [
    newTaskContent, newTaskDescription, newTaskDueString, newTaskPriority,
    newTaskProjectName, selectedContactIds, selectedCompanyIds, selectedDealIds,
    editingTask, resetTaskForm, viewMode, fetchContactTasks, fetchAllTasks
  ]);

  // Complete a task
  const handleCompleteTask = useCallback(async (taskId) => {
    try {
      // Get the task first to check for todoist_id
      const { data: task } = await supabase
        .from('tasks')
        .select('todoist_id')
        .eq('task_id', taskId)
        .single();

      // Update in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('task_id', taskId);

      if (error) throw error;

      // Sync to Todoist
      if (task?.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}/close`, {
            method: 'POST'
          });
        } catch (syncError) {
          console.warn('Failed to sync completion to Todoist:', syncError);
        }
      }

      toast.success('Task completed!');

      // Refresh tasks
      if (viewMode === 'contact') {
        fetchContactTasks();
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  }, [viewMode, fetchContactTasks, fetchAllTasks]);

  // Delete a task
  const handleDeleteTask = useCallback(async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      // Get the task first to check for todoist_id
      const { data: task } = await supabase
        .from('tasks')
        .select('todoist_id')
        .eq('task_id', taskId)
        .single();

      // Delete from Supabase (cascade will handle junction tables)
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('task_id', taskId);

      if (error) throw error;

      // Sync to Todoist
      if (task?.todoist_id) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${task.todoist_id}`, {
            method: 'DELETE'
          });
        } catch (syncError) {
          console.warn('Failed to sync deletion to Todoist:', syncError);
        }
      }

      toast.success('Task deleted');

      // Refresh tasks
      if (viewMode === 'contact') {
        fetchContactTasks();
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  }, [viewMode, fetchContactTasks, fetchAllTasks]);

  // Open edit modal for a task
  const openEditTask = useCallback((task) => {
    setEditingTask(task);
    setNewTaskContent(task.content);
    setNewTaskDescription(task.description || '');
    setNewTaskDueString(task.due_string || task.due_date || '');
    setNewTaskPriority(task.priority || 1);
    setNewTaskProjectName(task.todoist_project_name || 'Inbox');

    // Set associations
    setSelectedContactIds(task.task_contacts?.map(tc => tc.contact?.contact_id).filter(Boolean) || []);
    setSelectedCompanyIds(task.task_companies?.map(tc => tc.company?.company_id).filter(Boolean) || []);
    setSelectedDealIds(task.task_deals?.map(td => td.deal?.deal_id).filter(Boolean) || []);

    setTaskModalOpen(true);
  }, []);

  // Sync from Todoist
  const syncFromTodoist = useCallback(async () => {
    setSyncing(true);
    try {
      // Fetch all tasks from Todoist
      const response = await fetch(`${BACKEND_URL}/todoist/tasks`);
      if (!response.ok) throw new Error('Failed to fetch from Todoist');

      const { tasks: todoistTasks } = await response.json();

      // For each Todoist task, upsert into Supabase
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
          synced_at: new Date().toISOString()
        };

        if (existing) {
          // Only update if Supabase hasn't been modified since last sync
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
              created_at: new Date().toISOString()
            });
        }
      }

      toast.success('Synced from Todoist');

      // Refresh tasks
      if (viewMode === 'contact') {
        fetchContactTasks();
      } else {
        fetchAllTasks();
      }
    } catch (error) {
      console.error('Error syncing from Todoist:', error);
      toast.error('Failed to sync from Todoist');
    }
    setSyncing(false);
  }, [viewMode, fetchContactTasks, fetchAllTasks]);

  // Get priority color
  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 4: return '#dc3545'; // Red - urgent
      case 3: return '#fd7e14'; // Orange
      case 2: return '#ffc107'; // Yellow
      default: return '#6c757d'; // Gray - normal
    }
  }, []);

  // Get project color
  const getProjectColor = useCallback((projectName) => {
    const colors = {
      'Inbox': '#808080',
      'Personal': '#b8255f',
      'Work': '#4073ff',
      'Team': '#7ecc49',
      'Aborted': '#ccac93',
      'Birthdays': '#db4035'
    };
    return colors[projectName] || '#808080';
  }, []);

  // Group tasks by project
  const groupTasksByProject = useCallback((taskList) => {
    const groups = {};
    taskList.forEach(task => {
      const project = task.todoist_project_name || 'Inbox';
      if (!groups[project]) {
        groups[project] = [];
      }
      groups[project].push(task);
    });
    return groups;
  }, []);

  return {
    // Tasks data
    tasks,              // Tasks for selected contact
    allTasks,           // All open tasks
    loading,
    syncing,

    // Modal state
    taskModalOpen,
    setTaskModalOpen,
    editingTask,

    // Form state
    newTaskContent,
    setNewTaskContent,
    newTaskDescription,
    setNewTaskDescription,
    newTaskDueString,
    setNewTaskDueString,
    newTaskPriority,
    setNewTaskPriority,
    newTaskProjectName,
    setNewTaskProjectName,
    selectedContactIds,
    setSelectedContactIds,
    selectedCompanyIds,
    setSelectedCompanyIds,
    selectedDealIds,
    setSelectedDealIds,
    saving,

    // View mode
    viewMode,
    setViewMode,

    // Actions
    fetchContactTasks,
    fetchAllTasks,
    handleSaveTask,
    handleCompleteTask,
    handleDeleteTask,
    resetTaskForm,
    openEditTask,
    syncFromTodoist,

    // Helpers
    getPriorityColor,
    getProjectColor,
    groupTasksByProject
  };
};

export default useSupabaseTasks;
