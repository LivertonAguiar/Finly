import React, { useState, useMemo } from 'react';
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
import { getEffectiveTransactionDate } from '../../utils/invoiceCalculator';
import { BankLogo } from '../../utils/bankLogos';
import { TransactionModal } from './TransactionModal';
import { TransactionDetailModal } from './TransactionDetailModal';

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
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all' | 'completed' | 'pending'
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

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

  // Filtered transactions for this month (projected by due_date or purchase_date)
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const card = cards.find(c => c.id === t.cardId);
      const effectiveDate = getEffectiveTransactionDate(t, card, viewRegime);
      return effectiveDate.startsWith(currentMonthPrefix);
    });
  }, [transactions, currentMonthPrefix, viewRegime, cards]);

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
          label = 'Fatura Paga';
          styleClass = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25';
          icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
        } else {
          label = 'Fatura Aberta';
          styleClass = 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/25';
          icon = <Clock className="w-3.5 h-3.5 text-teal-500 shrink-0" />;
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs shrink-0 ${styleClass}`}
        title={`Situação: ${label} (Clique para alternar)`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  // Robust category lookup
  const findCategory = (catId?: string, subId?: string) => {
    if (!catId && !subId) return null;
    return categories.find(
      c =>
        c.id === catId ||
        c.name.toLowerCase() === catId?.toLowerCase() ||
        (subId && c.subcategories?.some(s => s.id === subId || s.name.toLowerCase() === subId.toLowerCase()))
    );
  };

  // Filtered display transactions
  const displayTransactions = useMemo(() => {
    return monthTransactions
      .filter(t => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterStatus !== 'all' && t.status !== filterStatus) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const descMatch = t.description.toLowerCase().includes(term);
          const cat = findCategory(t.categoryId, t.subcategoryId);
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
  }, [monthTransactions, filterType, filterStatus, searchTerm, categories, viewRegime, cards]);

  // Group by date for timeline view
  const groupedTransactions = useMemo(() => {
    const groups: { date: string; displayDate: string; items: Transaction[]; dayTotal: number }[] = [];
    const map: Record<string, Transaction[]> = {};

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
        });
      });

    return groups;
  }, [displayTransactions, viewRegime, cards]);

  
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

  const handleExportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta/Cartao', 'Valor', 'Status'];
    const rows = displayTransactions.map(t => {
      const cat = findCategory(t.categoryId, t.subcategoryId);
      const acc = accounts.find(a => a.id === t.accountId);
      const card = cards.find(c => c.id === t.cardId);
      return [
        t.date,
        t.type,
        `"${t.description.replace(/"/g, '""')}"`,
        cat ? cat.name : 'Outros',
        acc ? acc.name : card ? card.name : '',
        t.amount.toString().replace('.', ','),
        t.status,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,﻿' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transacoes_${currentMonthPrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      {/* 1. TOPBAR HEADER (MOBILLS REPLICA MATCHING EXACT SCREENSHOT) */}
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

          {/* Floating Dropdown Popover (PlannerFin Exact Style) */}
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


          {/* Unified + Novo Dropdown Popover (Mobills Exact Replica) */}
          <div className="relative">
            <button
              onClick={() => setIsNovoMenuOpen(!isNovoMenuOpen)}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo</span>
            </button>

            {isNovoMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsNovoMenuOpen(false)}
                />
                <div
                  onClick={e => e.stopPropagation()}
                  className="absolute right-0 top-11 z-40 w-56 rounded-[22px] bg-[#1e222d] border border-slate-700 shadow-2xl py-2 animate-in fade-in zoom-in-95 divide-y divide-slate-800"
                >
                  <div className="py-1">
                    {/* 1. Despesa */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setEditingTransaction(null);
                        setModalInitialType('expense');
                        setInitialPaymentMethod('account');
                        setIsModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <TrendingDown className="w-4 h-4 text-[#ef5350]" />
                      <span>Despesa</span>
                    </button>

                    {/* 2. Receita */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setEditingTransaction(null);
                        setModalInitialType('income');
                        setInitialPaymentMethod('account');
                        setIsModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <TrendingUp className="w-4 h-4 text-[#66bb6a]" />
                      <span>Receita</span>
                    </button>

                    {/* 3. Despesa cartão */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setEditingTransaction(null);
                        setModalInitialType('expense');
                        setInitialPaymentMethod('card');
                        setIsModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <CreditCard className="w-4 h-4 text-[#26a69a]" />
                      <span>Despesa cartão</span>
                    </button>

                    {/* 4. Transferência */}
                    <button
                      onClick={() => {
                        setIsNovoMenuOpen(false);
                        setEditingTransaction(null);
                        setModalInitialType('transfer');
                        setInitialPaymentMethod('account');
                        setIsModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-white/10 flex items-center gap-3 transition-colors cursor-pointer text-slate-200 hover:text-white"
                    >
                      <ArrowLeftRight className="w-4 h-4 text-[#42a5f5]" />
                      <span>Transferência</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>


          {/* Search Icon Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center hover:text-purple-600 shadow-xs cursor-pointer"
            title="Pesquisar"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Filter Status Icon Button */}
          <button
            onClick={() => setFilterStatus(filterStatus === 'all' ? 'completed' : filterStatus === 'completed' ? 'pending' : 'all')}
            className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-xs cursor-pointer transition-colors ${
              filterStatus !== 'all'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white dark:bg-[#2C2C2E] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600'
            }`}
            title={`Filtrar por Status: ${filterStatus}`}
          >
            <Filter className="w-4 h-4" />
          </button>

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

      {/* 2. 4 TOP SUMMARY KPIS (INTERACTIVE FILTER BUTTONS + MOBILLS SPEC) */}
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

      {/* 2.5 VIEW REGIME TOGGLE (MOBILLS CAIXA VS COMPETÊNCIA) */}
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
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setSelectedMonthOffset(prev => prev - 1)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-4 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-purple-500/40 shadow-xs">
          {capitalizedMonth} {yearNum}
        </span>
        <button
          onClick={() => setSelectedMonthOffset(prev => prev + 1)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 4. TRANSACTION LIST / TIMELINE (MOBILLS REPLICA) */}
      {displayTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-slate-400 text-xs space-y-2">
          <p>Nenhuma transação encontrada para os filtros selecionados.</p>
        </div>
      ) : viewMode === 'timeline' ? (
        <div className="space-y-4">
          {groupedTransactions.map(group => (
            <div
              key={group.date}
              className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-3"
            >
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2.5">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {group.displayDate}
                </span>
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
                      onClick={() => setSelectedDetailTx(t)}
                      className="py-3 first:pt-1 last:pb-0 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-[#343437]/50 px-2.5 rounded-2xl transition-colors cursor-pointer"
                    >
                      {/* Left: Status check + Category Icon + Info */}
                      <div className="flex items-center gap-3 min-w-0">
{getStatusBadge(t)}

                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: (cat?.color || '#7c4dff') + '20', color: cat?.color || '#7c4dff' }}
                        >
                          {cat?.icon || (isIncome ? '💰' : '📁')}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {t.description}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold truncate">
                            <span className="uppercase">{cat?.name || 'Geral'}</span>
                            {card ? (
                              <span>• Cartão {card.name}</span>
                            ) : acc ? (
                              <span>• {acc.name}</span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Action buttons */}
                      <div className="flex items-center gap-2.5 shrink-0">
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
                          className={`text-xs font-black ${
                            isIncome ? 'text-[#66bb6a]' : isExpense ? 'text-[#ef5350]' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isIncome ? '+' : isExpense ? '-' : ''}{' '}
                          {formatCurrency(t.amount, user.currency, !user.showValues)}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              {displayTransactions.map(t => {
                const cat = findCategory(t.categoryId, t.subcategoryId);
                const acc = accounts.find(a => a.id === t.accountId);
                const card = cards.find(c => c.id === t.cardId);
                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';

                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedDetailTx(t)}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#343437]/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3" onClick={e => e.stopPropagation()}>{getStatusBadge(t)}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{formatDate(t.date)}</td>
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
