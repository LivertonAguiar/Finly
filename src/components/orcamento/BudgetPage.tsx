import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Sparkles,
  RotateCcw,
  DollarSign,
  ArrowRight,
  Copy,
  Info,
  CreditCard,
  Calendar,
  AlertCircle,
  Percent,
  Layers,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency } from '../../utils/formatters';
import { resolveCategory } from '../../utils/categoryResolver';
import { Modal } from '../ui/Modal';

export const BudgetPage: React.FC = () => {
  const { categories, budgets, setCategoryBudget, transactions, user } = useFinancial();

  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);
  const [selectedMatrixYear, setSelectedMatrixYear] = useState<number>(new Date().getFullYear());
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [showIncomesInMatrix, setShowIncomesInMatrix] = useState(true);
  const [showExpensesInMatrix, setShowExpensesInMatrix] = useState(true);

  // Wizard state for "Criação do Planejamento Mensal"
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [monthlyIncomeInput, setMonthlyIncomeInput] = useState('5000');
  const [savingsRateInput, setSavingsRateInput] = useState('20');
  const [cardRule, setCardRule] = useState<'transactionDate' | 'invoiceDate'>('transactionDate');
  const [customCatBudgets, setCustomCatBudgets] = useState<Record<string, string>>({});

  // Category Edit Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [categoryBudgetLimit, setCategoryBudgetLimit] = useState('');

  // Copy Alert
  const [copySuccessAlert, setCopySuccessAlert] = useState(false);

  // Month navigation
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  // Previous month prefix for benchmark / copying
  const prevDate = useMemo(() => {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    return d;
  }, [viewDate]);
  const prevMonthPrefix = prevDate.toISOString().substring(0, 7);
  const prevMonthName = prevDate.toLocaleDateString('pt-BR', { month: 'short' });

  // 12 Months for the Matrix View
  const matrixMonths = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((name, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const prefix = `${selectedMatrixYear}-${monthNum}`;
      return { name, monthNum, prefix };
    });
  }, [selectedMatrixYear]);

  // Income categories
  const incomeCategories = useMemo(() => {
    return categories.filter(c => c.type === 'income');
  }, [categories]);

  // Filtered expense categories
  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense');
  }, [categories]);

  // Robust category lookup
  const findCategory = (catId?: string, subId?: string) => {
    return resolveCategory(categories, catId, subId, 'expense');
  };

  // Matrix Calculations (MGO Style: Plan vs Real vs Dif across 12 months)
  const matrixData = useMemo(() => {
    // 1. Incomes by Category per Month
    const incomes = incomeCategories.map(cat => {
      const monthlyValues = matrixMonths.map(m => {
        const spent = transactions
          .filter(t => t.type === 'income' && t.date.startsWith(m.prefix) && !t.ignored)
          .filter(t => {
            const found = resolveCategory(categories, t.categoryId, t.subcategoryId, 'income');
            return found ? found.id === cat.id : t.categoryId === cat.id;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const b = budgets.find(bg => bg.categoryId === cat.id && (bg.month === m.prefix || !bg.month));
        const plan = b ? b.limit : 0;
        const dif = spent - plan;
        return { plan, real: spent, dif };
      });

      // Subcategories if any
      const subcategories = (cat.subcategories || []).map(sub => {
        const subMonthlyValues = matrixMonths.map(m => {
          const spent = transactions
            .filter(t => t.type === 'income' && t.date.startsWith(m.prefix) && !t.ignored)
            .filter(t => t.subcategoryId === sub.id)
            .reduce((sum, t) => sum + t.amount, 0);
          return { plan: 0, real: spent, dif: spent };
        });
        return { id: sub.id, name: sub.name, icon: sub.icon || '🏷️', monthlyValues: subMonthlyValues };
      });

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '💰',
        color: cat.color || '#66bb6a',
        monthlyValues,
        subcategories,
      };
    });

    // 2. Expenses by Category per Month
    const expenses = expenseCategories.map(cat => {
      const monthlyValues = matrixMonths.map(m => {
        const spent = transactions
          .filter(t => t.type === 'expense' && t.date.startsWith(m.prefix) && !t.ignored)
          .filter(t => {
            const found = resolveCategory(categories, t.categoryId, t.subcategoryId, 'expense');
            return found ? found.id === cat.id : t.categoryId === cat.id;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const b = budgets.find(bg => bg.categoryId === cat.id && (bg.month === m.prefix || !bg.month));
        const plan = b ? b.limit : 0;
        const dif = plan - spent; // Positive = economy, Negative = overbudget
        return { plan, real: spent, dif };
      });

      // Subcategories if any
      const subcategories = (cat.subcategories || []).map(sub => {
        const subMonthlyValues = matrixMonths.map(m => {
          const spent = transactions
            .filter(t => t.type === 'expense' && t.date.startsWith(m.prefix) && !t.ignored)
            .filter(t => t.subcategoryId === sub.id)
            .reduce((sum, t) => sum + t.amount, 0);
          return { plan: 0, real: spent, dif: -spent };
        });
        return { id: sub.id, name: sub.name, icon: sub.icon || '🏷️', monthlyValues: subMonthlyValues };
      });

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '💸',
        color: cat.color || '#ef5350',
        monthlyValues,
        subcategories,
      };
    });

    // Totals per month
    const totalIncomes = matrixMonths.map((m, idx) => {
      const plan = incomes.reduce((sum, c) => sum + c.monthlyValues[idx].plan, 0);
      const real = incomes.reduce((sum, c) => sum + c.monthlyValues[idx].real, 0);
      return { plan, real, dif: real - plan };
    });

    const totalExpenses = matrixMonths.map((m, idx) => {
      const plan = expenses.reduce((sum, c) => sum + c.monthlyValues[idx].plan, 0);
      const real = expenses.reduce((sum, c) => sum + c.monthlyValues[idx].real, 0);
      return { plan, real, dif: plan - real };
    });

    const netBalance = matrixMonths.map((m, idx) => {
      const plan = totalIncomes[idx].plan - totalExpenses[idx].plan;
      const real = totalIncomes[idx].real - totalExpenses[idx].real;
      return { plan, real, dif: real - plan };
    });

    return {
      incomes,
      expenses,
      totalIncomes,
      totalExpenses,
      netBalance,
    };
  }, [incomeCategories, expenseCategories, matrixMonths, transactions, categories, budgets]);

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategoryIds(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleToggleAllExpand = () => {
    const nextState = !isAllExpanded;
    setIsAllExpanded(nextState);
    const newMap: Record<string, boolean> = {};
    [...incomeCategories, ...expenseCategories].forEach(c => {
      newMap[c.id] = nextState;
    });
    setExpandedCategoryIds(newMap);
  };

  const handleExportCSV = () => {
    const headers = ['Tipo', 'Categoria', 'Subcategoria'];
    matrixMonths.forEach(m => {
      headers.push(`${m.name} Plan`, `${m.name} Real`, `${m.name} Dif`);
    });

    const rows: string[][] = [headers];

    // Incomes
    matrixData.incomes.forEach(inc => {
      const row = ['Receita', inc.name, ''];
      inc.monthlyValues.forEach(v => {
        row.push(v.plan.toFixed(2), v.real.toFixed(2), v.dif.toFixed(2));
      });
      rows.push(row);

      inc.subcategories.forEach(sub => {
        const subRow = ['Receita', inc.name, sub.name];
        sub.monthlyValues.forEach(v => {
          subRow.push(v.plan.toFixed(2), v.real.toFixed(2), v.dif.toFixed(2));
        });
        rows.push(subRow);
      });
    });

    // Expenses
    matrixData.expenses.forEach(exp => {
      const row = ['Despesa', exp.name, ''];
      exp.monthlyValues.forEach(v => {
        row.push(v.plan.toFixed(2), v.real.toFixed(2), v.dif.toFixed(2));
      });
      rows.push(row);

      exp.subcategories.forEach(sub => {
        const subRow = ['Despesa', exp.name, sub.name];
        sub.monthlyValues.forEach(v => {
          subRow.push(v.plan.toFixed(2), v.real.toFixed(2), v.dif.toFixed(2));
        });
        rows.push(subRow);
      });
    });

    // CSV format
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(val => `"${val}"`).join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `matriz_orcamento_${selectedMatrixYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthPrefix));
  }, [transactions, currentMonthPrefix]);

  const monthlyIncomesTotal = useMemo(() => {
    return monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || parseFloat(monthlyIncomeInput) || 5000;
  }, [monthTransactions, monthlyIncomeInput]);

  // Spending and budget per category
  const categoryBudgetData = useMemo(() => {
    return expenseCategories.map(cat => {
      const spent = monthTransactions
        .filter(t => t.type === 'expense')
        .filter(t => {
          const found = findCategory(t.categoryId, t.subcategoryId);
          return found ? found.id === cat.id : t.categoryId === cat.id;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      // Previous month benchmark
      const prevSpent = transactions
        .filter(t => t.type === 'expense' && t.date.startsWith(prevMonthPrefix))
        .filter(t => {
          const found = findCategory(t.categoryId, t.subcategoryId);
          return found ? found.id === cat.id : t.categoryId === cat.id;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const b = budgets.find(bg => bg.categoryId === cat.id && bg.month === currentMonthPrefix);
      const limit = b ? b.limit : 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      const remaining = Math.max(0, limit - spent);
      const exceeded = spent > limit && limit > 0;

      let statusColor = '#00a884'; // Green (< 80%)
      let statusLabel = 'Normal';
      if (percentage >= 100) {
        statusColor = '#ef5350'; // Red
        statusLabel = 'Estourado';
      } else if (percentage >= 80) {
        statusColor = '#ff9800'; // Orange
        statusLabel = 'Atenção';
      }

      return {
        cat,
        spent,
        prevSpent,
        limit,
        percentage,
        remaining,
        exceeded,
        statusColor,
        statusLabel,
      };
    });
  }, [expenseCategories, budgets, monthTransactions, transactions, currentMonthPrefix, prevMonthPrefix, categories]);

  // 4 Top KPIs for Planning
  const totalBudgetLimit = useMemo(() => {
    return categoryBudgetData.reduce((sum, c) => sum + c.limit, 0);
  }, [categoryBudgetData]);

  const totalSpentInBudgets = useMemo(() => {
    return categoryBudgetData.reduce((sum, c) => sum + c.spent, 0);
  }, [categoryBudgetData]);

  const totalRemainingBudget = Math.max(0, totalBudgetLimit - totalSpentInBudgets);
  const plannedBalance = monthlyIncomesTotal - totalBudgetLimit;
  const plannedSavingsRate = monthlyIncomesTotal > 0 ? (plannedBalance / monthlyIncomesTotal) * 100 : 0;
  const overallPercentage = totalBudgetLimit > 0 ? (totalSpentInBudgets / totalBudgetLimit) * 100 : 0;

  // Wizard Calculations
  const wizardIncome = parseFloat(monthlyIncomeInput) || 0;
  const wizardRate = parseFloat(savingsRateInput) || 0;
  const wizardPlannedExpenses = wizardIncome * (1 - wizardRate / 100);
  const wizardPlannedSavings = wizardIncome * (wizardRate / 100);

  // Initialize custom budgets in wizard step 3
  const handleOpenWizard = () => {
    const initialMap: Record<string, string> = {};
    const avg = expenseCategories.length > 0 ? Math.round(wizardPlannedExpenses / expenseCategories.length) : 0;
    expenseCategories.forEach(c => {
      const existing = budgets.find(b => b.categoryId === c.id && b.month === currentMonthPrefix);
      initialMap[c.id] = existing ? existing.limit.toString() : avg.toString();
    });
    setCustomCatBudgets(initialMap);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const totalCustomAllocated = useMemo(() => {
    return Object.values(customCatBudgets).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [customCatBudgets]);

  const unallocatedDifference = wizardPlannedExpenses - totalCustomAllocated;

  const handleFinishWizard = () => {
    Object.entries(customCatBudgets).forEach(([catId, val]) => {
      const limitNum = parseFloat(val) || 0;
      setCategoryBudget(catId, limitNum, currentMonthPrefix);
    });
    setIsWizardOpen(false);
  };

  const handleCopyPreviousMonth = () => {
    let copiedCount = 0;
    expenseCategories.forEach(cat => {
      const prev = budgets.find(b => b.categoryId === cat.id && b.month === prevMonthPrefix);
      if (prev && prev.limit > 0) {
        setCategoryBudget(cat.id, prev.limit, currentMonthPrefix);
        copiedCount++;
      }
    });

    setCopySuccessAlert(true);
    setTimeout(() => setCopySuccessAlert(false), 3000);
  };

  return (
    <div className={`mx-auto space-y-6 animate-in fade-in pb-16 ${viewMode === 'matrix' ? 'max-w-7xl' : 'max-w-4xl'}`}>
      {/* 0. VIEW MODE SWITCHER (VISÃO MENSAL VS MATRIZ ANUAL) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#18181B] p-3 rounded-[24px] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-[#222226] border border-slate-200/60 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'cards'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Visão Mensal</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              viewMode === 'matrix'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Matriz Anual (Jan - Dez)</span>
          </button>
        </div>

        {viewMode === 'matrix' ? (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#222226] border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-800 dark:text-slate-200">
              <button
                onClick={() => setSelectedMatrixYear(prev => prev - 1)}
                className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-black px-1">{selectedMatrixYear}</span>
              <button
                onClick={() => setSelectedMatrixYear(prev => prev + 1)}
                className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Expand / Collapse All */}
            <button
              onClick={handleToggleAllExpand}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#222226] border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-purple-500 shadow-2xs cursor-pointer"
            >
              {isAllExpanded ? <Minimize2 className="w-3.5 h-3.5 text-purple-600" /> : <Maximize2 className="w-3.5 h-3.5 text-purple-600" />}
              <span>{isAllExpanded ? 'Recolher Tudo' : 'Expandir Tudo'}</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy Previous Month CTA */}
            <button
              onClick={handleCopyPreviousMonth}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#222226] border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-purple-500 shadow-2xs cursor-pointer"
              title="Copiar orçamentos do mês anterior"
            >
              <Copy className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Copiar Mês Anterior</span>
            </button>

            {/* Create / Redefine Wizard CTA */}
            <button
              onClick={handleOpenWizard}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{totalBudgetLimit > 0 ? 'Redefinir Planejamento' : 'Criar Planejamento'}</span>
            </button>
          </div>
        )}
      </div>

      {viewMode === 'matrix' ? (
        /* ========================================================================= */
        /* MATRIZ ANUAL (JAN A DEZ) - MGO STYLE FULL YEAR ORÇAMENTO / REALIZADO / DIF */
        /* ========================================================================= */
        <div className="space-y-4">
          <div className="p-6 rounded-[28px] bg-white dark:bg-[#18181B] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📊</span> Matriz Anual de Orçamento ({selectedMatrixYear})
                </h3>
                <p className="text-xs text-slate-400">
                  Comparativo de Planejado (PLAN.), Realizado (REAL.) e Diferença (DIF.) mês a mês
                </p>
              </div>
            </div>

            {/* Matrix Data Table */}
            <div className="overflow-x-auto scrollbar-thin pb-3 -mx-6 px-6">
              <table className="w-full border-collapse text-xs select-none">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E1E22]">
                    <th className="sticky left-0 z-30 bg-slate-100 dark:bg-[#1E1E22] p-3 text-left font-black text-slate-800 dark:text-slate-200 min-w-[240px] max-w-[280px] border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]">
                      Categoria / Subcategoria
                    </th>
                    {matrixMonths.map(m => (
                      <th
                        key={m.prefix}
                        colSpan={3}
                        className="p-2.5 text-center font-black text-slate-700 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 min-w-[270px] whitespace-nowrap"
                      >
                        {m.name}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-[#18181C]">
                    <th className="sticky left-0 z-30 bg-slate-200/90 dark:bg-[#18181C] p-2 text-left font-extrabold text-slate-500 dark:text-slate-400 border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)]">
                      Detalhamento
                    </th>
                    {matrixMonths.map(m => (
                      <React.Fragment key={`sub-${m.prefix}`}>
                        <th className="p-1.5 text-right font-bold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 min-w-[90px] whitespace-nowrap">
                          Plan.
                        </th>
                        <th className="p-1.5 text-right font-bold text-slate-500 dark:text-slate-400 min-w-[90px] whitespace-nowrap">
                          Real.
                        </th>
                        <th className="p-1.5 text-right font-bold text-slate-500 dark:text-slate-400 min-w-[90px] whitespace-nowrap">
                          Dif.
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {/* ======================================= */}
                  {/* SEÇÃO 1: ENTRADAS / RECEITAS            */}
                  {/* ======================================= */}
                  <tr
                    onClick={() => setShowIncomesInMatrix(prev => !prev)}
                    className="bg-[#E8F8F0] dark:bg-[#132A1E] font-black cursor-pointer hover:bg-emerald-100/80 dark:hover:bg-[#183425] transition-colors"
                  >
                    <td className="sticky left-0 z-20 bg-[#E8F8F0] dark:bg-[#132A1E] p-3 text-emerald-800 dark:text-emerald-400 flex items-center gap-2 border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                      {showIncomesInMatrix ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      <span className="truncate">💰 ENTRADAS (RECEITAS)</span>
                    </td>
                    {matrixData.totalIncomes.map((tot, idx) => (
                      <React.Fragment key={`tot-inc-${idx}`}>
                        <td className="p-2.5 text-right text-slate-600 dark:text-slate-400 font-bold border-l border-emerald-200/60 dark:border-emerald-900/40 min-w-[90px] whitespace-nowrap tabular-nums">
                          {formatCurrency(tot.plan, user.currency, !user.showValues)}
                        </td>
                        <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-black min-w-[90px] whitespace-nowrap tabular-nums">
                          {formatCurrency(tot.real, user.currency, !user.showValues)}
                        </td>
                        <td className={`p-2.5 text-right font-black min-w-[90px] whitespace-nowrap tabular-nums ${tot.dif >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(tot.dif, user.currency, !user.showValues)}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>

                  {showIncomesInMatrix &&
                    matrixData.incomes.map(cat => {
                      const isExpanded = expandedCategoryIds[cat.id];
                      const hasSubs = cat.subcategories.length > 0;

                      return (
                        <React.Fragment key={cat.id}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="sticky left-0 z-20 bg-white dark:bg-[#18181B] p-2.5 flex items-center justify-between border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <span className="shrink-0">{cat.icon}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cat.name}</span>
                              </div>
                              {hasSubs && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategoryExpand(cat.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer shrink-0 ml-1"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </td>
                            {cat.monthlyValues.map((v, idx) => (
                              <React.Fragment key={`inc-${cat.id}-${idx}`}>
                                <td className="p-2 text-right text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800/60 min-w-[90px] whitespace-nowrap tabular-nums font-semibold">
                                  {formatCurrency(v.plan, user.currency, !user.showValues)}
                                </td>
                                <td className="p-2 text-right text-slate-800 dark:text-slate-200 font-black min-w-[90px] whitespace-nowrap tabular-nums">
                                  {formatCurrency(v.real, user.currency, !user.showValues)}
                                </td>
                                <td className={`p-2 text-right font-bold min-w-[90px] whitespace-nowrap tabular-nums ${v.dif >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                                  {formatCurrency(v.dif, user.currency, !user.showValues)}
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>

                          {/* Child Subcategories */}
                          {isExpanded &&
                            cat.subcategories.map(sub => (
                              <tr key={sub.id} className="bg-slate-50/60 dark:bg-[#1C1C20] text-[11px]">
                                <td className="sticky left-0 z-20 bg-slate-50 dark:bg-[#1C1C20] pl-8 p-2 text-slate-500 dark:text-slate-400 truncate border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                                  ↳ {sub.name}
                                </td>
                                {sub.monthlyValues.map((sv, sIdx) => (
                                  <React.Fragment key={`sub-val-${sub.id}-${sIdx}`}>
                                    <td className="p-1.5 text-right text-slate-400 border-l border-slate-100 dark:border-slate-800/60 min-w-[90px] whitespace-nowrap tabular-nums">-</td>
                                    <td className="p-1.5 text-right text-slate-600 dark:text-slate-300 font-bold min-w-[90px] whitespace-nowrap tabular-nums">
                                      {formatCurrency(sv.real, user.currency, !user.showValues)}
                                    </td>
                                    <td className="p-1.5 text-right text-slate-400 min-w-[90px] whitespace-nowrap tabular-nums">-</td>
                                  </React.Fragment>
                                ))}
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}

                  {/* ======================================= */}
                  {/* SEÇÃO 2: SAÍDAS / DESPESAS              */}
                  {/* ======================================= */}
                  <tr
                    onClick={() => setShowExpensesInMatrix(prev => !prev)}
                    className="bg-[#FDECEE] dark:bg-[#2B1418] font-black cursor-pointer hover:bg-rose-100/80 dark:hover:bg-[#34181D] transition-colors"
                  >
                    <td className="sticky left-0 z-20 bg-[#FDECEE] dark:bg-[#2B1418] p-3 text-rose-800 dark:text-rose-400 flex items-center gap-2 border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                      {showExpensesInMatrix ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                      <span className="truncate">💸 SAÍDAS (DESPESAS)</span>
                    </td>
                    {matrixData.totalExpenses.map((tot, idx) => (
                      <React.Fragment key={`tot-exp-${idx}`}>
                        <td className="p-2.5 text-right text-slate-600 dark:text-slate-400 font-bold border-l border-rose-200/60 dark:border-rose-900/40 min-w-[90px] whitespace-nowrap tabular-nums">
                          {formatCurrency(tot.plan, user.currency, !user.showValues)}
                        </td>
                        <td className="p-2.5 text-right text-[#ef5350] font-black min-w-[90px] whitespace-nowrap tabular-nums">
                          {formatCurrency(tot.real, user.currency, !user.showValues)}
                        </td>
                        <td className={`p-2.5 text-right font-black min-w-[90px] whitespace-nowrap tabular-nums ${tot.dif >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(tot.dif, user.currency, !user.showValues)}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>

                  {showExpensesInMatrix &&
                    matrixData.expenses.map(cat => {
                      const isExpanded = expandedCategoryIds[cat.id];
                      const hasSubs = cat.subcategories.length > 0;

                      return (
                        <React.Fragment key={cat.id}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="sticky left-0 z-20 bg-white dark:bg-[#18181B] p-2.5 flex items-center justify-between border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <span className="shrink-0">{cat.icon}</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{cat.name}</span>
                              </div>
                              {hasSubs && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategoryExpand(cat.id);
                                  }}
                                  className="p-1 text-slate-400 hover:text-purple-600 cursor-pointer shrink-0 ml-1"
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </td>
                            {cat.monthlyValues.map((v, idx) => (
                              <React.Fragment key={`exp-${cat.id}-${idx}`}>
                                <td className="p-2 text-right text-slate-500 dark:text-slate-400 border-l border-slate-100 dark:border-slate-800/60 min-w-[90px] whitespace-nowrap tabular-nums font-semibold">
                                  {formatCurrency(v.plan, user.currency, !user.showValues)}
                                </td>
                                <td className="p-2 text-right text-slate-800 dark:text-slate-200 font-black min-w-[90px] whitespace-nowrap tabular-nums">
                                  {formatCurrency(v.real, user.currency, !user.showValues)}
                                </td>
                                <td className={`p-2 text-right font-bold min-w-[90px] whitespace-nowrap tabular-nums ${v.dif >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                  {formatCurrency(v.dif, user.currency, !user.showValues)}
                                </td>
                              </React.Fragment>
                            ))}
                          </tr>

                          {/* Child Subcategories */}
                          {isExpanded &&
                            cat.subcategories.map(sub => (
                              <tr key={sub.id} className="bg-slate-50/60 dark:bg-[#1C1C20] text-[11px]">
                                <td className="sticky left-0 z-20 bg-slate-50 dark:bg-[#1C1C20] pl-8 p-2 text-slate-500 dark:text-slate-400 truncate border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                                  ↳ {sub.name}
                                </td>
                                {sub.monthlyValues.map((sv, sIdx) => (
                                  <React.Fragment key={`sub-val-exp-${sub.id}-${sIdx}`}>
                                    <td className="p-1.5 text-right text-slate-400 border-l border-slate-100 dark:border-slate-800/60 min-w-[90px] whitespace-nowrap tabular-nums">-</td>
                                    <td className="p-1.5 text-right text-slate-600 dark:text-slate-300 font-bold min-w-[90px] whitespace-nowrap tabular-nums">
                                      {formatCurrency(sv.real, user.currency, !user.showValues)}
                                    </td>
                                    <td className="p-1.5 text-right text-slate-400 min-w-[90px] whitespace-nowrap tabular-nums">-</td>
                                  </React.Fragment>
                                ))}
                              </tr>
                            ))}
                        </React.Fragment>
                      );
                    })}

                  {/* ======================================= */}
                  {/* SEÇÃO 3: RESULTADO LÍQUIDO DO MÊS       */}
                  {/* ======================================= */}
                  <tr className="bg-[#F3E8FF] dark:bg-[#241333] font-black text-xs border-t-2 border-purple-300 dark:border-purple-800">
                    <td className="sticky left-0 z-20 bg-[#F3E8FF] dark:bg-[#241333] p-3 text-purple-900 dark:text-purple-300 border-r-2 border-slate-200 dark:border-slate-800 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)] dark:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.5)] min-w-[240px] max-w-[280px]">
                      🎯 RESULTADO LÍQUIDO
                    </td>
                    {matrixData.netBalance.map((net, idx) => (
                      <React.Fragment key={`net-${idx}`}>
                        <td className="p-2.5 text-right text-slate-700 dark:text-slate-300 font-black border-l border-purple-200 dark:border-purple-900 min-w-[90px] whitespace-nowrap tabular-nums">
                          {formatCurrency(net.plan, user.currency, !user.showValues)}
                        </td>
                        <td className={`p-2.5 text-right font-black min-w-[90px] whitespace-nowrap tabular-nums ${net.real >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(net.real, user.currency, !user.showValues)}
                        </td>
                        <td className={`p-2.5 text-right font-black min-w-[90px] whitespace-nowrap tabular-nums ${net.dif >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrency(net.dif, user.currency, !user.showValues)}
                        </td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VISÃO MENSAL (DETALHADA POR CARDS & KPIS)                                 */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* 1. TOP HEADER & MONTH NAVIGATOR */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedMonthOffset(prev => prev - 1)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest px-3 py-1.5 rounded-full bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-800 shadow-xs">
                {capitalizedMonth} {yearNum}
              </span>
              <button
                onClick={() => setSelectedMonthOffset(prev => prev + 1)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {copySuccessAlert && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 text-xs font-bold text-center animate-in fade-in">
              ✓ Orçamentos copiados de {prevMonthName} para {capitalizedMonth} com sucesso!
            </div>
          )}

          {/* 2. 4 TOP SUMMARY KPIS (MOBILLS ORÇAMENTOS SPEC) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* KPI 1: Receitas do mês */}
            <div className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#66bb6a] shrink-0 shadow-xs" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Receitas do mês</span>
              </div>
              <p className="text-base font-black text-[#66bb6a] tracking-tight">
                {formatCurrency(monthlyIncomesTotal, user.currency, !user.showValues)}
              </p>
            </div>

            {/* KPI 2: Gastos planejados */}
            <div className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef5350] shrink-0 shadow-xs" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Gastos planejados</span>
              </div>
              <p className="text-base font-black text-[#ef5350] tracking-tight">
                {formatCurrency(totalBudgetLimit, user.currency, !user.showValues)}
              </p>
            </div>

            {/* KPI 3: Balanço planejado */}
            <div className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#42a5f5] shrink-0 shadow-xs" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Balanço planejado</span>
              </div>
              <p className={`text-base font-black tracking-tight ${plannedBalance >= 0 ? 'text-[#42a5f5]' : 'text-[#ef5350]'}`}>
                {formatCurrency(plannedBalance, user.currency, !user.showValues)}
              </p>
            </div>

            {/* KPI 4: Economia planejada */}
            <div className="p-4 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7c4dff] shrink-0 shadow-xs" />
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold truncate">Economia planejada</span>
              </div>
              <p className="text-base font-black text-purple-600 dark:text-purple-400 tracking-tight">
                {plannedSavingsRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* 3. OVERALL PLANNING PROGRESS BAR */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Acompanhamento do Orçamento Geral</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      overallPercentage >= 100
                        ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                        : overallPercentage >= 80
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                    }`}
                  >
                    {overallPercentage >= 100 ? 'Estourado' : overallPercentage >= 80 ? 'Alerta 80%' : 'Sob Controle'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {totalBudgetLimit > 0
                    ? `Você já utilizou ${overallPercentage.toFixed(1)}% do teto estipulado para ${capitalizedMonth}.`
                    : 'Defina seu teto de gastos para acompanhar seus limites.'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase block">Restante para Gastar</span>
                <span className={`text-base font-black ${totalRemainingBudget > 0 ? 'text-[#66bb6a]' : 'text-[#ef5350]'}`}>
                  {formatCurrency(totalRemainingBudget, user.currency, !user.showValues)}
                </span>
              </div>
            </div>

            {/* Global Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3.5 rounded-full overflow-hidden flex items-center relative p-0.5">
                <div
                  style={{
                    width: `${Math.min(100, Math.max(3, overallPercentage))}%`,
                    backgroundColor: overallPercentage >= 100 ? '#ef5350' : overallPercentage >= 80 ? '#ff9800' : '#00a884',
                  }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                <span>Gasto: {formatCurrency(totalSpentInBudgets, user.currency, !user.showValues)}</span>
                <span>Teto: {formatCurrency(totalBudgetLimit, user.currency, !user.showValues)}</span>
              </div>
            </div>
          </div>

          {/* 4. DETAILED CATEGORY BUDGETS (MOBILLS SPEC) */}
          <div className="p-6 rounded-[25px] bg-white dark:bg-[#2C2C2E] border border-slate-200/80 dark:border-slate-800/80 shadow-sm dark:shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Orçamento por Categoria</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{expenseCategories.length} categorias</span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {categoryBudgetData.map(item => (
                <div key={item.cat.id} className="py-4 first:pt-2 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-2xl flex items-center justify-center text-sm shadow-xs"
                        style={{ backgroundColor: (item.cat.color || '#7c4dff') + '20', color: item.cat.color || '#7c4dff' }}
                      >
                        {item.cat.icon}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          {item.cat.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
                          <span>Restam {formatCurrency(item.remaining, user.currency, !user.showValues)}</span>
                          {item.prevSpent > 0 && (
                            <span>• Mês ant: {formatCurrency(item.prevSpent, user.currency, !user.showValues)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          {formatCurrency(item.spent, user.currency, !user.showValues)} / {formatCurrency(item.limit, user.currency, !user.showValues)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {item.percentage.toFixed(1)}% ({item.statusLabel})
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCatId(item.cat.id);
                          setCategoryBudgetLimit(item.limit > 0 ? item.limit.toString() : '');
                          setIsCategoryModalOpen(true);
                        }}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Editar Teto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      style={{
                        width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                        backgroundColor: item.statusColor,
                      }}
                      className="h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. WIZARD: "CRIAÇÃO DO PLANEJAMENTO MENSAL" (3 ETAPAS MOBILLS SPEC) */}
      {isWizardOpen && (
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title="Criação do Planejamento Mensal"
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Step Indicator Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {[
                  { step: 1, label: 'Renda & Poupança' },
                  { step: 2, label: 'Regra de Cartão' },
                  { step: 3, label: 'Categorias' },
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-1.5">
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        wizardStep === s.step
                          ? 'bg-purple-600 text-white'
                          : wizardStep > s.step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {wizardStep > s.step ? '✓' : s.step}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        wizardStep === s.step
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.step < 3 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 mx-1" />}
                  </div>
                ))}
              </div>
            </div>

            {/* ETAPA 1: RENDA E ECONOMIA */}
            {wizardStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">
                    Quanto você ganha por mês? (Renda líquida estimada)
                  </h4>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="50"
                      value={monthlyIncomeInput}
                      onChange={e => setMonthlyIncomeInput(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">
                    E quanto você quer economizar por mês?
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Essa porcentagem será utilizada para calcular seu orçamento mensal de gastos.
                  </p>
                  <div className="relative max-w-[140px]">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={savingsRateInput}
                      onChange={e => setSavingsRateInput(e.target.value)}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                  </div>
                </div>

                {/* Educational Banner */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Seu orçamento mensal de gastos será:</span>
                    <span className="font-black text-purple-600 dark:text-purple-400">
                      {formatCurrency(wizardPlannedExpenses, user.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">E você economizará mensalmente:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(wizardPlannedSavings, user.currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Próximo Passo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 2: REGRA DE CARTÃO DE CRÉDITO */}
            {wizardStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Como deseja contabilizar suas compras no Cartão de Crédito?
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Escolha se as compras parceladas ou à vista impactam o teto no dia da compra ou no mês do vencimento da fatura.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setCardRule('transactionDate')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      cardRule === 'transactionDate'
                        ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">Pela data da compra</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      As despesas impactam o teto do orçamento no exato momento em que foram realizadas.
                    </p>
                  </div>

                  <div
                    onClick={() => setCardRule('invoiceDate')}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all space-y-2 ${
                      cardRule === 'invoiceDate'
                        ? 'border-purple-600 bg-purple-50/40 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-purple-600" />
                      <h5 className="text-xs font-black text-slate-900 dark:text-white">Pela data da fatura</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      As compras só impactam o planejamento no mês em que a fatura do cartão é quitada.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-purple-600 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Próximo Passo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA 3: CATEGORIZAÇÃO DE GASTOS */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Distribuição dos Tetos por Categoria
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajuste os valores sugeridos abaixo para que a soma fique de acordo com o teto de <strong>{formatCurrency(wizardPlannedExpenses, user.currency)}</strong>:
                  </p>
                </div>

                {/* Categories List with Inputs */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 max-h-64 overflow-y-auto divide-y divide-slate-200/60 dark:divide-slate-700/60 pr-1">
                  {expenseCategories.map(cat => {
                    const prevSpent = transactions
                      .filter(t => t.type === 'expense' && t.date.startsWith(prevMonthPrefix))
                      .filter(t => {
                        const found = findCategory(t.categoryId, t.subcategoryId);
                        return found ? found.id === cat.id : t.categoryId === cat.id;
                      })
                      .reduce((sum, t) => sum + t.amount, 0);

                    return (
                      <div key={cat.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 dark:text-white block truncate">
                            {cat.icon} {cat.name}
                          </span>
                          {prevSpent > 0 && (
                            <span className="text-[10px] text-slate-400">Mês anterior: {formatCurrency(prevSpent, user.currency)}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-bold text-slate-400">R$</span>
                          <input
                            type="number"
                            step="10"
                            value={customCatBudgets[cat.id] || ''}
                            onChange={e =>
                              setCustomCatBudgets(prev => ({
                                ...prev,
                                [cat.id]: e.target.value,
                              }))
                            }
                            className="w-24 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-black text-right text-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Coherence Summary */}
                <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-between text-xs font-bold">
                  <span>Total Categorizado:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-black">
                    {formatCurrency(totalCustomAllocated, user.currency)} de {formatCurrency(wizardPlannedExpenses, user.currency)}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="text-xs font-bold text-slate-500 hover:text-purple-600 cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishWizard}
                    className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Salvar Planejamento
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* 6. MODAL: EDIT CATEGORY BUDGET */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Definir Teto da Categoria"
        >
          <form
            onSubmit={e => {
              e.preventDefault();
              const limitNum = parseFloat(categoryBudgetLimit) || 0;
              setCategoryBudget(selectedCatId, limitNum, currentMonthPrefix);
              setIsCategoryModalOpen(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <select
                value={selectedCatId}
                onChange={e => setSelectedCatId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
              >
                {expenseCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Limite Máximo para o Mês</label>
              <input
                type="number"
                step="10"
                placeholder="R$ 0,00"
                value={categoryBudgetLimit}
                onChange={e => setCategoryBudgetLimit(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
              >
                Salvar Limite
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
