import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';

const useHealthData = (activeTab) => {
  // Sub-tab navigation
  const [activeHealthTab, setActiveHealthTab] = useState('dashboard');

  // Nutrition sub-tab navigation
  const [activeNutritionSubTab, setActiveNutritionSubTab] = useState('meal-planning');

  // Body metrics
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [bodyMetricsLoading, setBodyMetricsLoading] = useState(false);
  const [bodyMetricsRefresh, setBodyMetricsRefresh] = useState(0);

  // Meals & Nutrition
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [selectedMealDate, setSelectedMealDate] = useState(new Date().toISOString().split('T')[0]);

  // Meal ingredients (new model)
  const [mealIngredients, setMealIngredients] = useState([]);
  const [mealsRefresh, setMealsRefresh] = useState(0);

  // Tracker data
  const [trackerMeals, setTrackerMeals] = useState([]);
  const [trackerLoading, setTrackerLoading] = useState(false);

  // Training
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [trainingLoading, setTrainingLoading] = useState(false);

  // Planner
  const [weeklyPlans, setWeeklyPlans] = useState([]);
  const [goals, setGoals] = useState([]);
  const [routineSchedule, setRoutineSchedule] = useState([]);
  const [plannerLoading, setPlannerLoading] = useState(false);

  // Search
  const [healthSearchQuery, setHealthSearchQuery] = useState('');

  // Selected items
  const [selectedBodyMetric, setSelectedBodyMetric] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedTrainingSession, setSelectedTrainingSession] = useState(null);

  // ==================== FETCH BODY METRICS ====================
  useEffect(() => {
    const fetchBodyMetrics = async () => {
      setBodyMetricsLoading(true);
      const { data, error } = await supabase
        .from('body_metrics')
        .select('*')
        .order('date', { ascending: true });
      if (error) console.error('Error fetching body_metrics:', error);
      else setBodyMetrics(data || []);
      setBodyMetricsLoading(false);
    };
    if (activeTab === 'health') fetchBodyMetrics();
  }, [activeTab, bodyMetricsRefresh]);

  // ==================== FETCH MEALS + MEAL INGREDIENTS ====================
  const fetchMealIngredientsForDate = useCallback(async (mealsData, date) => {
    const dateMeals = mealsData.filter(m => m.date === date);
    const mealIds = dateMeals.map(m => m.id);
    if (!mealIds.length) { setMealIngredients([]); return; }
    const { data, error } = await supabase
      .from('meal_ingredients')
      .select('*, ingredients(*)')
      .in('meal_id', mealIds);
    if (error) console.error('Error fetching meal_ingredients:', error);
    else setMealIngredients(data || []);
  }, []);

  useEffect(() => {
    const fetchMeals = async () => {
      setMealsLoading(true);
      const { data, error } = await supabase
        .from('meals')
        .select('*, recipes(id, name, servings, image_url, recipe_ingredients(*, ingredients(*)))')
        .order('date', { ascending: false });
      if (error) {
        console.error('Error fetching meals:', error);
      } else {
        setMeals(data || []);
        await fetchMealIngredientsForDate(data || [], selectedMealDate);
      }
      setMealsLoading(false);
    };
    if (activeTab === 'health' && (activeHealthTab === 'nutrition' || activeHealthTab === 'dashboard')) {
      fetchMeals();
    }
  }, [activeTab, activeHealthTab, mealsRefresh, fetchMealIngredientsForDate, selectedMealDate]);

  // Re-fetch meal ingredients when date changes (without re-fetching all meals)
  useEffect(() => {
    fetchMealIngredientsForDate(meals, selectedMealDate);
  }, [selectedMealDate]);

  // Raw filter (no dependency on mealIngredients to avoid circular)
  const mealsForDateRaw = useMemo(() => {
    return meals.filter(m => m.date === selectedMealDate);
  }, [meals, selectedMealDate]);

  // ==================== FETCH RECIPES ====================
  useEffect(() => {
    const fetchRecipes = async () => {
      setRecipesLoading(true);
      const { data, error } = await supabase
        .from('recipes')
        .select('*, recipe_ingredients(*, ingredients(*))')
        .order('name', { ascending: true });
      if (error) console.error('Error fetching recipes:', error);
      else setRecipes(data || []);
      setRecipesLoading(false);
    };
    if (activeTab === 'health' && activeHealthTab === 'nutrition') {
      fetchRecipes();
    }
  }, [activeTab, activeHealthTab, mealsRefresh]);

  // ==================== FETCH INGREDIENTS ====================
  useEffect(() => {
    const fetchIngredients = async () => {
      setIngredientsLoading(true);
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });
      if (error) console.error('Error fetching ingredients:', error);
      else setIngredients(data || []);
      setIngredientsLoading(false);
    };
    if (activeTab === 'health' && activeHealthTab === 'nutrition') {
      fetchIngredients();
    }
  }, [activeTab, activeHealthTab, mealsRefresh]);

  // ==================== FETCH TRACKER DATA ====================
  useEffect(() => {
    const fetchTrackerData = async () => {
      setTrackerLoading(true);
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meals')
        .select('*, meal_ingredients(*, ingredients(*)), recipes(id, name, servings, image_url, recipe_ingredients(*, ingredients(*)))')
        .gte('date', dateStr)
        .order('date', { ascending: true });
      if (error) console.error('Error fetching tracker meals:', error);
      else setTrackerMeals(data || []);
      setTrackerLoading(false);
    };
    if (activeTab === 'health' && activeHealthTab === 'nutrition' && activeNutritionSubTab === 'tracker') {
      fetchTrackerData();
    }
  }, [activeTab, activeHealthTab, activeNutritionSubTab, mealsRefresh]);

  // ==================== FETCH TRAINING ====================
  useEffect(() => {
    const fetchTraining = async () => {
      setTrainingLoading(true);
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('date', { ascending: false });
      if (error) console.error('Error fetching training_sessions:', error);
      else setTrainingSessions(data || []);
      setTrainingLoading(false);
    };
    if (activeTab === 'health' && (activeHealthTab === 'training' || activeHealthTab === 'dashboard')) {
      fetchTraining();
    }
  }, [activeTab, activeHealthTab]);

  // ==================== FETCH PLANNER ====================
  useEffect(() => {
    const fetchPlanner = async () => {
      setPlannerLoading(true);
      const [wp, g, rs] = await Promise.all([
        supabase.from('weekly_plans').select('*').order('week_number', { ascending: true }),
        supabase.from('goals').select('*').order('created_at', { ascending: true }),
        supabase.from('routine_schedule').select('*').order('time_slot', { ascending: true }),
      ]);
      if (wp.error) console.error('Error fetching weekly_plans:', wp.error);
      else setWeeklyPlans(wp.data || []);
      if (g.error) console.error('Error fetching goals:', g.error);
      else setGoals(g.data || []);
      if (rs.error) console.error('Error fetching routine_schedule:', rs.error);
      else setRoutineSchedule(rs.data || []);
      setPlannerLoading(false);
    };
    if (activeTab === 'health' && activeHealthTab === 'planner') {
      fetchPlanner();
    }
  }, [activeTab, activeHealthTab]);

  // ==================== COMPUTED: DASHBOARD VALUES ====================
  const dashboardData = useMemo(() => {
    if (!bodyMetrics.length) return null;

    const sorted = [...bodyMetrics].sort((a, b) => new Date(a.date) - new Date(b.date));
    const startWeight = sorted[0]?.weight_kg ? Number(sorted[0].weight_kg) : null;
    const currentWeight = sorted[sorted.length - 1]?.weight_kg ? Number(sorted[sorted.length - 1].weight_kg) : null;
    const goalWeight = 88.6;
    const totalToLose = startWeight ? startWeight - goalWeight : 0;
    const totalLost = startWeight && currentWeight ? startWeight - currentWeight : 0;
    const stillToLose = currentWeight ? currentWeight - goalWeight : 0;

    const dailyDeltas = sorted.map((m, i) => {
      if (i === 0) return { date: m.date, delta: 0, weight: Number(m.weight_kg) };
      const prev = Number(sorted[i - 1].weight_kg);
      const curr = Number(m.weight_kg);
      return { date: m.date, delta: Number((curr - prev).toFixed(2)), weight: curr };
    });

    const dayVictories = dailyDeltas.filter(d => d.delta < 0).length;
    const dayLosses = dailyDeltas.filter(d => d.delta > 0).length;
    const totalDays = dailyDeltas.length > 1 ? dailyDeltas.length - 1 : 0;

    const weekMap = {};
    sorted.forEach(m => {
      const d = new Date(m.date);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      const key = `W${String(weekNum).padStart(2, '0')}`;
      if (!weekMap[key]) weekMap[key] = [];
      weekMap[key].push(Number(m.weight_kg));
    });
    const weeklyAverages = Object.entries(weekMap).map(([week, weights]) => ({
      week,
      avg: Number((weights.reduce((s, w) => s + w, 0) / weights.length).toFixed(1)),
    }));

    const totalWeeks = weeklyAverages.length || 22;
    const goalTrajectory = weeklyAverages.map((wa, i) => ({
      week: wa.week,
      target: startWeight ? Number((startWeight - ((startWeight - goalWeight) * (i + 1) / totalWeeks)).toFixed(1)) : goalWeight,
    }));

    const cumulativeLost = sorted.map(m => ({
      date: m.date,
      lost: startWeight ? Number((startWeight - Number(m.weight_kg)).toFixed(2)) : 0,
    }));

    return {
      startWeight,
      currentWeight,
      goalWeight,
      totalToLose: Number(totalToLose.toFixed(1)),
      totalLost: Number(totalLost.toFixed(1)),
      stillToLose: Number(stillToLose.toFixed(1)),
      dayVictories,
      dayLosses,
      totalDays,
      weeklyAverages,
      goalTrajectory,
      dailyDeltas,
      cumulativeLost,
      daysElapsed: totalDays,
      victoryPct: totalDays > 0 ? Math.round((dayVictories / totalDays) * 100) : 0,
    };
  }, [bodyMetrics]);

  // ==================== MACRO HELPERS ====================

  // Compute macros for a recipe (unchanged)
  const getRecipeMacros = useCallback((recipe) => {
    if (!recipe?.recipe_ingredients) return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    const servings = recipe.servings || 1;
    let kcal = 0, protein = 0, fat = 0, carbs = 0;
    recipe.recipe_ingredients.forEach(ri => {
      const ing = ri.ingredients;
      if (!ing) return;
      const grams = Number(ri.quantity_g) || 0;
      const factor = grams / 100;
      kcal += (Number(ing.kcal_per_100g) || 0) * factor;
      protein += (Number(ing.protein_per_100g) || 0) * factor;
      fat += (Number(ing.fat_per_100g) || 0) * factor;
      carbs += (Number(ing.carbs_per_100g) || 0) * factor;
    });
    return {
      kcal: Math.round(kcal / servings),
      protein: Math.round(protein / servings),
      fat: Math.round(fat / servings),
      carbs: Math.round(carbs / servings),
    };
  }, []);

  // Compute macros for a meal from meal_ingredients × servings
  // meal_ingredients stores per-serving quantities; meals.servings = how many servings eaten
  const getMealMacros = useCallback((mealId) => {
    const items = mealIngredients.filter(mi => mi.meal_id === mealId);
    if (!items.length) return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
    const meal = meals.find(m => m.id === mealId);
    const servings = Number(meal?.servings) || 1;
    let kcal = 0, protein = 0, fat = 0, carbs = 0;
    items.forEach(mi => {
      const ing = mi.ingredients;
      if (!ing) return;
      const factor = (Number(mi.quantity_g) || 0) / 100;
      kcal += (Number(ing.kcal_per_100g) || 0) * factor;
      protein += (Number(ing.protein_per_100g) || 0) * factor;
      fat += (Number(ing.fat_per_100g) || 0) * factor;
      carbs += (Number(ing.carbs_per_100g) || 0) * factor;
    });
    return {
      kcal: Math.round(kcal * servings),
      protein: Math.round(protein * servings),
      fat: Math.round(fat * servings),
      carbs: Math.round(carbs * servings),
    };
  }, [mealIngredients, meals]);

  // Get meal_ingredients for a specific meal
  const getMealIngredientRows = useCallback((mealId) => {
    return mealIngredients.filter(mi => mi.meal_id === mealId);
  }, [mealIngredients]);

  // Current week number
  const currentWeek = useMemo(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  }, []);

  // Filter meals by selected date
  const mealsForDate = mealsForDateRaw;

  // Daily macros total — meal_ingredients (per-serving) × meal.servings, fallback: recipe-based
  const dailyMacros = useMemo(() => {
    let kcal = 0, protein = 0, fat = 0, carbs = 0;
    mealsForDate.forEach(meal => {
      const servings = Number(meal.servings) || 1;
      const mealMi = mealIngredients.filter(mi => mi.meal_id === meal.id);
      if (mealMi.length > 0) {
        mealMi.forEach(mi => {
          const ing = mi.ingredients;
          if (!ing) return;
          const factor = (Number(mi.quantity_g) || 0) / 100;
          kcal += (Number(ing.kcal_per_100g) || 0) * factor * servings;
          protein += (Number(ing.protein_per_100g) || 0) * factor * servings;
          fat += (Number(ing.fat_per_100g) || 0) * factor * servings;
          carbs += (Number(ing.carbs_per_100g) || 0) * factor * servings;
        });
      } else if (meal.recipes) {
        const macros = getRecipeMacros(meal.recipes);
        kcal += macros.kcal * servings;
        protein += macros.protein * servings;
        fat += macros.fat * servings;
        carbs += macros.carbs * servings;
      }
    });
    return {
      kcal: Math.round(kcal),
      protein: Math.round(protein),
      fat: Math.round(fat),
      carbs: Math.round(carbs),
    };
  }, [mealsForDate, mealIngredients, getRecipeMacros]);

  // Daily targets based on day of week
  const dailyTargets = useMemo(() => {
    const date = new Date(selectedMealDate + 'T12:00:00');
    const day = date.getDay(); // 0=Sun, 6=Sat
    let kcalTarget = 1700;
    if (day === 6) kcalTarget = 2600; // Saturday
    if (day === 0) kcalTarget = 2200; // Sunday
    return { kcal: kcalTarget, protein: 135 };
  }, [selectedMealDate]);

  // ==================== HANDLERS ====================

  const addBodyMetric = useCallback(async (date, weight_kg, lean_mass_kg, body_fat_kg) => {
    try {
      const body_fat_pct = weight_kg && body_fat_kg ? Number(((body_fat_kg / weight_kg) * 100).toFixed(1)) : null;
      const lean_pct = weight_kg && lean_mass_kg ? Number(((lean_mass_kg / weight_kg) * 100).toFixed(1)) : null;

      const { error } = await supabase
        .from('body_metrics')
        .upsert({
          date,
          weight_kg,
          lean_mass_kg: lean_mass_kg || null,
          body_fat_kg: body_fat_kg || null,
          body_fat_pct,
          lean_pct,
        }, { onConflict: 'date' });
      if (error) throw error;
      toast.success('Body metric saved');
      setBodyMetricsRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Error adding body metric:', err);
      toast.error('Failed to save body metric');
    }
  }, []);

  const deleteBodyMetric = useCallback(async (date) => {
    try {
      const { error } = await supabase
        .from('body_metrics')
        .delete()
        .eq('date', date);
      if (error) throw error;
      toast.success('Body metric deleted');
      setBodyMetricsRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Error deleting body metric:', err);
      toast.error('Failed to delete body metric');
    }
  }, []);

  const addTrainingSession = useCallback(async (date, session_type, duration_min, notes) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .insert({ date, session_type, duration_min, notes: notes || null });
      if (error) throw error;
      toast.success('Training session logged');
      setTrainingSessions(prev => [{ date, session_type, duration_min, notes, created_at: new Date().toISOString() }, ...prev]);
    } catch (err) {
      console.error('Error adding training session:', err);
      toast.error('Failed to log training session');
    }
  }, []);

  const deleteTrainingSession = useCallback(async (id) => {
    try {
      const { error } = await supabase
        .from('training_sessions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Training session deleted');
      setTrainingSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting training session:', err);
      toast.error('Failed to delete');
    }
  }, []);

  const toggleGoal = useCallback(async (id, currentValue) => {
    try {
      const { error } = await supabase
        .from('goals')
        .update({ is_completed: !currentValue })
        .eq('id', id);
      if (error) throw error;
      setGoals(prev => prev.map(g => g.id === id ? { ...g, is_completed: !currentValue } : g));
    } catch (err) {
      console.error('Error toggling goal:', err);
      toast.error('Failed to update goal');
    }
  }, []);

  const addGoal = useCallback(async (title, category, target_date) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({ title, category: category || 'health', target_date: target_date || null })
        .select()
        .single();
      if (error) throw error;
      toast.success('Goal added');
      setGoals(prev => [...prev, data]);
    } catch (err) {
      console.error('Error adding goal:', err);
      toast.error('Failed to add goal');
    }
  }, []);

  const deleteGoal = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('goals').delete().eq('id', id);
      if (error) throw error;
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Goal deleted');
    } catch (err) {
      console.error('Error deleting goal:', err);
      toast.error('Failed to delete goal');
    }
  }, []);

  // ==================== MEAL CRUD (REVISED) ====================

  const addMeal = useCallback(async (date, meal_type, recipe_id, servings, name, ingredientRows) => {
    try {
      // Insert the meal
      const mealInsert = {
        date,
        meal_type,
        recipe_id: recipe_id || null,
        servings: servings || 1,
        name: name || null,
      };
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert(mealInsert)
        .select('*, recipes(id, name, servings, image_url, recipe_ingredients(*, ingredients(*)))')
        .single();
      if (mealError) throw mealError;

      // If recipe_id provided and no custom ingredientRows, copy from recipe (per-serving)
      if (recipe_id && (!ingredientRows || ingredientRows.length === 0)) {
        const recipeServings = Number(mealData.recipes?.servings) || 1;
        const { data: riData } = await supabase
          .from('recipe_ingredients')
          .select('ingredient_id, quantity_g')
          .eq('recipe_id', recipe_id);
        if (riData && riData.length > 0) {
          const miRows = riData.map(ri => ({
            meal_id: mealData.id,
            ingredient_id: ri.ingredient_id,
            quantity_g: Number((ri.quantity_g / recipeServings).toFixed(2)),
          }));
          await supabase.from('meal_ingredients').insert(miRows);
        }
      } else if (ingredientRows && ingredientRows.length > 0) {
        // Insert custom ingredient rows
        const miRows = ingredientRows.map(ir => ({
          meal_id: mealData.id,
          ingredient_id: ir.ingredient_id,
          quantity_g: ir.quantity_g,
        }));
        await supabase.from('meal_ingredients').insert(miRows);
      }

      toast.success('Meal added');
      setMealsRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Error adding meal:', err);
      toast.error('Failed to add meal');
    }
  }, []);

  const deleteMeal = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('meals').delete().eq('id', id);
      if (error) throw error;
      setMeals(prev => prev.filter(m => m.id !== id));
      setMealIngredients(prev => prev.filter(mi => mi.meal_id !== id));
      toast.success('Meal deleted');
    } catch (err) {
      console.error('Error deleting meal:', err);
      toast.error('Failed to delete meal');
    }
  }, []);

  const updateMealIngredients = useCallback(async (mealId, ingredientRows) => {
    try {
      // Delete old
      await supabase.from('meal_ingredients').delete().eq('meal_id', mealId);
      // Insert new
      if (ingredientRows.length > 0) {
        const miRows = ingredientRows.map(ir => ({
          meal_id: mealId,
          ingredient_id: ir.ingredient_id,
          quantity_g: ir.quantity_g,
        }));
        const { error } = await supabase.from('meal_ingredients').insert(miRows);
        if (error) throw error;
      }
      toast.success('Meal updated');
      setMealsRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Error updating meal ingredients:', err);
      toast.error('Failed to update meal');
    }
  }, []);

  const updateMealName = useCallback(async (mealId, name) => {
    try {
      const { error } = await supabase.from('meals').update({ name }).eq('id', mealId);
      if (error) throw error;
      setMeals(prev => prev.map(m => m.id === mealId ? { ...m, name } : m));
    } catch (err) {
      console.error('Error updating meal name:', err);
      toast.error('Failed to update meal name');
    }
  }, []);

  const updateMealServings = useCallback(async (mealId, servings) => {
    try {
      const { error } = await supabase.from('meals').update({ servings }).eq('id', mealId);
      if (error) throw error;
      setMeals(prev => prev.map(m => m.id === mealId ? { ...m, servings } : m));
      setMealsRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Error updating meal servings:', err);
      toast.error('Failed to update servings');
    }
  }, []);

  // ==================== INGREDIENT CRUD ====================

  const addIngredient = useCallback(async (data) => {
    try {
      const { data: newIng, error } = await supabase
        .from('ingredients')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      toast.success('Ingredient added');
      setIngredients(prev => [...prev, newIng].sort((a, b) => a.name.localeCompare(b.name)));
      return newIng;
    } catch (err) {
      console.error('Error adding ingredient:', err);
      toast.error('Failed to add ingredient');
      return null;
    }
  }, []);

  const updateIngredient = useCallback(async (id, updates) => {
    try {
      const { data: updated, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      setIngredients(prev => prev.map(i => i.id === id ? updated : i));
      return updated;
    } catch (err) {
      console.error('Error updating ingredient:', err);
      toast.error('Failed to update ingredient');
      return null;
    }
  }, []);

  const deleteIngredient = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('ingredients').delete().eq('id', id);
      if (error) throw error;
      setIngredients(prev => prev.filter(i => i.id !== id));
      toast.success('Ingredient deleted');
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      toast.error('Failed to delete ingredient (may be in use)');
    }
  }, []);

  // ==================== RECIPE CRUD ====================

  const addRecipe = useCallback(async (recipeData, ingredientRows) => {
    try {
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select()
        .single();
      if (recipeError) throw recipeError;

      if (ingredientRows && ingredientRows.length > 0) {
        const riRows = ingredientRows.map(ir => ({
          recipe_id: newRecipe.id,
          ingredient_id: ir.ingredient_id,
          quantity_g: ir.quantity_g,
        }));
        await supabase.from('recipe_ingredients').insert(riRows);
      }

      toast.success('Recipe created');
      setMealsRefresh(prev => prev + 1);
      return newRecipe;
    } catch (err) {
      console.error('Error adding recipe:', err);
      toast.error('Failed to create recipe');
      return null;
    }
  }, []);

  const updateRecipe = useCallback(async (id, recipeData, ingredientRows) => {
    try {
      const { error: recipeError } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', id);
      if (recipeError) throw recipeError;

      if (ingredientRows !== undefined) {
        await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
        if (ingredientRows.length > 0) {
          const riRows = ingredientRows.map(ir => ({
            recipe_id: id,
            ingredient_id: ir.ingredient_id,
            quantity_g: ir.quantity_g,
          }));
          await supabase.from('recipe_ingredients').insert(riRows);
        }
      }

      toast.success('Recipe updated');
      setMealsRefresh(prev => prev + 1);
    } catch (err) {
      console.error('Error updating recipe:', err);
      toast.error('Failed to update recipe');
    }
  }, []);

  const deleteRecipe = useCallback(async (id) => {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', id);
      if (error) throw error;
      setRecipes(prev => prev.filter(r => r.id !== id));
      toast.success('Recipe deleted');
    } catch (err) {
      console.error('Error deleting recipe:', err);
      toast.error('Failed to delete recipe');
    }
  }, []);

  const saveAsNewRecipe = useCallback(async (name, ingredientRows, servings) => {
    try {
      const newRecipe = await addRecipe({ name, servings: servings || 1 }, ingredientRows);
      return newRecipe;
    } catch (err) {
      console.error('Error saving as new recipe:', err);
      toast.error('Failed to save as recipe');
      return null;
    }
  }, [addRecipe]);

  // ---------- HEALTH IMAGE UPLOAD ----------

  const uploadHealthImage = useCallback(async (entityType, entityId, file) => {
    try {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPEG, PNG, or WebP images are allowed');
        return null;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return null;
      }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `health/${entityType}/${entityId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(path);

      const { error: updateError } = await supabase
        .from(entityType)
        .update({ image_url: publicUrl })
        .eq('id', entityId);
      if (updateError) throw updateError;

      // Update local state
      const setterMap = { ingredients: setIngredients, meals: setMeals, recipes: setRecipes };
      const setter = setterMap[entityType];
      if (setter) {
        setter(prev => prev.map(item => item.id === entityId ? { ...item, image_url: publicUrl } : item));
      }
      // Force re-fetch meals so joined data (recipes, ingredients) also refreshes
      setMealsRefresh(prev => prev + 1);

      toast.success('Image uploaded');
      return publicUrl;
    } catch (err) {
      console.error('Error uploading health image:', err);
      toast.error('Failed to upload image');
      return null;
    }
  }, []);

  const removeHealthImage = useCallback(async (entityType, entityId) => {
    try {
      const { error } = await supabase
        .from(entityType)
        .update({ image_url: null })
        .eq('id', entityId);
      if (error) throw error;

      const setterMap = { ingredients: setIngredients, meals: setMeals, recipes: setRecipes };
      const setter = setterMap[entityType];
      if (setter) {
        setter(prev => prev.map(item => item.id === entityId ? { ...item, image_url: null } : item));
      }

      toast.success('Image removed');
    } catch (err) {
      console.error('Error removing health image:', err);
      toast.error('Failed to remove image');
    }
  }, []);

  return {
    // Sub-tab
    activeHealthTab, setActiveHealthTab,

    // Nutrition sub-tab
    activeNutritionSubTab, setActiveNutritionSubTab,

    // Body metrics
    bodyMetrics, bodyMetricsLoading,
    selectedBodyMetric, setSelectedBodyMetric,
    addBodyMetric, deleteBodyMetric,

    // Meals & Nutrition
    meals, mealsLoading,
    recipes, recipesLoading,
    ingredients, ingredientsLoading,
    selectedMealDate, setSelectedMealDate,
    mealsForDate, dailyMacros,
    dailyTargets,
    selectedRecipe, setSelectedRecipe,
    addMeal, deleteMeal,
    getRecipeMacros,

    // Meal ingredients (new)
    mealIngredients, getMealMacros, getMealIngredientRows,
    updateMealIngredients, updateMealName, updateMealServings,

    // Ingredient CRUD
    addIngredient, updateIngredient, deleteIngredient,

    // Recipe CRUD
    addRecipe, updateRecipe, deleteRecipe, saveAsNewRecipe,

    // Health images
    uploadHealthImage, removeHealthImage,

    // Tracker
    trackerMeals, trackerLoading,

    // Training
    trainingSessions, trainingLoading,
    selectedTrainingSession, setSelectedTrainingSession,
    addTrainingSession, deleteTrainingSession,

    // Planner
    weeklyPlans, goals, routineSchedule, plannerLoading,
    currentWeek,
    toggleGoal, addGoal, deleteGoal,

    // Dashboard computed
    dashboardData,

    // Search
    healthSearchQuery, setHealthSearchQuery,
  };
};

export default useHealthData;
