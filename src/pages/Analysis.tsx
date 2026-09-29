import React, { useMemo, useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { FilterBar } from '../components/FilterBar';
import { ChartCard } from '../components/ChartCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { Granularity } from '../types';

export const Analysis: React.FC = () => {
  const {
    filteredRecords,
    mapping,
    kpis,
    forecastResult,
    setActiveTab,
  } = useAnalytics();

  const [aggregationCadence, setAggregationCadence] = useState<Granularity>(kpis.detectedGranularity);

  const hasDate = Boolean(mapping.dateColumn);
  const hasTarget = Boolean(mapping.targetColumn);
  const hasCategory = Boolean(mapping.categoryColumn);
  const hasProduct = Boolean(mapping.productColumn);

  // 1. Historical Revenue Trend (Chronological Line/Area)
  const historicalTrendData = useMemo(() => {
    if (!hasDate || !hasTarget) return [];

    const map = new Map<string, { date: string; revenue: number; transactions: number }>();
    for (const r of filteredRecords) {
      if (r.date && r.target !== undefined && !isNaN(r.target)) {
        const existing = map.get(r.date) || { date: r.date, revenue: 0, transactions: 0 };
        existing.revenue += r.target;
        existing.transactions += 1;
        map.set(r.date, existing);
      }
    }

    return Array.from(map.values())
      .map(item => ({
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
        averageOrder: Math.round((item.revenue / item.transactions) * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords, hasDate, hasTarget]);

  // 2. Actual vs Fitted / Predicted
  const actualVsFittedData = useMemo(() => {
    if (!forecastResult || !forecastResult.actualVsPredicted) return [];
    return forecastResult.actualVsPredicted.map(p => ({
      date: p.date,
      actual: p.actual !== null ? p.actual : undefined,
      fitted: p.predicted !== null ? p.predicted : undefined,
      futureForecast: p.forecast !== null ? p.forecast : undefined,
      type: p.type,
    }));
  }, [forecastResult]);

  // 3. Category Breakdown Data
  const categoryData = useMemo(() => {
    if (!hasCategory || !hasTarget) return [];

    const catMap = new Map<string, number>();
    let totalRev = 0;

    for (const r of filteredRecords) {
      if (r.category && r.target !== undefined && !isNaN(r.target)) {
        catMap.set(r.category, (catMap.get(r.category) || 0) + r.target);
        totalRev += r.target;
      }
    }

    return Array.from(catMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: totalRev > 0 ? Number(((value / totalRev) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords, hasCategory, hasTarget]);

  // 4. Aggregated Trend (Daily vs Weekly vs Monthly)
  const aggregatedTrendData = useMemo(() => {
    if (!hasDate || !hasTarget) return [];

    const aggMap = new Map<string, number>();

    for (const r of filteredRecords) {
      if (!r.date || r.target === undefined || isNaN(r.target)) continue;

      let key = r.date;
      if (aggregationCadence === 'Monthly') {
        key = r.date.slice(0, 7); // YYYY-MM
      } else if (aggregationCadence === 'Weekly') {
        const d = new Date(r.date);
        const day = d.getDay();
        // Shift to Monday of the week
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        key = `Wk ${monday.toISOString().slice(0, 10)}`;
      }

      aggMap.set(key, (aggMap.get(key) || 0) + r.target);
    }

    return Array.from(aggMap.entries())
      .map(([period, total]) => ({
        period,
        revenue: Math.round(total * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredRecords, hasDate, hasTarget, aggregationCadence]);

  const COLORS = ['#2563EB', '#0D9488', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Historical Trend Analysis</h2>
        <p className="text-xs text-slate-500 mt-1">
          Explore historical trends, compare actual observation figures against predictive model fits, and analyze category distributions.
        </p>
      </div>

      <FilterBar />

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Historical Revenue Trend */}
        <ChartCard
          title="Historical Revenue Trend"
          subtitle="Cumulative daily revenue progression over historical timeline"
          badge="Trend"
          isEmpty={!hasDate || !hasTarget || historicalTrendData.length === 0}
          emptyTitle="No Date Column Detected"
          emptyMessage="No date column detected. Upload a dataset containing a date column to view the historical trend."
          emptyActionText="Configure Date Column"
          onEmptyAction={() => setActiveTab('schema')}
        >
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} minTickGap={28} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('en-US')}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#areaGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 2. Actual vs Fitted & Forecast */}
        <ChartCard
          title="Actual vs Model Fitted Values"
          subtitle="In-sample statistical fit overlaid with projected forward forecast"
          badge="Model Fit"
          isEmpty={!hasDate || !hasTarget || actualVsFittedData.length === 0}
          emptyTitle="Forecast Model Not Available"
          emptyMessage="Requires date and numeric target columns to compute in-sample model fits."
          emptyActionText="Go to Predictions"
          onEmptyAction={() => setActiveTab('predictions')}
        >
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={actualVsFittedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} minTickGap={32} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any, name?: any) => [
                    val !== undefined ? `$${Number(val).toLocaleString('en-US')}` : 'N/A',
                    name === 'actual' ? 'Actual' : name === 'fitted' ? 'Model Fitted' : 'Future Forecast',
                  ]}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={value => (value === 'actual' ? 'Actual Historical' : value === 'fitted' ? 'Model Fit' : 'Forecast')}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="fitted"
                  stroke="#10B981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="futureForecast"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 3. Category Breakdown */}
        <ChartCard
          title="Revenue by Category"
          subtitle="Total revenue distribution across product categories"
          badge="Categorical"
          isEmpty={!hasCategory || categoryData.length === 0}
          emptyTitle="Category Column Required"
          emptyMessage="No category column detected. Upload a dataset with a category column or assign one in the Data Schema tab."
          emptyActionText="Assign Category"
          onEmptyAction={() => setActiveTab('schema')}
        >
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} interval={0} angle={-15} textAnchor="end" />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('en-US')}`, 'Total Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 4. Aggregated Trend (with interactive cadence selector) */}
        <ChartCard
          title="Aggregated Time Cadence"
          subtitle={`Aggregated sales grouped by ${aggregationCadence.toLowerCase()} interval`}
          badge="Aggregated"
          actions={
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md text-2xs font-semibold">
              {(['Daily', 'Weekly', 'Monthly'] as Granularity[]).map(cadence => (
                <button
                  key={cadence}
                  onClick={() => setAggregationCadence(cadence)}
                  className={`px-2 py-1 rounded transition-colors ${
                    aggregationCadence === cadence
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cadence}
                </button>
              ))}
            </div>
          }
          isEmpty={!hasDate || !hasTarget || aggregatedTrendData.length === 0}
          emptyTitle="Time Series Data Needed"
          emptyMessage="Upload date and target columns to view aggregated trend periods."
          emptyActionText="Check Schema"
          onEmptyAction={() => setActiveTab('schema')}
        >
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregatedTrendData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} minTickGap={20} angle={-20} textAnchor="end" />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString('en-US')}`, 'Aggregated Revenue']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
