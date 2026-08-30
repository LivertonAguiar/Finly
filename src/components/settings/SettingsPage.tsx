import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Layout,
  Shield,
  Palette,
  Eye,
  EyeOff,
  DollarSign,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Languages,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { t, SupportedLanguage } from '../../utils/i18n';
import { applyTheme, ThemePreset, CardRadius } from '../../utils/themeEngine';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useFinancial();

  const [activeTab, setActiveTab] = useState<'preferences' | 'appearance' | 'alerts' | 'dashboard' | 'security'>('preferences');
  const [successMsg, setSuccessMsg] = useState(false);

  // Preference fields
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>((user.language as SupportedLanguage) || 'pt-BR');
  const [selectedCurrency, setSelectedCurrency] = useState(user.currency || 'BRL');
  const [selectedThemePreset, setSelectedThemePreset] = useState<ThemePreset>((user.themePreset as ThemePreset) || 'mobills-dark');
  const [selectedAccentColor, setSelectedAccentColor] = useState(user.accentColor || '#7C4DFF');
  const [selectedCardRadius, setSelectedCardRadius] = useState<CardRadius>((user.cardRadius as CardRadius) || 'rounded');
  const [hideValues, setHideValues] = useState(!user.showValues);

  // Alerts
  const [dueAlertDays, setDueAlertDays] = useState('3');
  const [budgetAlert80, setBudgetAlert80] = useState(true);
  const [budgetAlert100, setBudgetAlert100] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

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
    updateUser({ themePreset: preset, theme: preset === 'clean-light' || preset === 'warm-sand' ? 'light' : 'dark' });
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
      theme: selectedThemePreset === 'clean-light' || selectedThemePreset === 'warm-sand' ? 'light' : 'dark',
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
    { color: '#7C4DFF', label: 'Mobills Roxo / Indigo' },
    { color: '#00A884', label: 'Verde Esmeralda' },
    { color: '#0091FF', label: 'Azul Elétrico' },
    { color: '#FF8A00', label: 'Laranja Solar' },
    { color: '#EC4899', label: 'Rosa Neon' },
    { color: '#EF4444', label: 'Vermelho Carmim' },
  ];

  const themePresets = [
    { id: 'mobills-dark', label: 'Mobills Dark (Oficial)', desc: 'Preto suave #1C1C1E e cartões #2C2C2E', bg: 'bg-[#1C1C1E]' },
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
          className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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

      {/* TAB 1: PREFERÊNCIAS & IDIOMAS */}
      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Idioma da Interface */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{t('settings.lang.title', selectedLang)}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.lang.desc', selectedLang)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: 'pt-BR', label: '🇧🇷 Português (Brasil)', desc: 'Português padrão com termos brasileiros' },
                { id: 'en-US', label: '🇺🇸 English (United States)', desc: 'English UI with American financial terms' },
                { id: 'es-ES', label: '🇪🇸 Español (España / Latam)', desc: 'Interfaz completa en idioma español' },
              ].map(lang => (
                <div
                  key={lang.id}
                  onClick={() => setSelectedLang(lang.id as SupportedLanguage)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedLang === lang.id
                      ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{lang.label}</h4>
                    <span className="text-[11px] text-slate-400">{lang.desc}</span>
                  </div>
                  {selectedLang === lang.id && <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                </div>
              ))}
            </div>
          </div>

          {/* Moeda Principal */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{t('settings.currency.title', selectedLang)}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('settings.currency.desc', selectedLang)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { id: 'BRL', symbol: 'R$', label: 'Real Brasileiro (BRL)', desc: 'Padrão brasileiro (ex: R$ 1.250,00)' },
                { id: 'USD', symbol: '$', label: 'US Dollar (USD)', desc: 'American standard (e.g. $1,250.00)' },
                { id: 'EUR', symbol: '€', label: 'Euro (EUR)', desc: 'Formato europeu (ex: €1.250,00)' },
              ].map(curr => (
                <div
                  key={curr.id}
                  onClick={() => setSelectedCurrency(curr.id)}
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedCurrency === curr.id
                      ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 font-black text-xs flex items-center justify-center text-slate-700 dark:text-slate-300">
                      {curr.symbol}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{curr.label}</h4>
                      <span className="text-[10px] text-slate-400">{curr.desc}</span>
                    </div>
                  </div>
                  {selectedCurrency === curr.id && <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />}
                </div>
              ))}
            </div>
          </div>

          {/* Ocultar Valores */}
          <div className="md:col-span-2 p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-600/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                {hideValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Modo Privacidade (Ocultar Saldos)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Substitui valores numéricos por asteriscos (•••••) em todos os painéis e gráficos.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hideValues}
                onChange={e => setHideValues(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600" />
            </label>
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
                { id: 'rounded', label: 'Ultra-Redondo (25px)', desc: 'Estilo oficial Mobills' },
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

      {/* TAB 4: ALERTAS & NOTIFICAÇÕES */}
      {activeTab === 'alerts' && (
        <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Gatilhos de Notificação Automáticos</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Alerta de Vencimento de Faturas</h4>
                <p className="text-[11px] text-slate-400">Avisar com antecedência antes do vencimento</p>
              </div>
              <select
                value={dueAlertDays}
                onChange={e => setDueAlertDays(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="1">1 dia antes</option>
                <option value="3">3 dias antes</option>
                <option value="5">5 dias antes</option>
                <option value="7">7 dias antes</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Alerta de Orçamento a 80%</h4>
                <p className="text-[11px] text-slate-400">Avisar quando os gastos atingirem 80% do teto mensal</p>
              </div>
              <input
                type="checkbox"
                checked={budgetAlert80}
                onChange={e => setBudgetAlert80(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Alerta de Estouro de Orçamento (100%)</h4>
                <p className="text-[11px] text-slate-400">Avisar imediatamente se alguma categoria estourar o limite</p>
              </div>
              <input
                type="checkbox"
                checked={budgetAlert100}
                onChange={e => setBudgetAlert100(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Resumo Semanal por E-mail</h4>
                <p className="text-[11px] text-slate-400">Receber balanço financeiro todo domingo à noite</p>
              </div>
              <input
                type="checkbox"
                checked={weeklySummary}
                onChange={e => setWeeklySummary(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 dark:border-slate-700 cursor-pointer"
              />
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
