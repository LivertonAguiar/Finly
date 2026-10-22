import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  Download,
  Calendar,
  X,
  Check,
  FileText,
  FileSpreadsheet,
  Building,
  HeartPulse,
  GitCompare,
  CreditCard,
  Tag,
  Sparkles,
  Scale,
  Layers,
  Eye,
} from 'lucide-react';
import { ComparativeReport } from './ComparativeReport';
import { FinancingReport } from './FinancingReport';
import { Health503020Report } from './Health503020Report';
import { ExecutiveDashboard } from './dashboards/ExecutiveDashboard';
import { CashFlowDashboard } from './dashboards/CashFlowDashboard';
import { CategoriesDashboard } from './dashboards/CategoriesDashboard';
import { PaymentMethodsDashboard } from './dashboards/PaymentMethodsDashboard';
import { useFinancial } from '../../context/FinancialContext';
import { formatCurrency, formatDate, getTodayString } from '../../utils/formatters';
import { resolveCategory } from '../../utils/categoryResolver';
import {
  getEffectiveTransactionDate,
  doesTransactionBelongToMonth,
  isInvoicePaymentTransaction,
  ViewRegime,
} from '../../utils/invoiceCalculator';
import { FilterPopover, FilterState } from '../ui/FilterPopover';
import { exportReportPDF, generateReportPDFBlob, exportReportCSV } from '../../utils/reportExportService';
import { exportReportExcel } from '../../utils/excelExportService';
import { getFamilyMemberList, formatMemberDisplayName } from '../../utils/familyUtils';
import { PdfViewerModal } from '../common/PdfViewerModal';
import html2canvas from 'html2canvas';

export type ReportMainTab =
  | 'overview'
  | 'cashflow'
  | 'categories'
  | 'payment_methods'
  | 'comparatives'
  | 'health_50_30_20'
  | 'financing';

