import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number | null;
  formula: string;
  change?: number | null; // percentage
  icon: LucideIcon;
  badge?: string;
  prefix?: string;
  suffix?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  formula,
  change,
  icon: Icon,
  badge,
  prefix = '',
  suffix = '',
}) => {
  const isAvailable = value !== null && value !== undefined;
  
  // Format numeric values safely
  const formattedValue = isAvailable
    ? typeof value === 'number'
      ? `${prefix}${value.toLocaleString('en-US')}${suffix}`
      : `${prefix}${value}${suffix}`
    : 'N/A';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {formattedValue}
            </span>
            {badge && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 truncate pr-2" title={`Formula: ${formula}`}>
          {formula}
        </span>
        {change !== undefined && change !== null && (
          <span
            className={`font-semibold tabular-nums shrink-0 ${
              change > 0 ? 'text-emerald-600' : change < 0 ? 'text-rose-600' : 'text-slate-500'
            }`}
          >
            {change > 0 ? `+${change}%` : `${change}%`}
          </span>
        )}
      </div>
    </div>
  );
};
