import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  LineChart,
  TrendingUp,
  CheckCircle2,
  Database,
  Info,
  Layers,
  X,
} from 'lucide-react';
import { useAnalytics } from '../context/AnalyticsContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, kpis, fileName, mapping } = useAnalytics();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Executive KPIs & metrics' },
    { id: 'upload', label: 'Upload Data', icon: UploadCloud, description: 'CSV & Excel workbook parser' },
    { id: 'analysis', label: 'Data Analysis', icon: LineChart, description: 'Trends & category breakdown' },
    { id: 'predictions', label: 'Predictions', icon: TrendingUp, description: 'Forecast generator & export' },
    { id: 'evaluation', label: 'Model Evaluation', icon: CheckCircle2, description: '80/20 train-test metrics' },
    { id: 'schema', label: 'Data Schema', icon: Database, description: 'Column roles & overrides' },
    { id: 'about', label: 'About', icon: Info, description: 'Formulas & architecture' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Primary Navigation"
      >
        <div>
          {/* Brand header */}
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-600 rounded-lg text-white">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="font-bold text-slate-900 tracking-tight text-sm block leading-tight">
                  Predictive Analytics
                </span>
                <span className="text-2xs text-slate-500 font-medium block">Classical Statistical Methods</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 lg:hidden"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="p-4 space-y-1" aria-label="Main menu">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
                    aria-hidden="true"
                  />
                  <div className="truncate">
                    <span className="block truncate">{item.label}</span>
                    <span className="block text-2xs text-slate-400 font-normal truncate">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dataset Status Summary Card */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-2xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
              Active Dataset
            </span>
            <p className="text-xs font-semibold text-slate-800 truncate mb-1" title={fileName}>
              {fileName}
            </p>
            <div className="space-y-1 text-2xs text-slate-500">
              <div className="flex justify-between">
                <span>Records:</span>
                <span className="font-mono tabular-nums font-medium text-slate-700">
                  {kpis.totalRecords.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Granularity:</span>
                <span className="font-medium text-slate-700">{kpis.detectedGranularity}</span>
              </div>
              <div className="flex justify-between">
                <span>Target Col:</span>
                <span className="font-medium text-slate-700 truncate max-w-[100px]" title={mapping.targetColumn || 'None'}>
                  {mapping.targetColumn || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
