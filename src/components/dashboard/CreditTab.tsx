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
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { CardBrandLogo } from '../../utils/bankLogos';
import { CardModal } from '../cadastros/CardModal';
import { TransactionModal } from '../transactions/TransactionModal';
import { Modal } from '../ui/Modal';
import { CreditCard as CreditCardType, Transaction } from '../../types';

export const CreditTab: React.FC<{ onOpenNewCard: () => void }> = ({ onOpenNewCard }) => {
  const { cards, user, transactions, accounts, categories, payCardInvoice, unpayCardInvoice, toggleTransactionStatus, deleteCard, addTransaction } = useFinancial();
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
      const invoiceTotal = monthTxs.reduce((sum, t) => sum + t.amount, 0);

      const totalSpent = cardTxs.reduce((sum, t) => sum + t.amount, 0);
      const available = Math.max(0, card.limit - totalSpent);
      const usedPercentage = card.limit > 0 ? Math.min(100, (invoiceTotal / card.limit) * 100) : 0;

      const today = getTodayString();
      const todayDay = parseInt(today.split('-')[2]);
      const isPaid = monthTxs.length > 0 && monthTxs.every(t => t.status === 'completed');
      const isOverdue = !isPaid && invoiceTotal > 0 && selectedMonthOffset <= 0 && todayDay > card.dueDay;
      const isClosed = todayDay >= card.closingDay;

      let statusLabel = 'Fatura aberta';
      let statusColor = 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30';

      if (isPaid) {
        statusLabel = 'Fatura paga ✓';
        statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      } else if (isOverdue) {
        statusLabel = 'Fatura vencida!';
        statusColor = 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
      } else if (isClosed) {
        statusLabel = 'Fatura fechada';
        statusColor = 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
      }

      return {
        ...card,
        invoiceTotal,
        available,
        usedPercentage,
        monthTxs,
        cardTxs,
        statusLabel,
        statusColor,
        isPaid,
      };
    });
  }, [cards, transactions, currentMonthPrefix, selectedMonthOffset]);

  // Consolidated KPIs
  const totalInvoicesSum = useMemo(() => {
    return cardsData.reduce((sum, c) => sum + c.invoiceTotal, 0);
  }, [cardsData]);

  const totalAvailableLimitSum = useMemo(() => {
    return cardsData.reduce((sum, c) => sum + c.available, 0);
  }, [cardsData]);

  // Selected Card for Detail View
  const activeCardDetail = useMemo(() => {
    if (!activeCardDetailId) return null;
    return cardsData.find(c => c.id === activeCardDetailId) || null;
  }, [cardsData, activeCardDetailId]);

  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0 || !payAccountId) return;

    payCardInvoice(payingCard.id, payAccountId, amt, currentMonthPrefix);

    setIsPayModalOpen(false);
    setPayingCard(null);
    setPayAmount('');
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
                      setPayAmount(activeCardDetail.invoiceTotal.toString());
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

            {/* Sub-info: Closing & Due dates + Limit bar */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
              <div>
                <span className="text-slate-400 block text-[11px]">Fechamento da Fatura</span>
                <span className="text-slate-800 dark:text-slate-200">Todo dia {activeCardDetail.closingDay}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Vencimento da Fatura</span>
                <span className="text-slate-800 dark:text-slate-200">Todo dia {activeCardDetail.dueDay}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Limite Disponível</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(activeCardDetail.available, user.currency, !user.showValues)} de {formatCurrency(activeCardDetail.limit, user.currency, !user.showValues)}
                </span>
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
                    <div key={t.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleTransactionStatus(t.id)}
                          className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer"
                          title={t.status === 'completed' ? 'Marcar como pendente' : 'Marcar como pago'}
                        >
                          {t.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-xs"
                          style={{
                            backgroundColor: (cat?.color || '#7c4dff') + '20',
                            color: cat?.color || '#7c4dff',
                          }}
                        >
                          {cat?.icon || '💳'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{t.description}</p>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(t.date)} • {cat?.name || 'Geral'}
                            {t.installments ? ` • Parcela ${t.installments.current}/${t.installments.total}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-rose-600 dark:text-rose-400 block">
                          -{formatCurrency(t.amount, user.currency, !user.showValues)}
                        </span>
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
              </div>
            </div>
          </div>

          {/* Consolidated KPI Summary Cards (Mobills Top Row) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Total das Faturas */}
            <div className="p-5 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                  <span>Total das faturas</span>
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

            {/* Card 2: Limite Disponível Consolidado */}
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

              <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-black shadow-md shadow-purple-600/30 shrink-0">
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
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>Limite disp: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(card.available, user.currency, !user.showValues)}</strong></span>
                      <span>Total: {formatCurrency(card.limit, user.currency, !user.showValues)}</span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(3, card.usedPercentage))}%`,
                          backgroundColor: card.usedPercentage > 85 ? '#ef5350' : card.color || '#7c4dff',
                        }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
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
                          setPayAmount(card.invoiceTotal.toString());
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
