import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { RotateCcw, X, Trash2, Check } from 'lucide-react';

export interface UndoOptions {
  message: string;
  subMessage?: string;
  duration?: number; // ms, default 5000
  onUndo: () => void;
}

interface ActiveUndoItem extends UndoOptions {
  id: string;
  duration: number;
}

interface UndoToastContextType {
  showUndo: (options: UndoOptions) => void;
  dismissUndo: () => void;
}

const UndoToastContext = createContext<UndoToastContextType | undefined>(undefined);

export const UndoToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeUndo, setActiveUndo] = useState<ActiveUndoItem | null>(null);
  const [progress, setProgress] = useState(100);
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);

  const timerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const noticeTimerRef = useRef<any>(null);

  const dismissUndo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveUndo(null);
    setProgress(100);
  }, []);

  const showUndo = useCallback((options: UndoOptions) => {
    // Clear any active timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    setRestoredNotice(null);

    const duration = options.duration || 5000;
    const newItem: ActiveUndoItem = {
      ...options,
      id: `undo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      duration,
    };

    setActiveUndo(newItem);
    setProgress(100);

    const startTime = Date.now();
    const tickInterval = 50;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);
      if (remainingPct <= 0) {
        clearInterval(intervalRef.current);
      }
    }, tickInterval);

    timerRef.current = setTimeout(() => {
      dismissUndo();
    }, duration);
  }, [dismissUndo]);

  const handleUndoClick = () => {
    if (!activeUndo) return;
    try {
      activeUndo.onUndo();
    } catch (err) {
      console.error('Failed to undo action:', err);
    }
    dismissUndo();

    // Show instant success feedback
    setRestoredNotice('Ação desfeita com sucesso!');
    noticeTimerRef.current = setTimeout(() => {
      setRestoredNotice(null);
    }, 2500);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    };
  }, []);

  return (
    <UndoToastContext.Provider value={{ showUndo, dismissUndo }}>
      {children}

      {/* Floating Undo Toast - positioned above bottom nav on mobile, centered at bottom on desktop */}
      {activeUndo && (
        <div
          role="region"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-md pointer-events-auto select-none"
        >
          <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Left: Icon & Label */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">
                  {activeUndo.message}
                </p>
                <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                  {activeUndo.subMessage || 'Toque em desfazer para restaurar'}
                </p>
              </div>
            </div>

            {/* Right: Desfazer Action & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                id="finly-undo-btn"
                onClick={handleUndoClick}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Desfazer</span>
              </button>

              <button
                type="button"
                onClick={dismissUndo}
                aria-label="Dispensar aviso"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom Progress Bar Timer */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
                style={{
                  width: `${progress}%`,
                  transition: 'width 50ms linear',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Restored Success Feedback */}
      {restoredNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-sm pointer-events-auto select-none"
        >
          <div className="px-4 py-3 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 text-emerald-100 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold truncate leading-tight">{restoredNotice}</p>
          </div>
        </div>
      )}
    </UndoToastContext.Provider>
  );
};

export const useUndoToast = (): UndoToastContextType => {
  const context = useContext(UndoToastContext);
  if (!context) {
    throw new Error('useUndoToast must be used within an UndoToastProvider');
  }
  return context;
};
