import React, { useState } from 'react';
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
  FaPlus, FaTrash, FaCheck, FaTimes,
} from 'react-icons/fa';
import IngredientsView from './nutrition/IngredientsView';
import RecipesView from './nutrition/RecipesView';
import MealPlanningView from './nutrition/MealPlanningView';
import TrackerView from './nutrition/TrackerView';

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

// ==================== TRAINING VIEW ====================
const TrainingView = ({ theme, healthHook }) => {
  const { trainingSessions, trainingLoading, addTrainingSession, deleteTrainingSession } = healthHook;
  const isDark = theme === 'dark';

  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formType, setFormType] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const SESSION_TYPES = ['Pilates', 'Cardio', 'Weights', 'Walking', 'Stretching', 'HIIT', 'Yoga', 'Swimming'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formType) return;
    await addTrainingSession(formDate, formType, formDuration ? parseInt(formDuration) : null, formNotes);
    setFormType('');
    setFormDuration('');
    setFormNotes('');
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

  const typeColors = {
    'Pilates': '#8B5CF6', 'Cardio': '#EF4444', 'Weights': '#F59E0B',
    'Walking': '#10B981', 'Stretching': '#3B82F6', 'HIIT': '#EC4899',
    'Yoga': '#14B8A6', 'Swimming': '#06B6D4',
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
        <div style={{ flex: '0 0 150px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Type *</label>
          <select value={formType} onChange={(e) => setFormType(e.target.value)} style={inputStyle} required>
            <option value="">Select type...</option>
            {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: '0 0 120px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Duration (min)</label>
          <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} placeholder="45" style={inputStyle} />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF', marginBottom: '4px', display: 'block' }}>Notes</label>
          <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Optional notes..." style={inputStyle} />
        </div>
        <button type="submit" style={{
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#8B5CF6',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <FaPlus size={12} /> Log
        </button>
      </form>

      {/* Sessions table */}
      <div style={{ borderRadius: '8px', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }}>
              {['Date', 'Type', 'Duration', 'Notes', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trainingLoading ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: isDark ? '#6B7280' : '#9CA3AF' }}>Loading...</td></tr>
            ) : trainingSessions.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: isDark ? '#6B7280' : '#9CA3AF' }}>No training sessions yet</td></tr>
            ) : trainingSessions.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#F3F4F6'}` }}>
                <td style={{ padding: '8px 12px', color: isDark ? '#D1D5DB' : '#374151' }}>
                  {new Date(s.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '2px 8px', borderRadius: '4px',
                    backgroundColor: (typeColors[s.session_type] || '#6B7280') + '20',
                    color: typeColors[s.session_type] || '#6B7280',
                    fontSize: '12px', fontWeight: 500,
                  }}>
                    <FaDumbbell size={10} /> {s.session_type}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: isDark ? '#D1D5DB' : '#374151' }}>
                  {s.duration_min ? `${s.duration_min} min` : '-'}
                </td>
                <td style={{ padding: '8px 12px', color: isDark ? '#6B7280' : '#9CA3AF', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.notes || '-'}
                </td>
                <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                  <button
                    onClick={() => deleteTrainingSession(s.id)}
                    style={{
                      padding: '4px 8px', borderRadius: '4px', border: 'none',
                      backgroundColor: 'transparent', color: '#EF4444', cursor: 'pointer',
                    }}
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

// ==================== PLANNER VIEW ====================
const PlannerView = ({ theme, healthHook }) => {
  const { goals, routineSchedule, weeklyPlans, currentWeek, toggleGoal, addGoal, deleteGoal } = healthHook;
  const isDark = theme === 'dark';

  const [newGoalTitle, setNewGoalTitle] = useState('');

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleAddGoal = async () => {
    if (!newGoalTitle.trim()) return;
    await addGoal(newGoalTitle.trim());
    setNewGoalTitle('');
  };

  // Current week plan
  const currentPlan = weeklyPlans.find(wp => wp.week_number === currentWeek);

  return (
    <div style={{ padding: '24px' }}>
      {/* Current Week Header */}
      <div style={{
        padding: '16px',
        borderRadius: '12px',
        backgroundColor: isDark ? '#1F2937' : '#EFF6FF',
        border: `1px solid ${isDark ? '#374151' : '#BFDBFE'}`,
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#3B82F6' }}>
              Week {currentWeek} {currentPlan?.label ? `- ${currentPlan.label}` : ''}
            </div>
            {currentPlan?.date_start && (
              <div style={{ fontSize: '12px', color: isDark ? '#6B7280' : '#6B7280', marginTop: '4px' }}>
                {new Date(currentPlan.date_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
                {currentPlan.date_end && ` - ${new Date(currentPlan.date_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`}
              </div>
            )}
          </div>
        </div>
        {currentPlan?.notes && (
          <div style={{ marginTop: '8px', fontSize: '13px', color: isDark ? '#D1D5DB' : '#374151' }}>
            {currentPlan.notes}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Goals */}
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#D1D5DB' : '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCheck size={12} style={{ color: '#10B981' }} /> Goals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
            {goals.map(g => (
              <div key={g.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              }}>
                <button
                  onClick={() => toggleGoal(g.id, g.is_completed)}
                  style={{
                    width: '20px', height: '20px', borderRadius: '4px',
                    border: `2px solid ${g.is_completed ? '#10B981' : (isDark ? '#4B5563' : '#D1D5DB')}`,
                    backgroundColor: g.is_completed ? '#10B981' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {g.is_completed && <FaCheck size={10} style={{ color: '#fff' }} />}
                </button>
                <span style={{
                  flex: 1, fontSize: '13px',
                  color: g.is_completed ? (isDark ? '#6B7280' : '#9CA3AF') : (isDark ? '#F9FAFB' : '#111827'),
                  textDecoration: g.is_completed ? 'line-through' : 'none',
                }}>
                  {g.title}
                </span>
                <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: isDark ? '#374151' : '#E5E7EB', color: isDark ? '#6B7280' : '#9CA3AF' }}>
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
                border: `1px solid ${isDark ? '#374151' : '#D1D5DB'}`,
                backgroundColor: isDark ? '#1F2937' : '#fff',
                color: isDark ? '#F9FAFB' : '#111827',
                fontSize: '12px',
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
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#D1D5DB' : '#374151', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaCalendarAlt size={12} style={{ color: '#EC4899' }} /> Daily Routine
          </h3>
          {routineSchedule.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: isDark ? '#6B7280' : '#9CA3AF', fontSize: '13px' }}>
              No routine schedule set
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {routineSchedule.filter(r => r.is_active).map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                }}>
                  <span style={{
                    fontSize: '12px', fontWeight: 600, color: '#3B82F6',
                    fontFamily: 'monospace', minWidth: '44px',
                  }}>
                    {r.time_slot?.substring(0, 5)}
                  </span>
                  <span style={{ fontSize: '13px', color: isDark ? '#D1D5DB' : '#374151', flex: 1 }}>
                    {r.activity}
                  </span>
                  {r.duration_min && (
                    <span style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF' }}>
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
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#D1D5DB' : '#374151', marginBottom: '12px' }}>
            Upcoming Weeks
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {weeklyPlans.filter(wp => wp.week_number >= currentWeek).map(wp => (
              <div key={wp.id} style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: wp.week_number === currentWeek ? (isDark ? '#1E3A5F' : '#EFF6FF') : (isDark ? '#1F2937' : '#F9FAFB'),
                border: `1px solid ${wp.week_number === currentWeek ? '#3B82F6' : (isDark ? '#374151' : '#E5E7EB')}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: wp.week_number === currentWeek ? '#3B82F6' : (isDark ? '#F9FAFB' : '#111827') }}>
                    W{String(wp.week_number).padStart(2, '0')}
                  </span>
                  {wp.label && <span style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#9CA3AF' }}>{wp.label}</span>}
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
