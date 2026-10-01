import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
  };

  const borderColors = {
    success: 'border-emerald-200 bg-white shadow-emerald-900/5',
    error: 'border-rose-200 bg-white shadow-rose-900/5',
    warning: 'border-amber-200 bg-white shadow-amber-900/5',
    info: 'border-blue-200 bg-white shadow-blue-900/5',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in pointer-events-auto max-w-sm w-full px-4 sm:px-0">
      <div
        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border shadow-lg ${
          borderColors[toast.type]
        } transition-all duration-200`}
        role="alert"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icons[toast.type]}
          <p className="text-xs font-semibold text-slate-900 truncate">
            {toast.message}
          </p>
        </div>
        <button
          onClick={dismissToast}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
