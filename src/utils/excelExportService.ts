import * as XLSX from 'xlsx';
import { Transaction, Category, Account, CreditCard } from '../types';
import { formatDate } from './formatters';
import { resolveCategory } from './categoryResolver';
import { ReportExportData } from './reportExportService';

/**
 * Calculates optimal column widths for an Excel worksheet
 */
function fitToColumn(data: any[][]): { wch: number }[] {
  const colWidths: number[] = [];
  data.forEach(row => {
    row.forEach((val, colIdx) => {
      const str = val !== null && val !== undefined ? String(val) : '';
      const len = str.length;
      if (!colWidths[colIdx] || len > colWidths[colIdx]) {
        colWidths[colIdx] = len;
      }
    });
  });
  return colWidths.map(w => ({ wch: Math.min(Math.max(w + 3, 12), 45) }));
}

/**
 * Exports a full executive financial report as a formatted multi-sheet Excel (.xlsx) file
 */
export function exportReportExcel(data: ReportExportData): void {
  const wb = XLSX.utils.book_new();
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // -------------------------------------------------------------
  // 1. ABA RESUMO EXECUTIVO
  // -------------------------------------------------------------
  const regimeLabel = data.viewRegime === 'due_date' ? 'Vencimento da Fatura (Caixa)' : 'Data da Compra (Competência)';
  const savingsRate = data.totalIncome > 0
    ? Number(((data.netBalance / data.totalIncome) * 100).toFixed(1))
    : 0;

  // Aggregate expenses by category
  const expenseCatMap = new Map<string, number>();
  let totalCatExpenses = 0;

  data.transactions.forEach(t => {
    if (t.type === 'expense') {
      const cat = resolveCategory(data.categories, t.categoryId, t.subcategoryId, t.type);
      const catName = cat?.name || 'Outras Despesas';
      const current = expenseCatMap.get(catName) || 0;
      expenseCatMap.set(catName, current + Number(t.amount || 0));
      totalCatExpenses += Number(t.amount || 0);
    }
  });

  const sortedCatExpenses = Array.from(expenseCatMap.entries()).sort((a, b) => b[1] - a[1]);

  const summaryRows: any[][] = [
    ['FINLY - PLANEJADOR FINANCEIRO'],
    ['Relatório Executivo de Inteligência Financeira'],
    [''],
    ['INFORMAÇÕES GERAIS'],
    ['Período Analisado:', data.periodLabel],
    ['Regime Contábil:', regimeLabel],
    ['Data de Emissão:', `${dateStr} às ${timeStr}`],
    ['Usuário:', data.userEmail || 'Conta Titular Finly'],
    ['Moeda:', data.currency || 'BRL (R$)'],
    [''],
    ['INDICADORES FINANCEIROS CHAVE (KPIS)'],
    ['Métrica', 'Valor', 'Observação'],
    ['Total de Receitas', Number(data.totalIncome.toFixed(2)), 'Entradas no período'],
    ['Total de Despesas', Number(data.totalExpense.toFixed(2)), 'Saídas e faturas no período'],
    ['Resultado Líquido (Saldo)', Number(data.netBalance.toFixed(2)), data.netBalance >= 0 ? 'Superávit / Economia' : 'Déficit no período'],
    ['Taxa de Poupança', `${savingsRate}%`, savingsRate >= 20 ? 'Excelente (> 20%)' : 'Atenção (abaixo de 20%)'],
    [''],
    ['DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA'],
    ['Categoria', 'Valor (R$)', 'Participação (%)'],
  ];

  if (sortedCatExpenses.length === 0) {
    summaryRows.push(['Nenhuma despesa registrada', 0, '0.0%']);
  } else {
    sortedCatExpenses.forEach(([catName, amount]) => {
      const share = totalCatExpenses > 0 ? ((amount / totalCatExpenses) * 100).toFixed(1) : '0.0';
      summaryRows.push([catName, Number(amount.toFixed(2)), `${share}%`]);
    });
    summaryRows.push(['TOTAL GERAL DE DESPESAS', Number(totalCatExpenses.toFixed(2)), '100.0%']);
  }

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = fitToColumn(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo Executivo');

  // -------------------------------------------------------------
  // 2. ABA LANÇAMENTOS DETALHADOS
  // -------------------------------------------------------------
  const txHeader = [
    'Data',
    'Descrição',
    'Categoria',
    'Subcategoria',
    'Conta / Cartão',
    'Método de Pagamento',
    'Tipo',
    'Valor (R$)',
    'Status',
    'Observações / Tags',
  ];

  const sortedTx = [...data.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const txRows: any[][] = [
    ['LANÇAMENTOS DO PERÍODO - ' + data.periodLabel],
    ['Total de Registros:', sortedTx.length],
    [''],
    txHeader,
  ];

  sortedTx.forEach(t => {
    const cat = resolveCategory(data.categories, t.categoryId, t.subcategoryId, t.type);
    const acc = data.accounts.find(a => a.id === t.accountId);
    const card = data.cards.find(c => c.id === t.cardId);

    const sourceName = t.cardId
      ? (card ? `Cartão: ${card.name}` : 'Cartão de Crédito')
      : (acc ? `Conta: ${acc.name}` : 'Conta Corrente');

    const methodLabel = t.cardId
      ? (t.installments && t.installments.total > 1 ? `Crédito (${t.installments.current}/${t.installments.total}x)` : 'Cartão de Crédito à vista')
      : (t.type === 'transfer' ? 'Transferência' : 'Débito / Pix');

    const typeLabel = t.type === 'income' ? 'Receita' : (t.type === 'expense' ? 'Despesa' : 'Transferência');
    const statusLabel = t.status === 'completed' ? 'Efetivado' : 'Pendente';
    const notes = [t.notes, ...(t.tags || [])].filter(Boolean).join(' | ');

    txRows.push([
      formatDate(t.date),
      t.description || 'Sem descrição',
      cat?.name || 'Sem Categoria',
      cat?.subName || '-',
      sourceName,
      methodLabel,
      typeLabel,
      t.type === 'expense' ? -Number(t.amount || 0) : Number(t.amount || 0),
      statusLabel,
      notes || '-',
    ]);
  });

  const wsTx = XLSX.utils.aoa_to_sheet(txRows);
  wsTx['!cols'] = fitToColumn(txRows);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Lançamentos Detalhados');

  // -------------------------------------------------------------
  // 3. ABA CONTAS E CARTÕES
  // -------------------------------------------------------------
  const accRows: any[][] = [
    ['BALANÇO PATRIMONIAL - CONTAS BANCÁRIAS'],
    ['Nome da Conta', 'Instituição / Banco', 'Tipo de Conta', 'Saldo Atual (R$)'],
  ];

  let totalAccountsBalance = 0;
  data.accounts.forEach(a => {
    const bal = Number(a.balance || 0);
    totalAccountsBalance += bal;
    accRows.push([
      a.name,
      a.institution || 'Não informado',
      a.type === 'checking' ? 'Conta Corrente' : (a.type === 'savings' ? 'Poupança' : (a.type === 'investment' ? 'Investimento' : 'Carteira')),
      Number(bal.toFixed(2)),
    ]);
  });
  accRows.push(['TOTAL EM CONTAS', '', '', Number(totalAccountsBalance.toFixed(2))]);

  accRows.push(['']);
  accRows.push(['CARTÕES DE CRÉDITO CADASTRADOS']);
  accRows.push(['Nome do Cartão', 'Bandeira', 'Limite Total (R$)', 'Dia Fechamento', 'Dia Vencimento']);

  data.cards.forEach(c => {
    accRows.push([
      c.name,
      c.brand || 'Bandeira Padrão',
      Number(Number(c.limit || 0).toFixed(2)),
      `Dia ${c.closingDay}`,
      `Dia ${c.dueDay}`,
    ]);
  });

  const wsAcc = XLSX.utils.aoa_to_sheet(accRows);
  wsAcc['!cols'] = fitToColumn(accRows);
  XLSX.utils.book_append_sheet(wb, wsAcc, 'Contas e Cartões');

  // -------------------------------------------------------------
  // GERAÇÃO E DOWNLOAD DO ARQUIVO .XLSX
  // -------------------------------------------------------------
  const cleanPeriod = (data.periodSlug || 'completo').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Finly_Relatorio_${cleanPeriod}_${now.toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, filename);
}

/**
 * Direct export of a list of transactions to Excel (.xlsx)
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  cards: CreditCard[],
  filenamePrefix: string = 'Transacoes_Finly'
): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Data',
    'Descrição',
    'Categoria',
    'Subcategoria',
    'Conta / Cartão',
    'Tipo',
    'Valor (R$)',
    'Status',
    'Recorrência',
    'Observações',
  ];

  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const rows: any[][] = [
    ['EXPORTAÇÃO DE LANÇAMENTOS - FINLY'],
    [`Total exportado: ${sorted.length} registros | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`],
    [''],
    headers,
  ];

  sorted.forEach(t => {
    const cat = resolveCategory(categories, t.categoryId, t.subcategoryId, t.type);
    const acc = accounts.find(a => a.id === t.accountId);
    const card = cards.find(c => c.id === t.cardId);

    const sourceName = t.cardId
      ? (card ? `Cartão: ${card.name}` : 'Cartão de Crédito')
      : (acc ? `Conta: ${acc.name}` : 'Conta Bancária');

    rows.push([
      formatDate(t.date),
      t.description,
      cat?.name || 'Outras Despesas',
      cat?.subName || '-',
      sourceName,
      t.type === 'income' ? 'Receita' : (t.type === 'expense' ? 'Despesa' : 'Transferência'),
      t.type === 'expense' ? -Number(t.amount || 0) : Number(t.amount || 0),
      t.status === 'completed' ? 'Efetivado' : 'Pendente',
      t.recurring ? (t.recurrenceFrequency || 'Sim') : 'Não',
      t.notes || '',
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = fitToColumn(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Transações');

  const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
