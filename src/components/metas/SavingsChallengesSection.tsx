import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  PiggyBank,
  Zap,
  Trash2,
  ChevronRight,
  Flame,
  Award,
  ArrowRight,
  X,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SavingsChallenge, ChallengeMilestone } from '../../types/challenges';
import {
  getStoredChallenges,
  saveChallenges,
  CHALLENGE_TEMPLATES,
  createChallengeFromTemplate,
} from '../../data/savingsChallengesData';
import { useFinancial } from '../../context/FinancialContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Modal } from '../ui/Modal';

export const SavingsChallengesSection: React.FC = () => {
  const { user, accounts, depositToGoal } = useFinancial();
  const { confirm } = useConfirm();

  const [challenges, setChallenges] = useState<SavingsChallenge[]>(getStoredChallenges);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [isNewChallengeModalOpen, setIsNewChallengeModalOpen] = useState(false);

  // Sync state
  useEffect(() => {
    const handleUpdate = () => setChallenges(getStoredChallenges());
    window.addEventListener('finly_challenges_updated', handleUpdate);
    return () => window.removeEventListener('finly_challenges_updated', handleUpdate);
  }, []);

  // Select first active challenge by default
  useEffect(() => {
    if (!selectedChallengeId && challenges.length > 0) {
      setSelectedChallengeId(challenges[0].id);
    }
  }, [challenges, selectedChallengeId]);

  const activeChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];

  const handleStartTemplate = (type: '52_weeks' | '30_days' | 'no_delivery', multiplier: number = 1) => {
    const newChal = createChallengeFromTemplate(type, undefined, multiplier);
    const updated = [newChal, ...challenges];
    saveChallenges(updated);
    setChallenges(updated);
    setSelectedChallengeId(newChal.id);
    setIsNewChallengeModalOpen(false);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleToggleMilestone = (challengeId: string, milestoneId: number) => {
    const updated = challenges.map(chal => {
      if (chal.id !== challengeId) return chal;

      const milestones = chal.milestones.map(m => {
        if (m.id !== milestoneId) return m;
        const willComplete = !m.isCompleted;
        return {
          ...m,
          isCompleted: willComplete,
          completedAt: willComplete ? new Date().toISOString() : undefined,
        };
      });

      const savedAmount = milestones
        .filter(m => m.isCompleted)
        .reduce((sum, m) => sum + m.targetAmount, 0);

      const isAllCompleted = milestones.every(m => m.isCompleted);

      if (isAllCompleted) {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
        });
      } else {
        // Small celebratory burst
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
        });
      }

      return {
        ...chal,
        milestones,
        savedAmount,
        status: isAllCompleted ? ('completed' as const) : ('active' as const),
      };
    });

    saveChallenges(updated);
    setChallenges(updated);
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    const ok = await confirm({
      title: 'Excluir Desafio',
      message: 'Deseja realmente remover este desafio de economia? Seu histórico de marcação será apagado.',
      confirmText: 'Excluir Desafio',
      type: 'danger',
    });
    if (ok) {
      const updated = challenges.filter(c => c.id !== challengeId);
      saveChallenges(updated);
      setChallenges(updated);
      if (selectedChallengeId === challengeId) {
        setSelectedChallengeId(updated[0]?.id || null);
      }
    }
  };

  // Metrics across all challenges
  const totalSavedAcrossAll = challenges.reduce((sum, c) => sum + c.savedAmount, 0);
  const totalTargetAcrossAll = challenges.reduce((sum, c) => sum + c.targetTotalAmount, 0);
  const overallPercent = totalTargetAcrossAll > 0 ? Math.round((totalSavedAcrossAll / totalTargetAcrossAll) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Banner with Metrics */}
      <div className="p-6 rounded-[28px] bg-gradient-to-r from-purple-950/80 via-slate-900 to-emerald-950/80 border border-purple-900/40 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Gamificação & Hábito de Poupar</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Desafios de Economia
            </h3>
            <p className="text-xs text-slate-300">
              Transforme a disciplina de guardar dinheiro em um jogo com metas graduais e comemorações.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewChallengeModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Iniciar Desafio</span>
            </button>
          </div>
        </div>

        {/* Global Progress Bar if any challenge exists */}
        {challenges.length > 0 && (
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-white/10">
            <div>
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Total Poupado nos Desafios</span>
              <span className="text-xl font-black text-emerald-400">{formatCurrency(totalSavedAcrossAll, user.currency)}</span>
            </div>
            <div>
              <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Meta Total Acumulada</span>
              <span className="text-xl font-black text-white">{formatCurrency(totalTargetAcrossAll, user.currency)}</span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-[10px] text-purple-300 uppercase tracking-wider">Conclusão Geral</span>
                <span className="text-white font-black">{overallPercent}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, overallPercent)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* If No Challenges Active Yet */}
      {challenges.length === 0 ? (
        <div className="p-8 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center shadow-sm">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              Nenhum desafio ativo no momento
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Escolha um dos desafios prontos abaixo para começar a poupar toda semana ou dia.
            </p>
          </div>

          {/* Quick Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-2 text-left">
            {CHALLENGE_TEMPLATES.slice(0, 3).map(tpl => (
              <div
                key={tpl.title}
                onClick={() => handleStartTemplate(tpl.type, tpl.multiplier || 1)}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                    {tpl.badge}
                  </span>
                  <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                </div>
                <h5 className="text-sm font-black text-slate-900 dark:text-white">{tpl.title}</h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{tpl.description}</p>
                <div className="pt-2 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Meta: {formatCurrency(tpl.targetAmount, user.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Active Challenges View */
        <div className="space-y-6">
          {/* Challenge Selector Tabs Pill */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {challenges.map(chal => {
              const isSelected = chal.id === activeChallenge?.id;
              const completedCount = chal.milestones.filter(m => m.isCompleted).length;
              const progressPct = Math.round((completedCount / chal.milestones.length) * 100);

              return (
                <button
                  key={chal.id}
                  onClick={() => setSelectedChallengeId(chal.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-yellow-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{chal.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {progressPct}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Challenge Detail Card */}
          {activeChallenge && (
            <div className="p-6 rounded-[28px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-6">
              {/* Challenge Header & Progress Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-black text-slate-900 dark:text-white">
                      {activeChallenge.title}
                    </h4>
                    {activeChallenge.status === 'completed' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluído!</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeChallenge.description}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDeleteChallenge(activeChallenge.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Excluir este desafio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Poupado</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(activeChallenge.savedAmount, user.currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Meta Final</span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {formatCurrency(activeChallenge.targetTotalAmount, user.currency)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Etapas Marcadas</span>
                  <span className="text-base font-black text-purple-600 dark:text-purple-400">
                    {activeChallenge.milestones.filter(m => m.isCompleted).length} / {activeChallenge.milestones.length}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1C1C1E] border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Faltam Poupar</span>
                  <span className="text-base font-black text-slate-600 dark:text-slate-300">
                    {formatCurrency(Math.max(0, activeChallenge.targetTotalAmount - activeChallenge.savedAmount), user.currency)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Progresso do Desafio</span>
                  <span>
                    {Math.round((activeChallenge.savedAmount / activeChallenge.targetTotalAmount) * 100)}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-emerald-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((activeChallenge.savedAmount / activeChallenge.targetTotalAmount) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Interactive Milestones Grid */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Clique em cada semana/dia para marcar o depósito:</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {activeChallenge.milestones.filter(m => m.isCompleted).length} concluídos
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 pt-1">
                  {activeChallenge.milestones.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleMilestone(activeChallenge.id, m.id)}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none active:scale-90 border ${
                        m.isCompleted
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/30 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200'
                      }`}
                      title={`${m.label}: ${formatCurrency(m.targetAmount, user.currency)} ${m.isCompleted ? '(Concluído)' : '(Pendente)'}`}
                    >
                      <span className="text-[10px] font-bold opacity-80">{m.label.replace('Semana ', 'S').replace('Dia ', 'D')}</span>
                      <span className="text-xs font-black mt-0.5">
                        {m.isCompleted ? '✓' : `R$ ${m.targetAmount}`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Iniciar Novo Desafio */}
      <Modal
        isOpen={isNewChallengeModalOpen}
        onClose={() => setIsNewChallengeModalOpen(false)}
        title="Iniciar Novo Desafio de Economia"
        maxWidth="md"
      >
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Escolha um dos modelos abaixo para adicionar ao seu painel:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHALLENGE_TEMPLATES.map(tpl => (
              <div
                key={tpl.title}
                onClick={() => handleStartTemplate(tpl.type, tpl.multiplier || 1)}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500 bg-slate-50 dark:bg-slate-800/40 hover:bg-purple-50/20 dark:hover:bg-purple-950/20 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
                    {tpl.badge}
                  </span>
                  <Plus className="w-4 h-4 text-purple-500 group-hover:scale-125 transition-transform" />
                </div>
                <h5 className="text-xs font-black text-slate-900 dark:text-white">{tpl.title}</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{tpl.description}</p>
                <div className="pt-1 text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Meta: {formatCurrency(tpl.targetAmount, user.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
