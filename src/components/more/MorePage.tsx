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
  LifeBuoy,
  RotateCcw,
  Lock,
  Fingerprint,
  Key,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { FinlyLogo } from '../ui/FinlyLogo';
import {
  ALL_SIDEBAR_ITEMS,
  getStoredSidebarItems,
  getSidebarItemLabel,
} from '../../utils/sidebarConfig';
import { SidebarCustomizerModal } from '../layout/SidebarCustomizerModal';
import { WebWhatsNewModal } from '../common/WebWhatsNewModal';
import { PinSetupModal } from '../common/PinSetupModal';
import { useTranslation } from '../../utils/i18n';
import { CURRENT_RELEASE, RELEASES } from '../../data/releases';
import { HELP_GUIDES, HELP_FAQS } from '../../data/helpCenterData';
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
  isSecurityLockEnabled,
  isPinConfigured,
  setSecurityLockEnabled,
  isBiometricSupported,
  isBiometricEnabled,
  setBiometricEnabled,
  getLockTimeoutMinutes,
  setLockTimeoutMinutes,
  authenticateWithBiometrics,
  getBiometricStatus,
  BiometricStatusInfo,
} from '../../utils/securityManager';

interface MorePageProps {
  setActiveTab: (tab: string) => void;
  initialSubTab?: 'GERAL' | 'SEGURANÇA' | 'SOBRE';
}

