import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Download, Smartphone, Laptop, Share, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall?: () => void;
  canInstallPrompt?: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  canInstallPrompt,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else if ((document.documentElement as any).webkitRequestFullscreen) {
          await (document.documentElement as any).webkitRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document.exitFullscreen as any)();
        }
      }
    } catch (err) {
      console.warn('Fullscreen toggle error:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Aplicativo & Modo Tela Cheia" maxWidth="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-lg shadow-purple-600/20">
          <FinlyLogo size="lg" showText={false} />
          <div>
            <h4 className="text-sm font-black">Finly no seu Celular ou Computador</h4>
            <p className="text-xs text-purple-100 mt-0.5">
              Acesso rápido sem digitar endereço, modo tela cheia imersivo, funciona offline e carrega instantaneamente!
            </p>
          </div>
        </div>

        {/* Quick Action: Modo Tela Cheia Instantâneo */}
        <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Modo Tela Cheia Imersivo</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Oculte as barras do navegador para ter a experiência de um aplicativo nativo agora.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-4 py-2.5 text-xs font-black bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" /> Sair da Tela Cheia
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" /> Ativar Tela Cheia
              </>
            )}
          </button>
        </div>

        {canInstallPrompt && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              Instalação direta disponível no seu navegador!
            </div>
            <button
              onClick={() => {
                if (onInstall) onInstall();
                onClose();
              }}
              className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4" /> Instalar App
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Android */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Android (Chrome)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <li>Abra o Finly no Chrome</li>
              <li>Toque no menu <strong>(3 pontinhos)</strong></li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial"</li>
            </ol>
          </div>

          {/* iOS */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <Share className="w-4 h-4 text-emerald-500" />
              <span>iPhone / iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <li>Abra o Safari no seu iPhone</li>
              <li>Toque no botão <strong>Compartilhar</strong> (ícone com quadrado e seta)</li>
              <li>Toque em <strong>"Adicionar à Tela de Início"</strong></li>
            </ol>
          </div>

          {/* Desktop */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <Laptop className="w-4 h-4 text-emerald-500" />
              <span>Computador (PC / Mac)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <li>No Chrome ou Edge, clique no ícone <strong>Instalar</strong> na barra de endereços</li>
              <li>Clique em <strong>"Instalar"</strong> para ter o app na sua área de trabalho</li>
            </ol>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-100 dark:bg-[#222226] hover:bg-slate-200 dark:hover:bg-[#2c2c32] text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
