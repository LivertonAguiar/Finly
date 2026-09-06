import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CreditCard,
  Layers,
  Info,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Transaction } from '../../types';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { resolveCategory } from '../../utils/categoryResolver';
import { getEffectiveTransactionDate } from '../../utils/invoiceCalculator';
import { FilterPopover, FilterState } from '../ui/FilterPopover';
import { TransactionModal } from '../transactions/TransactionModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';

export const CalendarPage: React.FC = () => {
  const { confirm } = useConfirm();
  const {
    transactions,
    categories,
    accounts,
    cards,
    deleteTransaction,
    toggleTransactionStatus,
    user,
  } = useFinancial();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayString());
  const [filters, setFilters] = useState<FilterState>({
    period: 'current_month',
    customStartDate: '',
    customEndDate: '',
    selectedUserIds: [],
    selectedAccountIds: [],
    selectedCardIds: [],
    selectedCategoryIds: [],
    status: 'all',
    type: 'all',
  });

  // Transaction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);

  // Month navigation
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed
  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  // Days calculation for Calendar Grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = getTodayString();

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      const dateStr = d.toISOString().substring(0, 10);
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month filler days to complete 35 or 42 cells (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().substring(0, 10);
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  const [viewRegime, setViewRegime] = useState<'due_date' | 'purchase_date'>('due_date');

  // Aggregate transactions by date (projected by due_date or purchase_date)
  const transactionsByDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; transactions: Transaction[] }> = {};

    transactions.forEach(t => {
      // Exclude ignored
      if (t.ignored) return;

      // Status filter
      if (filters.status && filters.status !== 'all' && t.status !== filters.status) return;

      // Type filter
      if (filters.type && filters.type !== 'all' && t.type !== filters.type) return;

      // Account filter
      if (filters.selectedAccountIds && filters.selectedAccountIds.length > 0) {
        if (!t.accountId || !filters.selectedAccountIds.includes(t.accountId)) return;
      }

      // Card filter
      if (filters.selectedCardIds && filters.selectedCardIds.length > 0) {
        if (!t.cardId || !filters.selectedCardIds.includes(t.cardId)) return;
      }

      // Category filter
      if (filters.selectedCategoryIds && filters.selectedCategoryIds.length > 0) {
        const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, t.type);
        if (!filters.selectedCategoryIds.includes(t.categoryId) && !filters.selectedCategoryIds.includes(resolved.id)) {
          return;
        }
      }

      // User filter
      if (filters.selectedUserIds && filters.selectedUserIds.length > 0) {
        if ((t as any).userId && !filters.selectedUserIds.includes((t as any).userId)) return;
      }

      const card = cards.find(c => c.id === t.cardId);
      const effectiveDate = getEffectiveTransactionDate(t, card, viewRegime);

      if (!map[effectiveDate]) {
        map[effectiveDate] = { income: 0, expense: 0, transactions: [] };
      }
      map[effectiveDate].transactions.push(t);
      if (t.type === 'income') {
        map[effectiveDate].income += t.amount;
      } else if (t.type === 'expense') {
        map[effectiveDate].expense += t.amount;
      }
    });

    return map;
  }, [transactions, filters, viewRegime, cards, categories]);

  // Selected Day Details
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return transactionsByDate[selectedDate] || { income: 0, expense: 0, transactions: [] };
  }, [selectedDate, transactionsByDate]);

  const selectedDayFormatted = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return selectedDate;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12);
    const dayOfWeek = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = parts[2];
    const mName = d.toLocaleDateString('pt-BR', { month: 'long' });
    return `${day} de ${mName}, ${dayOfWeek}`;
  }, [selectedDate]);

  // Robust category lookup
  const findCategory = (catId?: string, subId?: string, type?: any) => {
    return resolveCategory(categories, catId, subId, type || 'expense');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. TOP HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0 shadow-xs">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Calendário
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Acompanhe o vencimento de contas, receitas e parcelas dia a dia
            </p>
          </div>
        </div>

        {/* Month Navigator & Regime Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Regime Toggle */}
          <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 text-[11px] font-bold shadow-xs">
            <button
              type="button"
              onClick={() => setViewRegime('due_date')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                viewRegime === 'due_date'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibe compras de cartão no dia do vencimento da fatura (Fluxo de Caixa Real)"
            >
              <span>Vencimento</span>
            </button>
            <button
              type="button"
              onClick={() => setViewRegime('purchase_date')}
              className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
                viewRegime === 'purchase_date'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibe compras de cartão no dia da compra"
            >
              <span>Compra</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-4 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 shadow-xs">
              {capitalizedMonth} {year}
            </span>
            <button
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              className="p-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <FilterPopover
              filters={filters}
              onFilterChange={setFilters}
              categories={categories}
              accounts={accounts}
              cards={cards}
              currentUser={user}
              showPeriod={false}
              showUser={true}
              showAccounts={true}
              showCards={true}
              showCategories={true}
              showStatus={true}
              showType={true}
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN RESPONSIVE LAYOUT (MOBILLS CALENDARIO SPEC) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: CALENDAR GRID (COL-SPAN-8) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>dom</span>
            <span>seg</span>
            <span>ter</span>
            <span>qua</span>
            <span>qui</span>
            <span>sex</span>
            <span>sáb</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((day, idx) => {
              const data = transactionsByDate[day.dateStr];
              const hasDebits = data && data.expense > 0;
              const hasCredits = data && data.income > 0;
              const isSelected = selectedDate === day.dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  className={`min-h-[75px] sm:min-h-[90px] p-2 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 ring-2 ring-purple-600/30'
                      : day.isToday
                      ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : day.isCurrentMonth
                      ? 'border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-[#343437]/30 hover:bg-slate-100 dark:hover:bg-[#343437]/80'
                      : 'border-transparent opacity-30 hover:opacity-60'
                  }`}
                >
                  {/* Top: Day Number + Today indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isSelected
                          ? 'text-purple-600 dark:text-purple-400 font-black'
                          : day.isToday
                          ? 'text-emerald-500 font-black'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    {day.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Hoje" />
                    )}
                  </div>

                  {/* Bottom: Debits & Credits Totals */}
                  <div className="space-y-0.5 text-[10px] sm:text-[11px] font-bold text-right truncate">
                    {hasCredits && (
                      <span className="block text-[#66bb6a] truncate">
                        +{formatCurrency(data.income, user.currency, !user.showValues)}
                      </span>
                    )}
                    {hasDebits && (
                      <span className="block text-[#ef5350] truncate">
                        -{formatCurrency(data.expense, user.currency, !user.showValues)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: DETALHES DO DIA (COL-SPAN-4 - MOBILLS SPEC) */}
        <div className="lg:col-span-4 p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header & Filter Toggle */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Detalhes
              </h3>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={filters.status === 'pending'}
                  onChange={e => setFilters({ ...filters, status: e.target.checked ? 'pending' : 'all' })}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                />
                <span>Somente pendentes</span>
              </label>
            </div>

            {/* Selected Date or Empty State */}
            {!selectedDate ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-xs text-slate-400">
                  Clique no dia do calendário ao lado para saber os detalhes das despesas ou receitas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Date Title */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white capitalize">
                    {selectedDayFormatted}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mt-1">
                    <span className="text-[#ef5350]">
                      Despesas: {formatCurrency(selectedDayData?.expense || 0, user.currency, !user.showValues)}
                    </span>
                    <span className="text-[#66bb6a]">
                      Receitas: {formatCurrency(selectedDayData?.income || 0, user.currency, !user.showValues)}
                    </span>
                  </div>
                </div>

                {/* List of Transactions for that day */}
                {selectedDayData?.transactions.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <p className="text-xs text-slate-400">Nenhum lançamento neste dia.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {selectedDayData?.transactions.map(t => {
                      const cat = findCategory(t.categoryId, t.subcategoryId);
                      const acc = accounts.find(a => a.id === t.accountId);
                      const card = cards.find(c => c.id === t.cardId);
                      const isIncome = t.type === 'income';
                      const isExpense = t.type === 'expense';

                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailTx(t);
                          }}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-[#343437]/50 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 group hover:border-purple-500/40 transition-colors cursor-pointer"
                        >
                          {/* Left: Status + Icon + Title */}
                          <div className="flex items-center gap-2.5 min-w-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => toggleTransactionStatus(t.id)}
                              className="shrink-0 cursor-pointer text-slate-400 hover:text-purple-600"
                            >
                              {t.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-amber-500" />
                              )}
                            </button>

                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-xs"
                              style={{
                                backgroundColor: (cat?.color || '#7c4dff') + '20',
                                color: cat?.color || '#7c4dff',
                              }}
                            >
                              {cat?.icon || (isIncome ? '💰' : '📁')}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {t.description}
                              </p>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {card ? `Cartão ${card.name}` : acc ? acc.name : cat?.name || 'Geral'}
                              </span>
                            </div>
                          </div>

                          {/* Right: Amount & Actions */}
                          <div className="text-right shrink-0">
                            <span
                              className={`text-xs font-black block ${
                                isIncome ? 'text-[#66bb6a]' : isExpense ? 'text-[#ef5350]' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isIncome ? '+' : isExpense ? '-' : ''}{' '}
                              {formatCurrency(t.amount, user.currency, !user.showValues)}
                            </span>

                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={async () => {
                                  setEditingTransaction(t);
                                  setIsModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={async () => {
                                  const ok = await confirm({
                                    title: 'Excluir Lançamento',
                                    message: `Deseja excluir "${t.description}"?`,
                                    confirmText: 'Excluir',
                                    type: 'danger'
                                  });
                                  if (ok) {
                                    deleteTransaction(t.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Button: Adicionar Despesa no dia selecionado */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={async () => {
                setEditingTransaction(null);
                setIsModalOpen(true);
              }}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          editingTransaction={editingTransaction}
        />
      )}

      {/* Transaction Detail Modal */}
      {selectedDetailTx && (
        <TransactionDetailModal
          isOpen={!!selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
          transaction={selectedDetailTx}
          onEdit={(tx) => {
            setEditingTransaction(tx);
            setIsModalOpen(true);
          }}
          onDuplicate={(tx) => {
            setEditingTransaction({
              ...tx,
              id: '',
              description: `${tx.description} (Cópia)`,
            });
            setIsModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
