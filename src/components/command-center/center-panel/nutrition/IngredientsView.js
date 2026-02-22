import React, { useState, useMemo, useRef } from 'react';
import { FaPlus, FaTrash, FaSave, FaSort, FaSortUp, FaSortDown, FaSearch, FaCamera } from 'react-icons/fa';

const IngredientsView = ({ theme, healthHook }) => {
  const {
    ingredients, ingredientsLoading,
    addIngredient, updateIngredient, deleteIngredient,
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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Extract unique categories
  const categories = useMemo(() => {
    const catMap = {};
    ingredients.forEach(i => {
      if (!i.category) return;
      const normalized = i.category.charAt(0).toUpperCase() + i.category.slice(1).toLowerCase();
      catMap[normalized] = (catMap[normalized] || 0) + 1;
    });
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [ingredients]);

  // Editable cell state
  const [editingCell, setEditingCell] = useState(null); // { id, field }
  const [editingValue, setEditingValue] = useState('');

  // New ingredient row
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    name: '', brand: '', category: '',
    kcal_per_100g: '', protein_per_100g: '', fat_per_100g: '', carbs_per_100g: '',
  });

  const filteredIngredients = useMemo(() => {
    let list = [...ingredients];
    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter(i =>
        (i.category || '').toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = (aVal || '').toLowerCase();
      if (typeof bVal === 'string') bVal = (bVal || '').toLowerCase();
      if (typeof aVal === 'number' || sortField.includes('per_100g')) {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [ingredients, searchQuery, selectedCategory, sortField, sortDir]);

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
    const original = ingredients.find(i => i.id === id);
    const originalValue = original?.[field];

    let value = editingValue;
    if (['kcal_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g'].includes(field)) {
      value = value === '' ? null : parseFloat(value);
    }

    if (String(value ?? '') !== String(originalValue ?? '')) {
      await updateIngredient(id, { [field]: value });
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
      brand: newRow.brand.trim() || null,
      category: newRow.category.trim() || null,
      kcal_per_100g: newRow.kcal_per_100g ? parseFloat(newRow.kcal_per_100g) : null,
      protein_per_100g: newRow.protein_per_100g ? parseFloat(newRow.protein_per_100g) : null,
      fat_per_100g: newRow.fat_per_100g ? parseFloat(newRow.fat_per_100g) : null,
      carbs_per_100g: newRow.carbs_per_100g ? parseFloat(newRow.carbs_per_100g) : null,
    };
    const result = await addIngredient(data);
    if (result) {
      setNewRow({ name: '', brand: '', category: '', kcal_per_100g: '', protein_per_100g: '', fat_per_100g: '', carbs_per_100g: '' });
      setIsAdding(false);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete ingredient "${name}"? This cannot be undone.`)) {
      deleteIngredient(id);
    }
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

  const handleImageUpload = async (ingredientId, file) => {
    setUploadingImageId(ingredientId);
    await uploadHealthImage('ingredients', ingredientId, file);
    setUploadingImageId(null);
  };

  const columns = [
    { key: 'image_url', label: '', align: 'center', width: '56px' },
    { key: 'name', label: 'Name', align: 'left' },
    { key: 'brand', label: 'Brand', align: 'left' },
    { key: 'category', label: 'Category', align: 'left' },
    { key: 'kcal_per_100g', label: 'Kcal/100g', align: 'right' },
    { key: 'protein_per_100g', label: 'P', align: 'right' },
    { key: 'fat_per_100g', label: 'F', align: 'right' },
    { key: 'carbs_per_100g', label: 'C', align: 'right' },
  ];

  const editableFields = ['name', 'brand', 'category', 'kcal_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g'];

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = fileInputRef.current?.dataset?.ingredientId;
          if (file && id) handleImageUpload(id, file);
          e.target.value = '';
        }}
      />
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
        <div style={{
          position: 'relative', flex: 1, maxWidth: '400px',
        }}>
          <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ingredients by name or brand..."
            style={{
              ...inputStyle,
              padding: '8px 12px 8px 30px',
              fontSize: '13px',
              borderRadius: '8px',
            }}
          />
        </div>
        <div style={{ fontSize: '12px', color: textMuted }}>
          {filteredIngredients.length} ingredient{filteredIngredients.length !== 1 ? 's' : ''}
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10B981',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FaPlus size={10} /> Add New
          </button>
        )}
      </div>

      {/* Category filter */}
      <div style={{
        display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', flexShrink: 0,
      }}>
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '5px 12px',
            borderRadius: '16px',
            border: `1px solid ${selectedCategory === 'all' ? '#F59E0B' : borderColor}`,
            backgroundColor: selectedCategory === 'all' ? '#F59E0B' : 'transparent',
            color: selectedCategory === 'all' ? '#fff' : textSecondary,
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          All ({ingredients.length})
        </button>
        {categories.map(cat => {
          const isActive = selectedCategory.toLowerCase() === cat.name.toLowerCase();
          return (
            <button
              key={cat.name}
              onClick={() => setSelectedCategory(isActive ? 'all' : cat.name)}
              style={{
                padding: '5px 12px',
                borderRadius: '16px',
                border: `1px solid ${isActive ? '#F59E0B' : borderColor}`,
                backgroundColor: isActive ? '#F59E0B' : 'transparent',
                color: isActive ? '#fff' : textSecondary,
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {cat.name} ({cat.count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        borderRadius: '10px',
        border: `1px solid ${borderColor}`,
        backgroundColor: bgPrimary,
      }}>
        {ingredientsLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
            Loading ingredients...
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {columns.map(col => (
                  col.key === 'image_url' ? (
                    <th key={col.key} style={{ ...thStyle(col.align), cursor: 'default', width: col.width }} />
                  ) : (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={thStyle(col.align)}
                    >
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
                <tr style={{ backgroundColor: isDark ? '#0D2137' : '#EFF6FF' }}>
                  <td style={{ ...tdStyle('center'), width: '56px' }} />
                  <td style={tdStyle('left')}>
                    <input
                      value={newRow.name}
                      onChange={(e) => setNewRow(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Name *"
                      style={inputStyle}
                      autoFocus
                    />
                  </td>
                  <td style={tdStyle('left')}>
                    <input
                      value={newRow.brand}
                      onChange={(e) => setNewRow(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Brand"
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle('left')}>
                    <input
                      value={newRow.category}
                      onChange={(e) => setNewRow(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Category"
                      style={inputStyle}
                    />
                  </td>
                  <td style={tdStyle('right')}>
                    <input
                      type="number"
                      value={newRow.kcal_per_100g}
                      onChange={(e) => setNewRow(prev => ({ ...prev, kcal_per_100g: e.target.value }))}
                      placeholder="0"
                      style={{ ...inputStyle, textAlign: 'right', width: '70px' }}
                    />
                  </td>
                  <td style={tdStyle('right')}>
                    <input
                      type="number"
                      value={newRow.protein_per_100g}
                      onChange={(e) => setNewRow(prev => ({ ...prev, protein_per_100g: e.target.value }))}
                      placeholder="0"
                      style={{ ...inputStyle, textAlign: 'right', width: '60px' }}
                    />
                  </td>
                  <td style={tdStyle('right')}>
                    <input
                      type="number"
                      value={newRow.fat_per_100g}
                      onChange={(e) => setNewRow(prev => ({ ...prev, fat_per_100g: e.target.value }))}
                      placeholder="0"
                      style={{ ...inputStyle, textAlign: 'right', width: '60px' }}
                    />
                  </td>
                  <td style={tdStyle('right')}>
                    <input
                      type="number"
                      value={newRow.carbs_per_100g}
                      onChange={(e) => setNewRow(prev => ({ ...prev, carbs_per_100g: e.target.value }))}
                      placeholder="0"
                      style={{ ...inputStyle, textAlign: 'right', width: '60px' }}
                    />
                  </td>
                  <td style={{ ...tdStyle('center'), whiteSpace: 'nowrap' }}>
                    <button
                      onClick={handleAddNew}
                      style={{
                        padding: '4px 8px', borderRadius: '4px', border: 'none',
                        backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', marginRight: '4px',
                      }}
                      title="Save"
                    >
                      <FaSave size={11} />
                    </button>
                    <button
                      onClick={() => { setIsAdding(false); setNewRow({ name: '', brand: '', category: '', kcal_per_100g: '', protein_per_100g: '', fat_per_100g: '', carbs_per_100g: '' }); }}
                      style={{
                        padding: '4px 8px', borderRadius: '4px', border: 'none',
                        backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted, cursor: 'pointer',
                      }}
                      title="Cancel"
                    >
                      &times;
                    </button>
                  </td>
                </tr>
              )}
              {/* Data rows */}
              {filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
                    {searchQuery ? 'No ingredients match your search' : 'No ingredients yet. Click "Add New" to create one.'}
                  </td>
                </tr>
              ) : filteredIngredients.map(ing => (
                <tr
                  key={ing.id}
                  style={{
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? '#1F293780' : '#F9FAFB80'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {columns.map(col => {
                    // Image column
                    if (col.key === 'image_url') {
                      const isUploading = uploadingImageId === ing.id;
                      return (
                        <td key={col.key} style={{ ...tdStyle('center'), width: '56px', padding: '4px 6px' }}>
                          <div
                            onClick={() => {
                              fileInputRef.current.dataset.ingredientId = ing.id;
                              fileInputRef.current.click();
                            }}
                            style={{
                              width: 44, height: 44, borderRadius: '8px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              overflow: 'hidden',
                              border: ing.image_url ? 'none' : `1px dashed ${borderColor}`,
                              backgroundColor: ing.image_url ? 'transparent' : (isDark ? '#1F2937' : '#F3F4F6'),
                              opacity: isUploading ? 0.5 : 1,
                            }}
                            title="Click to upload image"
                          >
                            {ing.image_url ? (
                              <img src={ing.image_url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '8px' }} />
                            ) : (
                              <FaCamera size={14} style={{ color: textMuted }} />
                            )}
                          </div>
                        </td>
                      );
                    }

                    const isEditing = editingCell?.id === ing.id && editingCell?.field === col.key;
                    const isEditable = editableFields.includes(col.key);
                    const rawValue = ing[col.key];
                    const displayValue = ['kcal_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g'].includes(col.key)
                      ? (rawValue != null ? Number(rawValue) : '-')
                      : (rawValue || '-');

                    if (isEditing) {
                      return (
                        <td key={col.key} style={tdStyle(col.align)}>
                          <input
                            type={['kcal_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g'].includes(col.key) ? 'number' : 'text'}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleEditKeyDown}
                            autoFocus
                            style={{
                              ...inputStyle,
                              textAlign: col.align,
                              width: ['kcal_per_100g', 'protein_per_100g', 'fat_per_100g', 'carbs_per_100g'].includes(col.key) ? '70px' : '100%',
                            }}
                          />
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col.key}
                        style={{
                          ...tdStyle(col.align),
                          cursor: isEditable ? 'pointer' : 'default',
                        }}
                        onClick={isEditable ? () => startEdit(ing.id, col.key, rawValue) : undefined}
                        title={isEditable ? 'Click to edit' : undefined}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                  <td style={{ ...tdStyle('center'), whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => handleDelete(ing.id, ing.name)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        cursor: 'pointer',
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

export default IngredientsView;
