import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  PiggyBank,
  Calendar,
  Trophy,
  Trash2,
  Edit2,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { Goal } from '../../types';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, depositToGoal, accounts, user } = useFinancial();

  const [activeSegment, setActiveSegment] = useState<'andamento' | 'concluidos'>('andamento');

  // Modal states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositAccountId, setDepositAccountId] = useState(accounts[0]?.id || '');
  const [depositNote, setDepositNote] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#7c4dff');

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setInitialAmount('0');
    setDeadline('2026-12-31');
    setIcon('🎯');
    setColor('#7c4dff');
    setIsGoalModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setTargetAmount(g.targetAmount.toString());
    setInitialAmount(g.currentAmount.toString());
    setDeadline(g.deadline);
    setIcon(g.icon || '🎯');
    setColor(g.color || '#7c4dff');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount) || 0;
    const initial = parseFloat(initialAmount) || 0;
    if (!title.trim() || target <= 0) return;

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title,
        targetAmount: target,
        deadline,
        icon,
        color,
      });
    } else {
      addGoal({
        title,
        targetAmount: target,
        currentAmount: initial,
        deadline,
        icon,
        color,
      });
    }

    setIsGoalModalOpen(false);
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;
    const amt = parseFloat(depositAmount) || 0;
    if (amt <= 0) return;

    depositToGoal(selectedGoalForDeposit.id, amt, depositAccountId, depositNote);

    // If goal reached 100%, trigger confetti
    if (selectedGoalForDeposit.currentAmount + amt >= selectedGoalForDeposit.targetAmount) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    setIsDepositModalOpen(false);
    setSelectedGoalForDeposit(null);
    setDepositAmount('');
    setDepositNote('');
  };

  // Filter goals
  const activeGoals = useMemo(() => goals.filter(g => !g.completed && g.currentAmount < g.targetAmount), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.completed || g.currentAmount >= g.targetAmount), [goals]);

  const displayGoals = activeSegment === 'andamento' ? activeGoals : completedGoals;

  // Global KPIs
  const totalTarget = useMemo(() => goals.reduce((sum, g) => sum + g.targetAmount, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((sum, g) => sum + g.currentAmount, 0), [goals]);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 1. TOP HEADER & CREATE CTA (MOBILLS OBJETIVOS SPEC) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Objetivos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Definindo objetivos você alcança seus sonhos mais rápido!
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Novo Objetivo</span>
        </button>
      </div>

      {/* 2. OVERALL GOALS SUMMARY CARD */}
      <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Total Planejado</span>
            <span className="text-base font-black text-slate-900 dark:text-white">
              {formatCurrency(totalTarget, user.currency, !user.showValues)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Total Guardado</span>
            <span className="text-base font-black text-[#66bb6a]">
              {formatCurrency(totalSaved, user.currency, !user.showValues)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Restante</span>
            <span className="text-base font-black text-[#42a5f5]">
              {formatCurrency(totalRemaining, user.currency, !user.showValues)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">Progresso Geral</span>
            <span className="text-base font-black text-purple-600 dark:text-purple-400">
              {overallProgress.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.min(100, Math.max(2, overallProgress))}%` }}
            className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
          />
        </div>
      </div>

      {/* 3. SEGMENTED TABS: EM ANDAMENTO VS CONCLUÍDOS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveSegment('andamento')}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSegment === 'andamento'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Em Andamento ({activeGoals.length})
        </button>

        <button
          onClick={() => setActiveSegment('concluidos')}
          className={`px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            activeSegment === 'concluidos'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Concluídos ({completedGoals.length})
        </button>
      </div>

      {/* 4. GOALS GRID */}
      {displayGoals.length === 0 ? (
        <div className="p-12 text-center rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-slate-400 text-xs space-y-3">
          <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
            {activeSegment === 'andamento' ? 'Nenhum objetivo em andamento' : 'Nenhum objetivo concluído ainda'}
          </h4>
          <p className="text-slate-400">
            {activeSegment === 'andamento'
              ? 'Que tal criar um para começar a economizar com foco?'
              : 'Assim que você completar seus objetivos, eles serão exibidos aqui.'}
          </p>
          {activeSegment === 'andamento' && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Criar Primeiro Objetivo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayGoals.map(goal => {
            const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4 relative flex flex-col justify-between"
              >
                {/* Header: Icon + Title + Edit/Delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs"
                      style={{ backgroundColor: (goal.color || '#7c4dff') + '20' }}
                    >
                      {goal.icon || '🎯'}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{goal.title}</h4>
                      <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Meta até {formatDate(goal.deadline)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Excluir o objetivo "${goal.title}"?`)) {
                          deleteGoal(goal.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Amounts */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">
                      {formatCurrency(goal.currentAmount, user.currency, !user.showValues)}
                    </span>
                    <span className="text-slate-400">
                      de {formatCurrency(goal.targetAmount, user.currency, !user.showValues)} ({percent.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(3, percent))}%`,
                        backgroundColor: goal.color || '#7c4dff',
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold block text-right">
                    Faltam {formatCurrency(remaining, user.currency, !user.showValues)}
                  </span>
                </div>

                {/* Bottom Deposit CTA */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{percent >= 100 ? 'Meta alcançada! 🎉' : 'Em progresso'}</span>
                  </span>

                  <button
                    onClick={() => {
                      setSelectedGoalForDeposit(goal);
                      setIsDepositModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    + Guardar Dinheiro
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR OBJETIVO */}
      {isGoalModalOpen && (
        <Modal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          title={editingGoal ? 'Editar Objetivo' : 'Criar Novo Objetivo'}
        >
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Título do Objetivo</label>
              <input
                type="text"
                placeholder="Ex: Reserva de Emergência, Viagem, Carro Novo"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Alvo (Meta)</label>
                <input
                  type="number"
                  step="50"
                  placeholder="R$ 0,00"
                  value={targetAmount}
                  onChange={e => setTargetAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
                />
              </div>

              {!editingGoal && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Já tenho guardado</label>
                  <input
                    type="number"
                    step="50"
                    placeholder="R$ 0,00"
                    value={initialAmount}
                    onChange={e => setInitialAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Data Limite Desejada</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                Salvar Objetivo
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: GUARDAR / DEPOSITAR DINHEIRO NA META */}
      {isDepositModalOpen && selectedGoalForDeposit && (
        <Modal
          isOpen={isDepositModalOpen}
          onClose={() => {
            setIsDepositModalOpen(false);
            setSelectedGoalForDeposit(null);
          }}
          title={`Guardar Dinheiro: ${selectedGoalForDeposit.title}`}
        >
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor a Guardar</label>
              <input
                type="number"
                step="10"
                placeholder="R$ 0,00"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">De qual conta saiu o dinheiro?</label>
              <select
                value={depositAccountId}
                onChange={e => setDepositAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance, user.currency)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nota / Observação (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Aporte mensal, Economia do almoço"
                value={depositNote}
                onChange={e => setDepositNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                Confirmar Aporte
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
