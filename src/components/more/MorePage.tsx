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

interface MorePageProps {
  setActiveTab: (tab: string) => void;
}

export const MorePage: React.FC<MorePageProps> = ({ setActiveTab }) => {
  const { exportBackupJSON, user } = useFinancial();
  const { lang, t } = useTranslation();
  const [segmentedTab, setSegmentedTab] = useState<'GERAL' | 'GERENCIAR' | 'SOBRE'>('GERAL');
  const [activeSidebarIds, setActiveSidebarIds] = useState<string[]>(getStoredSidebarItems);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

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

        {/* ABA SOBRE */}
        {segmentedTab === 'SOBRE' && (
          <div className="p-6 space-y-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <FinlyLogo size="lg" />
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">Finly</h4>
                <p>Versão 2.174.0</p>
              </div>
            </div>

            <p>
              Plataforma financeira completa para controle de orçamento, fluxo de caixa, cartões e patrimônio.
            </p>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Criptografia:</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  AES-256 / SSL Seguro
                </span>
              </div>
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

