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
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { FinlyLogo } from '../ui/FinlyLogo';
import {
  ALL_SIDEBAR_ITEMS,
  getStoredSidebarItems,
  getSidebarItemLabel,
} from '../../utils/sidebarConfig';
import { SidebarCustomizerModal } from '../layout/SidebarCustomizerModal';
import { useTranslation } from '../../utils/i18n';
import {
  APP_VERSION,
  APP_BUILD_DATE,
  checkForAppUpdates,
  openExternalUrl,
  forceAppReload,
  GITHUB_RELEASES_URL,
  isNativeCapacitor,
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
            })}

            <button
              onClick={exportBackupJSON}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1E1E22] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Exportar Backup Completo
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Salvar cópia de segurança em arquivo JSON
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
            </button>
          </>
        )}

        {/* ABA SOBRE COM CENTRAL DE ATUALIZAÇÕES */}
        {segmentedTab === 'SOBRE' && (
          <div className="p-6 space-y-6">
            {/* 1. Header do App */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20">
              <div className="flex items-center gap-4">
                <FinlyLogo size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">Finly</h4>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                      v{APP_VERSION}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Build {APP_BUILD_DATE} • {isNativeCapacitor() ? 'App Android Nativo' : 'Web App / PWA'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Pronto para uso
                </span>
              </div>
            </div>

            {/* 2. Card da Central de Atualizações */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Central de Atualizações
                  </h5>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mantenha o Finly sempre atualizado com as últimas melhorias
                  </p>
                </div>
              </div>

              {/* Status do Update */}
              {updateResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    updateResult.hasUpdate
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-black">
                    {updateResult.hasUpdate ? (
                      <Sparkles className="w-4 h-4 text-purple-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span>
                      {updateResult.hasUpdate
                        ? `Nova versão disponível: v${updateResult.latestVersion}`
                        : 'Você já está na versão mais recente!'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {updateResult.notes}
                  </p>
                </div>
              )}

              {/* Botoes de Acao */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. Verificar Atualizacoes */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsCheckingUpdate(true);
                    try {
                      const res = await checkForAppUpdates();
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

                {/* 2. Baixar APK Atualizado */}
                <button
                  type="button"
                  onClick={() => {
                    openExternalUrl(updateResult?.downloadUrl || GITHUB_RELEASES_URL);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Baixar APK (Android)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 ml-auto" />
                </button>

                {/* 3. Recarregar e Limpar Cache */}
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
                  <span>{isReloading ? 'Recarregando...' : 'Limpar Cache & Recarregar'}</span>
                </button>
              </div>
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

            {/* 4. Novidades desta Versao */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-400">
                O que há de novo na v{APP_VERSION}
              </h5>

              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span><strong>Gesto Puxe para Atualizar:</strong> Arraste do topo da tela para baixo para sincronizar instantaneamente seus saldos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span><strong>Modo Tela Cheia Imersivo:</strong> Experiência nativa em tela cheia no Android sem barras cortando a interface.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span><strong>Conta Demonstração Otimizada:</strong> Carregamento imediato com transações, contas e metas realistas completas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                  <span><strong>Central de Atualizações:</strong> Baixe novas versões e limpe o cache do app direto pela aba Sobre.</span>
                </li>
              </ul>
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
    </div>
  );
};

