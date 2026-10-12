import React, { useMemo } from 'react';
import {
  CreditCard,
  Building,
  Wallet,
  PieChart as PieIcon,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
import { Transaction, Account, CreditCard as CreditCardType, UserProfile } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';

interface PaymentMethodsDashboardProps {
  transactions: Transaction[];
  accounts: Account[];
  cards: CreditCardType[];
  user: UserProfile;
  currentMonthPrefix: string;
}

const COLORS = ['#7C4DFF', '#00E676', '#00B0FF', '#FF9100', '#EB5757', '#E040FB'];

export const PaymentMethodsDashboard: React.FC<PaymentMethodsDashboardProps> = ({
  transactions,
  accounts,
  cards,
  user,
  currentMonthPrefix,
}) => {
  // 1. Divisão Macro de Gastos: Cartões vs Contas vs Dinheiro/Outros
  const macroBreakdown = useMemo(() => {
    let creditCardTotal = 0;
    let accountsTotal = 0;
    let cashOrOtherTotal = 0;

    let creditCardCount = 0;
    let accountsCount = 0;
    let cashOrOtherCount = 0;

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.cardId) {
          creditCardTotal += t.amount;
          creditCardCount += 1;
        } else if (t.accountId) {
          accountsTotal += t.amount;
          accountsCount += 1;
        } else {
          cashOrOtherTotal += t.amount;
          cashOrOtherCount += 1;
        }
      });

    const total = creditCardTotal + accountsTotal + cashOrOtherTotal;

    const data = [
      {
        id: 'cards',
        name: 'Cartões de Crédito',
        icon: '💳',
        amount: creditCardTotal,
        count: creditCardCount,
        color: '#7C4DFF',
        percentage: total > 0 ? (creditCardTotal / total) * 100 : 0,
      },
      {
        id: 'accounts',
        name: 'Contas Correntes / Pix / Débito',
        icon: '🏦',
        amount: accountsTotal,
        count: accountsCount,
        color: '#00E676',
        percentage: total > 0 ? (accountsTotal / total) * 100 : 0,
      },
      {
        id: 'cash',
        name: 'Dinheiro / Carteira / Outros',
        icon: '💵',
        amount: cashOrOtherTotal,
        count: cashOrOtherCount,
        color: '#00B0FF',
        percentage: total > 0 ? (cashOrOtherTotal / total) * 100 : 0,
      },
    ].filter(i => i.amount > 0 || i.id !== 'cash');

    return { data, total };
  }, [transactions]);

  // 2. Análise Detalhada por Cartão
  const cardsAnalysis = useMemo(() => {
    return cards.map(c => {
      const cardTxs = transactions.filter(t => t.cardId === c.id && t.type === 'expense');
      const invoiceAmount = cardTxs.reduce((s, t) => s + t.amount, 0);
      const limit = c.limit || 0;
      const limitUsedPct = limit > 0 ? (invoiceAmount / limit) * 100 : 0;
      const available = Math.max(0, limit - invoiceAmount);

      return {
        ...c,
        invoiceAmount,
        transactionsCount: cardTxs.length,
        limitUsedPct,
        available,
        averageTicket: cardTxs.length > 0 ? invoiceAmount / cardTxs.length : 0,
      };
    }).sort((a, b) => b.invoiceAmount - a.invoiceAmount);
  }, [cards, transactions]);

  // 3. Análise Detalhada por Conta Corrente
  const accountsAnalysis = useMemo(() => {
    return accounts.map(a => {
      const accTxs = transactions.filter(t => t.accountId === a.id && t.type === 'expense');
      const spentAmount = accTxs.reduce((s, t) => s + t.amount, 0);

      return {
        ...a,
        spentAmount,
        transactionsCount: accTxs.length,
      };
    }).sort((a, b) => b.spentAmount - a.spentAmount);
  }, [accounts, transactions]);

  return (
    <div className="space-y-6">
      {/* 1. TOPO */}
      <div>
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <span>Distribuição por Meios de Pagamento & Cartões</span>
        </h3>
        <p className="text-xs text-slate-400">
          Entenda a concentração de pagamentos entre crédito, débito/pix e contas bancárias
        </p>
      </div>

      {/* 2. CARD MACRO: COMPOSIÇÃO DOS GASTOS POR MÉTODO */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white">
          Concentração de Gastos
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
          {/* Donut Macro */}
          <div className="sm:col-span-5 h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroBreakdown.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="amount"
                >
                  {macroBreakdown.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Gasto</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatCurrency(macroBreakdown.total, user.currency, !user.showValues)}
              </span>
            </div>
          </div>

          {/* Cards explicativos das 3 modalidades */}
          <div className="sm:col-span-7 space-y-3">
            {macroBreakdown.data.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span>{formatCurrency(item.amount, user.currency, !user.showValues)}</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 ml-1.5 font-bold">
                      ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. RAIO-X DOS CARTÕES DE CRÉDITO */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Faturas e Utilização de Limite por Cartão</span>
          </h4>
          <span className="text-xs text-slate-400 font-bold">
            {cardsAnalysis.length} cartões cadastrados
          </span>
        </div>

        {cardsAnalysis.length === 0 ? (
          <div className="p-6 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Nenhum cartão de crédito cadastrado.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cardsAnalysis.map(c => (
              <div
                key={c.id}
                className="p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 relative overflow-hidden group hover:border-purple-400 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-xs"
                      style={{ backgroundColor: c.color || '#7C4DFF' }}
                    >
                      💳
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.brand ? c.brand.toUpperCase() : 'Cartão'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(c.invoiceAmount, user.currency, !user.showValues)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {c.transactionsCount} compras
                    </div>
                  </div>
                </div>

                {/* Limite do Cartão */}
                {c.limit && c.limit > 0 ? (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>Limite: {formatCurrency(c.limit, user.currency, !user.showValues)}</span>
                      <span
                        className={
                          c.limitUsedPct > 90
                            ? 'text-rose-500'
                            : c.limitUsedPct > 70
                            ? 'text-amber-500'
                            : 'text-emerald-500'
                        }
                      >
                        {c.limitUsedPct.toFixed(0)}% usado
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          c.limitUsedPct > 90
                            ? 'bg-rose-500'
                            : c.limitUsedPct > 70
                            ? 'bg-amber-500'
                            : 'bg-purple-600'
                        }`}
                        style={{ width: `${Math.min(100, c.limitUsedPct)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400">
                    Limite não configurado neste cartão
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. GASTOS DIRETOS EM CONTAS BANCÁRIAS */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Débitos e Gastos por Conta Bancária</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountsAnalysis.map(a => (
            <div
              key={a.id}
              className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: `${a.color || '#10B981'}20`, color: a.color || '#10B981' }}
                  >
                    🏦
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {a.name}
                  </span>
                </div>
                <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(a.spentAmount, user.currency, !user.showValues)}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold pt-1 border-t border-slate-100 dark:border-slate-800/60">
                <span>Saldo atual: {formatCurrency(a.balance, user.currency, !user.showValues)}</span>
                <span>{a.transactionsCount} débitos</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
