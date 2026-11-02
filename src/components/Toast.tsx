import React from 'react';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          info: <Info className="w-4 h-4 text-indigo-500 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
        };

        const bgStyles = {
          success: 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900',
          info: 'border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900',
          warning: 'border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2.5 p-3.5 rounded-xl border shadow-lg text-xs font-medium text-slate-800 dark:text-slate-100 ${bgStyles[toast.type]} animate-in slide-in-from-bottom-2 duration-150`}
          >
            {icons[toast.type]}
            <p className="flex-1 leading-snug">{toast.message}</p>
          </div>
        );
      })}
    </div>
  );
};
