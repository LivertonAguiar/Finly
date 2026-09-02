import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Layout,
  Shield,
  Palette,
  Eye,
  EyeOff,
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
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { t, SupportedLanguage } from '../../utils/i18n';
import { applyTheme, ThemePreset, CardRadius } from '../../utils/themeEngine';
import {
  getStoredNotificationPrefs,
  saveNotificationPrefs,
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
  NotificationPreferences,
} from '../../utils/notificationEngine';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useFinancial();

  const [activeTab, setActiveTab] = useState<'preferences' | 'appearance' | 'alerts' | 'dashboard' | 'security'>('preferences');
  const [successMsg, setSuccessMsg] = useState(false);

  // Preference fields
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>((user.language as SupportedLanguage) || 'pt-BR');
  const [selectedCurrency, setSelectedCurrency] = useState(user.currency || 'BRL');
  const [selectedThemePreset, setSelectedThemePreset] = useState<ThemePreset>((user.themePreset as ThemePreset) || 'planner-dark');
  const [selectedAccentColor, setSelectedAccentColor] = useState(user.accentColor || '#7C4DFF');
  const [selectedCardRadius, setSelectedCardRadius] = useState<CardRadius>((user.cardRadius as CardRadius) || 'rounded');
  const [hideValues, setHideValues] = useState(!user.showValues);

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

  // Load saved settings & apply current theme
  useEffect(() => {
    try {
      const saved = localStorage.getItem('plannerfin_dash_widgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.left) setDashLeftWidgets(parsed.left);
        if (parsed.right) setDashRightWidgets(parsed.right);
      }
    } catch (e) {}
  }, []);

  // Instant live preview on clicking theme preset
  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedThemePreset(preset);
    applyTheme({ preset, accentColor: selectedAccentColor, cardRadius: selectedCardRadius });
    updateUser({ themePreset: preset, theme: preset === 'clean-light' ? 'light' : 'dark' });
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
    applyTheme({
      preset: selectedThemePreset,
      accentColor: selectedAccentColor,
      cardRadius: selectedCardRadius,
    });

    updateUser({
      language: selectedLang,
      currency: selectedCurrency,
      theme: selectedThemePreset === 'clean-light' ? 'light' : 'dark',
      themePreset: selectedThemePreset,
      accentColor: selectedAccentColor,
      cardRadius: selectedCardRadius,
      showValues: !hideValues,
    });

    localStorage.setItem(
      'plannerfin_dash_widgets',
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

  const accentOptions = [
    { color: '#7C4DFF', label: 'Púrpura / Indigo' },
    { color: '#00A884', label: 'Verde Esmeralda' },
    { color: '#0091FF', label: 'Azul Elétrico' },
    { color: '#FF8A00', label: 'Laranja Solar' },
    { color: '#EC4899', label: 'Rosa Neon' },
    { color: '#EF4444', label: 'Vermelho Carmim' },
  ];

  const themePresets = [
    { id: 'planner-dark', label: 'Planner Dark (Elegance)', desc: 'Preto suave #1C1C1E e cartões #2C2C2E', bg: 'bg-[#1C1C1E]' },
    { id: 'midnight-oled', label: 'Midnight OLED', desc: 'Preto absoluto #000000 para economia máxima', bg: 'bg-black' },
    { id: 'emerald-slate', label: 'Emerald Slate', desc: 'Azul petróleo marinho #0F172A', bg: 'bg-[#0F172A]' },
    { id: 'clean-light', label: 'Clean Light', desc: 'Branco puro e minimalista', bg: 'bg-slate-100' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* Header */}
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

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'preferences', label: t('settings.tab.preferences', selectedLang), icon: Sliders },
          { id: 'appearance', label: t('settings.tab.appearance', selectedLang), icon: Palette },
          { id: 'dashboard', label: t('settings.tab.dashboard', selectedLang), icon: Layout },
          { id: 'alerts', label: t('settings.tab.alerts', selectedLang), icon: Bell },
          { id: 'security', label: t('settings.tab.security', selectedLang), icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PREFERÊNCIAS (MINIMALISTA) */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="max-w-xl">
            {/* Seletor Minimalista de Idioma */}
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {t('settings.lang.title', selectedLang)}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('settings.lang.desc', selectedLang)}
                  </p>
                </div>
              </div>

              {/* Minimalist Segmented Buttons */}
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
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APARÊNCIA & TEMAS PERSONALIZADOS (INSTANT LIVE PREVIEW) */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Preset Themes Grid */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-600" />
              <span>{t('settings.theme.title', selectedLang)}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {themePresets.map(tp => (
                <div
                  key={tp.id}
                  onClick={() => handleSelectPreset(tp.id as any)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                    selectedThemePreset === tp.id
                      ? 'border-purple-600 ring-2 ring-purple-600/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-full h-12 rounded-xl ${tp.bg} border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs`} />
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{tp.label}</h4>
                    <p className="text-[10px] text-slate-400">{tp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accent Color Palette */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>{t('settings.accent.title', selectedLang)}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('settings.accent.desc', selectedLang)}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {accentOptions.map(opt => (
                <button
                  key={opt.color}
                  onClick={() => handleSelectAccent(opt.color)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedAccentColor.toLowerCase() === opt.color.toLowerCase()
                      ? 'border-purple-600 ring-2 ring-purple-600/30 shadow-md bg-purple-50/20 dark:bg-purple-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shadow-xs"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Corner Radius Style */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {t('settings.radius.title', selectedLang)}
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'rounded', label: 'Ultra-Redondo (25px)', desc: 'Estilo oficial Finly' },
                { id: 'medium', label: 'Moderno (16px)', desc: 'Bordas suaves' },
                { id: 'sharp', label: 'Reto (8px)', desc: 'Estilo sóbrio' },
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => handleSelectRadius(r.id as any)}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
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

      {/* TAB 3: DASHBOARD CUSTOMIZER */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ative ou desative os widgets para compor sua visão inicial perfeita:
            </p>
            <button
              onClick={handleResetDashboardDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coluna Esquerda */}
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Coluna da Esquerda
              </h4>

              <div className="space-y-3">
                {[
                  { key: 'expensesDonut', label: 'Gráfico de despesas por categoria' },
                  { key: 'spendingFrequency', label: 'Frequência de gastos (Score)' },
                  { key: 'monthlyBalance', label: 'Balanço mensal' },
                  { key: 'pendingTransactions', label: 'Transações pendentes' },
                  { key: 'budgetSummary', label: 'Resumo do orçamento' },
                  { key: 'favoriteTransactions', label: 'Transações favoritas' },
                  { key: 'movementCalendar', label: 'Calendário de movimentações' },
                  { key: 'myAccounts', label: 'Minhas contas' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(dashLeftWidgets as any)[item.key]}
                      onChange={e =>
                        setDashLeftWidgets(prev => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita */}
            <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Coluna da Direita
              </h4>

              <div className="space-y-3">
                {[
                  { key: 'incomesDonut', label: 'Gráfico de receitas por categoria' },
                  { key: 'semiannualBalance', label: 'Balanço semestral' },
                  { key: 'quarterlyBalance', label: 'Balanço trimestral' },
                  { key: 'creditCardInfo', label: 'Informações de cartão de crédito' },
                  { key: 'goalsProgress', label: 'Objetivos e metas' },
                  { key: 'monthSavings', label: 'Economia no mês' },
                  { key: 'userProfile', label: 'Card de perfil' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(dashRightWidgets as any)[item.key]}
                      onChange={e =>
                        setDashRightWidgets(prev => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALERTAS & NOTIFICAÇÕES (WEB & MOBILE PWA) */}
      {activeTab === 'alerts' && (
        <div className="space-y-5">
          {/* 1. PERMISSION & STATUS HERO CARD */}
          <div className="p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  notifPermission === 'granted'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : notifPermission === 'denied'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                }`}>
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Central de Notificações</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      notifPermission === 'granted'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : notifPermission === 'denied'
                        ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    }`}>
                      {notifPermission === 'granted' ? 'Ativo no Navegador' : notifPermission === 'denied' ? 'Bloqueado' : 'Permissão Pendente'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Receba lembretes de vencimentos, faturas e controle de orçamento no Web App e Mobile.
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
                      if (res === 'granted') {
                        setNotifPrefs(prev => saveNotificationPrefs({ ...prev, enabled: true }));
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Permitir Notificações</span>
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
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 active:scale-95"
                  >
                    {testSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400">Enviada!</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Testar Notificação</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {testSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notificação de teste enviada! Verifique a central de notificações do seu sistema ou celular.</span>
              </div>
            )}
          </div>

          {/* 2. GRANULAR NOTIFICATION SWITCHES */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Preferências de Disparo</h4>
                <p className="text-[11px] text-slate-500">Escolha quais eventos devem gerar avisos no seu dispositivo</p>
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
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className={`space-y-4 transition-opacity ${notifPrefs.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              {/* 1. Cartões de Crédito */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Faturas de Cartão de Crédito</h4>
                    <p className="text-[11px] text-slate-400">Lembrete de vencimento e fechamento da fatura</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={String(notifPrefs.dueDaysAhead)}
                    onChange={e => {
                      const next = saveNotificationPrefs({ dueDaysAhead: parseInt(e.target.value) || 3 });
                      setNotifPrefs(next);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <option value="0">No dia do vencimento</option>
                    <option value="1">1 dia antes</option>
                    <option value="3">3 dias antes</option>
                    <option value="5">5 dias antes</option>
                    <option value="7">7 dias antes</option>
                  </select>

                  <input
                    type="checkbox"
                    checked={notifPrefs.cardInvoices}
                    onChange={e => {
                      const next = saveNotificationPrefs({ cardInvoices: e.target.checked });
                      setNotifPrefs(next);
                    }}
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                  />
                </div>
              </div>

              {/* 2. Contas Pendentes */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Contas e Despesas Pendentes / Fixas</h4>
                    <p className="text-[11px] text-slate-400">Avisos de contas cadastradas com pagamento programado</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={notifPrefs.pendingBills}
                  onChange={e => {
                    const next = saveNotificationPrefs({ pendingBills: e.target.checked });
                    setNotifPrefs(next);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* 3. Alerta de 80% do Orçamento */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Alerta Preventivo de Orçamento (80%)</h4>
                    <p className="text-[11px] text-slate-400">Avisar quando os gastos do mês atingirem 80% do limite planejado</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={notifPrefs.budget80}
                  onChange={e => {
                    const next = saveNotificationPrefs({ budget80: e.target.checked });
                    setNotifPrefs(next);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* 4. Estouro de Orçamento (100%) */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Alerta de Estouro de Orçamento (100%)</h4>
                    <p className="text-[11px] text-slate-400">Avisar imediatamente ao exceder o teto total estipulado</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={notifPrefs.budget100}
                  onChange={e => {
                    const next = saveNotificationPrefs({ budget100: e.target.checked });
                    setNotifPrefs(next);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* 5. Metas Concluídas */}
              <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Metas e Objetivos Concluídos</h4>
                    <p className="text-[11px] text-slate-400">Celebração e notificação quando uma meta atingir 100%</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={notifPrefs.goalsProgress}
                  onChange={e => {
                    const next = saveNotificationPrefs({ goalsProgress: e.target.checked });
                    setNotifPrefs(next);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>

              {/* 6. Som de Notificação */}
              <div className="flex items-center justify-between py-2.5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                    {notifPrefs.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Efeito Sonoro Suave (Chime)</h4>
                    <p className="text-[11px] text-slate-400">Tocar um som harmônico discreto ao disparar notificações</p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={notifPrefs.sound}
                  onChange={e => {
                    const next = saveNotificationPrefs({ sound: e.target.checked });
                    setNotifPrefs(next);
                  }}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SEGURANÇA */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Configurações de Conta e Segurança</h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">E-mail Cadastrado</span>
                  <span className="text-[11px] text-slate-400">{user.email}</span>
                </div>
              </div>
              <button className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">Alterar</button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-slate-400" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">Senha de Acesso</span>
                  <span className="text-[11px] text-slate-400">Última alteração recente</span>
                </div>
              </div>
              <button className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">Redefinir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
