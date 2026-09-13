import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  TrendingUp,
  HeartPulse,
  Sparkles,
  ShoppingBag,
  Home,
  PiggyBank,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { Transaction, Category, CreditCard } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  doesTransactionBelongToMonth,
  isInvoicePaymentTransaction,
  ViewRegime,
} from '../../utils/invoiceCalculator';

interface Health503020ReportProps {
  transactions: Transaction[];
  categories: Category[];
  currentMonth: string; // YYYY-MM
  cards?: CreditCard[];
  viewRegime?: ViewRegime;
  currency?: string;
  isBento?: boolean;
}

type SliceType = 'needs' | 'wants' | 'savings';

// Função de classificação inteligente da categoria para a Regra 50/30/20
function classifyCategory(categoryName: string): SliceType {
  const norm = (categoryName || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Poupança / Investimentos (20%)
  if (
    norm.includes('invest') ||
    norm.includes('poupanca') ||
    norm.includes('reserva') ||
    norm.includes('acao') ||
    norm.includes('cripto') ||
    norm.includes('fii') ||
    norm.includes('cdb') ||
    norm.includes('tesouro') ||
    norm.includes('previdencia') ||
    norm.includes('aporte')
  ) {
    return 'savings';
  }

  // Necessidades Básicas (50%)
  if (
    norm.includes('mora') ||
    norm.includes('aluguel') ||
    norm.includes('condominio') ||
    norm.includes('energia') ||
    norm.includes('luz') ||
    norm.includes('agua') ||
    norm.includes('gas') ||
    norm.includes('supermercado') ||
    norm.includes('mercado') ||
    norm.includes('alimentac') ||
    norm.includes('feir') ||
    norm.includes('transporte') ||
    norm.includes('combustivel') ||
    norm.includes('gasolina') ||
    norm.includes('onibus') ||
    norm.includes('metro') ||
    norm.includes('saude') ||
    norm.includes('farmacia') ||
    norm.includes('remedio') ||
    norm.includes('medico') ||
    norm.includes('dentista') ||
    norm.includes('educac') ||
    norm.includes('escola') ||
    norm.includes('faculdade') ||
    norm.includes('curso') ||
    norm.includes('divida') ||
    norm.includes('financiamento') ||
    norm.includes('imposto') ||
    norm.includes('iptu') ||
    norm.includes('ipva') ||
    norm.includes('seguro')
  ) {
    return 'needs';
  }

  // Desejos e Estilo de Vida (30%)
  return 'wants';
}

export const Health503020Report: React.FC<Health503020ReportProps> = ({
  transactions,
  categories,
  currentMonth,
  cards = [],
  viewRegime = 'invoice_month',
  currency = 'BRL',
  isBento = false,
}) => {
  // Transações do mês selecionado
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => {
      const card = cards.find(c => c.id === t.cardId);
      return doesTransactionBelongToMonth(t, card, currentMonth, viewRegime);
    });
  }, [transactions, currentMonth, cards, viewRegime]);

  // Mapa de categorias
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Cálculos consolidados da Regra 50/30/20
  const metrics = useMemo(() => {
    let totalIncome = 0;
    let needsTotal = 0;
    let wantsTotal = 0;
    let savingsTotal = 0;

    const needsBreakdown: Record<string, number> = {};
    const wantsBreakdown: Record<string, number> = {};
    const savingsBreakdown: Record<string, number> = {};

    monthTransactions.forEach(t => {
      if (t.ignored) return;

      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        // Ignorar pagamento de fatura como despesa para não duplicar com as compras do cartão
        if (isInvoicePaymentTransaction(t)) return;

        const cat = categoryMap.get(t.categoryId);
        const catName = cat ? cat.name : 'Outros';
        const slice = classifyCategory(catName);

        if (slice === 'needs') {
          needsTotal += t.amount;
          needsBreakdown[catName] = (needsBreakdown[catName] || 0) + t.amount;
        } else if (slice === 'wants') {
          wantsTotal += t.amount;
          wantsBreakdown[catName] = (wantsBreakdown[catName] || 0) + t.amount;
        } else {
          savingsTotal += t.amount;
          savingsBreakdown[catName] = (savingsBreakdown[catName] || 0) + t.amount;
        }
      }
    });

    const totalExpenses = needsTotal + wantsTotal + savingsTotal;
    const surplus = Math.max(0, totalIncome - totalExpenses);

    // Na regra 50/30/20, a base recomendada é a Renda Líquida Total.
    // Se não houver receita registrada no mês, usa o total de despesas como base percentual.
    const baseAmount = totalIncome > 0 ? totalIncome : (totalExpenses > 0 ? totalExpenses : 1);

    // O que sobra da renda não consumida em despesas também é considerado Poupança/Reserva
    const effectiveSavingsTotal = savingsTotal + surplus;

    const needsPercent = (needsTotal / baseAmount) * 100;
    const wantsPercent = (wantsTotal / baseAmount) * 100;
    const savingsPercent = (effectiveSavingsTotal / baseAmount) * 100;

    // Taxa de Poupança (Savings Rate)
    const savingsRate = totalIncome > 0 ? ((totalIncome - (needsTotal + wantsTotal)) / totalIncome) * 100 : 0;

    // Diagnóstico de Saúde Financeira
    let score = 100;
    const alerts: string[] = [];

    if (needsPercent > 60) {
      const diff = Math.round(needsPercent - 50);
      score -= Math.min(35, diff * 2);
      alerts.push(`Necessidades básicas consumindo ${needsPercent.toFixed(0)}% da renda (${diff}% acima do ideal de 50%).`);
    } else if (needsPercent > 50) {
      score -= 10;
      alerts.push(`Necessidades ligeiramente acima do teto recomendado de 50%.`);
    }

    if (wantsPercent > 35) {
      const diff = Math.round(wantsPercent - 30);
      score -= Math.min(30, diff * 2);
      alerts.push(`Gastos com estilo de vida e desejos em ${wantsPercent.toFixed(0)}% (teto recomendado: 30%).`);
    }

    if (savingsRate < 10) {
      score -= 25;
      alerts.push(`Taxa de poupança crítica (${savingsRate.toFixed(0)}%). O ideal é poupar e investir ao menos 20%.`);
    } else if (savingsRate < 20) {
      score -= 10;
      alerts.push(`Poupança atual em ${savingsRate.toFixed(0)}%, abaixo da meta de 20%.`);
    }

    score = Math.max(10, Math.min(100, Math.round(score)));

    let statusLabel = 'Excelente';
    let statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    let StatusIcon = Award;

    if (score < 50) {
      statusLabel = 'Atenção Crítica';
      statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      StatusIcon = AlertTriangle;
    } else if (score < 75) {
      statusLabel = 'Equilíbrio Moderado';
      statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      StatusIcon = ShieldAlert;
    }

    return {
      totalIncome,
      totalExpenses,
      needsTotal,
      wantsTotal,
      savingsTotal: effectiveSavingsTotal,
      needsPercent,
      wantsPercent,
      savingsPercent,
      savingsRate,
      score,
      statusLabel,
      statusColor,
      StatusIcon,
      alerts,
      needsBreakdown,
      wantsBreakdown,
      savingsBreakdown,
    };
  }, [monthTransactions, categoryMap]);

  // Dados para o Gráfico Donut de 3 Fatias
  const donutData = useMemo(() => {
    return [
      { name: 'Necessidades (50%)', value: metrics.needsTotal, color: '#3b82f6', target: 50, actual: metrics.needsPercent },
      { name: 'Desejos (30%)', value: metrics.wantsTotal, color: '#ec4899', target: 30, actual: metrics.wantsPercent },
      { name: 'Poupança / Invest. (20%)', value: metrics.savingsTotal, color: '#10b981', target: 20, actual: metrics.savingsPercent },
    ];
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* Banner de Diagnóstico e Score de Saúde */}
      <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/15 to-emerald-900/15 border border-indigo-500/20 rounded-3xl p-5 sm:p-6 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                  Diagnóstico da Regra 50 / 30 / 20
                </h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${metrics.statusColor} flex items-center gap-1`}>
                  <metrics.StatusIcon className="w-3.5 h-3.5" />
                  {metrics.statusLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                Metodologia mundial de planejamento: destine até 50% para necessidades vitais, 30% para estilo de vida e ao menos 20% para poupança e liberdade financeira.
              </p>
            </div>
          </div>

          {/* Pontuação Geral / Score */}
          <div className="bg-white/80 dark:bg-[#1A1A1E]/80 border border-gray-100 dark:border-white/10 rounded-2xl px-5 py-3 text-center sm:text-right shrink-0">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
              Score Financeiro
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">
              {metrics.score} <span className="text-xs text-gray-400 font-normal">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Termômetros das Fatias (50 / 30 / 20) */}
      <div className={`grid ${isBento ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
        {/* Necessidades (50%) */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Necessidades</h4>
                <span className="text-[11px] text-gray-400">Meta: até 50%</span>
              </div>
            </div>
            <span className={`text-base font-bold ${metrics.needsPercent <= 50 ? 'text-blue-500' : 'text-amber-500'}`}>
              {metrics.needsPercent.toFixed(1)}%
            </span>
          </div>

          <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(metrics.needsTotal, currency)}
          </div>

          {/* Barra de Progresso / Termômetro */}
          <div className="w-full bg-gray-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.needsPercent <= 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, metrics.needsPercent * 1.5)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Moradia, alimentação, contas de consumo, saúde e transporte.
          </p>
        </div>

        {/* Desejos (30%) */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-500 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Desejos & Lazer</h4>
                <span className="text-[11px] text-gray-400">Meta: até 30%</span>
              </div>
            </div>
            <span className={`text-base font-bold ${metrics.wantsPercent <= 30 ? 'text-pink-500' : 'text-rose-500'}`}>
              {metrics.wantsPercent.toFixed(1)}%
            </span>
          </div>

          <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(metrics.wantsTotal, currency)}
          </div>

          <div className="w-full bg-gray-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.wantsPercent <= 30 ? 'bg-pink-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, metrics.wantsPercent * 2.5)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Restaurantes, viagens, assinaturas, compras e hobbies.
          </p>
        </div>

        {/* Poupança e Investimentos (20%) */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Investimentos</h4>
                <span className="text-[11px] text-gray-400">Meta: ao menos 20%</span>
              </div>
            </div>
            <span className={`text-base font-bold ${metrics.savingsPercent >= 20 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {metrics.savingsPercent.toFixed(1)}%
            </span>
          </div>

          <div className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(metrics.savingsTotal, currency)}
          </div>

          <div className="w-full bg-gray-100 dark:bg-white/10 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                metrics.savingsPercent >= 20 ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${Math.min(100, metrics.savingsPercent * 3.5)}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400">
            Aportes, reservas de emergência e sobras de fluxo de caixa.
          </p>
        </div>
      </div>

      {/* Gráfico Donut de Proporção Real vs Ideal + Recomendações Práticas */}
      <div className={`grid ${isBento ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
        {/* Gráfico Donut 50/30/20 */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            Distribuição Real da Renda
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Visualização consolidada das três principais fatias de patrimônio e consumo
          </p>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  formatter={(value: any, name: any) => [formatCurrency(Number(value), currency), name]}
                  contentStyle={{
                    backgroundColor: '#1E1E24',
                    borderColor: '#374151',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={4}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Poupança Real</span>
              <span className="text-xl font-extrabold text-emerald-500">
                {metrics.savingsRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-700 dark:text-gray-300">Necessidades (50%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              <span className="text-gray-700 dark:text-gray-300">Desejos (30%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-gray-700 dark:text-gray-300">Poupança (20%)</span>
            </div>
          </div>
        </div>

        {/* Diagnóstico & Recomendações Acionáveis */}
        <div className="bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Diagnóstico de Alavancagem
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Insights calculados com base no padrão de gastos deste mês
            </p>

            <div className="space-y-3">
              {metrics.alerts.length > 0 ? (
                metrics.alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{alert}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    Parabéns! Sua alocação de despesas está em perfeito equilíbrio dentro dos parâmetros da regra 50/30/20.
                  </span>
                </div>
              )}

              {/* Taxa de Poupança Acionável */}
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-200">
                    Taxa Líquida de Poupança
                  </span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {metrics.savingsRate.toFixed(1)}%
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  De cada R$ 100 que entram na sua conta, você retém <strong>R$ {Math.max(0, metrics.savingsRate).toFixed(2)}</strong> para construção de patrimônio.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span>Renda Base Apurada:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(metrics.totalIncome, currency)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
