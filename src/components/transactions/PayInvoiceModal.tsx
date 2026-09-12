import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getCurrentMonth, getTodayString } from '../../utils/formatters';
import { BankLogo, CardBrandLogo } from '../../utils/bankLogos';
import { CreditCard as CardIcon, Calendar, CheckCircle2, AlertCircle, Clock, DollarSign, Wallet, Lightbulb, X, Download } from 'lucide-react';
import { exportInvoiceCSV } from '../../utils/reportExportService';

interface PayInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCardId?: string;
}

export const PayInvoiceModal: React.FC<PayInvoiceModalProps> = ({ isOpen, onClose, initialCardId }) => {
  const { cards, accounts, transactions, categories, payCardInvoice, user } = useFinancial();

  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>('08');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payDate, setPayDate] = useState(getTodayString());
  const [showCallout, setShowCallout] = useState(true);

  useEffect(() => {
    if (isOpen) {
      if (initialCardId) {
        setSelectedCardId(initialCardId);
      } else if (cards.length > 0 && !selectedCardId) {
        setSelectedCardId(cards[0].id);
      }
      if (accounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accounts[0].id);
      }
      setIsSuccess(false);
    }
  }, [isOpen, initialCardId, cards, accounts]);

  const months = [
    { num: '01', label: 'Janeiro' },
    { num: '02', label: 'Fevereiro' },
    { num: '03', label: 'Março' },
    { num: '04', label: 'Abril' },
    { num: '05', label: 'Maio' },
    { num: '06', label: 'Junho' },
    { num: '07', label: 'Julho' },
    { num: '08', label: 'Agosto' },
    { num: '09', label: 'Setembro' },
    { num: '10', label: 'Outubro' },
    { num: '11', label: 'Novembro' },
    { num: '12', label: 'Dezembro' },
  ];

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  const targetPrefix = `${selectedYear}-${selectedMonth}`;

  // Transactions on this card for this month
  const invoiceTransactions = useMemo(() => {
    if (!selectedCard) return [];
    return transactions.filter(
      t => t.cardId === selectedCard.id && t.type === 'expense' && (t.invoiceMonth || t.date.slice(0, 7)) === targetPrefix
    );
  }, [transactions, selectedCard, targetPrefix]);

  
  const isInvoiceAlreadyPaid = useMemo(() => {
    if (!selectedCard || invoiceTransactions.length === 0) return false;
    return invoiceTransactions.every(t => t.status === 'completed');
  }, [selectedCard, invoiceTransactions]);

  const totalInvoice = useMemo(() => {
    return invoiceTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [invoiceTransactions]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !selectedCard || !selectedAccount || totalInvoice <= 0) return;

    setIsSubmitting(true);
    payCardInvoice(selectedCard.id, selectedAccount.id, totalInvoice, `${selectedYear}-${selectedMonth}`);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const handleExportCSV = async () => {
    if (!selectedCard) return;
    const mLabel = months.find(m => m.num === selectedMonth)?.label || selectedMonth;
    await exportInvoiceCSV({
      card: selectedCard,
      monthLabel: `${mLabel} de ${selectedYear}`,
      periodSlug: `${selectedCard.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_fatura_${selectedYear}-${selectedMonth}`,
      invoiceTotal: totalInvoice,
      statusLabel: isInvoiceAlreadyPaid ? 'Fatura Paga' : 'Fatura Aberta',
      transactions: invoiceTransactions,
      categories,
      currency: user?.currency || 'BRL',
      userEmail: user?.email,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pagamento total"
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="pay-invoice-form"
            disabled={!selectedCard || totalInvoice <= 0 || isInvoiceAlreadyPaid || isSubmitting}
            className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
              totalInvoice > 0 && !isInvoiceAlreadyPaid
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95'
                : 'bg-slate-400 dark:bg-slate-700 opacity-60 cursor-not-allowed'
            }`}
          >
            <CardIcon className="w-3.5 h-3.5" />
            <span>{isInvoiceAlreadyPaid ? 'Fatura Já Paga ✓' : isSubmitting ? 'Processando...' : 'Pagar Total'}</span>
          </button>
        </div>
      }
    >
      <form id="pay-invoice-form" onSubmit={handlePay} className="space-y-3.5 pb-1">
        {/* Callout Banner */}
        {showCallout && (
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-start gap-2.5 relative">
            <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-900/60 flex items-center justify-center shrink-0 text-purple-600 dark:text-purple-300">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-purple-900 dark:text-purple-200 font-semibold pr-6 leading-relaxed">
              Aqui você realizará o pagamento total da fatura do seu cartão de crédito. O valor será debitado da conta indicada.
            </p>
            <button
              type="button"
              onClick={() => setShowCallout(false)}
              className="absolute right-2 top-2 p-1 text-purple-400 hover:text-purple-600 transition-colors cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Card and Period Selectors */}
        <div className="space-y-2.5">
          {/* Card Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Cartão de Crédito
            </label>
            <select
              value={selectedCardId}
              onChange={e => setSelectedCardId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              {cards.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.brand})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Month Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Mês da Fatura
              </label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              >
                {months.map(m => (
                  <option key={m.num} value={m.num}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ano
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              >
                {['2024', '2025', '2026', '2027'].map(yr => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoice Summary Box */}
        {selectedCard ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center p-1.5 shrink-0 shadow-xs border"
                style={{
                  backgroundColor: selectedCard.color ? `${selectedCard.color}22` : '#7c4dff22',
                  borderColor: selectedCard.color ? `${selectedCard.color}45` : '#7c4dff45',
                }}
              >
                <BankLogo
                  nameOrId={selectedCard.bankId || selectedCard.name}
                  fallbackBrand={selectedCard.brand}
                  size={24}
                  radius={8}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase">{selectedCard.name}</p>
                  <div className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 shrink-0 border border-slate-200/60 dark:border-white/10 flex items-center justify-center" title={`Bandeira ${selectedCard.brand}`}>
                    <CardBrandLogo brand={selectedCard.brand} size={12} className="w-4 h-2.5" />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Fecha dia {selectedCard.closingDay} • Vence dia {selectedCard.dueDay}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total da Fatura</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(totalInvoice, user.currency, !user.showValues)}
              </span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
            <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">Nenhum cartão cadastrado.</p>
          </div>
        )}

        {isInvoiceAlreadyPaid && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Esta fatura já consta como PAGA neste mês. Nenhuma cobrança pendente.</span>
          </div>
        )}

        {/* Invoice Transactions List */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Lançamentos da Fatura ({invoiceTransactions.length})
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                {months.find(m => m.num === selectedMonth)?.label} de {selectedYear}
              </span>
              {selectedCard && invoiceTransactions.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
                  title="Exportar lançamentos desta fatura para CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Exportar CSV</span>
                </button>
              )}
            </div>
          </div>
          <div className="max-h-52 sm:max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 scrollbar-thin">
            {invoiceTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs font-medium">Nenhuma transação lançada neste período.</p>
              </div>
            ) : (
              invoiceTransactions.map(t => {
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

        {/* Payment Date with Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Data do Pagamento *</label>
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setPayDate(getTodayString())}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setPayDate(d.toISOString().substring(0, 10));
                }}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer"
              >
                Ontem
              </button>
            </div>
          </div>
          <DatePicker
            value={payDate}
            onChange={setPayDate}
            variant="modal"
            showPresets={true}
          />
        </div>

        {/* Account to Debit */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Debitar da Conta Bancária:
          </label>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} (Saldo: {formatCurrency(a.balance, user.currency)})
              </option>
            ))}
          </select>
        </div>

        {/* Success Alert */}
        {isSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
            ✓ Fatura paga com sucesso! Saldo atualizado.
          </div>
        )}
      </form>
    </Modal>
  );
};