export const ReportsPage: React.FC = () => {
  const { transactions, categories, accounts, cards, user, debts, budgets, familyMembers } = useFinancial();

  const allFamilyMembers = useMemo(
    () => getFamilyMemberList(user, familyMembers).map(m => ({ id: m.id, name: formatMemberDisplayName(m.name), email: m.email })),
    [user, familyMembers]
  );

  // Módulo Principal Selecionado
  const [mainTab, setMainTab] = useState<ReportMainTab>('overview');
  const [drillDownCategoryId, setDrillDownCategoryId] = useState<string | null>(null);

  // Month navigation
  const [selectedMonthOffset, setSelectedMonthOffset] = useState<number>(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Export dropdown state
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unified Filter State
  const [filters, setFilters] = useState<FilterState>({
    period: 'current_month',
    customStartDate: '',
    customEndDate: '',
    selectedUserIds: [],
    selectedAccountIds: [],
    selectedCardIds: [],
    selectedCategoryIds: [],
    status: 'all',
    type: 'all',
  });

  // Base Date
  const viewDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthName = viewDate.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const yearNum = viewDate.getFullYear();
  const currentMonthPrefix = viewDate.toISOString().substring(0, 7);

  const [viewRegime, setViewRegime] = useState<ViewRegime>('invoice_month');

  // Transações Filtradas com aplicação do regime contábil e filtros
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = getTodayString();

    return transactions
      .map(t => {
        const card = cards.find(c => c.id === t.cardId);
        const effectiveDate = getEffectiveTransactionDate(t, card, viewRegime);
        return effectiveDate === t.date ? t : { ...t, date: effectiveDate };
      })
      .filter(t => {
        if (t.ignored) return false;
        if (t.type === 'expense' && isInvoicePaymentTransaction(t)) return false;

        const card = cards.find(c => c.id === t.cardId);

        // Period Matching
        const period = filters.period || 'current_month';
        if (period === 'current_month') {
          if (!doesTransactionBelongToMonth(t, card, currentMonthPrefix, viewRegime)) return false;
        } else if (period === 'today') {
          if (t.date !== todayStr) return false;
        } else if (period === 'week') {
          const d = new Date(t.date + 'T12:00:00');
          const firstDayOfWeek = new Date(now);
          firstDayOfWeek.setDate(now.getDate() - now.getDay());
          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          if (d < firstDayOfWeek || d > lastDayOfWeek) return false;
        } else if (period === 'last_30_days') {
          const d = new Date(t.date + 'T12:00:00');
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          if (d < thirtyDaysAgo || d > now) return false;
        } else if (period === 'prev_month') {
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const prevPrefix = prev.toISOString().substring(0, 7);
          if (!doesTransactionBelongToMonth(t, card, prevPrefix, viewRegime)) return false;
        } else if (period === 'next_month') {
          const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const nextPrefix = next.toISOString().substring(0, 7);
          if (!doesTransactionBelongToMonth(t, card, nextPrefix, viewRegime)) return false;
        } else if (period === 'current_year') {
          if (!t.date.startsWith(String(now.getFullYear()))) return false;
        } else if (period === 'custom') {
          if (filters.customStartDate && t.date < filters.customStartDate) return false;
          if (filters.customEndDate && t.date > filters.customEndDate) return false;
        }

        // Status filter
        if (filters.status && filters.status !== 'all' && t.status !== filters.status) return false;

        // Account filter
        if (filters.selectedAccountIds && filters.selectedAccountIds.length > 0) {
          if (!t.accountId || !filters.selectedAccountIds.includes(t.accountId)) return false;
        }

        // Card filter
        if (filters.selectedCardIds && filters.selectedCardIds.length > 0) {
          if (!t.cardId || !filters.selectedCardIds.includes(t.cardId)) return false;
        }

        // Category filter
        if (filters.selectedCategoryIds && filters.selectedCategoryIds.length > 0) {
          const resolved = resolveCategory(categories, t.categoryId, t.subcategoryId, t.type);
          if (!filters.selectedCategoryIds.includes(t.categoryId) && !filters.selectedCategoryIds.includes(resolved.id)) {
            return false;
          }
        }

        // User filter
        if (filters.selectedUserIds && filters.selectedUserIds.length > 0) {
          const mId = t.userId || (t as any).relationships?.personId || 'owner';
          if (!filters.selectedUserIds.includes(mId)) return false;
        }

        return true;
      });
  }, [transactions, filters, viewRegime, cards, currentMonthPrefix, categories]);

  // Executive totals for report exports
  const reportTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense' && !isInvoicePaymentTransaction(t)) expense += t.amount;
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  // Atalhos rápidos de período
  const handleQuickPeriodSelect = (periodType: 'current_month' | 'prev_month' | 'last_90_days' | 'current_year') => {
    if (periodType === 'current_month') {
      setSelectedMonthOffset(0);
      setFilters(prev => ({ ...prev, period: 'current_month' }));
    } else if (periodType === 'prev_month') {
      setSelectedMonthOffset(-1);
      setFilters(prev => ({ ...prev, period: 'current_month' }));
    } else if (periodType === 'last_90_days') {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 90);
      setFilters(prev => ({
        ...prev,
        period: 'custom',
        customStartDate: start.toISOString().substring(0, 10),
        customEndDate: end.toISOString().substring(0, 10),
      }));
    } else if (periodType === 'current_year') {
      setFilters(prev => ({ ...prev, period: 'current_year' }));
    }
  };

  // In-memory Temporary PDF Preview State
  const [pdfPreview, setPdfPreview] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    blob: Blob | null;
    filename: string;
    dialogTitle?: string;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: '',
    blob: null,
    filename: '',
  });

  const handleViewPDF = async () => {
    setIsExportDropdownOpen(false);
    const title = `Extrato Financeiro - ${capitalizedMonth} de ${yearNum}`;
    const filename = `extrato_finly_${currentMonthPrefix}_${viewRegime}.pdf`;

    setPdfPreview({
      isOpen: true,
      title,
      subtitle: `Demonstrativo financeiro executivo • Regime: ${viewRegime === 'invoice_month' ? 'Competência' : viewRegime === 'due_date' ? 'Vencimento' : 'Data da Compra'}`,
      blob: null,
      filename,
      dialogTitle: 'Extrato Financeiro Finly (PDF)',
      isLoading: true,
    });

    try {
      let activeChartImage: string | undefined = undefined;

      if (reportContainerRef.current) {
        try {
          const canvas = await html2canvas(reportContainerRef.current, {
            scale: 1.5,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
          });
          activeChartImage = canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('Erro ao capturar elemento do gráfico DOM:', err);
        }
      }

      const result = await generateReportPDFBlob({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
        activeChartImage,
        activeChartTitle: `Relatório Executivo - ${capitalizedMonth} ${yearNum}`,
      });

      setPdfPreview(prev => ({
        ...prev,
        blob: result.blob,
        filename: result.filename,
        isLoading: false,
      }));
    } catch (e) {
      console.error('Erro ao gerar preview de relatório PDF:', e);
      setPdfPreview(prev => ({ ...prev, isOpen: false, isLoading: false }));
    }
  };

  // Export handlers
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      let activeChartImage: string | undefined = undefined;

      if (reportContainerRef.current) {
        try {
          const canvas = await html2canvas(reportContainerRef.current, {
            scale: 1.5,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true,
          });
          activeChartImage = canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('Erro ao capturar elemento do gráfico DOM:', err);
        }
      }

      await exportReportPDF({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
        activeChartImage,
        activeChartTitle: `Relatório Executivo - ${capitalizedMonth} ${yearNum}`,
      });
    } catch (e) {
      console.error('Erro ao gerar relatório PDF:', e);
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      await exportReportExcel({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
      });
    } catch (e) {
      console.error('Erro ao gerar relatório Excel:', e);
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportReportCSV({
        periodLabel: `${capitalizedMonth} de ${yearNum}`,
        periodSlug: `${currentMonthPrefix}_${viewRegime}`,
        viewRegime,
        totalIncome: reportTotals.income,
        totalExpense: reportTotals.expense,
        netBalance: reportTotals.balance,
        transactions: filteredTransactions,
        categories,
        accounts,
        cards,
        currency: user?.currency || 'BRL',
        userEmail: user?.email,
      });
    } catch (e) {
      console.error('Erro ao gerar relatório CSV:', e);
    } finally {
      setIsExporting(false);
      setIsExportDropdownOpen(false);
    }
  };

  // Navegação para categoria em drill-down a partir da visão geral
  const handleNavigateToCategoryDrillDown = (catId: string) => {
    setDrillDownCategoryId(catId);
    setMainTab('categories');
  };

  const monthsShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-16">
      {/* 0. CABEÇALHO GLOBAL DE RELATÓRIOS & AÇÕES DE EXPORTAÇÃO */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Relatórios & Inteligência Financeira</span>
            <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-extrabold border border-purple-200 dark:border-purple-800">
              Finly Analytics
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Painéis executivos, diagnósticos orçamentários, fluxo de caixa e projeções
          </p>
        </div>

        {/* Botão de Exportação e Filtro Popover */}
        <div className="flex items-center gap-2">
          {/* Filtro Avançado Popover */}
          <FilterPopover
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
            accounts={accounts}
            cards={cards}
            users={allFamilyMembers}
            currentUser={user}
            showPeriod={true}
            showUser={allFamilyMembers.length > 1}
            showAccounts={true}
            showCards={true}
            showCategories={true}
            showStatus={true}
            customPeriodLabel={capitalizedMonth + ' ' + yearNum}
          />

          {/* Export Dropdown */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 shadow-xs cursor-pointer active:scale-95 transition-all"
              title="Exportar Relatório em PDF, Excel ou CSV"
            >
              <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Exportar</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isExportDropdownOpen && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 text-xs font-bold divide-y divide-slate-100 dark:divide-slate-800/60"
              >
                <button
                  type="button"
                  onClick={handleViewPDF}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Visualizar em PDF</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                        Temporário
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal truncate">Visualização em memória sem download</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100">Baixar Relatório em PDF</div>
                    <div className="text-[10px] text-slate-400 font-normal">Documento executivo formatado</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Planilha Excel (.xlsx)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                        Oficial
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">Múltiplas abas formatadas</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="w-full px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-600 dark:hover:text-purple-300 flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 dark:text-slate-100">Exportar em CSV</div>
                    <div className="text-[10px] text-slate-400 font-normal">Formato bruto universal</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. NAVEGAÇÃO ENTRE OS DASHBOARDS ANALÍTICOS (7 MÓDULOS) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none shadow-xs">
        <button
          onClick={() => setMainTab('overview')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Visão Geral 360°</span>
        </button>

        <button
          onClick={() => setMainTab('cashflow')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'cashflow'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Fluxo de Caixa</span>
        </button>

        <button
          onClick={() => setMainTab('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'categories'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Categorias & Centros de Custo</span>
        </button>

        <button
          onClick={() => setMainTab('payment_methods')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'payment_methods'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Meios de Pagamento</span>
        </button>

        <button
          onClick={() => setMainTab('comparatives')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'comparatives'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>Comparativos MoM</span>
        </button>

        <button
          onClick={() => setMainTab('health_50_30_20')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'health_50_30_20'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <HeartPulse className="w-3.5 h-3.5" />
          <span>Regra 50/30/20</span>
        </button>

        <button
          onClick={() => setMainTab('financing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            mainTab === 'financing'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Financiamentos & Dívidas</span>
        </button>
      </div>

      {/* 2. BARRA DE CONTROLE UNIFICADA DE PERÍODO & REGIME CONTÁBIL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Navegador de Mês */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonthOffset(prev => prev - 1)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowMonthPicker(!showMonthPicker)}
            className="px-4 py-1.5 rounded-full border border-purple-500/50 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 text-xs font-extrabold uppercase tracking-widest cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-xs"
          >
            {capitalizedMonth} {yearNum}
          </button>

          <button
            onClick={() => setSelectedMonthOffset(prev => prev + 1)}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Atalho Mês Atual */}
          {selectedMonthOffset !== 0 && (
            <button
              onClick={() => setSelectedMonthOffset(0)}
              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline px-2 cursor-pointer"
            >
              Hoje
            </button>
          )}
        </div>

        {/* Regime Contábil Toggle */}
        <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-[#2C2C2E] border border-slate-200 dark:border-slate-700 text-[11px] font-bold shadow-xs">
          <button
            type="button"
            onClick={() => setViewRegime('invoice_month')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewRegime === 'invoice_month'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Relatórios por competência da fatura do cartão (Padrão contábil)"
          >
            <span>Competência / Fatura</span>
          </button>
          <button
            type="button"
            onClick={() => setViewRegime('purchase_date')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewRegime === 'purchase_date'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Relatórios por data em que a compra ocorreu"
          >
            <span>Data da Compra</span>
          </button>
          <button
            type="button"
            onClick={() => setViewRegime('due_date')}
            className={`px-3 py-1 rounded-full transition-all flex items-center gap-1 cursor-pointer ${
              viewRegime === 'due_date'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Relatórios por data de vencimento da fatura"
          >
            <span>Vencimento</span>
          </button>
        </div>
      </div>

      {/* Popover Inline Matrix Month Picker */}
      {showMonthPicker && (
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1E222D] border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-in fade-in max-w-sm mx-auto">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white px-2">
            <button
              onClick={() => setSelectedMonthOffset(prev => prev - 12)}
              className="p-1 hover:text-purple-600 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>{yearNum}</span>
            <button
              onClick={() => setSelectedMonthOffset(prev => prev + 12)}
              className="p-1 hover:text-purple-600 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {monthsShort.map((m, idx) => {
              const currentMonthIndex = viewDate.getMonth();
              const isSelected = currentMonthIndex === idx;

              return (
                <button
                  key={m}
                  onClick={() => {
                    const diff = idx - currentMonthIndex;
                    setSelectedMonthOffset(prev => prev + diff);
                    setShowMonthPicker(false);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. CONTEÚDO DINÂMICO DOS DASHBOARDS */}
      <div ref={reportContainerRef} className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. VISÃO GERAL 360° (DASHBOARD EXECUTIVO) */}
        {/* ========================================================================= */}
        {mainTab === 'overview' && (
          <div className="animate-in fade-in">
            <ExecutiveDashboard
              transactions={filteredTransactions}
              categories={categories}
              accounts={accounts}
              cards={cards}
              user={user}
              currentMonthPrefix={currentMonthPrefix}
              monthName={capitalizedMonth}
              yearNum={yearNum}
              onNavigateToCategory={handleNavigateToCategoryDrillDown}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. FLUXO DE CAIXA TEMPORAL & PROJEÇÃO */}
        {/* ========================================================================= */}
        {mainTab === 'cashflow' && (
          <div className="animate-in fade-in">
            <CashFlowDashboard
              transactions={filteredTransactions}
              user={user}
              currentMonthPrefix={currentMonthPrefix}
              yearNum={yearNum}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. CATEGORIAS & CENTROS DE CUSTO COM DRILL-DOWN */}
        {/* ========================================================================= */}
        {mainTab === 'categories' && (
          <div className="animate-in fade-in">
            <CategoriesDashboard
              transactions={filteredTransactions}
              categories={categories}
              budgets={budgets}
              user={user}
              currentMonthPrefix={currentMonthPrefix}
              initialSelectedCategoryId={drillDownCategoryId}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. MEIOS DE PAGAMENTO & CARTÕES */}
        {/* ========================================================================= */}
        {mainTab === 'payment_methods' && (
          <div className="animate-in fade-in">
            <PaymentMethodsDashboard
              transactions={filteredTransactions}
              accounts={accounts}
              cards={cards}
              user={user}
              currentMonthPrefix={currentMonthPrefix}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. MÓDULO COMPARATIVOS (MOM & ORÇADO VS REALIZADO) */}
        {/* ========================================================================= */}
        {mainTab === 'comparatives' && (
          <div className="animate-in fade-in">
            <ComparativeReport
              transactions={filteredTransactions}
              categories={categories}
              budgets={budgets}
              cards={cards}
              viewRegime={viewRegime}
              currentMonth={currentMonthPrefix}
              currency={user.currency}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. MÓDULO REGRA 50/30/20 & DIAGNÓSTICO */}
        {/* ========================================================================= */}
        {mainTab === 'health_50_30_20' && (
          <div className="animate-in fade-in">
            <Health503020Report
              transactions={filteredTransactions}
              categories={categories}
              cards={cards}
              viewRegime={viewRegime}
              currentMonth={currentMonthPrefix}
              currency={user.currency}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. MÓDULO FINANCIAMENTOS & DÍVIDAS */}
        {/* ========================================================================= */}
        {mainTab === 'financing' && (
          <div className="animate-in fade-in">
            <FinancingReport
              debts={debts}
              currency={user.currency}
            />
          </div>
        )}
      </div>

      {/* In-Memory Temporary PDF Preview Modal */}
      <PdfViewerModal
        isOpen={pdfPreview.isOpen}
        onClose={() => setPdfPreview(prev => ({ ...prev, isOpen: false, blob: null }))}
        title={pdfPreview.title}
        subtitle={pdfPreview.subtitle}
        blob={pdfPreview.blob}
        filename={pdfPreview.filename}
        dialogTitle={pdfPreview.dialogTitle}
        isLoading={pdfPreview.isLoading}
      />
    </div>
  );
};
