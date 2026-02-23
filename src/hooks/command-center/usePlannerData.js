import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

const usePlannerData = () => {
  // ==================== SCOPE & DATE NAVIGATION ====================
  const [scope, setScope] = useState('daily'); // daily | weekly | monthly | yearly
  const [scopeDate, setScopeDate] = useState(new Date().toISOString().split('T')[0]);

  const getScopeDate = useCallback((s, dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (s === 'daily') return dateStr;
    if (s === 'weekly') {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      return monday.toISOString().split('T')[0];
    }
    if (s === 'monthly') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (s === 'yearly') {
      return `${d.getFullYear()}-01-01`;
    }
    return dateStr;
  }, []);

  const getScopeDateLabel = useCallback((s, dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (s === 'daily') {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    if (s === 'weekly') {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const startOfYear = new Date(monday.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((monday - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      return `W${String(weekNum).padStart(2, '0')} — ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
    if (s === 'monthly') {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    if (s === 'yearly') {
      return String(d.getFullYear());
    }
    return dateStr;
  }, []);

  const navigateScopeDate = useCallback((offset) => {
    setScopeDate(prev => {
      const d = new Date(prev + 'T12:00:00');
      if (scope === 'daily') d.setDate(d.getDate() + offset);
      else if (scope === 'weekly') d.setDate(d.getDate() + (offset * 7));
      else if (scope === 'monthly') d.setMonth(d.getMonth() + offset);
      else if (scope === 'yearly') d.setFullYear(d.getFullYear() + offset);
      return d.toISOString().split('T')[0];
    });
  }, [scope]);

  const goToToday = useCallback(() => {
    setScopeDate(new Date().toISOString().split('T')[0]);
  }, []);

  // ==================== SCOPE DATE RANGE HELPERS ====================
  const scopeRange = useMemo(() => {
    const d = new Date(scopeDate + 'T12:00:00');
    let start, end;

    if (scope === 'daily') {
      start = new Date(d);
      start.setHours(0, 0, 0, 0);
      end = new Date(d);
      end.setHours(23, 59, 59, 999);
    } else if (scope === 'weekly') {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      start = new Date(d);
      start.setDate(d.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (scope === 'monthly') {
      start = new Date(d.getFullYear(), d.getMonth(), 1);
      end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (scope === 'yearly') {
      start = new Date(d.getFullYear(), 0, 1);
      end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    return { start, end };
  }, [scope, scopeDate]);

  // ==================== PRIORITIES (Supabase) ====================
  const [priorities, setPriorities] = useState([]);
  const [prioritiesLoading, setPrioritiesLoading] = useState(false);

  const normalizedScopeDate = useMemo(() => getScopeDate(scope, scopeDate), [scope, scopeDate, getScopeDate]);

  // Fetch all priorities
  useEffect(() => {
    const fetchPriorities = async () => {
      setPrioritiesLoading(true);
      try {
        const { data, error } = await supabase
          .from('priorities')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        setPriorities(data || []);
      } catch (err) {
        console.error('Error fetching priorities:', err);
      } finally {
        setPrioritiesLoading(false);
      }
    };
    fetchPriorities();
  }, []);

  // Filter priorities for current scope + date
  const prioritiesForScope = useMemo(() => {
    return priorities.filter(p => p.scope === scope && p.scope_date === normalizedScopeDate);
  }, [priorities, scope, normalizedScopeDate]);

  const addPriority = useCallback(async (data) => {
    try {
      const { data: newPriority, error } = await supabase
        .from('priorities')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      toast.success('Priority added');
      setPriorities(prev => [...prev, newPriority]);
      return newPriority;
    } catch (err) {
      console.error('Error adding priority:', err);
      toast.error('Failed to add priority');
      return null;
    }
  }, []);

  const togglePriority = useCallback(async (id, currentValue) => {
    try {
      const { error } = await supabase
        .from('priorities')
        .update({ is_completed: !currentValue })
        .eq('id', id);
      if (error) throw error;
      setPriorities(prev => prev.map(p => p.id === id ? { ...p, is_completed: !currentValue } : p));
    } catch (err) {
      console.error('Error toggling priority:', err);
      toast.error('Failed to update priority');
    }
  }, []);

  const deletePriority = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('priorities').delete().eq('id', id);
      if (error) throw error;
      setPriorities(prev => prev.filter(p => p.id !== id));
      toast.success('Priority deleted');
    } catch (err) {
      console.error('Error deleting priority:', err);
      toast.error('Failed to delete priority');
    }
  }, []);

  // ==================== TODOIST TASKS ====================
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [todoistProjects, setTodoistProjects] = useState([]);
  const [todoistLoading, setTodoistLoading] = useState(false);

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDueString, setNewTaskDueString] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('6VhG9MrQwJwqJJfW'); // Inbox
  const [newTaskSectionId, setNewTaskSectionId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchTodoistData = useCallback(async () => {
    setTodoistLoading(true);
    try {
      const [tasksRes, projectsRes, sectionsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/todoist/tasks`),
        fetch(`${BACKEND_URL}/todoist/projects`),
        fetch(`${BACKEND_URL}/todoist/sections`),
      ]);

      if (tasksRes.ok) {
        const { tasks } = await tasksRes.json();
        setTodoistTasks(tasks || []);
      }

      if (projectsRes.ok && sectionsRes.ok) {
        const { projects } = await projectsRes.json();
        const { sections } = await sectionsRes.json();
        const projectsWithSections = (projects || []).map(project => ({
          ...project,
          sections: (sections || []).filter(s => s.project_id === project.id)
        }));
        setTodoistProjects(projectsWithSections);
      } else if (projectsRes.ok) {
        const { projects } = await projectsRes.json();
        setTodoistProjects(projects || []);
      }
    } catch (error) {
      console.error('Error fetching Todoist data:', error);
    }
    setTodoistLoading(false);
  }, []);

  useEffect(() => { fetchTodoistData(); }, [fetchTodoistData]);

  const completeTask = useCallback(async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}/close`, { method: 'POST' });
      if (response.ok) {
        toast.success('Task completed!');
        setTodoistTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        toast.error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  }, []);

  const deleteTask = useCallback(async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Task deleted');
        setTodoistTasks(prev => prev.filter(t => t.id !== taskId));
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  }, []);

  const setTaskDueToday = useCallback(async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ due_string: 'today' }),
      });
      if (response.ok) {
        const today = new Date().toISOString().split('T')[0];
        setTodoistTasks(prev => prev.map(t =>
          t.id === taskId ? { ...t, due: { ...t.due, date: today, string: 'today' } } : t
        ));
        toast.success('Due date set to today');
      } else {
        toast.error('Failed to update due date');
      }
    } catch (error) {
      console.error('Error setting due date:', error);
      toast.error('Failed to update due date');
    }
  }, []);

  const resetTaskForm = useCallback(() => {
    setNewTaskContent('');
    setNewTaskDescription('');
    setNewTaskDueString('');
    setNewTaskProjectId('6VhG9MrQwJwqJJfW');
    setNewTaskSectionId('');
    setNewTaskPriority(1);
  }, []);

  const handleSaveTask = useCallback(async () => {
    if (!newTaskContent.trim()) {
      toast.error('Task content is required');
      return;
    }
    setCreatingTask(true);
    try {
      const taskData = {
        content: newTaskContent.trim(),
        description: newTaskDescription.trim() || undefined,
        project_id: newTaskProjectId,
        section_id: newTaskSectionId || undefined,
        due_string: newTaskDueString.trim() || undefined,
        priority: newTaskPriority,
      };
      const response = await fetch(`${BACKEND_URL}/todoist/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (response.ok) {
        toast.success('Task created!');
        resetTaskForm();
        setTaskModalOpen(false);
        fetchTodoistData();
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
    setCreatingTask(false);
  }, [newTaskContent, newTaskDescription, newTaskProjectId, newTaskSectionId, newTaskDueString, newTaskPriority, resetTaskForm, fetchTodoistData]);

  // Filter tasks by due date within scope range
  const filteredTasks = useMemo(() => {
    if (!scopeRange.start || !scopeRange.end) return todoistTasks;

    const startStr = scopeRange.start.toISOString().split('T')[0];
    const endStr = scopeRange.end.toISOString().split('T')[0];

    return todoistTasks.filter(task => {
      if (!task.due || !task.due.date) return false;
      const dueDate = task.due.date.split('T')[0]; // handle both date and datetime
      return dueDate >= startStr && dueDate <= endStr;
    });
  }, [todoistTasks, scopeRange]);

  // Group tasks by project
  const tasksByProject = useMemo(() => {
    const groups = {};
    filteredTasks.forEach(task => {
      const projectId = task.project_id;
      if (!groups[projectId]) {
        const project = todoistProjects.find(p => p.id === projectId);
        groups[projectId] = {
          projectName: project ? project.name : 'Unknown',
          tasks: [],
        };
      }
      groups[projectId].tasks.push(task);
    });
    return groups;
  }, [filteredTasks, todoistProjects]);

  // ==================== GOOGLE CALENDAR EVENTS ====================
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);

  useEffect(() => {
    // Only fetch calendar events for daily view
    if (scope !== 'daily') {
      setCalendarEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setCalendarLoading(true);
      try {
        const startOfDay = new Date(scopeDate + 'T00:00:00');
        const endOfDay = new Date(scopeDate + 'T23:59:59.999');

        const response = await fetch(
          `${BACKEND_URL}/google-calendar/events/all?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}`
        );

        if (response.ok) {
          const data = await response.json();
          setCalendarEvents(data.events || []);
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      } finally {
        setCalendarLoading(false);
      }
    };
    fetchEvents();
  }, [scope, scopeDate]);

  // ==================== WEEKLY PLANS (Supabase) ====================
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [weeklyPlansLoading, setWeeklyPlansLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentWeekNumber = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  }, []);

  useEffect(() => {
    const fetchWeeklyPlans = async () => {
      setWeeklyPlansLoading(true);
      try {
        const maxWeek = currentWeekNumber + 10;
        const { data, error } = await supabase
          .from('weekly_plans')
          .select('*')
          .eq('year', currentYear)
          .gte('week_number', currentWeekNumber)
          .lte('week_number', maxWeek)
          .order('week_number', { ascending: true });
        if (error) throw error;
        setWeeklyPlans(data || []);
      } catch (err) {
        console.error('Error fetching weekly plans:', err);
      } finally {
        setWeeklyPlansLoading(false);
      }
    };
    fetchWeeklyPlans();
  }, [currentYear, currentWeekNumber]);

  const updateWeeklyPlanLabel = useCallback(async (id, label) => {
    try {
      const { error } = await supabase
        .from('weekly_plans')
        .update({ label })
        .eq('id', id);
      if (error) throw error;
      setWeeklyPlans(prev => prev.map(wp => wp.id === id ? { ...wp, label } : wp));
    } catch (err) {
      console.error('Error updating weekly plan:', err);
      toast.error('Failed to update');
    }
  }, []);

  // ==================== RETURN ====================
  return {
    // Scope & navigation
    scope,
    setScope,
    scopeDate,
    setScopeDate,
    getScopeDate,
    getScopeDateLabel,
    navigateScopeDate,
    goToToday,
    normalizedScopeDate,

    // Priorities
    priorities,
    prioritiesForScope,
    prioritiesLoading,
    addPriority,
    togglePriority,
    deletePriority,

    // Todoist
    todoistTasks: filteredTasks,
    allTodoistTasks: todoistTasks,
    todoistProjects,
    tasksByProject,
    todoistLoading,
    completeTask,
    deleteTask,
    setTaskDueToday,
    handleSaveTask,
    resetTaskForm,
    taskModalOpen,
    setTaskModalOpen,
    newTaskContent,
    setNewTaskContent,
    newTaskDescription,
    setNewTaskDescription,
    newTaskDueString,
    setNewTaskDueString,
    newTaskProjectId,
    setNewTaskProjectId,
    newTaskSectionId,
    setNewTaskSectionId,
    newTaskPriority,
    setNewTaskPriority,
    creatingTask,

    // Calendar
    calendarEvents,
    calendarLoading,

    // Weekly plans
    weeklyPlans,
    weeklyPlansLoading,
    currentWeekNumber,
    updateWeeklyPlanLabel,
  };
};

export default usePlannerData;
