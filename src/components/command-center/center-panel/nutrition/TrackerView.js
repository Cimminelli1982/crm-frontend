import React, { useState, useMemo } from 'react';
import {
  ComposedChart, BarChart, Bar, Line, Cell,
  XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid,
} from 'recharts';

const TrackerView = ({ theme, healthHook }) => {
  const {
    trackerMeals, trackerLoading,
    bodyMetrics, getRecipeMacros,
  } = healthHook;

  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#111827' : '#fff';
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

  // Get daily target for a date
  const getDailyTarget = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    if (day === 6) return { kcal: 2600, protein: 135 };
    if (day === 0) return { kcal: 2200, protein: 135 };
    return { kcal: 1700, protein: 135 };
  };

  // Compute meal macros from meal_ingredients (primary) or recipe fallback
  const computeMealMacros = (meal) => {
    let kcal = 0, protein = 0, fat = 0, carbs = 0;

    // Primary: meal_ingredients
    if (meal.meal_ingredients && meal.meal_ingredients.length > 0) {
      meal.meal_ingredients.forEach(mi => {
        const ing = mi.ingredients;
        if (!ing) return;
        const factor = (Number(mi.quantity_g) || 0) / 100;
        kcal += (Number(ing.kcal_per_100g) || 0) * factor;
        protein += (Number(ing.protein_per_100g) || 0) * factor;
        fat += (Number(ing.fat_per_100g) || 0) * factor;
        carbs += (Number(ing.carbs_per_100g) || 0) * factor;
      });
    } else if (meal.recipes) {
      // Fallback: recipe-based
      const macros = getRecipeMacros(meal.recipes);
      const servings = Number(meal.servings) || 1;
      kcal = macros.kcal * servings;
      protein = macros.protein * servings;
      fat = macros.fat * servings;
      carbs = macros.carbs * servings;
    }

    return { kcal: Math.round(kcal), protein: Math.round(protein), fat: Math.round(fat), carbs: Math.round(carbs) };
  };

  // Group meals by date
  const dailyData = useMemo(() => {
    const byDate = {};
    trackerMeals.forEach(meal => {
      const date = meal.date;
      if (!byDate[date]) byDate[date] = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
      const m = computeMealMacros(meal);
      byDate[date].kcal += m.kcal;
      byDate[date].protein += m.protein;
      byDate[date].fat += m.fat;
      byDate[date].carbs += m.carbs;
    });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, macros]) => {
        const target = getDailyTarget(date);
        const bm = bodyMetrics.find(m => m.date === date);
        return {
          date,
          label: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }),
          shortLabel: new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          actual_kcal: macros.kcal,
          target_kcal: target.kcal,
          delta_kcal: macros.kcal - target.kcal,
          actual_protein: macros.protein,
          target_protein: target.protein,
          weight: bm ? Number(bm.weight_kg) : null,
        };
      });
  }, [trackerMeals, bodyMetrics, getRecipeMacros]);

  // ---------- DAILY VIEW (last 7 days) ----------

  const last7Days = useMemo(() => {
    return dailyData.slice(-7);
  }, [dailyData]);

  // ---------- WEEKLY VIEW ----------

  const weeklyData = useMemo(() => {
    const weeks = {};
    dailyData.forEach(d => {
      const date = new Date(d.date + 'T12:00:00');
      // ISO week: Monday-based
      const dayOfWeek = date.getDay() || 7; // 1=Mon, 7=Sun
      const thursday = new Date(date);
      thursday.setDate(date.getDate() + 4 - dayOfWeek);
      const yearStart = new Date(thursday.getFullYear(), 0, 1);
      const weekNum = Math.ceil(((thursday - yearStart) / 86400000 + 1) / 7);
      const key = `${thursday.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

      if (!weeks[key]) weeks[key] = { days: [], weights: [] };
      weeks[key].days.push(d);
      if (d.weight != null) weeks[key].weights.push(d.weight);
    });

    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => {
        const n = data.days.length;
        const avgKcal = Math.round(data.days.reduce((s, d) => s + d.actual_kcal, 0) / n);
        const avgTarget = Math.round(data.days.reduce((s, d) => s + d.target_kcal, 0) / n);
        const avgProtein = Math.round(data.days.reduce((s, d) => s + d.actual_protein, 0) / n);
        const avgProteinTarget = Math.round(data.days.reduce((s, d) => s + d.target_protein, 0) / n);
        const startWeight = data.weights.length > 0 ? data.weights[0] : null;
        const endWeight = data.weights.length > 0 ? data.weights[data.weights.length - 1] : null;
        const weightChange = startWeight && endWeight ? Number((endWeight - startWeight).toFixed(1)) : null;

        return {
          week: week.split('-')[1], // "W08"
          avg_kcal: avgKcal,
          avg_target_kcal: avgTarget,
          avg_protein: avgProtein,
          avg_target_protein: avgProteinTarget,
          weight_change: weightChange,
          avg_weight: data.weights.length > 0
            ? Number((data.weights.reduce((s, w) => s + w, 0) / data.weights.length).toFixed(1))
            : null,
          days: n,
        };
      });
  }, [dailyData]);

  // ---------- MONTHLY VIEW ----------

  const monthlyData = useMemo(() => {
    const months = {};
    dailyData.forEach(d => {
      const date = new Date(d.date + 'T12:00:00');
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!months[key]) months[key] = { days: [], weights: [] };
      months[key].days.push(d);
      if (d.weight != null) months[key].weights.push(d.weight);
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const n = data.days.length;
        const avgKcal = Math.round(data.days.reduce((s, d) => s + d.actual_kcal, 0) / n);
        const avgTarget = Math.round(data.days.reduce((s, d) => s + d.target_kcal, 0) / n);
        const avgProtein = Math.round(data.days.reduce((s, d) => s + d.actual_protein, 0) / n);
        const [year, mo] = month.split('-');
        const label = new Date(parseInt(year), parseInt(mo) - 1).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

        return {
          month: label,
          avg_kcal: avgKcal,
          avg_target_kcal: avgTarget,
          avg_protein: avgProtein,
          avg_weight: data.weights.length > 0
            ? Number((data.weights.reduce((s, w) => s + w, 0) / data.weights.length).toFixed(1))
            : null,
          days: n,
        };
      });
  }, [dailyData]);

  // ---------- ADHERENCE ----------

  const adherence = useMemo(() => {
    if (dailyData.length === 0) return { kcalPct: 0, proteinPct: 0, totalDays: 0 };
    const kcalWithin = dailyData.filter(d => {
      const ratio = d.target_kcal > 0 ? d.actual_kcal / d.target_kcal : 0;
      return Math.abs(1 - ratio) <= 0.10;
    }).length;
    const proteinOk = dailyData.filter(d => d.actual_protein >= 130).length;
    return {
      kcalPct: Math.round((kcalWithin / dailyData.length) * 100),
      proteinPct: Math.round((proteinOk / dailyData.length) * 100),
      totalDays: dailyData.length,
    };
  }, [dailyData]);

  // ---------- HELPERS ----------

  const getKcalBarColor = (actual, target) => {
    if (!target) return '#6B7280';
    const ratio = actual / target;
    const diff = Math.abs(1 - ratio);
    if (diff <= 0.10) return '#10B981';
    if (diff <= 0.15) return '#F59E0B';
    return '#EF4444';
  };

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

  if (trackerLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
        Loading tracker data...
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: textMuted, fontSize: '13px' }}>
        No meal data to track yet. Start logging meals in the Meal Planning tab.
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
          {/* Kcal chart */}
          <ChartCard title="Daily Calories (Last 7 Days)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last7Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="shortLabel" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="target_kcal" fill={isDark ? '#4B5563' : '#D1D5DB'} name="Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual_kcal" name="Actual" radius={[4, 4, 0, 0]}>
                  {last7Days.map((entry, i) => (
                    <Cell key={i} fill={getKcalBarColor(entry.actual_kcal, entry.target_kcal)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Delta numbers */}
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px' }}>
              {last7Days.map((d, i) => (
                <div key={i} style={{
                  fontSize: '10px', fontWeight: 600, textAlign: 'center',
                  color: d.delta_kcal <= 0 ? '#10B981' : '#EF4444',
                }}>
                  {d.delta_kcal > 0 ? '+' : ''}{d.delta_kcal}
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Protein chart */}
          <ChartCard title="Daily Protein (Last 7 Days)">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={last7Days} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="shortLabel" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="target_protein" fill={isDark ? '#4B5563' : '#D1D5DB'} name="Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual_protein" name="Actual" radius={[4, 4, 0, 0]}>
                  {last7Days.map((entry, i) => {
                    const color = getKcalBarColor(entry.actual_protein, entry.target_protein);
                    return <Cell key={i} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Weight overlay */}
          <ChartCard title="Calories vs Weight (Last 7 Days)" fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="shortLabel" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} label={{ value: 'kcal', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: textMuted } }} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={axisTick} label={{ value: 'kg', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: textMuted } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="actual_kcal" name="Actual kcal" radius={[4, 4, 0, 0]}>
                  {last7Days.map((entry, i) => (
                    <Cell key={i} fill={getKcalBarColor(entry.actual_kcal, entry.target_kcal)} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Weight (kg)" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ========== WEEKLY VIEW ========== */}
      {activeTab === 'weekly' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <ChartCard title="Weekly Avg Calories vs Target">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avg_target_kcal" fill={isDark ? '#4B5563' : '#D1D5DB'} name="Avg Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_kcal" name="Avg Actual" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell key={i} fill={getKcalBarColor(entry.avg_kcal, entry.avg_target_kcal)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Weekly Avg Protein vs Target">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avg_target_protein" fill={isDark ? '#4B5563' : '#D1D5DB'} name="Avg Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_protein" name="Avg Actual" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell key={i} fill={getKcalBarColor(entry.avg_protein, entry.avg_target_protein)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Weekly Weight Change" fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="week" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} label={{ value: 'kg change', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: textMuted } }} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={axisTick} label={{ value: 'avg kg', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: textMuted } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="weight_change" name="Weekly Change (kg)" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, i) => (
                    <Cell key={i} fill={entry.weight_change != null && entry.weight_change <= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="avg_weight" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} name="Avg Weight" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ========== MONTHLY VIEW ========== */}
      {activeTab === 'monthly' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <ChartCard title="Monthly Avg Calories">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avg_target_kcal" fill={isDark ? '#4B5563' : '#D1D5DB'} name="Avg Target" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avg_kcal" name="Avg Actual" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={getKcalBarColor(entry.avg_kcal, entry.avg_target_kcal)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Avg Protein">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis tick={axisTick} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avg_protein" fill="#3B82F6" name="Avg Protein (g)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Weight Trend" fullWidth>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={axisTick} />
                <YAxis yAxisId="left" tick={axisTick} label={{ value: 'kcal', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: textMuted } }} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={axisTick} label={{ value: 'kg', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: textMuted } }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="avg_kcal" fill="#3B82F6" name="Avg Daily Kcal" radius={[4, 4, 0, 0]} opacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="avg_weight" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} name="Avg Weight (kg)" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ========== ADHERENCE PANEL ========== */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: textSecondary, marginBottom: '12px' }}>
          Adherence ({adherence.totalDays} days tracked)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <StatCard
            label="Kcal within 10%"
            value={`${adherence.kcalPct}%`}
            color={adherence.kcalPct >= 70 ? '#10B981' : adherence.kcalPct >= 50 ? '#F59E0B' : '#EF4444'}
          />
          <StatCard
            label="Protein >= 130g"
            value={`${adherence.proteinPct}%`}
            color={adherence.proteinPct >= 70 ? '#10B981' : adherence.proteinPct >= 50 ? '#F59E0B' : '#EF4444'}
          />
          <StatCard
            label="Days tracked"
            value={adherence.totalDays}
            color="#3B82F6"
          />
        </div>
      </div>

      {/* ========== WEIGHT CORRELATION PANEL ========== */}
      {dailyData.some(d => d.weight != null) && (
        <div style={{ marginTop: '24px' }}>
          <ChartCard title="Calorie Delta vs Weight Trend" fullWidth>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dailyData.filter(d => d.weight != null || d.actual_kcal > 0).slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="shortLabel" tick={axisTick} interval="preserveStartEnd" />
                <YAxis
                  yAxisId="left"
                  tick={axisTick}
                  label={{ value: 'kcal delta', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: textMuted } }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={['auto', 'auto']}
                  tick={axisTick}
                  label={{ value: 'weight (kg)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: textMuted } }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="delta_kcal" name="Kcal Delta" radius={[4, 4, 0, 0]}>
                  {dailyData.filter(d => d.weight != null || d.actual_kcal > 0).slice(-30).map((entry, i) => (
                    <Cell key={i} fill={entry.delta_kcal <= 0 ? '#10B98180' : '#EF444480'} />
                  ))}
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="weight" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 2 }} name="Weight (kg)" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
};

export default TrackerView;
