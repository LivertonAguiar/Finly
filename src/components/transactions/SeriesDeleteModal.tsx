import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../../context/ConfirmContext';
import { useFinancial } from '../../context/FinancialContext';
import type { Transaction } from '../../types';
import type { SeriesMutationScope } from '../../utils/transactionSeriesScope';
import { formatCurrency } from '../../utils/formatters';

export const SeriesDeleteModal: React.FC<{
  transaction: Transaction | null;
  onClose: () => void;
  afterDelete?: () => void;
}> = ({ transaction, onClose, afterDelete }) => {
  const {
    transactionSeries,
    previewTransactionSeriesDeletion,
    deleteTransactionSeriesScope,
    user,
  } = useFinancial();
  const { confirm } = useConfirm();
  const [scope, setScope] = useState<SeriesMutationScope>('single');
  const series = transaction?.seriesId
    ? transactionSeries.find(item => item.id === transaction.seriesId)
    : undefined;
  useEffect(() => setScope('single'), [transaction?.id]);
  const selection = useMemo(() => {
    if (!transaction) return null;
    return previewTransactionSeriesDeletion(transaction.id, scope);
  }, [transaction?.id, scope, transactionSeries]);

  if (!transaction || !selection) return null;
  const statusText = [
    selection.statusCounts.completed ? `${selection.statusCounts.completed} paga(s)` : '',
    selection.statusCounts.pending ? `${selection.statusCounts.pending} aberta(s)` : '',
    selection.statusCounts.scheduled ? `${selection.statusCounts.scheduled} futura(s)` : '',
  ].filter(Boolean).join(' • ');

  const execute = async () => {
    if (selection.requiresReinforcedConfirmation) {
      const reinforced = await confirm({
        title: 'Excluir série inteira e seu histórico?',
        message: `A ação remove ${selection.transactionIds.length} lançamentos e referencia ${selection.historicalPaidCount} parcela(s) paga(s) antes do Finly.`,
        confirmText: 'Excluir série inteira',
        type: 'danger',
      });
      if (!reinforced) return;
    }
    deleteTransactionSeriesScope(transaction.id, scope);
    afterDelete?.();
    onClose();
  };

  return <Modal
    isOpen
    onClose={onClose}
    title={series ? 'Excluir lançamento da série' : 'Excluir lançamento'}
    footer={<div className="flex justify-end gap-2 w-full">
      <button type="button" onClick={onClose} className="px-4 py-2 rounded-full text-sm font-bold">Cancelar</button>
      <button type="button" onClick={execute} className="px-5 py-2 rounded-full bg-rose-600 text-white text-sm font-black">Excluir</button>
    </div>}
  >
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">Escolha o alcance da exclusão de <strong>{transaction.description}</strong>.</p>
      <div className="space-y-2">
        {[
          { value: 'single', label: 'Somente esta' },
          { value: 'current_and_future', label: 'Esta e as futuras' },
          { value: 'entire_series', label: 'Série inteira' },
        ].filter(option => series || option.value === 'single').map(option => <label key={option.value} className={`flex gap-3 rounded-xl border p-3 cursor-pointer ${scope === option.value ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-slate-200 dark:border-slate-700'}`}>
          <input type="radio" name="delete-scope" checked={scope === option.value} onChange={() => setScope(option.value as SeriesMutationScope)} />
          <span className="text-sm font-bold">{option.label}</span>
        </label>)}
      </div>
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs space-y-1">
        <p><strong>{selection.transactionIds.length}</strong> lançamento(s) • {formatCurrency(selection.totalAmount, user.currency)}</p>
        {statusText && <p>{statusText}</p>}
        {selection.historicalPaidCount > 0 && <p className="text-amber-600">{selection.historicalPaidCount} paga(s) antes do Finly constam apenas no progresso histórico.</p>}
      </div>
    </div>
  </Modal>;
};
