import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BarChart3,
  Bot,
  Settings,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { AboutSection } from '../settings/AboutSection';
import { useTranslation } from '../../utils/i18n';
import { getSidebarItemLabel } from '../../utils/sidebarConfig';

interface MorePageProps {
  setActiveTab: (tab: string) => void;
  initialSubTab?: 'GERAL' | 'SOBRE';
}

export const MorePage: React.FC<MorePageProps> = ({ setActiveTab, initialSubTab }) => {
  const { lang, t } = useTranslation();
  const [segmentedTab, setSegmentedTab] = useState<'GERAL' | 'SOBRE'>(initialSubTab || 'GERAL');

  useEffect(() => {
    if (initialSubTab && initialSubTab !== segmentedTab) {
      setSegmentedTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const handleOpenSobre = () => setSegmentedTab('SOBRE');
    window.addEventListener('finly_open_sobre', handleOpenSobre);
    return () => window.removeEventListener('finly_open_sobre', handleOpenSobre);
  }, []);

  const shortMenuItems = [
    {
      id: 'patrimonio',
      label: getSidebarItemLabel('patrimonio', lang),
      description: t('more.patrimonio_desc', 'Investimentos, ativos, dívidas e financiamentos'),
      icon: TrendingUp,
      colorClass: 'bg-emerald-50 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'relatorios',
      label: getSidebarItemLabel('relatorios', lang),
      description: t('more.relatorios_desc', 'Gráficos de evolução, fluxo de caixa e categorias'),
      icon: BarChart3,
      colorClass: 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'assistente',
      label: getSidebarItemLabel('assistente', lang),
      description: t('more.assistente_desc', 'WhatsApp e Skills financeiras inteligentes'),
      icon: Bot,
      colorClass: 'bg-purple-50 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'settings',
      label: getSidebarItemLabel('settings', lang),
      description: t('more.settings_desc', 'Perfil, família, categorias, temas, dados e ajuda'),
      icon: Settings,
      colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {segmentedTab === 'GERAL' ? t('more.modules_title', 'Mais Módulos') : t('settings.section.about', 'Sobre o Finly')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {segmentedTab === 'GERAL'
              ? t('more.modules_subtitle', 'Acesse os módulos complementares e recursos do sistema')
              : t('more.about_subtitle', 'Versão do aplicativo, notas de atualização e changelog')}
          </p>
        </div>
      </div>

      {/* Segmented Switcher */}
      <div className="p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-800/80 flex items-center gap-1 shadow-xs">
        {[
          { id: 'GERAL' as const, label: t('more.quick_menu', 'Menu Rápido'), icon: SlidersHorizontal },
          { id: 'SOBRE' as const, label: t('more.about_version', 'Sobre & Versão'), icon: Info },
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

      {/* Conteúdo da Aba */}
      {segmentedTab === 'GERAL' ? (
        <div className="rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60">
          {shortMenuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full p-4.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-[#1E1E22] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-2xl ${item.colorClass} flex items-center justify-center shrink-0 shadow-xs`}>
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
        </div>
      ) : (
        <AboutSection />
      )}
    </div>
  );
};
