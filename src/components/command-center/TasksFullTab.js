import React, { useState, useEffect, useCallback } from 'react';
import {
  FaTasks, FaPlus, FaSearch, FaFolder, FaSave, FaTrash, FaCheck,
  FaLink, FaUser, FaBuilding, FaDollarSign, FaSync, FaExternalLinkAlt,
  FaChevronRight, FaChevronDown, FaCalendarAlt, FaFlag, FaFilter,
  FaClock, FaCheckCircle, FaCircle, FaInbox, FaBirthdayCake, FaHome, FaBriefcase,
  FaExclamationTriangle, FaWhatsapp, FaPaperclip, FaFileImage, FaFilePdf, FaFile, FaTimes
} from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BACKEND_URL = 'https://command-center-backend-production.up.railway.app';

// Project options for filtering
const PROJECTS = [
  { id: 'Today', label: 'Today', color: '#10B981' },
  { id: 'all', label: 'All Projects', color: '#6B7280' },
  { id: 'Inbox', label: 'Inbox', color: '#808080' },
  { id: 'Work', label: 'Work', color: '#4073ff' },
  { id: 'Personal', label: 'Personal', color: '#b8255f' },
  { id: 'Team', label: 'Team', color: '#808080' },
  { id: 'Birthdays 🎂', label: 'Birthdays', color: '#db4035' },
];

// Status sections
const STATUS_SECTIONS = [
  { id: 'open', label: 'Open', icon: FaCircle, color: '#10B981' },
  { id: 'completed', label: 'Completed', icon: FaCheckCircle, color: '#6B7280' },
];

// Section definitions with colors and icons
const SECTIONS = [
  { id: 'thisWeek', name: 'This Week', color: '#EF4444', icon: FaClock },
  { id: 'nextWeek', name: 'Next Week', color: '#F97316', icon: FaClock },
  { id: 'thisMonth', name: 'This Month', color: '#F59E0B', icon: FaCalendarAlt },
  { id: 'thisSprint', name: 'This Sprint', color: '#8B5CF6', icon: FaFlag },
  { id: 'thisYear', name: 'This Year', color: '#3B82F6', icon: FaCalendarAlt },
  { id: 'nextYear', name: 'Next Year', color: '#6366F1', icon: FaCalendarAlt },
  { id: 'someday', name: 'Someday', color: '#6B7280', icon: FaCircle },
];

