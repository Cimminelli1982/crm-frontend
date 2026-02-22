import React, { useState, useMemo, useRef } from 'react';
import { FaPlus, FaTrash, FaSave, FaSort, FaSortUp, FaSortDown, FaSearch, FaCamera } from 'react-icons/fa';

const MUSCLE_GROUPS = ['Legs', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Full Body'];
const EXERCISE_TYPES = ['Strength', 'Cardio', 'Flexibility', 'Balance'];

const ExercisesView = ({ theme, healthHook }) => {
  const {
    exercises, exercisesLoading,
    addExercise, updateExercise, deleteExercise,
    uploadHealthImage,
  } = healthHook;

  const fileInputRef = useRef(null);
  const [uploadingImageId, setUploadingImageId] = useState(null);

  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#111827' : '#fff';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const accentColor = '#8B5CF6';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Extract unique muscle groups with counts
  const muscleGroupCounts = useMemo(() => {
    const map = {};
    exercises.forEach(e => {
      const mg = e.muscle_group || 'Uncategorized';
      map[mg] = (map[mg] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [exercises]);

  // Editable cell state
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState('');

  // New exercise row
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    name: '', muscle_group: '', equipment: '', exercise_type: 'Strength',
    default_sets: '', default_reps: '', default_duration_min: '',
  });

  const filteredExercises = useMemo(() => {
    let list = [...exercises];
    if (selectedMuscleGroup !== 'all') {
      list = list.filter(e =>
        (e.muscle_group || '').toLowerCase() === selectedMuscleGroup.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.equipment || '').toLowerCase().includes(q) ||
        (e.muscle_group || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = (aVal || '').toLowerCase();
      if (typeof bVal === 'string') bVal = (bVal || '').toLowerCase();
      if (['default_sets', 'default_reps', 'default_duration_min'].includes(sortField)) {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [exercises, searchQuery, selectedMuscleGroup, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <FaSort size={10} style={{ opacity: 0.3, marginLeft: 4 }} />;
    return sortDir === 'asc'
      ? <FaSortUp size={10} style={{ marginLeft: 4 }} />
      : <FaSortDown size={10} style={{ marginLeft: 4 }} />;
  };

  const startEdit = (id, field, currentValue) => {
    setEditingCell({ id, field });
    setEditingValue(currentValue ?? '');
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const original = exercises.find(e => e.id === id);
    const originalValue = original?.[field];

    let value = editingValue;
    if (['default_sets', 'default_reps', 'default_duration_min'].includes(field)) {
      value = value === '' ? null : parseInt(value);
    }

    if (String(value ?? '') !== String(originalValue ?? '')) {
      await updateExercise(id, { [field]: value });
    }
    setEditingCell(null);
    setEditingValue('');
  };

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') { setEditingCell(null); setEditingValue(''); }
  };

  const handleAddNew = async () => {
    if (!newRow.name.trim()) return;
    const data = {
      name: newRow.name.trim(),
      muscle_group: newRow.muscle_group.trim() || null,
      equipment: newRow.equipment.trim() || null,
      exercise_type: newRow.exercise_type || 'Strength',
      default_sets: newRow.default_sets ? parseInt(newRow.default_sets) : null,
      default_reps: newRow.default_reps ? parseInt(newRow.default_reps) : null,
      default_duration_min: newRow.default_duration_min ? parseInt(newRow.default_duration_min) : null,
    };
    const result = await addExercise(data);
    if (result) {
      setNewRow({ name: '', muscle_group: '', equipment: '', exercise_type: 'Strength', default_sets: '', default_reps: '', default_duration_min: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete exercise "${name}"? This cannot be undone.`)) {
      deleteExercise(id);
    }
  };

  const handleImageUpload = async (exerciseId, file) => {
    setUploadingImageId(exerciseId);
    await uploadHealthImage('exercises', exerciseId, file);
    setUploadingImageId(null);
  };

  const inputStyle = {
    padding: '4px 8px',
    borderRadius: '4px',
    border: `1px solid ${borderColor}`,
    backgroundColor: bgPrimary,
    color: textPrimary,
    fontSize: '12px',
    width: '100%',
    outline: 'none',
  };

  const thStyle = (align = 'left') => ({
    textAlign: align,
    padding: '10px 10px',
    color: textMuted,
    fontWeight: 500,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: `1px solid ${borderColor}`,
    backgroundColor: bgSecondary,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  });

  const tdStyle = (align = 'left') => ({
    padding: '8px 10px',
    color: textSecondary,
    fontSize: '13px',
    textAlign: align,
    borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
  });

  const columns = [
    { key: 'image_url', label: '', align: 'center', width: '56px' },
    { key: 'name', label: 'Name', align: 'left' },
    { key: 'muscle_group', label: 'Muscle Group', align: 'left' },
    { key: 'equipment', label: 'Equipment', align: 'left' },
    { key: 'exercise_type', label: 'Type', align: 'left' },
    { key: 'default_sets', label: 'Sets', align: 'right' },
    { key: 'default_reps', label: 'Reps', align: 'right' },
    { key: 'default_duration_min', label: 'Duration', align: 'right' },
  ];

  const editableFields = ['name', 'muscle_group', 'equipment', 'exercise_type', 'default_sets', 'default_reps', 'default_duration_min'];

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = fileInputRef.current?.dataset?.exerciseId;
          if (file && id) handleImageUpload(id, file);
          e.target.value = '';
        }}
      />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises by name, equipment..."
            style={{
              ...inputStyle,
              padding: '8px 12px 8px 30px',
              fontSize: '13px',
              borderRadius: '8px',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: textMuted }}>
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: accentColor, color: '#fff', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <FaPlus size={10} /> Add New
          </button>
        )}
      </div>

      {/* Muscle group filter */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0 }}>
        <button
          onClick={() => setSelectedMuscleGroup('all')}
          style={{
            padding: '5px 12px', borderRadius: '16px',
            border: `1px solid ${selectedMuscleGroup === 'all' ? accentColor : borderColor}`,
            backgroundColor: selectedMuscleGroup === 'all' ? accentColor : 'transparent',
            color: selectedMuscleGroup === 'all' ? '#fff' : textSecondary,
            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
          }}
        >
          All ({exercises.length})
        </button>
        {muscleGroupCounts.map(mg => {
          const isActive = selectedMuscleGroup.toLowerCase() === mg.name.toLowerCase();
          return (
            <button
              key={mg.name}
              onClick={() => setSelectedMuscleGroup(isActive ? 'all' : mg.name)}
              style={{
                padding: '5px 12px', borderRadius: '16px',
                border: `1px solid ${isActive ? accentColor : borderColor}`,
                backgroundColor: isActive ? accentColor : 'transparent',
                color: isActive ? '#fff' : textSecondary,
                fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              }}
            >
              {mg.name} ({mg.count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{
        flex: 1, overflow: 'auto', borderRadius: '10px',
        border: `1px solid ${borderColor}`, backgroundColor: bgPrimary,
      }}>
        {exercisesLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
            Loading exercises...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  col.key === 'image_url' ? (
                    <th key={col.key} style={{ ...thStyle(col.align), cursor: 'default', width: col.width }} />
                  ) : (
                    <th key={col.key} onClick={() => handleSort(col.key)} style={thStyle(col.align)}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {col.label}
                        <SortIcon field={col.key} />
                      </span>
                    </th>
                  )
                ))}
                <th style={{ ...thStyle('center'), cursor: 'default', width: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Add new row */}
              {isAdding && (
                <tr style={{ backgroundColor: isDark ? '#1A1040' : '#F5F3FF' }}>
                  <td style={{ ...tdStyle('center'), width: '56px' }} />
                  <td style={tdStyle('left')}>
                    <input value={newRow.name} onChange={(e) => setNewRow(prev => ({ ...prev, name: e.target.value }))} placeholder="Name *" style={inputStyle} autoFocus />
                  </td>
                  <td style={tdStyle('left')}>
                    <select value={newRow.muscle_group} onChange={(e) => setNewRow(prev => ({ ...prev, muscle_group: e.target.value }))} style={inputStyle}>
                      <option value="">Select...</option>
                      {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle('left')}>
                    <input value={newRow.equipment} onChange={(e) => setNewRow(prev => ({ ...prev, equipment: e.target.value }))} placeholder="Equipment" style={inputStyle} />
                  </td>
                  <td style={tdStyle('left')}>
                    <select value={newRow.exercise_type} onChange={(e) => setNewRow(prev => ({ ...prev, exercise_type: e.target.value }))} style={inputStyle}>
                      {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle('right')}>
                    <input type="number" value={newRow.default_sets} onChange={(e) => setNewRow(prev => ({ ...prev, default_sets: e.target.value }))} placeholder="0" style={{ ...inputStyle, textAlign: 'right', width: '60px' }} />
                  </td>
                  <td style={tdStyle('right')}>
                    <input type="number" value={newRow.default_reps} onChange={(e) => setNewRow(prev => ({ ...prev, default_reps: e.target.value }))} placeholder="0" style={{ ...inputStyle, textAlign: 'right', width: '60px' }} />
                  </td>
                  <td style={tdStyle('right')}>
                    <input type="number" value={newRow.default_duration_min} onChange={(e) => setNewRow(prev => ({ ...prev, default_duration_min: e.target.value }))} placeholder="0" style={{ ...inputStyle, textAlign: 'right', width: '60px' }} />
                  </td>
                  <td style={{ ...tdStyle('center'), whiteSpace: 'nowrap' }}>
                    <button onClick={handleAddNew} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', marginRight: '4px' }} title="Save">
                      <FaSave size={11} />
                    </button>
                    <button onClick={() => { setIsAdding(false); setNewRow({ name: '', muscle_group: '', equipment: '', exercise_type: 'Strength', default_sets: '', default_reps: '', default_duration_min: '' }); }} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted, cursor: 'pointer' }} title="Cancel">
                      &times;
                    </button>
                  </td>
                </tr>
              )}
              {/* Data rows */}
              {filteredExercises.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
                    {searchQuery ? 'No exercises match your search' : 'No exercises yet. Click "Add New" to create one.'}
                  </td>
                </tr>
              ) : filteredExercises.map(ex => (
                <tr
                  key={ex.id}
                  style={{ transition: 'background-color 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#1F293780' : '#F9FAFB80'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {columns.map(col => {
                    // Image column
                    if (col.key === 'image_url') {
                      const isUploading = uploadingImageId === ex.id;
                      return (
                        <td key={col.key} style={{ ...tdStyle('center'), width: '56px', padding: '4px 6px' }}>
                          <div
                            onClick={() => { fileInputRef.current.dataset.exerciseId = ex.id; fileInputRef.current.click(); }}
                            style={{
                              width: 44, height: 44, borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                              border: ex.image_url ? 'none' : `1px dashed ${borderColor}`,
                              backgroundColor: ex.image_url ? 'transparent' : (isDark ? '#1F2937' : '#F3F4F6'),
                              opacity: isUploading ? 0.5 : 1,
                            }}
                            title="Click to upload image"
                          >
                            {ex.image_url ? (
                              <img src={ex.image_url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <FaCamera size={14} style={{ color: textMuted }} />
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Type column with badge
                    if (col.key === 'exercise_type') {
                      const typeColors = { Strength: '#F59E0B', Cardio: '#EF4444', Flexibility: '#3B82F6', Balance: '#14B8A6' };
                      const color = typeColors[ex.exercise_type] || '#6B7280';
                      const isEditing = editingCell?.id === ex.id && editingCell?.field === col.key;

                      if (isEditing) {
                        return (
                          <td key={col.key} style={tdStyle(col.align)}>
                            <select value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={commitEdit} autoFocus style={inputStyle}>
                              {EXERCISE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                        );
                      }

                      return (
                        <td key={col.key} style={{ ...tdStyle(col.align), cursor: 'pointer' }} onClick={() => startEdit(ex.id, col.key, ex.exercise_type)}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '4px',
                            backgroundColor: color + '20', color: color, fontSize: '11px', fontWeight: 500,
                          }}>
                            {ex.exercise_type}
                          </span>
                        </td>
                      );
                    }

                    const isEditing = editingCell?.id === ex.id && editingCell?.field === col.key;
                    const isEditable = editableFields.includes(col.key);
                    const rawValue = ex[col.key];
                    const displayValue = ['default_sets', 'default_reps', 'default_duration_min'].includes(col.key)
                      ? (rawValue != null ? Number(rawValue) : '-')
                      : (rawValue || '-');

                    if (isEditing) {
                      if (col.key === 'muscle_group') {
                        return (
                          <td key={col.key} style={tdStyle(col.align)}>
                            <select value={editingValue} onChange={(e) => setEditingValue(e.target.value)} onBlur={commitEdit} autoFocus style={inputStyle}>
                              <option value="">None</option>
                              {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                            </select>
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} style={tdStyle(col.align)}>
                          <input
                            type={['default_sets', 'default_reps', 'default_duration_min'].includes(col.key) ? 'number' : 'text'}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleEditKeyDown}
                            autoFocus
                            style={{
                              ...inputStyle, textAlign: col.align,
                              width: ['default_sets', 'default_reps', 'default_duration_min'].includes(col.key) ? '60px' : '100%',
                            }}
                          />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.key}
                        style={{ ...tdStyle(col.align), cursor: isEditable ? 'pointer' : 'default' }}
                        onClick={isEditable ? () => startEdit(ex.id, col.key, rawValue) : undefined}
                        title={isEditable ? 'Click to edit' : undefined}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle('center'), whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleDelete(ex.id, ex.name)}
                      style={{
                        padding: '4px 8px', borderRadius: '4px', border: 'none',
                        backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer',
                      }}
                      title="Delete"
                    >
                      <FaTrash size={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExercisesView;
