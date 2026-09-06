import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { CURRENT_VERSION, CURRENT_RELEASE } from '../../data/releases';
import { isNativeCapacitor } from '../../utils/appUpdateService';

interface WebWhatsNewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToSobre?: () => void;
}

const SEEN_VERSION_KEY = 'finly_seen_web_version';

export const WebWhatsNewModal: React.FC<WebWhatsNewModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onNavigateToSobre,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  useEffect(() => {
    // Only automatically pop up on Web (non-native) on first access after update
    if (!isNativeCapacitor() && controlledIsOpen === undefined) {
      try {
        const seenVersion = localStorage.getItem(SEEN_VERSION_KEY);
        if (seenVersion !== CURRENT_VERSION) {
          // Small delay so the app finishes initial loading smoothly
          const timer = setTimeout(() => {
            setInternalIsOpen(true);
          }, 800);
          return () => clearTimeout(timer);
        }
      } catch (_) {}
    }
  }, [controlledIsOpen]);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const handleDismiss = () => {
    try {
      localStorage.setItem(SEEN_VERSION_KEY, CURRENT_VERSION);
    } catch (_) {}

    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleGoToSobre = () => {
    handleDismiss();
    if (onNavigateToSobre) {
      onNavigateToSobre();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#18181B] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
            <Sparkles className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                Novidades da v{CURRENT_VERSION}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {CURRENT_RELEASE.releaseDate}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
              O Finly foi atualizado! 🚀
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {CURRENT_RELEASE.summary}
            </p>
          </div>
        </div>

        {/* Highlights List */}
        <div className="space-y-2.5 mb-6 max-h-[50vh] overflow-y-auto pr-1">
          {CURRENT_RELEASE.highlights.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-3"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                {idx + 1}
              </div>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-slate-800 dark:text-slate-200">
                  {item.title}
                </h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={handleGoToSobre}
            className="text-xs font-bold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors flex items-center gap-1.5 cursor-pointer order-2 sm:order-1"
          >
            <span>Ver histórico completo em Sobre</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 order-1 sm:order-2"
          >
            <Check className="w-4 h-4" />
            <span>Continuar para o Finly</span>
          </button>
        </div>
      </div>
    </div>
  );
};
