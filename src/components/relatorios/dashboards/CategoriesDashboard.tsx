import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  Tag,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { Transaction, Category, Budget, UserProfile } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { resolveCategory } from '../../../utils/categoryResolver';
import { getAnalyticalEntries } from '../../../utils/transactionAnalytics';

interface CategoriesDashboardProps {
  transactions: Transaction[];
  categories: Category[];
  budgets?: Budget[] | Record<string, number>;
  user: UserProfile;
  currentMonthPrefix: string;
  initialSelectedCategoryId?: string | null;
}

export const CategoriesDashboard: React.FC<CategoriesDashboardProps> = ({
  transactions,
  categories,
  budgets = [],
  user,
  currentMonthPrefix,
  initialSelectedCategoryId = null,
}) => {
  const [targetType, setTargetType] = useState<'expense' | 'income'>('expense');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialSelectedCategoryId);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'name' | 'percentage'>('amount');

  // 1. Processar dados agregados de Categorias no Período
  const categoryAnalytics = useMemo(() => {
    const map: Record<
      string,
      {
        id: string;
        name: string;
        icon: string;
        color: string;
        amount: number;
        count: number;
        subcategories: Record<string, { id: string; name: string; icon: string; amount: number; count: number }>;
        transactions: Transaction[];
      }
    > = {};

    transactions
      .filter(t => t.type === targetType)
      .forEach(t => {
        const entries = getAnalyticalEntries(t);
        entries.forEach(entry => {
          if (entry.includeInReports === false) return;
          const resolved = resolveCategory(categories, entry.categoryId, entry.subcategoryId, targetType);
          const parentId = resolved.id;
          const parentName = resolved.name;
          const parentIcon = resolved.icon || '🏷️';
          const parentColor = resolved.color || '#9333ea';

          if (!map[parentId]) {
            map[parentId] = {
              id: parentId,
              name: parentName,
              icon: parentIcon,
              color: parentColor,
              amount: 0,
              count: 0,
              subcategories: {},
              transactions: [],
            };
          }

          map[parentId].amount += entry.amount;
          map[parentId].count += 1;
          map[parentId].transactions.push(t);

          // Subcategorias
          let subId = resolved.subId || entry.subcategoryId || `geral_${parentId}`;
          let subName = resolved.subName || `${parentName} (Geral)`;
          let subIcon = resolved.subIcon || parentIcon;

          if (!map[parentId].subcategories[subId]) {
            map[parentId].subcategories[subId] = {
              id: subId,
              name: subName,
              icon: subIcon,
              amount: 0,
              count: 0,
            };
          }
          map[parentId].subcategories[subId].amount += entry.amount;
          map[parentId].subcategories[subId].count += 1;
        });
      });

    const total = Object.values(map).reduce((sum, item) => sum + item.amount, 0);

    let items = Object.values(map).map(cat => {
      const percentage = total > 0 ? (cat.amount / total) * 100 : 0;
      const subList = Object.values(cat.subcategories).sort((a, b) => b.amount - a.amount);

      // Orçamento associado (se houver)
      let budgetAmount: number | null = null;
      if (Array.isArray(budgets)) {
        const b = budgets.find(x => x.categoryId === cat.id);
        if (b) budgetAmount = b.limit;
      } else if (budgets && typeof budgets === 'object') {
        const b = (budgets as Record<string, number>)[cat.id];
        if (typeof b === 'number') budgetAmount = b;
      }

      const budgetUsage = budgetAmount && budgetAmount > 0 ? (cat.amount / budgetAmount) * 100 : null;

      return {
        ...cat,
        percentage,
        subcategoriesList: subList,
        budgetAmount,
        budgetUsage,
        averageTicket: cat.count > 0 ? cat.amount / cat.count : 0,
      };
    });

    if (sortBy === 'amount') {
      items.sort((a, b) => b.amount - a.amount);
    } else if (sortBy === 'percentage') {
      items.sort((a, b) => b.percentage - a.percentage);
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      items,
      total,
      count: items.length,
    };
  }, [transactions, categories, budgets, targetType, sortBy]);

  // Categoria atualmente selecionada para drill-down
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return null;
    return categoryAnalytics.items.find(c => c.id === selectedCategoryId) || null;
  }, [categoryAnalytics, selectedCategoryId]);

  // Filtragem de transações dentro do drill-down por termo de busca
  const filteredCategoryTxs = useMemo(() => {
    if (!selectedCategory) return [];
    if (!searchTerm.trim()) return selectedCategory.transactions;
    const term = searchTerm.toLowerCase();
    return selectedCategory.transactions.filter(
      t =>
        (t.description && t.description.toLowerCase().includes(term)) ||
        formatDate(t.date).toLowerCase().includes(term)
    );
  }, [selectedCategory, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 1. TOPO: TÍTULO, ALTERNADOR DE TIPO (DESPESAS/RECEITAS) E ORDENAÇÃO */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Análise por Centros de Custo & Categorias</span>
          </h3>
          <p className="text-xs text-slate-400">
            Detalhamento profundo de gastos, participação percentual e orçamentos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador Despesas / Receitas */}
          <div className="p-1 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 flex items-center text-xs font-bold shadow-xs">
            <button
              type="button"
              onClick={() => {
                setTargetType('expense');
                setSelectedCategoryId(null);
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                targetType === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Despesas
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetType('income');
                setSelectedCategoryId(null);
              }}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                targetType === 'income'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Receitas
            </button>
          </div>
        </div>
      </div>

      {/* 2. GRID PRINCIPAL: LISTA DE CATEGORIAS (ESQUERDA) + PAINEL DE DRILL-DOWN (DIREITA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Ranking e Progresso */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400">
            <span>
              {categoryAnalytics.count} Categorias ({formatCurrency(categoryAnalytics.total, user.currency, !user.showValues)})
            </span>
            <span className="text-[11px]">Clique para detalhar</span>
          </div>

          {categoryAnalytics.items.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
              Nenhuma movimentação de {targetType === 'expense' ? 'despesa' : 'receita'} no período.
            </div>
          ) : (
            <div className="space-y-2.5">
              {categoryAnalytics.items.map(cat => {
                const isSelected = selectedCategoryId === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-400 dark:border-purple-600 shadow-sm'
                        : 'bg-white dark:bg-[#1E222D] border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center text-base shrink-0 font-bold"
                          style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate flex items-center gap-2">
                            <span>{cat.name}</span>
                            {isSelected && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-600 text-white font-bold">
                                Selecionado
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {cat.count} lançamentos • Ticket médio: {formatCurrency(cat.averageTicket, user.currency, !user.showValues)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(cat.amount, user.currency, !user.showValues)}
                        </div>
                        <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                          {cat.percentage.toFixed(1)}% do total
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso da Categoria */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, cat.percentage)}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>

                    {/* Meta/Orçamento (se existente) */}
                    {cat.budgetAmount !== null && (
                      <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Target className="w-3 h-3 text-purple-500" />
                          <span>Orçamento: {formatCurrency(cat.budgetAmount, user.currency, !user.showValues)}</span>
                        </span>
                        <span
                          className={
                            (cat.budgetUsage || 0) > 100
                              ? 'text-rose-500 font-black'
                              : (cat.budgetUsage || 0) > 85
                              ? 'text-amber-500'
                              : 'text-emerald-500'
                          }
                        >
                          {(cat.budgetUsage || 0).toFixed(0)}% do teto
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coluna Direita: Detalhamento da Categoria Selecionada (Drill-Down) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCategory ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-purple-300 dark:border-purple-700 shadow-md space-y-5 animate-in fade-in">
              {/* Header do Drill-Down */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold"
                    style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
                  >
                    {selectedCategory.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedCategory.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      Detalhamento analítico e subcategorias
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(selectedCategory.amount, user.currency, !user.showValues)}
                  </div>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    {selectedCategory.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Subcategorias */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Subcategorias
                </h5>
                <div className="space-y-2">
                  {selectedCategory.subcategoriesList.map(sub => {
                    const subPct = selectedCategory.amount > 0 ? (sub.amount / selectedCategory.amount) * 100 : 0;

                    return (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                          <span className="flex items-center gap-1.5 truncate">
                            <span>{sub.icon}</span>
                            <span className="truncate">{sub.name}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            {formatCurrency(sub.amount, user.currency, !user.showValues)}
                            <span className="text-[10px] text-slate-400 ml-1">({subPct.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${subPct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transações da Categoria */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Transações ({selectedCategory.transactions.length})
                  </h5>
                </div>

                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filtrar por descrição ou data..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                  {filteredCategoryTxs.map(t => (
                    <div key={t.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {t.description || selectedCategory.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(t.date)}
                        </div>
                      </div>
                      <div className="font-black text-slate-900 dark:text-white shrink-0">
                        {formatCurrency(t.amount, user.currency, !user.showValues)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#1E222D] border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
              <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nenhuma categoria selecionada
              </h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Selecione qualquer categoria na lista ao lado para abrir o raio-x analítico de subcategorias e movimentações.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
