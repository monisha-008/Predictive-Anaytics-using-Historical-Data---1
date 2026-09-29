import React from 'react';
import {
  Calculator,
  BookOpen,
  Code2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Database,
  ShieldAlert,
} from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Architecture, Mathematical Formulas & Documentation
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Detailed mathematical formulation and system specification for &ldquo;Predictive Analytics Using Historical Data&rdquo;.
        </p>
      </div>

      {/* Philosophy Callout */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Project Philosophy & Core Principles</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          This application is a <strong>browser-based predictive analytics platform using classical statistical methods</strong>. It does not pretend to rely on opaque, non-deterministic machine learning or cloud APIs. Instead, it utilizes transparent, fully deterministic statistical modeling (Ordinary Least Squares regression and autoregressive rolling averages) executed entirely in the client-side JavaScript engine.
        </p>
      </section>

      {/* Mathematical Formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linear Regression */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">1. Ordinary Least Squares (OLS)</h4>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Linear Regression models the relationship between chronological time periods <span className="font-mono">x</span> and target metric <span className="font-mono">y</span>:
          </p>
          <div className="p-3 bg-slate-50 rounded-lg font-mono text-xs text-slate-800 space-y-1">
            <p className="font-bold text-blue-700">y = mx + b</p>
            <p className="text-2xs text-slate-600">m = Σ((x_i - x̄)(y_i - ȳ)) ÷ Σ((x_i - x̄)²)</p>
            <p className="text-2xs text-slate-600">b = ȳ - m · x̄</p>
          </div>
          <p className="text-2xs text-slate-500 mt-3">
            Future periods are projected by incrementing time index <span className="font-mono">x</span> into future steps: <span className="font-mono">x_future = n + step</span>.
          </p>
        </div>

        {/* Moving Average */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">2. Moving Average & Forward Projection</h4>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Smooths short-term fluctuations by averaging the preceding <span className="font-mono">k</span> observations:
          </p>
          <div className="p-3 bg-slate-50 rounded-lg font-mono text-xs text-slate-800 space-y-1">
            <p className="font-bold text-blue-700">MA_t = (1 ÷ k) · Σ_(i=0)^(k-1) y_(t-i)</p>
            <p className="text-2xs text-slate-600">Autoregressive Multi-Step Forecast</p>
          </div>
          <p className="text-2xs text-slate-500 mt-3">
            Future periods recursively slide the averaging window forward, incorporating newly predicted values as future rolling inputs.
          </p>
        </div>

        {/* Evaluation Metrics */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">3. Out-of-Sample Evaluation Metrics</h4>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg font-mono text-xs text-slate-800 space-y-1.5">
            <p><strong className="text-slate-900">MAE:</strong> (1 ÷ N) · Σ |y_actual - y_pred|</p>
            <p><strong className="text-slate-900">MSE:</strong> (1 ÷ N) · Σ (y_actual - y_pred)²</p>
            <p><strong className="text-slate-900">RMSE:</strong> √MSE</p>
            <p><strong className="text-slate-900">R²:</strong> 1 - (SS_res ÷ SS_tot)</p>
          </div>
          <div className="mt-3 text-2xs space-y-1 text-slate-500">
            <p>• R² ≥ 0.80: <strong className="text-emerald-700">High explanatory fit</strong></p>
            <p>• R² ≥ 0.60: <strong className="text-blue-700">Moderate explanatory fit</strong></p>
            <p>• R² ≥ 0.00: <strong className="text-amber-700">Low explanatory fit</strong></p>
            <p>• R² &lt; 0.00: <strong className="text-rose-700">Poor explanatory fit</strong></p>
          </div>
        </div>

        {/* Time-Series Granularity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-slate-900">4. Granularity & Horizon Mapping</h4>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            Automatically computes median days between successive sorted timestamps:
          </p>
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
            <p className="text-2xs text-slate-700 font-mono">Δ &lt; 3.5 days → <strong>Daily</strong> (7d=7, 30d=30, 90d=90)</p>
            <p className="text-2xs text-slate-700 font-mono">3.5 ≤ Δ ≤ 18 days → <strong>Weekly</strong> (7d=1, 30d=4, 90d=13)</p>
            <p className="text-2xs text-slate-700 font-mono">Δ &gt; 18 days → <strong>Monthly</strong> (7d=1, 30d=1, 90d=3)</p>
          </div>
        </div>
      </div>

      {/* Tech Stack Specs */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Technology Stack & Constraints</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-2xs mb-0.5">Frontend Core</span>
            <strong className="text-slate-800">React 19 & TypeScript</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-2xs mb-0.5">Styling Engine</span>
            <strong className="text-slate-800">Tailwind CSS v4</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-2xs mb-0.5">Data Visualizations</span>
            <strong className="text-slate-800">Recharts Responsive</strong>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-400 block text-2xs mb-0.5">Spreadsheet Engines</span>
            <strong className="text-slate-800">PapaParse & SheetJS (XLSX)</strong>
          </div>
        </div>
      </section>
    </div>
  );
};
