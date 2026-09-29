import React from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { ChartCard } from '../components/ChartCard';
import { FilterBar } from '../components/FilterBar';
import { exportForecastToCsv } from '../utils/exportCsv';
import {
  TrendingUp,
  Download,
  Calendar,
  Layers,
  Sliders,
  DollarSign,
  Activity,
  ArrowRight,
  Sparkles,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { ForecastHorizon, PredictionModelType } from '../types';

export const Predictions: React.FC = () => {
  const {
    mapping,
    updateMapping,
    schema,
    predictionModel,
    setPredictionModel,
    forecastHorizon,
    setForecastHorizon,
    movingAverageWindow,
    setMovingAverageWindow,
    forecastResult,
    runPrediction,
    filteredRecords,
    setActiveTab,
  } = useAnalytics();

  const hasDate = Boolean(mapping.dateColumn);
  const hasTarget = Boolean(mapping.targetColumn);

  const availableDateCols = schema.filter(s => s.detectedType === 'date' || s.name === mapping.dateColumn);
  const availableTargetCols = schema.filter(s => s.detectedType === 'number' || s.name === mapping.targetColumn);

  const handleExportCsv = () => {
    if (!forecastResult || forecastResult.forecastPoints.length === 0) return;
    const filename = `forecast_${predictionModel}_${forecastHorizon}days_${new Date().toISOString().slice(0, 10)}.csv`;
    exportForecastToCsv(forecastResult.forecastPoints, filename);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Predictive Modeling & Forecasting</h2>
        <p className="text-xs text-slate-500 mt-1">
          Generate future sales forecasts using classical statistical techniques (Ordinary Least Squares linear regression and autoregressive moving averages). No black-box machine learning; purely deterministic statistical computation.
        </p>
      </div>

      <FilterBar />

      {/* Model Parameter Controls Panel */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900">Prediction Model Configuration</h3>
          </div>

          <button
            onClick={runPrediction}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Prediction</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Target Column Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target (Metric) Column *
            </label>
            <select
              value={mapping.targetColumn}
              onChange={e => updateMapping({ targetColumn: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {availableTargetCols.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.detectedType})
                </option>
              ))}
            </select>
          </div>

          {/* Date Column Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Date (Timeline) Column *
            </label>
            <select
              value={mapping.dateColumn}
              onChange={e => updateMapping({ dateColumn: e.target.value })}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {availableDateCols.map(c => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.detectedType})
                </option>
              ))}
            </select>
          </div>

          {/* Prediction Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Statistical Model
            </label>
            <select
              value={predictionModel}
              onChange={e => setPredictionModel(e.target.value as PredictionModelType)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="linear_regression">Linear Regression (y = mx + b)</option>
              <option value="moving_average">Moving Average (Rolling Window)</option>
            </select>
          </div>

          {/* Forecast Horizon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Forecast Horizon
            </label>
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              {([7, 30, 90] as ForecastHorizon[]).map(h => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    forecastHorizon === h
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {h} Days
                </button>
              ))}
            </div>
          </div>

          {/* Moving Average Window Size (only visible when MA is selected) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Window Size (k)
            </label>
            {predictionModel === 'moving_average' ? (
              <select
                value={movingAverageWindow}
                onChange={e => setMovingAverageWindow(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value={3}>3 Periods</option>
                <option value={5}>5 Periods</option>
                <option value={7}>7 Periods</option>
                <option value={10}>10 Periods</option>
                <option value={14}>14 Periods</option>
              </select>
            ) : (
              <div className="w-full text-xs bg-slate-100 text-slate-400 border border-slate-200 rounded-lg px-3 py-2 italic">
                N/A for Regression
              </div>
            )}
          </div>
        </div>

        {/* Granularity & Periods Explanation Bar */}
        {forecastResult && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Detected Granularity:</span>
                <strong className="text-slate-900 font-bold">{forecastResult.granularity}</strong>
              </span>

              <span className="text-slate-300">·</span>

              <span>
                Requested Horizon: <strong className="text-slate-900">{forecastHorizon} Days</strong>
              </span>

              <span className="text-slate-300">·</span>

              <span className="bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-md font-semibold">
                Forecast Periods: {forecastResult.forecastPeriods} future steps
              </span>
            </div>

            <p className="text-2xs text-slate-400">
              {forecastResult.granularity === 'Daily'
                ? `${forecastHorizon} days = ${forecastResult.forecastPeriods} daily periods`
                : forecastResult.granularity === 'Weekly'
                ? `${forecastHorizon} days ≈ ${forecastResult.forecastPeriods} weekly periods`
                : `${forecastHorizon} days ≈ ${forecastResult.forecastPeriods} monthly periods`}
            </p>
          </div>
        )}
      </section>

      {/* KPI Cards for Forecast */}
      {forecastResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Forecast Value (Next Period)
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-600">
              {forecastResult.firstForecastValue !== null
                ? `$${forecastResult.firstForecastValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </span>
            <span className="text-2xs text-slate-400 block mt-2 pt-2 border-t border-slate-100">
              Period 1 projection
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Average Forecast
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {forecastResult.averageForecastValue !== null
                ? `$${forecastResult.averageForecastValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                : 'N/A'}
            </span>
            <span className="text-2xs text-slate-400 block mt-2 pt-2 border-t border-slate-100">
              Mean over {forecastResult.forecastPeriods} future periods
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Trend Direction
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-2xl font-bold ${
                  forecastResult.trendDirection === 'Upward'
                    ? 'text-emerald-600'
                    : forecastResult.trendDirection === 'Downward'
                    ? 'text-rose-600'
                    : 'text-slate-700'
                }`}
              >
                {forecastResult.trendDirection}
              </span>
              <span
                className={`text-xs font-semibold font-mono tabular-nums ${
                  forecastResult.trendPercent > 0
                    ? 'text-emerald-600'
                    : forecastResult.trendPercent < 0
                    ? 'text-rose-600'
                    : 'text-slate-500'
                }`}
              >
                ({forecastResult.trendPercent > 0 ? '+' : ''}
                {forecastResult.trendPercent}%)
              </span>
            </div>
            <span className="text-2xs text-slate-400 block mt-2 pt-2 border-t border-slate-100">
              Relative to historical average
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Test Set Model Fit (R²)
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {forecastResult.metrics.sufficientData ? forecastResult.metrics.r2.toFixed(4) : 'N/A'}
            </span>
            <span className="text-2xs font-semibold text-emerald-700 block mt-2 pt-2 border-t border-slate-100">
              {forecastResult.metrics.accuracyLabel}
            </span>
          </div>
        </div>
      )}

      {/* Main Forecast Interactive Chart */}
      <ChartCard
        title="Historical vs Predictive Forecast Curve"
        subtitle={`Showing chronological historical observations alongside projected ${forecastResult?.forecastPeriods ?? 0} future periods`}
        badge={predictionModel === 'linear_regression' ? 'OLS Linear Regression' : 'Moving Average'}
        isEmpty={!hasDate || !hasTarget || !forecastResult}
        emptyTitle="Cannot Generate Forecast"
        emptyMessage="Valid date and target columns are required to calculate regression equations and forward predictions."
        emptyActionText="Check Data Schema"
        onEmptyAction={() => setActiveTab('schema')}
      >
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={forecastResult?.actualVsPredicted || []}
              margin={{ top: 15, right: 20, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip
                formatter={(val: any, name?: any) => [
                  val !== null && val !== undefined ? `$${Number(val).toLocaleString('en-US')}` : 'N/A',
                  name === 'actual'
                    ? 'Historical Actual'
                    : name === 'predicted'
                    ? 'In-Sample Fit'
                    : 'Future Forecast',
                ]}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
                formatter={value =>
                  value === 'actual'
                    ? 'Historical Actual'
                    : value === 'predicted'
                    ? 'In-Sample Model Fit'
                    : 'Projected Future Forecast'
                }
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
                dataKey="predicted"
                stroke="#10B981"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#F59E0B' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Forecast Points Table with CSV Export */}
      {forecastResult && forecastResult.forecastPoints.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Projected Forecast Schedule
              </h3>
              <p className="text-xs text-slate-500">
                Detailed period-by-period predictive breakdown
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Forecast CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-slate-400">Step</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Projected Date</th>
                  <th className="py-3 px-4 text-right">Predicted Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {forecastResult.forecastPoints.map(p => (
                  <tr key={p.periodIndex} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 text-slate-400 tabular-nums font-sans">
                      +{p.periodIndex}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-sans font-medium">
                      {p.periodLabel}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 tabular-nums">
                      {p.date}
                    </td>
                    <td className="py-2.5 px-4 text-right text-blue-700 font-bold tabular-nums">
                      ${p.predictedValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
