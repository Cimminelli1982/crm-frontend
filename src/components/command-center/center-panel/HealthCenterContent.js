import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  EmailContentPanel,
  EmptyState,
} from '../../../pages/CommandCenterPage.styles';
import {
  FaChartLine, FaUtensils, FaWeight, FaDumbbell, FaCalendarAlt,
  FaPlus, FaTrash, FaCheck, FaTimes, FaChevronLeft, FaChevronRight,
} from 'react-icons/fa';
import IngredientsView from './nutrition/IngredientsView';
import RecipesView from './nutrition/RecipesView';
import MealPlanningView from './nutrition/MealPlanningView';
import TrackerView from './nutrition/TrackerView';
import ExercisesView from './training/ExercisesView';
import WorkoutTemplatesView from './training/WorkoutTemplatesView';
import TrainingPlanningView from './training/TrainingPlanningView';
import TrainingTrackerView from './training/TrainingTrackerView';

const HealthCenterContent = ({ theme, healthHook }) => {
  const { activeHealthTab } = healthHook;

  return (
    <EmailContentPanel theme={theme}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {activeHealthTab === 'dashboard' && <DashboardView theme={theme} healthHook={healthHook} />}
        {activeHealthTab === 'nutrition' && <NutritionView theme={theme} healthHook={healthHook} />}
        {activeHealthTab === 'body' && <BodyView theme={theme} healthHook={healthHook} />}
        {activeHealthTab === 'training' && <TrainingView theme={theme} healthHook={healthHook} />}
        {activeHealthTab === 'planner' && <PlannerView theme={theme} healthHook={healthHook} />}
      </div>
    </EmailContentPanel>
  );
};

