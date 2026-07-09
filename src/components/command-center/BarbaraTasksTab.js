import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FaClipboardList, FaTrash, FaCheck, FaPlus, FaEnvelope, FaWhatsapp, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const BARBARA_COLOR = '#14B8A6';

const FormSection = styled.div`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const ContextBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${props => props.theme === 'dark' ? '#0F2E2A' : '#ECFDF5'};
  border-bottom: 1px solid ${props => props.theme === 'dark' ? '#134E4A' : '#A7F3D0'};
  font-size: 12px;
  color: ${props => props.theme === 'dark' ? '#5EEAD4' : '#0F766E'};
  font-weight: 600;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#FFFFFF'};
  color: ${props => props.theme === 'dark' ? '#F9FAFB' : '#111827'};
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 64px;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${BARBARA_COLOR};
  }

  &::placeholder {
    color: ${props => props.theme === 'dark' ? '#6B7280' : '#9CA3AF'};
  }
`;

const AddButton = styled.button`
  width: 100%;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: ${BARBARA_COLOR};
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;

  &:hover { background: #0D9488; }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const TaskRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 14px;
  margin: 6px 12px;
  border-radius: 8px;
  background: ${props => props.theme === 'dark' ? '#1F2937' : '#F9FAFB'};
  border: 1px solid ${props => props.theme === 'dark' ? '#374151' : '#E5E7EB'};
`;

const CheckBox = styled.button`
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 5px;
  border: 1.5px solid ${props => props.$done ? BARBARA_COLOR : (props.theme === 'dark' ? '#4B5563' : '#D1D5DB')};
  background: ${props => props.$done ? BARBARA_COLOR : 'transparent'};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover { border-color: ${BARBARA_COLOR}; }
`;

const CONTEXT_ICONS = {
  email: FaEnvelope,
  whatsapp: FaWhatsapp,
  calendar: FaCalendarAlt,
  deals: FaDollarSign,
};

const BarbaraTasksTab = ({ theme, contextType, contextId, contextLabel, contactId, onTasksChanged }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!contextId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barbara_tasks')
        .select('*')
        .eq('context_id', contextId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error('Error fetching Barbara tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [contextId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAdd = async () => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    if (!contextId) { toast.error('Apri prima una comunicazione'); return; }

    setSaving(true);
    try {
      const rows = lines.map(instruction => ({
        instruction,
        context_type: contextType || null,
        context_label: contextLabel || null,
        context_id: contextId,
        contact_id: contactId || null,
      }));
      const { error } = await supabase.from('barbara_tasks').insert(rows);
      if (error) throw error;
      toast.success(lines.length === 1 ? 'Task aggiunto per Barbara' : `${lines.length} task aggiunti per Barbara`);
      setText('');
      fetchTasks();
      onTasksChanged && onTasksChanged();
    } catch (err) {
      console.error('Error adding Barbara task:', err);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    const nextStatus = task.status === 'done' ? 'pending' : 'done';
    // optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
    try {
      const { error } = await supabase
        .from('barbara_tasks')
        .update({ status: nextStatus, completed_at: nextStatus === 'done' ? new Date().toISOString() : null })
        .eq('id', task.id);
      if (error) throw error;
      onTasksChanged && onTasksChanged();
    } catch (err) {
      console.error('Error toggling Barbara task:', err);
      toast.error('Errore aggiornamento');
      fetchTasks();
    }
  };

  const handleDelete = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      const { error } = await supabase.from('barbara_tasks').delete().eq('id', taskId);
      if (error) throw error;
      onTasksChanged && onTasksChanged();
    } catch (err) {
      console.error('Error deleting Barbara task:', err);
      toast.error('Errore eliminazione');
      fetchTasks();
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const ContextIcon = CONTEXT_ICONS[contextType] || FaClipboardList;

  return (
    <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      {/* Context bar */}
      {contextId && (
        <ContextBar theme={theme}>
          <ContextIcon size={12} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contextLabel || 'Comunicazione aperta'}
          </span>
        </ContextBar>
      )}

      {/* Form */}
      <FormSection theme={theme}>
        <TextArea
          theme={theme}
          placeholder={"Dì a Barbara cosa fare con questa comunicazione…\nUna riga = un task."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          disabled={!contextId}
        />
        <AddButton onClick={handleAdd} disabled={saving || !text.trim() || !contextId}>
          <FaPlus size={11} />
          {saving ? 'Aggiungo…' : 'Aggiungi per Barbara'}
        </AddButton>
        <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginTop: '6px', textAlign: 'center' }}>
          ⌘/Ctrl + Invio per aggiungere
        </div>
      </FormSection>

      {/* Task list */}
      <div style={{ flex: 1, overflow: 'auto', paddingTop: '6px', paddingBottom: '12px' }}>
        {!contextId ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
            <FaClipboardList size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <div style={{ fontSize: '13px' }}>Apri un'email, chat o comunicazione<br />per lasciare istruzioni a Barbara</div>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
            Loading…
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
            <FaClipboardList size={24} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <div style={{ fontSize: '13px' }}>Nessun task per Barbara</div>
          </div>
        ) : (
          tasks.map(task => {
            const done = task.status === 'done';
            return (
              <TaskRow key={task.id} theme={theme}>
                <CheckBox theme={theme} $done={done} onClick={() => toggleDone(task)} title={done ? 'Segna come da fare' : 'Segna come fatto'}>
                  {done && <FaCheck size={9} />}
                </CheckBox>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '13px',
                    color: theme === 'dark' ? '#F9FAFB' : '#111827',
                    lineHeight: '1.4',
                    textDecoration: done ? 'line-through' : 'none',
                    opacity: done ? 0.55 : 1,
                    wordBreak: 'break-word',
                  }}>
                    {task.instruction}
                  </div>
                  <div style={{ fontSize: '10px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginTop: '3px' }}>
                    {new Date(task.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    {' · '}{new Date(task.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <FaTrash
                  size={10}
                  style={{ cursor: 'pointer', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', flexShrink: 0, marginTop: '3px' }}
                  onClick={() => handleDelete(task.id)}
                  onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                  onMouseLeave={e => e.currentTarget.style.color = theme === 'dark' ? '#6B7280' : '#9CA3AF'}
                />
              </TaskRow>
            );
          })
        )}
      </div>
    </div>
  );
};

export default BarbaraTasksTab;
