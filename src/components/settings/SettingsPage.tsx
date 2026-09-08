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
} from 'lucide-react';
import { PinSetupModal } from '../common/PinSetupModal';
import {
  isSecurityLockEnabled,
  isPinConfigured,
  setSecurityLockEnabled,
  removePinCode,
  isBiometricSupported,
  isBiometricEnabled,
  setBiometricEnabled,
  getLockTimeoutMinutes,
  setLockTimeoutMinutes,
  authenticateWithBiometrics,
  getBiometricStatus,
  BiometricStatusInfo,
} from '../../utils/securityManager';
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
} from '../../utils/notificationEngine';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, exportBackupJSON, importBackupJSON, resetToCleanState } = useFinancial();
  const { currentUser, updateUserAccount, logout, changePassword } = useAuth();
  const { confirm } = useConfirm();

  const [successMsg, setSuccessMsg] = useState(false);

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

  // Dashboard 15 Widgets Switches
  const [dashLeftWidgets, setDashLeftWidgets] = useState({
    expensesDonut: true,
    spendingFrequency: true,
    monthlyBalance: true,
    pendingTransactions: true,
    budgetSummary: true,
    favoriteTransactions: false,
    movementCalendar: true,
    myAccounts: true,
  });

  const [dashRightWidgets, setDashRightWidgets] = useState({
    incomesDonut: true,
    semiannualBalance: true,
    quarterlyBalance: false,
    creditCardInfo: true,
    goalsProgress: true,
    monthSavings: true,
    userProfile: true,
  });

  // Account details state
  const [name, setName] = useState(currentUser?.name || user.name || '');
  const [email, setEmail] = useState(currentUser?.email || user.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || user.phone || '');
  const [accountAlert, setAccountAlert] = useState<string | null>(null);

  // Password change states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passAlert, setPassAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Backup file ref & message
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupAlert, setBackupAlert] = useState<string | null>(null);

  // Security PIN & Biometrics
  const [pinEnabled, setPinEnabled] = useState(isSecurityLockEnabled());
  const [pinConfigured, setPinConfigured] = useState(isPinConfigured());
  const [biometricEnabled, setBiometricEnabledState] = useState(isBiometricEnabled());
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatusInfo>({ supported: false, enrolled: false });
  const [lockTimeout, setLockTimeout] = useState(getLockTimeoutMinutes());
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

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

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('finly_dash_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.left) setDashLeftWidgets(parsed.left);
        if (parsed.right) setDashRightWidgets(parsed.right);
      }
    } catch (e) {}
  }, []);

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

    localStorage.setItem(
      'finly_dash_widgets',
      JSON.stringify({ left: dashLeftWidgets, right: dashRightWidgets })
    );

    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleResetDashboardDefaults = () => {
    setDashLeftWidgets({
      expensesDonut: true,
      spendingFrequency: true,
      monthlyBalance: true,
      pendingTransactions: true,
      budgetSummary: true,
      favoriteTransactions: false,
      movementCalendar: true,
      myAccounts: true,
    });
    setDashRightWidgets({
      incomesDonut: true,
      semiannualBalance: true,
      quarterlyBalance: false,
      creditCardInfo: true,
      goalsProgress: true,
      monthSavings: true,
      userProfile: true,
    });
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, email, phone });
    updateUserAccount({ name, email, phone });
    setAccountAlert('Dados cadastrais atualizados com sucesso!');
    setTimeout(() => setAccountAlert(null), 4000);
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

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const success = importBackupJSON(event.target.result as string);
          if (success) {
            setBackupAlert('Backup restaurado com sucesso! Dados atualizados.');
          } else {
            setBackupAlert('Erro: Arquivo de backup inválido.');
          }
          setTimeout(() => setBackupAlert(null), 4000);
        }
      };
      reader.readAsText(file);
    }
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

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================================= */}
        {/* COLUNA 1: PREFERÊNCIAS (IDIOMA -> APARÊNCIA -> NOTIFICAÇÕES -> DASHBOARD) */}
        {/* ========================================================================= */}
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
          </div>

          {/* 2. APARÊNCIA & TEMAS */}
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

          {/* 3. NOTIFICAÇÕES & ALERTAS */}
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
                    {notifPermission === 'granted' ? 'Ativo no Navegador' : notifPermission === 'denied' ? 'Bloqueado' : 'Pendente'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  Disparos inteligentes para Web e Mobile
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
            </div>
          </div>

          {/* 4. DASHBOARD WIDGETS */}
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    4. Widgets do Dashboard
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ative ou desative os 15 widgets da visão geral
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetDashboardDefaults}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer shadow-xs active:scale-95"
                title="Restaurar widgets padrão"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Padrão</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Coluna Esquerda */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Coluna Esquerda (8)
                </span>
                <div className="space-y-1.5">
                  {[
                    { key: 'expensesDonut', label: 'Despesas por categoria' },
                    { key: 'spendingFrequency', label: 'Frequência de gastos (Score)' },
                    { key: 'monthlyBalance', label: 'Balanço mensal' },
                    { key: 'pendingTransactions', label: 'Transações pendentes' },
                    { key: 'budgetSummary', label: 'Resumo do orçamento' },
                    { key: 'favoriteTransactions', label: 'Transações favoritas' },
                    { key: 'movementCalendar', label: 'Calendário mensal' },
                    { key: 'myAccounts', label: 'Minhas contas' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <span className="truncate pr-2">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={(dashLeftWidgets as any)[item.key]}
                        onChange={e => setDashLeftWidgets(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* Coluna Direita */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Coluna Direita (7)
                </span>
                <div className="space-y-1.5">
                  {[
                    { key: 'incomesDonut', label: 'Receitas por categoria' },
                    { key: 'semiannualBalance', label: 'Balanço semestral' },
                    { key: 'quarterlyBalance', label: 'Balanço trimestral' },
                    { key: 'creditCardInfo', label: 'Cartões de crédito' },
                    { key: 'goalsProgress', label: 'Objetivos e metas' },
                    { key: 'monthSavings', label: 'Economia no mês' },
                    { key: 'userProfile', label: 'Card de perfil' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between py-1 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <span className="truncate pr-2">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={(dashRightWidgets as any)[item.key]}
                        onChange={e => setDashRightWidgets(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUNA 2: SEGURANÇA E LOGIN (SEPARADO) */}
        {/* ========================================================================= */}
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

          {/* 2. ALTERAÇÃO DE SENHA */}
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Alteração de Senha
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Mantenha sua conta segura com uma senha forte
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

            <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
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
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
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

          {/* 3. BLOQUEIO BIOMÉTRICO E PIN NUMÉRICO */}
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Bloqueio Biométrico & PIN
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Proteja a abertura do Finly com código de 4 dígitos ou biometria
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
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
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
                    className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    {pinConfigured ? 'Alterar PIN' : 'Definir PIN'}
                  </button>
                </div>

                {/* Biometrics Toggle if supported */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
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

                {/* Inactivity Timeout */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Bloquear Automaticamente
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tempo de inatividade após sair do app
                      </span>
                    </div>
                  </div>
                  <select
                    value={lockTimeout}
                    onChange={e => handleChangeTimeout(parseInt(e.target.value, 10))}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
                  >
                    <option value={0}>Imediatamente</option>
                    <option value={1}>Após 1 minuto</option>
                    <option value={5}>Após 5 minutos</option>
                    <option value={15}>Após 15 minutos</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <PinSetupModal
            isOpen={isPinModalOpen}
            onClose={() => setIsPinModalOpen(false)}
            onSuccess={() => {
              setPinConfigured(true);
              setPinEnabled(true);
              setBiometricEnabledState(isBiometricEnabled());
            }}
          />

          {/* 3. CÓPIAS DE SEGURANÇA & DADOS */}
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
          </div>

          {/* 5. SESSÃO & LOGOUT */}
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
        </div>
      </div>
    </div>
  );
};
