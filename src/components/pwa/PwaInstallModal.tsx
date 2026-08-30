import React from 'react';
import { Modal } from '../ui/Modal';
import { Download, Smartphone, Laptop, Share } from 'lucide-react';

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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Instalar Aplicativo PlannerFin" maxWidth="lg">
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-black shrink-0">
            P
          </div>
          <div>
            <h4 className="text-sm font-black">PlannerFin no seu Celular ou Computador</h4>
            <p className="text-xs text-emerald-100 mt-0.5">
              Acesso rápido sem precisar digitar endereço, funciona offline e carrega instantaneamente!
            </p>
          </div>
        </div>

        {canInstallPrompt && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
              Instalação direta disponível no seu navegador!
            </div>
            <button
              onClick={() => {
                if (onInstall) onInstall();
                onClose();
              }}
              className="px-4 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Instalar Agora
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Android */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Android (Chrome)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 text-[11px]">
              <li>Abra o PlannerFin no Chrome</li>
              <li>Toque no menu <strong>(3 pontinhos)</strong></li>
              <li>Selecione <strong>"Instalar aplicativo"</strong> ou "Adicionar à tela inicial"</li>
            </ol>
          </div>

          {/* iOS */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
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
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
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
            className="px-5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl"
          >
            Entendido
          </button>
        </div>
      </div>
    </Modal>
  );
};
