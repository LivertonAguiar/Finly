import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  APP_VERSION,
  APP_BUILD_DATE,
  GITHUB_ACTIONS_URL,
  GITHUB_RELEASES_URL,
  checkForAppUpdates,
  openExternalUrl,
  forceAppReload,
  isNativeCapacitor,
  getPlatformLabel,
  UpdateCheckResult,
} from '../../utils/appUpdateService';
import { CURRENT_RELEASE } from '../../data/releases';
import { useBackButton } from '../../hooks/useBackButton';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ isOpen, onClose }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // Close modal on Android physical back gesture
  useBackButton(isOpen, onClose);

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const res = await checkForAppUpdates({ notifyIfFound: true, isManualCheck: true });
      setResult(res);
    } catch (e) {
      setResult({
        hasUpdate: false,
        latestVersion: APP_VERSION,
        notes: 'Não foi possível contatar o servidor de atualizações no momento.',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleReload = async () => {
    setIsReloading(true);
    await forceAppReload();
  };

  // Auto-check on modal open if not checked yet
  useEffect(() => {
    if (isOpen) {
      handleCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#18181B] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Atualização do Aplicativo
            </h3>
            <p className="text-xs text-slate-400">
              Central de versões e sincronização do Finly
            </p>
          </div>
        </div>

        {/* Current Version Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Versão Instalada
              </p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                v{APP_VERSION} <span className="text-[10px] text-slate-400 font-normal">({APP_BUILD_DATE})</span>
              </p>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {getPlatformLabel()}
          </span>
        </div>

        {/* Status / Check Result */}
        {result && (
          <div
            className={`p-4 rounded-2xl border mb-5 text-xs ${
              result.hasUpdate
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {result.hasUpdate ? (
                <Sparkles className="w-4 h-4 text-purple-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>
                {result.hasUpdate ? `Nova versão disponível: v${result.latestVersion}` : 'Você está na versão mais recente!'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {result.notes || CURRENT_RELEASE.summary}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Check Updates Button (Apenas Android Nativo) */}
          {isNativeCapacitor() && (
            <button
              type="button"
              onClick={handleCheck}
              disabled={isChecking}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Verificando atualizações...' : 'Verificar Atualizações Agora'}</span>
            </button>
          )}

          {/* Download Latest APK Button (Apenas Android Nativo) */}
          {isNativeCapacitor() && (
            <button
              type="button"
              onClick={() => openExternalUrl(result?.downloadUrl || GITHUB_RELEASES_URL)}
              className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                result?.hasUpdate
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 animate-pulse'
                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
              }`}
            >
              <Download className={`w-4 h-4 ${result?.hasUpdate ? 'text-white' : 'text-emerald-500'}`} />
              <span>
                {result?.hasUpdate
                  ? `Baixar Atualização v${result.latestVersion} (APK)`
                  : 'Baixar APK do Aplicativo (Android)'}
              </span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-auto" />
            </button>
          )}

          {/* Force Reload / Cache Wipe */}
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? 'Limpando e recarregando...' : 'Recarregar e Limpar Cache'}</span>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[10px] text-center text-slate-400 mt-4 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Finly Pro Edition • Criptografia e sincronização contínua</span>
        </p>
      </div>
    </div>
  );
};
