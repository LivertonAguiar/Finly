import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { useFinancial } from '../../context/FinancialContext';
import type { Transaction } from '../../types';
import { formatCurrency, getTodayString, round2 } from '../../utils/formatters';

export const ReimbursementModal: React.FC<{
  transaction: Transaction | null;
  onClose: () => void;
}> = ({ transaction, onClose }) => {
  const { accounts, transactions, transactionSeries, reimburseThirdPartyTransaction, user } = useFinancial();
  const series = transaction?.seriesId
    ? transactionSeries.find(item => item.id === transaction.seriesId && item.kind === 'card_installment')
    : undefined;
  const total = series?.kind === 'card_installment' ? series.totalAmount : transaction?.amount || 0;
  const alreadyReceived = useMemo(() => transactions
    .filter(item => series
      ? item.reimbursementForSeriesId === series.id
      : item.reimbursementForTransactionId === transaction?.id)
    .reduce((sum, item) => sum + item.amount, 0), [transactions, series?.id, transaction?.id]);
  const remaining = Math.max(0, round2(total - alreadyReceived));
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transaction) return;
    setAmount(String(remaining));
    setDate(getTodayString());
    setAccountId(accounts[0]?.id || '');
    setError('');
  }, [transaction?.id, remaining]);

  if (!transaction) return null;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = round2(Number(amount));
    if (numericAmount <= 0 || numericAmount > remaining) {
      setError(`Informe um valor entre R$ 0,01 e ${formatCurrency(remaining, user.currency)}.`);
      return;
    }
    if (!accountId) return setError('Selecione a conta que recebeu o valor.');
    reimburseThirdPartyTransaction(transaction.id, accountId, { amount: numericAmount, date });
    onClose();
  };

  return <Modal
    isOpen
    onClose={onClose}
    title="Registrar reembolso"
    footer={<div className="flex justify-end gap-2 w-full"><button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-bold">Cancelar</button><button type="submit" form="reimbursement-form" className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-black">Registrar recebimento</button></div>}
  >
    <form id="reimbursement-form" onSubmit={submit} className="space-y-4">
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs space-y-1"><p>Total da compra: <strong>{formatCurrency(total, user.currency)}</strong></p><p>Já recebido: <strong>{formatCurrency(alreadyReceived, user.currency)}</strong></p><p>Restante: <strong>{formatCurrency(remaining, user.currency)}</strong></p></div>
      <div><label className="block mb-1 text-xs font-bold">Valor recebido *</label><input type="number" min="0.01" max={remaining} step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" /></div>
      <div><label className="block mb-1 text-xs font-bold">Data do recebimento *</label><DatePicker value={date} onChange={setDate} variant="modal" /></div>
      <div><label className="block mb-1 text-xs font-bold">Conta de destino *</label><select value={accountId} onChange={event => setAccountId(event.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">{accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}</select></div>
      {error && <p className="text-xs font-bold text-rose-600">{error}</p>}
    </form>
  </Modal>;
};
