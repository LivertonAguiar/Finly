import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  RotateCcw,
  CreditCard as CardIcon,
  Edit2,
  Trash2,
  Download,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  DollarSign,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { BankLogo, getCardBankInfo } from '../../utils/bankLogos';
import { resolveCategory } from '../../utils/categoryResolver';
import {
  calculateCardInvoiceStatus,
  getCardInvoicePaymentDetails,
  getCardTransactionInvoiceMonth,
} from '../../utils/invoiceCalculator';
import { exportInvoiceCSV, generateInvoicePDFBlob } from '../../utils/reportExportService';
import { PdfViewerModal } from '../common/PdfViewerModal';
import { TransactionModal } from '../transactions/TransactionModal';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { SeriesDeleteModal } from '../transactions/SeriesDeleteModal';
import { ReimbursementModal } from '../transactions/ReimbursementModal';
import { CardModal } from '../cadastros/CardModal';
import { PayInvoiceSheet } from './PayInvoiceSheet';
import { CreditCard as CreditCardType, Transaction } from '../../types';

interface InvoiceDetailViewProps {
  cardId: string;
  onBack: () => void;
  initialMonthOffset?: number;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({
  cardId,
  onBack,
  initialMonthOffset = 0,
}) => {
  const {
    cards,
    user,
    transactions,
    accounts,
    categories,
    unpayCardInvoice,
    reimburseThirdPartyTransaction,
    deleteTransaction,
  } = useFinancial();
  const { confirm } = useConfirm();

  const card = useMemo(() => cards.find(c => c.id === cardId) || null, [cards, cardId]);

  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(initialMonthOffset);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);

