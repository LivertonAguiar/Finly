import React, { useState, useEffect } from 'react';
import { Sparkles, X, Check, ArrowRight, Layers, ShieldCheck, Zap } from 'lucide-react';
import { CURRENT_VERSION, CURRENT_RELEASE } from '../../data/releases';
import { isNativeCapacitor } from '../../utils/appUpdateService';
import { useBackButton } from '../../hooks/useBackButton';
import { ReleaseLogView } from './ReleaseLogView';

interface WhatsNewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onNavigateToSobre?: () => void;
}

export type WebWhatsNewModalProps = WhatsNewModalProps;

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onNavigateToSobre,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const getSeenVersionKey = () => (isNativeCapacitor() ? 'finly_seen_android_version' : 'finly_seen_web_version');

  useEffect(() => {
    // Automatically pop up on first access after update (both Web and Native Android)
    if (controlledIsOpen === undefined) {
      try {
        const key = getSeenVersionKey();
        const seenVersion = localStorage.getItem(key);
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
      const key = getSeenVersionKey();
      localStorage.setItem(key, CURRENT_VERSION);
    } catch (_) {}

    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  // Close modal on physical Android back gesture
  useBackButton(isOpen, handleDismiss);

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
          <div className="pr-6">
            <div className="flex items-center gap-2 flex-wrap">
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {CURRENT_RELEASE.summary}
            </p>
          </div>
        </div>

        {/* Highlights List Categorizada */}
        <div className="mb-6 max-h-[50vh] overflow-y-auto pr-1">
          <ReleaseLogView highlights={CURRENT_RELEASE.highlights} />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
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

export const WebWhatsNewModal = WhatsNewModal;
