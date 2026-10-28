import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Bell,
  Layout,
  Shield,
  Palette,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Languages,
  CreditCard,
  Clock,
  AlertTriangle,
  Target,
  Volume2,
  VolumeX,
  Send,
  Check,
  User,
  Phone,
  Key,
  LogOut,
  Download,
  Upload,
  ShieldCheck,
  Database,
  Coins,
  RefreshCw,
  Fingerprint,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Smartphone,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { SecuritySettingsSection } from './SecuritySettingsSection';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';
import { t, SupportedLanguage } from '../../utils/i18n';
import { applyTheme, ThemePreset, CardRadius, PRESET_COLORS } from '../../utils/themeEngine';
import {
  getStoredNotificationPrefs,
  saveNotificationPrefs,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  NotificationPreferences,
  isNativePlatform,
} from '../../utils/notificationEngine';
import { syncNativeWidget } from '../../utils/widgetBridge';
import { getCurrentMonth } from '../../utils/formatters';
import { isIncludedInPersonalAnalytics } from '../../utils/transactionImpact';
import {
  getInstalledApkVersion,
  isNewerVersion,
  openExternalUrl,
  APP_VERSION,
} from '../../utils/appUpdateService';

export const SettingsPage: React.FC = () => {
  const {
    user,
    updateUser,
    exportBackupJSON,
    importBackupJSON,
    rollbackLastBackup,
    hasRollbackSnapshot,
    resetToCleanState,
    clearAppCache,
    resetAllUserData,
    toggleHideValues,
    transactions,
    metrics,
  } = useFinancial();
  const { currentUser, updateUserAccount, deleteUserAccount, logout } = useAuth();
  const { confirm } = useConfirm();

  const [searchQuery, setSearchQuery] = useState('');
  const [hasRollback, setHasRollback] = useState(false);

  const [successMsg, setSuccessMsg] = useState(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [cacheClearedSuccess, setCacheClearedSuccess] = useState(false);
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetSuccessAlert, setResetSuccessAlert] = useState(false);

  // Delete account modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!currentUser || currentUser.id === 'usr-demo-financeiro') return;
    if (deleteConfirmationInput.trim().toUpperCase() !== 'EXCLUIR') return;

    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await deleteUserAccount(currentUser.id);
      if (!res.success) {
        setDeleteError(res.message || 'Erro ao excluir a conta.');
        setIsDeletingAccount(false);
      } else {
        setIsDeleteModalOpen(false);
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Erro inesperado.');
      setIsDeletingAccount(false);
    }
  };

  const handleClearCache = () => {
    setCacheClearedSuccess(true);
    setTimeout(() => {
      clearAppCache();
    }, 600);
  };

  const handleConfirmResetData = async () => {
    setIsResettingData(true);
    try {
      await resetAllUserData();
      setShowResetConfirmModal(false);
      setResetConfirmationInput('');
      setResetSuccessAlert(true);
      setTimeout(() => setResetSuccessAlert(false), 5000);
    } catch (err) {
      console.error('Erro ao resetar dados:', err);
      setShowResetConfirmModal(false);
      setResetConfirmationInput('');
    } finally {
      setIsResettingData(false);
    }
  };

  // Preference fields
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>((user.language as SupportedLanguage) || 'pt-BR');
  const [selectedCurrency, setSelectedCurrency] = useState(user.currency || 'BRL');
  const [selectedThemePreset, setSelectedThemePreset] = useState<ThemePreset>((user.themePreset as ThemePreset) || 'finly-dark');
  const [selectedAccentColor, setSelectedAccentColor] = useState(user.accentColor || '#7C4DFF');
  const [selectedCardRadius, setSelectedCardRadius] = useState<CardRadius>((user.cardRadius as CardRadius) || 'rounded');

  // Notification Engine Preferences State
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(getStoredNotificationPrefs);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(getNotificationPermission);
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  // Native Widget state & synchronization
  const [installedApkVer, setInstalledApkVer] = useState<string>(APP_VERSION);
  const [isSyncingWidget, setIsSyncingWidget] = useState(false);
  const [widgetSyncSuccess, setWidgetSyncSuccess] = useState(false);

  useEffect(() => {
    if (isNativePlatform()) {
      getInstalledApkVersion().then(setInstalledApkVer).catch(() => {});
    }
  }, []);

  const handleSyncWidgetNow = async () => {
    setIsSyncingWidget(true);
    try {
      const curMonth = getCurrentMonth();
      const currentMonthExpenses = transactions
        .filter(t => t.type === 'expense' && t.status === 'completed' && t.date.startsWith(curMonth) && isIncludedInPersonalAnalytics(t))
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingCount = transactions.filter(
        t => t.type === 'expense' && t.status === 'pending' && !t.ignored
      ).length;

      const [y, m] = curMonth.split('-').map(Number);
      const dateForMonth = new Date(y, m - 1, 1);
      const monthLabel = dateForMonth.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      await syncNativeWidget({
        balance: metrics.totalBalance,
        monthlyExpenses: currentMonthExpenses,
        pendingBillsCount: pendingCount,
        monthName: monthLabel,
        currency: user.currency || 'BRL',
      });

      setWidgetSyncSuccess(true);
      setTimeout(() => setWidgetSyncSuccess(false), 4000);
    } catch (err) {
      console.error('Erro ao sincronizar widget:', err);
    } finally {
      setIsSyncingWidget(false);
    }
  };

  // Account details state
  const [name, setName] = useState(currentUser?.name || user.name || '');
  const [email, setEmail] = useState(currentUser?.email || user.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || user.phone || '');
  const [accountAlert, setAccountAlert] = useState<string | null>(null);

  // Backup file ref & message
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupAlert, setBackupAlert] = useState<string | null>(null);

  // Load saved settings

  // Sync profile when currentUser loads
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Instant live preview on clicking theme preset
  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedThemePreset(preset);
    let defAccent = PRESET_COLORS[preset]?.defaultAccent || selectedAccentColor;
    let targetMode: 'dark' | 'light' = preset === 'clean-light' ? 'light' : 'dark';

    if (preset === 'linear-mono') {
      targetMode = user.theme === 'light' ? 'light' : 'dark';
      defAccent = targetMode === 'dark' ? '#FFFFFF' : '#18181B';
    }

    setSelectedAccentColor(defAccent);
    applyTheme({ preset, accentColor: defAccent, cardRadius: selectedCardRadius, mode: targetMode });
    updateUser({ themePreset: preset, accentColor: defAccent, theme: targetMode });
  };

  // Instant live preview on clicking accent color
  const handleSelectAccent = (color: string) => {
    setSelectedAccentColor(color);
    applyTheme({ preset: selectedThemePreset, accentColor: color, cardRadius: selectedCardRadius });
    updateUser({ accentColor: color });
  };

  // Instant live preview on clicking card radius
  const handleSelectRadius = (radius: CardRadius) => {
    setSelectedCardRadius(radius);
    applyTheme({ preset: selectedThemePreset, accentColor: selectedAccentColor, cardRadius: radius });
    updateUser({ cardRadius: radius });
  };

  const handleSaveAll = () => {
    const targetTheme: 'light' | 'dark' = selectedThemePreset === 'clean-light'
      ? 'light'
      : (selectedThemePreset === 'linear-mono' ? (user.theme === 'light' ? 'light' : 'dark') : 'dark');

    applyTheme({
      preset: selectedThemePreset,
      accentColor: selectedAccentColor,
      cardRadius: selectedCardRadius,
      mode: targetTheme,
    });

    updateUser({
      name,
      email,
      phone,
      language: selectedLang,
      currency: selectedCurrency,
      theme: targetTheme,
      themePreset: selectedThemePreset,
      accentColor: selectedAccentColor,
      cardRadius: selectedCardRadius,
    });

    updateUserAccount({ name, email, phone });

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone });
    updateUserAccount({ name, email, phone });
    setAccountAlert('Dados cadastrais atualizados com sucesso!');
    setTimeout(() => setAccountAlert(null), 4000);
  };

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Encerrar Sessão',
      message: 'Deseja realmente sair da sua conta no Finly?',
      confirmText: 'Sair da Conta',
      type: 'danger',
    });
    if (ok) {
      logout();
    }
  };

  useEffect(() => {
    setHasRollback(hasRollbackSnapshot());
  }, [hasRollbackSnapshot]);

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const res = importBackupJSON(event.target.result as string);
          if (res.success) {
            const countStr = res.counts?.transactions ? ` (${res.counts.transactions} transações, ${res.counts.accounts || 0} contas)` : '';
            setBackupAlert(`Backup restaurado com sucesso!${countStr}`);
            setHasRollback(hasRollbackSnapshot());
          } else {
            setBackupAlert(`Erro: ${res.error || 'Arquivo de backup inválido.'}`);
          }
          setTimeout(() => setBackupAlert(null), 5000);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRollbackBackup = async () => {
    const ok = await confirm({
      title: 'Desfazer Última Restauração',
      message: 'Deseja realmente reverter os dados para o estado imediatamente anterior ao último backup importado?',
      confirmText: 'Reverter Agora',
      type: 'warning',
    });
    if (!ok) return;

    const res = rollbackLastBackup();
    if (res.success) {
      setBackupAlert(res.message || 'Dados restaurados com sucesso para o estado anterior!');
      setHasRollback(hasRollbackSnapshot());
    } else {
      setBackupAlert(`Erro: ${res.message || 'Não foi possível reverter o backup.'}`);
    }
    setTimeout(() => setBackupAlert(null), 5000);
  };

  const accentOptions = [
    { color: '#FF8A00', label: 'Âmbar Sleek' },
    { color: '#06B6D4', label: 'Ciano Neon' },
    { color: '#00FF88', label: 'Verde Tech' },
    { color: '#D4AF37', label: 'Ouro Champanhe' },
    { color: '#7C4DFF', label: 'Púrpura / Indigo' },
    { color: '#00A884', label: 'Verde Esmeralda' },
    { color: '#0091FF', label: 'Azul Elétrico' },
    { color: '#EC4899', label: 'Rosa Neon' },
  ];

  const themePresets = [
    { id: 'sleek-obsidian', label: 'Sleek Obsidian', desc: 'Preto nobre #07080A e Âmbar Elétrico', bg: 'bg-[#07080A]' },
    { id: 'sleek-neo-glass', label: 'Sleek Neo-Glass', desc: 'Vidro translúcido espacial e Ciano', bg: 'bg-[#080B14]' },
    { id: 'tech-green', label: 'Tech Green', desc: 'Preto fosco #0A0D0C e Esmeralda Neon', bg: 'bg-[#0A0D0C]' },
    { id: 'swiss-navy', label: 'Swiss Luxury', desc: 'Azul marinho nobre e Ouro Champanhe', bg: 'bg-[#071026]' },
    { id: 'linear-mono', label: 'Linear Mono', desc: 'Preto absoluto e alto contraste puro', bg: 'bg-black' },
    { id: 'finly-dark', label: 'Finly Dark', desc: 'Preto suave padrão e cartões #2C2C2E', bg: 'bg-[#1C1C1E]' },
    { id: 'midnight-oled', label: 'Midnight OLED', desc: 'Preto absoluto para economia máxima', bg: 'bg-black' },
    { id: 'clean-light', label: 'Clean Light', desc: 'Branco puro e minimalista', bg: 'bg-slate-100' },
  ];

  const q = searchQuery.toLowerCase().trim();
  const showLang = !q || 'idioma language moeda currency real dolar euro privacidade privacy ocultar saldos'.includes(q);
  const showAppearance = !q || 'aparencia appearance tema theme presets cores accent destaque arredondamento radius squircle'.includes(q);
  const showNotif = !q || 'notificacoes notifications central alertas faturas contas orcamento budget metas digest horario chime som'.includes(q);
  const showDashboard = !q || 'dashboard painel customizar cards visao geral'.includes(q);
  const showWidget = !q || 'widget tela inicial android celular atalho saldo resumo'.includes(q);

  const showAccount = !q || 'conta account titular nome name email phone telefone dados cadastrais login'.includes(q);
  const showSecurity = !q || 'segurança security senha password pin biometria fingerprint bloqueio lock inatividade'.includes(q);
  const showBackup = !q || 'backup restaurar exportar json snapshot reverter desfazer cópia'.includes(q);
  const showSystem = !q || 'dados data sistema system cache limpar reset apagar excluir conta delete'.includes(q);
  const showSession = !q || 'sessao session sair logout encerrar'.includes(q);

  const hasAnyMatch = showLang || showAppearance || showNotif || showDashboard || showWidget || showAccount || showSecurity || showBackup || showSystem || showSession;
  const showCol1 = showLang || showAppearance || showNotif || showDashboard || showWidget;
  const showCol2 = showAccount || showSecurity || showBackup || showSystem || showSession;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in pb-20">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>{t('settings.title', selectedLang)}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.subtitle', selectedLang)}
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          {t('settings.save', selectedLang)}
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{t('settings.saved', selectedLang)}</span>
        </div>
      )}

      {/* Quick Search Bar (C-02) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar nas configurações (idioma, moeda, privacidade, temas, notificações, cards, segurança, backup, cache...)"
          className="w-full pl-11 pr-20 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#2C2C2E] text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {!hasAnyMatch ? (
        <div className="p-8 sm:p-12 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3 shadow-xs animate-in fade-in">
          <Sliders className="w-10 h-10 text-purple-600 dark:text-purple-400 mx-auto" />
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Nenhuma configuração encontrada</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Não encontramos resultados para "{searchQuery}". Tente outro termo ou limpe a busca para visualizar todas as opções.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-2"
          >
            <span>Limpar Busca</span>
          </button>
        </div>
      ) : (
        /* TWO-COLUMN LAYOUT */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ========================================================================= */}
          {/* COLUNA 1: PREFERÊNCIAS (IDIOMA -> APARÊNCIA -> NOTIFICAÇÕES -> DASHBOARD) */}
          {/* ========================================================================= */}
          {showCol1 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Preferências
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Personalização do Sistema</span>
              </div>

              {/* 1. IDIOMA & MOEDA */}
              {showLang && (
                <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  1. {t('settings.lang.title', selectedLang)} & Moeda
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('settings.lang.desc', selectedLang)}
                </p>
              </div>
            </div>

            {/* Language Segmented Buttons */}
            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800/80">
              {[
                { id: 'pt-BR', flag: '🇧🇷', label: 'Português' },
                { id: 'en-US', flag: '🇺🇸', label: 'English' },
                { id: 'es-ES', flag: '🇪🇸', label: 'Español' },
              ].map(lang => {
                const isSelected = selectedLang === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang.id as SupportedLanguage);
                      updateUser({ language: lang.id as SupportedLanguage });
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#2C2C2E] text-purple-600 dark:text-purple-400 shadow-sm border border-purple-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span className="truncate">{lang.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Currency Selector */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Moeda Principal</span>
                  <span className="text-[10px] text-slate-400">Padrão monetário da sua carteira</span>
                </div>
              </div>
              <select
                value={selectedCurrency}
                onChange={e => {
                  setSelectedCurrency(e.target.value);
                  updateUser({ currency: e.target.value });
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="BRL">R$ Real (BRL)</option>
                <option value="USD">$ Dólar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
              </select>
            </div>

            {/* Privacy Mode Toggle (C-04) */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {user.showValues ? (
                  <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-amber-500" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Modo Privacidade (Ocultar Saldos)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {user.showValues
                      ? 'Saldos e valores exibidos normalmente'
                      : 'Valores monetários mascarados com asteriscos em todo o app'}
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!user.showValues}
                  onChange={toggleHideValues}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* 2. APARÊNCIA & TEMAS */}
        {showAppearance && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  2. {t('settings.tab.appearance', selectedLang)}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Temas, cores de destaque e geometria dos cards
                </p>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('settings.theme.title', selectedLang)}
              </span>
              <div className="grid grid-cols-2 gap-3">
                {themePresets.map(tp => (
                  <div
                    key={tp.id}
                    onClick={() => handleSelectPreset(tp.id as any)}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all space-y-1.5 ${
                      selectedThemePreset === tp.id
                        ? 'border-purple-600 ring-2 ring-purple-600/30 bg-purple-50/20 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-full h-8 rounded-lg ${tp.bg} border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-[10px]`} />
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">{tp.label}</h5>
                      <p className="text-[10px] text-slate-400 truncate">{tp.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Accent Colors */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t('settings.accent.title', selectedLang)}
                </span>
                <span className="text-[10px] text-slate-400">Prévia instantânea</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {accentOptions.map(opt => (
                  <button
                    key={opt.color}
                    type="button"
                    onClick={() => handleSelectAccent(opt.color)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedAccentColor.toLowerCase() === opt.color.toLowerCase()
                        ? 'border-purple-600 ring-2 ring-purple-600/30 shadow-xs bg-purple-50/20 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Corner Radius */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('settings.radius.title', selectedLang)}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'squircle', label: 'Sleek Squircle', desc: '36px (Sleek Design)' },
                  { id: 'rounded', label: 'Ultra-Redondo', desc: '25px (Finly Padrão)' },
                  { id: 'medium', label: 'Moderno', desc: '16px suave' },
                  { id: 'sharp', label: 'Reto', desc: '8px sóbrio' },
                ].map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleSelectRadius(r.id as any)}
                    className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      selectedCardRadius === r.id
                        ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20 ring-2 ring-purple-600/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-white block">{r.label}</span>
                    <span className="text-[10px] text-slate-400">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. NOTIFICAÇÕES & ALERTAS */}
        {showNotif && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    3. Central de Notificações
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Avisos de faturas, contas a vencer e orçamentos
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifPrefs.enabled}
                  onChange={e => {
                    const next = saveNotificationPrefs({ enabled: e.target.checked });
                    setNotifPrefs(next);
                  }}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Permission status card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    notifPermission === 'granted'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : notifPermission === 'denied'
                      ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }`}>
                    {isNativePlatform()
                      ? (notifPermission === 'granted' ? 'Alarmes Nativos Ativos' : notifPermission === 'denied' ? 'Bloqueado no Sistema' : 'Pendente')
                      : (notifPermission === 'granted' ? 'Ativo no Navegador' : notifPermission === 'denied' ? 'Bloqueado' : 'Pendente')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {isNativePlatform()
                    ? 'Disparos nativos em segundo plano (AlarmManager)'
                    : 'Disparos inteligentes para Web e Mobile'}
                </p>
              </div>

              {notifPermission !== 'granted' ? (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await requestNotificationPermission();
                    setNotifPermission(res);
                    if (res === 'granted') {
                      setNotifPrefs(prev => saveNotificationPrefs({ ...prev, enabled: true }));
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                >
                  Permitir
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
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-purple-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-xs"
                >
                  {testSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Enviada!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Testar</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Granular switches */}
            <div className={`space-y-3 pt-1 text-xs transition-opacity ${notifPrefs.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* Faturas de Cartão */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Faturas de Cartão de Crédito</span>
                  <span className="text-[10px] text-slate-400">Lembrete de vencimento e fechamento</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={String(notifPrefs.dueDaysAhead)}
                    onChange={e => {
                      const next = saveNotificationPrefs({ dueDaysAhead: parseInt(e.target.value) || 3 });
                      setNotifPrefs(next);
                    }}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold"
                  >
                    <option value="0">No vencimento</option>
                    <option value="1">1 dia antes</option>
                    <option value="3">3 dias antes</option>
                    <option value="5">5 dias antes</option>
                  </select>
                  <input
                    type="checkbox"
                    checked={notifPrefs.cardInvoices}
                    onChange={e => setNotifPrefs(saveNotificationPrefs({ cardInvoices: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                  />
                </div>
              </div>

              {/* Contas Pendentes */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Contas e Despesas Pendentes</span>
                  <span className="text-[10px] text-slate-400">Avisos de boletos e despesas fixas a vencer</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.pendingBills}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ pendingBills: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* Orçamento 80% */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Alerta Preventivo de Orçamento (80%)</span>
                  <span className="text-[10px] text-slate-400">Aviso quando atingir 80% do teto planejado</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.budget80}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ budget80: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* Estouro 100% */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Estouro de Orçamento (100%)</span>
                  <span className="text-[10px] text-slate-400">Aviso imediato ao exceder o teto estipulado</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.budget100}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ budget100: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* Progresso de Metas & Objetivos (C-05) */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Metas e Objetivos</span>
                  <span className="text-[10px] text-slate-400">Lembretes de progresso e ritmo de economia</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.goalsProgress}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ goalsProgress: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* Resumo Diário da Carteira (C-05) */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Resumo Diário da Carteira</span>
                  <span className="text-[10px] text-slate-400">Notificação diária consolidada com saldo e despesas</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.dailyDigest}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ dailyDigest: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* Horário de Notificação (C-05) */}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Horário Preferencial dos Alertas</span>
                    <span className="text-[10px] text-slate-400">Momento do dia para verificação e avisos diários</span>
                  </div>
                </div>
                <input
                  type="time"
                  value={notifPrefs.notifyTime || '09:00'}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ notifyTime: e.target.value || '09:00' }))}
                  className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Som Suave */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  {notifPrefs.sound ? <Volume2 className="w-4 h-4 text-purple-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Efeito Sonoro Suave (Chime)</span>
                    <span className="text-[10px] text-slate-400">Tocar som harmônico ao disparar</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifPrefs.sound}
                  onChange={e => setNotifPrefs(saveNotificationPrefs({ sound: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* Dica Android: Funcionamento com App Fechado & Otimização de Bateria */}
              {isNativePlatform() && (
                <div className="mt-3 p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-400">
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>Funcionamento com App Fechado</span>
                  </div>
                  <p className="leading-relaxed text-[10px] text-slate-500 dark:text-slate-400">
                    Os alarmes do Finly são registrados diretamente no sistema Android. Para evitar que o sistema encerre o agendador em repouso profundo (Doze Mode), recomendamos definir o uso de bateria do Finly como <strong>Sem Restrições</strong> nas configurações do seu celular.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. DASHBOARD CARDS & WIDGETS (C-03) */}
        {showDashboard && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    4. Personalização do Dashboard
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gerencie a visibilidade e a ordem dos cards na Visão Geral
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                O Finly conta com um painel dinâmico e interativo diretamente na Visão Geral.
                Lá você pode reordenar por arrastar e soltar, ocultar ou reativar qualquer card (calendário, orçamentos, balanços, cartões e mais) em tempo real.
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                  Gerenciador V5 Integrado
                </span>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('finly_open_dashboard_customizer'));
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-2"
                >
                  <Layout className="w-4 h-4" />
                  <span>Abrir Gerenciador de Cards</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. WIDGET DA TELA INICIAL (ANDROID) */}
        {showWidget && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      5. Widget da Tela Inicial (Android)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                      Nativo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Acompanhe seu saldo em contas, despesas do mês e crie despesas com 1 toque
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
              {/* Instruções de uso */}
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                  Como adicionar o widget no seu celular:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Vá para a tela inicial do seu celular Android.</li>
                  <li>Mantenha pressionado qualquer espaço vazio da tela.</li>
                  <li>No menu que surgir, toque em <strong>Widgets</strong>.</li>
                  <li>Role a lista até encontrar <strong>Finly</strong> e selecione o card <strong>Finly - Resumo Financeiro</strong>.</li>
                  <li>Posicione o widget onde desejar na tela inicial.</li>
                </ol>
              </div>

              {/* Status do APK no Android */}
              {isNativePlatform() && (
                <div>
                  {isNewerVersion('1.1.81', installedApkVer) ? (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Instalação do APK v1.1.81 Necessária</span>
                      </div>
                      <p className="text-amber-700 dark:text-amber-300 leading-relaxed text-[10px]">
                        Seu app recebeu a atualização interna via OTA, mas o APK físico instalado no seu celular é a versão <strong>v{installedApkVer}</strong>. Como widgets exigem arquivos nativos do sistema Android, eles só aparecem na lista de widgets do celular após instalar o arquivo APK baixado.
                      </p>
                      <button
                        type="button"
                        onClick={() => openExternalUrl(`https://github.com/LivertonAguiar/Finly/releases/download/v${APP_VERSION}/finly-v${APP_VERSION}.apk`)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar APK v{APP_VERSION}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                          APK v{installedApkVer} instalado (suporte nativo ativo)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSyncWidgetNow}
                        disabled={isSyncingWidget}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncingWidget ? 'animate-spin' : ''}`} />
                        <span>{widgetSyncSuccess ? 'Sincronizado!' : isSyncingWidget ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isNativePlatform() && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Você está no navegador. Os widgets nativos da tela inicial funcionam exclusivamente no app Android (APK).</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* ========================================================================= */}
    {/* COLUNA 2: SEGURANÇA E LOGIN (SEPARADO) */}
    {/* ========================================================================= */}
    {showCol2 && (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Segurança & Login
            </h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Proteção Ativa</span>
        </div>

        {/* 1. DADOS CADASTRAIS & LOGIN */}
        {showAccount && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Dados da Conta e Login
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Identificação do titular e credenciais de acesso
                </p>
              </div>
            </div>

            {accountAlert && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{accountAlert}</span>
              </div>
            )}

            <form onSubmit={handleSaveAccount} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Titular
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E-mail de Login
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Salvar Dados Cadastrais
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. SEGURANÇA AVANÇADA (SENHA, PIN PBKDF2 & BIOMETRIA UNIFICADA) */}
        {showSecurity && (
          <SecuritySettingsSection />
        )}

        {/* 3. CÓPIAS DE SEGURANÇA & DADOS */}
        {showBackup && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Backup e Restauração de Dados
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Exporte cópias dos seus registros financeiros ou restaure um arquivo
                </p>
              </div>
            </div>

            {backupAlert && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{backupAlert}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={exportBackupJSON}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer group shadow-xs active:scale-95"
              >
                <Download className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Exportar Backup</span>
                <span className="text-[10px] text-slate-400">Download em .JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 bg-slate-50 dark:bg-slate-800/60 text-left transition-all cursor-pointer group shadow-xs active:scale-95"
              >
                <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
                <span className="text-xs font-bold text-slate-900 dark:text-white block">Restaurar Backup</span>
                <span className="text-[10px] text-slate-400">Carregar arquivo .JSON</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestoreFile}
                accept=".json"
                className="hidden"
              />
            </div>

            {hasRollback && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block truncate">
                    Ponto de Restauração Anterior
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Snapshot automático salvo antes da última importação
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRollbackBackup}
                  className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Desfazer Importação</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. DADOS & SISTEMA */}
        {showSystem && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Dados & Sistema
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerencie o cache da aplicação e a integridade dos seus registros
                </p>
              </div>
            </div>

            {resetSuccessAlert && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Todos os dados financeiros foram limpos com sucesso no dispositivo, na nuvem e no servidor!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Limpar Cache */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Limpar Cache</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">Remove dados temporários e recarrega o app</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="px-3.5 py-1.5 text-xs font-bold bg-white dark:bg-[#222226] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {cacheClearedSuccess ? 'Limpando...' : 'Limpar'}
                </button>
              </div>

              {/* Limpar Meus Dados */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-rose-800 dark:text-rose-300">Limpar Dados Financeiros</h5>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                    Apaga transações, metas, dívidas e orçamentos para recomeçar do zero
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetConfirmationInput('');
                    setShowResetConfirmModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 ml-2"
                >
                  Limpar Dados
                </button>
              </div>

              {/* Exclusão Permanente de Conta */}
              <div className="p-4 rounded-2xl bg-rose-100/50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-rose-900 dark:text-rose-300">Excluir Conta Permanentemente</h5>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80 mt-0.5">
                    Expurga seu usuário, dados financeiros e credenciais de login de todo o banco de dados
                  </p>
                </div>
                {currentUser?.id === 'usr-demo-financeiro' ? (
                  <span className="text-[11px] font-medium text-slate-400 italic ml-2 shrink-0">
                    Conta Demo
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                      setDeleteConfirmationInput('');
                      setDeleteError(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 ml-2"
                  >
                    Excluir Conta
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. SESSÃO & LOGOUT */}
        {showSession && (
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white block">Sessão Atual</span>
              <span className="text-[11px] text-slate-400">Conectado como {user.email || 'Usuário'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 text-xs font-bold transition-all cursor-pointer border border-rose-200 dark:border-rose-900/60 active:scale-95 shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
          </div>
        )}
      </div>
    )}
  </div>
)}

      {/* Confirm Reset Data Modal */}
      <Modal
        isOpen={showResetConfirmModal}
        onClose={() => {
          if (!isResettingData) {
            setShowResetConfirmModal(false);
            setResetConfirmationInput('');
          }
        }}
        title="Confirmar Limpeza de Dados"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Atenção: Esta ação é irreversível!</span>
          </div>

          {currentUser?.id === 'usr-demo-financeiro' ? (
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 leading-relaxed">
              <span className="font-bold">Conta de Demonstração:</span> Esta ação apenas restaurará o modelo de dados original da demonstração no seu navegador local. Os dados na nuvem e de outros usuários não serão alterados.
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Você tem certeza que deseja excluir todas as suas transações, orçamentos, metas e dívidas?
                As informações serão limpas permanentemente do seu dispositivo, da nuvem e do servidor para um recomeço limpo.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Recomendação de Segurança</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Exporte uma cópia de backup antes de resetar para evitar perdas acidentais.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportBackupJSON}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-300 transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Backup</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  Digite <span className="text-rose-600 dark:text-rose-400 font-black">LIMPAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={resetConfirmationInput}
                  onChange={(e) => setResetConfirmationInput(e.target.value)}
                  placeholder="LIMPAR"
                  className="w-full px-3.5 py-2 text-xs font-mono font-bold rounded-xl border border-rose-300 dark:border-rose-900/60 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={isResettingData}
              onClick={() => {
                setShowResetConfirmModal(false);
                setResetConfirmationInput('');
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmResetData}
              disabled={
                isResettingData ||
                (currentUser?.id !== 'usr-demo-financeiro' &&
                  resetConfirmationInput.trim().toUpperCase() !== 'LIMPAR')
              }
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isResettingData ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Limpando Dados...</span>
                </>
              ) : currentUser?.id === 'usr-demo-financeiro' ? (
                <span>Restaurar Demonstração</span>
              ) : (
                <span>Confirmar Limpeza</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Exclusão de Conta */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeletingAccount) {
            setIsDeleteModalOpen(false);
            setDeleteConfirmationInput('');
            setDeleteError(null);
          }
        }}
        title="Excluir Conta Permanentemente"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-rose-800 dark:text-rose-200">Atenção: Ação Irreversível!</p>
              <p className="font-normal text-rose-700 dark:text-rose-300 text-[11px] leading-relaxed">
                Ao prosseguir, todas as informações associadas à sua conta serão expurgadas do PostgreSQL e do servidor. Não haverá como restaurá-las posteriormente.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
            <p className="font-bold text-slate-800 dark:text-slate-100">O que será permanentemente apagado:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              <li>Todas as contas bancárias e carteiras</li>
              <li>Histórico de receitas, despesas e parcelamentos</li>
              <li>Cartões de crédito, dívidas, metas e orçamentos</li>
              <li>Investimentos e patrimônio cadastrado</li>
              <li>Seu usuário e credenciais de login no sistema</li>
            </ul>
          </div>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold">
              {deleteError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
              Digite <span className="text-rose-600 dark:text-rose-400 font-black">EXCLUIR</span> para confirmar:
            </label>
            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value.toUpperCase())}
              placeholder="Digite EXCLUIR"
              disabled={isDeletingAccount}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-wider"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={isDeletingAccount}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteConfirmationInput('');
                setDeleteError(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={deleteConfirmationInput.trim() !== 'EXCLUIR' || isDeletingAccount}
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-md cursor-pointer transition-all"
            >
              {isDeletingAccount ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Excluindo Conta...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Definitivamente</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
