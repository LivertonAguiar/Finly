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
  Bookmark,
  Palette,
  Image as ImageIcon,
  FileText,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { DatePicker } from '../ui/DatePicker';
import { ViewModeToggle, CardViewMode } from '../ui/ViewModeToggle';
import { Goal } from '../../types';

export const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal, depositToGoal, accounts, user } = useFinancial();
  const { confirm } = useConfirm();

  const [viewMode, setViewMode] = useState<CardViewMode>(() => {
    try {
      return (localStorage.getItem('finly_goals_view_mode') as CardViewMode) || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

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
  const [description, setDescription] = useState('');

  const openCreateModal = () => {
    setEditingGoal(null);
    setTitle('');
    setTargetAmount('');
    setInitialAmount('0');
    setDeadline('2026-12-31');
    setIcon('🎯');
    setColor('#7c4dff');
    setDescription('');
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
    setDescription(g.description || '');
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
        description,
      });
    } else {
      addGoal({
        title,
        targetAmount: target,
        currentAmount: initial,
        deadline,
        icon,
        color,
        description,
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
      {/* 1. TOP HEADER & CREATE CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Metas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Definindo metas você alcança seus objetivos financeiros mais rápido!
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ViewModeToggle
            mode={viewMode}
            onChange={(m) => {
              setViewMode(m);
              try { localStorage.setItem('finly_goals_view_mode', m); } catch (e) {}
            }}
          />

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Meta</span>
          </button>
        </div>
      </div>

      {/* 2. OVERALL GOALS SUMMARY CARD */}
      <div className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
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

      {/* 4. GOALS LIST / GRID VIEW */}
      {displayGoals.length === 0 ? (
        <div className="p-12 text-center rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-slate-400 text-xs space-y-3">
          <Target className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">
            {activeSegment === 'andamento' ? 'Nenhuma meta em andamento' : 'Nenhuma meta concluída ainda'}
          </h4>
          <p className="text-slate-400">
            {activeSegment === 'andamento'
              ? 'Que tal criar uma para começar a economizar com foco?'
              : 'Assim que você completar suas metas, elas serão exibidas aqui.'}
          </p>
          {activeSegment === 'andamento' && (
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              Criar Primeira Meta
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW (=) */
        <div className="flex flex-col gap-2.5">
          {displayGoals.map(goal => {
            const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#18181B] hover:bg-slate-50/90 dark:hover:bg-[#202024] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Icon + Title + Date */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                    style={{ backgroundColor: (goal.color || '#7c4dff') + '20' }}
                  >
                    {goal.icon || '🎯'}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-1">{goal.title}</h4>
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Meta até {formatDate(goal.deadline)}</span>
                    </span>
                  </div>
                </div>

                {/* Middle: Progress Bar */}
                <div className="flex-1 max-w-xs space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-900 dark:text-white">{formatCurrency(goal.currentAmount, user.currency, !user.showValues)}</span>
                    <span className="text-slate-400">({percent.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(3, percent))}%`, backgroundColor: goal.color || '#7c4dff' }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Right: Target Amount + Action CTA */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold block">Alvo</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(goal.targetAmount, user.currency, !user.showValues)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedGoalForDeposit(goal);
                      setIsDepositModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 text-[11px] font-black uppercase tracking-wider hover:bg-purple-100 transition-colors cursor-pointer"
                  >
                    + Guardar
                  </button>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditModal(goal)} className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={async () => {
                      const ok = await confirm({ title: 'Excluir Meta', message: `Deseja excluir a meta "${goal.title}"?`, confirmText: 'Excluir Meta', type: 'danger' });
                      if (ok) deleteGoal(goal.id);
                    }} className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* GRID BLOCKS VIEW (||) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayGoals.map(goal => {
            const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-6 rounded-[25px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4 relative flex flex-col justify-between"
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
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Excluir Meta',
                          message: `Deseja excluir a meta "${goal.title}"?`,
                          confirmText: 'Excluir Meta',
                          type: 'danger'
                        });
                        if (ok) {
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
                    onClick={async () => {
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

      {/* MODAL: CRIAR / EDITAR META (MATCHING USER SCREENSHOT) */}
      {isGoalModalOpen && (
        <Modal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          title={editingGoal ? 'Editar objetivo' : 'Criar objetivo'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveGoal} className="space-y-4 pt-1">
            {/* 1. Valor do objetivo */}
            <div className="space-y-1 pb-1 border-b border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block">
                Valor do objetivo
              </label>
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-purple-500 shrink-0" />
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-lg font-black text-purple-600 dark:text-purple-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0,00"
                    value={targetAmount}
                    onChange={e => setTargetAmount(e.target.value)}
                    required
                    autoFocus
                    className="w-full py-1 text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 bg-transparent border-none focus:outline-none placeholder:text-purple-300 dark:placeholder:text-purple-700"
                  />
                </div>
              </div>
            </div>

            {/* 2. Valor inicial do objetivo */}
            <div className="space-y-1 pb-1 border-b border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block">
                Valor inicial do objetivo
              </label>
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-purple-400 shrink-0" />
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-sm font-bold text-purple-400">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={initialAmount}
                    onChange={e => setInitialAmount(e.target.value)}
                    className="w-full py-1 text-sm sm:text-base font-bold text-purple-500/90 dark:text-purple-300 bg-transparent border-none focus:outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* 3. Nome do objetivo */}
            <div className="space-y-1 pb-1 border-b border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block">
                Nome do objetivo
              </label>
              <div className="flex items-center gap-3">
                <Bookmark className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Objetivo personalizado"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full py-1 text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 4. Data limite (Material Dialog DatePicker) */}
            <div className="space-y-1 pb-1 border-b border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block">
                Data
              </label>
              <DatePicker
                value={deadline}
                onChange={setDeadline}
                required
              />
            </div>

            {/* 5. Cor */}
            <div className="space-y-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400">Cor</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  '#1c1c1e',
                  '#0284c7',
                  '#7c4dff',
                  '#10b981',
                  '#f59e0b',
                  '#ef4444',
                  '#ec4899',
                  '#06b6d4',
                  '#6366f1',
                ].map(c => {
                  const isSelected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs border border-white/10 hover:scale-105"
                      style={{ backgroundColor: c }}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}

                {/* Custom Color Input */}
                <label className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#252528] text-slate-400 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer shrink-0 transition-all">
                  <Plus className="w-4 h-4" />
                  <input
                    type="color"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* 6. Ícone */}
            <div className="space-y-2 pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-400">Ícone</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['🎯', '🍽️', '🚗', '✈️', '🎁', '💻', '🏠', '🛡️', '💍', '🎓', '👶', '💰', '🏖️', '📱', '🏋️'].map(e => {
                  const isSelected = icon === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className={`w-9 h-9 rounded-full text-base flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 scale-110 shadow-sm'
                          : 'bg-slate-100 dark:bg-[#252528] border-slate-200 dark:border-slate-700 hover:scale-105'
                      }`}
                    >
                      {e}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7. Descrição */}
            <div className="space-y-1 pb-1 border-b border-slate-100 dark:border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block">
                Descrição
              </label>
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Descrição do objetivo"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full py-1 text-sm font-bold text-slate-800 dark:text-white bg-transparent border-none focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#5b36d6] hover:bg-[#4d2bc2] active:scale-[0.99] text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-purple-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{editingGoal ? 'SALVAR OBJETIVO' : 'CRIAR OBJETIVO'}</span>
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
          maxWidth="md"
        >
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor a Guardar</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121214] text-xs sm:text-sm font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">De qual conta saiu o dinheiro?</label>
              <select
                value={depositAccountId}
                onChange={e => setDepositAccountId(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121214] text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
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
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#121214] text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsDepositModalOpen(false);
                  setSelectedGoalForDeposit(null);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Aporte</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
