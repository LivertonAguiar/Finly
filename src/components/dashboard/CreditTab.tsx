import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  ArrowLeft,
  DollarSign,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Banknote,
  Sparkles,
  Layers,
  Download,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString, calculateCardInvoiceStatus } from '../../utils/formatters';
import { CardBrandLogo } from '../../utils/bankLogos';
import { CardModal } from '../cadastros/CardModal';
import { TransactionModal } from '../transactions/TransactionModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { Modal } from '../ui/Modal';
import { ViewModeToggle, CardViewMode } from '../ui/ViewModeToggle';
import { CreditCard as CreditCardType, Transaction } from '../../types';
import { exportInvoiceCSV, exportInvoicePDF, downloadCSV } from '../../utils/reportExportService';

interface CreditTabProps {
  onOpenNewCard: () => void;
  initialCardDetailId?: string | null;
}

export const CreditTab: React.FC<CreditTabProps> = ({ onOpenNewCard, initialCardDetailId }) => {
  const { cards, user, transactions, accounts, categories, payCardInvoice, unpayCardInvoice, toggleTransactionStatus, reimburseThirdPartyTransaction, deleteCard, addTransaction, deleteTransaction } = useFinancial();
  const { confirm } = useConfirm();

  const [viewMode, setViewMode] = useState<CardViewMode>(() => {
    try {
      return (localStorage.getItem('finly_cards_view_mode') as CardViewMode) || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [activeCardDetailId, setActiveCardDetailId] = useState<string | null>(initialCardDetailId || null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (initialCardDetailId !== undefined) {
      setActiveCardDetailId(initialCardDetailId);
    }
  }, [initialCardDetailId]);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingCard, setPayingCard] = useState<CreditCardType | null>(null);
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [payAmount, setPayAmount] = useState('');

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [editingInvoiceTx, setEditingInvoiceTx] = useState<Transaction | null>(null);
  const [selectedCardForExpense, setSelectedCardForExpense] = useState<string | null>(null);

  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Month calculation
  


  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  // Compute invoice and limit info for each card
  const cardsData = useMemo(() => {
    return cards.map(card => {
      const cardTxs = transactions.filter(t => t.cardId === card.id && t.type === 'expense');
      const monthTxs = cardTxs.filter(t => t.date.startsWith(currentMonthPrefix));
      const invoiceTotal = Math.round(monthTxs.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;

      const isPaid = monthTxs.length > 0 && monthTxs.every(t => t.status === 'completed');
      
      // Open current month invoice amount
      const currentOpenInvoice = isPaid ? 0 : invoiceTotal;
      const currentInvoicePercent = card.limit > 0 ? (currentOpenInvoice / card.limit) * 100 : 0;

      // Future unpaid installments in subsequent months
      const futureInstallmentsTxs = cardTxs.filter(t => t.status !== 'completed' && !t.date.startsWith(currentMonthPrefix));
      const futureInstallmentsTotal = Math.round(futureInstallmentsTxs.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      const futureInstallmentsPercent = card.limit > 0 ? (futureInstallmentsTotal / card.limit) * 100 : 0;

      // Active committed limit = all unpaid/open card expense transactions
      const totalCommitted = Math.round(cardTxs.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      const available = Math.max(0, Math.round((card.limit - totalCommitted) * 100) / 100);
      const usedPercentage = card.limit > 0 ? Math.min(100, (totalCommitted / card.limit) * 100) : 0;
      const isOverLimit = totalCommitted > card.limit;
      const overLimitAmount = Math.max(0, totalCommitted - card.limit);

      const viewMonthNum = viewDate.getMonth() + 1;
      const viewYearNum = viewDate.getFullYear();

      const statusInfo = calculateCardInvoiceStatus(card, viewYearNum, viewMonthNum, invoiceTotal, isPaid);
      const statusLabel = statusInfo.statusLabel;
      const statusColor = statusInfo.statusColor;

      return {
        ...card,
        invoiceTotal,
        currentOpenInvoice,
        currentInvoicePercent,
        futureInstallmentsTotal,
        futureInstallmentsPercent,
        totalCommitted,
        available,
        usedPercentage,
        isOverLimit,
        overLimitAmount,
        monthTxs,
        cardTxs,
        statusLabel,
        statusColor,
        isPaid,
      };
    });
  }, [cards, transactions, currentMonthPrefix, selectedMonthOffset, viewDate]);

  // Consolidated KPIs
  
  // Calculate best card to buy today (card with the farthest closing date)
  const bestCardToBuyToday = useMemo(() => {
    if (cards.length === 0) return null;
    const now = new Date();
    const todayDay = now.getDate();

    // Sort by days remaining until next closing day
    const scored = cards.map(c => {
      let daysUntilClosing = c.closingDay - todayDay;
      if (daysUntilClosing < 0) {
        daysUntilClosing += 30;
      }
      return { card: c, daysUntilClosing };
    });

    scored.sort((a, b) => b.daysUntilClosing - a.daysUntilClosing);
    return scored[0]?.card || cards[0];
  }, [cards]);

  
  const handleExportCardsCSV = async () => {
    const headers = ['Cartão', 'Bandeira', 'Limite Total', 'Limite Disponível', 'Fatura Atual', 'Fechamento', 'Vencimento', 'Status'];
    const rows = cardsData.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.brand,
      c.limit.toFixed(2).replace('.', ','),
      c.available.toFixed(2).replace('.', ','),
      c.invoiceTotal.toFixed(2).replace('.', ','),
      `Dia ${c.closingDay}`,
      `Dia ${c.dueDay}`,
      c.statusLabel
    ].join(';'));

    await downloadCSV(`cartoes_${currentMonthPrefix}.csv`, [headers.join(';'), ...rows].join('\n'), 'Cartões de Crédito (CSV)');
  };

  const handleExportInvoiceCSV = async (targetCard?: typeof activeCardDetail) => {
    const target = targetCard || activeCardDetail;
    if (!target) return;
    await exportInvoiceCSV({
      card: target,
      monthLabel: `${capitalizedMonth} de ${yearNum}`,
      periodSlug: `${target.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fatura_${currentMonthPrefix}`,
      invoiceTotal: target.invoiceTotal,
      statusLabel: target.statusLabel,
      transactions: target.monthTxs,
      categories,
      currency: user?.currency || 'BRL',
      userEmail: user?.email,
    });
  };

  const handleExportInvoicePDF = async (targetCard?: typeof activeCardDetail) => {
    const target = targetCard || activeCardDetail;
    if (!target) return;
    await exportInvoicePDF({
      card: target,
      monthLabel: `${capitalizedMonth} de ${yearNum}`,
      periodSlug: `${target.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fatura_${currentMonthPrefix}`,
      invoiceTotal: target.invoiceTotal,
      statusLabel: target.statusLabel,
      transactions: target.monthTxs,
      categories,
      currency: user?.currency || 'BRL',
      userEmail: user?.email,
    });
  };

  const totalInvoicesSum = useMemo(() => {
    return cardsData.reduce((sum, c) => sum + c.invoiceTotal, 0);
  }, [cardsData]);

  const totalCreditLimitSum = useMemo(() => {
    return cards.reduce((sum, c) => sum + c.limit, 0);
  }, [cards]);

  const totalCommittedLimitSum = useMemo(() => {
    return cardsData.reduce((sum, c) => sum + c.totalCommitted, 0);
  }, [cardsData]);

  const totalAvailableLimitSum = useMemo(() => {
    return cardsData.reduce((sum, c) => sum + c.available, 0);
  }, [cardsData]);

  const totalCommittedPercent = totalCreditLimitSum > 0 ? Math.min(100, (totalCommittedLimitSum / totalCreditLimitSum) * 100) : 0;

  // Selected Card for Detail View
  const activeCardDetail = useMemo(() => {
    if (!activeCardDetailId) return null;
    return cardsData.find(c => c.id === activeCardDetailId) || null;
  }, [cardsData, activeCardDetailId]);

  const [isPayingInvoice, setIsPayingInvoice] = useState(false);

  const handleOpenPayModal = (targetCard?: CreditCardType | null) => {
    const cardToPay =
      targetCard ||
      activeCardDetail ||
      cardsData.find(c => c.invoiceTotal > 0 && !c.isPaid) ||
      cardsData[0] ||
      null;
    if (!cardToPay) return;
    setPayingCard(cardToPay);
    const cardData = cardsData.find(c => c.id === cardToPay.id);
    const invoiceAmt = cardData ? cardData.invoiceTotal : 0;
    setPayAmount(invoiceAmt > 0 ? invoiceAmt.toFixed(2) : '');
    setIsPayModalOpen(true);
  };

  // Transactions belonging to the card being paid for the current month
  const payingCardTxs = useMemo(() => {
    if (!payingCard) return [];
    return transactions
      .filter(t => t.cardId === payingCard.id && t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payingCard, transactions, currentMonthPrefix]);

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPayingInvoice || !payingCard) return;
    const amt = Math.round((parseFloat(payAmount) || 0) * 100) / 100;
    if (amt <= 0 || !payAccountId) return;

    setIsPayingInvoice(true);
    payCardInvoice(payingCard.id, payAccountId, amt, currentMonthPrefix);

    setIsPayModalOpen(false);
    setPayingCard(null);
    setPayAmount('');
    setIsPayingInvoice(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in pb-16 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* CASE 1: DETALHE DA FATURA DO CARTÃO (INVOICE EXTRATO SCREEN) */}
      {/* ========================================================================= */}
      {activeCardDetail ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Back button & Action Buttons Bar */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setActiveCardDetailId(null)}
              className="h-10 px-3 sm:px-4 rounded-xl bg-white dark:bg-[#1E1E20] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
              title="Voltar para a lista de cartões"
            >
              <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="whitespace-nowrap">
                Voltar <span className="hidden sm:inline">para Cartões</span>
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setSelectedCardForExpense(activeCardDetail.id);
                  setIsAddExpenseModalOpen(true);
                }}
                className="h-10 px-3 sm:px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-sm shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Nova Despesa</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="h-10 w-10 rounded-xl bg-white dark:bg-[#1E1E20] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-center shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                  title="Mais opções"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isHeaderMenuOpen && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-2xl py-2 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {activeCardDetail.isPaid ? (
                      <button
                        onClick={async () => {
                          setIsHeaderMenuOpen(false);
                          const ok = await confirm({
                            title: 'Reabrir Fatura?',
                            message: `Deseja reabrir a fatura de ${activeCardDetail.name} e estornar o pagamento?`,
                            confirmText: 'Reabrir Fatura',
                            type: 'warning'
                          });
                          if (ok) {
                            unpayCardInvoice(activeCardDetail.id, currentMonthPrefix);
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-500" />
                        <span>Reabrir fatura</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          handleOpenPayModal(activeCardDetail);
                        }}
                        className="w-full px-4 py-2.5 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 cursor-pointer"
                      >
                        <CardIcon className="w-4 h-4 text-emerald-500" />
                        <span>Pagar fatura</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setEditingCard(activeCardDetail);
                        setIsEditModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 text-purple-600" />
                      <span>Editar cartão</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        handleExportInvoiceCSV(activeCardDetail);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-500" />
                      <span>Exportar fatura para CSV</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        handleExportInvoicePDF(activeCardDetail);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span>Exportar fatura para PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Card Invoice Header Summary */}
          <div className="p-4 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center p-2 shadow-xs shrink-0"
                  style={{ backgroundColor: activeCardDetail.color ? activeCardDetail.color + '25' : '#7c4dff25' }}
                >
                  <CardBrandLogo brand={activeCardDetail.brand} size={28} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {activeCardDetail.name}
                  </h3>
                  <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block mt-0.5 ${activeCardDetail.statusColor}`}>
                    {activeCardDetail.statusLabel}
                  </span>
                </div>
              </div>

              {/* Month Selector for Invoice */}
              <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
                <button
                  onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full bg-slate-50 dark:bg-[#343437] border border-slate-200 dark:border-slate-700">
                  Fatura de {capitalizedMonth} {yearNum}
                </span>
                <button
                  onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  title="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Invoice Total + Pay CTA */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">Valor da Fatura</span>
                  <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatCurrency(activeCardDetail.invoiceTotal, user.currency, !user.showValues)}
                  </span>
                </div>

                {activeCardDetail.invoiceTotal > 0 && !activeCardDetail.isPaid ? (
                  <button
                    onClick={async () => {
                      handleOpenPayModal(activeCardDetail);
                    }}
                    className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
                  >
                    Pagar Fatura
                  </button>
                ) : activeCardDetail.isPaid ? (
                  <button
                    onClick={async () => {
                      const ok = await confirm({
                        title: 'Marcar Fatura como Não Paga?',
                        message: `Deseja marcar a fatura de ${capitalizedMonth} do cartão ${activeCardDetail.name} como NÃO PAGA e reabrir os lançamentos?`,
                        confirmText: 'Sim, Marcar Não Paga',
                        cancelText: 'Cancelar',
                        type: 'warning'
                      });
                      if (ok) {
                        unpayCardInvoice(activeCardDetail.id, currentMonthPrefix);
                      }
                    }}
                    className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    title="Desfazer pagamento e marcar fatura como pendente"
                  >
                    Marcar como não paga
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      handleOpenPayModal(activeCardDetail);
                    }}
                    className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Pagar Fatura
                  </button>
                )}
              </div>
            </div>

            {/* Sub-info: Closing & Due dates + Dynamic Limit Progress Bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {/* Dynamic Limit Progress Bar */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
                  <span className="text-slate-600 dark:text-slate-300">
                    Limite Utilizado: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(activeCardDetail.totalCommitted, user.currency, !user.showValues)}</strong> ({activeCardDetail.usedPercentage.toFixed(1).replace('.', ',')}%)
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    Limite Disponível: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(activeCardDetail.available, user.currency, !user.showValues)}</strong> de {formatCurrency(activeCardDetail.limit, user.currency, !user.showValues)}
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner">
                  {/* Segment 1: Fatura Atual Aberta */}
                  {activeCardDetail.currentInvoicePercent > 0 && (
                    <div
                      style={{ width: `${Math.min(100, activeCardDetail.currentInvoicePercent)}%` }}
                      className="h-full bg-[#7c4dff] transition-all duration-500"
                      title={`Fatura deste mês: ${formatCurrency(activeCardDetail.currentOpenInvoice, user.currency)}`}
                    />
                  )}
                  {/* Segment 2: Parcelas Futuras */}
                  {activeCardDetail.futureInstallmentsPercent > 0 && (
                    <div
                      style={{ width: `${Math.min(100 - Math.min(100, activeCardDetail.currentInvoicePercent), activeCardDetail.futureInstallmentsPercent)}%` }}
                      className="h-full bg-[#ff8a00] transition-all duration-500"
                      title={`Parcelas futuras: ${formatCurrency(activeCardDetail.futureInstallmentsTotal, user.currency)}`}
                    />
                  )}
                </div>

                {/* Limit Breakdown Chips */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-wrap gap-2 pt-0.5">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[#7c4dff]">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#7c4dff]" />
                      Fatura de {capitalizedMonth}: {formatCurrency(activeCardDetail.invoiceTotal, user.currency, !user.showValues)}
                    </span>
                    {activeCardDetail.futureInstallmentsTotal > 0 && (
                      <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#ff8a00]" />
                        Parcelas Futuras: {formatCurrency(activeCardDetail.futureInstallmentsTotal, user.currency, !user.showValues)}
                      </span>
                    )}
                  </div>

                  {activeCardDetail.isOverLimit && (
                    <span className="text-rose-600 dark:text-rose-400 font-black">
                      ⚠️ Limite Excedido em {formatCurrency(activeCardDetail.overLimitAmount, user.currency, !user.showValues)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 text-xs font-bold pt-1">
                <div>
                  <span className="text-slate-400 block text-[11px]">Fechamento da Fatura</span>
                  <span className="text-slate-800 dark:text-slate-200">Todo dia {activeCardDetail.closingDay}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Vencimento da Fatura</span>
                  <span className="text-slate-800 dark:text-slate-200">Todo dia {activeCardDetail.dueDay}</span>
                </div>
              </div>
            </div>
          </div>

          {/* List of Invoice Expenses */}
          <div className="p-4 sm:p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Lançamentos desta Fatura ({activeCardDetail.monthTxs.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportInvoiceCSV(activeCardDetail)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                  title="Exportar lançamentos desta fatura para planilha CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportInvoicePDF(activeCardDetail)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
                  title="Exportar fatura em documento PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-500" />
                  <span>PDF</span>
                </button>
                <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${activeCardDetail.statusColor}`}>
                  {activeCardDetail.isPaid && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                  {activeCardDetail.statusLabel}
                </span>
              </div>
            </div>

            {activeCardDetail.monthTxs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <CardIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p>Nenhuma despesa nesta fatura.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeCardDetail.monthTxs.map(t => {
                  const cat = categories.find(c => c.id === t.categoryId);
                  return (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDetailTx(t);
                      }}
                      className="py-3 sm:py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50 dark:hover:bg-[#343437]/40 px-2 sm:px-3 rounded-2xl transition-colors cursor-pointer"
                    >
                      {/* Left: Category Icon + Description + Metadata */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs"
                          style={{
                            backgroundColor: (cat?.color || '#7c4dff') + '20',
                            color: cat?.color || '#7c4dff',
                          }}
                        >
                          {cat?.icon || '💳'}
                        </div>
                        <div className="min-w-0 flex-1 pr-1">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {t.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-semibold truncate">
                            <span className="shrink-0">{formatDate(t.date)}</span>
                            <span>•</span>
                            <span className="shrink-0 text-slate-600 dark:text-slate-300 font-bold">{cat?.name || 'Geral'}</span>
                            {t.installments && (
                              <>
                                <span>•</span>
                                <span className="shrink-0 text-purple-600 dark:text-purple-400 font-bold">
                                  Parcela {t.installments.current}/{t.installments.total}
                                </span>
                              </>
                            )}
                            {t.isThirdParty && (
                              <>
                                <span>•</span>
                                <span className={`shrink-0 font-bold ${t.reimbursed ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                  👤 {t.thirdPartyName || 'Terceiro'}{t.reimbursed ? ' (Reembolsado)' : ''}
                                </span>
                              </>
                            )}
                            {t.ignored && (
                              <>
                                <span>•</span>
                                <span className="shrink-0 text-slate-500 font-bold">Ignorada</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount + Actions */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {t.isThirdParty && !t.reimbursed && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                title: 'Registrar Reembolso',
                                message: `Confirmar que ${t.thirdPartyName || 'a pessoa'} pagou o reembolso de ${formatCurrency(t.amount, user.currency)}? Será criada uma receita na sua conta bancária.`,
                                confirmText: 'Receber Reembolso',
                                type: 'info'
                              });
                              if (ok) {
                                reimburseThirdPartyTransaction(t.id, accounts[0]?.id || 'acc-carteira-padrao');
                              }
                            }}
                            className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                            title="Registrar recebimento do valor emprestado"
                          >
                            + Receber
                          </button>
                        )}

                        <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                          -{formatCurrency(t.amount, user.currency, !user.showValues)}
                        </span>

                        <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingInvoiceTx(t);
                              setIsAddExpenseModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await confirm({
                                title: 'Excluir Lançamento',
                                message: `Deseja realmente excluir "${t.description}" de ${formatCurrency(t.amount, user.currency)}?`,
                                confirmText: 'Excluir',
                                type: 'danger',
                              });
                              if (ok) {
                                deleteTransaction(t.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* CASE 2: VISÃO GERAL DE TODOS OS CARTÕES (FINLY OVERVIEW) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Topbar: Title, Month Selector & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                Cartões de crédito
              </h2>

              {/* Mobile-only Action Buttons */}
              <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                <ViewModeToggle
                  mode={viewMode}
                  onChange={(m) => {
                    setViewMode(m);
                    try { localStorage.setItem('finly_cards_view_mode', m); } catch (e) {}
                  }}
                />

                <button
                  onClick={onOpenNewCard}
                  className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title="Novo cartão"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                    className="w-9 h-9 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                    title="Mais opções"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {isHeaderMenuOpen && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute right-0 top-11 z-50 w-56 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-2xl py-2 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      <button
                        onClick={() => {
                          onOpenNewCard();
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-purple-600" />
                        <span>Novo cartão de crédito</span>
                      </button>

                      <button
                        onClick={() => {
                          handleOpenPayModal();
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 flex items-center gap-2.5 cursor-pointer"
                      >
                        <CardIcon className="w-4 h-4 text-emerald-600" />
                        <span>Pagar fatura</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsAddExpenseModalOpen(true);
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-rose-500" />
                        <span>Adicionar despesa no cartão</span>
                      </button>

                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                      <button
                        onClick={() => {
                          handleExportCardsCSV();
                          setIsHeaderMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-blue-500" />
                        <span>Exportar para CSV</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Month Dropdown Pill */}
            <div className="flex items-center justify-center sm:justify-start gap-2 self-center sm:self-auto">
              <button
                onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-4 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700/80 shadow-xs flex items-center gap-1.5">
                <span>{capitalizedMonth.toLowerCase()}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </span>

              <button
                onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Circular Action Buttons & ViewModeToggle */}
            <div className="hidden sm:flex items-center gap-2">
              <ViewModeToggle
                mode={viewMode}
                onChange={(m) => {
                  setViewMode(m);
                  try { localStorage.setItem('finly_cards_view_mode', m); } catch (e) {}
                }}
              />

              {cardsData.length > 0 && (
                <button
                  onClick={() => handleOpenPayModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  title="Pagar fatura de cartão"
                >
                  <CardIcon className="w-4 h-4" />
                  <span>Pagar Fatura</span>
                </button>
              )}

              <button
                onClick={onOpenNewCard}
                className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                title="Novo cartão"
              >
                <Plus className="w-5 h-5" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title="Mais opções"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isHeaderMenuOpen && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute right-0 top-12 z-50 w-56 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-2xl py-2 animate-in fade-in zoom-in-95 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    <button
                      onClick={() => {
                        onOpenNewCard();
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-purple-600" />
                      <span>Novo cartão de crédito</span>
                    </button>

                    <button
                      onClick={() => {
                        handleOpenPayModal();
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <CardIcon className="w-4 h-4 text-emerald-600" />
                      <span>Pagar fatura</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAddExpenseModalOpen(true);
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-rose-500" />
                      <span>Adicionar despesa no cartão</span>
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                    <button
                      onClick={() => {
                        handleExportCardsCSV();
                        setIsHeaderMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-blue-500" />
                      <span>Exportar para CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consolidated KPI Summary Cards (Finly Top Row) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Total das Faturas */}
            <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <span>Total das faturas ({capitalizedMonth})</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(totalInvoicesSum, user.currency, !user.showValues)}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/30 shrink-0">
                <DollarSign className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>

            {/* Card 2: Limite Total Comprometido (Consolidado) */}
            <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <span>Limite comprometido</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <span className="text-xs font-black text-rose-500">
                  {totalCommittedPercent.toFixed(1).replace('.', ',')}%
                </span>
              </div>

              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {formatCurrency(totalCommittedLimitSum, user.currency, !user.showValues)}
                <span className="text-xs text-slate-400 font-bold ml-1.5">de {formatCurrency(totalCreditLimitSum, user.currency, !user.showValues)}</span>
              </p>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${Math.min(100, Math.max(totalCommittedPercent > 0 ? 3 : 0, totalCommittedPercent))}%`,
                    backgroundColor: totalCommittedPercent > 85 ? '#ef5350' : totalCommittedPercent > 60 ? '#f59e0b' : '#7c4dff',
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Card 3: Limite Disponível Consolidado */}
            <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <span>Limite disponível total</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <p className="text-xl font-black text-[#66bb6a] tracking-tight">
                  {formatCurrency(totalAvailableLimitSum, user.currency, !user.showValues)}
                </p>
              </div>

              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/30 shrink-0">
                <CardIcon className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* Cards View: LIST (=) or GRID (||) */}
          {viewMode === 'list' ? (
            /* LIST VIEW (=) */
            <div className="flex flex-col gap-2.5">
              {/* Novo Cartao Row */}
              <div
                onClick={onOpenNewCard}
                className="p-3.5 rounded-2xl border-2 border-dashed border-slate-200/80 dark:border-slate-800 hover:border-purple-500/60 dark:hover:border-purple-500/60 bg-white/40 dark:bg-[#18181B]/40 hover:bg-slate-50 dark:hover:bg-[#202024] flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-bold text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 group"
              >
                <Plus className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                <span>Cadastrar Novo Cartão de Crédito</span>
              </div>

              {cardsData.map(card => (
                <div
                  key={card.id}
                  onClick={() => setActiveCardDetailId(card.id)}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] hover:bg-slate-50/90 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative cursor-pointer"
                >
                  {/* Left: Brand Logo + Card Name + Status */}
                  <div className="flex items-center gap-3 min-w-0 sm:min-w-[180px] w-full sm:w-auto">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center p-1.5 shrink-0 shadow-xs"
                      style={{ backgroundColor: card.color ? card.color + '25' : '#7c4dff25' }}
                    >
                      <CardBrandLogo brand={card.brand} size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">{card.name}</h4>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 inline-block mt-0.5 ${card.statusColor}`}>
                        {card.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Limits Progress Bar */}
                  <div className="flex-1 w-full sm:max-w-xs space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Disp: <span className="text-[#66bb6a] font-black">{formatCurrency(card.available, user.currency, !user.showValues)}</span></span>
                      <span className="text-slate-400 font-normal">Total: {formatCurrency(card.limit, user.currency, !user.showValues)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(card.usedPercentage > 0 ? 3 : 0, card.usedPercentage))}%`, backgroundColor: card.usedPercentage > 85 ? '#ef5350' : card.usedPercentage > 60 ? '#f59e0b' : '#7c4dff' }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Right: Invoice Amount & Dates */}
                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">Fatura {capitalizedMonth}</span>
                      <span className={`text-xs sm:text-sm font-black ${card.isPaid ? 'text-[#66bb6a]' : 'text-slate-900 dark:text-white'}`}>
                        {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-semibold">Vence dia {card.dueDay}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {card.invoiceTotal > 0 && !card.isPaid ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayModal(card);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-xs transition-colors cursor-pointer hover:scale-105"
                        >
                          Pagar Fatura
                        </button>
                      ) : card.isPaid ? (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const ok = await confirm({
                              title: 'Marcar Fatura como Não Paga?',
                              message: `Deseja marcar a fatura de ${card.name} como NÃO PAGA e estornar o valor?`,
                              confirmText: 'Sim, Marcar Não Paga',
                              cancelText: 'Cancelar',
                              type: 'warning'
                            });
                            if (ok) {
                              unpayCardInvoice(card.id, currentMonthPrefix);
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          title="Desfazer pagamento da fatura"
                        >
                          Desfazer Pago
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenPayModal(card);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                        >
                          Pagar Fatura
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCardDetailId(card.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider hover:bg-purple-100 transition-colors cursor-pointer"
                      >
                        Ver Fatura
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* GRID BLOCKS VIEW (||) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* + Novo Cartão Card */}
              <div
                onClick={onOpenNewCard}
                className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm hover:shadow-md dark:hover:shadow-black/50 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[220px] group"
              >
                <div className="w-11 h-11 rounded-full border-2 border-purple-500/80 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                  Novo cartão
                </span>
              </div>

              {/* List of Credit Cards */}
              {cardsData.map(card => (
                <div
                  key={card.id}
                  onClick={() => setActiveCardDetailId(card.id)}
                  className="p-5 rounded-[25px] bg-white dark:bg-[#18181B] hover:bg-slate-50/90 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-sm hover:shadow-lg dark:hover:shadow-black/60 hover:-translate-y-0.5 transition-all duration-200 space-y-4 relative group flex flex-col justify-between cursor-pointer"
                >
                  {/* Header: Brand + Name + 3-dots Menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center p-1 text-xs shrink-0 shadow-xs"
                        style={{ backgroundColor: card.color ? card.color + '25' : '#7c4dff25' }}
                      >
                        <CardBrandLogo brand={card.brand} size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                          {card.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 inline-block mt-0.5 ${card.statusColor}`}>
                          {card.statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* 3-dots Menu */}
                    <div className="relative" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuCardId(openMenuCardId === card.id ? null : card.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuCardId === card.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-0 top-7 z-30 w-48 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 animate-in fade-in zoom-in-95 text-xs font-bold"
                      >
                        <button
                          onClick={async () => {
                            setActiveCardDetailId(card.id);
                            setOpenMenuCardId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 flex items-center gap-2 cursor-pointer"
                        >
                          <Banknote className="w-3.5 h-3.5 text-purple-600" />
                          <span>Ver Fatura / Extrato</span>
                        </button>

                        {card.isPaid && (
                          <button
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Marcar Fatura como Não Paga?',
                                message: `Marcar a fatura de ${card.name} como NÃO PAGA?`,
                                confirmText: 'Marcar Não Paga',
                                type: 'warning'
                              });
                              if (ok) {
                                unpayCardInvoice(card.id, currentMonthPrefix);
                              }
                              setOpenMenuCardId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Marcar como não paga</span>
                          </button>
                        )}

                        <button
                          onClick={async () => {
                            setEditingCard(card);
                            setIsEditModalOpen(true);
                            setOpenMenuCardId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 flex items-center gap-2 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar Cartão</span>
                        </button>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                        <button
                          onClick={async () => {
                            setOpenMenuCardId(null);
                            const ok = await confirm({
                              title: 'Excluir Cartão de Crédito',
                              message: `Tem certeza que deseja excluir o cartão ${card.name}? Você poderá desfazer nos primeiros segundos.`,
                              confirmText: 'Excluir Cartão',
                              type: 'danger'
                            });
                            if (ok) {
                              deleteCard(card.id);
                            }
                          }}
                          className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body: Fatura Atual Amount + Limits */}
                <div className="space-y-2">
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold block">Fatura de {capitalizedMonth}</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(card.invoiceTotal, user.currency, !user.showValues)}
                    </span>
                  </div>

                  {/* Limit Progress Bar */}
                  <div className="space-y-1.5">
                    {/* Multi-segment Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex shadow-inner">
                      {/* Segment 1: Fatura Atual Aberta */}
                      {card.currentInvoicePercent > 0 && (
                        <div
                          style={{ width: `${Math.min(100, card.currentInvoicePercent)}%` }}
                          className="h-full bg-[#7c4dff] transition-all duration-500"
                          title={`Fatura deste mês: ${formatCurrency(card.currentOpenInvoice, user.currency)}`}
                        />
                      )}
                      {/* Segment 2: Parcelas Futuras */}
                      {card.futureInstallmentsPercent > 0 && (
                        <div
                          style={{ width: `${Math.min(100 - Math.min(100, card.currentInvoicePercent), card.futureInstallmentsPercent)}%` }}
                          className="h-full bg-[#ff8a00] transition-all duration-500"
                          title={`Parcelas futuras: ${formatCurrency(card.futureInstallmentsTotal, user.currency)}`}
                        />
                      )}
                    </div>

                    <div className="flex flex-wrap justify-between items-center text-[10px] font-bold text-slate-400 gap-1">
                      <span>
                        Disp: <strong className={card.available > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>
                          {formatCurrency(card.available, user.currency, !user.showValues)}
                        </strong> de {formatCurrency(card.limit, user.currency, !user.showValues)}
                      </span>
                      {card.futureInstallmentsTotal > 0 ? (
                        <span className="text-amber-500">Futuras: {formatCurrency(card.futureInstallmentsTotal, user.currency, !user.showValues)}</span>
                      ) : (
                        <span>{card.usedPercentage.toFixed(1).replace('.', ',')}% usado</span>
                      )}
                    </div>

                    {card.isOverLimit && (
                      <div className="text-[10px] font-extrabold text-rose-500 flex items-center justify-between bg-rose-500/10 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-500/20">
                        <span>⚠️ Limite ultrapassado</span>
                        <span>+{formatCurrency(card.overLimitAmount, user.currency, !user.showValues)}</span>
                      </div>
                    )}
                  </div>

                  {/* Dates Row */}
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1">
                    <span>Fecha dia: <strong>{card.closingDay}</strong></span>
                    <span>Vence dia: <strong>{card.dueDay}</strong></span>
                  </div>
                </div>

                {/* Footer Buttons: Pagar Fatura & Ver Fatura */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveCardDetailId(card.id)}
                    className="text-[10px] font-black text-purple-600 dark:text-purple-400 hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    VER FATURA
                  </button>

                  <div className="flex items-center gap-1.5">
                    {card.invoiceTotal > 0 && !card.isPaid ? (
                      <button
                        onClick={async () => {
                          handleOpenPayModal(card);
                        }}
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer hover:scale-105"
                      >
                        Pagar Fatura
                      </button>
                    ) : card.isPaid ? (
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Marcar Fatura como Não Paga?',
                            message: `Deseja marcar a fatura de ${card.name} como NÃO PAGA e estornar o valor?`,
                            confirmText: 'Sim, Marcar Não Paga',
                            cancelText: 'Cancelar',
                            type: 'warning'
                          });
                          if (ok) {
                            unpayCardInvoice(card.id, currentMonthPrefix);
                          }
                        }}
                        className="px-2.5 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        title="Desfazer pagamento da fatura"
                      >
                        Desfazer Pago
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          handleOpenPayModal(card);
                        }}
                        className="px-2.5 py-1 rounded-full border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Pagar Fatura
                      </button>
                    )}

                    <button
                      onClick={async () => {
                        setSelectedCardForExpense(card.id);
                        setIsAddExpenseModalOpen(true);
                      }}
                      className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors cursor-pointer"
                      title="Adicionar despesa neste cartão"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}

      {/* MODAL: EDITAR CARTÃO */}
      {isEditModalOpen && (
        <CardModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCard(null);
          }}
          editingCard={editingCard}
        />
      )}

      {/* MODAL: PAGAR FATURA */}
      {isPayModalOpen && payingCard && (
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => {
            setIsPayModalOpen(false);
            setPayingCard(null);
          }}
          title={`Pagar Fatura - ${payingCard.name}`}
          maxWidth="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[11px] text-slate-400 font-semibold block">Total dos Lançamentos</span>
                <span className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(
                    payingCardTxs.reduce((s, t) => s + t.amount, 0),
                    user.currency,
                    !user.showValues
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsPayModalOpen(false);
                    setPayingCard(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="credit-tab-pay-form"
                  disabled={isPayingInvoice || payingCardTxs.length === 0}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
                >
                  {isPayingInvoice ? 'Processando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </div>
          }
        >
          <form id="credit-tab-pay-form" onSubmit={handlePayInvoiceSubmit} className="space-y-4">
            {/* Resumo do Cartão e Período */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-7 flex items-center justify-center shrink-0">
                  <CardBrandLogo brand={payingCard.brand} size={28} className="w-10 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase">{payingCard.name}</p>
                  <p className="text-[11px] text-slate-400">
                    Fatura de {capitalizedMonth} de {yearNum} • Vence dia {payingCard.dueDay}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total da Fatura</span>
                <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(
                    payingCardTxs.reduce((sum, t) => sum + t.amount, 0),
                    user.currency,
                    !user.showValues
                  )}
                </span>
              </div>
            </div>

            {/* Seleção do Cartão & Conta para Débito */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cartão Selecionado
                </label>
                <select
                  value={payingCard.id}
                  onChange={e => {
                    const card = cardsData.find(c => c.id === e.target.value);
                    if (card) {
                      setPayingCard(card);
                      setPayAmount(card.invoiceTotal > 0 ? card.invoiceTotal.toFixed(2) : '');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {cardsData.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatCurrency(c.invoiceTotal, user.currency)}) {c.isPaid ? '✓ Paga' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Debitar da Conta Bancária
                </label>
                <select
                  value={payAccountId}
                  onChange={e => setPayAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Valor do Pagamento */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Valor do Pagamento (R$) *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const total = payingCardTxs.reduce((sum, t) => sum + t.amount, 0);
                    setPayAmount(total > 0 ? total.toFixed(2) : '');
                  }}
                  className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                >
                  Pagar valor integral
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
                placeholder="0.00"
              />
            </div>

            {/* SEÇÃO: LANÇAMENTOS DA FATURA */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lançamentos desta Fatura ({payingCardTxs.length})
                </label>
                <span className="text-[11px] text-slate-400">
                  {capitalizedMonth} de {yearNum}
                </span>
              </div>

              <div className="max-h-52 sm:max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-900/60 divide-y divide-slate-100 dark:divide-slate-800/80 scrollbar-thin">
                {payingCardTxs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <p className="text-xs font-medium">Nenhum lançamento registrado nesta fatura.</p>
                  </div>
                ) : (
                  payingCardTxs.map(t => {
                    const cat = categories.find(c => c.id === t.categoryId);
                    const sub = cat?.subcategories?.find(s => s.id === t.subcategoryId);
                    return (
                      <div
                        key={t.id}
                        className="p-3 px-3.5 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
                            style={{
                              backgroundColor: (cat?.color || '#7c4dff') + '20',
                              color: cat?.color || '#7c4dff',
                            }}
                          >
                            {cat?.icon || '💳'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {t.description}
                              </span>
                              {t.installments && t.installments.total > 1 && (
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                                  {t.installments.current}/{t.installments.total}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span className="font-mono">{formatDate(t.date)}</span>
                              {cat?.name && <span>• {cat.name}</span>}
                              {sub?.name && <span>/ {sub.name}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-xs text-rose-600 dark:text-rose-400 block">
                            {formatCurrency(t.amount, user.currency, !user.showValues)}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5 ${
                              t.status === 'completed'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {t.status === 'completed' ? 'Pago' : 'Aberto'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ADICIONAR DESPESA NO CARTÃO */}
      {isAddExpenseModalOpen && (
        <TransactionModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => {
            setIsAddExpenseModalOpen(false);
            setSelectedCardForExpense(null);
            setEditingInvoiceTx(null);
          }}
          initialType="expense"
          initialCardId={selectedCardForExpense || undefined}
          editingTransaction={editingInvoiceTx}
        />
      )}

      {/* Transaction Detail Modal */}
      {selectedDetailTx && (
        <TransactionDetailModal
          isOpen={!!selectedDetailTx}
          onClose={() => setSelectedDetailTx(null)}
          transaction={selectedDetailTx}
          onEdit={(tx: Transaction) => {
            setEditingInvoiceTx(tx);
            setSelectedCardForExpense(tx.cardId || null);
            setIsAddExpenseModalOpen(true);
          }}
          onDuplicate={(tx: Transaction) => {
            setEditingInvoiceTx({
              ...tx,
              id: '',
              description: `${tx.description} (Cópia)`,
            });
            setSelectedCardForExpense(tx.cardId || null);
            setIsAddExpenseModalOpen(true);
          }}
        />
      )}
    </div>
  );
};
