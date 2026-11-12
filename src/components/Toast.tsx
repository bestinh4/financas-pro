import React from 'react';
import { useFinance } from '../context/FinanceContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFinance();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const iconName =
          t.type === 'error'
            ? 'error'
            : t.type === 'warning'
            ? 'warning'
            : t.type === 'info'
            ? 'info'
            : 'check_circle';

        const borderColor =
          t.type === 'error'
            ? 'border-error/40'
            : t.type === 'warning'
            ? 'border-amber-400/50'
            : t.type === 'info'
            ? 'border-secondary/40'
            : 'border-tertiary-fixed/60';

        const iconColor =
          t.type === 'error'
            ? 'text-error'
            : t.type === 'warning'
            ? 'text-amber-500'
            : t.type === 'info'
            ? 'text-secondary'
            : 'text-on-tertiary-container';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-surface-container-lowest border ${borderColor} rounded-xl p-3.5 shadow-lg flex items-start gap-3 transition-all duration-300 transform translate-y-0`}
          >
            <span className={`material-symbols-outlined text-[20px] ${iconColor} mt-0.5`}>
              {iconName}
            </span>
            <div className="flex-1">
              <h5 className="font-title-md text-title-md text-on-surface leading-tight font-semibold">
                {t.title}
              </h5>
              {t.description && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-normal">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