  // Modals state
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [isEditCardModalOpen, setIsEditCardModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [editingInvoiceTx, setEditingInvoiceTx] = useState<Transaction | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Transaction | null>(null);
  const [reimbursementCandidate, setReimbursementCandidate] = useState<Transaction | null>(null);

  // PDF Preview State
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    blob: Blob | null;
    filename: string;
    dialogTitle?: string;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    blob: null,
    filename: '',
  });

  // Calculate view date for month navigation
  const viewDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + selectedMonthOffset, 1);
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;

  // Invoice calculations for this card
  const invoiceData = useMemo(() => {
    if (!card) return null;

    const cardTxs = transactions.filter(t => t.cardId === card.id && t.type === 'expense');
    const monthTxs = cardTxs
      .filter(t => getCardTransactionInvoiceMonth(t, card) === currentMonthPrefix)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const invoiceTotal = Math.round(monthTxs.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
    const paymentDetails = getCardInvoicePaymentDetails(card, currentMonthPrefix, transactions);
    const isPaid = paymentDetails.isPaid;

    const currentOpenInvoice = isPaid ? 0 : invoiceTotal;
    const currentInvoicePercent = card.limit > 0 ? (currentOpenInvoice / card.limit) * 100 : 0;

    const futureInstallmentsTxs = cardTxs.filter(
      t => t.status !== 'completed' && getCardTransactionInvoiceMonth(t, card) !== currentMonthPrefix
    );
    const futureInstallmentsTotal =
      Math.round(futureInstallmentsTxs.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
    const futureInstallmentsPercent = card.limit > 0 ? (futureInstallmentsTotal / card.limit) * 100 : 0;

    const totalCommitted =
      Math.round(cardTxs.filter(t => t.status !== 'completed').reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
    const available = Math.max(0, Math.round((card.limit - totalCommitted) * 100) / 100);
    const usedPercentage = card.limit > 0 ? Math.min(100, (totalCommitted / card.limit) * 100) : 0;
    const isOverLimit = totalCommitted > card.limit;
    const overLimitAmount = Math.max(0, totalCommitted - card.limit);

    const viewMonthNum = viewDate.getMonth() + 1;
    const viewYearNum = viewDate.getFullYear();
    const statusInfo = calculateCardInvoiceStatus(card, viewYearNum, viewMonthNum, invoiceTotal, isPaid);

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
      statusLabel: statusInfo.statusLabel,
      statusColor: statusInfo.badgeColor,
      isPaid,
      paymentDate: paymentDetails.paymentDate,
      paymentAccountId: paymentDetails.paymentAccountId,
      paymentAmount: paymentDetails.paymentAmount,
    };
  }, [card, transactions, currentMonthPrefix, viewDate]);

  // Export handlers
  const handleExportCSV = async () => {
    if (!invoiceData) return;
    await exportInvoiceCSV({
      card: invoiceData,
      monthLabel: `${capitalizedMonth} de ${yearNum}`,
      periodSlug: `${invoiceData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fatura_${currentMonthPrefix}`,
      invoiceTotal: invoiceData.invoiceTotal,
      statusLabel: invoiceData.statusLabel,
      transactions: invoiceData.monthTxs,
      categories,
      currency: user?.currency || 'BRL',
      userEmail: user?.email,
    });
  };

  const handleViewPDF = async () => {
    if (!invoiceData) return;
    const title = `Fatura ${invoiceData.name} - ${capitalizedMonth} de ${yearNum}`;
    const filename = `fatura_${invoiceData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${currentMonthPrefix}.pdf`;

    setPdfPreview({
      isOpen: true,
      title,
      subtitle: `Demonstrativo executivo da fatura • ${invoiceData.name}`,
      blob: null,
      filename,
      dialogTitle: `Fatura ${invoiceData.name} (PDF)`,
      isLoading: true,
    });

    try {
      const result = await generateInvoicePDFBlob({
        card: invoiceData,
        monthLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${invoiceData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fatura_${currentMonthPrefix}`,
        invoiceTotal: invoiceData.invoiceTotal,
        statusLabel: invoiceData.statusLabel,
        transactions: invoiceData.monthTxs,
        categories,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
        availableLimit: invoiceData.available,
        totalCommitted: invoiceData.totalCommitted,
        isPaid: invoiceData.isPaid,
        paymentDate: invoiceData.paymentDate,
        paymentAmount: invoiceData.paymentAmount,
      });

      setPdfPreview(prev => ({
        ...prev,
        blob: result.blob,
        filename: result.filename,
        isLoading: false,
      }));
    } catch (err) {
      console.error('Erro ao gerar preview de fatura PDF:', err);
      setPdfPreview(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  // Handle Unpay/Reopen Invoice
  const handleUnpayInvoice = async () => {
    if (!card) return;
    const ok = await confirm({
      title: 'Marcar Fatura como Não Paga?',
      message: `Deseja marcar a fatura de ${capitalizedMonth} de ${yearNum} do cartão ${card.name} como NÃO PAGA e reabrir os lançamentos? O pagamento será estornado do fluxo de caixa.`,
      confirmText: 'Sim, Marcar Não Paga',
      cancelText: 'Cancelar',
      type: 'warning',
    });

    if (ok) {
      unpayCardInvoice(card.id, currentMonthPrefix);
    }
  };

  if (!card || !invoiceData) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-sm text-slate-500">Cartão não encontrado.</p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
        >
          Voltar para Faturas
        </button>
      </div>
    );
  }

  const cardColor = card.color || '#7c4dff';

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-10 px-3 sm:px-4 rounded-xl bg-white dark:bg-[#1E1E20] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-950/20 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5 shrink-0"
          title="Voltar para a lista de faturas"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="whitespace-nowrap">
            Voltar <span className="hidden sm:inline">para Faturas</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingInvoiceTx(null);
              setIsAddExpenseModalOpen(true);
            }}
            className="h-10 px-3 sm:px-4 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-sm shadow-purple-600/20 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Nova Despesa</span>
          </button>

          {/* More options menu */}
          <div className="relative">
            <button
              type="button"
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
                {invoiceData.isPaid ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      handleUnpayInvoice();
                    }}
                    className="w-full px-4 py-2.5 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>Reabrir fatura (estornar)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsHeaderMenuOpen(false);
                      setIsPaySheetOpen(true);
                    }}
                    className="w-full px-4 py-2.5 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2.5 cursor-pointer"
                  >
                    <CardIcon className="w-4 h-4 text-emerald-500" />
                    <span>Pagar fatura</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    setIsEditCardModalOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-purple-600" />
                  <span>Editar cartão</span>
                </button>

                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    handleExportCSV();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span>Exportar fatura para CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    handleViewPDF();
                  }}
                  className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Baixar fatura em PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card Invoice Header Summary (Matching user screenshot) */}
      <div
        className="p-4 sm:p-6 rounded-[25px] border shadow-sm dark:shadow-2xl space-y-4 transition-all"
        style={{
          background:
            user.theme === 'dark'
              ? `radial-gradient(120% 120% at 0% 0%, ${cardColor}25 0%, rgba(36, 36, 40, 0.98) 55%, #1C1C1E 100%)`
              : `radial-gradient(120% 120% at 0% 0%, ${cardColor}15 0%, #FFFFFF 65%)`,
          borderColor: `${cardColor}40`,
          boxShadow: `0 8px 30px -4px ${cardColor}20`,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center p-2 shadow-sm shrink-0 border"
              style={{
                backgroundColor: `${cardColor}25`,
                borderColor: `${cardColor}55`,
              }}
            >
              <BankLogo nameOrId={card.bankId || getCardBankInfo(card)?.id || card.name} size={28} radius={10} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight uppercase">
                  {card.name}
                </h2>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  • {getCardBankInfo(card)?.name || 'Cartão'}
                </span>
              </div>
              <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block mt-0.5 ${invoiceData.statusColor}`}>
                {invoiceData.statusLabel}
              </span>
            </div>
          </div>

          {/* Month Selector for Invoice */}
          <div className="flex items-center justify-center gap-2 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedMonthOffset(prev => prev - 1)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full bg-slate-50 dark:bg-[#343437] border border-slate-200 dark:border-slate-700 select-none">
              FATURA DE {capitalizedMonth} {yearNum}
            </span>
            <button
              type="button"
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
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-bold block">Valor de Fatura</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                {formatCurrency(invoiceData.invoiceTotal, user.currency, !user.showValues)}
              </span>
            </div>

            {invoiceData.invoiceTotal > 0 && !invoiceData.isPaid ? (
              <button
                type="button"
                onClick={() => setIsPaySheetOpen(true)}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border border-emerald-500/50 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-xs cursor-pointer hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap shrink-0"
              >
                Pagar Fatura
              </button>
            ) : invoiceData.isPaid ? (
              <button
                type="button"
                onClick={handleUnpayInvoice}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shrink-0"
                title="Desfazer pagamento e marcar fatura como pendente"
              >
                Marcar como não paga
              </button>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Sem cobrança</span>
            )}
          </div>
        </div>

        {/* Informação de Fatura Paga com Data de Quitação */}
        {invoiceData.isPaid && (
          <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span>Esta fatura já consta como PAGA neste mês. Nenhuma cobrança pendente.</span>
              {invoiceData.paymentDate && (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ✓ Quitada em {formatDate(invoiceData.paymentDate)}
                  {invoiceData.paymentAccountId && accounts.find(a => a.id === invoiceData.paymentAccountId)
                    ? ` via ${accounts.find(a => a.id === invoiceData.paymentAccountId)?.name}`
                    : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sub-info: Closing & Due dates + Dynamic Limit Progress Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Dynamic Limit Progress Bar */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between text-xs font-bold gap-2">
              <span className="text-slate-600 dark:text-slate-300">
                Limite Utilizado:{' '}
                <strong className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(invoiceData.totalCommitted, user.currency, !user.showValues)}
                </strong>{' '}
                ({invoiceData.usedPercentage.toFixed(1)}%)
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                Limite Disponível:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(invoiceData.available, user.currency, !user.showValues)}
                </strong>{' '}
                de {formatCurrency(card.limit, user.currency, !user.showValues)}
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700/60 overflow-hidden flex shadow-inner">
              {invoiceData.currentInvoicePercent > 0 && (
                <div
                  className="h-full transition-all duration-500 rounded-l-full"
                  style={{
                    width: `${Math.min(100, invoiceData.currentInvoicePercent)}%`,
                    backgroundColor: cardColor,
                  }}
                  title={`Fatura deste mês: ${formatCurrency(invoiceData.currentOpenInvoice, user.currency)}`}
                />
              )}
              {invoiceData.futureInstallmentsPercent > 0 && (
                <div
                  className="h-full transition-all duration-500 bg-amber-500"
                  style={{
                    width: `${Math.min(100 - Math.min(100, invoiceData.currentInvoicePercent), invoiceData.futureInstallmentsPercent)}%`,
                  }}
                  title={`Parcelas futuras: ${formatCurrency(invoiceData.futureInstallmentsTotal, user.currency)}`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-bold">
              <span className="flex items-center gap-1.5" style={{ color: cardColor }}>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cardColor }} />
                Fatura de {capitalizedMonth}: {formatCurrency(invoiceData.invoiceTotal, user.currency, !user.showValues)}
              </span>
              {invoiceData.futureInstallmentsTotal > 0 && (
                <span className="flex items-center gap-1.5 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  Parcelas Futuras: {formatCurrency(invoiceData.futureInstallmentsTotal, user.currency, !user.showValues)}
                </span>
              )}
              {invoiceData.isOverLimit && (
                <span className="text-rose-500 font-black animate-pulse">
                  ⚠️ Limite Excedido em {formatCurrency(invoiceData.overLimitAmount, user.currency, !user.showValues)}
                </span>
              )}
            </div>
          </div>

          {/* Fechamento & Vencimento */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-100/50 dark:border-slate-800/50">
            <div>
              <span className="text-slate-400 block font-medium">Fechamento da Fatura</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">Todo dia {card.closingDay}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Vencimento da Fatura</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">Todo dia {card.dueDay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section "LANÇAMENTOS DESTA FATURA (X)" */}
      <div className="p-4 sm:p-6 rounded-[25px] bg-white dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Lançamentos desta Fatura ({invoiceData.monthTxs.length})
          </h3>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Exportar lançamentos desta fatura para arquivo CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={handleViewPDF}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-purple-50 dark:bg-slate-800 dark:hover:bg-purple-950/40 text-slate-600 hover:text-purple-600 dark:text-slate-300 dark:hover:text-purple-300 text-[11px] font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
              title="Baixar fatura em documento PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>Baixar PDF</span>
            </button>
            <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${invoiceData.statusColor}`}>
              {invoiceData.isPaid && <CheckCircle2 className="w-3 h-3 shrink-0" />}
              {invoiceData.statusLabel}
            </span>
          </div>
        </div>

        {invoiceData.monthTxs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <CardIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>Nenhuma despesa nesta fatura.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoiceData.monthTxs.map(t => {
              const cat = resolveCategory(categories, t.categoryId, t.subcategoryId, t.type || 'expense');
              return (
                <div
                  key={t.id}
                  onClick={e => {
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
                      <p className="tx-description text-[14.5px] sm:text-[15.5px] font-bold text-slate-900 dark:text-white leading-snug break-words">
                        {t.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
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
                        {t.components && t.components.length > 0 && (
                          <>
                            <span>•</span>
                            <span className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                              <Layers className="w-2.5 h-2.5" />
                              {t.components.length} itens
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
                        onClick={e => {
                          e.stopPropagation();
                          setReimbursementCandidate(t);
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
                        type="button"
                        onClick={e => {
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
                        type="button"
                        onClick={async e => {
                          e.stopPropagation();
                          if (t.seriesId) {
                            setDeleteCandidate(t);
                          } else {
                            const ok = await confirm({
                              title: 'Excluir Lançamento',
                              message: `Deseja excluir "${t.description}"?`,
                              confirmText: 'Excluir',
                              type: 'danger',
                            });
                            if (ok) {
                              deleteTransaction(t.id);
                            }
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

      {/* 2-Touch Pay Invoice Sheet */}
      <PayInvoiceSheet
        isOpen={isPaySheetOpen}
        onClose={() => setIsPaySheetOpen(false)}
        initialCardId={card.id}
        initialMonth={currentMonthPrefix}
      />

      {/* Edit Card Modal */}
      {isEditCardModalOpen && (
        <CardModal
          isOpen={isEditCardModalOpen}
          onClose={() => setIsEditCardModalOpen(false)}
          editingCard={card}
        />
      )}

      {/* Add / Edit Expense Modal */}
      {isAddExpenseModalOpen && (
        <TransactionModal
          isOpen={isAddExpenseModalOpen}
          onClose={() => {
            setIsAddExpenseModalOpen(false);
            setEditingInvoiceTx(null);
          }}
          editingTransaction={editingInvoiceTx}
          initialType="expense"
          initialPaymentMethod="card"
          initialCardId={card.id}
        />
      )}

      {/* Transaction Detail Modal */}
      {selectedDetailTx && (
        <TransactionDetailModal
          isOpen={Boolean(selectedDetailTx)}
          onClose={() => setSelectedDetailTx(null)}
          transaction={selectedDetailTx}
          onEdit={(tx: Transaction) => {
            setSelectedDetailTx(null);
            setEditingInvoiceTx(tx);
            setIsAddExpenseModalOpen(true);
          }}
          onDuplicate={(tx: Transaction) => {
            setSelectedDetailTx(null);
            setEditingInvoiceTx({
              ...tx,
              id: '',
              description: `${tx.description} (Cópia)`,
            });
            setIsAddExpenseModalOpen(true);
          }}
        />
      )}

      {/* Series Delete Modal */}
      <SeriesDeleteModal
        transaction={deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
      />

      {/* Reimbursement Modal */}
      <ReimbursementModal
        transaction={reimbursementCandidate}
        onClose={() => setReimbursementCandidate(null)}
      />

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={pdfPreview.isOpen}
        onClose={() => setPdfPreview(prev => ({ ...prev, isOpen: false, blob: null }))}
        blob={pdfPreview.blob}
        filename={pdfPreview.filename}
        title={pdfPreview.title}
        subtitle={pdfPreview.subtitle}
        dialogTitle={pdfPreview.dialogTitle}
        isLoading={pdfPreview.isLoading}
      />
    </div>
  );
};