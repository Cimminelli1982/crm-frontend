import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from 'react-modal';
import { FiX } from 'react-icons/fi';
import { FaPlus } from 'react-icons/fa';

const MealEditorModal = ({
  isOpen,
  onClose,
  theme,
  meal,
  recipes,
  ingredients,
  onSave,
  onSaveAsRecipe,
  onAddIngredient,
}) => {
  const isDark = theme === 'dark';

  // --------------- Theme tokens ---------------
  const bg = isDark ? '#111827' : '#fff';
  const border = isDark ? '#374151' : '#E5E7EB';
  const inputBg = isDark ? '#1F2937' : '#fff';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#9CA3AF' : '#6B7280';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const rowHoverBg = isDark ? '#1F293780' : '#F9FAFB';

  // --------------- Local state ---------------
  const [mealName, setMealName] = useState('');
  const [ingredientRows, setIngredientRows] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  // Ingredient search
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Inline "create new ingredient" form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    brand: '',
    kcal_per_100g: '',
    protein_per_100g: '',
    fat_per_100g: '',
    carbs_per_100g: '',
  });

  // --------------- Init / reset on open ---------------
  useEffect(() => {
    if (!isOpen) return;
    if (meal) {
      setMealName(meal.name || '');
      setIngredientRows(
        (meal.mealIngredientRows || []).map((row) => ({
          ingredient_id: row.ingredient_id,
          ingredient: row.ingredients || row.ingredient || {},
          quantity_g: Number(row.quantity_g) || 0,
        })),
      );
    } else {
      setMealName('');
      setIngredientRows([]);
    }
    setSelectedRecipeId('');
    setSearchTerm('');
    setShowSearchDropdown(false);
    setShowCreateForm(false);
    resetNewIngredientForm();
  }, [isOpen, meal]);

  const resetNewIngredientForm = () => {
    setNewIngredient({
      name: '',
      brand: '',
      kcal_per_100g: '',
      protein_per_100g: '',
      fat_per_100g: '',
      carbs_per_100g: '',
    });
  };

  // --------------- Recipe selector ---------------
  const handleRecipeSelect = (e) => {
    const id = e.target.value;
    setSelectedRecipeId(id);
    if (!id) return;
    const recipe = (recipes || []).find(
      (r) => String(r.id) === String(id),
    );
    if (!recipe || !recipe.recipe_ingredients) return;
    const rows = recipe.recipe_ingredients
      .filter((ri) => ri.ingredients)
      .map((ri) => ({
        ingredient_id: ri.ingredient_id,
        ingredient: ri.ingredients,
        quantity_g: Number(ri.quantity_g) || 0,
      }));
    setIngredientRows(rows);
    if (!mealName && recipe.name) setMealName(recipe.name);
  };

  // --------------- Macro helpers ---------------
  const calcMacro = (ingredient, qty, field) => {
    const per100 = Number(ingredient?.[field]) || 0;
    return (per100 * qty) / 100;
  };

  const rowMacros = useCallback(
    (row) => ({
      kcal: Math.round(calcMacro(row.ingredient, row.quantity_g, 'kcal_per_100g')),
      protein: Math.round(calcMacro(row.ingredient, row.quantity_g, 'protein_per_100g') * 10) / 10,
      fat: Math.round(calcMacro(row.ingredient, row.quantity_g, 'fat_per_100g') * 10) / 10,
      carbs: Math.round(calcMacro(row.ingredient, row.quantity_g, 'carbs_per_100g') * 10) / 10,
    }),
    [],
  );

  const totals = useMemo(() => {
    return ingredientRows.reduce(
      (acc, row) => {
        const m = rowMacros(row);
        acc.kcal += m.kcal;
        acc.protein += m.protein;
        acc.fat += m.fat;
        acc.carbs += m.carbs;
        return acc;
      },
      { kcal: 0, protein: 0, fat: 0, carbs: 0 },
    );
  }, [ingredientRows, rowMacros]);

  // --------------- Ingredient row actions ---------------
  const updateQty = (index, value) => {
    setIngredientRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, quantity_g: Math.max(0, Number(value) || 0) } : row,
      ),
    );
  };

  const removeRow = (index) => {
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  const addIngredientToTable = (ing) => {
    setIngredientRows((prev) => [
      ...prev,
      {
        ingredient_id: ing.id,
        ingredient: ing,
        quantity_g: 100,
      },
    ]);
    setSearchTerm('');
    setShowSearchDropdown(false);
  };

  // --------------- Ingredient search ---------------
  const filteredIngredients = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const lower = searchTerm.toLowerCase();
    return (ingredients || [])
      .filter((ing) => {
        const name = (ing.name || '').toLowerCase();
        const brand = (ing.brand || '').toLowerCase();
        return name.includes(lower) || brand.includes(lower);
      })
      .slice(0, 10);
  }, [searchTerm, ingredients]);

  // --------------- Create new ingredient ---------------
  const handleCreateIngredient = async () => {
    if (!newIngredient.name.trim()) return;
    const payload = {
      name: newIngredient.name.trim(),
      brand: newIngredient.brand.trim() || null,
      kcal_per_100g: Number(newIngredient.kcal_per_100g) || 0,
      protein_per_100g: Number(newIngredient.protein_per_100g) || 0,
      fat_per_100g: Number(newIngredient.fat_per_100g) || 0,
      carbs_per_100g: Number(newIngredient.carbs_per_100g) || 0,
    };
    if (onAddIngredient) {
      const created = await onAddIngredient(payload);
      if (created) {
        addIngredientToTable(created);
      }
    }
    setShowCreateForm(false);
    resetNewIngredientForm();
  };

  // --------------- Save handlers ---------------
  const handleSave = () => {
    if (onSave) onSave(mealName, ingredientRows);
  };

  const handleSaveAsRecipe = () => {
    if (onSaveAsRecipe) onSaveAsRecipe(mealName, ingredientRows);
  };

  // --------------- Inline styles ---------------
  const modalContentStyle = {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    padding: '24px',
    maxWidth: '700px',
    width: '92%',
    maxHeight: '80vh',
    overflow: 'auto',
    backgroundColor: bg,
    border: `1px solid ${border}`,
    borderRadius: '10px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
    color: textPrimary,
    zIndex: 1001,
  };

  const overlayStyle = {
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: `1px solid ${border}`,
    backgroundColor: inputBg,
    color: textPrimary,
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const smallInputStyle = {
    ...inputStyle,
    width: '80px',
    textAlign: 'right',
    padding: '6px 8px',
    fontSize: '13px',
  };

  const btnPrimary = {
    padding: '8px 18px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3B82F6',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const btnSecondary = {
    padding: '8px 18px',
    borderRadius: '6px',
    border: `1px solid ${border}`,
    backgroundColor: 'transparent',
    color: textPrimary,
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const btnDanger = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#EF4444',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const thStyle = {
    textAlign: 'right',
    padding: '8px 10px',
    color: textMuted,
    fontWeight: 500,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const tdStyle = {
    padding: '8px 10px',
    textAlign: 'right',
    color: textPrimary,
    fontSize: '13px',
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      shouldCloseOnOverlayClick={true}
      style={{ content: modalContentStyle, overlay: overlayStyle }}
    >
      {/* ===================== HEADER ===================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '14px',
          borderBottom: `1px solid ${border}`,
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: textPrimary }}>
          {meal ? 'Edit Meal' : 'New Meal'}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: textSecondary,
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiX size={20} />
        </button>
      </div>

      {/* ===================== RECIPE SELECTOR ===================== */}
      {recipes && recipes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, color: textSecondary }}>
            Pre-fill from recipe (optional)
          </label>
          <select
            value={selectedRecipeId}
            onChange={handleRecipeSelect}
            style={{
              ...inputStyle,
              cursor: 'pointer',
            }}
          >
            <option value="">-- Select a recipe --</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ===================== MEAL NAME ===================== */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, color: textSecondary }}>
          Meal name
        </label>
        <input
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          placeholder="e.g. Chicken Salad Lunch"
          style={inputStyle}
        />
      </div>

      {/* ===================== INGREDIENT TABLE ===================== */}
      <div style={{ marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${border}` }}>
              <th style={{ ...thStyle, textAlign: 'left' }}>Ingredient</th>
              <th style={thStyle}>Qty (g)</th>
              <th style={thStyle}>Kcal</th>
              <th style={thStyle}>P</th>
              <th style={thStyle}>F</th>
              <th style={thStyle}>C</th>
              <th style={{ ...thStyle, width: '36px' }}></th>
            </tr>
          </thead>
          <tbody>
            {ingredientRows.map((row, idx) => {
              const m = rowMacros(row);
              return (
                <tr
                  key={`${row.ingredient_id}-${idx}`}
                  style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}
                >
                  <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500 }}>
                    {row.ingredient?.name || 'Unknown'}
                    {row.ingredient?.brand && (
                      <span style={{ color: textMuted, fontWeight: 400, marginLeft: '6px', fontSize: '11px' }}>
                        ({row.ingredient.brand})
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, padding: '4px 6px' }}>
                    <input
                      type="number"
                      min="0"
                      value={row.quantity_g}
                      onChange={(e) => updateQty(idx, e.target.value)}
                      style={smallInputStyle}
                    />
                  </td>
                  <td style={tdStyle}>{m.kcal}</td>
                  <td style={tdStyle}>{m.protein}</td>
                  <td style={tdStyle}>{m.fat}</td>
                  <td style={tdStyle}>{m.carbs}</td>
                  <td style={{ ...tdStyle, textAlign: 'center', padding: '4px' }}>
                    <button onClick={() => removeRow(idx)} style={btnDanger} title="Remove ingredient">
                      <FiX size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* TOTALS ROW */}
            {ingredientRows.length > 0 && (
              <tr style={{ borderTop: `2px solid ${border}` }}>
                <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 700, fontSize: '13px' }}>
                  Total
                </td>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#F59E0B' }}>
                  {Math.round(totals.kcal)}
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#3B82F6' }}>
                  {Math.round(totals.protein * 10) / 10}
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#EF4444' }}>
                  {Math.round(totals.fat * 10) / 10}
                </td>
                <td style={{ ...tdStyle, fontWeight: 700, color: '#10B981' }}>
                  {Math.round(totals.carbs * 10) / 10}
                </td>
                <td></td>
              </tr>
            )}

            {ingredientRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: '24px 10px',
                    textAlign: 'center',
                    color: textMuted,
                    fontSize: '13px',
                  }}
                >
                  No ingredients yet. Search below to add.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== ADD INGREDIENT SEARCH ===================== */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 500, color: textSecondary }}>
          Add ingredient
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchDropdown(e.target.value.length >= 2);
                setShowCreateForm(false);
              }}
              placeholder="Type to search ingredients (min 2 chars)..."
              style={inputStyle}
              onFocus={() => {
                if (searchTerm.length >= 2) setShowSearchDropdown(true);
              }}
              onBlur={() => {
                // Delay to allow click on dropdown item
                setTimeout(() => setShowSearchDropdown(false), 200);
              }}
            />

            {/* Search dropdown */}
            {showSearchDropdown && searchTerm.length >= 2 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  maxHeight: '220px',
                  overflowY: 'auto',
                  backgroundColor: isDark ? '#1F2937' : '#fff',
                  border: `1px solid ${border}`,
                  borderRadius: '6px',
                  marginTop: '4px',
                  zIndex: 50,
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                }}
              >
                {filteredIngredients.length > 0 ? (
                  filteredIngredients.map((ing) => (
                    <div
                      key={ing.id}
                      onMouseDown={() => addIngredientToTable(ing)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: textPrimary,
                        borderBottom: `1px solid ${isDark ? '#374151' : '#F3F4F6'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = rowHoverBg;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>
                        {ing.name}
                        {ing.brand && (
                          <span style={{ color: textMuted, marginLeft: '6px', fontSize: '11px' }}>
                            ({ing.brand})
                          </span>
                        )}
                      </span>
                      <span style={{ color: textMuted, fontSize: '11px' }}>
                        {ing.kcal_per_100g} kcal/100g
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
                    No ingredients found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setShowCreateForm((v) => !v);
              setShowSearchDropdown(false);
              if (!showCreateForm && searchTerm.trim()) {
                setNewIngredient((prev) => ({ ...prev, name: searchTerm.trim() }));
              }
            }}
            style={{
              ...btnSecondary,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            title="Create a new ingredient"
          >
            <FaPlus size={10} /> Create new
          </button>
        </div>

        {/* Inline create form */}
        {showCreateForm && (
          <div
            style={{
              marginTop: '12px',
              padding: '14px',
              borderRadius: '8px',
              border: `1px solid ${border}`,
              backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 600, color: textSecondary, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              New Ingredient
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '3px' }}>Name *</label>
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient((p) => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                  placeholder="Ingredient name"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '3px' }}>Brand</label>
                <input
                  type="text"
                  value={newIngredient.brand}
                  onChange={(e) => setNewIngredient((p) => ({ ...p, brand: e.target.value }))}
                  style={inputStyle}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
              {[
                { key: 'kcal_per_100g', label: 'Kcal/100g' },
                { key: 'protein_per_100g', label: 'Protein/100g' },
                { key: 'fat_per_100g', label: 'Fat/100g' },
                { key: 'carbs_per_100g', label: 'Carbs/100g' },
              ].map((f) => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '11px', color: textMuted, marginBottom: '3px' }}>{f.label}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={newIngredient[f.key]}
                    onChange={(e) => setNewIngredient((p) => ({ ...p, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, textAlign: 'right' }}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  resetNewIngredientForm();
                }}
                style={btnSecondary}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateIngredient}
                disabled={!newIngredient.name.trim()}
                style={{
                  ...btnPrimary,
                  opacity: newIngredient.name.trim() ? 1 : 0.5,
                  cursor: newIngredient.name.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FaPlus size={10} /> Add Ingredient
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===================== FOOTER ===================== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '14px',
          borderTop: `1px solid ${border}`,
        }}
      >
        <button onClick={onClose} style={btnSecondary}>
          Cancel
        </button>
        <button
          onClick={handleSaveAsRecipe}
          disabled={ingredientRows.length === 0}
          style={{
            ...btnSecondary,
            opacity: ingredientRows.length > 0 ? 1 : 0.5,
            cursor: ingredientRows.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Save as New Recipe
        </button>
        <button
          onClick={handleSave}
          disabled={ingredientRows.length === 0}
          style={{
            ...btnPrimary,
            opacity: ingredientRows.length > 0 ? 1 : 0.5,
            cursor: ingredientRows.length > 0 ? 'pointer' : 'not-allowed',
          }}
        >
          Save Meal
        </button>
      </div>
    </Modal>
  );
};

export default MealEditorModal;
