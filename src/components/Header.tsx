import React from 'react';
import { Menu, RotateCcw, AlertCircle, Database, Sparkles } from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const {
    activeTab,
    fileName,
    resetToSampleData,
    kpis,
    storageWarning,
    dismissStorageWarning,
  } = useAnalytics();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'upload':
        return 'Upload & Connect Data';
      case 'analysis':
        return 'Data Analysis & Visualizations';
      case 'predictions':
        return 'Predictive Modeling & Forecast';
      case 'evaluation':
        return 'Model Evaluation (80/20 Chronological Split)';
      case 'schema':
        return 'Data Schema & Column Roles';
      case 'about':
        return 'Architecture, Formulas & Documentation';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      {/* Storage Warning Banner */}
      {storageWarning && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{storageWarning}</span>
          </div>
          <button
            onClick={dismissStorageWarning}
            className="text-2xs font-semibold uppercase tracking-wider text-amber-900 hover:underline px-2 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Top Bar */}
      <div className="h-16 px-4 md:px-8 flex items-center justify-between gap-4">
        {/* Left Zone: Hamburger + Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium hidden sm:inline">Analytics</span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-semibold text-slate-900 tracking-tight text-sm">
              {getPageTitle(activeTab)}
            </span>
          </nav>
        </div>

        {/* Right Zone: Actions & Granularity Indicator */}
        <div className="flex items-center gap-3">
          {/* Detected Granularity Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-2xs text-slate-600 font-medium">
            <span className="text-slate-400">Granularity:</span>
            <span className="font-bold text-slate-900">{kpis.detectedGranularity}</span>
          </div>

          {/* Reset to Sample Data CTA */}
          <button
            onClick={resetToSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg shadow-2xs transition-colors"
            title="Restore original 120-day sample retail dataset and reset all filters and models"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span className="hidden sm:inline">Reset Sample Data</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
