import React from 'react';
import { ErrorState } from './ErrorState';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  isEmpty = false,
  emptyTitle = 'Data Unavailable',
  emptyMessage = 'The required columns or records are not available to plot this visualization.',
  emptyActionText,
  onEmptyAction,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
            {badge && (
              <span className="text-2xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="w-full flex-1 min-h-[300px] flex items-center justify-center">
        {isEmpty ? (
          <ErrorState
            type="info"
            title={emptyTitle}
            message={emptyMessage}
            actionText={emptyActionText}
            onAction={onEmptyAction}
            className="w-full border-none bg-transparent my-0 py-4"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
};
