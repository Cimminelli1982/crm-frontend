import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaEdit, FaDumbbell, FaCamera,
} from 'react-icons/fa';

const SESSION_TYPES = [
  'Weights', 'Cardio', 'Pilates', 'HIIT', 'Yoga', 'Walking', 'Stretching', 'Swimming',
];

const TYPE_COLORS = {
  Pilates: '#8B5CF6', Cardio: '#EF4444', Weights: '#F59E0B',
  Walking: '#10B981', Stretching: '#3B82F6', HIIT: '#EC4899',
  Yoga: '#14B8A6', Swimming: '#06B6D4',
};

const TrainingPlanningView = ({ theme, healthHook }) => {
  const {
    selectedTrainingDate, setSelectedTrainingDate,
    sessionsForDate, dailyTrainingSummary,
    exercises, workoutTemplates,
    addTrainingSession, deleteTrainingSession,
    updateSessionExercises, updateTrainingSession,
    getSessionExerciseRows, sessionExercises,
    addExercise, uploadHealthImage,
  } = healthHook;

  const sessionImageInputRef = useRef(null);
  const [uploadingSessionImageId, setUploadingSessionImageId] = useState(null);

  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#111827' : '#fff';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const handleSessionImageUpload = async (sessionId, file) => {
    setUploadingSessionImageId(sessionId);
    await uploadHealthImage('training_sessions', sessionId, file);
    setUploadingSessionImageId(null);
  };

  // ---------- DATE NAVIGATION ----------

  const dateObj = useMemo(() => new Date(selectedTrainingDate + 'T12:00:00'), [selectedTrainingDate]);
  const dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const navigateDate = (offset) => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + offset);
    setSelectedTrainingDate(d.toISOString().split('T')[0]);
  };

  const goToToday = () => setSelectedTrainingDate(new Date().toISOString().split('T')[0]);
  const isToday = selectedTrainingDate === new Date().toISOString().split('T')[0];

  // ---------- SESSION EDITOR STATE ----------

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editorMode, setEditorMode] = useState('scratch');
  const [editorName, setEditorName] = useState('');
  const [editorType, setEditorType] = useState('Weights');
  const [editorDuration, setEditorDuration] = useState('');
  const [editorNotes, setEditorNotes] = useState('');
  const [editorTemplateId, setEditorTemplateId] = useState('');
  const [editorExerciseRows, setEditorExerciseRows] = useState([]);
  const [editorExSearch, setEditorExSearch] = useState('');
  const [showEditorExDropdown, setShowEditorExDropdown] = useState(false);

  // New exercise inline form
  const [showEditorNewEx, setShowEditorNewEx] = useState(false);
  const [editorNewExName, setEditorNewExName] = useState('');
  const [editorNewExType, setEditorNewExType] = useState('Strength');
  const [editorNewExMuscle, setEditorNewExMuscle] = useState('');

  const handleOpenEditor = useCallback((session, mode) => {
    setEditingSession(session);
    setEditorMode(mode || 'scratch');
    setEditorTemplateId('');
    setEditorExSearch('');
    setShowEditorExDropdown(false);
    setShowEditorNewEx(false);

    if (session) {
      setEditorName(session.name || session.session_type || '');
      setEditorType(session.session_type || 'Weights');
      setEditorDuration(session.duration_min ? String(session.duration_min) : '');
      setEditorNotes(session.notes || '');
      const seRows = getSessionExerciseRows(session.id);
      setEditorExerciseRows(seRows.map(se => ({
        exercise_id: se.exercise_id,
        exercise: se.exercises,
        sets_completed: se.sets_completed || '',
        reps_completed: se.reps_completed || '',
        weight_kg: se.weight_kg || '',
        duration_min: se.duration_min || '',
        distance_km: se.distance_km || '',
        notes: se.notes || '',
      })));
    } else {
      setEditorName('');
      setEditorType('Weights');
      setEditorDuration('');
      setEditorNotes('');
      setEditorExerciseRows([]);
    }
    setEditorOpen(true);
  }, [getSessionExerciseRows]);

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingSession(null);
  };

  // Load template into editor
  const loadTemplateIntoEditor = () => {
    const template = workoutTemplates.find(t => String(t.id) === String(editorTemplateId));
    if (!template) return;
    setEditorName(template.name);
    setEditorType(template.template_type || 'Weights');
    setEditorDuration(template.estimated_duration_min ? String(template.estimated_duration_min) : '');
    setEditorNotes(template.notes || '');
    const rows = (template.workout_template_exercises || []).map(te => ({
      exercise_id: te.exercise_id,
      exercise: te.exercises,
      sets_completed: te.sets || '',
      reps_completed: te.reps || '',
      weight_kg: te.weight_kg || '',
      duration_min: te.duration_min || '',
      distance_km: te.distance_km || '',
      notes: te.notes || '',
    }));
    setEditorExerciseRows(rows);
    setEditorMode('scratch');
  };

  // Exercise search
  const editorExOptions = useMemo(() => {
    if (editorExSearch.length < 2) return [];
    const q = editorExSearch.toLowerCase();
    const existingIds = new Set(editorExerciseRows.map(r => r.exercise_id));
    return exercises
      .filter(e => !existingIds.has(e.id) && (e.name || '').toLowerCase().includes(q))
      .slice(0, 10);
  }, [editorExSearch, exercises, editorExerciseRows]);

  const editorAddEx = (ex) => {
    const isStrength = (ex.exercise_type || 'Strength') === 'Strength';
    setEditorExerciseRows(prev => [...prev, {
      exercise_id: ex.id,
      exercise: ex,
      sets_completed: isStrength ? (ex.default_sets || 3) : '',
      reps_completed: isStrength ? (ex.default_reps || 12) : '',
      weight_kg: '',
      duration_min: !isStrength ? (ex.default_duration_min || '') : '',
      distance_km: '',
      notes: '',
    }]);
    setEditorExSearch('');
    setShowEditorExDropdown(false);
  };

  const editorRemoveEx = (idx) => {
    setEditorExerciseRows(prev => prev.filter((_, i) => i !== idx));
  };

  const editorUpdateRow = (idx, field, value) => {
    setEditorExerciseRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, [field]: value } : r
    ));
  };

  // Save session
  const handleEditorSave = async () => {
    const exerciseRows = editorExerciseRows.map(r => ({
      exercise_id: r.exercise_id,
      sets_completed: r.sets_completed ? Number(r.sets_completed) : null,
      reps_completed: r.reps_completed ? Number(r.reps_completed) : null,
      weight_kg: r.weight_kg ? Number(r.weight_kg) : null,
      duration_min: r.duration_min ? Number(r.duration_min) : null,
      distance_km: r.distance_km ? Number(r.distance_km) : null,
      notes: r.notes || null,
    }));

    if (editingSession) {
      await updateTrainingSession(editingSession.id, {
        session_type: editorType,
        duration_min: editorDuration ? parseInt(editorDuration) : null,
        notes: editorNotes || null,
        name: editorName || null,
      });
      await updateSessionExercises(editingSession.id, exerciseRows);
    } else {
      await addTrainingSession(
        selectedTrainingDate,
        editorType,
        editorDuration ? parseInt(editorDuration) : null,
        editorNotes || null,
        null,
        editorName || null,
        exerciseRows,
      );
    }
    closeEditor();
  };

  // Create new exercise inline
  const handleEditorCreateEx = async () => {
    if (!editorNewExName.trim()) return;
    const result = await addExercise({
      name: editorNewExName.trim(),
      exercise_type: editorNewExType,
      muscle_group: editorNewExMuscle || null,
    });
    if (result) {
      editorAddEx(result);
      setShowEditorNewEx(false);
      setEditorNewExName('');
      setEditorNewExType('Strength');
      setEditorNewExMuscle('');
    }
  };

  // Editor totals
  const editorTotalDuration = useMemo(() => {
    return editorExerciseRows.reduce((sum, r) => sum + (Number(r.duration_min) || 0), 0);
  }, [editorExerciseRows]);

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: bgPrimary,
    color: textPrimary,
    fontSize: '13px',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: '11px', color: textMuted, marginBottom: '4px', display: 'block',
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  // ---------- RENDER ----------

  return (
    <div style={{ padding: '24px' }}>
      <input
        ref={sessionImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = sessionImageInputRef.current?.dataset?.sessionId;
          if (file && id) handleSessionImageUpload(Number(id), file);
          e.target.value = '';
        }}
      />

      {/* Date navigation + summary */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px',
        padding: '14px 16px', borderRadius: '10px', backgroundColor: bgSecondary,
        border: `1px solid ${borderColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={() => navigateDate(-1)}
            style={{
              padding: '8px', borderRadius: '8px', border: `1px solid ${borderColor}`,
              backgroundColor: bgPrimary, color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <FaChevronLeft size={12} />
          </button>
          <div style={{ textAlign: 'center', minWidth: '90px' }}>
            <div style={{ fontSize: '10px', color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {dayOfWeek}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: textPrimary }}>
              {dateLabel}
            </div>
          </div>
          <button
            onClick={() => navigateDate(1)}
            style={{
              padding: '8px', borderRadius: '8px', border: `1px solid ${borderColor}`,
              backgroundColor: bgPrimary, color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <FaChevronRight size={12} />
          </button>
          {!isToday && (
            <button
              onClick={goToToday}
              style={{
                padding: '5px 10px', borderRadius: '6px', border: 'none',
                backgroundColor: '#8B5CF6', color: '#fff', fontSize: '11px',
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Today
            </button>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#8B5CF6' }}>{dailyTrainingSummary.sessionCount}</div>
            <div style={{ fontSize: '10px', color: textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Sessions</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#8B5CF6' }}>{dailyTrainingSummary.totalDuration}</div>
            <div style={{ fontSize: '10px', color: textMuted, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Minutes</div>
          </div>
          {sessionsForDate.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {sessionsForDate.map(s => (
                <span key={s.id} style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                  backgroundColor: (TYPE_COLORS[s.session_type] || '#6B7280') + '20',
                  color: TYPE_COLORS[s.session_type] || '#6B7280',
                }}>
                  {s.session_type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Session cards — 3-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {sessionsForDate.map(session => {
          const seRows = getSessionExerciseRows(session.id);
          const typeColor = TYPE_COLORS[session.session_type] || '#6B7280';
          const templateExercises = session.workout_templates?.workout_template_exercises || [];
          const displayRows = seRows.length > 0 ? seRows : templateExercises;

          return (
            <div key={session.id} style={{
              borderRadius: '12px', backgroundColor: bgSecondary,
              border: `1px solid ${borderColor}`, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Image area */}
              {(() => {
                const sessionImg = session.image_url
                  || session.workout_templates?.image_url
                  || null;
                return sessionImg ? (
                  <div
                    onClick={() => { sessionImageInputRef.current.dataset.sessionId = session.id; sessionImageInputRef.current.click(); }}
                    style={{
                      width: '100%', height: 180, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isDark ? '#0F172A' : '#F3F4F6',
                      opacity: uploadingSessionImageId === session.id ? 0.5 : 1,
                    }}
                    title="Click to change photo"
                  >
                    <img src={sessionImg} alt="" style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div
                    onClick={() => { sessionImageInputRef.current.dataset.sessionId = session.id; sessionImageInputRef.current.click(); }}
                    style={{
                      width: '100%', height: 180,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isDark ? '#0F172A' : '#F3F4F6',
                      cursor: 'pointer',
                    }}
                    title="Click to upload photo"
                  >
                    <div style={{ textAlign: 'center', color: textMuted }}>
                      <FaCamera size={24} />
                      <div style={{ fontSize: '10px', marginTop: '6px' }}>Add photo</div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Type badge + duration */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px',
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                    backgroundColor: typeColor + '20', color: typeColor,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {session.session_type}
                  </span>
                  {session.duration_min && (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: textSecondary }}>
                      {session.duration_min} min
                    </span>
                  )}
                </div>

                {/* Session name */}
                <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginBottom: '8px' }}>
                  {session.name || session.workout_templates?.name || session.session_type}
                </div>

                {/* Exercise list */}
                {displayRows.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                    {displayRows.map((row, idx) => {
                      const ex = row.exercises;
                      if (!ex) return null;
                      const isStrength = (ex.exercise_type || 'Strength') === 'Strength';
                      const sets = row.sets_completed || row.sets;
                      const reps = row.reps_completed || row.reps;
                      const weight = row.weight_kg;
                      const dur = row.duration_min;
                      const dist = row.distance_km;

                      return (
                        <div key={row.id || idx} style={{
                          display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '5px 8px', borderRadius: '6px',
                          backgroundColor: isDark ? '#111827' : '#F9FAFB',
                          border: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ex.name}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, fontSize: '11px', fontWeight: 600 }}>
                            {isStrength ? (
                              <span style={{ color: typeColor }}>
                                {sets && reps ? `${sets}x${reps}` : ''}
                                {weight ? ` ${weight}kg` : ''}
                              </span>
                            ) : (
                              <span style={{ color: typeColor }}>
                                {dur ? `${dur} min` : ''}
                                {dist ? ` ${dist} km` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '4px', marginTop: 'auto' }}>
                  <button
                    onClick={() => handleOpenEditor(session, 'scratch')}
                    title="Edit"
                    style={{ padding: '7px 0', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: '#3B82F6', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Delete this session?')) deleteTrainingSession(session.id); }}
                    title="Delete"
                    style={{ padding: '7px 0', borderRadius: '6px', border: `1px solid ${borderColor}`, backgroundColor: 'transparent', color: '#EF4444', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add Session placeholder */}
        <div
          onClick={() => handleOpenEditor(null, 'template')}
          style={{
            borderRadius: '12px',
            border: `2px dashed ${borderColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: '280px', cursor: 'pointer',
            backgroundColor: 'transparent',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.backgroundColor = isDark ? '#1F293720' : '#F9FAFB'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <div style={{ textAlign: 'center', color: textMuted }}>
            <FaPlus size={24} />
            <div style={{ fontSize: '12px', marginTop: '8px', fontWeight: 500 }}>Add Session</div>
          </div>
        </div>
      </div>

      {/* ========== SESSION EDITOR MODAL ========== */}
      {editorOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEditor(); }}
        >
          <div style={{
            width: '650px', maxHeight: '80vh', overflow: 'auto',
            backgroundColor: bgPrimary, borderRadius: '12px',
            border: `1px solid ${borderColor}`, padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                {editingSession ? 'Edit Session' : 'Add Session'}
              </div>
              <button
                onClick={closeEditor}
                style={{ padding: '4px 8px', border: 'none', borderRadius: '4px', backgroundColor: 'transparent', color: textMuted, cursor: 'pointer', fontSize: '16px' }}
              >
                &times;
              </button>
            </div>

            {/* Template picker (if from-template mode) */}
            {editorMode === 'template' && editorExerciseRows.length === 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Select Template</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={editorTemplateId}
                    onChange={(e) => setEditorTemplateId(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="">Choose a template...</option>
                    {workoutTemplates.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.template_type})</option>
                    ))}
                  </select>
                  <button
                    onClick={loadTemplateIntoEditor}
                    disabled={!editorTemplateId}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', border: 'none',
                      backgroundColor: editorTemplateId ? '#8B5CF6' : (isDark ? '#374151' : '#E5E7EB'),
                      color: editorTemplateId ? '#fff' : textMuted,
                      fontSize: '12px', cursor: editorTemplateId ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Load
                  </button>
                </div>
                <div style={{ margin: '12px 0', textAlign: 'center', fontSize: '12px', color: textMuted }}>
                  - or -
                </div>
                <button
                  onClick={() => setEditorMode('scratch')}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: `1px solid ${borderColor}`,
                    backgroundColor: 'transparent', color: textSecondary,
                    fontSize: '12px', cursor: 'pointer', width: '100%',
                  }}
                >
                  Build from scratch
                </button>
              </div>
            )}

            {/* Session form fields */}
            {(editorMode === 'scratch' || editorExerciseRows.length > 0) && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Session Name</label>
                    <input
                      value={editorName}
                      onChange={(e) => setEditorName(e.target.value)}
                      placeholder="e.g. Leg Day"
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  <div style={{ width: '140px' }}>
                    <label style={labelStyle}>Type</label>
                    <select
                      value={editorType}
                      onChange={(e) => setEditorType(e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                    >
                      {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={labelStyle}>Duration</label>
                    <input
                      type="number"
                      value={editorDuration}
                      onChange={(e) => setEditorDuration(e.target.value)}
                      placeholder="min"
                      style={{ ...inputStyle, width: '100%', textAlign: 'center' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={labelStyle}>Notes</label>
                  <input
                    value={editorNotes}
                    onChange={(e) => setEditorNotes(e.target.value)}
                    placeholder="Optional notes..."
                    style={{ ...inputStyle, width: '100%' }}
                  />
                </div>

                {/* Exercise search */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={editorExSearch}
                    onChange={(e) => { setEditorExSearch(e.target.value); setShowEditorExDropdown(true); }}
                    onFocus={() => setShowEditorExDropdown(true)}
                    placeholder="Search exercise to add... (min 2 chars)"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                  {showEditorExDropdown && editorExSearch.length >= 2 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      backgroundColor: bgPrimary, border: `1px solid ${borderColor}`, borderRadius: '8px',
                      maxHeight: '200px', overflow: 'auto', marginTop: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                      {editorExOptions.length === 0 ? (
                        <div style={{ padding: '10px 12px', fontSize: '12px', color: textMuted }}>
                          No match.
                          <button
                            onClick={() => { setShowEditorNewEx(true); setShowEditorExDropdown(false); setEditorNewExName(editorExSearch); }}
                            style={{
                              marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', border: 'none',
                              backgroundColor: '#8B5CF6', color: '#fff', fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            Create new
                          </button>
                        </div>
                      ) : (
                        <>
                          {editorExOptions.map(ex => (
                            <div
                              key={ex.id}
                              onClick={() => editorAddEx(ex)}
                              style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: textSecondary,
                                borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                                display: 'flex', justifyContent: 'space-between',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <span style={{ fontWeight: 500 }}>{ex.name}</span>
                              <span style={{ color: textMuted, fontSize: '11px' }}>
                                {ex.exercise_type} {ex.muscle_group ? `· ${ex.muscle_group}` : ''}
                              </span>
                            </div>
                          ))}
                          <div
                            onClick={() => { setShowEditorNewEx(true); setShowEditorExDropdown(false); setEditorNewExName(editorExSearch); }}
                            style={{
                              padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: '#8B5CF6', fontWeight: 500,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <FaPlus size={10} style={{ marginRight: 6 }} /> Create new exercise
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* New exercise inline */}
                {showEditorNewEx && (
                  <div style={{
                    padding: '10px', borderRadius: '8px', backgroundColor: bgSecondary,
                    border: `1px solid ${borderColor}`, marginBottom: '10px',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px', alignItems: 'end' }}>
                      <div>
                        <label style={labelStyle}>Name *</label>
                        <input value={editorNewExName} onChange={(e) => setEditorNewExName(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Type</label>
                        <select value={editorNewExType} onChange={(e) => setEditorNewExType(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }}>
                          {['Strength', 'Cardio', 'Flexibility', 'Balance'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Muscle</label>
                        <input value={editorNewExMuscle} onChange={(e) => setEditorNewExMuscle(e.target.value)} placeholder="e.g. Legs" style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button onClick={handleEditorCreateEx} style={{ padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#10B981', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Save & Add</button>
                      <button onClick={() => setShowEditorNewEx(false)} style={{ padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted, fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Exercise table */}
                {editorExerciseRows.length > 0 && (
                  <div style={{ borderRadius: '8px', border: `1px solid ${borderColor}`, overflow: 'hidden', marginBottom: '12px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ backgroundColor: bgSecondary }}>
                          <th style={{ textAlign: 'left', padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px' }}>Exercise</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px' }}>Sets</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px' }}>Reps</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px' }}>Weight</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px' }}>Dur</th>
                          <th style={{ textAlign: 'right', padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px' }}>Dist</th>
                          <th style={{ textAlign: 'center', padding: '8px 6px', color: textMuted, fontWeight: 500, fontSize: '11px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {editorExerciseRows.map((row, idx) => {
                          const ex = row.exercise;
                          const isStrength = (ex?.exercise_type || 'Strength') === 'Strength';
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}>
                              <td style={{ padding: '6px 10px', color: textSecondary }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FaDumbbell size={10} style={{ color: TYPE_COLORS[ex?.exercise_type === 'Cardio' ? 'Cardio' : 'Weights'] || '#6B7280' }} />
                                  <span style={{ fontWeight: 500 }}>{ex?.name || 'Unknown'}</span>
                                  <span style={{ fontSize: '9px', color: textMuted }}>({ex?.exercise_type || 'Strength'})</span>
                                </div>
                              </td>
                              <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                                {isStrength ? (
                                  <input type="number" value={row.sets_completed} onChange={(e) => editorUpdateRow(idx, 'sets_completed', e.target.value)}
                                    style={{ width: '45px', textAlign: 'right', padding: '3px 4px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                                ) : <span style={{ color: textMuted }}>-</span>}
                              </td>
                              <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                                {isStrength ? (
                                  <input type="number" value={row.reps_completed} onChange={(e) => editorUpdateRow(idx, 'reps_completed', e.target.value)}
                                    style={{ width: '45px', textAlign: 'right', padding: '3px 4px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                                ) : <span style={{ color: textMuted }}>-</span>}
                              </td>
                              <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                                {isStrength ? (
                                  <input type="number" value={row.weight_kg} onChange={(e) => editorUpdateRow(idx, 'weight_kg', e.target.value)}
                                    placeholder="kg" style={{ width: '55px', textAlign: 'right', padding: '3px 4px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                                ) : <span style={{ color: textMuted }}>-</span>}
                              </td>
                              <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                                {!isStrength ? (
                                  <input type="number" value={row.duration_min} onChange={(e) => editorUpdateRow(idx, 'duration_min', e.target.value)}
                                    placeholder="min" style={{ width: '50px', textAlign: 'right', padding: '3px 4px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                                ) : <span style={{ color: textMuted }}>-</span>}
                              </td>
                              <td style={{ padding: '6px 6px', textAlign: 'right' }}>
                                {!isStrength ? (
                                  <input type="number" value={row.distance_km} onChange={(e) => editorUpdateRow(idx, 'distance_km', e.target.value)}
                                    placeholder="km" step="0.1" style={{ width: '50px', textAlign: 'right', padding: '3px 4px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                                ) : <span style={{ color: textMuted }}>-</span>}
                              </td>
                              <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                                <button onClick={() => editorRemoveEx(idx)} style={{ padding: '2px 6px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}>
                                  &times;
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Summary row */}
                        <tr style={{ backgroundColor: bgSecondary, fontWeight: 600 }}>
                          <td style={{ padding: '8px 10px', color: textPrimary }}>
                            Total ({editorExerciseRows.length} exercises)
                          </td>
                          <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', color: textMuted, fontSize: '11px' }}>
                            {editorExerciseRows.filter(r => (r.exercise?.exercise_type || 'Strength') === 'Strength').length} strength
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#8B5CF6', fontSize: '11px' }}>
                            {editorTotalDuration > 0 ? `${editorTotalDuration} min` : ''}
                          </td>
                          <td colSpan={2} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer buttons */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleEditorSave}
                    style={{
                      padding: '10px 18px', borderRadius: '8px', border: 'none',
                      backgroundColor: '#8B5CF6', color: '#fff', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {editingSession ? 'Update Session' : 'Save Session'}
                  </button>
                  <button
                    onClick={closeEditor}
                    style={{
                      padding: '10px 18px', borderRadius: '8px', border: 'none',
                      backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textSecondary,
                      fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPlanningView;
