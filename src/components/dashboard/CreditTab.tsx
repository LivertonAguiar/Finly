import { CardModal } from '../cadastros/CardModal';
import React, { useState, useMemo } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Edit,
  FileText,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  DollarSign,
  Clock,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getCurrentMonth, getTodayString } from '../../utils/formatters';
import { CardBrandLogo } from '../../utils/bankLogos';
import { Modal } from '../ui/Modal';
import { CreditCard as CreditCardType } from '../../types';

export const CreditTab: React.FC<{ onOpenNewCard: () => void }> = ({ onOpenNewCard }) => {
  const { cards, metrics, user, transactions, accounts, categories, payCardInvoice, deleteCard } = useFinancial();

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [activeCardDetailId, setActiveCardDetailId] = useState<string | null>(null);

  // Pay Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingCard, setPayingCard] = useState<CreditCardType | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCardType | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [payAccountId, setPayAccountId] = useState(accounts[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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

  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 7);
  const nextDueDateStr = nextDueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getCardInvoiceData = (card: CreditCardType) => {
    const cardTxs = transactions.filter(t => t.cardId === card.id && t.type === 'expense');
    const monthTxs = cardTxs.filter(t => t.date.startsWith(currentMonthPrefix));
    const invoiceTotal = monthTxs.reduce((sum, t) => sum + t.amount, 0);

    const totalSpent = cardTxs.reduce((sum, t) => sum + t.amount, 0);
    const available = Math.max(0, card.limit - totalSpent);
    const usedPercentage = card.limit > 0 ? Math.min(100, (invoiceTotal / card.limit) * 100) : 0;

    const today = getTodayString();
    const isPaid = monthTxs.length > 0 && monthTxs.every(t => t.status === 'completed');
    const isOverdue = !isPaid && invoiceTotal > 0 && selectedMonthOffset <= 0 && parseInt(today.split('-')[2]) > card.dueDay;
    const isClosed = parseInt(today.split('-')[2]) >= card.closingDay;

    let statusText = 'Fatura aberta';
    let statusClass = 'text-emerald-600 dark:text-emerald-400';

    if (isPaid) {
      statusText = 'Fatura paga ✓';
      statusClass = 'text-emerald-600 dark:text-emerald-400';
    } else if (isOverdue) {
      statusText = 'Fatura vencida!';
      statusClass = 'text-amber-600 dark:text-amber-500';
    } else if (isClosed) {
      statusText = 'Fatura fechada';
      statusClass = 'text-blue-600 dark:text-blue-400';
    }

    return {
      cardTxs,
      monthTxs,
      invoiceTotal,
      totalSpent,
      available,
      usedPercentage,
      statusText,
      statusClass,
      isOverdue,
      isPaid,
    };
  };

  const timelineChartData = useMemo(() => {
    const offsets = [-2, -1, 0, 1, 2, 3, 4];
    return offsets.map(offset => {
      const d = new Date();
      d.setMonth(d.getMonth() + offset);
      const mPrefix = d.toISOString().substring(0, 7);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
      const yr = d.getFullYear().toString().substring(2);

      const totalMonth = transactions
        .filter(t => t.cardId && t.type === 'expense' && t.date.startsWith(mPrefix))
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        mes: `${label}/${yr}`,
        Fatura: totalMonth,
        isCurrent: offset === 0,
        isFuture: offset > 0,
      };
    });
  }, [transactions]);

  const categoryChartData = useMemo(() => {
    const cardExpenses = transactions.filter(t => t.cardId && t.type === 'expense' && t.date.startsWith(currentMonthPrefix));
    const map: Record<string, { name: string; icon: string; amount: number }> = {};

    cardExpenses.forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const name = cat ? cat.name : 'Outros';
      const icon = cat?.icon || '📁';
      if (!map[name]) map[name] = { name, icon, amount: 0 };
      map[name].amount += t.amount;
    });

    const colors = ['#00a884', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#6366f1'];
    return Object.values(map).map((item, idx) => ({
      name: `${item.icon} ${item.name}`,
      value: item.amount,
      color: colors[idx % colors.length],
    }));
  }, [transactions, currentMonthPrefix, categories]);

  const cardComparisonChartData = useMemo(() => {
    return cards.map(c => {
      const monthInvoice = transactions
        .filter(t => t.cardId === c.id && t.type === 'expense' && t.date.startsWith(currentMonthPrefix))
        .reduce((sum, t) => sum + t.amount, 0);
      const totalAccumulated = transactions
        .filter(t => t.cardId === c.id && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      const available = Math.max(0, c.limit - totalAccumulated);

      return {
        name: c.name.split(' ')[0],
        FaturaAtual: monthInvoice,
        LimiteDisponivel: available,
        LimiteTotal: c.limit,
      };
    });
  }, [cards, transactions, currentMonthPrefix]);

  const handleOpenPay = (card: CreditCardType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPayingCard(card);
    setIsSuccess(false);
    setShowPayModal(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCard) return;
    const data = getCardInvoiceData(payingCard);
    const amountToPay = data.invoiceTotal > 0 ? data.invoiceTotal : payingCard.limit * 0.1;
    const accountToUse = payAccountId || accounts[0]?.id;

    payCardInvoice(payingCard.id, accountToUse, amountToPay, currentMonthPrefix);
    setIsSuccess(true);
    setTimeout(() => {
      setShowPayModal(false);
      setIsSuccess(false);
    }, 1200);
  };

  const detailCard = cards.find(c => c.id === activeCardDetailId);

  return (
    <div className="max-w-3xl mx-auto space-y-7 animate-in fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-emerald-500" /> Cartões de Crédito
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gestão integrada de faturas, parcelas e limites</p>
        </div>

        <button
          onClick={onOpenNewCard}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Novo Cartão
        </button>
      </div>

      {detailCard ? (
        // DETAIL VIEW
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-between w-full">
                <button
                  onClick={() => setActiveCardDetailId(null)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-purple-500 shadow-xs transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Voltar para Cartões</span>
                </button>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">{detailCard.name}</h2>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 py-1">
            <button
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">{capitalizedMonth} {yearNum}</span>
            <button
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {(() => {
            const data = getCardInvoiceData(detailCard);
            const filteredTxs = data.monthTxs.filter(t =>
              searchTerm.trim() ? t.description.toLowerCase().includes(searchTerm.toLowerCase()) : true
            );

            return (
              <>
                <div className="p-6 rounded-3xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-9 flex items-center justify-center mb-1">
                      <CardBrandLogo brand={detailCard.brand} size={32} className="w-12 h-7" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">{detailCard.name}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Dia do fechamento</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Fechou dia {detailCard.closingDay}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Data vencimento</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Dia {detailCard.dueDay}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Status da fatura</span>
                      </div>
                      <p className={`text-xs font-bold mt-0.5 ${data.statusClass}`}>{data.statusText}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Total fatura</span>
                      </div>
                      <p className="text-xs font-extrabold text-rose-600 dark:text-rose-500 mt-0.5">
                        {formatCurrency(data.invoiceTotal, user.currency, !user.showValues)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenPay(detailCard)}
                    className="w-full py-3.5 rounded-2xl bg-[#00a884] hover:bg-[#008f70] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#00a884]/25 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                  >
                    CONFIRMAR PAGAMENTO
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Despesas da Fatura ({filteredTxs.length})
                    </span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(data.invoiceTotal, user.currency, !user.showValues)}
                    </span>
                  </div>

                  {filteredTxs.length === 0 ? (
                    <div className="py-8 text-center rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400">Nenhuma despesa nesta fatura.</p>
                    </div>
                  ) : (
                    filteredTxs.map(t => (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-600/30 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
                            💳
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{t.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">DESPESA CARTÃO</span>
                              <span className="text-[10px] text-slate-400">• {formatDate(t.date)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-black text-rose-600 dark:text-rose-400">
                            {formatCurrency(t.amount, user.currency, !user.showValues)}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            {t.status === 'completed' ? '✓ Pago' : '⏳ Pendente'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </div>
      ) : (
        // MAIN VIEW
        <div className="space-y-7">
          <div className="flex items-center justify-center gap-6 py-1">
            <button
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
              {capitalizedMonth} {yearNum}
            </span>
            <button
              onClick={() => setSelectedMonthOffset(prev => prev + 1)}
              className="p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center space-y-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sua próxima fatura vence em</p>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{nextDueDateStr}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="text-left p-3.5 rounded-2xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-md">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Limite disponível</span>
                </div>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(metrics.totalCreditAvailable, user.currency, !user.showValues)}
                </p>
              </div>

              <div className="text-left p-3.5 rounded-2xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-md">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Valor total faturas</span>
                </div>
                <p className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(metrics.totalCreditUsed, user.currency, !user.showValues)}
                </p>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Faturas dos Cartões ({cards.length})
            </h3>

            {cards.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 text-slate-400 space-y-3 shadow-xs">
                <p className="text-xs">Nenhum cartão de crédito cadastrado.</p>
                <button
                  onClick={onOpenNewCard}
                  className="px-4 py-2 rounded-xl bg-[#00a884] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Adicionar Primeiro Cartão
                </button>
              </div>
            ) : (
              cards.map(card => {
                const data = getCardInvoiceData(card);

                return (
                  <div
                    key={card.id}
                    onClick={() => setActiveCardDetailId(card.id)}
                    className="p-5 rounded-3xl bg-white dark:bg-[#1e222d] hover:bg-slate-50 dark:hover:bg-[#252b38] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl transition-all cursor-pointer space-y-4 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-6 flex items-center justify-center">
                          <CardBrandLogo brand={card.brand} size={28} className="w-10 h-6" />
                        </div>
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{card.name}</span>
                      </div>

                      {/* Action Menu (3-dots) */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenCardMenuId(openCardMenuId === card.id ? null : card.id);
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu Popup */}
                        {openCardMenuId === card.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-30 w-48 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 shadow-xl py-1.5 animate-in fade-in zoom-in-95"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCard(card);
                                setIsEditModalOpen(true);
                                setOpenCardMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar Cartão</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCardDetailId(card.id);
                                setOpenCardMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver Extrato da Fatura</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPay(card);
                                setOpenCardMenuId(null);
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Confirmar Pagamento</span>
                            </button>

                            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenCardMenuId(null);
                                if (window.confirm(`Deseja realmente excluir o cartão ${card.name}? Esta ação não apagará seus lançamentos já realizados.`)) {
                                  deleteCard(card.id);
                                }
                              }}
                              className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir Cartão</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className={`text-xs font-bold ${data.statusClass}`}>{data.statusText}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Valor total</span>
                        <span className="text-xs font-extrabold text-rose-600 dark:text-rose-500">
                          {formatCurrency(data.invoiceTotal, user.currency, !user.showValues)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Vence em</span>
                        <span>{card.dueDay} {capitalizedMonth.toLowerCase().substring(0, 3)}., {yearNum}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-[#11141b] h-3.5 rounded-full overflow-hidden flex items-center relative p-0.5">
                        <div
                          style={{ width: `${Math.max(5, data.usedPercentage)}%` }}
                          className="bg-[#00a884] h-full rounded-full transition-all duration-500"
                        />
                        <span className="absolute right-2 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                          {data.usedPercentage.toFixed(2).replace('.', ',')}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                        <span>
                          {formatCurrency(data.invoiceTotal, user.currency, !user.showValues)} de {formatCurrency(card.limit, user.currency, !user.showValues)}
                        </span>
                        <span>Restam {formatCurrency(data.available, user.currency, !user.showValues)}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleOpenPay(card, e)}
                        className="text-xs font-black text-[#00a884] hover:text-[#008f70] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        CONFIRMAR PAGAMENTO
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Integrated Graphs */}
          <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              Resumo Gráfico & Projeções
            </h3>

            {/* Chart 1 */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">Evolução & Projeção das Faturas</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Histórico de faturas passadas e parcelas futuras</p>
                </div>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={val => `R$${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                      formatter={(val: number) => [formatCurrency(val, user.currency), 'Fatura']}
                    />
                    <Bar dataKey="Fatura" radius={[6, 6, 0, 0]}>
                      {timelineChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isCurrent ? '#00a884' : entry.isFuture ? '#8b5cf6' : '#3b82f6'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px] font-bold">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                  <span className="text-slate-600 dark:text-slate-400">Passadas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#00a884]" />
                  <span className="text-emerald-600 dark:text-emerald-400">Mês Atual</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#8b5cf6]" />
                  <span className="text-purple-600 dark:text-purple-400">Parcelas Futuras</span>
                </div>
              </div>
            </div>

            {/* Row with 2 Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category Donut */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <PieIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Gastos por Categoria</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{capitalizedMonth}</p>
                  </div>
                </div>

                {categoryChartData.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma despesa de cartão neste mês.
                  </div>
                ) : (
                  <div className="h-48 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={68}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-cat-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold',
                          }}
                          formatter={(val: number) => [formatCurrency(val, user.currency), 'Total']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Limit Comparison */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#1e222d] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">Uso de Limite</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Fatura vs Disponível</p>
                  </div>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cardComparisonChartData} layout="vertical" margin={{ top: 10, right: 15, left: 5, bottom: 0 }}>
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={v => `R$${v}`} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={55} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        formatter={(val: number) => formatCurrency(val, user.currency)}
                      />
                      <Bar dataKey="FaturaAtual" fill="#ef4444" name="Fatura" radius={[0, 4, 4, 0]} stackId="a" />
                      <Bar dataKey="LimiteDisponivel" fill="#10b981" name="Disponível" radius={[0, 4, 4, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Payment Confirmation Modal */}
      {showPayModal && payingCard && (
        <Modal
          isOpen={showPayModal}
          onClose={() => setShowPayModal(false)}
          title="Confirmar Pagamento de Fatura"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e222d] border border-slate-200 dark:border-slate-800 text-center space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400">Valor da Fatura ({payingCard.name})</span>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(getCardInvoiceData(payingCard).invoiceTotal || payingCard.limit * 0.1, user.currency)}
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Referente ao mês {capitalizedMonth}/{yearNum}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Debitar da Conta Bancária:
              </label>
              <select
                value={payAccountId}
                onChange={e => setPayAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
                  </option>
                ))}
              </select>
            </div>

            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center animate-in fade-in">
                ✓ Pagamento efetuado com sucesso! Saldo atualizado.
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f70] text-xs font-black text-white shadow-lg cursor-pointer transition-all active:scale-95"
              >
                Confirmar Pagamento
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
