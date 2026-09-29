import React from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { KPICard } from '../components/KPICard';
import { ChartCard } from '../components/ChartCard';
import { FilterBar } from '../components/FilterBar';
import {
  DollarSign,
  TrendingUp,
  Hash,
  Activity,
  Layers,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  BarChart3,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const {
    kpis,
    mapping,
    filteredRecords,
    cleanedRecords,
    setActiveTab,
    resetToSampleData,
    forecastResult,
    predictionModel,
  } = useAnalytics();

  const hasDate = Boolean(mapping.dateColumn);
  const hasTarget = Boolean(mapping.targetColumn);
  const hasCategory = Boolean(mapping.categoryColumn);

  // Prepare aggregated historical trend data for Recharts
  const trendData = React.useMemo(() => {
    if (!hasDate || !hasTarget) return [];
    
    // Group records by date
    const dateMap = new Map<string, number>();
    for (const r of filteredRecords) {
      if (r.date && r.target !== undefined && !isNaN(r.target)) {
        dateMap.set(r.date, (dateMap.get(r.date) || 0) + r.target);
      }
    }

    return Array.from(dateMap.entries())
      .map(([date, revenue]) => ({
        date,
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords, hasDate, hasTarget]);

  // Prepare category breakdown data for Recharts
  const categoryData = React.useMemo(() => {
    if (!hasCategory || !hasTarget) return [];

    const catMap = new Map<string, number>();
    for (const r of filteredRecords) {
      if (r.category && r.target !== undefined && !isNaN(r.target)) {
        catMap.set(r.category, (catMap.get(r.category) || 0) + r.target);
      }
    }

    return Array.from(catMap.entries())
      .map(([category, revenue]) => ({
        category,
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredRecords, hasCategory, hasTarget]);

  const CATEGORY_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#1D4ED8', '#1E40AF'];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 sm:p-10 shadow-md">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xs font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-full">
              Classical Statistical Engine
            </span>
            <span className="text-2xs text-slate-400">·</span>
            <span className="text-2xs text-slate-300 font-mono tabular-nums">100% Client-Side In-Browser</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3 text-balance">
            Predictive Analytics Using Historical Data
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 max-w-2xl">
            Transform historical sales and revenue data into actionable statistical insights. Clean raw spreadsheets, detect seasonality and time-series granularity, and generate forward forecasts using Ordinary Least Squares linear regression and rolling moving averages.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Dataset</span>
            </button>

            <button
              onClick={() => {
                resetToSampleData();
                setActiveTab('dashboard');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg border border-white/20 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-blue-300" />
              <span>Explore Demo</span>
            </button>

            <button
              onClick={() => setActiveTab('predictions')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <span>View Predictions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-8 border-t border-white/10">
          {[
            { title: 'Historical Analysis', desc: 'Summary metrics & cadence', tab: 'analysis' },
            { title: 'Data Cleaning', desc: 'Currency & null handling', tab: 'upload' },
            { title: 'Trend Analysis', desc: 'Interactive Recharts curves', tab: 'analysis' },
            { title: 'Predictive Modeling', desc: 'OLS & Moving Average', tab: 'predictions' },
            { title: 'Model Evaluation', desc: '80/20 chronological split', tab: 'evaluation' },
            { title: 'Forecast Export', desc: 'Instant CSV generation', tab: 'predictions' },
          ].map((feat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(feat.tab)}
              className="text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group"
            >
              <span className="text-xs font-semibold text-white group-hover:text-blue-300 block truncate">
                {feat.title}
              </span>
              <span className="text-2xs text-slate-400 block mt-0.5 truncate">{feat.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter Bar */}
      <FilterBar />

      {/* Granularity & Model Context Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span className="text-slate-500">Detected Granularity:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {kpis.detectedGranularity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span className="text-slate-500">Forecast Periods:</span>
            <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md tabular-nums">
              {kpis.forecastPeriods}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span className="text-slate-500">Selected Model:</span>
            <span className="font-semibold text-slate-900">
              {predictionModel === 'linear_regression' ? 'Linear Regression (y = mx + b)' : 'Moving Average'}
            </span>
          </div>
        </div>

        {forecastResult?.metrics.sufficientData && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Model Fit (R²):</span>
            <span className="font-mono tabular-nums font-bold text-slate-900">
              {forecastResult.metrics.r2.toFixed(4)}
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-2xs">
              {forecastResult.metrics.accuracyLabel}
            </span>
          </div>
        )}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Records"
          value={kpis.totalRecords}
          formula="Count of all valid records"
          icon={Hash}
          badge={`${cleanedRecords.length} loaded`}
        />

        <KPICard
          title="Total Revenue"
          value={kpis.totalRevenue}
          formula="Sum of valid numeric values in target column"
          icon={DollarSign}
          prefix="$"
        />

        <KPICard
          title="Average Revenue"
          value={kpis.averageRevenue}
          formula="Total Revenue ÷ Total Records"
          icon={Activity}
          prefix="$"
        />

        <KPICard
          title="Growth Rate"
          value={kpis.growthRate !== null ? `${kpis.growthRate > 0 ? '+' : ''}${kpis.growthRate}%` : null}
          formula="((Latest - Previous) ÷ Previous) × 100"
          change={kpis.growthRate}
          icon={TrendingUp}
        />

        <KPICard
          title="Forecast Value"
          value={kpis.forecastValue}
          formula="First period value from active predictive model"
          icon={BarChart3}
          prefix="$"
          badge={forecastResult?.granularity}
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Revenue Trend */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Historical Revenue Trend"
            subtitle={`Chronological performance aggregated by ${kpis.detectedGranularity.toLowerCase()} intervals`}
            badge="Historical"
            isEmpty={!hasDate || !hasTarget || trendData.length === 0}
            emptyTitle={!hasDate ? 'Date Column Missing' : 'Target Column Missing'}
            emptyMessage={
              !hasDate
                ? 'No date column detected. Assign a date column in Data Schema to plot historical revenue trends.'
                : 'Select a valid numeric target column in Data Schema.'
            }
            emptyActionText="Go to Data Schema"
            onEmptyAction={() => setActiveTab('schema')}
          >
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                    minTickGap={24}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val).toLocaleString('en-US')}`, 'Revenue']}
                    labelFormatter={label => `Period: ${label}`}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Revenue by Category Breakdown */}
        <div>
          <ChartCard
            title="Revenue by Category"
            subtitle="Distribution across product categories"
            badge="Distribution"
            isEmpty={!hasCategory || categoryData.length === 0}
            emptyTitle="Category Column Not Detected"
            emptyMessage="Upload a dataset with a category/department column or assign one in the Data Schema tab to enable this chart."
            emptyActionText="Configure Schema"
            onEmptyAction={() => setActiveTab('schema')}
          >
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    width={90}
                    tickLine={false}
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
                  <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Model Diagnostic Quick View */}
      {forecastResult && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Active Prediction Model Summary
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation results computed via chronological 80/20 train-test partition
              </p>
            </div>

            <button
              onClick={() => setActiveTab('predictions')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <span>Detailed Predictions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Mean Absolute Error (MAE)</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-800">
                ${forecastResult.metrics.mae.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Mean Squared Error (MSE)</span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-800">
                {forecastResult.metrics.mse.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Coefficient of Determination (R²)</span>
              <span className="text-base font-bold font-mono tabular-nums text-blue-600">
                {forecastResult.metrics.r2.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Explanatory Label</span>
              <span className="text-sm font-semibold text-emerald-700 block">
                {forecastResult.metrics.accuracyLabel}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
