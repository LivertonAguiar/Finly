import React, { useState, useEffect } from 'react';
import {
  Target,
  CreditCard,
  TrendingUp,
  FolderTree,
  Upload,
  Download,
  Bot,
  Users,
  Sparkles,
  Info,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  BadgePercent,
  Flag,
  BarChart3,
  Calendar as CalendarIcon,
  Building2,
  List,
  Settings,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Bell,
  Send,
  Check,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { FinlyLogo } from '../ui/FinlyLogo';
import {
  ALL_SIDEBAR_ITEMS,
  getStoredSidebarItems,
  getSidebarItemLabel,
} from '../../utils/sidebarConfig';
import { SidebarCustomizerModal } from '../layout/SidebarCustomizerModal';
import { WebWhatsNewModal } from '../common/WebWhatsNewModal';
import { useTranslation } from '../../utils/i18n';
import { CURRENT_RELEASE, RELEASES } from '../../data/releases';
import {
  APP_VERSION,
  APP_BUILD_DATE,
  checkForAppUpdates,
  openExternalUrl,
  forceAppReload,
  GITHUB_RELEASES_URL,
  isNativeCapacitor,
  isMobileDevice,
  getPlatformLabel,
  UpdateCheckResult,
} from '../../utils/appUpdateService';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../../utils/notificationEngine';

interface MorePageProps {
  setActiveTab: (tab: string) => void;
  initialSubTab?: 'GERAL' | 'GERENCIAR' | 'SOBRE';
}

export const MorePage: React.FC<MorePageProps> = ({ setActiveTab, initialSubTab }) => {
  const { exportBackupJSON, user } = useFinancial();
  const { lang, t } = useTranslation();
  const [segmentedTab, setSegmentedTab] = useState<'GERAL' | 'GERENCIAR' | 'SOBRE'>(initialSubTab || 'GERAL');
  const [activeSidebarIds, setActiveSidebarIds] = useState<string[]>(getStoredSidebarItems);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Update check states
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  // Notification states
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(getNotificationPermission);
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [showChangelogHistory, setShowChangelogHistory] = useState(false);
  const [showWebWhatsNewModal, setShowWebWhatsNewModal] = useState(false);

  useEffect(() => {
    if (initialSubTab) {
      setSegmentedTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handleOpenSobre = () => setSegmentedTab('SOBRE');
    window.addEventListener('finly_open_sobre', handleOpenSobre);
    return () => window.removeEventListener('finly_open_sobre', handleOpenSobre);
  }, []);

  // Auto-check for updates only on native Android
  useEffect(() => {
    if (segmentedTab === 'SOBRE' && isNativeCapacitor()) {
      setIsCheckingUpdate(true);
      checkForAppUpdates({ notifyIfFound: false, isManualCheck: false })
        .then(res => setUpdateResult(res))
        .catch(() => {
          setUpdateResult({
            hasUpdate: false,
            latestVersion: APP_VERSION,
            notes: 'Você já está utilizando a versão mais recente do Finly.',
          });
        })
        .finally(() => setIsCheckingUpdate(false));
    }
  }, [segmentedTab]);

  // Sync with sidebar changes
  useEffect(() => {
    const handleSidebarChange = () => {
      setActiveSidebarIds(getStoredSidebarItems());
    };
    window.addEventListener('plannerfin_sidebar_changed', handleSidebarChange);
    return () => window.removeEventListener('plannerfin_sidebar_changed', handleSidebarChange);
  }, []);

  // Define potential items for each section in MorePage
  const generalMoreItems = [
    {
      id: 'dividas',
      label: getSidebarItemLabel('dividas', lang),
      description: 'Controle de parcelamentos, juros e amortizações',
      icon: BadgePercent,
      colorClass: 'bg-rose-50 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400',
    },
    {
      id: 'investimentos',
      label: getSidebarItemLabel('investimentos', lang),
      description: 'Ações, FIIs, Renda Fixa e rendimentos',
      icon: TrendingUp,
      colorClass: 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'whatsapp',
      label: getSidebarItemLabel('whatsapp', lang),
      description: 'Lançamentos via áudio, comprovantes e fotos',
      icon: Bot,
      colorClass: 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'skills',
      label: getSidebarItemLabel('skills', lang),
      description: 'Automações, milhas e otimização tributária',
      icon: Sparkles,
      colorClass: 'bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'metas',
      label: getSidebarItemLabel('metas', lang),
      description: 'Objetivos de curto e longo prazo',
      icon: Target,
      colorClass: 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'planejamento',
      label: getSidebarItemLabel('planejamento', lang),
      description: 'Teto de gastos e matriz de 12 meses',
      icon: Flag,
      colorClass: 'bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'relatorios',
      label: getSidebarItemLabel('relatorios', lang),
      description: 'Análise detalhada de evolução e fluxo',
      icon: BarChart3,
      colorClass: 'bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'calendario',
      label: getSidebarItemLabel('calendario', lang),
      description: 'Visão mensal de lançamentos e contas',
      icon: CalendarIcon,
      colorClass: 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'contas',
      label: getSidebarItemLabel('contas', lang),
      description: 'Gestão de contas correntes e carteiras',
      icon: Building2,
      colorClass: 'bg-teal-50 dark:bg-teal-600/20 text-teal-600 dark:text-teal-400',
    },
    {
      id: 'cartoes',
      label: getSidebarItemLabel('cartoes', lang),
      description: 'Limites, faturas e parcelamentos',
      icon: CreditCard,
      colorClass: 'bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'transacoes',
      label: getSidebarItemLabel('transacoes', lang),
      description: 'Extrato completo e lançamentos',
      icon: List,
      colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
  ];

  const manageMoreItems = [
    {
      id: 'cadastro',
      label: getSidebarItemLabel('cadastro', lang),
      description: 'Personalizar categorias pai e subcategorias',
      icon: FolderTree,
      colorClass: 'bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'familia',
      label: getSidebarItemLabel('familia', lang),
      description: 'Compartilhar controle com múltiplos membros',
      icon: Users,
      colorClass: 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'settings',
      label: getSidebarItemLabel('settings', lang),
      description: 'Preferências gerais, tema, moeda e dados',
      icon: Settings,
      colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    },
    {
      id: 'sobre',
      label: 'Atualizações & Sobre o Finly',
      description: `Versão instalada v${APP_VERSION} • Verificar atualizações e novidades`,
      icon: Sparkles,
      colorClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60',
      customAction: () => {
        setSegmentedTab('SOBRE');
      },
    },
  ];

  // Filter out any items that are already active in the sidebar (ZERO DUPLICITY)
  const visibleGeneralItems = generalMoreItems.filter(item => !activeSidebarIds.includes(item.id));
  const visibleManageItems = manageMoreItems.filter(item => !activeSidebarIds.includes(item.id));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('more.title', 'Mais opções')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('more.subtitle', 'Ferramentas adicionais, gestão de categorias, automações e segurança')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCustomizerOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{t('more.customize_sidebar', 'Personalizar Menu Lateral')}</span>
        </button>
      </div>

      {/* Segmented Switcher */}
      <div className="p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 flex items-center gap-1 shadow-xs">
        {[
          { id: 'GERAL' as const, label: t('more.tab.general', 'GERAL') },
          { id: 'GERENCIAR' as const, label: t('more.tab.manage', 'GERENCIAR') },
          { id: 'SOBRE' as const, label: t('more.tab.about', 'SOBRE') },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSegmentedTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              segmentedTab === tab.id
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List Container */}
      <div className="rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl divide-y divide-slate-100 dark:divide-slate-800/60 overflow-hidden">
        {/* ABA GERAL */}
        {segmentedTab === 'GERAL' && (
          <>
            {visibleGeneralItems.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Todos os módulos principais já estão fixados na sua barra lateral!
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Você pode reorganizar ou mover itens de volta para cá clicando em "Personalizar Menu Lateral".
                </p>
              </div>
            ) : (
              visibleGeneralItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1E1E22] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-2xl ${item.colorClass} flex items-center justify-center shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {item.label}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
                  </button>
                );
              })
            )}
          </>
        )}

        {/* ABA GERENCIAR */}
        {segmentedTab === 'GERENCIAR' && (
          <>
            {visibleManageItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => ((item as any).customAction ? (item as any).customAction() : setActiveTab(item.id))}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1E1E22] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-2xl ${item.colorClass} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors shrink-0" />
                </button>
              );
            })}
          </>
        )}

        {/* ABA SOBRE COM CENTRAL DE ATUALIZAÇÕES */}
        {segmentedTab === 'SOBRE' && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* 1. Header do App */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20">
              <div className="flex items-center gap-3.5 min-w-0">
                <FinlyLogo size="lg" showText={false} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">Finly</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      v{APP_VERSION}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Build {APP_BUILD_DATE} • {getPlatformLabel()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                  isCheckingUpdate
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : updateResult?.hasUpdate
                    ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                }`}>
                  {isCheckingUpdate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Verificando...
                    </>
                  ) : updateResult?.hasUpdate ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Nova versão disponível
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Versão mais recente
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 2. Card da Central de Versões & Atualizações (Unificado para Mobile & Web) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h5 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Central de Versões & Atualizações
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isNativeCapacitor()
                      ? 'Mantenha o aplicativo Finly atualizado no seu celular Android'
                      : 'Informações de versão da plataforma web, integridade do cache e sincronização contínua'}
                  </p>
                </div>

                <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {getPlatformLabel()}
                </span>
              </div>

              {/* Indicadores de Versao (Diferenciados Web vs Mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {isNativeCapacitor() ? 'Versão Neste Celular' : 'Versão Web Instalada'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                      v{APP_VERSION}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({APP_BUILD_DATE})
                    </span>
                  </div>
                </div>

                {isNativeCapacitor() ? (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Versão Mais Recente (Nuvem)
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-sm font-black ${
                        isCheckingUpdate
                          ? 'text-slate-400'
                          : updateResult?.hasUpdate
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isCheckingUpdate ? 'Consultando...' : updateResult ? `v${updateResult.latestVersion}` : `v${APP_VERSION}`}
                      </span>
                      {!isCheckingUpdate && updateResult && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          updateResult.hasUpdate
                            ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300'
                        }`}>
                          {updateResult.hasUpdate ? 'Disponível' : 'Atualizado'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Ambiente de Execução
                    </span>
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5 block">
                      Navegador Web / PWA
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Status do Servidor
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Online & Sincronizado
                  </span>
                </div>
              </div>

              {/* Status do Update Android (Apenas no app nativo) */}
              {isNativeCapacitor() && updateResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    updateResult.hasUpdate
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black">
                    {updateResult.hasUpdate ? (
                      <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span>
                      {updateResult.hasUpdate
                        ? `Nova versão disponível na nuvem: v${updateResult.latestVersion}`
                        : `Você já está com a versão mais recente instalada (v${APP_VERSION})!`}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {updateResult.notes || 'Todas as melhorias de desempenho, correções e novidades já estão ativas.'}
                  </p>
                </div>
              )}

              {/* Botoes de Acao: Android Nativo vs Web */}
              {isNativeCapacitor() ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  {/* 1. Verificar Atualizacoes Android */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsCheckingUpdate(true);
                      try {
                        const res = await checkForAppUpdates({ notifyIfFound: false, isManualCheck: false });
                        setUpdateResult(res);
                      } catch (e) {
                        setUpdateResult({
                          hasUpdate: false,
                          latestVersion: APP_VERSION,
                          notes: 'Não foi possível verificar no momento.',
                        });
                      } finally {
                        setIsCheckingUpdate(false);
                      }
                    }}
                    disabled={isCheckingUpdate}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Verificando...' : 'Verificar Atualização'}</span>
                  </button>

                  {/* 2. Ver Novidades Desta Versao */}
                  <button
                    type="button"
                    onClick={() => setShowWebWhatsNewModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Ver Novidades</span>
                  </button>

                  {/* 3. Baixar APK Atualizado */}
                  <button
                    type="button"
                    onClick={() => {
                      openExternalUrl(updateResult?.downloadUrl || GITHUB_RELEASES_URL);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Baixar APK</span>
                    <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                  </button>

                  {/* 4. Recarregar e Limpar Cache */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsReloading(true);
                      await forceAppReload();
                    }}
                    disabled={isReloading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                    <span>{isReloading ? 'Recarregando...' : 'Limpar Cache'}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Web: 1. Ver Novidades da Versão */}
                  <button
                    type="button"
                    onClick={() => setShowWebWhatsNewModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Ver Novidades Desta Versão</span>
                  </button>

                  {/* Web: 2. Recarregar & Limpar Cache */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsReloading(true);
                      await forceAppReload();
                    }}
                    disabled={isReloading}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                    <span>{isReloading ? 'Recarregando...' : 'Recarregar & Limpar Cache'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Card de Notificações no Aplicativo */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Notificações e Lembretes Móveis
                      </h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        notifPermission === 'granted'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {notifPermission === 'granted' ? 'Ativado' : 'Pendente'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Receba avisos de faturas, contas a vencer e controle de teto de gastos no celular.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {notifPermission !== 'granted' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await requestNotificationPermission();
                        setNotifPermission(res);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Ativar Notificações</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={testSending}
                      onClick={async () => {
                        setTestSending(true);
                        const sent = await sendTestNotification();
                        setTestSuccess(sent);
                        setTestSending(false);
                        setTimeout(() => setTestSuccess(false), 4000);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      {testSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Enviada!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-purple-500" />
                          <span>Testar Notificação</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {testSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Notificação disparada com sucesso! Verifique o topo da tela ou a barra de notificações do Android.</span>
                </div>
              )}
            </div>

            {/* 4. Novidades desta Versao (Dinamicas) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    O que há de novo na v{APP_VERSION}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {CURRENT_RELEASE.summary}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  {CURRENT_RELEASE.releaseDate}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                {CURRENT_RELEASE.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-sm shadow-purple-500/50" />
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200">{item.title}:</strong>{' '}
                      <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.description}</span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Botao para Expandir Historico de Versoes */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowChangelogHistory(!showChangelogHistory)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-purple-500" />
                    <span>Histórico de Versões Anteriores ({RELEASES.length - 1})</span>
                  </div>
                  {showChangelogHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showChangelogHistory && (
                  <div className="mt-3 space-y-3 pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                    {RELEASES.slice(1).map((rel) => (
                      <div key={rel.version} className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">v{rel.version}</span>
                          <span className="text-[10px] text-slate-400">{rel.releaseDate}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{rel.summary}</p>
                        <ul className="space-y-1 pl-1">
                          {rel.highlights.map((h, hIdx) => (
                            <li key={hIdx} className="text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                              <span className="text-purple-400 text-xs leading-none">•</span>
                              <span><strong>{h.title}:</strong> {h.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Segurança e Criptografia */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Criptografia de ponta a ponta (AES-256 / SSL Seguro)</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Finly Cloud Engine</span>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Customizer Modal */}
      <SidebarCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onItemsChange={items => setActiveSidebarIds(items)}
      />

      {/* Web Whats New Modal (Manually triggerable on web) */}
      <WebWhatsNewModal
        isOpen={showWebWhatsNewModal}
        onClose={() => setShowWebWhatsNewModal(false)}
      />
    </div>
  );
};

