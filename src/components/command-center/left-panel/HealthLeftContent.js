import React from 'react';
import { FaChartLine, FaUtensils, FaWeight, FaDumbbell, FaCalendarAlt, FaCheck, FaListAlt, FaBook, FaCalendarDay, FaChartBar, FaChevronLeft } from 'react-icons/fa';
import {
  EmailList,
  EmailItem,
} from '../../../pages/CommandCenterPage.styles';

const HEALTH_TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartLine, color: '#3B82F6' },
  { id: 'nutrition', label: 'Nutrition', icon: FaUtensils, color: '#F59E0B' },
  { id: 'body', label: 'Body', icon: FaWeight, color: '#10B981' },
  { id: 'training', label: 'Training', icon: FaDumbbell, color: '#8B5CF6' },
  { id: 'planner', label: 'Planner', icon: FaCalendarAlt, color: '#EC4899' },
];

const NUTRITION_SUB_TABS = [
  { id: 'ingredients', label: 'Ingredients', icon: FaListAlt, color: '#F59E0B' },
  { id: 'recipes', label: 'Recipes', icon: FaBook, color: '#F59E0B' },
  { id: 'meal-planning', label: 'Meal Planning', icon: FaCalendarDay, color: '#F59E0B' },
  { id: 'tracker', label: 'Tracker', icon: FaChartBar, color: '#F59E0B' },
];

