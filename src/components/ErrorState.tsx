import React from 'react';
import { AlertCircle, HelpCircle, FileQuestion, ArrowRight } from 'lucide-react';

interface ErrorStateProps {
  type?: 'warning' | 'info' | 'error' | 'empty';
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'info',
  title,
  message,
  actionText,
  onAction,
  className = '',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-8 h-8 text-rose-500" aria-hidden="true" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-amber-500" aria-hidden="true" />;
      case 'empty':
        return <FileQuestion className="w-8 h-8 text-slate-400" aria-hidden="true" />;
      case 'info':
      default:
        return <HelpCircle className="w-8 h-8 text-blue-500" aria-hidden="true" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return 'border-rose-200 bg-rose-50/50';
      case 'warning':
        return 'border-amber-200 bg-amber-50/50';
      case 'empty':
        return 'border-slate-200 bg-slate-50/50';
      case 'info':
      default:
        return 'border-blue-200 bg-blue-50/50';
    }
  };

  return (
    <div
      className={`border rounded-xl p-8 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 ${getBorderColor()} ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="mb-3">{getIcon()}</div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 mb-5 max-w-md">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
