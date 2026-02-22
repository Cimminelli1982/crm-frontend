import React, { useState, useMemo, useCallback, useRef } from 'react';
import { FaPlus, FaTrash, FaArrowLeft, FaSave, FaSearch, FaTimes, FaCamera, FaDumbbell } from 'react-icons/fa';

const TEMPLATE_TYPES = ['Weights', 'Cardio', 'Pilates', 'HIIT', 'Yoga', 'Mixed'];

const WorkoutTemplatesView = ({ theme, healthHook }) => {
  const {
    workoutTemplates, workoutTemplatesLoading, exercises,
    addWorkoutTemplate, updateWorkoutTemplate, deleteWorkoutTemplate,
    addExercise, uploadHealthImage,
  } = healthHook;

  const templateImageInputRef = useRef(null);
  const [uploadingImageId, setUploadingImageId] = useState(null);

  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#111827' : '#fff';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const accentColor = '#8B5CF6';

  const [viewMode, setViewMode] = useState('list');
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Detail form
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('Weights');
  const [formDuration, setFormDuration] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTags, setFormTags] = useState('');
  const [exerciseRows, setExerciseRows] = useState([]);

  // Exercise search
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);

  // New exercise inline form
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExType, setNewExType] = useState('Strength');
  const [newExMuscle, setNewExMuscle] = useState('');

  // List filter
  const [listSearch, setListSearch] = useState('');

  const handleImageUpload = async (templateId, file) => {
    setUploadingImageId(templateId);
    await uploadHealthImage('workout_templates', templateId, file);
    setUploadingImageId(null);
  };

  const inputStyle = {
    padding: '8px 12px', borderRadius: '8px',
    border: `1px solid ${borderColor}`, backgroundColor: bgPrimary,
    color: textPrimary, fontSize: '13px', width: '100%', outline: 'none',
  };

  const labelStyle = {
    fontSize: '11px', color: textMuted, marginBottom: '4px', display: 'block',
    fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  // ---------- LIST MODE ----------

  const filteredTemplates = useMemo(() => {
    if (!listSearch.trim()) return workoutTemplates;
    const q = listSearch.toLowerCase();
    return workoutTemplates.filter(t => (t.name || '').toLowerCase().includes(q));
  }, [workoutTemplates, listSearch]);

  const openDetail = (template) => {
    setEditingTemplate(template);
    if (template) {
      setFormName(template.name || '');
      setFormType(template.template_type || 'Weights');
      setFormDuration(template.estimated_duration_min || '');
      setFormNotes(template.notes || '');
      setFormTags(template.tags || '');
      const rows = (template.workout_template_exercises || []).map(te => ({
        exercise_id: te.exercise_id,
        exercise: te.exercises,
        sets: te.sets || '',
        reps: te.reps || '',
        weight_kg: te.weight_kg || '',
        duration_min: te.duration_min || '',
        distance_km: te.distance_km || '',
        rest_seconds: te.rest_seconds || '',
        notes: te.notes || '',
      }));
      setExerciseRows(rows);
    } else {
      setFormName(''); setFormType('Weights'); setFormDuration('');
      setFormNotes(''); setFormTags(''); setExerciseRows([]);
    }
    setViewMode('detail');
  };

  const goBackToList = () => { setViewMode('list'); setEditingTemplate(null); };

  // ---------- EXERCISE SEARCH ----------

  const filteredExerciseOptions = useMemo(() => {
    if (exerciseSearch.length < 2) return [];
    const q = exerciseSearch.toLowerCase();
    const existingIds = new Set(exerciseRows.map(er => er.exercise_id));
    return exercises
      .filter(e => !existingIds.has(e.id) && (e.name || '').toLowerCase().includes(q))
      .slice(0, 10);
  }, [exerciseSearch, exercises, exerciseRows]);

  const addExerciseRow = (ex) => {
    const isStrength = ex.exercise_type === 'Strength';
    setExerciseRows(prev => [...prev, {
      exercise_id: ex.id, exercise: ex,
      sets: isStrength ? (ex.default_sets || 3) : '',
      reps: isStrength ? (ex.default_reps || 12) : '',
      weight_kg: '',
      duration_min: !isStrength ? (ex.default_duration_min || '') : '',
      distance_km: '',
      rest_seconds: isStrength ? 60 : '',
      notes: '',
    }]);
    setExerciseSearch('');
    setShowExerciseDropdown(false);
  };

  const removeExerciseRow = (index) => {
    setExerciseRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateExerciseRowField = (index, field, value) => {
    setExerciseRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ));
  };

  // ---------- SAVE / DELETE ----------

  const handleSave = async () => {
    if (!formName.trim()) return;
    const templateData = {
      name: formName.trim(),
      template_type: formType || null,
      estimated_duration_min: formDuration ? parseInt(formDuration) : null,
      notes: formNotes.trim() || null,
      tags: formTags.trim() || null,
    };
    const rows = exerciseRows.map(er => ({
      exercise_id: er.exercise_id,
      sets: er.sets ? parseInt(er.sets) : null,
      reps: er.reps ? parseInt(er.reps) : null,
      weight_kg: er.weight_kg ? parseFloat(er.weight_kg) : null,
      duration_min: er.duration_min ? parseInt(er.duration_min) : null,
      distance_km: er.distance_km ? parseFloat(er.distance_km) : null,
      rest_seconds: er.rest_seconds ? parseInt(er.rest_seconds) : null,
      notes: er.notes || null,
    }));

    if (editingTemplate) {
      await updateWorkoutTemplate(editingTemplate.id, templateData, rows);
    } else {
      await addWorkoutTemplate(templateData, rows);
    }
    goBackToList();
  };

  const handleSaveAsNew = async () => {
    if (!formName.trim()) return;
    const templateData = {
      name: formName.trim() + ' (copy)',
      template_type: formType || null,
      estimated_duration_min: formDuration ? parseInt(formDuration) : null,
      notes: formNotes.trim() || null,
      tags: formTags.trim() || null,
    };
    const rows = exerciseRows.map(er => ({
      exercise_id: er.exercise_id,
      sets: er.sets ? parseInt(er.sets) : null,
      reps: er.reps ? parseInt(er.reps) : null,
      weight_kg: er.weight_kg ? parseFloat(er.weight_kg) : null,
      duration_min: er.duration_min ? parseInt(er.duration_min) : null,
      distance_km: er.distance_km ? parseFloat(er.distance_km) : null,
      rest_seconds: er.rest_seconds ? parseInt(er.rest_seconds) : null,
      notes: er.notes || null,
    }));
    await addWorkoutTemplate(templateData, rows);
    goBackToList();
  };

  const handleDelete = async () => {
    if (!editingTemplate) return;
    if (window.confirm(`Delete template "${editingTemplate.name}"?`)) {
      await deleteWorkoutTemplate(editingTemplate.id);
      goBackToList();
    }
  };

  const handleCreateNewExercise = async () => {
    if (!newExName.trim()) return;
    const result = await addExercise({
      name: newExName.trim(),
      exercise_type: newExType,
      muscle_group: newExMuscle || null,
    });
    if (result) {
      addExerciseRow(result);
      setShowNewExerciseForm(false);
      setNewExName(''); setNewExType('Strength'); setNewExMuscle('');
    }
  };

  const typeColors = {
    Weights: '#F59E0B', Cardio: '#EF4444', Pilates: '#8B5CF6',
    HIIT: '#EC4899', Yoga: '#14B8A6', Mixed: '#3B82F6',
  };

  // ---------- RENDER ----------

  if (viewMode === 'list') {
    return (
      <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <input ref={templateImageInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
          onChange={(e) => { const file = e.target.files?.[0]; const id = templateImageInputRef.current?.dataset?.templateId; if (file && id) handleImageUpload(id, file); e.target.value = ''; }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
            <input type="text" value={listSearch} onChange={(e) => setListSearch(e.target.value)} placeholder="Search templates..." style={{ ...inputStyle, padding: '8px 12px 8px 30px', borderRadius: '8px' }} />
          </div>
          <div style={{ fontSize: '12px', color: textMuted }}>{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}</div>
          <button onClick={() => openDetail(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: accentColor, color: '#fff', fontSize: '12px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FaPlus size={10} /> Create Template
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {workoutTemplatesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>Loading templates...</div>
          ) : filteredTemplates.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
              {listSearch ? 'No templates match your search' : 'No templates yet. Create your first one!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {filteredTemplates.map(template => {
                const exCount = template.workout_template_exercises?.length || 0;
                const tColor = typeColors[template.template_type] || '#6B7280';
                return (
                  <div key={template.id} onClick={() => openDetail(template)} style={{
                    padding: '16px', borderRadius: '10px', backgroundColor: bgSecondary,
                    border: `1px solid ${borderColor}`, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {template.image_url ? (
                      <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                        <img src={template.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: '100%', height: '60px', borderRadius: '8px', marginBottom: '10px',
                        border: `1px dashed ${borderColor}`, backgroundColor: isDark ? '#1F293750' : '#F3F4F680',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, gap: '6px',
                      }}>
                        <FaDumbbell size={14} />
                        <span style={{ fontSize: '11px' }}>No photo</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, flex: 1 }}>{template.name}</div>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                        backgroundColor: tColor + '20', color: tColor,
                      }}>
                        {template.template_type || 'Mixed'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: textMuted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{exCount} exercise{exCount !== 1 ? 's' : ''}</span>
                      {template.estimated_duration_min && <span>{template.estimated_duration_min} min</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- DETAIL MODE ----------

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <input ref={templateImageInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
        onChange={(e) => { const file = e.target.files?.[0]; const id = templateImageInputRef.current?.dataset?.templateId; if (file && id) handleImageUpload(id, file); e.target.value = ''; }} />

      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <button onClick={goBackToList} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textSecondary, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaArrowLeft size={10} /> Back to templates
        </button>
      </div>

      {/* Hero image area */}
      {editingTemplate && (
        <div onClick={() => { templateImageInputRef.current.dataset.templateId = editingTemplate.id; templateImageInputRef.current.click(); }}
          style={{
            width: '100%', height: '200px', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
            border: editingTemplate.image_url ? 'none' : `2px dashed ${borderColor}`,
            backgroundColor: editingTemplate.image_url ? 'transparent' : (isDark ? '#1F2937' : '#F3F4F6'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploadingImageId === editingTemplate.id ? 0.5 : 1,
          }} title="Click to upload hero image">
          {editingTemplate.image_url ? (
            <img src={editingTemplate.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', color: textMuted }}>
              <FaCamera size={24} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>Click to add hero image</div>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '16px' }}>
        {editingTemplate ? `Edit: ${editingTemplate.name}` : 'Create New Template'}
      </div>

      {/* Form fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Name *</label>
          <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Template name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={formType} onChange={(e) => setFormType(e.target.value)} style={inputStyle}>
            {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Est. Duration (min)</label>
          <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="45" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tags</label>
          <input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="push, pull..." style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Template notes..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Exercise table */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '10px' }}>
          Exercises ({exerciseRows.length})
        </div>

        <div style={{ position: 'relative', marginBottom: '10px', maxWidth: '400px' }}>
          <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input type="text" value={exerciseSearch}
            onChange={(e) => { setExerciseSearch(e.target.value); setShowExerciseDropdown(true); }}
            onFocus={() => setShowExerciseDropdown(true)}
            placeholder="Search exercise to add... (min 2 chars)" style={{ ...inputStyle, padding: '8px 12px 8px 30px' }} />
          {showExerciseDropdown && exerciseSearch.length >= 2 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              backgroundColor: bgPrimary, border: `1px solid ${borderColor}`, borderRadius: '8px',
              maxHeight: '250px', overflow: 'auto', marginTop: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {filteredExerciseOptions.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: '12px', color: textMuted }}>
                  No exercises found.
                  <button onClick={() => { setShowNewExerciseForm(true); setShowExerciseDropdown(false); setNewExName(exerciseSearch); }}
                    style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', border: 'none', backgroundColor: accentColor, color: '#fff', fontSize: '11px', cursor: 'pointer' }}>
                    Create new
                  </button>
                </div>
              ) : (
                <>
                  {filteredExerciseOptions.map(ex => (
                    <div key={ex.id} onClick={() => addExerciseRow(ex)}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: textSecondary, borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                      <span style={{ fontWeight: 500 }}>{ex.name}</span>
                      <span style={{ float: 'right', color: textMuted, fontSize: '11px' }}>{ex.exercise_type} {ex.muscle_group && `- ${ex.muscle_group}`}</span>
                    </div>
                  ))}
                  <div onClick={() => { setShowNewExerciseForm(true); setShowExerciseDropdown(false); setNewExName(exerciseSearch); }}
                    style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: accentColor, fontWeight: 500 }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <FaPlus size={10} style={{ marginRight: 6 }} /> Create new exercise
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* New exercise inline form */}
        {showNewExerciseForm && (
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: bgSecondary, border: `1px solid ${borderColor}`, marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '8px' }}>New Exercise</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input value={newExName} onChange={(e) => setNewExName(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={newExType} onChange={(e) => setNewExType(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }}>
                  <option value="Strength">Strength</option>
                  <option value="Cardio">Cardio</option>
                  <option value="Flexibility">Flexibility</option>
                  <option value="Balance">Balance</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Muscle Group</label>
                <input value={newExMuscle} onChange={(e) => setNewExMuscle(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} placeholder="e.g. Legs" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={handleCreateNewExercise} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#10B981', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
                <FaSave size={10} /> Save & Add
              </button>
              <button onClick={() => { setShowNewExerciseForm(false); setNewExName(''); setNewExType('Strength'); setNewExMuscle(''); }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted, fontSize: '12px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Exercises table */}
        {exerciseRows.length > 0 && (
          <div style={{ borderRadius: '8px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: bgSecondary }}>
                  {['Exercise', 'Type', 'Sets', 'Reps', 'Weight (kg)', 'Duration', 'Distance (km)', 'Rest (s)', 'Notes', ''].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Exercise' || h === 'Type' || h === 'Notes' ? 'left' : h === '' ? 'center' : 'right',
                      padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exerciseRows.map((row, idx) => {
                  const isStrength = row.exercise?.exercise_type === 'Strength';
                  const isCardio = row.exercise?.exercise_type === 'Cardio';
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}>
                      <td style={{ padding: '6px 10px', color: textSecondary }}>{row.exercise?.name || 'Unknown'}</td>
                      <td style={{ padding: '6px 10px', color: textMuted, fontSize: '11px' }}>{row.exercise?.exercise_type || '-'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {isStrength ? (
                          <input type="number" value={row.sets} onChange={(e) => updateExerciseRowField(idx, 'sets', e.target.value)}
                            style={{ width: '50px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                        ) : <span style={{ color: textMuted }}>-</span>}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {isStrength ? (
                          <input type="number" value={row.reps} onChange={(e) => updateExerciseRowField(idx, 'reps', e.target.value)}
                            style={{ width: '50px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                        ) : <span style={{ color: textMuted }}>-</span>}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {isStrength ? (
                          <input type="number" step="0.5" value={row.weight_kg} onChange={(e) => updateExerciseRowField(idx, 'weight_kg', e.target.value)}
                            style={{ width: '60px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                        ) : <span style={{ color: textMuted }}>-</span>}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {!isStrength ? (
                          <input type="number" value={row.duration_min} onChange={(e) => updateExerciseRowField(idx, 'duration_min', e.target.value)}
                            style={{ width: '55px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                        ) : <span style={{ color: textMuted }}>-</span>}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {isCardio ? (
                          <input type="number" step="0.1" value={row.distance_km} onChange={(e) => updateExerciseRowField(idx, 'distance_km', e.target.value)}
                            style={{ width: '60px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                        ) : <span style={{ color: textMuted }}>-</span>}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        {isStrength ? (
                          <input type="number" value={row.rest_seconds} onChange={(e) => updateExerciseRowField(idx, 'rest_seconds', e.target.value)}
                            style={{ width: '50px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                        ) : <span style={{ color: textMuted }}>-</span>}
                      </td>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="text" value={row.notes} onChange={(e) => updateExerciseRowField(idx, 'notes', e.target.value)} placeholder="..."
                          style={{ width: '80px', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary, fontSize: '12px', outline: 'none' }} />
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button onClick={() => removeExerciseRow(idx)} style={{ padding: '2px 6px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}>
                          <FaTimes size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: `1px solid ${borderColor}`, flexShrink: 0 }}>
        <button onClick={handleSave} disabled={!formName.trim()} style={{
          padding: '10px 20px', borderRadius: '8px', border: 'none',
          backgroundColor: !formName.trim() ? (isDark ? '#374151' : '#E5E7EB') : accentColor,
          color: !formName.trim() ? textMuted : '#fff', fontSize: '13px', fontWeight: 500,
          cursor: formName.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <FaSave size={12} /> {editingTemplate ? 'Update Template' : 'Create Template'}
        </button>
        {editingTemplate && (
          <>
            <button onClick={handleSaveAsNew} style={{
              padding: '10px 20px', borderRadius: '8px', border: `1px solid ${borderColor}`,
              backgroundColor: 'transparent', color: accentColor, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}>
              Save as New
            </button>
            <button onClick={handleDelete} style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#EF444420', color: '#EF4444', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <FaTrash size={12} /> Delete
            </button>
          </>
        )}
        <button onClick={goBackToList} style={{
          padding: '10px 20px', borderRadius: '8px', border: 'none',
          backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textSecondary, fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <FaArrowLeft size={12} /> Back
        </button>
      </div>
    </div>
  );
};

export default WorkoutTemplatesView;
