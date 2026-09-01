import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  ShieldCheck,
  PieChart as PieIcon,
  ArrowUpRight,
  Trash2,
  Edit2,
  Building2,
  Coins,
  CheckCircle2,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { Modal } from '../ui/Modal';
import { ViewModeToggle, CardViewMode } from '../ui/ViewModeToggle';
import { FilterPopover, FilterState } from '../ui/FilterPopover';
import { InvestmentAsset, InvestmentType } from '../../types';

export const InvestmentsTab: React.FC = () => {
  const { investments, addInvestment, updateInvestment, deleteInvestment, user, metrics } = useFinancial();

  const [viewMode, setViewMode] = useState<CardViewMode>(() => {
    try {
      return (localStorage.getItem('finly_investments_view_mode') as CardViewMode) || 'grid';
    } catch (e) {
      return 'grid';
    }
  });

  const [filters, setFilters] = useState<FilterState>({
    assetType: 'all',
  });

  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<InvestmentAsset | null>(null);

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [type, setType] = useState<InvestmentType>('fixed');
  const [institution, setInstitution] = useState('');
  const [investedAmount, setInvestedAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [monthlyYield, setMonthlyYield] = useState('');

  const typeLabels: Record<InvestmentType, string> = {
    fixed: 'Renda Fixa / Tesouro',
    stocks: 'Ações',
    fiis: 'Fundos Imobiliários',
    crypto: 'Criptomoedas',
    funds: 'Fundos de Investimento',
    other: 'Outros',
  };

  const handleOpenAdd = () => {
    setEditingAsset(null);
    setName('');
    setTicker('');
    setType('fixed');
    setInstitution('');
    setInvestedAmount('');
    setCurrentBalance('');
    setMonthlyYield('');
    setShowModal(true);
  };

  const handleOpenEdit = (asset: InvestmentAsset) => {
    setEditingAsset(asset);
    setName(asset.name);
    setTicker(asset.ticker || '');
    setType(asset.type);
    setInstitution(asset.institution);
    setInvestedAmount(asset.investedAmount.toString());
    setCurrentBalance(asset.currentBalance.toString());
    setMonthlyYield(asset.monthlyYield.toString());
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deleteInvestment(id);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = parseFloat(investedAmount) || 0;
    const cur = parseFloat(currentBalance) || inv;
    const yld = parseFloat(monthlyYield) || 0;
    const pct = inv > 0 ? ((cur - inv) / inv) * 100 : 0;

    if (editingAsset) {
      updateInvestment(editingAsset.id, {
        name,
        ticker: ticker || undefined,
        type,
        institution: institution || 'Corretora',
        investedAmount: inv,
        currentBalance: cur,
        monthlyYield: yld,
        yieldPercentage: pct,
      });
    } else {
      addInvestment({
        name,
        ticker: ticker || undefined,
        type,
        institution: institution || 'Corretora',
        investedAmount: inv,
        currentBalance: cur,
        monthlyYield: yld,
        yieldPercentage: pct,
      });
    }

    setShowModal(false);
  };

  const totalInvested = investments.reduce((sum, i) => sum + i.investedAmount, 0);
  const totalCurrent = investments.reduce((sum, i) => sum + i.currentBalance, 0);
  const totalYield = investments.reduce((sum, i) => sum + i.monthlyYield, 0);
  const overallYieldPct = totalInvested > 0 ? ((totalCurrent - totalInvested) / totalInvested) * 100 : 0;

  const allocationData = Object.entries(
    investments.reduce((acc, i) => {
      const label = typeLabels[i.type] || 'Outros';
      acc[label] = (acc[label] || 0) + i.currentBalance;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value], idx) => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    return { name, value, color: colors[idx % colors.length] };
  });

  const filteredInvestments: InvestmentAsset[] = useMemo(() => {
    return investments.filter(i => {
      if (filters.assetType && filters.assetType !== 'all' && i.type !== filters.assetType) {
        return false;
      }
      return true;
    });
  }, [investments, filters]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Patrimônio Total Investido</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
            {formatCurrency(totalCurrent, user.currency, !user.showValues)}
          </p>
          <span className={`text-[11px] font-bold mt-1 block ${overallYieldPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {overallYieldPct >= 0 ? '+' : ''}{formatPercentage(overallYieldPct)} rendimento acumulado
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Total Aplicado</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
            {formatCurrency(totalInvested, user.currency, !user.showValues)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Custo base de aquisição
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500">Proventos / Rendimentos do Mês</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            +{formatCurrency(totalYield, user.currency, !user.showValues)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium mt-1 block">
            Dividendos, JCP e juros mensais
          </span>
        </div>
      </div>

      {/* Allocation & Asset Distribution Chart */}
      {allocationData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Alocação por Classe de Ativos
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => formatCurrency(Number(value), user.currency)}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-4">Resumo da Carteira</h3>
              <div className="space-y-3">
                {allocationData.map((item) => {
                  const pct = totalCurrent > 0 ? (item.value / totalCurrent) * 100 : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {formatCurrency(item.value, user.currency, !user.showValues)}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleOpenAdd}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar Ativo
            </button>
          </div>
        </div>
      )}

      {/* Assets Table Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Seus Ativos Investidos</h3>
            <p className="text-xs text-slate-400">Acompanhe e gerencie cada ativo individualmente</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <FilterPopover
              filters={filters}
              onFilterChange={setFilters}
              showPeriod={false}
              showUser={false}
              showAccounts={false}
              showCards={false}
              showCategories={false}
              showAssetType={true}
            />

            <ViewModeToggle
              mode={viewMode}
              onChange={(m) => {
                setViewMode(m);
                try { localStorage.setItem('finly_investments_view_mode', m); } catch (e) {}
              }}
            />

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Novo Ativo
            </button>
          </div>
        </div>

        {filteredInvestments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-xl font-bold">
              📈
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Nenhum investimento encontrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {investments.length === 0
                ? 'Comece cadastrando suas aplicações em Renda Fixa, Ações, FIIs ou Cripto para acompanhar seu patrimônio.'
                : 'Nenhum ativo corresponde aos filtros selecionados. Tente ajustar a classe de ativo no filtro.'}
            </p>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all inline-flex items-center gap-1.5 mt-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Cadastrar Primeiro Ativo
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID BLOCKS VIEW (||) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredInvestments.map(i => (
              <div
                key={i.id}
                className="p-5 rounded-2xl bg-slate-50/50 dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{i.name}</h4>
                      {i.ticker && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-mono text-[10px] font-bold">
                          {i.ticker}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold">{typeLabels[i.type] || i.type} • {i.institution}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => handleOpenEdit(i)} className="p-1 text-slate-400 hover:text-purple-600 transition-colors cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(i.id)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Saldo Atual</span>
                    <span className="font-black text-slate-900 dark:text-white text-sm">
                      {formatCurrency(i.currentBalance, user.currency, !user.showValues)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold">Investido</span>
                    <span className="font-bold text-slate-500">
                      {formatCurrency(i.investedAmount, user.currency, !user.showValues)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Rentabilidade</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    +{formatPercentage(i.yieldPercentage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST / TABLE VIEW (=) */
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                  <th className="py-3">Ativo</th>
                  <th className="py-3">Classe</th>
                  <th className="py-3">Instituição</th>
                  <th className="py-3 text-right">Valor Investido</th>
                  <th className="py-3 text-right">Saldo Atual</th>
                  <th className="py-3 text-right">Rentabilidade</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y border-slate-100 dark:border-slate-800/60">
                {filteredInvestments.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{i.name}</span>
                        {i.ticker && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                            {i.ticker}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500">{typeLabels[i.type] || i.type}</td>
                    <td className="py-3.5 text-slate-500">{i.institution}</td>
                    <td className="py-3.5 text-right text-slate-500">{formatCurrency(i.investedAmount, user.currency, !user.showValues)}</td>
                    <td className="py-3.5 text-right font-bold text-slate-800 dark:text-slate-100">{formatCurrency(i.currentBalance, user.currency, !user.showValues)}</td>
                    <td className="py-3.5 text-right font-bold text-emerald-600">
                      +{formatPercentage(i.yieldPercentage)}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(i)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar ativo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(i.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remover ativo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Asset Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAsset ? 'Editar Ativo' : 'Novo Ativo de Investimento'} maxWidth="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Ativo *</label>
            <input
              type="text"
              required
              placeholder="Ex: Tesouro Selic 2029, ITUB4, CDB Inter..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Código / Ticker (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: HGLG11"
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Classe de Ativo</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as InvestmentType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="fixed">Renda Fixa</option>
                <option value="stocks">Ações</option>
                <option value="fiis">Fundos Imobiliários</option>
                <option value="crypto">Criptomoedas</option>
                <option value="funds">Fundos</option>
                <option value="other">Outros</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instituição / Corretora</label>
            <input
              type="text"
              placeholder="Ex: XP, NuInvest, Inter, BTG..."
              value={institution}
              onChange={e => setInstitution(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Valor Investido (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={investedAmount}
                onChange={e => setInvestedAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Saldo Atual (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={currentBalance}
                onChange={e => setCurrentBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all"
            >
              {editingAsset ? 'Salvar Alterações' : 'Salvar Ativo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
