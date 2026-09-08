import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Smartphone } from 'lucide-react';
import { checkForAppUpdates, APP_VERSION, isNativeCapacitor } from '../../utils/appUpdateService';

interface UpdateNoticeCardProps {
  onGoToUpdate: () => void;
}

const DISMISS_KEY = 'finly_update_notice_dismissed';

export const UpdateNoticeCard: React.FC<UpdateNoticeCardProps> = ({ onGoToUpdate }) => {
  // Apenas disponível no app Android nativo (APK)
  if (!isNativeCapacitor()) return null;

  const [isVisible, setIsVisible] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>('');

  useEffect(() => {
    // Listen for real-time app update detection event
    const handleUpdateAvailable = (e: any) => {
      const detail = e.detail;
      if (detail && detail.hasUpdate && detail.latestVersion) {
        setLatestVersion(detail.latestVersion);
        setIsVisible(true);
      }
    };

    window.addEventListener('finly_app_update_available', handleUpdateAvailable);

    // Check updates after a short delay on app entry
    const timer = setTimeout(async () => {
      try {
        const res = await checkForAppUpdates({ notifyIfFound: true });
        if (res && res.hasUpdate && res.latestVersion) {
          setLatestVersion(res.latestVersion);
          const dismissed = sessionStorage.getItem(DISMISS_KEY);
          if (!dismissed) {
            setIsVisible(true);
          }
        }
      } catch (_) {}
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('finly_app_update_available', handleUpdateAvailable);
    };
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    sessionStorage.setItem(DISMISS_KEY, 'true');
  };

  const handleClick = () => {
    setIsVisible(false);
    onGoToUpdate();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-top-4 duration-300"
      style={{
        top: 'max(calc(env(safe-area-inset-top, 0px) + 12px), 16px)',
      }}
    >
      <div
        onClick={handleClick}
        className="group relative p-4 rounded-2xl bg-gradient-to-r from-purple-900/90 to-indigo-900/90 dark:from-purple-950/95 dark:to-indigo-950/95 text-white shadow-2xl border border-purple-500/30 backdrop-blur-md cursor-pointer hover:border-purple-400/60 transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 text-purple-300">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>

          <div className="flex-1 pr-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-200 border border-purple-400/30">
                Nova Versão {latestVersion ? `v${latestVersion}` : ''}
              </span>
            </div>

            <h4 className="text-xs font-black mt-1 text-white leading-tight">
              Atualização Disponível para o Finly!
            </h4>

            <p className="text-[11px] text-purple-200/80 mt-0.5 leading-snug">
              Melhorias de desempenho, novo Puxe para Atualizar e tela cheia.
            </p>

            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-black text-amber-300 group-hover:text-amber-200 transition-colors">
              <span>Clique aqui para atualizar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
