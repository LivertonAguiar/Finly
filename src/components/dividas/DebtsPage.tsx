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
  Home,
  Car,
  FileText,
  Calculator,
  Zap,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ViewModeToggle, CardViewMode } from '../ui/ViewModeToggle';
import { Debt, DebtContractType, AmortizationSystem, DebtIndexer } from '../../types';
import { getOfficialDailyTR } from '../../utils/marketRatesService';
import { FinancingScheduleModal } from './FinancingScheduleModal';
import { ExtraordinaryAmortizationModal } from './ExtraordinaryAmortizationModal';
import { inferContractType } from '../../utils/debtContractInference';

export { inferContractType };

export const DebtsPage: React.FC = () => {
  const {
    debts,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebtInstallment,
    generateDebtTransactions,
    transactions,
    accounts,
    user,
    metrics,
  } = useFinancial();
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
  const [scheduleDebt, setScheduleDebt] = useState<Debt | null>(null);
  const [amortizationDebt, setAmortizationDebt] = useState<Debt | null>(null);

  // Payment Confirmation Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayString());
  const [paymentAmount, setPaymentAmount] = useState('');

  // Form fields
  const [contractType, setContractType] = useState<DebtContractType>('loan');
  const [title, setTitle] = useState('');
  const [creditor, setCreditor] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [paidInstallments, setPaidInstallments] = useState('0');
  const [dueDay, setDueDay] = useState('10');
  const [nextDueDate, setNextDueDate] = useState(getTodayString());
  const [interestRate, setInterestRate] = useState('');
  const [amortizationSystem, setAmortizationSystem] = useState<AmortizationSystem>('PRICE');
  const [indexer, setIndexer] = useState<DebtIndexer>('TR');
  const [indexerRate, setIndexerRate] = useState('0.1708');
  const [insuranceMonthly, setInsuranceMonthly] = useState('');
  const [adminFeeMonthly, setAdminFeeMonthly] = useState('0');
  const [defaultAccountId, setDefaultAccountId] = useState('');
  const [syncToTransactions, setSyncToTransactions] = useState(true);
  const [horizonMonths, setHorizonMonths] = useState<number>(12);
  const [notes, setNotes] = useState('');
  const [isFetchingTR, setIsFetchingTR] = useState(false);

  const handleFetchTR = async () => {
    setIsFetchingTR(true);
    try {
      const res = await getOfficialDailyTR();
      setIndexerRate(String(res.rate));
    } catch (e) {
      console.warn('Erro ao consultar TR:', e);
    } finally {
      setIsFetchingTR(false);
    }
  };

  const handleOpenNew = () => {
    setEditingDebt(null);
    setContractType('loan');
    setTitle('');
    setCreditor('');
    setContractNumber('');
    setTotalAmount('');
    setRemainingAmount('');
    setInstallmentAmount('');
    setTotalInstallments('12');
    setPaidInstallments('0');
    setDueDay('10');
    setNextDueDate(getTodayString());
    setInterestRate('');
    setAmortizationSystem('PRICE');
    setIndexer('TR');
    setIndexerRate('0.1708');
    setInsuranceMonthly('');
    setAdminFeeMonthly('0');
    setDefaultAccountId(accounts[0]?.id || '');
    setSyncToTransactions(true);
    setHorizonMonths(12);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (d: Debt) => {
    setEditingDebt(d);
    setContractType(inferContractType(d));
    setTitle(d.title);
    setCreditor(d.creditor || '');
    setContractNumber(d.contractNumber || '');
    setTotalAmount(String(d.totalAmount));
    setRemainingAmount(String(d.remainingAmount));
    setInstallmentAmount(String(d.installmentAmount));
    setTotalInstallments(String(d.totalInstallments));
    setPaidInstallments(String(d.paidInstallments ?? 0));
    setDueDay(String(d.dueDay));
    setNextDueDate(d.nextDueDate || getTodayString());
    setInterestRate(d.interestRate !== undefined ? String(d.interestRate) : '');
    setAmortizationSystem(d.amortizationSystem || 'PRICE');
    setIndexer(d.indexer || 'TR');
    setIndexerRate(d.indexerRate !== undefined ? String(d.indexerRate) : '0.1708');
    setInsuranceMonthly(d.insuranceMonthly !== undefined ? String(d.insuranceMonthly) : '');
    setAdminFeeMonthly(d.adminFeeMonthly !== undefined ? String(d.adminFeeMonthly) : '0');
    setDefaultAccountId(d.defaultAccountId || accounts[0]?.id || '');
    setSyncToTransactions(d.syncToTransactions ?? true);
    setHorizonMonths(12);
    setNotes(d.notes || '');
    setIsModalOpen(true);
  };

  const handleOpenPayment = (d: Debt) => {
    setPaymentDebt(d);
    setPaymentAccountId(d.defaultAccountId || accounts[0]?.id || '');
    setPaymentDate(getTodayString());
    setPaymentAmount(String(d.installmentAmount || 0));
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentDebt) return;
    const amt = parseFloat(paymentAmount) || paymentDebt.installmentAmount;
    payDebtInstallment(paymentDebt.id, paymentAccountId, paymentDate, amt);
    setIsPaymentModalOpen(false);
  };

  const handleSyncTransactions = (d: Debt, customHorizon?: number) => {
    generateDebtTransactions(d.id, {
      horizonMonths: customHorizon || 12,
      replaceExisting: true,
    });
  };

  // Helper to count pending transactions linked to a debt
  const getLinkedPendingCount = (debtId: string) => {
    return transactions.filter(t => t.debtId === debtId && t.status === 'pending').length;
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const tot = parseFloat(totalAmount) || 0;
    const inst = parseFloat(installmentAmount) || 0;
    const tInst = parseInt(totalInstallments) || 12;
    const pInst = parseInt(paidInstallments) || 0;
    const dDay = parseInt(dueDay) || 10;
    const iRate = interestRate ? parseFloat(interestRate) : undefined;
    const idxRateVal = indexerRate ? parseFloat(indexerRate) : undefined;
    const insVal = insuranceMonthly ? parseFloat(insuranceMonthly) : undefined;
    const adminVal = adminFeeMonthly ? parseFloat(adminFeeMonthly) : undefined;

    let rem = remainingAmount !== '' ? parseFloat(remainingAmount) : Math.max(0, tot - pInst * inst);
    if (isNaN(rem) || rem < 0) rem = Math.max(0, tot - pInst * inst);

    const debtPayload = {
      title: title.trim(),
      creditor: creditor.trim(),
      contractType,
      contractNumber: contractNumber.trim() || undefined,
      totalAmount: tot,
      remainingAmount: rem,
      installmentAmount: inst,
      totalInstallments: tInst,
      paidInstallments: pInst,
      dueDay: dDay,
      nextDueDate,
      interestRate: iRate,
      amortizationSystem,
      indexer,
      indexerRate: idxRateVal,
      insuranceMonthly: insVal,
      adminFeeMonthly: adminVal,
      defaultAccountId: defaultAccountId || undefined,
      syncToTransactions,
      notes: notes.trim() || undefined,
    };

    if (editingDebt) {
      updateDebt(editingDebt.id, debtPayload, {
        syncToTransactions,
        horizonMonths,
        accountId: defaultAccountId || undefined,
      });
    } else {
      addDebt(debtPayload, {
        syncToTransactions,
        horizonMonths,
        accountId: defaultAccountId || undefined,
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
            Parabéns! Você não possui dívidas cadastradas. Caso tenha algum financiamento habitacional, veicular ou empréstimo, cadastre para acompanhar o saldo devedor e evolução.
          </p>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Cadastrar Financiamento / Dívida
          </button>
        </div>
      ) : viewMode === 'list' ? (
        /* Debts View: LIST */
        <div className="flex flex-col gap-3">
          {debts.map(d => {
            const progressPct = ((d.paidInstallments) / d.totalInstallments) * 100;
            const isStructured = d.contractType === 'real_estate' || d.contractType === 'vehicle' || Boolean(d.amortizationSystem);

            return (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#18181B] hover:bg-slate-50/90 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 group relative"
              >
                {/* Left: Type, Title + Creditor */}
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {d.contractType === 'real_estate' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                        <Home className="w-3 h-3" /> Imobiliário
                      </span>
                    ) : d.contractType === 'vehicle' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        <Car className="w-3 h-3" /> Veículo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                        <FileText className="w-3 h-3" /> Empréstimo
                      </span>
                    )}

                    {d.amortizationSystem && (
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-bold">
                        {d.amortizationSystem} {d.indexer ? `• ${d.indexer}` : ''}
                      </span>
                    )}

                    {d.interestRate !== undefined && d.interestRate > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                        {d.interestRate}% a.a.
                      </span>
                    )}
                  </div>

                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{d.title}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {d.creditor && <span>Credor: {d.creditor}</span>}
                    {d.contractNumber && <span>• Contrato: <span className="font-mono">{d.contractNumber}</span></span>}
                    <span>• Vence dia {d.dueDay}</span>
                  </p>
                </div>

                {/* Middle: Progress */}
                <div className="flex-1 max-w-xs space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>{d.paidInstallments}/{d.totalInstallments} pagas ({d.totalInstallments - d.paidInstallments} rest.)</span>
                    <span>{progressPct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                </div>

                {/* Right: Amounts + Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-2 shrink-0 flex-wrap">
                  <div className="text-right mr-2">
                    <span className="text-[10px] text-slate-400 font-bold block">Saldo Devedor</span>
                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                      {formatCurrency(d.remainingAmount, user.currency, !user.showValues)}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Parcela: {formatCurrency(d.installmentAmount, user.currency, !user.showValues)}
                    </span>
                  </div>

                  {/* Botões de Financiamento */}
                  {isStructured && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setScheduleDebt(d)}
                        title="Ver Cronograma & Evolução das Parcelas"
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Cronograma</span>
                      </button>

                      <button
                        onClick={() => setAmortizationDebt(d)}
                        title="Simular Amortização Extraordinária (Reduzir Prazo ou Parcela)"
                        className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Amortizar</span>
                      </button>
                    </div>
                  )}

                  {/* Sincronização com Extrato */}
                  <button
                    onClick={() => handleSyncTransactions(d, 12)}
                    title="Lançar / Sincronizar parcelas desta dívida no Extrato de Transações"
                    className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px] font-mono">
                      {getLinkedPendingCount(d.id)} no extrato
                    </span>
                  </button>

                  <button
                    onClick={() => handleOpenPayment(d)}
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
            const isStructured = d.contractType === 'real_estate' || d.contractType === 'vehicle' || Boolean(d.amortizationSystem);

            return (
              <div
                key={d.id}
                className="p-5 rounded-[22px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
              >
                <div>
                  {/* Top Badges & Actions */}
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                        {d.contractType === 'real_estate' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                            <Home className="w-3 h-3" /> Imobiliário
                          </span>
                        ) : d.contractType === 'vehicle' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                            <Car className="w-3 h-3" /> Veículo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                            <FileText className="w-3 h-3" /> Empréstimo
                          </span>
                        )}

                        {d.amortizationSystem && (
                          <span className="px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-bold">
                            {d.amortizationSystem} {d.indexer ? `• ${d.indexer}` : ''}
                          </span>
                        )}

                        {d.interestRate !== undefined && d.interestRate > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            {d.interestRate}% a.a.
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                        {d.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Landmark className="w-3 h-3 shrink-0" />
                        <span>{d.creditor || 'Credor não informado'}</span>
                        {d.contractNumber && (
                          <span className="text-[10px] font-mono text-slate-400">({d.contractNumber})</span>
                        )}
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

                  {/* Financial Metrics Bento */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Saldo Devedor</span>
                      <p className="font-black text-rose-600 dark:text-rose-400 text-base font-mono">
                        {formatCurrency(d.remainingAmount, user.currency, !user.showValues)}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Parcela Mensal</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base font-mono">
                        {formatCurrency(d.installmentAmount, user.currency, !user.showValues)}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown MIP/DFI se houver */}
                  {d.insuranceMonthly !== undefined && d.insuranceMonthly > 0 && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-900/30 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400">Seguros Obrigatórios (MIP+DFI):</span>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(d.insuranceMonthly, user.currency, !user.showValues)}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mt-3.5">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-semibold">
                      <span>{d.paidInstallments} de {d.totalInstallments} pagas</span>
                      <span>{progressPct.toFixed(0)}% ({d.totalInstallments - d.paidInstallments} restantes)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Vence dia {d.dueDay}</span>
                      <button
                        type="button"
                        onClick={() => handleSyncTransactions(d, 12)}
                        title="Lançar / Sincronizar parcelas desta dívida no Extrato de Transações"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold hover:bg-blue-500/20 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{getLinkedPendingCount(d.id)} no extrato</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenPayment(d)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pagar Parcela</span>
                    </button>
                  </div>

                  {/* Botões Especiais de Financiamento */}
                  {isStructured && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-dashed border-slate-100 dark:border-slate-800/80">
                      <button
                        onClick={() => setScheduleDebt(d)}
                        className="py-1.5 px-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Cronograma</span>
                      </button>
                      <button
                        onClick={() => setAmortizationDebt(d)}
                        className="py-1.5 px-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Simular Amortização</span>
                      </button>
                    </div>
                  )}
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
        title={editingDebt ? 'Editar Financiamento / Dívida' : 'Novo Financiamento ou Dívida'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveDebt} className="space-y-4">
          {/* Segmented Selector: Tipo de Contrato */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Contrato
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setContractType('loan')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  contractType === 'loan'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Empréstimo</span>
              </button>
              <button
                type="button"
                onClick={() => setContractType('real_estate')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  contractType === 'real_estate'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Imobiliário</span>
              </button>
              <button
                type="button"
                onClick={() => setContractType('vehicle')}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  contractType === 'vehicle'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-600/30'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Veículo</span>
              </button>
            </div>
          </div>

          {/* Título & Credor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título do Contrato / Dívida *
              </label>
              <input
                type="text"
                required
                placeholder={contractType === 'real_estate' ? 'Ex: Financiamento Caixa Habitação' : 'Ex: Empréstimo Pessoal'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credor / Banco
              </label>
              <div className="relative">
                <Landmark className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Caixa Econômica Federal"
                  value={creditor}
                  onChange={e => setCreditor(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Nº do Contrato (opcional para todos, destacado para habitacional) */}
          {contractType !== 'loan' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Número do Contrato Bancário
              </label>
              <input
                type="text"
                placeholder="Ex: 878772194236-2"
                value={contractNumber}
                onChange={e => setContractNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Parâmetros Estruturados de Financiamento */}
          {contractType !== 'loan' && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 space-y-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  Parâmetros de Financiamento & Amortização
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sistema de Amortização
                  </label>
                  <select
                    value={amortizationSystem}
                    onChange={e => setAmortizationSystem(e.target.value as AmortizationSystem)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="PRICE">Tabela Price (TP - Prestações Constantes)</option>
                    <option value="SAC">SAC (Amortização Constante / Parcela Decrescente)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Indexador Monetário
                  </label>
                  <select
                    value={indexer}
                    onChange={e => setIndexer(e.target.value as DebtIndexer)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  >
                    <option value="TR">TR - Taxa Referencial (Padrão Caixa)</option>
                    <option value="IPCA">IPCA - Inflação Oficial</option>
                    <option value="FIXED">Pré-fixado (Sem correção monetária)</option>
                  </select>
                </div>
              </div>

              {indexer !== 'FIXED' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Taxa do Indexador (% a.m.)
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Fonte Oficial BACEN SGS</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.1708"
                        value={indexerRate}
                        onChange={e => setIndexerRate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleFetchTR}
                      disabled={isFetchingTR}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingTR ? 'animate-spin' : ''}`} />
                      <span>{isFetchingTR ? 'Buscando...' : 'Buscar TR Hoje (BACEN)'}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Seguros Obrigatórios (MIP + DFI)
                  </label>
                  <div className="relative">
                    <span className="text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 28.76"
                      value={insuranceMonthly}
                      onChange={e => setInsuranceMonthly(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa Operacional / Adm (Mensal)
                  </label>
                  <div className="relative">
                    <span className="text-xs text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 25.00 ou 0"
                      value={adminFeeMonthly}
                      onChange={e => setAdminFeeMonthly(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Valor Total & Saldo Devedor Restante */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Valor Total Financiado (R$) *
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
                Saldo Devedor Atual (R$) *
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
                  Valor da Prestação Mensal (R$) *
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
                Taxa de Juros Nominal (% a.a.)
              </label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 4.25"
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
                placeholder="420"
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
                placeholder="19"
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

          {/* Integração com Extrato & Transações */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Lançar parcelas no Extrato de Transações
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToTransactions}
                  onChange={e => setSyncToTransactions(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {syncToTransactions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Conta Bancária Padrão (Débito)
                  </label>
                  <select
                    value={defaultAccountId}
                    onChange={e => setDefaultAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  >
                    <option value="">Sem conta específica</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance, user.currency, !user.showValues)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horizonte de Parcelas no Extrato
                  </label>
                  <select
                    value={horizonMonths}
                    onChange={e => setHorizonMonths(parseInt(e.target.value) || 12)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                  >
                    <option value={12}>Próximos 12 meses (Recomendado)</option>
                    <option value={24}>Próximos 24 meses (2 anos)</option>
                    <option value={420}>Todas as parcelas restantes</option>
                  </select>
                </div>
              </div>
            )}
            <p className="text-[10px] text-slate-400 leading-relaxed">
              As parcelas serão lançadas como despesas pendentes no seu Extrato e Calendário. Ao pagar uma parcela ou efetivar a transação, o saldo devedor e as parcelas pagas são sincronizados automaticamente.
            </p>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Notas
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre contrato, FGTS, condições de amortização..."
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
              <span>{editingDebt ? 'Salvar Alterações' : 'Cadastrar Financiamento'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação e Pagamento de Parcela */}
      {isPaymentModalOpen && paymentDebt && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Registrar Pagamento de Parcela"
          maxWidth="md"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {paymentDebt.title}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                  Parcela {paymentDebt.paidInstallments + 1} de {paymentDebt.totalInstallments}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {paymentDebt.creditor || 'Credor'} • Saldo devedor atual: {formatCurrency(paymentDebt.remainingAmount, user.currency, !user.showValues)}
              </p>
            </div>

            {/* Conta Bancária de Débito */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Conta de Débito *
              </label>
              <select
                required
                value={paymentAccountId}
                onChange={e => setPaymentAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — Saldo: {formatCurrency(acc.balance, user.currency, !user.showValues)}
                  </option>
                ))}
              </select>
            </div>

            {/* Data e Valor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              O pagamento reduzirá o saldo devedor, marcará a parcela correspondente no extrato como concluída e debitará o valor da conta selecionada.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Pagamento</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Cronograma Completo e Evolução */}
      {scheduleDebt && (
        <FinancingScheduleModal
          isOpen={!!scheduleDebt}
          onClose={() => setScheduleDebt(null)}
          debt={scheduleDebt}
          currency={user.currency}
        />
      )}

      {/* Modal de Simulação de Amortização Extraordinária */}
      {amortizationDebt && (
        <ExtraordinaryAmortizationModal
          isOpen={!!amortizationDebt}
          onClose={() => setAmortizationDebt(null)}
          debt={amortizationDebt}
          currency={user.currency}
        />
      )}
    </div>
  );
};
