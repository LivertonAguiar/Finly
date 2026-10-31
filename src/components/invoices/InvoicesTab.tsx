import React, { useState, useMemo } from 'react';
import {
  CreditCard as CreditCardIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Receipt,
  ArrowRight,
  TrendingUp,
  Plus,
  FileText,
  Search,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { BankLogo, CardBrandLogo, getCardBankInfo } from '../../utils/bankLogos';
import {
  calculateCardInvoiceStatus,
  isCardInvoicePaid,
  getCardInvoicePaymentDetails,
  getCardTransactionInvoiceMonth,
  InvoiceStatusInfo,
} from '../../utils/invoiceCalculator';
import { PayInvoiceSheet } from './PayInvoiceSheet';
import { CreditCard as CreditCardType, Transaction } from '../../types';

interface InvoicesTabProps {
  onOpenNewCard?: () => void;
  onNavigateToCardDetail?: (cardId: string) => void;
}

type InvoiceFilter = 'all' | 'pending' | 'overdue' | 'paid';

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  onOpenNewCard,
  onNavigateToCardDetail,
}) => {
  const { cards, transactions, accounts, user, unpayCardInvoice } = useFinancial();
  const { confirm } = useConfirm();

  // Navigation Month Offset
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<InvoiceFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payment Sheet state
  const [paySheetCardId, setPaySheetCardId] = useState<string | null>(null);
  const [isPaySheetOpen, setIsPaySheetOpen] = useState<boolean>(false);

  // Active Menu for "⋯"
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null);

  // Expanded card transaction preview
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Calculate current viewing date and month
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth() + 1;
  const currentMonthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;

  const monthLabel = useMemo(() => {
    const str = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [viewDate]);

  // Today reference
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1;
  const currentDayNum = now.getDate();
  const isViewingCurrentMonth = selectedMonthOffset === 0;

  // Process all cards and their invoices for this month
  const cardInvoices = useMemo(() => {
    return cards.map(card => {
      // Find card transactions in this invoice
      const invoiceTransactions = transactions
        .filter(t => t.cardId === card.id && t.type === 'expense' && getCardTransactionInvoiceMonth(t, card) === currentMonthPrefix)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const invoiceTotal = invoiceTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const paymentDetails = getCardInvoicePaymentDetails(card, currentMonthPrefix, transactions);
      const isPaid = paymentDetails.isPaid;
      const statusInfo = calculateCardInvoiceStatus(card, viewYear, viewMonth, invoiceTotal, isPaid);

      // Due date calculations
      const dueDay = card.dueDay || 5;
      const closingDay = card.closingDay || 28;

      let countdownLabel = '';
      let countdownVariant: 'default' | 'warning' | 'danger' | 'success' = 'default';

      if (isPaid) {
        countdownLabel = paymentDetails.paymentDate
          ? `Paga em ${formatDate(paymentDetails.paymentDate)}`
          : 'Fatura quitada';
        countdownVariant = 'success';
      } else if (invoiceTotal > 0) {
        if (isViewingCurrentMonth) {
          const diffDays = dueDay - currentDayNum;
          if (diffDays < 0) {
            countdownLabel = `Venceu há ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dia' : 'dias'}`;
            countdownVariant = 'danger';
          } else if (diffDays === 0) {
            countdownLabel = 'Vence hoje!';
            countdownVariant = 'danger';
          } else if (diffDays <= 3) {
            countdownLabel = `Vence em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
            countdownVariant = 'warning';
          } else {
            countdownLabel = `Vence em ${diffDays} dias`;
            countdownVariant = 'default';
          }
        } else if (viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonthNum)) {
          countdownLabel = 'Fatura vencida';
          countdownVariant = 'danger';
        } else {
          countdownLabel = `Vencimento dia ${dueDay}`;
          countdownVariant = 'default';
        }
      } else {
        countdownLabel = 'Sem gastos';
        countdownVariant = 'default';
      }

      // Debit account name if paid
      let paidAccountName = '';
      if (isPaid && paymentDetails.paymentAccountId) {
        const acc = accounts.find(a => a.id === paymentDetails.paymentAccountId);
        if (acc) paidAccountName = acc.name;
      }

      return {
        card,
        invoiceTransactions,
        invoiceTotal,
        paymentDetails,
        isPaid,
        statusInfo,
        dueDay,
        closingDay,
        countdownLabel,
        countdownVariant,
        paidAccountName,
      };
    });
  }, [cards, transactions, accounts, currentMonthPrefix, viewYear, viewMonth, isViewingCurrentMonth, currentYear, currentMonthNum, currentDayNum]);

  // Aggregate KPI metrics
  const kpiData = useMemo(() => {
    let pendingSum = 0;
    let pendingCount = 0;
    let overdueSum = 0;
    let overdueCount = 0;
    let paidSum = 0;
    let paidCount = 0;

    cardInvoices.forEach(item => {
      if (item.isPaid) {
        paidSum += item.paymentDetails.paymentAmount || item.invoiceTotal;
        paidCount += 1;
      } else if (item.statusInfo.status === 'overdue' && item.invoiceTotal > 0) {
        overdueSum += item.invoiceTotal;
        overdueCount += 1;
        pendingSum += item.invoiceTotal;
        pendingCount += 1;
      } else if (item.invoiceTotal > 0) {
        pendingSum += item.invoiceTotal;
        pendingCount += 1;
      }
    });

    return {
      pendingSum,
      pendingCount,
      overdueSum,
      overdueCount,
      paidSum,
      paidCount,
      totalCards: cardInvoices.length,
    };
  }, [cardInvoices]);

  // Filtered Cards
  const filteredInvoices = useMemo(() => {
    return cardInvoices.filter(item => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.card.name.toLowerCase().includes(q);
        const matchesBank = (item.card.bankId || '').toLowerCase().includes(q);
        if (!matchesName && !matchesBank) return false;
      }

      // 2. Active Filter
      if (activeFilter === 'pending') {
        return !item.isPaid && item.invoiceTotal > 0;
      }
      if (activeFilter === 'overdue') {
        return !item.isPaid && item.statusInfo.status === 'overdue' && item.invoiceTotal > 0;
      }
      if (activeFilter === 'paid') {
        return item.isPaid;
      }
      return true; // 'all'
    });
  }, [cardInvoices, activeFilter, searchQuery]);

  // Handle direct payment click (Touch 1)
  const handleOpenPaySheet = (cardId: string) => {
    setPaySheetCardId(cardId);
    setIsPaySheetOpen(true);
  };

  // Handle Reverse Payment (Unpay)
  const handleReversePayment = async (cardId: string, cardName: string) => {
    setOpenMenuCardId(null);
    const confirmed = await confirm({
      title: 'Estornar Pagamento',
      message: `Deseja reabrir a fatura de ${cardName} referente a ${monthLabel}? O lançamento de pagamento será excluído do fluxo de caixa e as compras voltarão ao status pendente.`,
      confirmText: 'Estornar Pagamento',
      cancelText: 'Cancelar',
      type: 'warning',
    });

    if (confirmed) {
      unpayCardInvoice(cardId, currentMonthPrefix);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 animate-in fade-in pb-16">
      {/* ========================================================================= */}
      {/* 1. SELETOR DE MÊS NO TOPO */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              Faturas de Cartão
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Vencimentos, fechamentos e pagamento em 2 toques
            </p>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.04] p-1 rounded-2xl border border-slate-200/60 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setSelectedMonthOffset(prev => prev - 1)}
            className="w-8 h-8 rounded-xl bg-white dark:bg-[#202024] hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 text-xs sm:text-sm font-black text-slate-900 dark:text-white min-w-[130px] sm:min-w-[150px] text-center select-none">
            {monthLabel}
          </span>

          <button
            type="button"
            onClick={() => setSelectedMonthOffset(prev => prev + 1)}
            className="w-8 h-8 rounded-xl bg-white dark:bg-[#202024] hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {selectedMonthOffset !== 0 && (
            <button
              type="button"
              onClick={() => setSelectedMonthOffset(0)}
              className="ml-1 px-2.5 py-1 rounded-xl bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              title="Voltar para o Mês Atual"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Hoje</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPIS / RESUMO RÁPIDO DO TOPO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* KPI 1: A Pagar (próximos 30 dias / mês) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              A Pagar nos Próximos 30 Dias
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-black">
              {kpiData.pendingCount} {kpiData.pendingCount === 1 ? 'fatura' : 'faturas'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(kpiData.pendingSum, user.currency, !user.showValues)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Faturas abertas e fechadas a vencer
          </p>
        </div>

        {/* KPI 2: Faturas Vencidas */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-2 transition-all ${
          kpiData.overdueCount > 0
            ? 'bg-rose-500/10 dark:bg-rose-950/30 border-rose-500/30 dark:border-rose-500/40'
            : 'bg-white dark:bg-[#18181B] border-slate-200/80 dark:border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${
              kpiData.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
            }`}>
              Faturas Vencidas
            </span>
            {kpiData.overdueCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {kpiData.overdueCount} {kpiData.overdueCount === 1 ? 'vencida' : 'vencidas'}
              </span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${
            kpiData.overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
          }`}>
            {formatCurrency(kpiData.overdueSum, user.currency, !user.showValues)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {kpiData.overdueCount > 0 ? 'Atenção ao pagamento para evitar juros' : 'Nenhuma fatura vencida'}
          </p>
        </div>

        {/* KPI 3: Faturas Pagas */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Faturas Pagas
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
              {kpiData.paidCount} {kpiData.paidCount === 1 ? 'paga' : 'pagas'}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatCurrency(kpiData.paidSum, user.currency, !user.showValues)}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Liquidadas no mês de competência
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTROS RÁPIDOS & BUSCA */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas ({cardInvoices.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'pending'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            A pagar ({kpiData.pendingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {kpiData.overdueCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
            <span>Vencidas ({kpiData.overdueCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('paid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === 'paid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pagas ({kpiData.paidCount})
          </button>
        </div>

        {/* Search Input */}
        {cards.length > 3 && (
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cartão..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. LISTA DE FATURAS POR CARTÃO */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredInvoices.length === 0 ? (
          <div className="py-12 px-4 rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Nenhuma fatura encontrada
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {cards.length === 0
                ? 'Você ainda não cadastrou nenhum cartão de crédito.'
                : 'Não há faturas correspondentes ao filtro ou busca selecionada neste mês.'}
            </p>
            {cards.length === 0 && onOpenNewCard && (
              <button
                type="button"
                onClick={onOpenNewCard}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Cartão</span>
              </button>
            )}
          </div>
        ) : (
          filteredInvoices.map(item => {
            const cardColor = item.card.color || '#7c4dff';
            const isMenuOpen = openMenuCardId === item.card.id;
            const isExpanded = expandedCardId === item.card.id;

            return (
              <div
                key={item.card.id}
                className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-purple-500/30 transition-all overflow-hidden relative"
              >
                {/* Brand color strip on left border */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: cardColor }}
                />

                <div className="p-4 sm:p-5 pl-4 sm:pl-5 space-y-4">
                  {/* Row 1: Header (Bank, Name, Status Badge, ⋯ Menu) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center p-2 shrink-0 border"
                        style={{
                          backgroundColor: `${cardColor}15`,
                          borderColor: `${cardColor}30`,
                        }}
                      >
                        <BankLogo nameOrId={item.card.bankId || getCardBankInfo(item.card)?.id || item.card.name} size={22} radius={6} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase truncate">
                            {item.card.name}
                          </h3>
                          {item.card.last4Digits && (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md">
                              •••• {item.card.last4Digits}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                          <span>Fecha dia {item.closingDay}</span>
                          <span>•</span>
                          <span>Vence dia {item.dueDay}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Status Badge */}
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border ${item.statusInfo.badgeColor}`}>
                        {item.statusInfo.statusLabel}
                      </span>

                      {/* ⋯ Menu for Paid Invoices (to keep UI clean) */}
                      {item.isPaid && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenMenuCardId(isMenuOpen ? null : item.card.id)}
                            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                            title="Mais opções"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="absolute right-0 top-9 z-20 w-48 rounded-2xl bg-white dark:bg-[#202024] border border-slate-200 dark:border-white/10 shadow-xl py-1 animate-in fade-in duration-150">
                              <button
                                type="button"
                                onClick={() => handleReversePayment(item.card.id, item.card.name)}
                                className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Estornar Pagamento</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Value, Countdown & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Valor da fatura
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl sm:text-2xl font-black tracking-tight ${
                          item.isPaid
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : item.statusInfo.status === 'overdue'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-white'
                        }`}>
                          {formatCurrency(item.invoiceTotal, user.currency, !user.showValues)}
                        </span>

                        <span className={`text-xs font-bold ${
                          item.countdownVariant === 'danger'
                            ? 'text-rose-500 font-black'
                            : item.countdownVariant === 'warning'
                            ? 'text-amber-500'
                            : item.countdownVariant === 'success'
                            ? 'text-emerald-500'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          {item.countdownLabel}
                        </span>
                      </div>
                    </div>

                    {/* Direct Action Button */}
                    <div className="flex items-center gap-2">
                      {/* Accordion toggle to inspect transactions */}
                      {item.invoiceTransactions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedCardId(isExpanded ? null : item.card.id)}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>{item.invoiceTransactions.length} {item.invoiceTransactions.length === 1 ? 'compra' : 'compras'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Direct "Pagar" Button (Unpaid) */}
                      {!item.isPaid && item.invoiceTotal > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleOpenPaySheet(item.card.id)}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <DollarSign className="w-4 h-4 stroke-[2.5]" />
                          <span>Pagar Fatura</span>
                        </button>
                      ) : item.isPaid ? (
                        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{item.paidAccountName ? `Paga via ${item.paidAccountName}` : 'Paga'}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Nenhum gasto registrado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Transaction Preview */}
                  {isExpanded && item.invoiceTransactions.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2 animate-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase">
                        <span>Extrato da Fatura</span>
                        {onNavigateToCardDetail && (
                          <button
                            type="button"
                            onClick={() => onNavigateToCardDetail(item.card.id)}
                            className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ver detalhe completo</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {item.invoiceTransactions.map(t => (
                          <div
                            key={t.id}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04] flex items-center justify-between text-xs"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                {t.description}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {formatDate(t.date)}
                              </span>
                            </div>
                            <span className="font-black text-slate-900 dark:text-white shrink-0">
                              {formatCurrency(t.amount, user.currency, !user.showValues)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. 2-TOUCH PAYMENT BOTTOM SHEET */}
      {/* ========================================================================= */}
      <PayInvoiceSheet
        isOpen={isPaySheetOpen}
        onClose={() => {
          setIsPaySheetOpen(false);
          setPaySheetCardId(null);
        }}
        initialCardId={paySheetCardId}
        initialMonth={currentMonthPrefix}
      />
    </div>
  );
};