export const MorePage: React.FC<MorePageProps> = ({ setActiveTab, initialSubTab }) => {
  const { user, updateUser, exportBackupJSON } = useFinancial();
  const { currentUser, changePassword } = useAuth();
  const { lang, t } = useTranslation();
  const [segmentedTab, setSegmentedTab] = useState<'GERAL' | 'SEGURANÇA' | 'SOBRE'>(initialSubTab || 'GERAL');
  const [activeSidebarIds, setActiveSidebarIds] = useState<string[]>(getStoredSidebarItems);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Security States
  const [pinEnabled, setPinEnabled] = useState(isSecurityLockEnabled());
  const [pinConfigured, setPinConfigured] = useState(isPinConfigured());
  const [biometricEnabled, setBiometricEnabledState] = useState(isBiometricEnabled());
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatusInfo>({ supported: false, enrolled: false });
  const [lockTimeout, setLockTimeout] = useState(getLockTimeoutMinutes());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passAlert, setPassAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Update check states
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null);
  const [isReloading, setIsReloading] = useState(false);

  const [showChangelogHistory, setShowChangelogHistory] = useState(false);
  const [showWebWhatsNewModal, setShowWebWhatsNewModal] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  useEffect(() => {
    getBiometricStatus().then(status => {
      setBiometricStatus(status);
      setBiometricSupported(status.supported && status.enrolled);
      if (!status.supported || !status.enrolled) {
        setBiometricEnabledState(false);
        setBiometricEnabled(false);
      }
    });
  }, []);

  useEffect(() => {
    if (initialSubTab) {
      setSegmentedTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handleOpenSobre = () => setSegmentedTab('SOBRE');
    const handleOpenSeguranca = () => setSegmentedTab('SEGURANÇA');
    window.addEventListener('finly_open_sobre', handleOpenSobre);
    window.addEventListener('finly_open_seguranca', handleOpenSeguranca);
    return () => {
      window.removeEventListener('finly_open_sobre', handleOpenSobre);
      window.removeEventListener('finly_open_seguranca', handleOpenSeguranca);
    };
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
    window.addEventListener('finly_sidebar_changed', handleSidebarChange);
    return () => window.removeEventListener('finly_sidebar_changed', handleSidebarChange);
  }, []);

  // Security actions
  const handleTogglePin = (checked: boolean) => {
    if (checked) {
      if (!isPinConfigured()) {
        setIsPinModalOpen(true);
      } else {
        setSecurityLockEnabled(true);
        setPinEnabled(true);
      }
    } else {
      setSecurityLockEnabled(false);
      setPinEnabled(false);
    }
  };

  const handleToggleBiometric = async (checked: boolean) => {
    if (checked) {
      const success = await authenticateWithBiometrics();
      if (success) {
        setBiometricEnabled(true);
        setBiometricEnabledState(true);
      } else {
        setBiometricEnabled(false);
        setBiometricEnabledState(false);
      }
    } else {
      setBiometricEnabled(false);
      setBiometricEnabledState(false);
    }
  };

  const handleChangeTimeout = (mins: number) => {
    setLockTimeout(mins);
    setLockTimeoutMinutes(mins);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassAlert(null);

    if (!currentPass) {
      setPassAlert({ type: 'error', message: 'Informe sua senha atual.' });
      return;
    }
    if (newPass.length < 6) {
      setPassAlert({ type: 'error', message: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassAlert({ type: 'error', message: 'A nova senha e a confirmação não coincidem.' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPass, newPass);
      if (res.success) {
        setPassAlert({ type: 'success', message: res.message });
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        setPassAlert({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setPassAlert({ type: 'error', message: err.message || 'Erro ao alterar senha.' });
    } finally {
      setIsChangingPass(false);
      setTimeout(() => setPassAlert(null), 5000);
    }
  };

  // Define potential items for Geral in MorePage (Zero duplication with sidebar)
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

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">{t('more.title', 'Mais opções')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('more.subtitle', 'Ferramentas adicionais, segurança da conta e dados do sistema')}
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

      {/* Segmented Switcher - SOMENTE GERAL, SEGURANÇA E SOBRE */}
      <div className="p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 flex items-center gap-1 shadow-xs">
        {[
          { id: 'GERAL' as const, label: 'Geral', icon: SlidersHorizontal },
          { id: 'SEGURANÇA' as const, label: 'Segurança', icon: ShieldCheck },
          { id: 'SOBRE' as const, label: 'Sobre', icon: Info },
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSegmentedTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                segmentedTab === tab.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* List Container */}
      <div className="rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-hidden">
        {/* ========================================================================= */}
        {/* 1. ABA GERAL */}
        {/* ========================================================================= */}
        {segmentedTab === 'GERAL' && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ABA SEGURANÇA */}
        {/* ========================================================================= */}
        {segmentedTab === 'SEGURANÇA' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* 1. Bloqueio Biométrico e PIN */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#121215] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Bloqueio Biométrico & PIN
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Proteja a abertura do Finly com código numérico ou biometria
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={e => handleTogglePin(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded cursor-pointer accent-purple-600"
                />
              </div>

              {pinEnabled && (
                <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Código PIN de Acesso
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {pinConfigured ? 'PIN de 4 dígitos configurado' : 'Nenhum PIN definido ainda'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPinModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                    >
                      {pinConfigured ? 'Alterar PIN' : 'Definir PIN'}
                    </button>
                  </div>

                  {/* Biometria */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Desbloqueio por Biometria
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {biometricSupported
                            ? 'TouchID, FaceID ou impressão digital ativa'
                            : biometricStatus.reason || 'Sensor biométrico não disponível'}
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      disabled={!biometricSupported}
                      checked={biometricEnabled}
                      onChange={e => handleToggleBiometric(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded cursor-pointer accent-purple-600 disabled:opacity-40"
                    />
                  </div>

                  {/* Timeout */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Bloquear após inatividade
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { mins: 0, label: 'Imediato' },
                        { mins: 1, label: '1 min' },
                        { mins: 5, label: '5 min' },
                        { mins: 15, label: '15 min' },
                        { mins: 30, label: '30 min' },
                      ].map(opt => (
                        <button
                          key={opt.mins}
                          type="button"
                          onClick={() => handleChangeTimeout(opt.mins)}
                          className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                            lockTimeout === opt.mins
                              ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Alteração de Senha */}
            <div className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#121215] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Alteração de Senha
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Mantenha suas credenciais de acesso sempre seguras
                  </p>
                </div>
              </div>

              {passAlert && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                  passAlert.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                }`}>
                  {passAlert.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{passAlert.message}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Senha Atual
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={currentPass}
                      onChange={e => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181B] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      value={newPass}
                      onChange={e => setNewPass(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181B] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Confirmar Senha
                    </label>
                    <input
                      type="password"
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#18181B] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {isChangingPass ? 'Atualizando...' : 'Atualizar Senha'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ABA SOBRE */}
        {/* ========================================================================= */}
        {segmentedTab === 'SOBRE' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* 1. Header Sucinto do Finly */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <FinlyLogo size="md" showText={false} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-black text-slate-900 dark:text-white">Finly</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      v{APP_VERSION}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      ({APP_BUILD_DATE})
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{getPlatformLabel()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sincronizado
                    </span>
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
                    } catch (e) {
                      setUpdateResult({
                        hasUpdate: false,
                        latestVersion: APP_VERSION,
                        notes: 'Você já está com a versão mais recente.',
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
                  onClick={() => openExternalUrl(updateResult?.downloadUrl || `https://github.com/LivertonAguiar/Finly/releases/download/v${updateResult?.latestVersion || APP_VERSION}/finly-v${updateResult?.latestVersion || APP_VERSION}.apk` || GITHUB_RELEASES_URL)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    updateResult?.hasUpdate
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 animate-pulse'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                  title="Baixar pacote APK do aplicativo para Android"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    {updateResult?.hasUpdate
                      ? `Baixar Atualização v${updateResult.latestVersion}`
                      : `Baixar APK Android`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setIsReloading(true);
                    await forceAppReload();
                  }}
                  disabled={isReloading}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Recarregar aplicativo e limpar cache"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
                  <span>{isReloading ? 'Recarregando...' : 'Recarregar'}</span>
                </button>
              </div>
            </div>

            {/* Banner de Atualização Sutil */}
            {updateResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                updateResult.hasUpdate
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              }`}>
                <div className="flex items-center gap-2">
                  {updateResult.hasUpdate ? (
                    <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <span className="font-bold">
                    {updateResult.hasUpdate
                      ? `Nova versão disponível na nuvem: v${updateResult.latestVersion}`
                      : `Você já está utilizando a versão mais recente (v${APP_VERSION}).`}
                  </span>
                </div>
                {updateResult.hasUpdate && isNativeCapacitor() && (
                  <button
                    onClick={() => openExternalUrl(updateResult.downloadUrl || GITHUB_RELEASES_URL)}
                    className="underline font-black text-[11px] cursor-pointer"
                  >
                    Baixar APK
                  </button>
                )}
              </div>
            )}

            {/* 2. Notas da Versão */}
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

              {/* Destaques em linha única */}
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

            {/* 3. Central de Ajuda & Tutoriais */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsHelpExpanded(!isHelpExpanded)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        Central de Ajuda & Tutoriais
                      </h5>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        {HELP_GUIDES.length} Guias • FAQ
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isHelpExpanded ? 'Toque para recolher' : 'Tutoriais passo a passo, simulador interativo e perguntas frequentes'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 shrink-0 ml-2">
                  <span className="text-[11px] font-bold hidden sm:inline">
                    {isHelpExpanded ? 'Recolher' : 'Expandir'}
                  </span>
                  {isHelpExpanded ? <ChevronUp className="w-4 h-4 text-purple-600" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isHelpExpanded && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-150">
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('ajuda')}
                      className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center justify-between cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-200" />
                        <span>Abrir Central de Ajuda Completa & Simulador</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-200" />
                    </button>
                  </div>

                  {/* Guias Populares */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Principais Tutoriais Passo a Passo
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {HELP_GUIDES.slice(0, 4).map(guide => (
                        <button
                          key={guide.id}
                          type="button"
                          onClick={() => setActiveTab('ajuda')}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200/60 dark:border-slate-800 text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 line-clamp-1">
                              {guide.title}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 shrink-0 ml-1" />
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {guide.steps.length} passos • {guide.readTime}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FAQ */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Dúvidas Frequentes Rápidas
                    </span>
                    <div className="space-y-1.5">
                      {HELP_FAQS.slice(0, 3).map(faq => {
                        const isOpen = expandedFaqId === faq.id;
                        return (
                          <div
                            key={faq.id}
                            className="rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}
                              className="w-full p-2.5 flex items-center justify-between text-left text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
                            >
                              <span className="line-clamp-1 pr-2">{faq.question}</span>
                              {isOpen ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                            </button>
                            {isOpen && (
                              <p className="px-2.5 pb-2.5 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2 animate-in fade-in duration-100">
                                {faq.answer}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Rodapé */}
            <div className="flex items-center justify-center px-2 pt-1 text-[11px] text-slate-400 dark:text-slate-500">
              <span>Finly © 2026</span>
            </div>
          </div>
        )}
      </div>

      {/* Pin Setup Modal */}
      <PinSetupModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setPinConfigured(true);
          setSecurityLockEnabled(true);
          setPinEnabled(true);
        }}
      />

      {/* Sidebar Customizer Modal */}
      <SidebarCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        onItemsChange={items => setActiveSidebarIds(items)}
      />

      {/* Web Whats New Modal */}
      <WebWhatsNewModal
        isOpen={showWebWhatsNewModal}
        onClose={() => setShowWebWhatsNewModal(false)}
      />
    </div>
  );
};