// ==================== DASHBOARD VIEW ====================
const DashboardView = ({ theme, healthHook }) => {
  const { dashboardData, bodyMetrics } = healthHook;
  const isDark = theme === 'dark';
  const textColor = isDark ? '#D1D5DB' : '#374151';
  const gridColor = isDark ? '#374151' : '#E5E7EB';

  if (!dashboardData || bodyMetrics.length === 0) {
    return (
      <EmptyState theme={theme}>
        <FaChartLine size={48} />
        <div>No body metrics data yet. Add your first weigh-in in the Body tab.</div>
      </EmptyState>
    );
  }

  const { startWeight, currentWeight, goalWeight, totalToLose, totalLost, stillToLose,
    dayVictories, dayLosses, daysElapsed, victoryPct,
    weeklyAverages, goalTrajectory, dailyDeltas, cumulativeLost } = dashboardData;

  // Merge weekly averages with goal trajectory
  const weeklyVsGoal = weeklyAverages.map((wa, i) => ({
    week: wa.week,
    actual: wa.avg,
    target: goalTrajectory[i]?.target || goalWeight,
  }));

  // Weight + weekly avg combined data
  const weightWithAvg = bodyMetrics.map(m => {
    const d = new Date(m.date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    const weekKey = `W${String(weekNum).padStart(2, '0')}`;
    const wa = weeklyAverages.find(w => w.week === weekKey);
    return {
      date: new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      weight: Number(m.weight_kg),
      weeklyAvg: wa?.avg || null,
    };
  });

  return (
    <div style={{ padding: '24px' }}>
      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '16px',
      }}>
        {[
          { label: 'Start', value: startWeight ? `${startWeight} kg` : '-', color: '#6B7280' },
          { label: 'Current', value: currentWeight ? `${currentWeight} kg` : '-', color: '#3B82F6' },
          { label: 'Goal', value: `${goalWeight} kg`, color: '#10B981' },
          { label: 'Lost', value: `${totalLost} kg`, color: '#10B981' },
          { label: 'Still to lose', value: `${stillToLose} kg`, color: '#F59E0B' },
          { label: 'Days', value: daysElapsed, color: '#8B5CF6' },
          { label: 'Win %', value: `${victoryPct}%`, color: dayVictories > dayLosses ? '#10B981' : '#EF4444' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            padding: '8px 10px',
            borderRadius: '8px',
            backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
            border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          }}>
            <div style={{ fontSize: '10px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '2px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        {/* 1. Weight + Weekly Average */}
        <ChartCard title="Weight + Weekly Average" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weightWithAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={1.5} dot={{ r: 2 }} name="Daily" />
              <Line type="monotone" dataKey="weeklyAvg" stroke="#EF4444" strokeWidth={2} dot={false} name="Weekly Avg" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Actual WA vs Goal WA */}
        <ChartCard title="Actual vs Goal (Weekly Avg)" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyVsGoal}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: textColor }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} name="Actual WA" />
              <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Goal WA" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Total Lost (Area) */}
        <ChartCard title="Cumulative Lost" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={cumulativeLost}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} tickFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '12px' }} labelFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
              <Area type="monotone" dataKey="lost" stroke="#10B981" fill="#10B98133" strokeWidth={2} name="kg lost" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. KG Progress */}
        <ChartCard title="KG Progress" theme={theme}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[{ name: 'Progress', tolose: totalToLose, lost: totalLost, remaining: stillToLose }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: textColor }} />
              <YAxis tick={{ fontSize: 10, fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="tolose" fill="#3B82F6" name="Total to lose" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lost" fill="#10B981" name="Lost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="remaining" fill="#EF4444" name="Still to lose" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Daily Delta */}
        <ChartCard title="Daily Delta" theme={theme} fullWidth>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyDeltas.slice(1)}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: textColor }} tickFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: textColor }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '8px', fontSize: '12px' }} labelFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} />
              <Bar dataKey="delta" name="kg delta" radius={[4, 4, 0, 0]}>
                {dailyDeltas.slice(1).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.delta <= 0 ? '#10B981' : '#EF4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

const ChartCard = ({ title, theme, children, fullWidth }) => {
  const isDark = theme === 'dark';
  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
      border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      gridColumn: fullWidth ? '1 / -1' : 'auto',
    }}>
      <div style={{
        fontSize: '13px',
        fontWeight: 600,
        color: isDark ? '#D1D5DB' : '#374151',
        marginBottom: '12px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
};

// ==================== NUTRITION VIEW (DISPATCHER) ====================
const NutritionView = ({ theme, healthHook }) => {
  switch (healthHook.activeNutritionSubTab) {
    case 'ingredients': return <IngredientsView theme={theme} healthHook={healthHook} />;
    case 'recipes': return <RecipesView theme={theme} healthHook={healthHook} />;
    case 'tracker': return <TrackerView theme={theme} healthHook={healthHook} />;
    default: return <MealPlanningView theme={theme} healthHook={healthHook} />;
  }
};

// ==================== BODY VIEW ====================
const BodyView = ({ theme, healthHook }) => {
  const { bodyMetrics, bodyMetricsLoading, addBodyMetric, deleteBodyMetric, selectedBodyMetric } = healthHook;
  const isDark = theme === 'dark';

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWeight, setFormWeight] = useState('');
  const [formLean, setFormLean] = useState('');
  const [formFat, setFormFat] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formWeight) return;
    await addBodyMetric(formDate, parseFloat(formWeight), formLean ? parseFloat(formLean) : null, formFat ? parseFloat(formFat) : null);
    setFormWeight('');
    setFormLean('');
    setFormFat('');
  };

  const inputStyle = {
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
    backgroundColor: isDark ? '#1F2937' : '#fff',
    color: isDark ? '#F9FAFB' : '#111827',
    fontSize: '14px',
    width: '100%',
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Add form */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '0 0 150px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Date</label>
          <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Weight (kg) *</label>
          <input type="number" step="0.1" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="94.1" style={inputStyle} required />
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Lean Mass (kg)</label>
          <input type="number" step="0.1" value={formLean} onChange={(e) => setFormLean(e.target.value)} placeholder="74.0" style={inputStyle} />
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Body Fat (kg)</label>
          <input type="number" step="0.1" value={formFat} onChange={(e) => setFormFat(e.target.value)} placeholder="20.1" style={inputStyle} />
        </div>
        <button type="submit" style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#10B981',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <FaPlus size={12} /> Save
        </button>
      </form>

      {/* Mini weight chart */}
      {bodyMetrics.length > 0 && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          borderRadius: '12px',
          backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
          border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
        }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bodyMetrics.map(m => ({
              date: new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
              weight: Number(m.weight_kg),
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#6B7280' : '#9CA3AF' }} interval="preserveStartEnd" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: isDark ? '#6B7280' : '#9CA3AF' }} />
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="weight" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historical table */}
      <div style={{ borderRadius: '8px', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }}>
              {['Date', 'Weight', 'Lean Mass', 'Body Fat', 'BF %', ''].map(h => (
                <th key={h} style={{ textAlign: h === 'Date' ? 'left' : 'right', padding: '10px 12px', color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyMetricsLoading ? (
              <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: isDark ? '#6B7280' : '#9CA3AF' }}>Loading...</td></tr>
            ) : [...bodyMetrics].reverse().map(m => (
              <tr key={m.date} style={{
                borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}`,
                backgroundColor: selectedBodyMetric?.date === m.date ? (isDark ? '#1E3A5F' : '#EFF6FF') : 'transparent',
              }}>
                <td style={{ padding: '8px 12px', color: isDark ? '#D1D5DB' : '#374151' }}>
                  {new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: isDark ? '#F9FAFB' : '#111827', fontWeight: 600 }}>
                  {Number(m.weight_kg).toFixed(1)} kg
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: isDark ? '#D1D5DB' : '#374151' }}>
                  {m.lean_mass_kg ? `${Number(m.lean_mass_kg).toFixed(1)} kg` : '-'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: isDark ? '#D1D5DB' : '#374151' }}>
                  {m.body_fat_kg ? `${Number(m.body_fat_kg).toFixed(1)} kg` : '-'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right', color: isDark ? '#D1D5DB' : '#374151' }}>
                  {m.body_fat_pct ? `${Number(m.body_fat_pct).toFixed(1)}%` : '-'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => deleteBodyMetric(m.date)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontSize: '12px',
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
      </div>
    </div>
  );
};

// ==================== TRAINING VIEW (DISPATCHER) ====================
const TrainingView = ({ theme, healthHook }) => {
  switch (healthHook.activeTrainingSubTab) {
    case 'exercises': return <ExercisesView theme={theme} healthHook={healthHook} />;
    case 'workout-templates': return <WorkoutTemplatesView theme={theme} healthHook={healthHook} />;
    case 'training-tracker': return <TrainingTrackerView theme={theme} healthHook={healthHook} />;
    default: return <TrainingPlanningView theme={theme} healthHook={healthHook} />;
  }
};

// ==================== PLANNER VIEW (Enhanced with Priorities) ====================
const PlannerView = ({ theme, healthHook }) => {
  const {
    goals, routineSchedule, weeklyPlans, currentWeek, toggleGoal, addGoal, deleteGoal,
    prioritiesForScope, selectedPriorityScope, setSelectedPriorityScope,
    selectedPriorityDate, setSelectedPriorityDate,
    addPriority, togglePriority, deletePriority,
  } = healthHook;
  const isDark = theme === 'dark';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newPriorityTitle, setNewPriorityTitle] = useState('');

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    await addGoal(newGoalTitle.trim());
    setNewGoalTitle('');
  };

  const handleAddPriority = async () => {
    if (!newPriorityTitle.trim()) return;
    const scopeDate = getScopeDate(selectedPriorityScope, selectedPriorityDate);
    await addPriority({
      title: newPriorityTitle.trim(),
      scope: selectedPriorityScope,
      scope_date: scopeDate,
      sort_order: prioritiesForScope.length,
    });
    setNewPriorityTitle('');
  };

  // Scope date helpers
  const getScopeDate = (scope, dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (scope === 'daily') return dateStr;
    if (scope === 'weekly') {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      return monday.toISOString().split('T')[0];
    }
    if (scope === 'monthly') {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    }
    if (scope === 'yearly') {
      return `${d.getFullYear()}-01-01`;
    }
    return dateStr;
  };

  const getScopeDateLabel = (scope, dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    if (scope === 'daily') {
      return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    if (scope === 'weekly') {
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diff);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const startOfYear = new Date(monday.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((monday - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
      return `W${String(weekNum).padStart(2, '0')} — ${monday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
    }
    if (scope === 'monthly') {
      return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    if (scope === 'yearly') {
      return String(d.getFullYear());
    }
    return dateStr;
  };

  const navigateScopeDate = (offset) => {
    const d = new Date(selectedPriorityDate + 'T12:00:00');
    if (selectedPriorityScope === 'daily') d.setDate(d.getDate() + offset);
    else if (selectedPriorityScope === 'weekly') d.setDate(d.getDate() + (offset * 7));
    else if (selectedPriorityScope === 'monthly') d.setMonth(d.getMonth() + offset);
    else if (selectedPriorityScope === 'yearly') d.setFullYear(d.getFullYear() + offset);
    setSelectedPriorityDate(d.toISOString().split('T')[0]);
  };

  const goToTodayScope = () => setSelectedPriorityDate(new Date().toISOString().split('T')[0]);

  // Current week plan
  const currentPlan = weeklyPlans.find(wp => wp.week_number === currentWeek);

  const SCOPES = ['daily', 'weekly', 'monthly', 'yearly'];

  return (
    <div style={{ padding: '24px' }}>
      {/* ===== PRIORITIES SECTION ===== */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: isDark ? '#1F2937' : '#FDF2F8',
        border: `1px solid ${isDark ? '#374151' : '#FBCFE8'}`,
        borderLeft: '3px solid #EC4899',
        marginBottom: '20px',
      }}>
        {/* Scope tabs */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '14px',
          backgroundColor: isDark ? '#111827' : '#fff',
          borderRadius: '8px', padding: '3px',
          border: `1px solid ${borderColor}`, width: 'fit-content',
        }}>
          {SCOPES.map(scope => (
            <button
              key={scope}
              onClick={() => setSelectedPriorityScope(scope)}
              style={{
                padding: '6px 14px', borderRadius: '6px', border: 'none',
                backgroundColor: selectedPriorityScope === scope ? '#EC4899' : 'transparent',
                color: selectedPriorityScope === scope ? '#fff' : textMuted,
                fontSize: '12px', fontWeight: selectedPriorityScope === scope ? 600 : 400,
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {scope}
            </button>
          ))}
        </div>

        {/* Date/period navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button
            onClick={() => navigateScopeDate(-1)}
            style={{
              padding: '6px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`,
              backgroundColor: isDark ? '#111827' : '#fff', color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <FaChevronLeft size={10} />
          </button>
          <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary, minWidth: '180px', textAlign: 'center' }}>
            {getScopeDateLabel(selectedPriorityScope, selectedPriorityDate)}
          </div>
          <button
            onClick={() => navigateScopeDate(1)}
            style={{
              padding: '6px 8px', borderRadius: '6px', border: `1px solid ${borderColor}`,
              backgroundColor: isDark ? '#111827' : '#fff', color: textSecondary, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
            }}
          >
            <FaChevronRight size={10} />
          </button>
          <button
            onClick={goToTodayScope}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none',
              backgroundColor: '#EC4899', color: '#fff', fontSize: '11px',
              fontWeight: 500, cursor: 'pointer',
            }}
          >
            Today
          </button>
        </div>

        {/* Priority list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
          {prioritiesForScope.length === 0 && (
            <div style={{ padding: '10px', textAlign: 'center', color: textMuted, fontSize: '12px' }}>
              No priorities for this {selectedPriorityScope} period
            </div>
          )}
          {prioritiesForScope.map((p, idx) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px',
              backgroundColor: isDark ? '#111827' : '#fff',
              border: `1px solid ${borderColor}`,
            }}>
              <button
                onClick={() => togglePriority(p.id, p.is_completed)}
                style={{
                  width: '20px', height: '20px', borderRadius: '4px',
                  border: `2px solid ${p.is_completed ? '#EC4899' : (isDark ? '#4B5563' : '#D1D5DB')}`,
                  backgroundColor: p.is_completed ? '#EC4899' : 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {p.is_completed && <FaCheck size={10} style={{ color: '#fff' }} />}
              </button>
              <span style={{ fontSize: '11px', color: textMuted, fontWeight: 600, minWidth: '18px' }}>
                {idx + 1}.
              </span>
              <span style={{
                flex: 1, fontSize: '13px',
                color: p.is_completed ? textMuted : textPrimary,
                textDecoration: p.is_completed ? 'line-through' : 'none',
              }}>
                {p.title}
              </span>
              <button
                onClick={() => deletePriority(p.id)}
                style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
              >
                <FaTimes size={10} />
              </button>
            </div>
          ))}
        </div>

        {/* Add priority input */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            value={newPriorityTitle}
            onChange={(e) => setNewPriorityTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPriority()}
            placeholder={`Add ${selectedPriorityScope} priority...`}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: '6px',
              border: `1px solid ${borderColor}`,
              backgroundColor: isDark ? '#111827' : '#fff',
              color: textPrimary, fontSize: '12px', outline: 'none',
            }}
          />
          <button onClick={handleAddPriority} style={{
            padding: '6px 12px', borderRadius: '6px', border: 'none',
            backgroundColor: '#EC4899', color: '#fff', cursor: 'pointer', fontSize: '12px',
          }}>
            <FaPlus size={10} />
          </button>
        </div>
      </div>

      {/* ===== EXISTING: Goals + Routine ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Goals */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCheck size={12} style={{ color: '#10B981' }} /> Goals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {goals.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: '8px',
                backgroundColor: bgSecondary, border: `1px solid ${borderColor}`,
              }}>
                <button
                  onClick={() => toggleGoal(g.id, g.is_completed)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '4px',
                    border: `2px solid ${g.is_completed ? '#10B981' : (isDark ? '#4B5563' : '#D1D5DB')}`,
                    backgroundColor: g.is_completed ? '#10B981' : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {g.is_completed && <FaCheck size={10} style={{ color: '#fff' }} />}
                </button>
                <span style={{
                  flex: 1, fontSize: '13px',
                  color: g.is_completed ? textMuted : textPrimary,
                  textDecoration: g.is_completed ? 'line-through' : 'none',
                }}>
                  {g.title}
                </span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: textMuted }}>
                  {g.category}
                </span>
                <button
                  onClick={() => deleteGoal(g.id)}
                  style={{ padding: '2px', border: 'none', backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              placeholder="Add a goal..."
              style={{
                flex: 1, padding: '6px 10px', borderRadius: '6px',
                border: `1px solid ${borderColor}`,
                backgroundColor: isDark ? '#1F2937' : '#fff',
                color: textPrimary, fontSize: '12px',
              }}
            />
            <button onClick={handleAddGoal} style={{
              padding: '6px 12px', borderRadius: '6px', border: 'none',
              backgroundColor: '#10B981', color: '#fff', cursor: 'pointer', fontSize: '12px',
            }}>
              <FaPlus size={10} />
            </button>
          </div>
        </div>

        {/* Routine Schedule */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCalendarAlt size={12} style={{ color: '#EC4899' }} /> Daily Routine
          </h3>
          {routineSchedule.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
              No routine schedule set
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {routineSchedule.filter(r => r.is_active).map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 12px', borderRadius: '6px',
                  backgroundColor: bgSecondary,
                }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, color: '#3B82F6',
                    fontFamily: 'monospace', minWidth: '44px',
                  }}>
                    {r.time_slot?.substring(0, 5)}
                  </span>
                  <span style={{ fontSize: '13px', color: textSecondary, flex: 1 }}>
                    {r.activity}
                  </span>
                  {r.duration_min && (
                    <span style={{ fontSize: '11px', color: textMuted }}>
                      {r.duration_min}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Plans Overview */}
      {weeklyPlans.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, marginBottom: '12px' }}>
            Upcoming Weeks
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {weeklyPlans.filter(wp => wp.week_number >= currentWeek).map(wp => (
              <div key={wp.id} style={{
                padding: '10px 14px', borderRadius: '8px',
                backgroundColor: wp.week_number === currentWeek ? (isDark ? '#1E3A5F' : '#EFF6FF') : bgSecondary,
                border: `1px solid ${wp.week_number === currentWeek ? '#3B82F6' : borderColor}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: wp.week_number === currentWeek ? '#3B82F6' : textPrimary }}>
                    W{String(wp.week_number).padStart(2, '0')}
                  </span>
                  {wp.label && <span style={{ fontSize: '11px', color: textMuted }}>{wp.label}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthCenterContent;
