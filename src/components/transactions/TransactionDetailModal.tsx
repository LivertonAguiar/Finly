import React, { useMemo } from 'react';
import {
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  CreditCard as CardIcon,
  Building2,
  Calendar,
  CalendarX,
  Tag as TagIcon,
  FileText,
  User as UserIcon,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ChevronRight,
  AlertCircle,
  Copy,
  Paperclip,
  Bell,
  Download,
  ExternalLink,
  Repeat,
  Landmark,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useBackButton } from '../../hooks/useBackButton';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { resolveCategory } from '../../utils/categoryResolver';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
import { Modal } from '../ui/Modal';
import { exportInvoiceCSV } from '../../utils/reportExportService';
import { saveOrShareFile } from '../../utils/fileDownloadHelper';
import { SeriesDeleteModal } from './SeriesDeleteModal';
import { ReimbursementModal } from './ReimbursementModal';
import { buildCardInstallmentTimeline } from '../../utils/cardInstallmentSeries';

interface TransactionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onEdit: (tx: Transaction) => void;
  onDuplicate?: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onEdit,
  onDuplicate,
}) => {
  const {
    categories,
    accounts,
    cards,
    debts,
    transactions,
    transactionSeries,
    deleteTransaction,
    deleteTransactionSeriesScope,
    toggleTransactionStatus,
    reimburseThirdPartyTransaction,
    user,
  } = useFinancial();
  const { confirm } = useConfirm();
  const [deleteCandidate, setDeleteCandidate] = React.useState<Transaction | null>(null);
  const [reimbursementCandidate, setReimbursementCandidate] = React.useState<Transaction | null>(null);

  // Intercept Android back button & swipe gestures
  useBackButton(isOpen && !!transaction, onClose);

  const handleEndRecurrence = async () => {
    if (!transaction) return;
    const isCardRec = Boolean(transaction.cardId);
    const ok = await confirm({
      title: isCardRec ? 'Encerrar Recorrência do Cartão?' : 'Encerrar Recorrência?',
      message: `Deseja encerrar a recorrência de "${transaction.description}"? As cobranças anteriores serão mantidas intactas no histórico, e somente este lançamento atual e os futuros serão cancelados.`,
      confirmText: 'Encerrar Recorrência',
      cancelText: 'Voltar',
      type: 'warning',
    });

    if (!ok) return;

    if (transaction.seriesId) {
      deleteTransactionSeriesScope(transaction.id, 'current_and_future');
    } else {
      deleteTransaction(transaction.id);
    }
    onClose();
  };

  if (!transaction) return null;

  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.type === 'transfer';
  const isCompleted = transaction.status === 'completed';
  const isCard = !!transaction.cardId;
  const reimbursementSeries = transaction.seriesId
    ? transactionSeries.find(series => series.id === transaction.seriesId && series.kind === 'card_installment')
    : undefined;
  const reimbursementReceived = transactions
    .filter(item => reimbursementSeries
      ? item.reimbursementForSeriesId === reimbursementSeries.id
      : item.reimbursementForTransactionId === transaction.id)
    .reduce((sum, item) => sum + item.amount, 0);
  const isPartiallyReimbursed = reimbursementReceived > 0 && !transaction.reimbursed;

  // Category lookup
  const resolved = resolveCategory(categories, transaction.categoryId, transaction.subcategoryId, transaction.type);
  const category = {
    id: resolved.id,
    name: resolved.name,
    icon: resolved.icon,
    color: resolved.color,
  };
  const subcategory = resolved.subName ? {
    id: transaction.subcategoryId || '',
    name: resolved.subName,
    icon: resolved.subIcon || '🏷️',
    categoryId: resolved.id,
  } : undefined;

  // Account / Card lookup
  const account = accounts.find(a => a.id === transaction.accountId);
  const targetAccount = accounts.find(a => a.id === transaction.targetAccountId);
  const card = cards.find(c => c.id === transaction.cardId);

  // Check if this transaction is an Invoice Payment (e.g. "Pagamento Fatura Nubank")
  const isInvoicePayment =
    transaction.categoryId === 'cat-fatura-cartao' ||
    transaction.tags?.includes('fatura') ||
    transaction.description.toLowerCase().startsWith('pagamento fatura');

  // If it is an invoice payment, extract card and month to find composing transactions
  const invoiceComposingData = useMemo(() => {
    if (!isInvoicePayment) return null;

    // Try to find the card mentioned in description or tags
    const matchedCard =
      cards.find(c => transaction.description.toLowerCase().includes(c.name.toLowerCase())) ||
      cards[0];

    // Try to find the month (e.g. 2026-08 or Agosto)
    let targetMonthPrefix = transaction.date.substring(0, 7);
    const dateMatch = transaction.description.match(/(\d{4}[-/]\d{2})/);
    if (dateMatch) {
      targetMonthPrefix = dateMatch[1].replace('/', '-');
    }

    if (!matchedCard) return null;

    // Find all card expenses in that invoice month
    const items = transactions.filter(
      t =>
        t.cardId === matchedCard.id &&
        t.type === 'expense' &&
        (t.invoiceMonth === targetMonthPrefix || t.date.startsWith(targetMonthPrefix))
    );

    const totalPurchases = items.reduce((sum, i) => sum + i.amount, 0);

    // Group items by category for composition chart
    const catMap: Record<string, { name: string; icon: string; amount: number; color?: string }> = {};
    items.forEach(i => {
      const cat = categories.find(c => c.id === i.categoryId);
      const name = cat?.name || 'Outros';
      if (!catMap[name]) {
        catMap[name] = { name, icon: cat?.icon || '📁', amount: 0, color: cat?.color };
      }
      catMap[name].amount += i.amount;
    });

    const categoryBreakdown = Object.values(catMap).sort((a, b) => b.amount - a.amount);

    return {
      card: matchedCard,
      month: targetMonthPrefix,
      items,
      totalPurchases,
      categoryBreakdown,
    };
  }, [isInvoicePayment, transaction, cards, transactions, categories]);

  const handleExportInvoiceCSV = async () => {
    if (!invoiceComposingData?.card) return;
    await exportInvoiceCSV({
      card: invoiceComposingData.card,
      monthLabel: invoiceComposingData.month,
      periodSlug: `${invoiceComposingData.card.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fatura_${invoiceComposingData.month}`,
      invoiceTotal: invoiceComposingData.totalPurchases,
      statusLabel: 'Fatura Paga',
      transactions: invoiceComposingData.items,
      categories,
      currency: user?.currency || 'BRL',
      userEmail: user?.email,
    });
  };

  // If this transaction is an installment (e.g. "Geladeira (1/12)"), find sister installments
  const installmentSeriesData = useMemo(() => {
    if (!transaction.installments && !transaction.description.match(/\(\d+\/\d+\)/)) {
      return null;
    }

    // Extract base description (without "(1/12)")
    const baseDesc = transaction.description.replace(/\s*\(\d+\/\d+\)/, '').trim();

    const explicitSeries = transaction.seriesId
      ? transactionSeries.find(series => series.id === transaction.seriesId && series.kind === 'card_installment')
      : undefined;
    const explicitCard = cards.find(item => item.id === transaction.cardId);
    if (explicitSeries?.kind === 'card_installment' && explicitCard) {
      const related = transactions
        .filter(item => item.seriesId === explicitSeries.id)
        .sort((a, b) => (a.seriesSequence || 0) - (b.seriesSequence || 0));
      const timeline = buildCardInstallmentTimeline({
        series: explicitSeries,
        transactions: related,
        cardClosingDay: explicitCard.closingDay,
        cardDueDay: explicitCard.dueDay,
      });
      const paidAmount = timeline
        .filter(item => item.status === 'historical_paid' || item.status === 'completed')
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        baseDescription: explicitSeries.description,
        related,
        timeline,
        totalAmount: explicitSeries.totalAmount,
        paidAmount,
        historicalPaidCount: explicitSeries.firstTrackedInstallment - 1,
        currentInstallment: transaction.seriesSequence || explicitSeries.firstTrackedInstallment,
        totalInstallments: explicitSeries.totalInstallments,
        progressPercent: explicitSeries.totalAmount > 0 ? (paidAmount / explicitSeries.totalAmount) * 100 : 0,
      };
    }

    const related = transactions
      .filter(
        t =>
          t.cardId === transaction.cardId &&
          (t.description.replace(/\s*\(\d+\/\d+\)/, '').trim() === baseDesc ||
            (t.installments?.parentId &&
              t.installments.parentId === transaction.installments?.parentId))
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    if (related.length <= 1) return null;

    const totalAmount = related.reduce((sum, r) => sum + r.amount, 0);
    const paidAmount = related
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.amount, 0);
    const currentInstallment =
      transaction.installments?.current ||
      parseInt(transaction.description.match(/\((\d+)\/\d+\)/)?.[1] || '1');
    const totalInstallments =
      transaction.installments?.total ||
      parseInt(transaction.description.match(/\(\d+\/(\d+)\)/)?.[1] || String(related.length));

    return {
      baseDescription: baseDesc,
      related,
      totalAmount,
      paidAmount,
      currentInstallment,
      totalInstallments,
      progressPercent: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
      historicalPaidCount: 0,
      timeline: related.map((item, index) => ({
        sequence: item.installments?.current || index + 1,
        total: totalInstallments,
        amount: item.amount,
        date: item.date,
        invoiceMonth: item.invoiceMonth || item.date.slice(0, 7),
        dueDate: item.dueDate || item.date,
        status: item.status,
        isCurrent: item.id === transaction.id,
        transactionId: item.id,
      })),
    };
  }, [transaction, transactions, transactionSeries, cards]);

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Lançamento" maxWidth="lg">
      <div className="space-y-5 animate-in fade-in">
        {/* ========================================================================= */}
        {/* 1. TOP AMOUNT & STATUS CARD */}
        {/* ========================================================================= */}
        <div className="p-5 rounded-[22px] bg-slate-50 dark:bg-[#1E222D] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-xl ${
                  isIncome
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : isExpense
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                }`}
              >
                {isIncome ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : isExpense ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowLeftRight className="w-5 h-5" />
                )}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {transaction.description}
              </h3>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              <span
                className={
                  isIncome
                    ? 'text-[#66bb6a]'
                    : isExpense
                    ? 'text-[#ef5350]'
                    : 'text-[#42a5f5]'
                }
              >
                {isIncome ? '+' : isExpense ? '-' : ''}{' '}
                {formatCurrency(transaction.amount, user.currency, !user.showValues)}
              </span>
            </div>
          </div>

          {/* Status Badge Toggle */}
          <div className="flex flex-col sm:items-end gap-1.5">
            <button
              type="button"
              onClick={() => toggleTransactionStatus(transaction.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-xs ${
                isCompleted
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
              }`}
              title="Clique para alternar situação"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : isCard ? (
                <CardIcon className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span>
                {isIncome
                  ? isCompleted
                    ? 'Recebida'
                    : 'A Receber'
                  : isCard
                  ? isCompleted
                    ? 'Pago (Cartão)'
                    : 'Pendente (Cartão)'
                  : isCompleted
                  ? 'Paga'
                  : 'A Pagar'}
              </span>
            </button>
            <span className="text-[10px] text-slate-400 font-semibold">
              Clique no status para alternar
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. THIRD-PARTY BANNER & REIMBURSEMENT ACTION */}
        {/* ========================================================================= */}
        {transaction.isThirdParty && (
          <div className="p-4 rounded-2xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    Compra de Terceiro: {transaction.thirdPartyName || 'Terceiro'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Consta na fatura do cartão, mas não impacta seus relatórios pessoais
                  </p>
                </div>
              </div>

              {transaction.reimbursed ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Reembolsado
                </span>
              ) : (
                <div className="flex items-center gap-2">
                {isPartiallyReimbursed && <span className="text-[10px] font-black text-amber-600">Parcial: {formatCurrency(reimbursementReceived, user.currency)}</span>}
                <button
                  type="button"
                  onClick={() => setReimbursementCandidate(transaction)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Registrar Reembolso</span>
                </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2.1 DEBT / FINANCING INSTALLMENT BANNER */}
        {/* ========================================================================= */}
        {transaction.debtId && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Landmark className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 block">
                    Parcela de Financiamento / Dívida
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
                    {debts.find(d => d.id === transaction.debtId)?.title || 'Contrato de Financiamento'}
                    {transaction.debtInstallmentNumber ? ` • Parcela ${transaction.debtInstallmentNumber}` : ''}
                    {debts.find(d => d.id === transaction.debtId)?.totalInstallments ? ` de ${debts.find(d => d.id === transaction.debtId)?.totalInstallments}` : ''}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                Sincronizado
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Esta transação está integrada ao controle de dívidas e financiamentos. Ao alternar para &quot;Paga&quot;, o saldo devedor e as parcelas pagas são sincronizados automaticamente.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. METADATA GRID (DATE, CATEGORY, ACCOUNT/CARD, REGIME) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Date & Cycle */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Data & Calendário
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                <span>{formatDate(transaction.date)}</span>
                {transaction.dueDate && transaction.dueDate !== transaction.date && (
                  <span className="block text-[10px] text-slate-400">
                    Vencimento: {formatDate(transaction.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Categoria
            </span>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-2xs"
                style={{
                  backgroundColor: (category?.color || '#7c4dff') + '20',
                  color: category?.color || '#7c4dff',
                }}
              >
                {subcategory?.icon || category?.icon || '📁'}
              </div>
              <div className="min-w-0 flex-1 leading-snug" title={`${category?.name || 'Geral'}${subcategory ? ` • ${subcategory.name}` : ''}`}>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="break-words">{category?.name || 'Geral'}</span>
                  {subcategory && (
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-800/60 px-2 py-0.5 rounded-lg shrink-0">
                      <span>{subcategory.icon || '•'}</span>
                      {subcategory.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account or Credit Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-1.5 sm:col-span-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {card ? 'Cartão de Crédito Utilizado' : isTransfer ? 'Transferência entre Contas' : 'Conta Bancária'}
            </span>
            <div className="flex items-center gap-3">
              {card ? (
                <>
                  <CardBrandLogo brand={card.brand} className="w-8 h-8 rounded-xl shadow-xs" />
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {card.name} ({card.brand})
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Fecha dia {card.closingDay} • Vence dia {card.dueDay}
                      {transaction.invoiceMonth ? ` • Fatura: ${transaction.invoiceMonth}` : ''}
                    </span>
                  </div>
                </>
              ) : isTransfer ? (
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>{account?.name || 'Origem'}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>{targetAccount?.name || 'Destino'}</span>
                </div>
              ) : (
                <>
                  <BankLogo nameOrId={account?.name || 'Carteira'} className="w-8 h-8 rounded-xl shadow-xs" />
                  <div>
                    <span className="text-xs font-black text-slate-900 dark:text-white block">
                      {account?.name || 'Carteira'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Saldo atual: {formatCurrency(account?.balance || 0, user.currency, !user.showValues)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. SPECIAL INVOICE COMPOSITION BREAKDOWN (IF THIS IS AN INVOICE PAYMENT) */}
        {/* ========================================================================= */}
        {invoiceComposingData && (
          <div className="p-4 rounded-[22px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Composição Desta Fatura ({invoiceComposingData.items.length} despesas)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportInvoiceCSV}
                  className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                  title="Exportar itens desta fatura para CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>CSV</span>
                </button>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  Total: {formatCurrency(invoiceComposingData.totalPurchases, user.currency, !user.showValues)}
                </span>
              </div>
            </div>

            {/* Category breakdown mini progress bars */}
            {invoiceComposingData.categoryBreakdown.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Gastos por Categoria nesta fatura
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {invoiceComposingData.categoryBreakdown.map(cat => {
                    const pct =
                      invoiceComposingData.totalPurchases > 0
                        ? (cat.amount / invoiceComposingData.totalPurchases) * 100
                        : 0;
                    return (
                      <div
                        key={cat.name}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate">
                          {cat.icon} {cat.name}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-slate-900 dark:text-white block">
                            {formatCurrency(cat.amount, user.currency, !user.showValues)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of composing items */}
            <div className="pt-2 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Itens discriminados da fatura
              </span>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto pr-1">
                {invoiceComposingData.items.map(item => {
                  const cat = categories.find(c => c.id === item.categoryId);
                  return (
                    <div
                      key={item.id}
                      className="py-2 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm shrink-0 w-6 text-center select-none">{cat?.icon || '💳'}</span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {item.description}
                          </p>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {formatDate(item.date)} • {cat?.name || 'Geral'}
                            {item.isThirdParty ? ` • 👤 ${item.thirdPartyName || 'Terceiro'}` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-rose-600 dark:text-rose-400 shrink-0">
                        -{formatCurrency(item.amount, user.currency, !user.showValues)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. INSTALLMENT SERIES PROGRESS TRACKER (IF THIS IS AN INSTALLMENT) */}
        {/* ========================================================================= */}
        {installmentSeriesData && (
          <div className="p-4 rounded-[22px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#ff8a00]" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Progresso do Parcelamento ({installmentSeriesData.currentInstallment}/{installmentSeriesData.totalInstallments})
                </h4>
              </div>
              <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                Total: {formatCurrency(installmentSeriesData.totalAmount, user.currency, !user.showValues)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${installmentSeriesData.progressPercent}%` }}
                  className="h-full bg-emerald-500 transition-all"
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>
                  Pago: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(installmentSeriesData.paidAmount, user.currency, !user.showValues)}</strong>
                </span>
                <span>
                  Restante: <strong className="text-amber-500">{formatCurrency(installmentSeriesData.totalAmount - installmentSeriesData.paidAmount, user.currency, !user.showValues)}</strong>
                </span>
              </div>
              {installmentSeriesData.historicalPaidCount > 0 && (
                <p className="text-[10px] font-bold text-amber-600">
                  {installmentSeriesData.historicalPaidCount} paga(s) antes do Finly — apenas no progresso, sem impacto financeiro.
                </p>
              )}
            </div>

            {/* Installments timeline chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
              {installmentSeriesData.timeline.map((inst) => (
                <span
                  key={`${inst.sequence}-${inst.invoiceMonth}`}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 border ${
                    inst.status === 'completed' || inst.status === 'historical_paid'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : inst.transactionId === transaction.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'
                  }`}
                  title={`${inst.status === 'historical_paid' ? 'Paga antes do Finly' : inst.status === 'completed' ? 'Paga' : inst.isCurrent ? 'Aberta' : 'Futura'} — ${formatCurrency(inst.amount, user.currency)} — fatura ${inst.invoiceMonth}`}
                >
                  {(inst.status === 'completed' || inst.status === 'historical_paid') && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  <span>{inst.sequence}/{inst.total} • {inst.status === 'historical_paid' ? 'Antes do Finly' : inst.isCurrent ? 'Aberta' : inst.status === 'completed' ? 'Paga' : 'Futura'}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. LEMBRETE, RECORRÊNCIA, ANEXO & TAGS/NOTAS */}
        {/* ========================================================================= */}
        {/* Lembrete Ativo */}
        {transaction.reminder?.enabled && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-300 block">
                  Lembrete de Pagamento Ativo
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400">
                  {transaction.reminder.daysBefore === 0
                    ? 'No dia do vencimento'
                    : `${transaction.reminder.daysBefore} dia(s) antes`} às {transaction.reminder.reminderTime || '09:00'}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase">
              Programado
            </span>
          </div>
        )}

        {/* Lançamento Fixo ou Recorrente no Cartão */}
        {transaction.recurring && (
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Repeat className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-purple-900 dark:text-purple-300 block truncate">
                  {transaction.cardId ? 'Recorrente no Cartão' : 'Lançamento Fixo'} ({transaction.recurrenceFrequency === 'yearly' ? 'Anual' : transaction.recurrenceFrequency === 'weekly' ? 'Semanal' : transaction.recurrenceFrequency === 'daily' ? 'Diário' : 'Mensal'})
                </span>
                <span className="text-[10px] text-purple-700/80 dark:text-purple-400/80 block">
                  {transaction.cardId
                    ? 'Cobrança periódica na fatura do cartão'
                    : 'Despesa fixa cadastrada'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleEndRecurrence}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 shadow-2xs"
              title="Encerrar recorrência mantendo as transações anteriores e removendo a atual e futuras"
            >
              <CalendarX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>ENCERRAR RECORRÊNCIA</span>
            </button>
          </div>
        )}

        {/* Anexo de Comprovante / Recibo */}
        {(transaction.attachmentUrl || transaction.attachmentName) && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              📎 Comprovante / Documento Anexado
            </span>
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5 min-w-0">
                {transaction.attachmentUrl && transaction.attachmentUrl.startsWith('data:image') ? (
                  <img
                    src={transaction.attachmentUrl}
                    alt="Comprovante"
                    className="w-10 h-10 rounded-lg object-cover border border-purple-300 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      const w = window.open('');
                      w?.document.write(`<img src="${transaction.attachmentUrl}" style="max-width:100%; height:auto;" />`);
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {transaction.attachmentName || 'Comprovante anexado'}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    ✓ Arquivo salvo
                  </span>
                </div>
              </div>

              {transaction.attachmentUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    const ext = transaction.attachmentUrl?.split(';')[0]?.split('/')[1] || 'png';
                    const filename = transaction.attachmentName || `comprovante_${transaction.id}.${ext}`;
                    const mime = transaction.attachmentUrl?.split(';')[0]?.replace('data:', '') || 'image/png';
                    await saveOrShareFile({
                      filename,
                      base64Data: transaction.attachmentUrl,
                      mimeType: mime,
                      dialogTitle: `Baixar ${filename}`,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tags & Notes */}
        {(transaction.tags?.length > 0 || transaction.notes) && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800 space-y-2">
            {transaction.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <TagIcon className="w-3.5 h-3.5 text-slate-400" />
                {transaction.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {transaction.notes && (
              <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <p className="font-medium whitespace-pre-wrap">{transaction.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. ACTION FOOTER BUTTONS */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setDeleteCandidate(transaction)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir</span>
            </button>

            {transaction.recurring && (
              <button
                type="button"
                onClick={handleEndRecurrence}
                className="px-3 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1.5 transition-colors cursor-pointer border border-amber-300/60 dark:border-amber-700/60"
              >
                <CalendarX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Encerrar Recorrência</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(transaction);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(transaction);
              }}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Edit2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
    <SeriesDeleteModal
      transaction={deleteCandidate}
      onClose={() => setDeleteCandidate(null)}
      afterDelete={onClose}
    />
    <ReimbursementModal transaction={reimbursementCandidate} onClose={() => setReimbursementCandidate(null)} />
    </>
  );
};
