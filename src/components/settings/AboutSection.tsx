import React, { useState, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { FinlyLogo } from '../ui/FinlyLogo';
import {
  APP_VERSION,
  APP_BUILD_DATE,
  getInstalledApkVersion,
  checkForAppUpdates,
  isNewerVersion,
  openExternalUrl,
  isNativeCapacitor,
  getPlatformLabel,
  UpdateCheckResult,
} from '../../utils/appUpdateService';
import { getCurrentWebVersion } from '../../services/webUpdateService';
import { RELEASES, CURRENT_RELEASE } from '../../data/releases';

export const AboutSection: React.FC = () => {
  const [apkVersion, setApkVersion] = useState<string>(APP_VERSION);
  const [webVersion, setWebVersion] = useState<string>(APP_VERSION);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [showChangelogHistory, setShowChangelogHistory] = useState(false);

  useEffect(() => {
    if (isNativeCapacitor()) {
      getCurrentWebVersion().then(v => setWebVersion(v)).catch(() => {});
      getInstalledApkVersion().then(v => setApkVersion(v)).catch(() => {});
    }
  }, []);

  const cleanApkVersion = apkVersion.replace(/^v/, '');
  const targetApkVersion = (updateResult?.latestVersion || '1.1.83').replace(/^v/, '');
  const isApkUpdatePending = isNativeCapacitor() && (
    updateResult?.hasUpdate || isNewerVersion(targetApkVersion, cleanApkVersion)
  );
  const directApkUrl = updateResult?.downloadUrl || `https://github.com/LivertonAguiar/Finly/releases/download/v${targetApkVersion}/finly-v${targetApkVersion}.apk`;

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* 1. Header Sucinto do Finly */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <FinlyLogo size="md" showText={false} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-base font-black text-slate-900 dark:text-white">Finly</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                {isNativeCapacitor() ? `APK v${apkVersion}` : `v${APP_VERSION}`}
              </span>
              {isNativeCapacitor() && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Web v{webVersion}
                </span>
              )}
              <span className="text-[10px] text-slate-400 font-medium">
                ({APP_BUILD_DATE})
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{getPlatformLabel()}</span>
              <span>•</span>
              {isApkUpdatePending ? (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Atualização de APK pendente (v{targetApkVersion})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sincronizado
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={async () => {
              setIsCheckingUpdate(true);
              try {
                const res = await checkForAppUpdates({ notifyIfFound: false, isManualCheck: true });
                setUpdateResult(res);
                if (res?.currentVersion) {
                  setApkVersion(res.currentVersion);
                }
              } catch (e) {
                setUpdateResult({
                  hasUpdate: false,
                  failedCheck: true,
                  currentVersion: apkVersion,
                  latestVersion: '1.1.83',
                  notes: 'Não foi possível verificar atualizações no momento. Verifique sua conexão com a internet.',
                });
              } finally {
                setIsCheckingUpdate(false);
              }
            }}
            disabled={isCheckingUpdate}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 hover:text-purple-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
            <span>{isCheckingUpdate ? 'Verificando...' : 'Verificar Atualização'}</span>
          </button>

          <button
            type="button"
            onClick={() => openExternalUrl(directApkUrl)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              isApkUpdatePending
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 animate-pulse'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
            title={isApkUpdatePending ? `Baixar atualização do APK v${targetApkVersion}` : 'Baixar pacote APK para Android'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              {isApkUpdatePending
                ? `Baixar Atualização v${targetApkVersion}`
                : `Baixar APK v${targetApkVersion}`}
            </span>
          </button>
        </div>
      </div>

      {/* Banner de Atualização com Destaque */}
      {(isApkUpdatePending || updateResult) && (
        <div className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm ${
          isApkUpdatePending
            ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-purple-500/15 border-emerald-500/40 text-slate-800 dark:text-slate-100'
            : updateResult?.failedCheck
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
        }`}>
          <div className="flex items-center gap-3">
            {isApkUpdatePending ? (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-500 animate-pulse" />
              </div>
            ) : updateResult?.failedCheck ? (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <div className="space-y-0.5">
              <span className="font-black text-sm block">
                {isApkUpdatePending
                  ? `Nova versão do APK disponível: v${targetApkVersion}`
                  : updateResult?.failedCheck
                  ? (updateResult.notes || 'Não foi possível verificar atualizações no momento.')
                  : `Você já está utilizando a versão mais recente (${isNativeCapacitor() ? `APK v${cleanApkVersion}` : `v${APP_VERSION}`}).`}
              </span>
              {isApkUpdatePending && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Versão instalada: <strong className="text-slate-900 dark:text-white font-bold">v{cleanApkVersion}</strong> • Baixe o APK oficial para ter suporte completo aos novos widgets nativos do Android.
                </p>
              )}
            </div>
          </div>
          {isApkUpdatePending && (
            <button
              type="button"
              onClick={() => openExternalUrl(directApkUrl)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs cursor-pointer shrink-0 transition-all shadow-md shadow-emerald-600/30 active:scale-95 flex items-center justify-center gap-2 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Atualização (APK v{targetApkVersion})</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Notas da Versão Atual */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Novidades da Versão v{CURRENT_RELEASE.version}
            </span>
            <span className="text-[10px] text-slate-400">
              • {CURRENT_RELEASE.releaseDate}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Atual
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          {CURRENT_RELEASE.summary}
        </p>

        {/* Destaques em linha */}
        <div className="space-y-2 pt-1">
          {CURRENT_RELEASE.highlights.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5 ${
                h.type === 'feature'
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                  : h.type === 'fix'
                  ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                  : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
              }`}>
                {h.type === 'feature' ? 'Novo' : h.type === 'fix' ? 'Fix' : 'Melhoria'}
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-snug">
                <strong className="font-semibold text-slate-900 dark:text-slate-100">{h.title}:</strong>{' '}
                <span className="text-slate-500 dark:text-slate-400">{h.description}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Histórico Anterior */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowChangelogHistory(!showChangelogHistory)}
            className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-purple-500" />
              <span>Versões Anteriores ({RELEASES.length - 1})</span>
            </div>
            {showChangelogHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showChangelogHistory && (
            <div className="mt-2.5 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs animate-in fade-in duration-150">
              {RELEASES.slice(1).map(rel => (
                <div key={rel.version} className="py-2 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-800 dark:text-slate-200">v{rel.version}</span>
                    <span className="text-[10px] text-slate-400">{rel.releaseDate}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {rel.summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
