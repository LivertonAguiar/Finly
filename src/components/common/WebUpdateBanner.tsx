import React, { useState } from 'react';
import { Sparkles, CheckCircle2, RefreshCw, X, ChevronDown, ChevronUp } from 'lucide-react';

interface WebUpdateBannerProps {
  version: string;
  notes?: string;
  onReload: () => void;
  onDismiss: () => void;
}

export const WebUpdateBanner: React.FC<WebUpdateBannerProps> = ({
  version,
  notes,
  onReload,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = () => {
    setIsReloading(true);
    onReload();
  };

  const displayNotes = notes?.trim() || 'Melhorias de estabilidade, novos recursos e correções prontas para uso.';

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-lg transition-all animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto"
      style={{
        top: 'max(calc(env(safe-area-inset-top, 0px) + 10px), 14px)',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#1A1F2E]/95 dark:bg-[#121622]/95 text-white shadow-2xl shadow-purple-950/40 border border-purple-500/30 backdrop-blur-md">
        {/* Glow sutil no topo do card */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500 to-indigo-500 opacity-80" />

        <div className="p-3.5 sm:p-4">
          <div className="flex items-start sm:items-center justify-between gap-3">
            {/* Lado esquerdo: Ícone + Título e Versão */}
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-inner">
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white tracking-tight">
                    Atualização pronta
                  </span>
                  {version && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wide font-mono">
                      v{version}
                    </span>
                  )}
                </div>

                {/* Descrição resumida das melhorias */}
                <p className={`text-xs text-slate-300 mt-1 leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {displayNotes}
                </p>

                {notes && notes.length > 90 && (
                  <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-medium mt-1 cursor-pointer transition-colors"
                  >
                    {isExpanded ? (
                      <>
                        Menos detalhes <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        Mais detalhes <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Lado direito: Botão Reiniciar agora + Fechar */}
            <div className="flex items-center gap-1.5 shrink-0 self-center">
              <button
                type="button"
                onClick={handleReload}
                disabled={isReloading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                <span>{isReloading ? 'Reiniciando...' : 'Reiniciar agora'}</span>
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Lembrar mais tarde"
                aria-label="Fechar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
