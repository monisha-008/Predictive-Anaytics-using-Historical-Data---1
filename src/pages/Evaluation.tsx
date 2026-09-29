import React, { useMemo } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { evaluateModel } from '../utils/evaluation';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Scale,
  ShieldAlert,
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

export const Evaluation: React.FC = () => {
  const {
    filteredRecords,
    mapping,
    predictionModel,
    movingAverageWindow,
    setActiveTab,
  } = useAnalytics();

  const values = useMemo(() => {
    return filteredRecords
      .map(r => r.target)
      .filter((v): v is number => v !== undefined && !isNaN(v) && isFinite(v));
  }, [filteredRecords]);

  // Compute evaluation for both models for direct comparison
  const lrMetrics = useMemo(() => {
    return evaluateModel(values, 'linear_regression');
  }, [values]);

  const maMetrics = useMemo(() => {
    return evaluateModel(values, 'moving_average', movingAverageWindow);
  }, [values, movingAverageWindow]);

  // Build train/test partition visualization data
  const splitIndex = Math.floor(values.length * 0.8);
  const partitionChartData = useMemo(() => {
    return values.map((val, idx) => {
      const rec = filteredRecords[idx];
      const isTrain = idx < splitIndex;
      return {
        index: idx,
        date: rec?.date || `Index ${idx}`,
        train: isTrain ? val : null,
        test: !isTrain ? val : null,
      };
    });
  }, [values, filteredRecords, splitIndex]);

  const activeMetrics = predictionModel === 'linear_regression' ? lrMetrics : maMetrics;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Model Evaluation (80/20 Chronological Split)
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Rigorous out-of-sample backtesting without lookahead bias. Time-series observations are strictly partitioned into the first 80% for training and the final 20% for testing.
        </p>
      </div>

      {/* Methodological Integrity Card */}
      <section className="bg-blue-50/70 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Scale className="w-5 h-5 text-blue-700 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="space-y-2 text-xs text-blue-900">
            <h3 className="font-bold text-sm text-blue-950">
              Why Random K-Fold Shuffling is Strictly Prohibited in Time-Series
            </h3>
            <p className="text-blue-800 leading-relaxed">
              Unlike generic tabular classification, time-series data exhibits temporal autocorrelation. Randomly shuffling data causes <strong className="text-blue-950">data leakage</strong> (the model is trained on future data to predict the past). We enforce a strict chronological cutoff: training exclusively on periods <span className="font-mono font-semibold">1 to {splitIndex}</span>, and evaluating predictive error strictly on the unseen future holdout periods <span className="font-mono font-semibold">{splitIndex + 1} to {values.length}</span>.
            </p>
          </div>
        </div>
      </section>

      {/* Threshold Check */}
      {!activeMetrics.sufficientData ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-xl mx-auto">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Insufficient Data for Reliable Model Evaluation
          </h3>
          <p className="text-xs text-slate-600 mb-4">
            At least 5 valid historical observations are required to conduct an 80/20 train-test evaluation. The current filtered dataset contains only {values.length} records.
          </p>
          <button
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Upload More Data
          </button>
        </div>
      ) : (
        <>
          {/* Split Partition Diagram */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Chronological Partition Visualization
                </h3>
                <p className="text-xs text-slate-500">
                  Total Observations: {values.length} · Training Set: {lrMetrics.trainCount} (80%) · Holdout Test Set: {lrMetrics.testCount} (20%)
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-blue-700">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />
                  Train (80%)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Test (20%)
                </span>
              </div>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={partitionChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} minTickGap={28} />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={val => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(val: any, name?: any) => [
                      `$${Number(val).toLocaleString('en-US')}`,
                      name === 'train' ? 'Training Data (80%)' : 'Test Holdout (20%)',
                    ]}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <ReferenceLine
                    x={partitionChartData[splitIndex]?.date}
                    stroke="#DC2626"
                    strokeDasharray="4 4"
                    label={{ value: '80% Split Cutoff', position: 'insideTopLeft', fill: '#DC2626', fontSize: 11 }}
                  />
                  <Line type="monotone" dataKey="train" stroke="#2563EB" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="test" stroke="#10B981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Model Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linear Regression Evaluation Card */}
            <div className={`bg-white border rounded-xl p-6 shadow-xs ${
              predictionModel === 'linear_regression' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Linear Regression (OLS)</h3>
                  <span className="text-2xs text-slate-500 font-mono">y = mx + b</span>
                </div>
                {predictionModel === 'linear_regression' && (
                  <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    Active Model
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-500">R² Explanatory Fit:</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                      {lrMetrics.r2.toFixed(4)}
                    </span>
                  </div>
                  <span className="text-2xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded block text-center">
                    {lrMetrics.accuracyLabel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-2xs mb-0.5">MAE</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800">
                      ${lrMetrics.mae.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-2xs mb-0.5">MSE</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800">
                      {lrMetrics.mse.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-2xs mb-0.5">RMSE</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800">
                      ${lrMetrics.rmse.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Moving Average Evaluation Card */}
            <div className={`bg-white border rounded-xl p-6 shadow-xs ${
              predictionModel === 'moving_average' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Moving Average</h3>
                  <span className="text-2xs text-slate-500 font-mono">Rolling Window (k = {movingAverageWindow})</span>
                </div>
                {predictionModel === 'moving_average' && (
                  <span className="text-2xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    Active Model
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs text-slate-500">R² Explanatory Fit:</span>
                    <span className="text-lg font-bold font-mono tabular-nums text-slate-900">
                      {maMetrics.r2.toFixed(4)}
                    </span>
                  </div>
                  <span className="text-2xs font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded block text-center">
                    {maMetrics.accuracyLabel}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-2xs mb-0.5">MAE</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800">
                      ${maMetrics.mae.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-2xs mb-0.5">MSE</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800">
                      {maMetrics.mse.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block text-2xs mb-0.5">RMSE</span>
                    <span className="font-bold font-mono tabular-nums text-slate-800">
                      ${maMetrics.rmse.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mathematical Disclaimer Callout */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-800 block mb-1">Statistical Accuracy Disclaimer</span>
              <p className="leading-relaxed">
                The accuracy labels (e.g. &ldquo;High explanatory fit&rdquo;) describe historical mathematical model fit on the chronological test holdout partition. Statistical models extrapolate past patterns and assume baseline stationarity; they are <strong>NOT a guarantee of future real-world financial performance</strong>.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
