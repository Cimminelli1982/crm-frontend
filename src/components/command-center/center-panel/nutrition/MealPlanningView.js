import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  FaChevronLeft, FaChevronRight, FaPlus, FaTrash, FaEdit, FaUtensils, FaCamera,
} from 'react-icons/fa';

const MEAL_TYPES = [
  { key: 'B', label: 'Breakfast' },
  { key: 'S1', label: 'Snack 1' },
  { key: 'L', label: 'Lunch' },
  { key: 'S2', label: 'Snack 2' },
  { key: 'D', label: 'Dinner' },
];

const MealPlanningView = ({ theme, healthHook }) => {
  const {
    selectedMealDate, setSelectedMealDate,
    mealsForDate, dailyMacros, dailyTargets,
    recipes, ingredients,
    addMeal, deleteMeal,
    updateMealIngredients, updateMealName, updateMealServings,
    getMealMacros, getMealIngredientRows,
    mealIngredients,
    saveAsNewRecipe, addIngredient,
    uploadHealthImage,
  } = healthHook;

  const mealImageInputRef = useRef(null);
  const [uploadingMealImageId, setUploadingMealImageId] = useState(null);

  const isDark = theme === 'dark';
  const mealLabel = (key) => {
    if (key === 'E') return 'Extra';
    return MEAL_TYPES.find(m => m.key === key)?.label || key;
  };
  const bgPrimary = isDark ? '#111827' : '#fff';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const handleMealImageUpload = async (mealId, file) => {
    setUploadingMealImageId(mealId);
    await uploadHealthImage('meals', mealId, file);
    setUploadingMealImageId(null);
  };

  // Extra meals for the selected date
  const extraMeals = useMemo(() => mealsForDate.filter(m => m.meal_type === 'E'), [mealsForDate]);
  const extrasTotalKcal = useMemo(() => {
    return extraMeals.reduce((sum, m) => {
      const macros = getMealMacros(m.id);
      return sum + (macros?.kcal || 0);
    }, 0);
  }, [extraMeals, getMealMacros]);

  // MealEditorModal state
  const [mealEditorOpen, setMealEditorOpen] = useState(false);
  const [editingMealType, setEditingMealType] = useState('');
  const [editingMeal, setEditingMeal] = useState(null);

  // Dropdown for add method
  const [addDropdown, setAddDropdown] = useState(null); // meal_type or null

  // ---------- DATE NAVIGATION ----------

  const dateObj = useMemo(() => {
    const d = new Date(selectedMealDate + 'T12:00:00');
    return d;
  }, [selectedMealDate]);

  const dayOfWeek = dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
  const dateLabel = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const navigateDate = (offset) => {
    const d = new Date(dateObj);
    d.setDate(d.getDate() + offset);
    setSelectedMealDate(d.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedMealDate(new Date().toISOString().split('T')[0]);
  };

  const isToday = selectedMealDate === new Date().toISOString().split('T')[0];

  // ---------- PROGRESS BAR ----------

  const getBarColor = (actual, target) => {
    if (!target) return '#6B7280';
    const ratio = actual / target;
    const diff = Math.abs(1 - ratio);
    if (diff <= 0.10) return '#10B981';
    if (diff <= 0.15) return '#F59E0B';
    return '#EF4444';
  };

  const ProgressBar = ({ label, actual, target, unit }) => {
    const pct = target ? Math.min((actual / target) * 100, 120) : 0;
    const remaining = target - actual;
    const barColor = getBarColor(actual, target);

    return (
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: textSecondary }}>{label}</span>
          <span style={{ fontSize: '12px', color: textMuted }}>
            {actual} / {target}{unit ? ` ${unit}` : ''}
            <span style={{ marginLeft: '8px', fontWeight: 500, color: remaining >= 0 ? '#10B981' : '#EF4444' }}>
              {remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over`}
            </span>
          </span>
        </div>
        <div style={{
          height: '8px', borderRadius: '4px',
          backgroundColor: isDark ? '#374151' : '#E5E7EB',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '4px',
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: barColor,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>
    );
  };

  // ---------- MEAL EDITOR (inline modal) ----------

  const openMealEditor = (mealType, meal, fromRecipe) => {
    setEditingMealType(mealType);
    setEditingMeal(meal);
    setMealEditorOpen(true);
    setAddDropdown(null);
    if (fromRecipe && !meal) {
      // Will use the recipe picker inside editor
      setEditorMode('recipe');
    } else {
      setEditorMode('scratch');
    }
  };

  // Editor state
  const [editorMode, setEditorMode] = useState('scratch');
  const [editorName, setEditorName] = useState('');
  const [editorIngredientRows, setEditorIngredientRows] = useState([]);
  const [editorRecipeId, setEditorRecipeId] = useState('');
  const [editorServings, setEditorServings] = useState(1);
  const [editorRecipeServingsInfo, setEditorRecipeServingsInfo] = useState('');
  const [editorIngSearch, setEditorIngSearch] = useState('');
  const [showEditorIngDropdown, setShowEditorIngDropdown] = useState(false);

  // New ingredient inline form inside editor
  const [showEditorNewIng, setShowEditorNewIng] = useState(false);
  const [editorNewIngName, setEditorNewIngName] = useState('');
  const [editorNewIngKcal, setEditorNewIngKcal] = useState('');
  const [editorNewIngP, setEditorNewIngP] = useState('');
  const [editorNewIngF, setEditorNewIngF] = useState('');
  const [editorNewIngC, setEditorNewIngC] = useState('');

  // When opening editor, pre-fill
  const handleOpenEditor = useCallback((mealType, meal, mode) => {
    setEditingMealType(mealType);
    setEditingMeal(meal);
    setEditorMode(mode || 'scratch');
    setEditorRecipeId('');
    setEditorIngSearch('');
    setShowEditorIngDropdown(false);
    setShowEditorNewIng(false);
    setEditorRecipeServingsInfo('');

    if (meal) {
      setEditorName(meal.name || meal.recipes?.name || meal.meal_type || '');
      setEditorServings(Number(meal.servings) || 1);
      const miRows = getMealIngredientRows(meal.id);
      setEditorIngredientRows(miRows.map(mi => ({
        ingredient_id: mi.ingredient_id,
        ingredient: mi.ingredients,
        quantity_g: Number(mi.quantity_g) || 0,
      })));
    } else {
      setEditorName('');
      setEditorServings(1);
      setEditorIngredientRows([]);
    }
    setMealEditorOpen(true);
    setAddDropdown(null);
  }, [getMealIngredientRows]);

  const closeEditor = () => {
    setMealEditorOpen(false);
    setEditingMeal(null);
    setEditingMealType('');
  };

  // Load recipe into editor — quantities shown per-serving
  const loadRecipeIntoEditor = () => {
    const recipe = recipes.find(r => String(r.id) === String(editorRecipeId));
    if (!recipe) return;
    const recipeServings = Number(recipe.servings) || 1;
    setEditorName(recipe.name);
    const rows = (recipe.recipe_ingredients || []).map(ri => ({
      ingredient_id: ri.ingredient_id,
      ingredient: ri.ingredients,
      quantity_g: Number((Number(ri.quantity_g) / recipeServings).toFixed(1)),
    }));
    setEditorIngredientRows(rows);
    setEditorServings(1);
    setEditorRecipeServingsInfo(`Recipe makes ${recipeServings} serving${recipeServings !== 1 ? 's' : ''}`);
    setEditorMode('scratch');
  };

  // Editor ingredient search
  const editorIngOptions = useMemo(() => {
    if (editorIngSearch.length < 2) return [];
    const q = editorIngSearch.toLowerCase();
    const existingIds = new Set(editorIngredientRows.map(ir => ir.ingredient_id));
    return ingredients
      .filter(i => !existingIds.has(i.id) && (i.name || '').toLowerCase().includes(q))
      .slice(0, 10);
  }, [editorIngSearch, ingredients, editorIngredientRows]);

  const editorAddIng = (ing) => {
    setEditorIngredientRows(prev => [...prev, { ingredient_id: ing.id, ingredient: ing, quantity_g: 100 }]);
    setEditorIngSearch('');
    setShowEditorIngDropdown(false);
  };

  const editorRemoveIng = (idx) => {
    setEditorIngredientRows(prev => prev.filter((_, i) => i !== idx));
  };

  const editorUpdateQty = (idx, qty) => {
    setEditorIngredientRows(prev => prev.map((r, i) =>
      i === idx ? { ...r, quantity_g: Number(qty) || 0 } : r
    ));
  };

  // Per-serving totals (without servings multiplier)
  const editorTotalsPerServing = useMemo(() => {
    let kcal = 0, protein = 0, fat = 0, carbs = 0;
    editorIngredientRows.forEach(row => {
      const ing = row.ingredient;
      if (!ing) return;
      const f = (row.quantity_g || 0) / 100;
      kcal += (Number(ing.kcal_per_100g) || 0) * f;
      protein += (Number(ing.protein_per_100g) || 0) * f;
      fat += (Number(ing.fat_per_100g) || 0) * f;
      carbs += (Number(ing.carbs_per_100g) || 0) * f;
    });
    return { kcal: Math.round(kcal), protein: Math.round(protein), fat: Math.round(fat), carbs: Math.round(carbs) };
  }, [editorIngredientRows]);

  // Actual totals (× servings)
  const editorTotals = useMemo(() => {
    const s = editorServings || 1;
    return {
      kcal: Math.round(editorTotalsPerServing.kcal * s),
      protein: Math.round(editorTotalsPerServing.protein * s),
      fat: Math.round(editorTotalsPerServing.fat * s),
      carbs: Math.round(editorTotalsPerServing.carbs * s),
    };
  }, [editorTotalsPerServing, editorServings]);

  const handleEditorSave = async () => {
    const rows = editorIngredientRows.map(r => ({ ingredient_id: r.ingredient_id, quantity_g: r.quantity_g }));
    if (editingMeal) {
      await updateMealName(editingMeal.id, editorName || mealLabel(editingMealType));
      await updateMealIngredients(editingMeal.id, rows);
      await updateMealServings(editingMeal.id, editorServings);
    } else {
      await addMeal(selectedMealDate, editingMealType, editorRecipeId || null, editorServings, editorName || mealLabel(editingMealType), rows);
    }
    closeEditor();
  };

  const handleEditorSaveAsRecipe = async () => {
    const rows = editorIngredientRows.map(r => ({ ingredient_id: r.ingredient_id, quantity_g: r.quantity_g }));
    await saveAsNewRecipe(editorName || 'Untitled Recipe', rows, 1);
  };

  const handleEditorCreateIng = async () => {
    if (!editorNewIngName.trim()) return;
    const result = await addIngredient({
      name: editorNewIngName.trim(),
      kcal_per_100g: editorNewIngKcal ? parseFloat(editorNewIngKcal) : null,
      protein_per_100g: editorNewIngP ? parseFloat(editorNewIngP) : null,
      fat_per_100g: editorNewIngF ? parseFloat(editorNewIngF) : null,
      carbs_per_100g: editorNewIngC ? parseFloat(editorNewIngC) : null,
    });
    if (result) {
      editorAddIng(result);
      setShowEditorNewIng(false);
      setEditorNewIngName(''); setEditorNewIngKcal(''); setEditorNewIngP(''); setEditorNewIngF(''); setEditorNewIngC('');
    }
  };

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
        ref={mealImageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          const id = mealImageInputRef.current?.dataset?.mealId;
          if (file && id) handleMealImageUpload(id, file);
          e.target.value = '';
        }}
      />
      {/* Date navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexShrink: 0,
      }}>
        <button
          onClick={() => navigateDate(-1)}
          style={{
            padding: '8px', borderRadius: '8px', border: `1px solid ${borderColor}`,
            backgroundColor: bgSecondary, color: textSecondary, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <FaChevronLeft size={12} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {dayOfWeek}
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
            {dateLabel}
          </div>
        </div>
        <button
          onClick={() => navigateDate(1)}
          style={{
            padding: '8px', borderRadius: '8px', border: `1px solid ${borderColor}`,
            backgroundColor: bgSecondary, color: textSecondary, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}
        >
          <FaChevronRight size={12} />
        </button>
        {!isToday && (
          <button
            onClick={goToToday}
            style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: '#3B82F6', color: '#fff', fontSize: '11px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Today
          </button>
        )}
      </div>

      {/* Progress bars */}
      <div style={{
        padding: '16px', borderRadius: '10px', backgroundColor: bgSecondary,
        border: `1px solid ${borderColor}`, marginBottom: '20px', flexShrink: 0,
      }}>
        <ProgressBar label="Calories" actual={dailyMacros.kcal} target={dailyTargets.kcal} unit="kcal" />
        <ProgressBar label="Protein" actual={dailyMacros.protein} target={dailyTargets.protein} unit="g" />
        <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
          <span style={{ fontSize: '11px', color: textMuted }}>
            Fat: <strong style={{ color: textSecondary }}>{dailyMacros.fat}g</strong>
          </span>
          <span style={{ fontSize: '11px', color: textMuted }}>
            Carbs: <strong style={{ color: textSecondary }}>{dailyMacros.carbs}g</strong>
          </span>
        </div>
      </div>

      {/* Meal slot cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {MEAL_TYPES.map(({ key, label }) => {
          const slotMeals = mealsForDate.filter(m => m.meal_type === key);
          // Aggregate macros across all meals in this slot
          const slotMacros = slotMeals.length > 0 ? slotMeals.reduce(
            (acc, m) => {
              const mm = getMealMacros(m.id);
              if (mm) { acc.kcal += mm.kcal; acc.protein += mm.protein; acc.fat += mm.fat; acc.carbs += mm.carbs; }
              return acc;
            },
            { kcal: 0, protein: 0, fat: 0, carbs: 0 }
          ) : null;

          return (
            <div key={key} style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: bgSecondary,
              border: `1px solid ${borderColor}`,
            }}>
              <div style={{
                fontSize: '11px', color: textMuted, marginBottom: '8px',
                textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>{label}{slotMeals.length > 1 ? ` (${slotMeals.length})` : ''}</span>
                {slotMacros && (
                  <span style={{ fontSize: '11px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    {slotMacros.kcal} kcal
                    {' | P'}{slotMacros.protein}
                    {' | F'}{slotMacros.fat}
                    {' | C'}{slotMacros.carbs}
                  </span>
                )}
              </div>

              {slotMeals.map(meal => {
                const mealMacros = getMealMacros(meal.id);
                const mealIngRows = getMealIngredientRows(meal.id);
                const mealServings = Number(meal.servings) || 1;
                return (
                  <div
                    key={meal.id}
                    style={{
                      marginBottom: '10px',
                      padding: slotMeals.length > 1 ? '10px 12px' : 0,
                      borderRadius: slotMeals.length > 1 ? '8px' : 0,
                      backgroundColor: slotMeals.length > 1 ? bgPrimary : 'transparent',
                      border: slotMeals.length > 1 ? `1px solid ${borderColor}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>
                      <div
                        onClick={() => { mealImageInputRef.current.dataset.mealId = meal.id; mealImageInputRef.current.click(); }}
                        style={{
                          width: 80, height: 80, borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                          border: meal.image_url ? 'none' : `1px dashed ${borderColor}`,
                          backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                          opacity: uploadingMealImageId === meal.id ? 0.5 : 1,
                        }}
                        title="Click to upload photo"
                      >
                        {meal.image_url
                          ? <img src={meal.image_url} alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                          : <div style={{ textAlign: 'center', color: textMuted }}><FaCamera size={16} /><div style={{ fontSize: '9px', marginTop: '4px' }}>Photo</div></div>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: textPrimary }}>
                            {meal.name || meal.recipes?.name || label}
                          </span>
                          {mealServings > 1 && (
                            <span style={{ fontSize: '11px', color: textMuted, fontWeight: 400 }}>x{mealServings} servings</span>
                          )}
                        </div>
                        {slotMeals.length > 1 && mealMacros && (
                          <div style={{ fontSize: '11px', color: textMuted, marginBottom: '4px' }}>
                            {mealMacros.kcal} kcal | P{mealMacros.protein} | F{mealMacros.fat} | C{mealMacros.carbs}
                          </div>
                        )}
                        {mealIngRows.length > 0 && (
                          <div style={{ marginBottom: '6px' }}>
                            {mealIngRows.map(mi => {
                              const ing = mi.ingredients;
                              if (!ing) return null;
                              const qty = (Number(mi.quantity_g) || 0) * mealServings;
                              const kcal = Math.round((Number(ing.kcal_per_100g) || 0) * qty / 100);
                              return (
                                <div key={mi.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: textSecondary, padding: '2px 0' }}>
                                  <span>{ing.name}</span>
                                  <span style={{ color: textMuted }}>{Math.round(qty)}g - {kcal} kcal</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditor(key, meal, 'scratch')}
                            style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#3B82F620', color: '#3B82F6', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FaEdit size={10} /> Edit
                          </button>
                          <button
                            onClick={() => { if (window.confirm(`Delete this ${label} meal?`)) deleteMeal(meal.id); }}
                            style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#EF444420', color: '#EF4444', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <FaTrash size={10} /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Always show Add Meal button */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setAddDropdown(addDropdown === key ? null : key)}
                  style={{
                    padding: '8px 14px', borderRadius: '6px',
                    border: `1px dashed ${borderColor}`,
                    backgroundColor: 'transparent', color: textMuted,
                    fontSize: '12px', cursor: 'pointer', width: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  }}
                >
                  <FaPlus size={10} /> Add Meal
                </button>
                {addDropdown === key && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    marginTop: '4px', zIndex: 10,
                    backgroundColor: bgPrimary, border: `1px solid ${borderColor}`,
                    borderRadius: '8px', overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>
                    <div
                      onClick={() => handleOpenEditor(key, null, 'recipe')}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: '12px', color: textSecondary,
                        borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <FaUtensils size={10} /> From Recipe
                    </div>
                    <div
                      onClick={() => handleOpenEditor(key, null, 'scratch')}
                      style={{
                        padding: '10px 14px', cursor: 'pointer', fontSize: '12px', color: textSecondary,
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <FaPlus size={10} /> From Scratch
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ========== EXTRAS SECTION ========== */}
        <div style={{
          padding: '14px 16px',
          borderRadius: '10px',
          backgroundColor: bgSecondary,
          border: `1px solid #F59E0B40`,
          borderLeft: '3px solid #F59E0B',
        }}>
          <div style={{
            fontSize: '11px', color: '#F59E0B', marginBottom: '8px',
            textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>Extras ({extraMeals.length})</span>
            {extraMeals.length > 0 && (
              <span style={{ fontSize: '11px', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                {extrasTotalKcal} kcal total
              </span>
            )}
          </div>

          {extraMeals.map(meal => {
            const mealMacros = getMealMacros(meal.id);
            const mealIngRows = getMealIngredientRows(meal.id);
            const mealServings = Number(meal.servings) || 1;
            return (
              <div
                key={meal.id}
                style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '8px', backgroundColor: bgPrimary, border: `1px solid ${borderColor}` }}
              >
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <div
                    onClick={() => { mealImageInputRef.current.dataset.mealId = meal.id; mealImageInputRef.current.click(); }}
                    style={{
                      width: 64, height: 64, borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                      border: meal.image_url ? 'none' : `1px dashed ${borderColor}`,
                      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                      opacity: uploadingMealImageId === meal.id ? 0.5 : 1,
                    }}
                    title="Click to upload photo"
                  >
                    {meal.image_url
                      ? <img src={meal.image_url} alt="" style={{ width: 64, height: 64, objectFit: 'contain' }} />
                      : <div style={{ textAlign: 'center', color: textMuted }}><FaCamera size={14} /><div style={{ fontSize: '8px', marginTop: '2px' }}>Photo</div></div>
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: textPrimary }}>{meal.name || 'Extra'}</span>
                      {mealMacros && (
                        <span style={{ fontSize: '11px', color: textMuted }}>
                          {mealMacros.kcal} kcal | P{mealMacros.protein} | F{mealMacros.fat} | C{mealMacros.carbs}
                        </span>
                      )}
                    </div>
                    {mealIngRows.length > 0 && (
                      <div style={{ marginBottom: '6px' }}>
                        {mealIngRows.map(mi => {
                          const ing = mi.ingredients;
                          if (!ing) return null;
                          const qty = (Number(mi.quantity_g) || 0) * mealServings;
                          return (
                            <div key={mi.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: textSecondary, padding: '1px 0' }}>
                              <span>{ing.name}</span>
                              <span style={{ color: textMuted }}>{Math.round(qty)}g</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEditor('E', meal, 'scratch')}
                        style={{ padding: '3px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#3B82F620', color: '#3B82F6', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FaEdit size={9} /> Edit
                      </button>
                      <button
                        onClick={() => { if (window.confirm('Delete this extra meal?')) deleteMeal(meal.id); }}
                        style={{ padding: '3px 8px', borderRadius: '4px', border: 'none', backgroundColor: '#EF444420', color: '#EF4444', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <FaTrash size={9} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => handleOpenEditor('E', null, 'scratch')}
            style={{
              padding: '8px 14px', borderRadius: '6px',
              border: `1px dashed #F59E0B60`,
              backgroundColor: 'transparent', color: '#F59E0B',
              fontSize: '12px', cursor: 'pointer', width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
          >
            <FaPlus size={10} /> Add Extra
          </button>
        </div>
      </div>

      {/* ========== MEAL EDITOR MODAL ========== */}
      {mealEditorOpen && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeEditor(); }}
        >
          <div style={{
            width: '600px', maxHeight: '80vh', overflow: 'auto',
            backgroundColor: bgPrimary, borderRadius: '12px',
            border: `1px solid ${borderColor}`, padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: textPrimary }}>
                {editingMeal ? `Edit ${mealLabel(editingMealType)}` : `Add ${mealLabel(editingMealType)}`}
              </div>
              <button
                onClick={closeEditor}
                style={{
                  padding: '4px 8px', border: 'none', borderRadius: '4px',
                  backgroundColor: 'transparent', color: textMuted, cursor: 'pointer', fontSize: '16px',
                }}
              >
                &times;
              </button>
            </div>

            {/* Recipe picker (if from recipe mode) */}
            {editorMode === 'recipe' && editorIngredientRows.length === 0 && (
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Select Recipe</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={editorRecipeId}
                    onChange={(e) => setEditorRecipeId(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="">Choose a recipe...</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={loadRecipeIntoEditor}
                    disabled={!editorRecipeId}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', border: 'none',
                      backgroundColor: editorRecipeId ? '#3B82F6' : (isDark ? '#374151' : '#E5E7EB'),
                      color: editorRecipeId ? '#fff' : textMuted,
                      fontSize: '12px', cursor: editorRecipeId ? 'pointer' : 'not-allowed',
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

            {/* Name */}
            {(editorMode === 'scratch' || editorIngredientRows.length > 0) && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Meal Name</label>
                    <input
                      value={editorName}
                      onChange={(e) => setEditorName(e.target.value)}
                      placeholder={mealLabel(editingMealType)}
                      style={{ ...inputStyle, width: '100%' }}
                    />
                  </div>
                  <div style={{ width: '100px' }}>
                    <label style={labelStyle}>Servings</label>
                    <input
                      type="number"
                      min="0.25"
                      step="0.25"
                      value={editorServings}
                      onChange={(e) => setEditorServings(Number(e.target.value) || 1)}
                      style={{ ...inputStyle, width: '100%', textAlign: 'center' }}
                    />
                  </div>
                </div>
                {editorRecipeServingsInfo && (
                  <div style={{ fontSize: '11px', color: textMuted, marginBottom: '10px', marginTop: '-6px' }}>
                    {editorRecipeServingsInfo} — quantities below are per serving
                  </div>
                )}

                {/* Ingredient search */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={editorIngSearch}
                    onChange={(e) => { setEditorIngSearch(e.target.value); setShowEditorIngDropdown(true); }}
                    onFocus={() => setShowEditorIngDropdown(true)}
                    placeholder="Search ingredient to add... (min 2 chars)"
                    style={{ ...inputStyle, width: '100%' }}
                  />
                  {showEditorIngDropdown && editorIngSearch.length >= 2 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                      backgroundColor: bgPrimary, border: `1px solid ${borderColor}`, borderRadius: '8px',
                      maxHeight: '200px', overflow: 'auto', marginTop: '4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                      {editorIngOptions.length === 0 ? (
                        <div style={{ padding: '10px 12px', fontSize: '12px', color: textMuted }}>
                          No match.
                          <button
                            onClick={() => { setShowEditorNewIng(true); setShowEditorIngDropdown(false); setEditorNewIngName(editorIngSearch); }}
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
                          {editorIngOptions.map(ing => (
                            <div
                              key={ing.id}
                              onClick={() => editorAddIng(ing)}
                              style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: textSecondary,
                                borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = bgSecondary; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <span style={{ fontWeight: 500 }}>{ing.name}</span>
                              <span style={{ float: 'right', color: textMuted }}>{Number(ing.kcal_per_100g) || 0} kcal</span>
                            </div>
                          ))}
                          <div
                            onClick={() => { setShowEditorNewIng(true); setShowEditorIngDropdown(false); setEditorNewIngName(editorIngSearch); }}
                            style={{
                              padding: '8px 12px', cursor: 'pointer', fontSize: '12px', color: '#3B82F6', fontWeight: 500,
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

                {/* New ingredient inline */}
                {showEditorNewIng && (
                  <div style={{
                    padding: '10px', borderRadius: '8px', backgroundColor: bgSecondary,
                    border: `1px solid ${borderColor}`, marginBottom: '10px',
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', alignItems: 'end' }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={labelStyle}>Name *</label>
                        <input value={editorNewIngName} onChange={(e) => setEditorNewIngName(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Kcal</label>
                        <input type="number" value={editorNewIngKcal} onChange={(e) => setEditorNewIngKcal(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>P</label>
                        <input type="number" value={editorNewIngP} onChange={(e) => setEditorNewIngP(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>F</label>
                        <input type="number" value={editorNewIngF} onChange={(e) => setEditorNewIngF(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                      <div>
                        <label style={labelStyle}>C</label>
                        <input type="number" value={editorNewIngC} onChange={(e) => setEditorNewIngC(e.target.value)} style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button onClick={handleEditorCreateIng} style={{ padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: '#10B981', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Save & Add</button>
                      <button onClick={() => { setShowEditorNewIng(false); }} style={{ padding: '5px 10px', borderRadius: '4px', border: 'none', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted, fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Ingredient table */}
                {editorIngredientRows.length > 0 && (
                  <div style={{ borderRadius: '8px', border: `1px solid ${borderColor}`, overflow: 'hidden', marginBottom: '12px' }}>
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
                        {editorIngredientRows.map((row, idx) => {
                          const ing = row.ingredient;
                          const f = (row.quantity_g || 0) / 100;
                          const kcal = Math.round((Number(ing?.kcal_per_100g) || 0) * f);
                          const protein = Math.round((Number(ing?.protein_per_100g) || 0) * f);
                          const fat = Math.round((Number(ing?.fat_per_100g) || 0) * f);
                          const carbs = Math.round((Number(ing?.carbs_per_100g) || 0) * f);
                          return (
                            <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}>
                              <td style={{ padding: '6px 10px', color: textSecondary }}>{ing?.name || 'Unknown'}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                <input
                                  type="number"
                                  value={row.quantity_g}
                                  onChange={(e) => editorUpdateQty(idx, e.target.value)}
                                  style={{
                                    width: '60px', textAlign: 'right', padding: '3px 6px', borderRadius: '4px',
                                    border: `1px solid ${borderColor}`, backgroundColor: bgPrimary, color: textPrimary,
                                    fontSize: '12px', outline: 'none',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{kcal}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{protein}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{fat}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'right', color: textSecondary }}>{carbs}</td>
                              <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                                <button onClick={() => editorRemoveIng(idx)} style={{ padding: '2px 6px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}>
                                  &times;
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {/* Per-serving subtotal */}
                        <tr style={{ backgroundColor: bgSecondary }}>
                          <td style={{ padding: '6px 10px', color: textMuted, fontSize: '11px' }}>Per serving</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: textMuted, fontSize: '11px' }}>
                            {editorIngredientRows.reduce((s, r) => s + (r.quantity_g || 0), 0)}g
                          </td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: textMuted, fontSize: '11px' }}>{editorTotalsPerServing.kcal}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: textMuted, fontSize: '11px' }}>{editorTotalsPerServing.protein}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: textMuted, fontSize: '11px' }}>{editorTotalsPerServing.fat}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', color: textMuted, fontSize: '11px' }}>{editorTotalsPerServing.carbs}</td>
                          <td />
                        </tr>
                        {/* Actual total (× servings) */}
                        <tr style={{ backgroundColor: bgSecondary, fontWeight: 600 }}>
                          <td style={{ padding: '8px 10px', color: textPrimary }}>
                            Total{editorServings !== 1 ? ` (×${editorServings})` : ''}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: textMuted }}>
                            {Math.round(editorIngredientRows.reduce((s, r) => s + (r.quantity_g || 0), 0) * (editorServings || 1))}g
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#F59E0B' }}>{editorTotals.kcal}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#3B82F6' }}>{editorTotals.protein}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#EF4444' }}>{editorTotals.fat}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10B981' }}>{editorTotals.carbs}</td>
                          <td />
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
                      backgroundColor: '#10B981', color: '#fff', fontSize: '13px',
                      fontWeight: 500, cursor: 'pointer',
                    }}
                  >
                    {editingMeal ? 'Update Meal' : 'Save Meal'}
                  </button>
                  {editorIngredientRows.length > 0 && (
                    <button
                      onClick={handleEditorSaveAsRecipe}
                      style={{
                        padding: '10px 18px', borderRadius: '8px', border: `1px solid ${borderColor}`,
                        backgroundColor: 'transparent', color: '#3B82F6', fontSize: '13px',
                        fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      Save as Recipe
                    </button>
                  )}
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

export default MealPlanningView;
