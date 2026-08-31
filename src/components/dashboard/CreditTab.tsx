import React, { useState, useMemo } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString, calculateCardInvoiceStatus } from '../../utils/formatters';
import { CardBrandLogo } from '../../utils/bankLogos';
import { CardModal } from '../cadastros/CardModal';
import { TransactionModal } from '../transactions/TransactionModal';
import { Modal } from '../ui/Modal';
import { CreditCard as CreditCardType, Transaction } from '../../types';

export const CreditTab: React.FC<{ onOpenNewCard: () => void }> = ({ onOpenNewCard }) => {
  const { cards, user, transactions, accounts, categories, payCardInvoice, unpayCardInvoice, toggleTransactionStatus, deleteCard, addTransaction, deleteTransaction } = useFinancial();
  const { confirm } = useConfirm();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [activeCardDetailId, setActiveCardDetailId] = useState<string | null>(null);

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
  
  const getStatusBadge = (t: Transaction) => {
    const isIncome = t.type === 'income';
    const isTransfer = t.type === 'transfer';
    const isCard = !!t.cardId;
    const isCompleted = t.status === 'completed';

    let label = '';
    let styleClass = '';
    let icon = null;

    if (isIncome) {
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

  
  const handleExportCardsCSV = () => {
    const headers = ['Cartao', 'Bandeira', 'Limite Total', 'Limite Disponivel', 'Fatura Atual', 'Fechamento', 'Vencimento', 'Status'];
    const rows = cardsData.map(c => [
      c.name,
      c.brand,
      c.limit.toFixed(2),
      c.available.toFixed(2),
      c.invoiceTotal.toFixed(2),
      `Dia ${c.closingDay}`,
      `Dia ${c.dueDay}`,
      c.statusLabel
    ].join(';'));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cartoes_${currentMonthPrefix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* ========================================================================= */}
      {/* CASE 1: DETALHE DA FATURA DO CARTÃO (INVOICE EXTRATO SCREEN) */}
      {/* ========================================================================= */}
      {activeCardDetail ? (
        <div className="space-y-6 animate-in fade-in">
          {/* Back button & Title */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveCardDetailId(null)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Cartões</span>
            </button>


            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  setSelectedCardForExpense(activeCardDetail.id);
                  setIsAddExpenseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Despesa</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                  className="w-10 h-10 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
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
                          setPayingCard(activeCardDetail);
                          setPayAmount(activeCardDetail.invoiceTotal.toFixed(2));
                          setIsPayModalOpen(true);
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
                        handleExportCardsCSV();
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-blue-500" />
                      <span>Exportar fatura para CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Card Invoice Header Summary */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center p-2 shadow-xs"
                  style={{ backgroundColor: activeCardDetail.color ? activeCardDetail.color + '25' : '#7c4dff25' }}
                >
                  <CardBrandLogo brand={activeCardDetail.brand} size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {activeCardDetail.name}
                  </h3>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${activeCardDetail.statusColor}`}>
                    {activeCardDetail.statusLabel}
                  </span>
                </div>
              </div>

              {/* Month Selector for Invoice */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-4 py-1.5 rounded-full bg-slate-50 dark:bg-[#343437] border border-slate-200 dark:border-slate-700">
                  Fatura de {capitalizedMonth} {yearNum}
                </span>
                <button
                  onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Invoice Total + Pay CTA */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 font-bold block">Valor da Fatura</span>
                  <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {formatCurrency(activeCardDetail.invoiceTotal, user.currency, !user.showValues)}
                  </span>
                </div>

                {activeCardDetail.invoiceTotal > 0 && !activeCardDetail.isPaid ? (
                  <button
                    onClick={async () => {
                      setPayingCard(activeCardDetail);
                      setPayAmount(activeCardDetail.invoiceTotal.toFixed(2));
                      setIsPayModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/25 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
                    className="px-4 py-2 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                    title="Desfazer pagamento e marcar fatura como pendente"
                  >
                    Marcar como não paga
                  </button>
                ) : null}
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
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Lançamentos desta Fatura ({activeCardDetail.monthTxs.length})
            </h4>

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

                    <div key={t.id} className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/50 dark:hover:bg-[#343437]/30 px-2 rounded-2xl transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
{getStatusBadge(t)}
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-xs"
                          style={{
                            backgroundColor: (cat?.color || '#7c4dff') + '20',
                            color: cat?.color || '#7c4dff',
                          }}
                        >
                          {cat?.icon || '💳'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{t.description}</p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {formatDate(t.date)} • {cat?.name || 'Geral'}
                            {t.installments ? ` • Parcela ${t.installments.current}/${t.installments.total}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                          -{formatCurrency(t.amount, user.currency, !user.showValues)}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingInvoiceTx(t);
                              setIsAddExpenseModalOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                            title="Editar lançamento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
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
        /* CASE 2: VISÃO GERAL DE TODOS OS CARTÕES (MOBILLS OVERVIEW SPEC) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Topbar: Title, Month Selector & Action Buttons */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Cartões de crédito
            </h2>

            {/* Month Dropdown Pill */}
            <div className="flex items-center gap-2">
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

            {/* Circular Action Buttons */}
            <div className="flex items-center gap-2">
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
                        setIsPayModalOpen(true);
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

          {/* Consolidated KPI Summary Cards (PlannerFin Top Row) */}
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

          {/* Cards Grid: "+ Novo Cartão" + All Credit Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* + Novo Cartão Card */}
            <div
              onClick={onOpenNewCard}
              className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer min-h-[220px] group hover:border-purple-500/60 transition-all"
            >
              <div className="w-11 h-11 rounded-full border-2 border-purple-500 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-black text-purple-500 uppercase tracking-wider">
                Novo cartão
              </span>
            </div>

            {/* List of Credit Cards */}
            {cardsData.map(card => (
              <div
                key={card.id}
                className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4 relative group flex flex-col justify-between"
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
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.statusColor}`}>
                        {card.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* 3-dots Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuCardId(openMenuCardId === card.id ? null : card.id)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {openMenuCardId === card.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-0 top-7 z-30 w-48 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 animate-in fade-in zoom-in-95 text-xs font-bold"
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
                              message: `Tem certeza que deseja excluir o cartão ${card.name}? Esta ação não pode ser desfeita.`,
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

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
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
                          setPayingCard(card);
                          setPayAmount(card.invoiceTotal.toFixed(2));
                          setIsPayModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer hover:scale-105"
                      >
                        Pagar
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
                    ) : null}

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
        >
          <form onSubmit={handlePayInvoiceSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor do Pagamento</label>
              <input
                type="number"
                step="0.01"
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Conta para Débito</label>
              <select
                value={payAccountId}
                onChange={e => setPayAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, user.currency)})</option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                Confirmar Pagamento
              </button>
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
          }}
          initialType="expense"
          initialCardId={selectedCardForExpense || undefined}
        />
      )}
    </div>
  );
};
