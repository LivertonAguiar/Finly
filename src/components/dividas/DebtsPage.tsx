import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Landmark,
  Percent,
  Check,
  Calendar,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ViewModeToggle, CardViewMode } from '../ui/ViewModeToggle';
import { Debt } from '../../types';

export const DebtsPage: React.FC = () => {
  const { debts, addDebt, updateDebt, deleteDebt, payDebtInstallment, accounts, user, metrics } = useFinancial();
  const { confirm } = useConfirm();

  const [viewMode, setViewMode] = useState<CardViewMode>(() => {
    try {
      return (localStorage.getItem('finly_debts_view_mode') as CardViewMode) || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [dueDay, setDueDay] = useState('10');
  const [nextDueDate, setNextDueDate] = useState(getTodayString());
  const [interestRate, setInterestRate] = useState('');
  const [notes, setNotes] = useState('');

  const handleOpenNew = () => {
    setEditingDebt(null);
    setTitle('');
    setCreditor('');
    setTotalAmount('');
    setRemainingAmount('');
    setInstallmentAmount('');
    setTotalInstallments('12');
    setPaidInstallments('0');
    setDueDay('10');
    setNextDueDate(getTodayString());
    setInterestRate('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Debt) => {
    setEditingDebt(d);
    setTitle(d.title);
    setCreditor(d.creditor || '');
    setTotalAmount(String(d.totalAmount));
    setRemainingAmount(String(d.remainingAmount));
    setInstallmentAmount(String(d.installmentAmount));
    setTotalInstallments(String(d.totalInstallments));
    setPaidInstallments(String(d.paidInstallments ?? 0));
    setDueDay(String(d.dueDay));
    setNextDueDate(d.nextDueDate || getTodayString());
    setInterestRate(d.interestRate !== undefined ? String(d.interestRate) : '');
    setNotes(d.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount) || 0;
    const inst = parseFloat(installmentAmount) || 0;
    const tInst = parseInt(totalInstallments) || 12;
    const pInst = parseInt(paidInstallments) || 0;
    const dDay = parseInt(dueDay) || 10;
    const iRate = interestRate ? parseFloat(interestRate) : undefined;

    let rem = remainingAmount !== '' ? parseFloat(remainingAmount) : Math.max(0, tot - pInst * inst);
    if (isNaN(rem) || rem < 0) rem = Math.max(0, tot - pInst * inst);

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        title: title.trim(),
        creditor: creditor.trim(),
        totalAmount: tot,
        remainingAmount: rem,
        installmentAmount: inst,
        totalInstallments: tInst,
        paidInstallments: pInst,
        dueDay: dDay,
        nextDueDate,
        interestRate: iRate,
        notes: notes.trim() || undefined,
      });
    } else {
      addDebt({
        title: title.trim(),
        creditor: creditor.trim(),
        totalAmount: tot,
        remainingAmount: rem,
        installmentAmount: inst,
        totalInstallments: tInst,
        paidInstallments: pInst,
        dueDay: dDay,
        nextDueDate,
        interestRate: iRate,
        notes: notes.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteDebt = async (d: Debt) => {
    const ok = await confirm({
      title: 'Excluir Dívida / Financiamento',
      message: `Deseja realmente excluir "${d.title}"? Você poderá desfazer nos primeiros segundos.`,
      confirmText: 'Excluir',
      type: 'danger',
    });
    if (ok) {
      deleteDebt(d.id);
    }
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
            onClick={handleOpenNew}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
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

      {/* Empty State */}
      {debts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Nenhuma dívida ou financiamento ativo</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Parabéns! Você não possui dívidas cadastradas. Caso tenha algum financiamento ou empréstimo, cadastre para acompanhar o saldo devedor.
          </p>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar Dívida
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Debts View: LIST */
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
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{d.title}</span>
                    {d.interestRate !== undefined && d.interestRate > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        {d.interestRate}%
                      </span>
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {d.creditor ? `Credor: ${d.creditor} • ` : ''}Vence dia {d.dueDay}
                  </p>
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
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  <div className="text-right mr-1">
                    <span className="text-[10px] text-slate-400 font-bold block">Restante</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      {formatCurrency(d.remainingAmount, user.currency, !user.showValues)}
                    </span>
                  </div>

                  <button
                    onClick={() => payDebtInstallment(d.id, accounts[0]?.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pagar</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(d)}
                    title="Editar Dívida"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteDebt(d)}
                    title="Excluir Dívida"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Debts View: GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {debts.map(d => {
            const progressPct = ((d.paidInstallments) / d.totalInstallments) * 100;

            return (
              <div
                key={d.id}
                className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 pr-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                        <span>{d.title}</span>
                        {d.interestRate !== undefined && d.interestRate > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            {d.interestRate}%
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Landmark className="w-3 h-3 shrink-0" />
                        <span>{d.creditor || 'Credor não especificado'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(d)}
                        title="Editar Dívida"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d)}
                        title="Excluir Dívida"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Restante</span>
                      <p className="font-black text-rose-600 dark:text-rose-400 text-base">
                        {formatCurrency(d.remainingAmount, user.currency, !user.showValues)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase">Parcela</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(d.installmentAmount, user.currency, !user.showValues)}
                      </p>
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
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pagar Parcela</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Debt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDebt ? 'Editar Dívida ou Financiamento' : 'Nova Dívida ou Financiamento'}
      >
        <form onSubmit={handleSaveDebt} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Título da Dívida / Financiamento *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Financiamento Carro, Empréstimo Pessoal..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Credor */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Credor / Instituição Financeira
            </label>
            <div className="relative">
              <Landmark className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: Caixa Econômica, Santander, Bradesco..."
                value={creditor}
                onChange={e => setCreditor(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Valor Total & Saldo Devedor Restante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total Contratado (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={totalAmount}
                onChange={e => {
                  setTotalAmount(e.target.value);
                  if (!editingDebt && !remainingAmount) {
                    setRemainingAmount(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Saldo Devedor Restante (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={remainingAmount}
                onChange={e => setRemainingAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-rose-600 dark:text-rose-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Valor da Parcela & Taxa de Juros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Valor da Parcela (R$) *
                </label>
                {totalAmount && totalInstallments && (
                  <button
                    type="button"
                    onClick={() => {
                      const tot = parseFloat(totalAmount) || 0;
                      const inst = parseInt(totalInstallments) || 1;
                      if (tot > 0 && inst > 0) {
                        setInstallmentAmount((tot / inst).toFixed(2));
                      }
                    }}
                    className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Sugerir (Total ÷ Qtd)
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0,00"
                value={installmentAmount}
                onChange={e => setInstallmentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Taxa de Juros (% a.m. ou a.a.)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1.5"
                  value={interestRate}
                  onChange={e => setInterestRate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Parcelas Total, Pagas & Dia do Vencimento */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Total Parcelas *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalInstallments}
                onChange={e => setTotalInstallments(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Parcelas Pagas
              </label>
              <input
                type="number"
                min="0"
                value={paidInstallments}
                onChange={e => setPaidInstallments(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Dia Venc. (1-31) *
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="w-full px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Próximo Vencimento */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Próximo Vencimento
            </label>
            <input
              type="date"
              value={nextDueDate}
              onChange={e => setNextDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Notas
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre contrato, amortização, taxas..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingDebt ? 'Salvar Alterações' : 'Cadastrar Dívida'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};