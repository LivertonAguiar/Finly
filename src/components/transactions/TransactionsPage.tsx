import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  TrendingDown,
  TrendingUp,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  Upload,
  Calendar,
  Layers,
  MoreVertical,
  Table as TableIcon,
  List as ListIcon,
  DollarSign,
  FileSpreadsheet,
  Scale,
  Building2,
  Check,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { Transaction, TransactionType } from '../../types';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { resolveCategory } from '../../utils/categoryResolver';
import { getEffectiveTransactionDate } from '../../utils/invoiceCalculator';
import { BankLogo } from '../../utils/bankLogos';
import { FilterPopover, FilterState } from '../ui/FilterPopover';
import { TransactionModal } from './TransactionModal';
import { TransactionDetailModal } from './TransactionDetailModal';
import { downloadCSV } from '../../utils/reportExportService';
import { exportTransactionsToExcel } from '../../utils/excelExportService';

export const TransactionsPage: React.FC = () => {
  const { confirm } = useConfirm();
  const {
    transactions,
    categories,
    accounts,
    cards,
    deleteTransaction,
    toggleTransactionStatus,
    reimburseThirdPartyTransaction,
    user,
  } = useFinancial();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [filterType, setFilterType] = useState<string>('all'); // 'all' | 'expense' | 'income' | 'transfer'
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  // Unified Filter State
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

  // Transaction Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>('expense');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<'account' | 'card'>('account');
  const [isNovoMenuOpen, setIsNovoMenuOpen] = useState(false);
  const [viewRegime, setViewRegime] = useState<'due_date' | 'purchase_date'>('due_date');

  // Month navigation
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  // Filtered transactions based on unified filters period
  const monthTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = getTodayString();

    return transactions.filter(t => {
      const card = cards.find(c => c.id === t.cardId);
      const effectiveDate = getEffectiveTransactionDate(t, card, viewRegime);

      // Period Matching
      const period = filters.period || 'current_month';
      if (period === 'current_month') {
        if (!effectiveDate.startsWith(currentMonthPrefix)) return false;
      } else if (period === 'today') {
        if (effectiveDate !== todayStr) return false;
      } else if (period === 'week') {
        const d = new Date(effectiveDate + 'T12:00:00');
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(now.getDate() - now.getDay());
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
        if (d < firstDayOfWeek || d > lastDayOfWeek) return false;
      } else if (period === 'last_30_days') {
        const d = new Date(effectiveDate + 'T12:00:00');
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (d < thirtyDaysAgo || d > now) return false;
      } else if (period === 'prev_month') {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevPrefix = prev.toISOString().substring(0, 7);
        if (!effectiveDate.startsWith(prevPrefix)) return false;
      } else if (period === 'next_month') {
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextPrefix = next.toISOString().substring(0, 7);
        if (!effectiveDate.startsWith(nextPrefix)) return false;
      } else if (period === 'current_year') {
        if (!effectiveDate.startsWith(String(now.getFullYear()))) return false;
      } else if (period === 'custom') {
        if (filters.customStartDate && effectiveDate < filters.customStartDate) return false;
        if (filters.customEndDate && effectiveDate > filters.customEndDate) return false;
      }

      return true;
    });
  }, [transactions, currentMonthPrefix, viewRegime, cards, filters.period, filters.customStartDate, filters.customEndDate]);

  const monthlyIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income' && t.status === 'completed' && !t.ignored)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense' && t.status === 'completed' && !t.ignored)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthlyBalance = monthlyIncome - monthlyExpense;

  const totalCurrentBalance = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  // Detailed Status Badge Renderer (Icon + Text)
  const getStatusBadge = (t: Transaction) => {
    const isIncome = t.type === 'income';
    const isTransfer = t.type === 'transfer';
    const isCard = !!t.cardId;
    const isCompleted = t.status === 'completed';

    let label = '';
    let styleClass = '';
    let icon = null;

    if (t.isThirdParty) {
      if (t.reimbursed) {
        label = `${t.thirdPartyName || 'Terceiro'} (Reembolsado)`;
        styleClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
        icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      } else {
        label = `${t.thirdPartyName || 'Terceiro'} (A Reembolsar)`;
        styleClass = 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/25';
        icon = <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      }
    } else if (t.ignored) {
      label = 'Ignorada';
      styleClass = 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30 hover:bg-slate-500/25';
      icon = <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    } else if (isIncome) {
      if (isCompleted) {
        label = 'Recebida';
        styleClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
        icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      } else {
        label = 'A receber';
        styleClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25';
        icon = <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      }
    } else if (isTransfer) {
      if (isCompleted) {
        label = 'Efetivada';
        styleClass = 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/25';
        icon = <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      } else {
        label = 'Pendente';
        styleClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25';
        icon = <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      }
    } else {
      // Expense
      if (isCard) {
        if (isCompleted) {
          label = 'Pago (Cartão)';
          styleClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
          icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
        } else {
          label = 'Pendente (Cartão)';
          styleClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25';
          icon = <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
        }
      } else {
        if (isCompleted) {
          label = 'Paga';
          styleClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
          icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
        } else {
          label = 'A pagar';
          styleClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25';
          icon = <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
        }
      }
    }

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleTransactionStatus(t.id);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs shrink-0 ${styleClass}`}
        title={`Situação: ${label} (Clique para alternar)`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  // Robust category lookup
  const findCategory = (catId?: string, subId?: string, type?: TransactionType) => {
    return resolveCategory(categories, catId, subId, type || 'expense');
  };

  // Filtered display transactions
  const displayTransactions = useMemo(() => {
    return monthTransactions
      .filter(t => {
        // Type filter (from topbar dropdown or popover)
        const activeType = filters.type && filters.type !== 'all' ? filters.type : filterType;
        if (activeType !== 'all' && t.type !== activeType) return false;

        // Status filter
        if (filters.status && filters.status !== 'all' && t.status !== filters.status) return false;

        // Account filter
        if (filters.selectedAccountIds && filters.selectedAccountIds.length > 0) {
          if (!t.accountId || !filters.selectedAccountIds.includes(t.accountId)) return false;
        }

        // Card filter
        if (filters.selectedCardIds && filters.selectedCardIds.length > 0) {
          if (!t.cardId || !filters.selectedCardIds.includes(t.cardId)) return false;
        }

        // Category filter
        if (filters.selectedCategoryIds && filters.selectedCategoryIds.length > 0) {
          const resolved = findCategory(t.categoryId, t.subcategoryId, t.type);
          if (!filters.selectedCategoryIds.includes(t.categoryId) && !filters.selectedCategoryIds.includes(resolved.id)) {
            return false;
          }
        }

        // User filter
        if (filters.selectedUserIds && filters.selectedUserIds.length > 0) {
          if ((t as any).userId && !filters.selectedUserIds.includes((t as any).userId)) return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const descMatch = t.description.toLowerCase().includes(term);
          const cat = findCategory(t.categoryId, t.subcategoryId, t.type);
          const catMatch = cat ? cat.name.toLowerCase().includes(term) : false;
          return descMatch || catMatch;
        }
        return true;
      })
      .sort((a, b) => {
        const cardA = cards.find(c => c.id === a.cardId);
        const cardB = cards.find(c => c.id === b.cardId);
        const dateA = getEffectiveTransactionDate(a, cardA, viewRegime);
        const dateB = getEffectiveTransactionDate(b, cardB, viewRegime);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }, [monthTransactions, filterType, filters, searchTerm, categories, viewRegime, cards]);

  // Group by date for timeline view
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; displayDate: string; items: Transaction[]; dayTotal: number; isToday: boolean }[] = [];
    const map: Record<string, Transaction[]> = {};
    const todayStr = getTodayString();

    displayTransactions.forEach(t => {
      const card = cards.find(c => c.id === t.cardId);
      const effectiveDate = getEffectiveTransactionDate(t, card, viewRegime);
      if (!map[effectiveDate]) map[effectiveDate] = [];
      map[effectiveDate].push(t);
    });

    Object.keys(map)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach(dateStr => {
        const items = map[dateStr];
        const dayTotal = items.reduce((sum, t) => {
          if (t.type === 'income') return sum + t.amount;
          if (t.type === 'expense') return sum - t.amount;
          return sum;
        }, 0);

        const d = new Date(dateStr + 'T12:00:00');
        const dayOfWeek = d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
        const dayNum = String(d.getDate()).padStart(2, '0');
        const monthShort = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

        groups.push({
          date: dateStr,
          displayDate: `${dayNum} ${monthShort}, ${dayOfWeek}`,
          items,
          dayTotal,
          isToday: dateStr === todayStr,
        });
      });

    return groups;
  }, [displayTransactions, viewRegime, cards]);

  // Ref & Callback to auto-scroll to today's transactions
  const hasScrolledToTodayRef = useRef(false);

  const scrollToToday = useCallback((smooth = true) => {
    const todayStr = getTodayString();

    // 1. Timeline View: try exact element
    let targetEl = document.getElementById(`day-group-${todayStr}`);

    // If today has no direct transactions, find the closest group (first group <= todayStr)
    if (!targetEl && groupedTransactions.length > 0) {
      const closestGroup = groupedTransactions.find(g => g.date <= todayStr) || groupedTransactions[groupedTransactions.length - 1];
      if (closestGroup) {
        targetEl = document.getElementById(`day-group-${closestGroup.date}`);
      }
    }

    // 2. Table View fallback
    if (!targetEl && viewMode === 'table') {
      targetEl = document.getElementById('table-row-today');
    }

    if (targetEl) {
      targetEl.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'center',
      });
    }
  }, [groupedTransactions, viewMode]);

  useEffect(() => {
    // Auto scroll to today on initial mount if viewing current month
    if (!hasScrolledToTodayRef.current && selectedMonthOffset === 0 && (groupedTransactions.length > 0 || displayTransactions.length > 0)) {
      const timer = setTimeout(() => {
        scrollToToday(true);
        hasScrolledToTodayRef.current = true;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [groupedTransactions, displayTransactions, selectedMonthOffset, scrollToToday]);

  
  const handleDeleteTransaction = async (tx: Transaction) => {
    const ok = await confirm({
      title: 'Excluir Lançamento',
      message: `Deseja realmente excluir "${tx.description}" no valor de ${formatCurrency(tx.amount, user.currency)}?`,
      confirmText: 'Excluir',
      type: 'danger',
    });
    if (ok) {
      deleteTransaction(tx.id);
    }
  };

  const handleExportCSV = async () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta/Cartão', 'Valor', 'Status'];
    const rows = displayTransactions.map(t => {
      const cat = findCategory(t.categoryId, t.subcategoryId);
      const acc = accounts.find(a => a.id === t.accountId);
      const card = cards.find(c => c.id === t.cardId);
      const tipoStr = t.type === 'expense' ? 'Despesa' : t.type === 'income' ? 'Receita' : 'Transferência';
      const statusStr = t.status === 'completed' ? 'Concluído' : 'Pendente';
      return [
        formatDate(t.date),
        tipoStr,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${cat ? cat.name : 'Outros'}"`,
        `"${acc ? acc.name : card ? card.name : ''}"`,
        (t.type === 'expense' ? -t.amount : t.amount).toFixed(2).replace('.', ','),
        statusStr,
      ].join(';');
    });

    await downloadCSV(
      `transacoes_${currentMonthPrefix}.csv`,
      [headers.join(';'), ...rows].join('\n'),
      'Lançamentos Finly (CSV)'
    );
    setIsMoreOptionsOpen(false);
  };

  const handleExportExcel = async () => {
    await exportTransactionsToExcel(
      displayTransactions,
      categories,
      accounts,
      cards,
      `Finly_Transacoes_${currentMonthPrefix}`
    );
    setIsMoreOptionsOpen(false);
  };

  const filterOptions = [
    { id: 'all', label: 'Todas as transações', dotColor: 'bg-[#7c4dff]' },
    { id: 'expense', label: 'Despesas', dotColor: 'bg-[#ef5350]' },
    { id: 'income', label: 'Receitas', dotColor: 'bg-[#66bb6a]' },
    { id: 'transfer', label: 'Transferências', dotColor: 'bg-[#42a5f5]' },
  ];

  const currentOption = filterOptions.find(o => o.id === filterType) || filterOptions[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. TOPBAR HEADER (FINLY HEADER LAYOUT) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Type Dropdown Popover */}
        <div className="relative">
          <button
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-white shadow-sm hover:border-purple-500 transition-colors cursor-pointer"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${currentOption.dotColor} shrink-0`} />
            <span>{currentOption.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Floating Dropdown Popover (Finly Design) */}
          {isTypeDropdownOpen && (
            <div
              onClick={e => e.stopPropagation()}
              className="absolute left-0 top-11 z-40 w-56 rounded-[22px] bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-2xl py-2 animate-in fade-in zoom-in-95"
            >
              {filterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setFilterType(opt.id);
                    setIsTypeDropdownOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-3 transition-colors cursor-pointer ${
                    filterType === opt.id
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor} shrink-0`} />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: + NOVA RECEITA/DESPESA + Search + Filter + More Options */}
        <div className="flex items-center gap-2.5">
          {/* Search Toggle Input */}
          {isSearchOpen && (
            <div className="relative animate-in fade-in slide-in-from-right-4">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar lançamentos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                autoFocus
                className="pl-8 pr-3.5 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#2C2C2E] text-xs text-slate-900 dark:text-white w-48 shadow-xs"
              />
            </div>
          )}





          {/* Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-purple-600 shadow-xs cursor-pointer"
            title="Pesquisar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Unified Filter Popover */}
          <FilterPopover
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            accounts={accounts}
            cards={cards}
            currentUser={user}
            showPeriod={true}
            showUser={true}
            showAccounts={true}
            showCards={true}
            showCategories={true}
            showStatus={true}
            showType={true}
            customPeriodLabel={capitalizedMonth + ' ' + yearNum}
          />

          {/* More Options (3 Dots) */}
          <div className="relative">
            <button
              onClick={() => setIsMoreOptionsOpen(!isMoreOptionsOpen)}
              className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-purple-600 shadow-xs cursor-pointer"
              title="Mais opções"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMoreOptionsOpen && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-11 z-40 w-48 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-2xl py-1.5 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                <button
                  onClick={handleExportExcel}
                  className="w-full px-3.5 py-2 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-bold"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exportar Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode(viewMode === 'timeline' ? 'table' : 'timeline');
                    setIsMoreOptionsOpen(false);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2 cursor-pointer"
                >
                  {viewMode === 'timeline' ? <TableIcon className="w-3.5 h-3.5" /> : <ListIcon className="w-3.5 h-3.5" />}
                  <span>Alternar para {viewMode === 'timeline' ? 'Tabela' : 'Linha do Tempo'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. 4 TOP SUMMARY KPIS (INTERACTIVE FILTER BUTTONS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Saldo atual */}
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`p-4 rounded-[25px] border shadow-sm dark:shadow-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group ${
            filterType === 'all'
              ? 'bg-white dark:bg-[#2C2C2E] border-blue-500/50 ring-2 ring-blue-500/30'
              : 'bg-white/90 dark:bg-[#2C2C2E]/90 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-[#2C2C2E]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#42a5f5]/15 text-[#42a5f5] flex items-center justify-center font-black shrink-0 group-hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold truncate">
              <span>Saldo atual</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight mt-0.5 truncate">
              {formatCurrency(totalCurrentBalance, user.currency, !user.showValues)}
            </p>
          </div>
        </button>

        {/* KPI 2: Despesas (Click to filter Despesas) */}
        <button
          type="button"
          onClick={() => setFilterType(filterType === 'expense' ? 'all' : 'expense')}
          className={`p-4 rounded-[25px] border shadow-sm dark:shadow-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group ${
            filterType === 'expense'
              ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/40'
              : 'bg-white dark:bg-[#2C2C2E] border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-[#343437]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#ef5350]/15 text-[#ef5350] flex items-center justify-center font-black shrink-0 group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold truncate">
              <span>Despesas</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm sm:text-base font-black text-[#ef5350] tracking-tight mt-0.5 truncate">
              {formatCurrency(monthlyExpense, user.currency, !user.showValues)}
            </p>
          </div>
        </button>

        {/* KPI 3: Receitas recebidas (Click to filter Receitas) */}
        <button
          type="button"
          onClick={() => setFilterType(filterType === 'income' ? 'all' : 'income')}
          className={`p-4 rounded-[25px] border shadow-sm dark:shadow-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group ${
            filterType === 'income'
              ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40'
              : 'bg-white dark:bg-[#2C2C2E] border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-[#343437]'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#66bb6a] text-white flex items-center justify-center font-black shrink-0 group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold truncate">
              <span>Receitas recebidas</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className="text-sm sm:text-base font-black text-[#66bb6a] tracking-tight mt-0.5 truncate">
              {formatCurrency(monthlyIncome, user.currency, !user.showValues)}
            </p>
          </div>
        </button>

        {/* KPI 4: Total / Balanço (Click to reset filter) */}
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`p-4 rounded-[25px] border shadow-sm dark:shadow-2xl flex items-center gap-3.5 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group ${
            filterType === 'all'
              ? 'bg-white dark:bg-[#2C2C2E] border-slate-200/80 dark:border-slate-800/80'
              : 'bg-white dark:bg-[#2C2C2E] border-slate-200/80 dark:border-slate-800/80'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-[#66bb6a] text-white flex items-center justify-center font-black shrink-0 group-hover:scale-110 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-bold truncate">
              <span>Total</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <p className={`text-sm sm:text-base font-black tracking-tight mt-0.5 truncate ${monthlyBalance >= 0 ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
              {formatCurrency(monthlyBalance, user.currency, !user.showValues)}
            </p>
          </div>
        </button>
      </div>

      {/* 2.5 VIEW REGIME TOGGLE (CAIXA VS COMPETÊNCIA) */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setViewRegime('due_date')}
            className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              viewRegime === 'due_date'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Exibe compras de cartão no dia do vencimento da fatura (Fluxo de Caixa Real)"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Por Vencimento (Caixa)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewRegime('purchase_date')}
            className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
              viewRegime === 'purchase_date'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Exibe compras de cartão no dia exato em que a compra ocorreu (Competência)"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Por Data da Compra</span>
          </button>
        </div>
      </div>

      {/* 3. MONTH NAVIGATOR (PILL BAR) */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedMonthOffset(prev => prev - 1)}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Mês anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-4 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-purple-500/40 shadow-xs">
          {capitalizedMonth} {yearNum}
        </span>
        <button
          type="button"
          onClick={() => setSelectedMonthOffset(prev => prev + 1)}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Próximo mês"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Quick jump to Today */}
        <button
          type="button"
          onClick={() => {
            if (selectedMonthOffset !== 0) {
              setSelectedMonthOffset(0);
              setTimeout(() => scrollToToday(true), 200);
            } else {
              scrollToToday(true);
            }
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer shadow-xs active:scale-95 ${
            selectedMonthOffset === 0
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-purple-600 dark:hover:text-purple-400'
          }`}
          title="Ir para o dia de hoje"
        >
          <Calendar className="w-3.5 h-3.5 text-purple-500" />
          <span>Hoje</span>
        </button>
      </div>

      {/* 4. TRANSACTION LIST / TIMELINE (FINLY TIMELINE) */}
      {displayTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-slate-400 text-xs space-y-2">
          <p>Nenhuma transação encontrada para os filtros selecionados.</p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div
              key={group.date}
              id={`day-group-${group.date}`}
              className={`p-5 rounded-[25px] border shadow-sm dark:shadow-2xl space-y-3 transition-all duration-300 ${
                group.isToday
                  ? 'bg-white dark:bg-[#2C2C2E] border-purple-500/70 dark:border-purple-500/60 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/5'
                  : 'bg-white dark:bg-[#2C2C2E] border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {group.displayDate}
                  </span>
                  {group.isToday && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                      Hoje
                    </span>
                  )}
                </div>
                <span className={`text-xs font-extrabold ${group.dayTotal >= 0 ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
                  {formatCurrency(group.dayTotal, user.currency, !user.showValues)}
                </span>
              </div>

              {/* Transactions in Day */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {group.items.map(t => {
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
                      className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-2.5 sm:gap-3 group hover:bg-slate-50 dark:hover:bg-[#343437]/50 px-2 sm:px-2.5 rounded-2xl transition-colors cursor-pointer"
                    >
                      {/* Left: Status (desktop) + Category Icon + Info */}
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* On desktop (sm:), show status badge on the far left */}
                        <div className="hidden sm:flex shrink-0">
                          {getStatusBadge(t)}
                        </div>

                        {/* Category Icon */}
                        <div
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: (cat?.color || '#7c4dff') + '20', color: cat?.color || '#7c4dff' }}
                        >
                          {cat?.icon || (isIncome ? '💰' : '📁')}
                        </div>

                        {/* Description & Metadata with full space */}
                        <div className="min-w-0 flex-1 pr-1">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">
                            <span className="uppercase font-bold text-slate-500 dark:text-slate-400 shrink-0">{cat?.name || 'Geral'}</span>
                            {card ? (
                              <span className="truncate">• Cartão {card.name}</span>
                            ) : acc ? (
                              <span className="truncate">• {acc.name}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Status (mobile) + Action buttons */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2.5 shrink-0 text-right">
                        {t.isThirdParty && !t.reimbursed && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                title: 'Registrar Reembolso',
                                message: `Confirmar que ${t.thirdPartyName || 'a pessoa'} reembolsou o valor de ${formatCurrency(t.amount, user.currency)}? Será criada uma receita na sua conta bancária.`,
                                confirmText: 'Receber Reembolso',
                                type: 'info'
                              });
                              if (ok) {
                                reimburseThirdPartyTransaction(t.id, accounts[0]?.id || 'acc-carteira-padrao');
                              }
                            }}
                            className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                            title="Registrar recebimento do valor emprestado"
                          >
                            + Receber
                          </button>
                        )}

                        <span
                          className={`text-xs sm:text-sm font-black whitespace-nowrap ${
                            isIncome ? 'text-[#66bb6a]' : isExpense ? 'text-[#ef5350]' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}{' '}
                          {formatCurrency(t.amount, user.currency, !user.showValues)}
                        </span>

                        {/* On mobile (< sm:), show status badge here under amount */}
                        <div className="flex sm:hidden">
                          {getStatusBadge(t)}
                        </div>

                        {/* Desktop Action buttons */}
                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTransaction(t);
                              setIsModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransaction(t);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                <th className="py-2.5 px-3">Situação</th>
                <th className="py-2.5 px-3">Data</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Conta / Cartão</th>
                <th className="py-2.5 px-3 text-right">Valor</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold">
              {displayTransactions.map((t, idx) => {
                const cat = findCategory(t.categoryId, t.subcategoryId);
                const acc = accounts.find(a => a.id === t.accountId);
                const card = cards.find(c => c.id === t.cardId);
                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';
                const todayStr = getTodayString();
                const isToday = t.date === todayStr;
                const isFirstToday = isToday && !displayTransactions.slice(0, idx).some(x => x.date === todayStr);

                return (
                  <tr
                    key={t.id}
                    id={isFirstToday ? 'table-row-today' : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDetailTx(t);
                    }}
                    className={`hover:bg-slate-50/80 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer ${
                      isToday ? 'bg-purple-500/5 dark:bg-purple-500/10' : ''
                    }`}
                  >
                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>{getStatusBadge(t)}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span>{formatDate(t.date)}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-600 text-white shadow-xs">
                            Hoje
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-900 dark:text-white font-bold">{t.description}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {cat?.name || 'Geral'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {card ? card.name : acc ? acc.name : '-'}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-black ${
                        isIncome ? 'text-[#66bb6a]' : isExpense ? 'text-[#ef5350]' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {formatCurrency(t.amount, user.currency, !user.showValues)}
                    </td>
                    <td className="py-3 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingTransaction(t);
                            setIsModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTransaction(t)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Modal for Add/Edit */}
      {isModalOpen && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          initialType={modalInitialType}
          initialPaymentMethod={initialPaymentMethod}
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
