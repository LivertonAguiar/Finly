import React from 'react';
import {
  Home,
  Building2,
  List,
  CreditCard,
  Flag,
  Target,
  BarChart3,
  Calendar as CalendarIcon,
  Settings,
  MoreHorizontal,
  TrendingUp,
  FolderTree,
  Bot,
  Users,
  Sparkles,
  BadgePercent,
  User,
  LifeBuoy,
  LucideIcon,
} from 'lucide-react';

export interface SidebarItemDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: 'principal' | 'ferramentas' | 'gestao';
}

export const ALL_SIDEBAR_ITEMS: SidebarItemDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Visão geral, resumo e cards financeiros',
    icon: Home,
    category: 'principal',
  },
  {
    id: 'contas',
    label: 'Contas',
    description: 'Saldos bancários, carteiras e extratos',
    icon: Building2,
    category: 'principal',
  },
  {
    id: 'transacoes',
    label: 'Transações',
    description: 'Extrato detalhado, filtros e busca',
    icon: List,
    category: 'principal',
  },
  {
    id: 'cartoes',
    label: 'Cartões de crédito',
    description: 'Faturas, limites e compras parceladas',
    icon: CreditCard,
    category: 'principal',
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    description: 'Orçamento mensal e matriz 12 meses',
    icon: Flag,
    category: 'principal',
  },
  {
    id: 'metas',
    label: 'Metas',
    description: 'Objetivos financeiros e reservas',
    icon: Target,
    category: 'principal',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    description: 'Gráficos de evolução, fluxo e categorias',
    icon: BarChart3,
    category: 'principal',
  },
  {
    id: 'calendario',
    label: 'Calendário',
    description: 'Visão mensal de vencimentos e previsões',
    icon: CalendarIcon,
    category: 'principal',
  },
  {
    id: 'dividas',
    label: 'Dívidas & Empréstimos',
    description: 'Parcelamentos, taxas de juros e amortizações',
    icon: BadgePercent,
    category: 'ferramentas',
  },
  {
    id: 'investimentos',
    label: 'Investimentos & Patrimônio',
    description: 'Ações, FIIs, Renda Fixa e rendimentos',
    icon: TrendingUp,
    category: 'ferramentas',
  },
  {
    id: 'whatsapp',
    label: 'Assistente WhatsApp (IA)',
    description: 'Lançamentos via áudio, fotos e comprovantes',
    icon: Bot,
    category: 'ferramentas',
  },
  {
    id: 'skills',
    label: 'Skills Financeiras de IA',
    description: 'Automações, milhas e otimização tributária',
    icon: Sparkles,
    category: 'ferramentas',
  },
  {
    id: 'cadastro',
    label: 'Categorias & Tags',
    description: 'Personalizar categorias pai e subcategorias',
    icon: FolderTree,
    category: 'gestao',
  },
  {
    id: 'familia',
    label: 'Finanças da Família',
    description: 'Controle compartilhado com múltiplos membros',
    icon: Users,
    category: 'gestao',
  },
  {
    id: 'settings',
    label: 'Configurações',
    description: 'Preferências do sistema, temas e moedas',
    icon: Settings,
    category: 'gestao',
  },
  {
    id: 'ajuda',
    label: 'Central de Ajuda',
    description: 'Tutoriais visuais, guias passo a passo e FAQ',
    icon: LifeBuoy,
    category: 'gestao',
  },
];

export const DEFAULT_SIDEBAR_ORDER: string[] = [
  'dashboard',
  'contas',
  'transacoes',
  'cartoes',
  'planejamento',
  'metas',
  'relatorios',
  'calendario',
  'settings',
];

export const SIDEBAR_STORAGE_KEY = 'finly_sidebar_custom_order_v1';

import { SupportedLanguage, t } from './i18n';

export const getSidebarItemLabel = (id: string, lang: SupportedLanguage = 'pt-BR'): string => {
  const item = ALL_SIDEBAR_ITEMS.find(i => i.id === id);
  const defaultLabel = item?.label || id;
  const keyMap: Record<string, string> = {
    dashboard: 'nav.dashboard',
    contas: 'nav.accounts',
    transacoes: 'nav.transactions',
    cartoes: 'nav.cards',
    planejamento: 'nav.planning',
    metas: 'nav.goals',
    relatorios: 'nav.reports',
    calendario: 'nav.calendar',
    dividas: 'nav.debts',
    investimentos: 'nav.investments',
    whatsapp: 'nav.whatsapp',
    skills: 'nav.skills',
    cadastro: 'nav.categories',
    familia: 'nav.family',
    settings: 'nav.settings',
    ajuda: 'nav.help',
    mais: 'nav.more',
  };
  return t(keyMap[id] || `nav.${id}`, lang, defaultLabel);
};

export const getStoredSidebarItems = (): string[] => {
  try {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!saved) return DEFAULT_SIDEBAR_ORDER;
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate that item ids exist in master list
      const validIds = new Set(ALL_SIDEBAR_ITEMS.map(i => i.id));
      const filtered = parsed.filter(id => validIds.has(id));
      return filtered.length > 0 ? filtered : DEFAULT_SIDEBAR_ORDER;
    }
  } catch (e) {
    console.error('Error loading sidebar order from localStorage:', e);
  }
  return DEFAULT_SIDEBAR_ORDER;
};

export const saveStoredSidebarItems = (items: string[]) => {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('finly_sidebar_changed'));
  } catch (e) {
    console.error('Error saving sidebar order to localStorage:', e);
  }
};