const HealthLeftContent = ({ theme, healthHook }) => {
  const {
    activeHealthTab, setActiveHealthTab,
    activeNutritionSubTab, setActiveNutritionSubTab,
    bodyMetrics, bodyMetricsLoading,
    selectedBodyMetric, setSelectedBodyMetric,
    recipes, recipesLoading,
    ingredients,
    selectedRecipe, setSelectedRecipe,
    trainingSessions, trainingLoading,
    selectedTrainingSession, setSelectedTrainingSession,
    weeklyPlans, plannerLoading,
    dashboardData,
    dailyMacros,
    getRecipeMacros,
    currentWeek,
  } = healthHook;

  const latestWeight = bodyMetrics.length > 0 ? Number(bodyMetrics[bodyMetrics.length - 1].weight_kg) : null;

  const getSubtitle = (tabId) => {
    switch (tabId) {
      case 'dashboard':
        return dashboardData ? `${dashboardData.totalLost} kg lost` : 'No data';
      case 'nutrition':
        return `${recipes.length} recipes`;
      case 'body':
        return latestWeight ? `${latestWeight} kg` : 'No data';
      case 'training':
        return `${trainingSessions.length} sessions`;
      case 'planner':
        return `W${String(currentWeek).padStart(2, '0')}`;
      default:
        return '';
    }
  };

  const getNutritionSubtitle = (subTabId) => {
    switch (subTabId) {
      case 'ingredients': return `${ingredients.length} items`;
      case 'recipes': return `${recipes.length} recipes`;
      case 'meal-planning': return `${dailyMacros.kcal} kcal today`;
      case 'tracker': return 'Progress';
      default: return '';
    }
  };

  // Items to render in navigation: when nutrition is active, show nutrition sub-tabs only
  const isNutritionActive = activeHealthTab === 'nutrition';

  const navItems = isNutritionActive
    ? NUTRITION_SUB_TABS
    : HEALTH_TABS;

  return (
    <EmailList>
      {/* Navigation */}
      <div style={{ padding: '8px 12px', borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}` }}>
        {/* Back button when inside Nutrition */}
        {isNutritionActive && (
          <div
            onClick={() => setActiveHealthTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '6px',
              transition: 'all 0.15s',
            }}
          >
            <FaChevronLeft size={10} style={{ color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }} />
            <span style={{ fontSize: '12px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontWeight: 500 }}>Health</span>
          </div>
        )}

        {navItems.map(tab => {
          const Icon = tab.icon;
          const isActive = isNutritionActive
            ? activeNutritionSubTab === tab.id
            : activeHealthTab === tab.id;
          const tabColor = tab.color;

          const handleClick = () => {
            if (isNutritionActive) {
              setActiveNutritionSubTab(tab.id);
            } else {
              setActiveHealthTab(tab.id);
            }
          };

          const subtitle = isNutritionActive
            ? getNutritionSubtitle(tab.id)
            : getSubtitle(tab.id);

          return (
            <div
              key={tab.id}
              onClick={handleClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: isActive
                  ? (theme === 'dark' ? '#1F2937' : (isNutritionActive ? '#FFFBEB' : '#EFF6FF'))
                  : 'transparent',
                borderLeft: isActive ? `3px solid ${tabColor}` : '3px solid transparent',
                marginBottom: '2px',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} style={{ color: isActive ? tabColor : (theme === 'dark' ? '#6B7280' : '#9CA3AF'), flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? (theme === 'dark' ? '#F9FAFB' : '#111827') : (theme === 'dark' ? '#D1D5DB' : '#374151'),
                }}>
                  {tab.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
                  marginTop: '1px',
                }}>
                  {subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-section content below navigation */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeHealthTab === 'body' && (
          <BodyMetricsList
            theme={theme}
            bodyMetrics={bodyMetrics}
            loading={bodyMetricsLoading}
            selected={selectedBodyMetric}
            onSelect={setSelectedBodyMetric}
          />
        )}
        {activeHealthTab === 'nutrition' && activeNutritionSubTab === 'recipes' && (
          <RecipesList
            theme={theme}
            recipes={recipes}
            loading={recipesLoading}
            selected={selectedRecipe}
            onSelect={setSelectedRecipe}
            getRecipeMacros={getRecipeMacros}
          />
        )}
        {activeHealthTab === 'training' && (
          <TrainingList
            theme={theme}
            sessions={trainingSessions}
            loading={trainingLoading}
            selected={selectedTrainingSession}
            onSelect={setSelectedTrainingSession}
          />
        )}
        {activeHealthTab === 'planner' && (
          <PlannerList
            theme={theme}
            weeklyPlans={weeklyPlans}
            loading={plannerLoading}
            currentWeek={currentWeek}
          />
        )}
      </div>
    </EmailList>
  );
};

// ==================== Sub-components ====================

const BodyMetricsList = ({ theme, bodyMetrics, loading, selected, onSelect }) => {
  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Loading...</div>;
  const reversed = [...bodyMetrics].reverse();
  if (reversed.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>No body metrics yet</div>;

  return reversed.map(m => (
    <EmailItem
      key={m.date}
      theme={theme}
      $selected={selected?.date === m.date}
      onClick={() => onSelect(m)}
      style={{ padding: '10px 16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
            {Number(m.weight_kg).toFixed(1)} kg
          </div>
          <div style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
            {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </div>
        {m.body_fat_pct && (
          <div style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
            {Number(m.body_fat_pct).toFixed(1)}% BF
          </div>
        )}
      </div>
    </EmailItem>
  ));
};

const RecipesList = ({ theme, recipes, loading, selected, onSelect, getRecipeMacros }) => {
  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Loading...</div>;
  if (recipes.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>No recipes yet</div>;

  return recipes.map(r => {
    const macros = getRecipeMacros(r);
    return (
      <EmailItem
        key={r.id}
        theme={theme}
        $selected={selected?.id === r.id}
        onClick={() => onSelect(r)}
        style={{ padding: '10px 16px' }}
      >
        <div style={{ fontSize: '13px', fontWeight: 500, color: theme === 'dark' ? '#F9FAFB' : '#111827', marginBottom: '2px' }}>
          {r.name}
        </div>
        <div style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>
          {macros.kcal} kcal · P{macros.protein} · F{macros.fat} · C{macros.carbs}
        </div>
      </EmailItem>
    );
  });
};

const TrainingList = ({ theme, sessions, loading, selected, onSelect }) => {
  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Loading...</div>;
  if (sessions.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>No training sessions yet</div>;

  const typeColors = {
    'Pilates': '#8B5CF6',
    'Cardio': '#EF4444',
    'Weights': '#F59E0B',
    'Walking': '#10B981',
    'Stretching': '#3B82F6',
  };

  return sessions.map(s => (
    <EmailItem
      key={s.id}
      theme={theme}
      $selected={selected?.id === s.id}
      onClick={() => onSelect(s)}
      style={{ padding: '10px 16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: typeColors[s.session_type] || '#6B7280',
            }} />
            <span style={{ fontSize: '13px', fontWeight: 500, color: theme === 'dark' ? '#F9FAFB' : '#111827' }}>
              {s.session_type}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }}>
            {new Date(s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {s.duration_min && ` · ${s.duration_min} min`}
          </div>
        </div>
      </div>
    </EmailItem>
  ));
};

const PlannerList = ({ theme, weeklyPlans, loading, currentWeek }) => {
  if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF' }}>Loading...</div>;
  if (weeklyPlans.length === 0) return <div style={{ padding: '20px', textAlign: 'center', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>No weekly plans yet</div>;

  return weeklyPlans.map(wp => {
    const isCurrent = wp.week_number === currentWeek;
    return (
      <EmailItem
        key={wp.id}
        theme={theme}
        $selected={isCurrent}
        style={{ padding: '10px 16px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                fontSize: '13px',
                fontWeight: isCurrent ? 700 : 500,
                color: isCurrent ? '#3B82F6' : (theme === 'dark' ? '#F9FAFB' : '#111827'),
              }}>
                W{String(wp.week_number).padStart(2, '0')}
              </span>
              {wp.label && (
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: theme === 'dark' ? '#374151' : '#F3F4F6',
                  color: theme === 'dark' ? '#D1D5DB' : '#6B7280',
                }}>
                  {wp.label}
                </span>
              )}
            </div>
            {wp.date_start && (
              <div style={{ fontSize: '11px', color: theme === 'dark' ? '#6B7280' : '#9CA3AF', marginTop: '2px' }}>
                {new Date(wp.date_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {wp.date_end && ` - ${new Date(wp.date_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
              </div>
            )}
          </div>
          {isCurrent && (
            <FaCheck size={12} style={{ color: '#10B981' }} />
          )}
        </div>
      </EmailItem>
    );
  });
};

export default HealthLeftContent;
