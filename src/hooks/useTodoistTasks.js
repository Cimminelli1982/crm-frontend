import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

/**
 * Custom hook for managing Todoist tasks and projects
 * Handles fetching, creating, updating, completing, and deleting tasks
 */
const useTodoistTasks = (activeActionTab, selectedThread) => {
  // Tasks and projects state
  const [todoistTasks, setTodoistTasks] = useState([]);
  const [todoistProjects, setTodoistProjects] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Task modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // New/Edit task form state
  const [newTaskContent, setNewTaskContent] = useState('');
  const [newTaskDueString, setNewTaskDueString] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('2335921711'); // Inbox
  const [newTaskSectionId, setNewTaskSectionId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(1);
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // UI state for collapsible sections
  const [expandedProjects, setExpandedProjects] = useState({ '2335921711': true }); // Only Inbox expanded by default
  const [expandedSections, setExpandedSections] = useState({}); // { sectionId: true/false }

  // Fetch Todoist tasks, projects, and sections
  const fetchTodoistData = useCallback(async () => {
    setLoadingTasks(true);
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

        // Nest sections inside their projects
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
    setLoadingTasks(false);
  }, []);

  // Load Todoist data when tasks tab is active
  useEffect(() => {
    if (activeActionTab === 'tasks') {
      fetchTodoistData();
    }
  }, [activeActionTab, fetchTodoistData]);

  // Reset task form
  const resetTaskForm = useCallback(() => {
    setNewTaskContent('');
    setNewTaskDescription('');
    setNewTaskDueString('');
    setNewTaskProjectId('2335921711');
    setNewTaskSectionId('');
    setNewTaskPriority(1);
    setEditingTask(null);
  }, []);

  // Create or update a task
  const handleSaveTask = useCallback(async () => {
    if (!newTaskContent.trim()) {
      toast.error('Task content is required');
      return;
    }

    setCreatingTask(true);
    try {
      const taskData = {
        content: newTaskContent.trim(),
        description: newTaskDescription.trim(),
        project_id: newTaskProjectId,
        section_id: newTaskSectionId || undefined,
        due_string: newTaskDueString || undefined,
        priority: newTaskPriority,
      };

      let response;
      if (editingTask) {
        response = await fetch(`${BACKEND_URL}/todoist/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
      } else {
        response = await fetch(`${BACKEND_URL}/todoist/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });
      }

      if (response.ok) {
        toast.success(editingTask ? 'Task updated!' : 'Task created!');
        setTaskModalOpen(false);
        resetTaskForm();
        // Small delay to let Todoist sync complete before refreshing
        setTimeout(() => fetchTodoistData(), 500);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
    setCreatingTask(false);
  }, [newTaskContent, newTaskDescription, newTaskProjectId, newTaskSectionId, newTaskDueString, newTaskPriority, editingTask, resetTaskForm, fetchTodoistData]);

  // Complete a task
  const handleCompleteTask = useCallback(async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}/close`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Task completed!');
        fetchTodoistData();
      } else {
        toast.error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  }, [fetchTodoistData]);

  // Delete a task
  const handleDeleteTask = useCallback(async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/todoist/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Task deleted');
        fetchTodoistData();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  }, [fetchTodoistData]);

  // Open edit mode for a task
  const openEditTask = useCallback((task) => {
    setEditingTask(task);
    setNewTaskContent(task.content);
    setNewTaskDescription(task.description || '');
    setNewTaskDueString(task.due?.string || '');
    setNewTaskProjectId(task.project_id);
    setNewTaskSectionId(task.section_id || '');
    setNewTaskPriority(task.priority);
    setTaskModalOpen(true);
  }, []);

  // Get project name by ID
  const getProjectName = useCallback((projectId) => {
    const project = todoistProjects.find(p => p.id === projectId);
    return project?.name || 'Unknown';
  }, [todoistProjects]);

  // Get section name by ID
  const getSectionName = useCallback((sectionId) => {
    for (const project of todoistProjects) {
      const section = project.sections?.find(s => s.id === sectionId);
      if (section) return section.name;
    }
    return null;
  }, [todoistProjects]);

  // Get project color
  const getProjectColor = useCallback((projectId) => {
    const project = todoistProjects.find(p => p.id === projectId);
    const colors = {
      'berry_red': '#b8255f',
      'red': '#db4035',
      'orange': '#ff9933',
      'yellow': '#fad000',
      'olive_green': '#afb83b',
      'lime_green': '#7ecc49',
      'green': '#299438',
      'mint_green': '#6accbc',
      'teal': '#158fad',
      'sky_blue': '#14aaf5',
      'light_blue': '#96c3eb',
      'blue': '#4073ff',
      'grape': '#884dff',
      'violet': '#af38eb',
      'lavender': '#eb96eb',
      'magenta': '#e05194',
      'salmon': '#ff8d85',
      'charcoal': '#808080',
      'grey': '#b8b8b8',
      'taupe': '#ccac93',
    };
    return colors[project?.color] || '#808080';
  }, [todoistProjects]);

  return {
    // Tasks and projects data
    todoistTasks,
    setTodoistTasks,
    todoistProjects,
    setTodoistProjects,
    loadingTasks,

    // Task modal state
    taskModalOpen,
    setTaskModalOpen,

    // Form state
    newTaskContent,
    setNewTaskContent,
    newTaskDueString,
    setNewTaskDueString,
    newTaskProjectId,
    setNewTaskProjectId,
    newTaskSectionId,
    setNewTaskSectionId,
    newTaskPriority,
    setNewTaskPriority,
    newTaskDescription,
    setNewTaskDescription,
    creatingTask,
    editingTask,
    setEditingTask,

    // UI state
    expandedProjects,
    setExpandedProjects,
    expandedSections,
    setExpandedSections,

    // Actions
    fetchTodoistData,
    handleSaveTask,
    handleCompleteTask,
    handleDeleteTask,
    resetTaskForm,
    openEditTask,

    // Helpers
    getProjectName,
    getSectionName,
    getProjectColor,
  };
};

export default useTodoistTasks;
