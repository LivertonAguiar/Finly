import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, Info, Trash2, X, Check } from 'lucide-react';
import { useBackButton } from '../hooks/useBackButton';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const handleCancel = useCallback(() => {
    if (dialogState) {
      dialogState.resolve(false);
      setDialogState(null);
    }
  }, [dialogState]);

  // Intercept back gesture on confirm dialog with higher priority
  useBackButton(!!dialogState?.isOpen, handleCancel, 20);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        options: {
          title: options.title || 'Confirmação',
          message: options.message,
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          type: options.type || 'warning',
        },
        resolve,
      });
    });
  }, []);

  const handleConfirm = () => {
    if (dialogState) {
      dialogState.resolve(true);
      setDialogState(null);
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* THEME-INTEGRATED CONFIRM MODAL (NO BROWSER POPUPS) */}
      {dialogState?.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={handleCancel}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-700/80 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white"
          >
            {/* Header with Icon + Title */}
            <div className="flex items-start gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                  dialogState.options.type === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : dialogState.options.type === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                }`}
              >
                {dialogState.options.type === 'danger' ? (
                  <Trash2 className="w-5 h-5" />
                ) : dialogState.options.type === 'warning' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <HelpCircle className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-base font-black tracking-tight">
                  {dialogState.options.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                  {dialogState.options.message}
                </p>
              </div>

              <button
                onClick={handleCancel}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-colors cursor-pointer"
              >
                {dialogState.options.cancelText}
              </button>

              <button
                onClick={handleConfirm}
                autoFocus
                className={`px-6 py-2.5 rounded-full text-white text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  dialogState.options.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                    : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/25'
                }`}
              >
                {dialogState.options.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};
