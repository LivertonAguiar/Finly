import React, { useState } from 'react';
import { TrendingDown, Plus, CheckCircle2, AlertCircle, Trash2, Calendar, DollarSign } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ViewModeToggle, CardViewMode } from '../ui/ViewModeToggle';
import { Debt } from '../../types';

export const DebtsPage: React.FC = () => {
  const { debts, addDebt, deleteDebt, payDebtInstallment, accounts, user, metrics } = useFinancial();

  const [viewMode, setViewMode] = useState<CardViewMode>(() => {
    try {
      return (localStorage.getItem('finly_debts_view_mode') as CardViewMode) || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [dueDay, setDueDay] = useState('10');
  const [nextDueDate, setNextDueDate] = useState(getTodayString());

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount) || 0;
    const inst = parseFloat(installmentAmount) || 0;
    const tInst = parseInt(totalInstallments) || 12;

    addDebt({
      title,
      creditor,
      totalAmount: tot,
      installmentAmount: inst,
      totalInstallments: tInst,
      dueDay: parseInt(dueDay) || 10,
      nextDueDate,
    });

    setTitle('');
    setCreditor('');
    setTotalAmount('');
    setInstallmentAmount('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Dívidas & Financiamentos</h2>
          <p className="text-xs text-slate-400">Controle empréstimos, financiamentos e parcele sua quitação</p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <ViewModeToggle
            mode={viewMode}
            onChange={(m) => {
              setViewMode(m);
              try { localStorage.setItem('finly_debts_view_mode', m); } catch (e) {}
            }}
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Nova Dívida
          </button>
        </div>
      </div>

      {/* 2 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Saldo Devedor Total</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(metrics.totalDebts, user.currency, !user.showValues)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">{debts.length} dívidas ativas</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Próximas Parcelas Mensais</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {formatCurrency(debts.reduce((sum, d) => sum + d.installmentAmount, 0), user.currency, !user.showValues)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">Comprometimento de renda</span>
        </div>
      </div>

      {/* Debts View: LIST (=) or GRID (||) */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-2.5">
          {debts.map(d => {
            const progressPct = ((d.paidInstallments) / d.totalInstallments) * 100;

            return (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#18181B] hover:bg-slate-50/90 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group relative"
              >
                {/* Left: Title + Creditor */}
                <div className="min-w-[180px]">
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">{d.title}</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Credor: {d.creditor} • Vence dia {d.dueDay}</p>
                </div>

                {/* Middle: Progress */}
                <div className="flex-1 max-w-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{d.paidInstallments}/{d.totalInstallments} pagas</span>
                    <span>{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {/* Right: Amounts + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">Restante</span>
                    <span className="text-xs font-black text-rose-600">
                      {formatCurrency(d.remainingAmount, user.currency, !user.showValues)}
                    </span>
                  </div>

                  <button
                    onClick={() => payDebtInstallment(d.id, accounts[0]?.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Pagar Parcela
                  </button>

                  <button onClick={() => deleteDebt(d.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map(d => {
            const progressPct = ((d.paidInstallments) / d.totalInstallments) * 100;

            return (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{d.title}</h3>
                      <p className="text-xs text-slate-400">Credor: {d.creditor}</p>
                    </div>
                    <button onClick={() => deleteDebt(d.id)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Restante</span>
                      <p className="font-black text-rose-600 text-base">{formatCurrency(d.remainingAmount, user.currency, !user.showValues)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Parcela</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(d.installmentAmount, user.currency, !user.showValues)}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>{d.paidInstallments} de {d.totalInstallments} pagas</span>
                      <span>{progressPct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Vence dia {d.dueDay}</span>
                  <button
                    onClick={() => payDebtInstallment(d.id, accounts[0]?.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Pagar Parcela
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Nova Dívida ou Financiamento">
        <form onSubmit={handleSaveDebt} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título da Dívida *</label>
            <input
              type="text"
              required
              placeholder="Ex: Financiamento Carro, Empréstimo Pessoal..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Credor / Banco</label>
            <input
              type="text"
              placeholder="Ex: Caixa, Santander, Bradesco..."
              value={creditor}
              onChange={e => setCreditor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Total (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={e => setTotalAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor da Parcela (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={installmentAmount}
                onChange={e => setInstallmentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total de Parcelas</label>
              <input
                type="number"
                required
                value={totalInstallments}
                onChange={e => setTotalInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dia do Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-semibold"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
              Salvar Dívida
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};