// Section ID mapping (Todoist section IDs by project)
const SECTION_IDS = {
  'Personal': {
    'This Week': '212234199',
    'Next Week': '212234187',
    'This Month': '212234192',
    'This Sprint': '212234194',
    'This Year': '212234189',
    'Next Year': '212234193',
    'Someday': '212234190',
  },
  'Work': {
    'This Week': '212234191',
    'Next Week': '212234200',
    'This Month': '212234196',
    'This Sprint': '212234188',
    'This Year': '212234195',
    'Next Year': '212234198',
    'Someday': '212234197',
  },
  'Birthdays 🎂': {
    'This Week': '212234230',
    'Next Week': '212234232',
    'This Month': '212234228',
    'This Sprint': '212234233',
    'This Year': '212234231',
    'Next Year': '212234227',
    'Someday': '212234229',
  },
  'Team': {
    'Rosaria': '212756755',
    'Katherine': '213491890',
  },
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

const TasksFullTab = ({ theme, onLinkedContactsChange, onLinkedChatsChange, onLinkedCompaniesChange, onLinkedDealsChange }) => {
  // Tasks list state
  const [tasks, setTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('Today');
  const [expandedSections, setExpandedSections] = useState({
    open: true,
    thisWeek: true,
    nextWeek: true,
    thisMonth: true,
    thisSprint: true,
    thisYear: false,
    nextYear: false,
    someday: false,
    completed: false,
    rosaria: true,
    katherine: true,
    // Today view sections
    todayInbox: true,
    todayDue: true,
    todayThisWeek: true,
    todayDelegated: true,
    todayRecentlyCompleted: false,
  });

  // Selected task state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueString, setEditDueString] = useState('');
  const [editPriority, setEditPriority] = useState(1);
  const [editProjectName, setEditProjectName] = useState('Inbox');
  const [editSectionName, setEditSectionName] = useState('');
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
  const [linkedChats, setLinkedChats] = useState([]);
  const [linkedFiles, setLinkedFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkType, setLinkType] = useState(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState([]);
  const [linkSearching, setLinkSearching] = useState(false);

  // Section selection modal (for moving from Inbox to Personal/Work)
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [pendingProjectName, setPendingProjectName] = useState(null);

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
          task_deals(deal:deals(deal_id, opportunity)),
          task_chats(chat:chats(id, chat_name, is_group_chat)),
          task_files(*)
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
          task_deals(deal:deals(deal_id, opportunity)),
          task_chats(chat:chats(id, chat_name, is_group_chat)),
          task_files(*)
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

  // Notify parent when linkedChats changes (for WhatsApp panel)
  useEffect(() => {
    onLinkedChatsChange?.(linkedChats);
  }, [linkedChats, onLinkedChatsChange]);

  // Notify parent of linked companies changes
  useEffect(() => {
    onLinkedCompaniesChange?.(linkedCompanies);
  }, [linkedCompanies, onLinkedCompaniesChange]);

  // Notify parent of linked deals changes
  useEffect(() => {
    onLinkedDealsChange?.(linkedDeals);
  }, [linkedDeals, onLinkedDealsChange]);

  // Load task into editor
  const loadTask = useCallback((task) => {
    setSelectedTask(task);
    setEditContent(task.content || '');
    setEditDescription(task.description || '');
    setEditDueString(task.due_string || task.due_date || '');
    setEditPriority(task.priority || 1);
    setEditProjectName(task.todoist_project_name || 'Inbox');
    setEditSectionName(task.todoist_section_name || '');
    setIsEditing(true);
    setIsCreating(false);

    // Set linked entities
    setLinkedContacts(task.task_contacts?.map(tc => tc.contact).filter(Boolean) || []);
    setLinkedCompanies(task.task_companies?.map(tc => tc.company).filter(Boolean) || []);
    setLinkedDeals(task.task_deals?.map(td => td.deal).filter(Boolean) || []);
    setLinkedChats(task.task_chats?.map(tc => tc.chat).filter(Boolean) || []);
    setLinkedFiles(task.task_files || []);
  }, []);

  // Start new task
  const startNewTask = () => {
    setSelectedTask(null);
    setEditContent('');
    setEditDescription('');
    setEditDueString('');
    setEditPriority(1);
    setEditProjectName('Inbox');
    setEditSectionName('');
    setIsEditing(true);
    setIsCreating(true);
    setLinkedContacts([]);
    setLinkedCompanies([]);
    setLinkedDeals([]);
    setLinkedChats([]);
    setLinkedFiles([]);
  };

  // Fetch image from URL and convert to File
  const fetchImageAsFile = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();

      // Extract filename from URL or generate one
      let fileName = imageUrl.split('/').pop().split('?')[0];
      if (!fileName || fileName.length > 100) {
        const ext = blob.type.split('/')[1] || 'png';
        fileName = `image-${Date.now()}.${ext}`;
      }

      return new File([blob], fileName, { type: blob.type });
    } catch (err) {
      console.error('Error fetching image from URL:', err);
      throw err;
    }
  };

  // Handle file drop event - supports both files and image URLs
  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);

    if (!selectedTask?.task_id) {
      toast.error('Save task first to add files');
      return;
    }

    // First try to get files directly
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
      return;
    }

    // If no files, try to get image URL from HTML or URI
    const html = e.dataTransfer.getData('text/html');
    const uri = e.dataTransfer.getData('text/uri-list');

    let imageUrl = null;

    // Try to extract URL from HTML (img src)
    if (html) {
      const match = html.match(/src="([^"]+)"/);
      if (match && match[1]) {
        imageUrl = match[1];
      }
    }

    // Fallback to URI list
    if (!imageUrl && uri) {
      imageUrl = uri.split('\n')[0];
    }

    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      setUploadingFile(true);
      try {
        const file = await fetchImageAsFile(imageUrl);
        await handleFileUpload([file]);
      } catch (err) {
        toast.error('Could not fetch image. Try downloading and uploading manually.');
      } finally {
        setUploadingFile(false);
      }
    }
  };

  // File upload handler
  const handleFileUpload = async (files) => {
    if (!selectedTask?.task_id || files.length === 0) return;

    setUploadingFile(true);
    try {
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${selectedTask.task_id}/${Date.now()}-${file.name}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('task-attachments')
          .getPublicUrl(fileName);

        // Insert into task_files
        const { data: fileData, error: fileError } = await supabase
          .from('task_files')
          .insert({
            task_id: selectedTask.task_id,
            file_name: file.name,
            file_path: urlData.publicUrl,
            file_type: file.type,
            file_size: file.size,
          })
          .select()
          .single();

        if (fileError) throw fileError;

        setLinkedFiles(prev => [...prev, fileData]);
      }
      toast.success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
      setIsDraggingFile(false);
    }
  };

  // Delete file handler
  const handleDeleteFile = async (fileId, filePath) => {
    try {
      // Extract storage path from URL
      const storagePath = filePath.split('/task-attachments/')[1];

      // Delete from storage
      if (storagePath) {
        await supabase.storage
          .from('task-attachments')
          .remove([storagePath]);
      }

      // Delete from database
      await supabase
        .from('task_files')
        .delete()
        .eq('file_id', fileId);

      setLinkedFiles(prev => prev.filter(f => f.file_id !== fileId));
      toast.success('File deleted');
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Failed to delete file');
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return FaFileImage;
    if (fileType === 'application/pdf') return FaFilePdf;
    return FaFile;
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
      } else if (type === 'chat') {
        const { data } = await supabase
          .from('chats')
          .select('id, chat_name, is_group_chat')
          .ilike('chat_name', `%${query}%`)
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
      } else if (linkType === 'chat') {
        await supabase.from('task_chats').insert({
          task_id: selectedTask.task_id,
          chat_id: entity.id,
        });
        setLinkedChats(prev => [...prev, entity]);
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
      } else if (type === 'chat') {
        await supabase.from('task_chats').delete()
          .eq('task_id', selectedTask.task_id)
          .eq('chat_id', id);
        setLinkedChats(prev => prev.filter(c => c.id !== id));
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

    // Map category ID to section name
    const sectionNameMap = {
      'thisWeek': 'This Week',
      'nextWeek': 'Next Week',
      'thisMonth': 'This Month',
      'thisSprint': 'This Sprint',
      'thisYear': 'This Year',
      'nextYear': 'Next Year',
      'someday': 'Someday',
      'rosaria': 'Rosaria',
      'katherine': 'Katherine',
    };

    const newSectionName = sectionNameMap[targetCategory];
    if (!newSectionName) return;

    // Get the section ID for this project
    const projectName = draggedTask.todoist_project_name || 'Personal';
    const newSectionId = SECTION_IDS[projectName]?.[newSectionName];

    try {
      // Update in Supabase
      await supabase
        .from('tasks')
        .update({
          todoist_section_name: newSectionName,
          todoist_section_id: newSectionId,
          updated_at: new Date().toISOString(),
        })
        .eq('task_id', draggedTask.task_id);

      // Sync to Todoist if linked and we have a section ID
      if (draggedTask.todoist_id && newSectionId) {
        try {
          await fetch(`${BACKEND_URL}/todoist/tasks/${draggedTask.todoist_id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section_id: newSectionId }),
          });
        } catch (syncErr) {
          console.warn('Failed to sync to Todoist:', syncErr);
        }
      }

      toast.success(`Moved to ${newSectionName}`);
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

  // Categorize open tasks by todoist_section_name
  const thisWeekTasks = filteredTasks.filter(t => t.todoist_section_name === 'This Week');
  const nextWeekTasks = filteredTasks.filter(t => t.todoist_section_name === 'Next Week');
  const thisMonthTasks = filteredTasks.filter(t => t.todoist_section_name === 'This Month');
  const thisSprintTasks = filteredTasks.filter(t => t.todoist_section_name === 'This Sprint');
  const thisYearTasks = filteredTasks.filter(t => t.todoist_section_name === 'This Year');
  const nextYearTasks = filteredTasks.filter(t => t.todoist_section_name === 'Next Year');
  const somedayTasks = filteredTasks.filter(t => t.todoist_section_name === 'Someday' || !t.todoist_section_name);

  // Team project sections
  const rosariaTasks = filteredTasks.filter(t => t.todoist_section_name === 'Rosaria');
  const katherineTasks = filteredTasks.filter(t => t.todoist_section_name === 'Katherine');

  // Today view sections (work on all open tasks, not filtered by project)
  const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const todayInboxTasks = tasks.filter(t => t.todoist_project_name === 'Inbox');
  const todayDueTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const taskDate = t.due_date.split('T')[0];
    return taskDate === todayDate;
  });
  // Get IDs of tasks already shown in "Due Today" to avoid duplicates
  const todayDueTaskIds = new Set(todayDueTasks.map(t => t.task_id));
  const todayThisWeekTasks = tasks.filter(t =>
    t.todoist_section_name === 'This Week' &&
    (t.todoist_project_name === 'Work' || t.todoist_project_name === 'Personal') &&
    !todayDueTaskIds.has(t.task_id)
  );
  const todayDelegatedTasks = tasks.filter(t => t.todoist_project_name === 'Team');
  const todayRecentlyCompletedTasks = completedTasks.slice(0, 10);

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
          ) : selectedProject === 'Today' ? (
            /* TODAY VIEW - Special layout with 5 top-level sections */
            <>
              {/* Inbox Section */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, todayInbox: !prev.todayInbox }))}
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
                  {expandedSections.todayInbox ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaInbox size={12} style={{ color: '#808080' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                    Inbox
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: todayInboxTasks.length > 0 ? '#EF4444' : '#6B7280' }}>
                    {todayInboxTasks.length}
                  </span>
                </div>
                {expandedSections.todayInbox && todayInboxTasks.length > 0 && (
                  <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {todayInboxTasks.map(task => (
                      <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                    ))}
                  </div>
                )}
              </div>

              {/* Due Today Section */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, todayDue: !prev.todayDue }))}
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
                  {expandedSections.todayDue ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaCalendarAlt size={12} style={{ color: '#EF4444' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                    Due Today
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: todayDueTasks.length > 0 ? '#EF4444' : '#6B7280' }}>
                    {todayDueTasks.length}
                  </span>
                </div>
                {expandedSections.todayDue && todayDueTasks.length > 0 && (
                  <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {todayDueTasks.map(task => (
                      <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                    ))}
                  </div>
                )}
              </div>

              {/* This Week Section */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, todayThisWeek: !prev.todayThisWeek }))}
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
                  {expandedSections.todayThisWeek ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaClock size={12} style={{ color: '#F97316' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                    This Week
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#F97316' }}>
                    {todayThisWeekTasks.length}
                  </span>
                </div>
                {expandedSections.todayThisWeek && todayThisWeekTasks.length > 0 && (
                  <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {todayThisWeekTasks.map(task => (
                      <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                    ))}
                  </div>
                )}
              </div>

              {/* Delegated Section */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, todayDelegated: !prev.todayDelegated }))}
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
                  {expandedSections.todayDelegated ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaUser size={12} style={{ color: '#8B5CF6' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                    Delegated
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#8B5CF6' }}>
                    {todayDelegatedTasks.length}
                  </span>
                </div>
                {expandedSections.todayDelegated && todayDelegatedTasks.length > 0 && (
                  <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {todayDelegatedTasks.map(task => (
                      <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                    ))}
                  </div>
                )}
              </div>

              {/* Recently Completed Section */}
              <div style={{ marginBottom: '16px' }}>
                <div
                  onClick={() => setExpandedSections(prev => ({ ...prev, todayRecentlyCompleted: !prev.todayRecentlyCompleted }))}
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
                  {expandedSections.todayRecentlyCompleted ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                  <FaCheckCircle size={12} style={{ color: '#10B981' }} />
                  <span style={{ fontWeight: 600, fontSize: '13px', color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
                    Recently Completed
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>
                    {todayRecentlyCompletedTasks.length}
                  </span>
                </div>
                {expandedSections.todayRecentlyCompleted && todayRecentlyCompletedTasks.length > 0 && (
                  <div style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {todayRecentlyCompletedTasks.map(task => (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                    ))}
                  </div>
                )}
              </div>
            </>
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
                    {/* Render all sections dynamically */}
                    {(selectedProject === 'Team' ? [
                      { id: 'rosaria', name: 'Rosaria', tasks: rosariaTasks, color: '#808080', Icon: FaUser },
                      { id: 'katherine', name: 'Katherine', tasks: katherineTasks, color: '#808080', Icon: FaUser },
                    ] : [
                      { id: 'thisWeek', name: 'This Week', tasks: thisWeekTasks, color: '#EF4444', Icon: FaClock },
                      { id: 'nextWeek', name: 'Next Week', tasks: nextWeekTasks, color: '#F97316', Icon: FaClock },
                      { id: 'thisMonth', name: 'This Month', tasks: thisMonthTasks, color: '#F59E0B', Icon: FaCalendarAlt },
                      { id: 'thisSprint', name: 'This Sprint', tasks: thisSprintTasks, color: '#8B5CF6', Icon: FaFlag },
                      { id: 'thisYear', name: 'This Year', tasks: thisYearTasks, color: '#3B82F6', Icon: FaCalendarAlt },
                      { id: 'nextYear', name: 'Next Year', tasks: nextYearTasks, color: '#6366F1', Icon: FaCalendarAlt },
                      { id: 'someday', name: 'Someday', tasks: somedayTasks, color: '#6B7280', Icon: FaCircle },
                    ]).map(section => (
                      <div
                        key={section.id}
                        style={{ marginBottom: '12px' }}
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        <div
                          onClick={() => setExpandedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: dragOverCategory === section.id
                              ? (theme === 'dark' ? '#4B5563' : '#D1D5DB')
                              : (theme === 'dark' ? '#374151' : '#E5E7EB'),
                            border: dragOverCategory === section.id ? `2px dashed ${section.color}` : '2px solid transparent',
                            cursor: 'pointer',
                            marginBottom: '6px',
                            transition: 'all 0.2s',
                          }}
                        >
                          {expandedSections[section.id] ? <FaChevronDown size={8} /> : <FaChevronRight size={8} />}
                          <section.Icon size={10} style={{ color: section.color }} />
                          <span style={{
                            fontWeight: 500,
                            fontSize: '12px',
                            color: theme === 'dark' ? '#F9FAFB' : '#111827',
                          }}>
                            {section.name}
                          </span>
                          <span style={{
                            marginLeft: 'auto',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: section.color,
                          }}>
                            {section.tasks.length}
                          </span>
                        </div>
                        {expandedSections[section.id] && section.tasks.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {section.tasks.map(task => (
                              <TaskItem key={task.task_id} task={task} theme={theme} selectedTask={selectedTask} loadTask={loadTask} handleComplete={handleComplete} getPriorityColor={getPriorityColor} onDragStart={handleDragStart} onInlineEdit={handleInlineEdit} editingTaskId={editingTaskId} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
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

              {/* Due Date - Only show when NOT in Inbox */}
              {editProjectName !== 'Inbox' && (
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
                </div>
              )}

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

                  {/* WhatsApp Chats */}
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
                      <FaWhatsapp size={9} style={{ color: '#25D366' }} /> WhatsApp Chats
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={() => { setLinkType('chat'); setShowLinkModal(true); }}
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
                      {linkedChats.length === 0 ? (
                        <span style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontStyle: 'italic' }}>
                          No chats linked
                        </span>
                      ) : (
                        linkedChats.map(chat => (
                          <div
                            key={chat.id}
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
                            <FaWhatsapp size={10} style={{ color: '#25D366' }} />
                            {chat.chat_name}
                            {chat.is_group_chat && (
                              <span style={{ fontSize: '9px', color: '#6B7280' }}>(group)</span>
                            )}
                            <button
                              onClick={() => removeLink('chat', chat.id)}
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

              {/* Files Section */}
              {!isCreating && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    borderRadius: '8px',
                    border: `2px dashed ${isDraggingFile ? '#3B82F6' : (theme === 'dark' ? '#374151' : '#E5E7EB')}`,
                    background: isDraggingFile ? (theme === 'dark' ? '#1E3A5F20' : '#EFF6FF') : 'transparent',
                    transition: 'all 0.2s',
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                  }}
                  onDrop={handleFileDrop}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: linkedFiles.length > 0 ? '10px' : '0',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}>
                      <FaPaperclip size={11} /> Files ({linkedFiles.length})
                    </span>
                    <label style={{
                      color: '#3B82F6',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <FaPlus size={9} /> Add
                      <input
                        type="file"
                        multiple
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                      />
                    </label>
                  </div>

                  {uploadingFile && (
                    <div style={{
                      padding: '8px',
                      textAlign: 'center',
                      color: '#3B82F6',
                      fontSize: '12px',
                    }}>
                      Uploading...
                    </div>
                  )}

                  {linkedFiles.length === 0 && !uploadingFile && (
                    <div style={{
                      textAlign: 'center',
                      padding: '12px',
                      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                      fontSize: '11px',
                    }}>
                      {isDraggingFile ? 'Drop files here' : 'Drag & drop files or click Add'}
                    </div>
                  )}

                  {linkedFiles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {linkedFiles.map(file => {
                        const FileIcon = getFileIcon(file.file_type);
                        const isImage = file.file_type?.startsWith('image/');
                        return (
                          <div
                            key={file.file_id}
                            style={{
                              position: 'relative',
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                              background: theme === 'dark' ? '#1F2937' : '#F9FAFB',
                            }}
                          >
                            {isImage ? (
                              <a href={file.file_path} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={file.file_path}
                                  alt={file.file_name}
                                  style={{
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </a>
                            ) : (
                              <a
                                href={file.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  width: '80px',
                                  height: '80px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textDecoration: 'none',
                                  color: theme === 'dark' ? '#D1D5DB' : '#374151',
                                  padding: '8px',
                                }}
                              >
                                <FileIcon size={24} style={{ marginBottom: '4px' }} />
                                <span style={{
                                  fontSize: '9px',
                                  textAlign: 'center',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '70px',
                                }}>
                                  {file.file_name}
                                </span>
                              </a>
                            )}
                            <button
                              onClick={() => handleDeleteFile(file.file_id, file.file_path)}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(239, 68, 68, 0.9)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                              }}
                            >
                              <FaTimes size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Project and Section Dropdowns */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ flex: 1 }}>
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
                    onChange={async (e) => {
                      const newProject = e.target.value;
                      setEditProjectName(newProject);
                      // Reset section to first available for this project
                      const availableSections = Object.keys(SECTION_IDS[newProject] || {});
                      const newSection = availableSections.length > 0 ? availableSections[0] : '';
                      setEditSectionName(newSection);

                      if (selectedTask && !isCreating) {
                        const sectionId = SECTION_IDS[newProject]?.[newSection];
                        // Update Supabase
                        await supabase
                          .from('tasks')
                          .update({
                            todoist_project_name: newProject,
                            todoist_section_name: newSection,
                            todoist_section_id: sectionId || null,
                            updated_at: new Date().toISOString(),
                          })
                          .eq('task_id', selectedTask.task_id);

                        // Sync to Todoist
                        if (selectedTask.todoist_id && sectionId) {
                          try {
                            await fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ section_id: sectionId }),
                            });
                          } catch (err) {
                            console.warn('Failed to sync project/section to Todoist:', err);
                          }
                        }
                        toast.success(`Moved to ${newProject} → ${newSection}`);
                        fetchTasks();
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                      color: theme === 'dark' ? '#F9FAFB' : '#111827',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Inbox">Inbox</option>
                    <option value="Personal">Personal</option>
                    <option value="Work">Work</option>
                    <option value="Team">Team</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
                    marginBottom: '6px',
                    display: 'block',
                  }}>
                    Section
                  </label>
                  <select
                    value={editSectionName}
                    onChange={async (e) => {
                      const newSection = e.target.value;
                      setEditSectionName(newSection);

                      if (selectedTask && !isCreating) {
                        const sectionId = SECTION_IDS[editProjectName]?.[newSection];
                        // Update Supabase
                        await supabase
                          .from('tasks')
                          .update({
                            todoist_section_name: newSection,
                            todoist_section_id: sectionId || null,
                            updated_at: new Date().toISOString(),
                          })
                          .eq('task_id', selectedTask.task_id);

                        // Sync to Todoist
                        if (selectedTask.todoist_id && sectionId) {
                          try {
                            await fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ section_id: sectionId }),
                            });
                          } catch (err) {
                            console.warn('Failed to sync section to Todoist:', err);
                          }
                        }
                        toast.success(`Moved to ${newSection}`);
                        fetchTasks();
                      }
                    }}
                    disabled={editProjectName === 'Inbox'}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme === 'dark' ? '#4B5563' : '#D1D5DB'}`,
                      background: editProjectName === 'Inbox'
                        ? (theme === 'dark' ? '#111827' : '#F3F4F6')
                        : (theme === 'dark' ? '#1F2937' : '#FFFFFF'),
                      color: editProjectName === 'Inbox'
                        ? (theme === 'dark' ? '#6B7280' : '#9CA3AF')
                        : (theme === 'dark' ? '#F9FAFB' : '#111827'),
                      fontSize: '13px',
                      cursor: editProjectName === 'Inbox' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {editProjectName === 'Inbox' ? (
                      <option value="">No sections</option>
                    ) : (
                      Object.keys(SECTION_IDS[editProjectName] || {}).map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))
                    )}
                  </select>
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
                Link {linkType === 'contact' ? 'Contact' : linkType === 'company' ? 'Company' : linkType === 'deal' ? 'Deal' : 'WhatsApp Chat'}
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
                      key={entity.contact_id || entity.company_id || entity.deal_id || entity.id}
                      onClick={() => addLink(entity)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: theme === 'dark' ? '#374151' : '#F3F4F6',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: theme === 'dark' ? '#F9FAFB' : '#111827',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      {linkType === 'chat' && <FaWhatsapp size={14} style={{ color: '#25D366' }} />}
                      {linkType === 'contact'
                        ? `${entity.first_name} ${entity.last_name}`
                        : linkType === 'company'
                        ? entity.name
                        : linkType === 'deal'
                        ? entity.opportunity
                        : entity.chat_name}
                      {linkType === 'chat' && entity.is_group_chat && (
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>(group)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Selection Modal */}
      {showSectionModal && (
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
            width: '350px',
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
                Move to {pendingProjectName}
              </h3>
              <button
                onClick={() => {
                  setShowSectionModal(false);
                  setPendingProjectName(null);
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
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '13px',
                color: theme === 'dark' ? '#9CA3AF' : '#6B7280',
              }}>
                Select a section:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'This Week', color: '#EF4444' },
                  { name: 'Next Week', color: '#F97316' },
                  { name: 'This Month', color: '#F59E0B' },
                  { name: 'This Sprint', color: '#8B5CF6' },
                  { name: 'This Year', color: '#3B82F6' },
                  { name: 'Next Year', color: '#6366F1' },
                  { name: 'Someday', color: '#6B7280' },
                ].map(section => (
                  <button
                    key={section.name}
                    onClick={async () => {
                      if (!selectedTask || !pendingProjectName) return;

                      const sectionId = SECTION_IDS[pendingProjectName]?.[section.name];

                      // Update Supabase with project and section
                      await supabase
                        .from('tasks')
                        .update({
                          todoist_project_name: pendingProjectName,
                          todoist_section_name: section.name,
                          todoist_section_id: sectionId,
                          updated_at: new Date().toISOString(),
                        })
                        .eq('task_id', selectedTask.task_id);

                      // Sync to Todoist
                      if (selectedTask.todoist_id && sectionId) {
                        try {
                          await fetch(`${BACKEND_URL}/todoist/tasks/${selectedTask.todoist_id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ section_id: sectionId }),
                          });
                        } catch (err) {
                          console.warn('Failed to sync to Todoist:', err);
                        }
                      }

                      toast.success(`Moved to ${pendingProjectName} → ${section.name}`);
                      setShowSectionModal(false);
                      setPendingProjectName(null);

                      // Refresh and reload the same task to see the changes
                      await fetchTasks();

                      // Reload the task to show updated data
                      const { data: updatedTask } = await supabase
                        .from('tasks')
                        .select('*')
                        .eq('task_id', selectedTask.task_id)
                        .single();

                      if (updatedTask) {
                        loadTask(updatedTask);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: `2px solid ${section.color}40`,
                      background: theme === 'dark' ? '#374151' : '#F9FAFB',
                      color: section.color,
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = `${section.color}20`;
                      e.target.style.borderColor = section.color;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = theme === 'dark' ? '#374151' : '#F9FAFB';
                      e.target.style.borderColor = `${section.color}40`;
                    }}
                  >
                    {section.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksFullTab;
