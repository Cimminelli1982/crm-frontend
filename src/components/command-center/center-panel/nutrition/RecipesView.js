import React, { useState, useMemo, useCallback, useRef } from 'react';
import { FaPlus, FaTrash, FaArrowLeft, FaSave, FaSearch, FaTimes, FaCamera } from 'react-icons/fa';

const RecipesView = ({ theme, healthHook }) => {
  const {
    recipes, recipesLoading, ingredients,
    addRecipe, updateRecipe, deleteRecipe,
    getRecipeMacros, addIngredient,
    uploadHealthImage,
  } = healthHook;

  const recipeImageInputRef = useRef(null);
  const [uploadingRecipeImageId, setUploadingRecipeImageId] = useState(null);

  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#111827' : '#fff';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  // View mode
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [editingRecipe, setEditingRecipe] = useState(null);

  // Detail form
  const [formName, setFormName] = useState('');
  const [formServings, setFormServings] = useState(1);
  const [formPrepTime, setFormPrepTime] = useState('');
  const [formCookTime, setFormCookTime] = useState('');
  const [formEquipment, setFormEquipment] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [ingredientRows, setIngredientRows] = useState([]);

  // Ingredient search
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);

  // Inline new ingredient
  const [showNewIngredientForm, setShowNewIngredientForm] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngBrand, setNewIngBrand] = useState('');
  const [newIngKcal, setNewIngKcal] = useState('');
  const [newIngProtein, setNewIngProtein] = useState('');
  const [newIngFat, setNewIngFat] = useState('');
  const [newIngCarbs, setNewIngCarbs] = useState('');

  // List filter
  const [listSearch, setListSearch] = useState('');

  const handleRecipeImageUpload = async (recipeId, file) => {
    setUploadingRecipeImageId(recipeId);
    await uploadHealthImage('recipes', recipeId, file);
    setUploadingRecipeImageId(null);
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${borderColor}`,
    backgroundColor: bgPrimary,
    color: textPrimary,
    fontSize: '13px',
    width: '100%',
    outline: 'none',
  };

  const labelStyle = {
    fontSize: '11px',
    color: textMuted,
    marginBottom: '4px',
    display: 'block',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  // ---------- LIST MODE ----------

  const filteredRecipes = useMemo(() => {
    if (!listSearch.trim()) return recipes;
    const q = listSearch.toLowerCase();
    return recipes.filter(r => (r.name || '').toLowerCase().includes(q));
  }, [recipes, listSearch]);

  const openDetail = (recipe) => {
    setEditingRecipe(recipe);
    if (recipe) {
      setFormName(recipe.name || '');
      setFormServings(recipe.servings || 1);
      setFormPrepTime(recipe.prep_time_min || '');
      setFormCookTime(recipe.cook_time_min || '');
      setFormEquipment(recipe.equipment || '');
      setFormTags(recipe.tags || '');
      setFormInstructions(recipe.instructions || '');
      const rows = (recipe.recipe_ingredients || []).map(ri => ({
        ingredient_id: ri.ingredient_id,
        ingredient: ri.ingredients,
        quantity_g: Number(ri.quantity_g) || 0,
      }));
      setIngredientRows(rows);
    } else {
      setFormName('');
      setFormServings(1);
      setFormPrepTime('');
      setFormCookTime('');
      setFormEquipment('');
      setFormTags('');
      setFormInstructions('');
      setIngredientRows([]);
    }
    setViewMode('detail');
  };

  const goBackToList = () => {
    setViewMode('list');
    setEditingRecipe(null);
  };

  // ---------- INGREDIENT SEARCH ----------

  const filteredIngredientOptions = useMemo(() => {
    if (ingredientSearch.length < 2) return [];
    const q = ingredientSearch.toLowerCase();
    const existingIds = new Set(ingredientRows.map(ir => ir.ingredient_id));
    return ingredients
      .filter(i => !existingIds.has(i.id) && (i.name || '').toLowerCase().includes(q))
      .slice(0, 10);
  }, [ingredientSearch, ingredients, ingredientRows]);

  const addIngredientRow = (ing) => {
    setIngredientRows(prev => [...prev, {
      ingredient_id: ing.id,
      ingredient: ing,
      quantity_g: 100,
    }]);
    setIngredientSearch('');
    setShowIngredientDropdown(false);
  };

  const removeIngredientRow = (index) => {
    setIngredientRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, qty) => {
    setIngredientRows(prev => prev.map((row, i) =>
      i === index ? { ...row, quantity_g: Number(qty) || 0 } : row
    ));
  };

  // Compute live macros for ingredient rows
  const computeRowMacros = useCallback((row) => {
    const ing = row.ingredient;
    if (!ing) return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    const factor = (row.quantity_g || 0) / 100;
    return {
      kcal: Math.round((Number(ing.kcal_per_100g) || 0) * factor),
      protein: Math.round((Number(ing.protein_per_100g) || 0) * factor),
      fat: Math.round((Number(ing.fat_per_100g) || 0) * factor),
      carbs: Math.round((Number(ing.carbs_per_100g) || 0) * factor),
    };
  }, []);

  const totals = useMemo(() => {
    let kcal = 0, protein = 0, fat = 0, carbs = 0;
    ingredientRows.forEach(row => {
      const m = computeRowMacros(row);
      kcal += m.kcal;
      protein += m.protein;
      fat += m.fat;
      carbs += m.carbs;
    });
    return { kcal, protein, fat, carbs };
  }, [ingredientRows, computeRowMacros]);

  // ---------- SAVE / DELETE ----------

  const handleSave = async () => {
    if (!formName.trim()) return;
    const recipeData = {
      name: formName.trim(),
      servings: formServings || 1,
      prep_time_min: formPrepTime ? parseInt(formPrepTime) : null,
      cook_time_min: formCookTime ? parseInt(formCookTime) : null,
      equipment: formEquipment.trim() || null,
      tags: formTags.trim() || null,
      instructions: formInstructions.trim() || null,
    };
    const rows = ingredientRows.map(ir => ({
      ingredient_id: ir.ingredient_id,
      quantity_g: ir.quantity_g,
    }));

    if (editingRecipe) {
      await updateRecipe(editingRecipe.id, recipeData, rows);
    } else {
      await addRecipe(recipeData, rows);
    }
    goBackToList();
  };

  const handleDelete = async () => {
    if (!editingRecipe) return;
    if (window.confirm(`Delete recipe "${editingRecipe.name}"? This cannot be undone.`)) {
      await deleteRecipe(editingRecipe.id);
      goBackToList();
    }
  };

  const handleCreateNewIngredient = async () => {
    if (!newIngName.trim()) return;
    const result = await addIngredient({
      name: newIngName.trim(),
      brand: newIngBrand.trim() || null,
      kcal_per_100g: newIngKcal ? parseFloat(newIngKcal) : null,
      protein_per_100g: newIngProtein ? parseFloat(newIngProtein) : null,
      fat_per_100g: newIngFat ? parseFloat(newIngFat) : null,
      carbs_per_100g: newIngCarbs ? parseFloat(newIngCarbs) : null,
    });
    if (result) {
      addIngredientRow(result);
      setShowNewIngredientForm(false);
      setNewIngName(''); setNewIngBrand(''); setNewIngKcal(''); setNewIngProtein(''); setNewIngFat(''); setNewIngCarbs('');
    }
  };

  // ---------- RENDER ----------

  if (viewMode === 'list') {
    return (
      <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <input
          ref={recipeImageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            const id = recipeImageInputRef.current?.dataset?.recipeId;
            if (file && id) handleRecipeImageUpload(id, file);
            e.target.value = '';
          }}
        />
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
            <input
              type="text"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search recipes..."
              style={{ ...inputStyle, padding: '8px 12px 8px 30px', borderRadius: '8px' }}
            />
          </div>
          <div style={{ fontSize: '12px', color: textMuted }}>
            {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={() => openDetail(null)}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              backgroundColor: '#10B981', color: '#fff', fontSize: '12px',
              fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <FaPlus size={10} /> Create Recipe
          </button>
        </div>

        {/* Grid */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {recipesLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>Loading recipes...</div>
          ) : filteredRecipes.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
              {listSearch ? 'No recipes match your search' : 'No recipes yet. Create your first one!'}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
            }}>
              {filteredRecipes.map(recipe => {
                const macros = getRecipeMacros(recipe);
                const ingCount = recipe.recipe_ingredients?.length || 0;
                return (
                  <div
                    key={recipe.id}
                    onClick={() => openDetail(recipe)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      backgroundColor: bgSecondary,
                      border: `1px solid ${borderColor}`,
                      cursor: 'pointer',
                      transition: 'border-color 0.15s, transform 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {recipe.image_url ? (
                      <div style={{
                        width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px',
                      }}>
                        <img src={recipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ) : (
                      <div style={{
                        width: '100%', height: '60px', borderRadius: '8px', marginBottom: '10px',
                        border: `1px dashed ${borderColor}`,
                        backgroundColor: isDark ? '#1F293750' : '#F3F4F680',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: textMuted, gap: '6px',
                      }}>
                        <FaCamera size={14} />
                        <span style={{ fontSize: '11px' }}>No photo</span>
                      </div>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, marginBottom: '8px' }}>
                      {recipe.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                      {[
                        { label: 'Kcal', value: macros.kcal, color: '#F59E0B' },
                        { label: 'P', value: `${macros.protein}g`, color: '#3B82F6' },
                        { label: 'F', value: `${macros.fat}g`, color: '#EF4444' },
                        { label: 'C', value: `${macros.carbs}g`, color: '#10B981' },
                      ].map(m => (
                        <div key={m.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '10px', color: textMuted }}>{m.label}</div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: m.color }}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '11px', color: textMuted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{ingCount} ingredient{ingCount !== 1 ? 's' : ''}</span>
                      <span>{recipe.servings || 1} serving{(recipe.servings || 1) !== 1 ? 's' : ''}</span>
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
      <input
        ref={recipeImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = recipeImageInputRef.current?.dataset?.recipeId;
          if (file && id) handleRecipeImageUpload(id, file);
          e.target.value = '';
        }}
      />
      {/* Back button */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <button
          onClick={goBackToList}
          style={{
            padding: '6px 12px', borderRadius: '6px', border: 'none',
            backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textSecondary,
            fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <FaArrowLeft size={10} /> Back to recipes
        </button>
      </div>

      {/* Hero image area (only for existing recipes) */}
      {editingRecipe && (
        <div
          onClick={() => {
            recipeImageInputRef.current.dataset.recipeId = editingRecipe.id;
            recipeImageInputRef.current.click();
          }}
          style={{
            width: '100%', height: '260px', borderRadius: '12px', marginBottom: '16px',
            overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
            border: editingRecipe.image_url ? 'none' : `2px dashed ${borderColor}`,
            backgroundColor: editingRecipe.image_url ? 'transparent' : (isDark ? '#1F2937' : '#F3F4F6'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: uploadingRecipeImageId === editingRecipe.id ? 0.5 : 1,
          }}
          title="Click to upload hero image"
        >
          {editingRecipe.image_url ? (
            <img src={editingRecipe.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div style={{ textAlign: 'center', color: textMuted }}>
              <FaCamera size={24} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>Click to add hero image</div>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: '18px', fontWeight: 700, color: textPrimary, marginBottom: '16px' }}>
        {editingRecipe ? `Edit: ${editingRecipe.name}` : 'Create New Recipe'}
      </div>

      {/* Form fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Name *</label>
          <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Recipe name" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Servings</label>
          <input type="number" min="1" value={formServings} onChange={(e) => setFormServings(parseInt(e.target.value) || 1)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Prep Time (min)</label>
          <input type="number" value={formPrepTime} onChange={(e) => setFormPrepTime(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Cook Time (min)</label>
          <input type="number" value={formCookTime} onChange={(e) => setFormCookTime(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Equipment</label>
          <input value={formEquipment} onChange={(e) => setFormEquipment(e.target.value)} placeholder="Oven, blender..." style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Tags</label>
          <input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="low-carb, quick..." style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Instructions</label>
          <textarea
            value={formInstructions}
            onChange={(e) => setFormInstructions(e.target.value)}
            placeholder="Step-by-step instructions..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
      </div>

      {/* Ingredient table */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '10px' }}>
          Ingredients ({ingredientRows.length})
        </div>

        {/* Search to add */}
        <div style={{ position: 'relative', marginBottom: '10px', maxWidth: '400px' }}>
          <FaSearch size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input
            type="text"
            value={ingredientSearch}
            onChange={(e) => { setIngredientSearch(e.target.value); setShowIngredientDropdown(true); }}
            onFocus={() => setShowIngredientDropdown(true)}
            placeholder="Search ingredient to add... (min 2 chars)"
            style={{ ...inputStyle, padding: '8px 12px 8px 30px' }}
          />
          {showIngredientDropdown && ingredientSearch.length >= 2 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              backgroundColor: bgPrimary, border: `1px solid ${borderColor}`, borderRadius: '8px',
              maxHeight: '250px', overflow: 'auto', marginTop: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              {filteredIngredientOptions.length === 0 ? (
                <div style={{ padding: '10px 12px', fontSize: '12px', color: textMuted }}>
                  No ingredients found.
                  <button
                    onClick={() => { setShowNewIngredientForm(true); setShowIngredientDropdown(false); setNewIngName(ingredientSearch); }}
                    style={{
                      marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', border: 'none',
                      backgroundColor: '#3B82F6', color: '#fff', fontSize: '11px', cursor: 'pointer',
                    }}
                  >
                    Create new
                  </button>
                </div>
              ) : (
                <>
                  {filteredIngredientOptions.map(ing => (
                    <div
                      key={ing.id}
                      onClick={() => addIngredientRow(ing)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: textSecondary,
                        borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{ fontWeight: 500 }}>{ing.name}</span>
                      {ing.brand && <span style={{ color: textMuted, marginLeft: '8px' }}>{ing.brand}</span>}
                      <span style={{ float: 'right', color: textMuted }}>
                        {Number(ing.kcal_per_100g) || 0} kcal
                      </span>
                    </div>
                  ))}
                  <div
                    onClick={() => { setShowNewIngredientForm(true); setShowIngredientDropdown(false); setNewIngName(ingredientSearch); }}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: '#3B82F6',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <FaPlus size={10} style={{ marginRight: 6 }} /> Create new ingredient
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Inline create ingredient form */}
        {showNewIngredientForm && (
          <div style={{
            padding: '12px', borderRadius: '8px', backgroundColor: bgSecondary,
            border: `1px solid ${borderColor}`, marginBottom: '10px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '8px' }}>New Ingredient</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', alignItems: 'end' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Name *</label>
                <input value={newIngName} onChange={(e) => setNewIngName(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
              <div>
                <label style={labelStyle}>Brand</label>
                <input value={newIngBrand} onChange={(e) => setNewIngBrand(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
              <div>
                <label style={labelStyle}>Kcal</label>
                <input type="number" value={newIngKcal} onChange={(e) => setNewIngKcal(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
              <div>
                <label style={labelStyle}>P</label>
                <input type="number" value={newIngProtein} onChange={(e) => setNewIngProtein(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
              <div>
                <label style={labelStyle}>F</label>
                <input type="number" value={newIngFat} onChange={(e) => setNewIngFat(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
              <div>
                <label style={labelStyle}>C</label>
                <input type="number" value={newIngCarbs} onChange={(e) => setNewIngCarbs(e.target.value)} style={{ ...inputStyle, fontSize: '12px', padding: '6px 8px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={handleCreateNewIngredient}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#10B981', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
              >
                <FaSave size={10} /> Save & Add
              </button>
              <button
                onClick={() => { setShowNewIngredientForm(false); setNewIngName(''); setNewIngBrand(''); setNewIngKcal(''); setNewIngProtein(''); setNewIngFat(''); setNewIngCarbs(''); }}
                style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted, fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Ingredients table */}
        {ingredientRows.length > 0 && (
          <div style={{ borderRadius: '8px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: bgSecondary }}>
                  {['Name', 'Qty (g)', 'Kcal', 'P', 'F', 'C', ''].map(h => (
                    <th key={h} style={{
                      textAlign: h === 'Name' ? 'left' : h === '' ? 'center' : 'right',
                      padding: '8px 10px', color: textMuted, fontWeight: 500, fontSize: '11px',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ingredientRows.map((row, idx) => {
                  const m = computeRowMacros(row);
                  return (
                    <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}>
                      <td style={{ padding: '6px 10px', color: textSecondary }}>{row.ingredient?.name || 'Unknown'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                        <input
                          type="number"
                          value={row.quantity_g}
                          onChange={(e) => updateQuantity(idx, e.target.value)}
                          style={{
                            width: '65px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px',
                            border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary,
                            fontSize: '12px', outline: 'none',
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{m.kcal}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{m.protein}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{m.fat}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{m.carbs}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => removeIngredientRow(idx)}
                          style={{ padding: '2px 6px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <FaTimes size={10} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr style={{ backgroundColor: bgSecondary, fontWeight: 600 }}>
                  <td style={{ padding: '8px 10px', color: textPrimary }}>Total</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: textMuted }}>
                    {ingredientRows.reduce((s, r) => s + (r.quantity_g || 0), 0)}g
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F59E0B' }}>{totals.kcal}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#3B82F6' }}>{totals.protein}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#EF4444' }}>{totals.fat}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981' }}>{totals.carbs}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', gap: '10px', paddingTop: '16px',
        borderTop: `1px solid ${borderColor}`, flexShrink: 0,
      }}>
        <button
          onClick={handleSave}
          disabled={!formName.trim()}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            backgroundColor: !formName.trim() ? (isDark ? '#374151' : '#E5E7EB') : '#10B981',
            color: !formName.trim() ? textMuted : '#fff',
            fontSize: '13px', fontWeight: 500, cursor: formName.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <FaSave size={12} /> {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
        </button>
        {editingRecipe && (
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none',
              backgroundColor: '#EF444420', color: '#EF4444',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <FaTrash size={12} /> Delete
          </button>
        )}
        <button
          onClick={goBackToList}
          style={{
            padding: '10px 20px', borderRadius: '8px', border: 'none',
            backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textSecondary,
            fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          <FaArrowLeft size={12} /> Back
        </button>
      </div>
    </div>
  );
};

export default RecipesView;
