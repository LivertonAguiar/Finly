import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Sparkles,
  ArrowDownCircle,
  CreditCard,
  Building2,
  Target,
  FileSpreadsheet,
  Smartphone,
  Monitor,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Send,
  LifeBuoy,
  X,
  Layers,
} from 'lucide-react';
import {
  HELP_CATEGORIES,
  HELP_GUIDES,
  HELP_FAQS,
  HelpGuide,
  HelpCategoryDef,
  GuideStep,
} from '../../data/helpCenterData';
import { APP_VERSION, isNativeCapacitor, isMobileDevice } from '../../utils/appUpdateService';
import { useAuth } from '../../context/AuthContext';
import { FinlyAndroidMockup } from './FinlyAndroidMockup';

interface HelpCenterPageProps {
  onNavigateToTab?: (tab: string) => void;
}

export const HelpCenterPage: React.FC<HelpCenterPageProps> = ({ onNavigateToTab }) => {
  const { currentUser } = useAuth();
  const isAndroidApp = isNativeCapacitor() || isMobileDevice();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [platformMode, setPlatformMode] = useState<'web' | 'android'>(() =>
    isAndroidApp ? 'android' : 'web'
  );
  const currentPlatformMode: 'web' | 'android' = isAndroidApp ? 'android' : platformMode;
  const [activeGuide, setActiveGuide] = useState<HelpGuide | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Helpdesk contact form states
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [copiedInfo, setCopiedInfo] = useState(false);

  // Filter guides based on search & category
  const filteredGuides = useMemo(() => {
    return HELP_GUIDES.filter(guide => {
      const matchesCategory =
        selectedCategory === 'all' || guide.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        guide.title.toLowerCase().includes(q) ||
        guide.summary.toLowerCase().includes(q) ||
        guide.categoryLabel.toLowerCase().includes(q) ||
        guide.steps.some(
          s =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.webInstruction.toLowerCase().includes(q) ||
            s.androidInstruction.toLowerCase().includes(q)
        );
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  // Filter FAQs based on search
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return HELP_FAQS;
    return HELP_FAQS.filter(
      faq =>
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const handleOpenGuide = (guide: HelpGuide) => {
    setActiveGuide(guide);
    setActiveStepIndex(0);
  };

  const handleCloseGuide = () => {
    setActiveGuide(null);
    setActiveStepIndex(0);
  };

  const handleCopyDiagnostics = () => {
    const diag = `=== DIAGNÓSTICO FINLY ===\nVersão do App: v${APP_VERSION}\nPlataforma: ${
      isNativeCapacitor() ? 'Android Nativo (APK)' : 'Navegador Web / PWA'
    }\nUsuário: ${currentUser?.email || 'Anônimo'}\nNavegador: ${
      typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'
    }\nData: ${new Date().toISOString()}`;

    navigator.clipboard.writeText(diag).then(() => {
      setCopiedInfo(true);
      setTimeout(() => setCopiedInfo(false), 3000);
    });
  };

  const handleSendSupportTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactSent(true);
    setTimeout(() => {
      setContactSubject('');
      setContactMessage('');
      setContactSent(false);
    }, 4500);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'primeiros_passos':
        return Sparkles;
      case 'transacoes':
        return ArrowDownCircle;
      case 'cartoes':
        return CreditCard;
      case 'contas':
        return Building2;
      case 'planejamento':
        return Target;
      case 'ofx':
        return FileSpreadsheet;
      case 'mobile_web':
        return Smartphone;
      default:
        return Settings;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in pb-20 px-2 sm:px-4">
      {/* 1. Header Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-purple-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-2xl border border-purple-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black tracking-wider uppercase">
            <LifeBuoy className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Central de Ajuda & Base de Conhecimento</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Como podemos te ajudar hoje no <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">Finly</span>?
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            {isAndroidApp
              ? 'Explore tutoriais visuais passo a passo do aplicativo Finly no seu celular Android, tire dúvidas frequentes e domine o controle das suas finanças na palma da mão.'
              : 'Explore tutoriais visuais passo a passo, entenda as diferenças práticas entre o App Android e a Versão Web, tire dúvidas frequentes e domine o controle das suas finanças.'}
          </p>

          {/* Search Bar */}
          <div className="pt-2 relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Busque por 'despesa', 'pagar fatura', 'extrato OFX', 'notificações'..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white/10 dark:bg-black/30 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50 backdrop-blur-md transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Platform Toggle - Only on Desktop Web */}
          {!isAndroidApp && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Visão do Tutorial:</span>
              <div className="inline-flex p-1 rounded-xl bg-slate-900/80 border border-white/10 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setPlatformMode('web')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    currentPlatformMode === 'web'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Computador / Web</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPlatformMode('android')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    currentPlatformMode === 'android'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>App Celular (Android)</span>
                </button>
              </div>

              <span className="text-[11px] text-purple-300 font-medium hidden sm:inline">
                ✦ Alterna os apontamentos visuais e atalhos de tela
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          Todos os Guias ({HELP_GUIDES.length})
        </button>

        {HELP_CATEGORIES.map(cat => {
          const IconComp = getCategoryIcon(cat.id);
          const isSelected = selectedCategory === cat.id;
          const displayLabel = isAndroidApp && cat.id === 'mobile_web' ? 'Recursos Android' : cat.label;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 cursor-pointer border ${
                isSelected
                  ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/20 font-black'
                  : 'bg-white dark:bg-[#18181B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{displayLabel}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Featured Guides Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Guias Visuais Passo a Passo</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clique em um guia para abrir o simulador de tela com instruções detalhadas
            </p>
          </div>

          <span className="text-xs font-bold text-slate-400">
            {filteredGuides.length} {filteredGuides.length === 1 ? 'guia encontrado' : 'guias encontrados'}
          </span>
        </div>

        {filteredGuides.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 space-y-3">
            <Search className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhum guia encontrado para "{searchQuery}"
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tente buscar por termos mais genéricos como "cartão", "despesa", "conta" ou veja as perguntas frequentes logo abaixo.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGuides.map(guide => {
              const IconComponent = getCategoryIcon(guide.category);
              return (
                <div
                  key={guide.id}
                  onClick={() => handleOpenGuide(guide)}
                  className="group relative p-5 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:border-purple-400/60 dark:hover:border-purple-500/50 transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-99"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1.5">
                        <IconComponent className="w-3 h-3" />
                        <span>{guide.categoryLabel}</span>
                      </span>

                      {guide.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                          {guide.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-snug">
                      {guide.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {guide.summary}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {guide.steps.length} passos • {guide.readTime}
                    </span>

                    <span className="font-black text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Ver tutorial</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Interactive Step-by-Step Visual Walkthrough Modal */}
      {activeGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-white dark:bg-[#18181B] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="space-y-1 pr-6">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    {activeGuide.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400">
                    Passo {activeStepIndex + 1} de {activeGuide.steps.length}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  {activeGuide.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseGuide}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-header: Platform toggle & Step selector */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#18181B]">
              {/* Platform Switcher or Android Indicator */}
              {!isAndroidApp ? (
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPlatformMode('web')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      currentPlatformMode === 'web'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Modo Web / PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatformMode('android')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      currentPlatformMode === 'android'
                        ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Modo App Android</span>
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-black">
                  <Smartphone className="w-4 h-4" />
                  <span>Tutorial do App Android</span>
                </div>
              )}

              {/* Steps Indicator Pills */}
              <div className="flex items-center gap-1.5">
                {activeGuide.steps.map((st, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStepIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      activeStepIndex === idx
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Interactive Visual Mockup + Step Explanations */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Step Detail Card */}
              {activeGuide.steps[activeStepIndex] && (() => {
                const step = activeGuide.steps[activeStepIndex];
                return (
                  <div className="space-y-5">
                    {/* Visual Mockup Frame with Highlight & Pointer */}
                    {currentPlatformMode === 'android' ? (
                      <div className="p-3 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800/90 shadow-2xl flex justify-center">
                        <FinlyAndroidMockup
                          guide={activeGuide}
                          step={step}
                          stepIndex={activeStepIndex}
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-3xl bg-slate-900 border border-slate-700 p-5 overflow-hidden text-white shadow-xl">
                        {/* Device Header Simulator */}
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-[11px] text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                            <span className="font-mono text-slate-500 ml-2">
                              https://finly.lpaguiar.com.br (Desktop)
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold">
                            💻 Interface Desktop
                          </span>
                        </div>

                        {/* Mockup Canvas */}
                        <div className="relative min-h-[220px] rounded-2xl bg-slate-950/80 border border-slate-800/80 p-5 flex flex-col justify-between overflow-hidden">
                          <div className="space-y-4">
                            {/* Simulated Desktop Navbar */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-xs font-black">F</div>
                                <span className="text-xs font-black">Finly Planner</span>
                              </div>

                              <div className="relative">
                                <div className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-purple-600/30">
                                  <span>+ Nova Transação</span>
                                </div>

                                {/* Hotspot Pin 1 */}
                                <div className="absolute -top-3 -right-3 flex items-center justify-center">
                                  <span className="relative flex h-6 w-6">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-600 text-white font-black text-xs items-center justify-center shadow-lg">
                                      {activeStepIndex + 1}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Simulated Desktop Layout Grid */}
                            <div className="grid grid-cols-4 gap-3 text-xs">
                              <div className="col-span-1 p-3 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-2">
                                <div className="h-3 w-16 bg-slate-800 rounded" />
                                <div className="h-3 w-20 bg-purple-600/40 rounded" />
                                <div className="h-3 w-14 bg-slate-800 rounded" />
                              </div>
                              <div className="col-span-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60 space-y-3">
                                <div className="flex justify-between">
                                  <div className="h-4 w-32 bg-slate-700 rounded" />
                                  <div className="h-4 w-20 bg-emerald-500/40 rounded" />
                                </div>
                                <div className="h-2 w-full bg-slate-800 rounded" />
                                <div className="h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 p-2 text-[11px] text-purple-300 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-purple-400 shrink-0" />
                                  <span>{step.callout?.webDescription || step.webInstruction}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Callout Indicator Badge */}
                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-black text-[10px]">
                            Ponto {activeStepIndex + 1}
                          </span>
                          <span className="font-medium">
                            {step.webInstruction}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step Explanations & Tip Box */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shrink-0 mt-0.5 shadow-md shadow-purple-600/20">
                          {activeStepIndex + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                            {step.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>

                      {/* Instructions: Android-only on mobile / Dual on desktop */}
                      {isAndroidApp ? (
                        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800 text-xs space-y-1.5 shadow-xs">
                          <div className="flex items-center gap-2 font-black text-purple-600 dark:text-purple-400">
                            <Smartphone className="w-4 h-4" />
                            <span>Como executar no aplicativo Finly</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                            {step.androidInstruction}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          <div className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                            currentPlatformMode === 'web'
                              ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                          }`}>
                            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-slate-100">
                              <Monitor className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>No Computador (Web)</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {step.webInstruction}
                            </p>
                          </div>

                          <div className={`p-4 rounded-2xl border text-xs space-y-1.5 transition-all ${
                            currentPlatformMode === 'android'
                              ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
                              : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-75'
                          }`}>
                            <div className="flex items-center gap-1.5 font-black text-slate-900 dark:text-slate-100">
                              <Smartphone className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>No Celular (Android)</span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {step.androidInstruction}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Tip Alert */}
                      {step.tip && (
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Dica de Ouro: </span>
                            <span className="text-[11px] opacity-90">{step.tip}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Common Mistake Alert (if present) */}
              {activeGuide.commonMistake && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Erro Comum a Evitar: </span>
                    <span className="text-[11px] opacity-90">{activeGuide.commonMistake}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Navigation between steps */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                disabled={activeStepIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all disabled:opacity-30 flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Passo Anterior</span>
              </button>

              {activeStepIndex < activeGuide.steps.length - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setActiveStepIndex(prev =>
                      Math.min(activeGuide.steps.length - 1, prev + 1)
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Próximo Passo ({activeStepIndex + 2}/{activeGuide.steps.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCloseGuide}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Concluir Tutorial</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Frequently Asked Questions (FAQ) Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Dúvidas Frequentes (FAQ)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Respostas diretas para as perguntas mais comuns dos usuários
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredFaqs.map(faq => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isExpanded ? 'rotate-180 text-purple-600' : ''
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/30 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Helpdesk, Diagnostics & Support Contact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-4">
        {/* Diagnostic Box */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Diagnóstico do Sistema
              </h3>
              <p className="text-[11px] text-slate-400">Informações para suporte</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400">Versão:</span> v{APP_VERSION}
            </div>
            <div>
              <span className="text-slate-400">Ambiente:</span>{' '}
              {isNativeCapacitor() ? 'App Android Nativo' : 'Navegador Web / PWA'}
            </div>
            <div>
              <span className="text-slate-400">Usuário:</span> {currentUser?.email || 'Conectado'}
            </div>
            <div>
              <span className="text-slate-400">Status:</span>{' '}
              <span className="text-emerald-500 font-bold">Online & Ativo</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyDiagnostics}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {copiedInfo ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copiado para a área de transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar dados de diagnóstico</span>
              </>
            )}
          </button>
        </div>

        {/* In-App Helpdesk Ticket Form */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Precisa de ajuda adicional? (Helpdesk)
              </h3>
              <p className="text-[11px] text-slate-400">
                Envie uma dúvida ou sugestão diretamente para a equipe técnica
              </p>
            </div>
          </div>

          {contactSent ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2 animate-in zoom-in-95">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-black text-emerald-900 dark:text-emerald-200">
                Mensagem enviada com sucesso!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Nossa equipe de suporte analisará sua solicitação e entrará em contato.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendSupportTicket} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  placeholder="Assunto da sua dúvida (ex: Dúvida sobre conciliação bancária)"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Descreva o que aconteceu ou a funcionalidade que deseja aprender..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Resposta rápida no seu e-mail cadastrado
                </span>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-purple-600/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Mensagem</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
