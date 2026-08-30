import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  PieChart as PieIcon,
  TrendingUp,
  ShieldCheck,
  Zap,
  ArrowRight,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency } from '../../utils/formatters';

export const FinancialSkillsPage: React.FC = () => {
  const { metrics } = useFinancial();
  const [activeTool, setActiveTool] = useState<'503020' | 'compound' | 'emergency' | 'debts'>('503020');

  // 1. 50/30/20 State
  const [income50, setIncome50] = useState<number>(metrics.monthlyIncome > 0 ? metrics.monthlyIncome : 5000);

  // 2. Compound Interest State
  const [initialInv, setInitialInv] = useState<number>(1000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [annualRate, setAnnualRate] = useState<number>(12); // 12% a.a. (CDI/Selic médio)
  const [years, setYears] = useState<number>(5);

  // 3. Emergency Fund State
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(metrics.monthlyExpense > 0 ? metrics.monthlyExpense : 3500);
  const [monthsCoverage, setMonthsCoverage] = useState<number>(6);
  const [currentSaved, setCurrentSaved] = useState<number>(metrics.totalBalance > 0 ? metrics.totalBalance : 5000);

  // Compound Interest Calculation
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = years * 12;
  let finalAmount = initialInv;
  let totalDeposited = initialInv;

  for (let m = 1; m <= totalMonths; m++) {
    finalAmount = finalAmount * (1 + monthlyRate) + monthlyContribution;
    totalDeposited += monthlyContribution;
  }
  const totalInterest = Math.max(0, finalAmount - totalDeposited);

  // Emergency Fund Calculation
  const targetEmergency = monthlyExpenses * monthsCoverage;
  const emergencyProgress = Math.min(100, Math.round((currentSaved / targetEmergency) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#007a4d]/40 border border-slate-800 text-white relative overflow-hidden shadow-xl">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Habilidades & Inteligência Financeira
          </div>
          <h2 className="text-2xl font-black tracking-tight">Hub de Skills Financeiras</h2>
          <p className="text-xs text-slate-300">
            Simuladores práticos, calculadoras de patrimônio e metodologias consagradas para acelerar sua independência financeira.
          </p>
        </div>
      </div>

      {/* Tool Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTool('503020')}
          className={'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ' + (
            activeTool === '503020'
              ? 'bg-[#007a4d] border-emerald-500 text-white shadow-lg shadow-[#007a4d]/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          )}
        >
          <PieIcon className="w-5 h-5" />
          <div>
            <p className="font-bold text-xs">Regra 50 / 30 / 20</p>
            <p className="text-[10px] opacity-80">Divisão ideal do orçamento</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTool('compound')}
          className={'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ' + (
            activeTool === 'compound'
              ? 'bg-[#007a4d] border-emerald-500 text-white shadow-lg shadow-[#007a4d]/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          )}
        >
          <TrendingUp className="w-5 h-5" />
          <div>
            <p className="font-bold text-xs">Juros Compostos</p>
            <p className="text-[10px] opacity-80">Projeção de enriquecimento</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTool('emergency')}
          className={'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ' + (
            activeTool === 'emergency'
              ? 'bg-[#007a4d] border-emerald-500 text-white shadow-lg shadow-[#007a4d]/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          )}
        >
          <ShieldCheck className="w-5 h-5" />
          <div>
            <p className="font-bold text-xs">Reserva de Emergência</p>
            <p className="text-[10px] opacity-80">Blindagem contra imprevistos</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTool('debts')}
          className={'p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 ' + (
            activeTool === 'debts'
              ? 'bg-[#007a4d] border-emerald-500 text-white shadow-lg shadow-[#007a4d]/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
          )}
        >
          <Zap className="w-5 h-5" />
          <div>
            <p className="font-bold text-xs">Quitação de Dívidas</p>
            <p className="text-[10px] opacity-80">Bola de Neve vs Avalanche</p>
          </div>
        </button>
      </div>

      {/* 1. Tool: 50/30/20 */}
      {activeTool === '503020' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Sua Renda Líquida Mensal</span>
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Renda Total Mensal (R$)</label>
              <input
                type="number"
                value={income50}
                onChange={e => setIncome50(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-base font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <p className="text-xs text-slate-400">
              A metodologia 50/30/20 separa sua renda em 3 pilares equilibrados para nunca faltar dinheiro no fim do mês.
            </p>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Divisão Recomendada do seu Salário</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">50% • Necessidades</span>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(income50 * 0.5)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Aluguel, contas, alimentação, saúde e transporte.</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">30% • Desejos</span>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(income50 * 0.3)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Lazer, restaurantes, viagens, compras e streaming.</p>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">20% • Metas / Futuro</span>
                <p className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(income50 * 0.2)}</p>
                <p className="text-[11px] text-slate-400 mt-1">Investimentos, reserva de emergência e quitação de dívidas.</p>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden flex">
              <div style={{ width: '50%' }} className="bg-blue-500 h-full" title="50% Necessidades" />
              <div style={{ width: '30%' }} className="bg-amber-500 h-full" title="30% Desejos" />
              <div style={{ width: '20%' }} className="bg-emerald-500 h-full" title="20% Investimentos" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Tool: Compound Interest */}
      {activeTool === 'compound' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Parâmetros do Investimento</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Aporte Inicial (R$)</label>
              <input
                type="number"
                value={initialInv}
                onChange={e => setInitialInv(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Aporte Mensal (R$)</label>
              <input
                type="number"
                value={monthlyContribution}
                onChange={e => setMonthlyContribution(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Taxa Anual (% a.a.)</label>
                <input
                  type="number"
                  value={annualRate}
                  onChange={e => setAnnualRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Período (Anos)</label>
                <input
                  type="number"
                  value={years}
                  onChange={e => setYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Resultado Acumulado em {years} Anos</h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Patrimônio Final</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(finalAmount)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Total bruto acumulado</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-500">Total Investido</span>
                <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(totalDeposited)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Dinheiro do seu bolso</p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Ganhos em Juros</span>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{formatCurrency(totalInterest)}</p>
                <p className="text-[10px] text-slate-400 mt-1">Rendimento gerado pelo dinheiro</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">Rendimento mensal estimado no final do período:</span>
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                {formatCurrency(finalAmount * monthlyRate)} / mês
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tool: Emergency Fund */}
      {activeTool === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Calculadora de Cobertura</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Custo de Vida Mensal (R$)</label>
              <input
                type="number"
                value={monthlyExpenses}
                onChange={e => setMonthlyExpenses(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Meses de Cobertura Desejados</label>
              <select
                value={monthsCoverage}
                onChange={e => setMonthsCoverage(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value={3}>3 Meses (Funcionários Públicos / Renda Estável)</option>
                <option value={6}>6 Meses (Trabalhadores CLT)</option>
                <option value={12}>12 Meses (Autônomos / Empresários)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Saldo Atual Guardado (R$)</label>
              <input
                type="number"
                value={currentSaved}
                onChange={e => setCurrentSaved(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>
          </div>

          <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Status da sua Blindagem Financeira</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Meta Ideal de Reserva</span>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(targetEmergency)}</p>
                <p className="text-[10px] text-slate-400 mt-1">{monthsCoverage} meses x {formatCurrency(monthlyExpenses)}/mês</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-500">Progresso Concluído</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{emergencyProgress}%</p>
                <p className="text-[10px] text-slate-400 mt-1">Faltam {formatCurrency(Math.max(0, targetEmergency - currentSaved))}</p>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                <span>Progresso da Reserva</span>
                <span>{emergencyProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div style={{ width: `${emergencyProgress}%` }} className="bg-emerald-500 h-full rounded-full transition-all duration-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tool: Debt Payoff Strategy */}
      {activeTool === 'debts' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Estratégias de Aceleração de Quitação</h3>
            <p className="text-xs text-slate-400 mt-1">
              Escolha o método ideal para eliminar dívidas com base no seu perfil psicológico e financeiro.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Método Bola de Neve</h4>
              </div>
              <p className="text-xs text-slate-500">
                Pague o valor mínimo em todas as dívidas e coloque todo dinheiro extra na dívida com <strong>menor saldo devedor</strong>.
              </p>
              <div className="p-2.5 rounded-xl bg-blue-100/50 dark:bg-blue-950/50 text-[11px] text-blue-800 dark:text-blue-300 font-semibold">
                🏆 Ideal para motivação rápida e vitórias emocionais imediatas.
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Método Avalanche</h4>
              </div>
              <p className="text-xs text-slate-500">
                Pague o valor mínimo em todas e foque todo recurso extra na dívida com a <strong>maior taxa de juros</strong> (ex: cartão/cheque especial).
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-100/50 dark:bg-emerald-950/50 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                💰 Matematicamente mais eficiente (economiza o máximo de juros pagos).
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
