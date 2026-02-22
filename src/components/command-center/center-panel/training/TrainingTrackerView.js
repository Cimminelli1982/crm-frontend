import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, Cell, ComposedChart, Line,
  XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid,
} from 'recharts';

const TYPE_COLORS = {
  Pilates: '#8B5CF6', Cardio: '#EF4444', Weights: '#F59E0B',
  Walking: '#10B981', Stretching: '#3B82F6', HIIT: '#EC4899',
  Yoga: '#14B8A6', Swimming: '#06B6D4',
};

const TrainingTrackerView = ({ theme, healthHook }) => {
  const { trainingSessions, trainingLoading, sessionExercises } = healthHook;

  const isDark = theme === 'dark';
  const bgSecondary = isDark ? '#1F2937' : '#F9FAFB';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const textSecondary = isDark ? '#D1D5DB' : '#374151';
  const textMuted = isDark ? '#6B7280' : '#9CA3AF';
  const borderColor = isDark ? '#374151' : '#E5E7EB';
  const gridColor = isDark ? '#374151' : '#E5E7EB';

  const tooltipStyle = {
    backgroundColor: isDark ? '#1F2937' : '#fff',
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    fontSize: '12px',
  };
  const axisTick = { fontSize: 10, fill: textSecondary };

  const [activeTab, setActiveTab] = useState('daily');

  // ---------- DATA PROCESSING ----------

  const dailyData = useMemo(() => {
    const byDate = {};
    trainingSessions.forEach(s => {
      const date = s.date;
      if (!byDate[date]) byDate[date] = { sessions: 0, duration: 0, types: {} };
      byDate[date].sessions += 1;
      byDate[date].duration += s.duration_min || 0;
      byDate[date].types[s.session_type] = (byDate[date].types[s.session_type] || 0) + 1;
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        label: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
        shortLabel: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        sessions: data.sessions,
        duration: data.duration,
        types: data.types,
        primaryType: Object.entries(data.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other',
      }));
  }, [trainingSessions]);

  // Last 14 days for daily view
  const last14Days = useMemo(() => dailyData.slice(-14), [dailyData]);

  // Weekly aggregation
  const weeklyData = useMemo(() => {
    const weeks = {};
    dailyData.forEach(d => {
      const date = new Date(d.date + 'T12:00:00');
      const dayOfWeek = date.getDay() || 7;
      const thursday = new Date(date);
      thursday.setDate(date.getDate() + 4 - dayOfWeek);
      const yearStart = new Date(thursday.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
      const key = `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

      if (!weeks[key]) weeks[key] = { sessions: 0, duration: 0, days: 0, types: {} };
      weeks[key].sessions += d.sessions;
      weeks[key].duration += d.duration;
      weeks[key].days += 1;
      Object.entries(d.types).forEach(([t, c]) => {
        weeks[key].types[t] = (weeks[key].types[t] || 0) + c;
      });
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week: week.split('-')[1],
        sessions: data.sessions,
        duration: data.duration,
        trainingDays: data.days,
        avgDuration: data.sessions > 0 ? Math.round(data.duration / data.sessions) : 0,
      }));
  }, [dailyData]);

  // Monthly aggregation
  const monthlyData = useMemo(() => {
    const months = {};
    dailyData.forEach(d => {
      const date = new Date(d.date + 'T12:00:00');
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[key]) months[key] = { sessions: 0, duration: 0, days: 0 };
      months[key].sessions += d.sessions;
      months[key].duration += d.duration;
      months[key].days += 1;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [year, mo] = month.split('-');
        const label = new Date(parseInt(year), parseInt(mo) - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
        return {
          month: label,
          sessions: data.sessions,
          duration: data.duration,
          trainingDays: data.days,
          avgDuration: data.sessions > 0 ? Math.round(data.duration / data.sessions) : 0,
        };
      });
  }, [dailyData]);

  // Volume progression (strength) — total weight × reps over time
  const volumeData = useMemo(() => {
    const byDate = {};
    trainingSessions.forEach(s => {
      if (!byDate[s.date]) byDate[s.date] = { volume: 0 };
    });
    // Use the session exercises that are loaded (these are for selected date, but we can compute from trainingSessions joined data)
    // For a simpler approach, compute from training_session_exercises if available, otherwise skip
    // Since sessionExercises is date-scoped, we'll compute volume from all sessions' template data as approximation
    trainingSessions.forEach(s => {
      const templateExs = s.workout_templates?.workout_template_exercises || [];
      templateExs.forEach(te => {
        if (te.exercises?.exercise_type === 'Strength') {
          const sets = te.sets || 0;
          const reps = te.reps || 0;
          const weight = Number(te.weight_kg) || 0;
          if (!byDate[s.date]) byDate[s.date] = { volume: 0 };
          byDate[s.date].volume += sets * reps * weight;
        }
      });
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([_, d]) => d.volume > 0)
      .slice(-30)
      .map(([date, data]) => ({
        date,
        shortLabel: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        volume: data.volume,
      }));
  }, [trainingSessions]);

  // Overall stats
  const stats = useMemo(() => {
    const totalSessions = trainingSessions.length;
    const totalDuration = trainingSessions.reduce((s, t) => s + (t.duration_min || 0), 0);
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    const typeCounts = {};
    trainingSessions.forEach(s => {
      typeCounts[s.session_type] = (typeCounts[s.session_type] || 0) + 1;
    });
    const mostCommon = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];

    const uniqueDays = new Set(trainingSessions.map(s => s.date)).size;
    const firstDate = trainingSessions.length > 0 ? new Date(trainingSessions[trainingSessions.length - 1]?.date + 'T12:00:00') : null;
    const totalPossibleDays = firstDate ? Math.ceil((new Date() - firstDate) / 86400000) : 1;
    const trainingPct = totalPossibleDays > 0 ? Math.round((uniqueDays / totalPossibleDays) * 100) : 0;

    return {
      totalSessions,
      totalDuration,
      avgDuration,
      mostCommon: mostCommon ? mostCommon[0] : '-',
      trainingPct,
    };
  }, [trainingSessions]);

  // ---------- HELPERS ----------

  const ChartCard = ({ title, children, fullWidth }) => (
    <div style={{
      padding: '16px', borderRadius: '12px',
      backgroundColor: bgSecondary, border: `1px solid ${borderColor}`,
      gridColumn: fullWidth ? '1 / -1' : 'auto',
    }}>
      <div style={{
        fontSize: '13px', fontWeight: 600, color: textSecondary, marginBottom: '12px',
      }}>{title}</div>
      {children}
    </div>
  );

  const StatCard = ({ label, value, color }) => (
    <div style={{
      padding: '16px', borderRadius: '10px',
      backgroundColor: bgSecondary, border: `1px solid ${borderColor}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '11px', color: textMuted, marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color: color || textPrimary }}>
        {value}
      </div>
    </div>
  );

  // ---------- RENDER ----------

  if (trainingLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
        Loading training data...
      </div>
    );
  }

  if (trainingSessions.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
        No training data to track yet. Start logging sessions in the Training Plan tab.
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
      {/* Tab selector */}
      <div style={{
        display: 'flex', gap: '4px', marginBottom: '20px',
        backgroundColor: bgSecondary, borderRadius: '8px', padding: '3px',
        border: `1px solid ${borderColor}`, width: 'fit-content',
      }}>
        {['daily', 'weekly', 'monthly'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none',
              backgroundColor: activeTab === tab ? (isDark ? '#374151' : '#fff') : 'transparent',
              color: activeTab === tab ? textPrimary : textMuted,
              fontSize: '12px', fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ========== DAILY VIEW ========== */}
      {activeTab === 'daily' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Sessions per day */}
          <ChartCard title="Sessions per Day (Last 14 Days)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last14Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="shortLabel" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sessions" name="Sessions" radius={[4, 4, 0, 0]}>
                  {last14Days.map((entry, i) => (
                    <Cell key={i} fill={TYPE_COLORS[entry.primaryType] || '#8B5CF6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Duration per day */}
          <ChartCard title="Duration per Day (Last 14 Days)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last14Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="shortLabel" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="duration" name="Duration (min)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Volume progression (if data available) */}
          {volumeData.length > 0 && (
            <ChartCard title="Strength Volume Progression (weight x reps)" fullWidth>
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="shortLabel" tick={axisTick} interval="preserveStartEnd" />
                  <YAxis tick={axisTick} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="volume" name="Volume (kg)" fill="#F59E0B" radius={[4, 4, 0, 0]} opacity={0.6} />
                  <Line type="monotone" dataKey="volume" stroke="#F59E0B" strokeWidth={2} dot={{ r: 2 }} name="Trend" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}

      {/* ========== WEEKLY VIEW ========== */}
      {activeTab === 'weekly' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <ChartCard title="Weekly Sessions">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="sessions" fill="#8B5CF6" name="Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Weekly Duration & Avg per Session">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} label={{ value: 'total min', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: textMuted } }} />
                <YAxis yAxisId="right" orientation="right" tick={axisTick} label={{ value: 'avg min', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: textMuted } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="duration" fill="#8B5CF6" name="Total Duration" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="avgDuration" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} name="Avg per Session" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Training Days per Week" fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} domain={[0, 7]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="trainingDays" name="Training Days" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell key={i} fill={entry.trainingDays >= 4 ? '#10B981' : entry.trainingDays >= 2 ? '#F59E0B' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ========== MONTHLY VIEW ========== */}
      {activeTab === 'monthly' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <ChartCard title="Monthly Sessions">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis tick={axisTick} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="sessions" fill="#8B5CF6" name="Sessions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Duration">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="duration" fill="#8B5CF6" name="Total Duration (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Training Days & Avg Session Duration" fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} label={{ value: 'days', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: textMuted } }} />
                <YAxis yAxisId="right" orientation="right" tick={axisTick} label={{ value: 'avg min', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: textMuted } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="trainingDays" fill="#10B981" name="Training Days" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="avgDuration" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Avg Session (min)" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ========== STATS PANEL ========== */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, marginBottom: '12px' }}>
          Overall Stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <StatCard label="Total Sessions" value={stats.totalSessions} color="#8B5CF6" />
          <StatCard label="Total Duration" value={`${stats.totalDuration}m`} color="#3B82F6" />
          <StatCard label="Avg Duration" value={`${stats.avgDuration}m`} color="#10B981" />
          <StatCard label="Most Common" value={stats.mostCommon} color={TYPE_COLORS[stats.mostCommon] || '#6B7280'} />
          <StatCard
            label="Training Days %"
            value={`${stats.trainingPct}%`}
            color={stats.trainingPct >= 50 ? '#10B981' : stats.trainingPct >= 30 ? '#F59E0B' : '#EF4444'}
          />
        </div>
      </div>
    </div>
  );
};

export default TrainingTrackerView;
