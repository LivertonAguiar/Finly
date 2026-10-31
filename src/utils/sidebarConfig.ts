import React from 'react';
import {
  Home,
  List,
  CreditCard,
  Flag,
  BarChart3,
  Settings,
  TrendingUp,
  Bot,
  Building2,
  LucideIcon,
} from 'lucide-react';
import { SupportedLanguage } from './i18n';

export interface SidebarItemDef {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  category: 'principal' | 'gestao';
}

export const ALL_SIDEBAR_ITEMS: SidebarItemDef[] = [
  {
    id: 'dashboard',
    label: 'Início',
    description: 'Visão geral, resumo e cards financeiros',
    icon: Home,
    category: 'principal',
  },
  {
    id: 'transacoes',
    label: 'Transações',
    description: 'Extrato detalhado, lista e visão calendário',
    icon: List,
    category: 'principal',
  },
  {
    id: 'contas-cartoes',
    label: 'Contas & Cartões',
    description: 'Contas bancárias, carteiras e faturas de cartão',
    icon: CreditCard,
    category: 'principal',
  },
  {
    id: 'planejar',
    label: 'Planejar',
    description: 'Orçamento mensal e metas financeiras',
    icon: Flag,
    category: 'principal',
  },
  {
    id: 'patrimonio',
    label: 'Patrimônio',
    description: 'Investimentos, ativos, dívidas e financiamentos',
    icon: TrendingUp,
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
    id: 'assistente',
    label: 'Assistente IA',
    description: 'WhatsApp e Skills com inteligência artificial',
    icon: Bot,
    category: 'principal',
  },
  {
    id: 'settings',
    label: 'Ajustes',
    description: 'Perfil, família, categorias, temas, dados e ajuda',
    icon: Settings,
    category: 'gestao',
  },
];

export const DEFAULT_SIDEBAR_ORDER: string[] = [
  'dashboard',
  'transacoes',
  'contas-cartoes',
  'planejar',
  'patrimonio',
  'relatorios',
  'assistente',
];

export const SIDEBAR_STORAGE_KEY = 'finly_sidebar_custom_order_v2';

export const getSidebarItemLabel = (id: string, lang: SupportedLanguage = 'pt-BR'): string => {
  const labelsPt: Record<string, string> = {
    dashboard: 'Início',
    transacoes: 'Transações',
    'contas-cartoes': 'Contas & Cartões',
    planejar: 'Planejar',
    patrimonio: 'Patrimônio',
    relatorios: 'Relatórios',
    assistente: 'Assistente IA',
    settings: 'Ajustes',
    // Fallbacks legados
    contas: 'Contas',
    cartoes: 'Cartões',
    planejamento: 'Orçamento',
    orcamento: 'Orçamento',
    metas: 'Metas',
    dividas: 'Dívidas',
    investimentos: 'Investimentos',
    whatsapp: 'WhatsApp',
    skills: 'Skills IA',
    cadastro: 'Categorias & Tags',
    familia: 'Família',
    ajuda: 'Ajuda',
    calendario: 'Calendário',
  };

  const labelsEn: Record<string, string> = {
    dashboard: 'Home',
    transacoes: 'Transactions',
    'contas-cartoes': 'Accounts & Cards',
    planejar: 'Planning',
    patrimonio: 'Assets & Debts',
    relatorios: 'Reports',
    assistente: 'AI Assistant',
    settings: 'Settings',
  };

  const labelsEs: Record<string, string> = {
    dashboard: 'Inicio',
    transacoes: 'Transacciones',
    'contas-cartoes': 'Cuentas y Tarjetas',
    planejar: 'Planificar',
    patrimonio: 'Patrimonio',
    relatorios: 'Informes',
    assistente: 'Asistente IA',
    settings: 'Ajustes',
  };

  if (lang === 'en-US' && labelsEn[id]) return labelsEn[id];
  if (lang === 'es-ES' && labelsEs[id]) return labelsEs[id];
  return labelsPt[id] || ALL_SIDEBAR_ITEMS.find(i => i.id === id)?.label || id;
};

export const getStoredSidebarItems = (): string[] => {
  if (typeof window === 'undefined') return DEFAULT_SIDEBAR_ORDER;
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!raw) return DEFAULT_SIDEBAR_ORDER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_SIDEBAR_ORDER;
    // Valida se os itens pertencem aos novos IDs
    const validIds = new Set(ALL_SIDEBAR_ITEMS.map(i => i.id));
    const filtered = parsed.filter(id => validIds.has(id));
    return filtered.length > 0 ? filtered : DEFAULT_SIDEBAR_ORDER;
  } catch (e) {
    return DEFAULT_SIDEBAR_ORDER;
  }
};


export const saveStoredSidebarItems = (items: string[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('finly_sidebar_changed'));
  } catch (e) {
    console.error('Error saving sidebar items:', e);
  }
};
