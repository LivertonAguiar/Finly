import React, { useState, useEffect } from 'react';
import { Download, X, Share, Smartphone, Sparkles, ChevronRight } from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';

interface MobileInstallBannerProps {
  deferredPrompt: any;
  onOpenFullModal: () => void;
}

export const MobileInstallBanner: React.FC<MobileInstallBannerProps> = ({
  deferredPrompt,
  onOpenFullModal,
}) => {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosTooltip, setShowIosTooltip] = useState(false);

  useEffect(() => {
    // Check if running as installed standalone app
    const checkStandalone = () => {
      const standaloneQuery = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(standaloneQuery || isIosStandalone));
    };

    checkStandalone();

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIos(isAppleMobile);

    // Check session dismissal
    const dismissed = sessionStorage.getItem('finly_install_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsDismissed(true);
        }
      } catch (err) {
        onOpenFullModal();
      }
    } else if (isIos) {
      setShowIosTooltip(true);
    } else {
      onOpenFullModal();
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('finly_install_banner_dismissed', 'true');
    } catch (e) {}
  };

  // If already installed as app or dismissed, don't show floating banner
  if (isStandalone || isDismissed) {
    return null;
  }

  return (
    <>
      {/* Floating Bottom / Mobile App Install Bar */}
      <div className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-xl border border-purple-500/40 dark:border-purple-500/30 shadow-2xl flex items-center justify-between gap-3">
          {/* Left: App Icon & Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={handleInstallClick}>
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                  Instalar App Finly
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Modo tela cheia e acesso direto sem navegador
              </p>
            </div>
          </div>

          {/* Right: Install CTA & Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Instalar</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Bottom Sheet Popup */}
      {showIosTooltip && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setShowIosTooltip(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-6 duration-300"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FinlyLogo size="sm" showText={false} />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIosTooltip(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Para transformar o Finly em um aplicativo de tela cheia no iOS:
            </p>

            <div className="space-y-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
                  1
                </div>
                <span>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta para cima ⎋ na barra do Safari).</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black shrink-0">
                  2
                </div>
                <span>Role para baixo e selecione <strong>"Adicionar à Tela de Início"</strong> ⊕.</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-[#222226] border border-slate-200/80 dark:border-slate-800/80">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
                  3
                </div>
                <span>Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosTooltip(false)}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer text-center"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
