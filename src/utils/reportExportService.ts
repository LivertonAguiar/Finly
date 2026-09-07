import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Account, CreditCard } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { resolveCategory } from './categoryResolver';

export interface ReportExportData {
  periodLabel: string;
  periodSlug: string;
  viewRegime: 'due_date' | 'purchase_date';
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  cards: CreditCard[];
  currency?: string;
  userEmail?: string;
}

/**
 * Generates and downloads an Executive PDF Financial Report
 */
export function exportReportPDF(data: ReportExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = data.currency || 'BRL';
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const regimeLabel = data.viewRegime === 'due_date' ? 'Vencimento da Fatura (Caixa)' : 'Data da Compra (Competência)';

  // Calculate savings rate
  const savingsRate = data.totalIncome > 0
    ? ((data.netBalance / data.totalIncome) * 100).toFixed(1)
    : '0.0';

  // --- HEADER BRANDING BANNER ---
  doc.setFillColor(30, 27, 75); // Indigo 950
  doc.rect(0, 0, 210, 38, 'F');

  // Accent Line
  doc.setFillColor(147, 51, 234); // Purple 600
  doc.rect(0, 36, 210, 2, 'F');

  // Title & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FINLY', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(196, 181, 253); // Purple 200
  doc.text('Relatório Executivo de Inteligência Financeira', 14, 23);

  // Period Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Período: ${data.periodLabel}`, 14, 31);

  // Metadata right-aligned
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Gerado em: ${generationDateStr}`, 196, 15, { align: 'right' });
  doc.text(`Regime: ${regimeLabel}`, 196, 20, { align: 'right' });
  if (data.userEmail) {
    doc.text(`Usuário: ${data.userEmail}`, 196, 25, { align: 'right' });
  }

  let currentY = 46;

  // --- EXECUTIVE SUMMARY CARDS ---
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Resumo Executivo do Período', 14, currentY);
  currentY += 5;

  const cardWidth = 43;
  const cardHeight = 22;
  const cardGap = 5;
  const startX = 14;

  const summaryCards = [
    {
      title: 'RECEITAS TOTAIS',
      value: formatCurrency(data.totalIncome, currency, false),
      color: [16, 185, 129], // Emerald
      bgColor: [236, 253, 245],
    },
    {
      title: 'DESPESAS TOTAIS',
      value: formatCurrency(data.totalExpense, currency, false),
      color: [225, 29, 72], // Rose
      bgColor: [255, 241, 242],
    },
    {
      title: 'SALDO LÍQUIDO',
      value: formatCurrency(data.netBalance, currency, false),
      color: data.netBalance >= 0 ? [16, 185, 129] : [225, 29, 72],
      bgColor: data.netBalance >= 0 ? [240, 253, 244] : [254, 242, 242],
    },
    {
      title: 'TAXA DE ECONOMIA',
      value: `${savingsRate}%`,
      color: Number(savingsRate) >= 0 ? [124, 58, 237] : [225, 29, 72],
      bgColor: [245, 243, 255],
    },
  ];

  summaryCards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + cardGap);
    // Card background
    doc.setFillColor(c.bgColor[0], c.bgColor[1], c.bgColor[2]);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
    // Border
    doc.setDrawColor(c.color[0], c.color[1], c.color[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 3, currentY + 7);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.value, x + 3, currentY + 16);
  });

  currentY += cardHeight + 10;

  // --- SECTION 2: CATEGORY BREAKDOWN TABLE ---
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Despesas por Categoria', 14, currentY);
  currentY += 3;

  // Aggregate expenses by category
  const expenseCategoriesMap: Record<string, { name: string; amount: number; count: number }> = {};
  data.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
      const catName = resolved.name;
      if (!expenseCategoriesMap[catName]) {
        expenseCategoriesMap[catName] = { name: catName, amount: 0, count: 0 };
      }
      expenseCategoriesMap[catName].amount += t.amount;
      expenseCategoriesMap[catName].count += 1;
    });

  const categoryRows = Object.values(expenseCategoriesMap)
    .sort((a, b) => b.amount - a.amount)
    .map(c => {
      const pct = data.totalExpense > 0 ? ((c.amount / data.totalExpense) * 100).toFixed(1) : '0.0';
      return [
        c.name,
        String(c.count),
        formatCurrency(c.amount, currency, false),
        `${pct}%`,
      ];
    });

  if (categoryRows.length === 0) {
    categoryRows.push(['Nenhuma despesa registrada no período', '0', formatCurrency(0, currency, false), '0%']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Categoria', 'Qtd. Lançamentos', 'Total Gasto', '% do Total']],
    body: categoryRows,
    theme: 'striped',
    headStyles: {
      fillColor: [109, 40, 217], // Purple 700
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // --- SECTION 3: DETAILED STATEMENT TABLE ---
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 10;

  // If close to page bottom, add page
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Demonstrativo Detalhado de Lançamentos', 14, currentY);
  currentY += 3;

  const sortedTxs = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  const txRows = sortedTxs.map(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, t.type);
    let paymentMethod = 'Carteira';
    if (t.cardId) {
      const card = data.cards.find(c => c.id === t.cardId);
      paymentMethod = card ? `Cartão ${card.name}` : 'Cartão';
    } else if (t.accountId) {
      const acc = data.accounts.find(a => a.id === t.accountId);
      paymentMethod = acc ? acc.name : 'Conta';
    }

    const typePrefix = t.type === 'expense' ? '- ' : '+ ';
    const typeColor = t.type === 'expense' ? 'Despesa' : 'Receita';

    return [
      formatDate(t.date),
      t.description || 'Sem descrição',
      resolved.name,
      paymentMethod,
      typeColor,
      typePrefix + formatCurrency(t.amount, currency, false),
    ];
  });

  if (txRows.length === 0) {
    txRows.push(['-', 'Nenhum lançamento encontrado', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Data', 'Descrição', 'Categoria', 'Conta / Cartão', 'Tipo', 'Valor']],
    body: txRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 55 },
      2: { cellWidth: 35 },
      3: { cellWidth: 32 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (dataHook) => {
      // Add page number to footer
      const pageCount = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        `Finly Gestão Financeira • ${data.periodLabel} • Página ${dataHook.pageNumber} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    },
  });

  // Save PDF
  doc.save(`relatorio_finly_${data.periodSlug}.pdf`);
}

/**
 * Generates and downloads a CSV Report with Summary and Transactions
 */
export function exportReportCSV(data: ReportExportData): void {
  const currency = data.currency || 'BRL';
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
  const regimeLabel = data.viewRegime === 'due_date' ? 'Vencimento da Fatura (Caixa)' : 'Data da Compra (Competência)';

  const lines: string[] = [];

  // Section 1: Metadata
  lines.push('FINLY - RELATÓRIO FINANCEIRO');
  lines.push(`Período de Referência;${data.periodLabel}`);
  lines.push(`Regime de Apuração;${regimeLabel}`);
  lines.push(`Gerado em;${generationDateStr}`);
  if (data.userEmail) lines.push(`Usuário;${data.userEmail}`);
  lines.push('');

  // Section 2: Executive Summary
  lines.push('RESUMO EXECUTIVO');
  lines.push(`Receitas Totais;${data.totalIncome.toFixed(2).replace('.', ',')}`);
  lines.push(`Despesas Totais;${data.totalExpense.toFixed(2).replace('.', ',')}`);
  lines.push(`Saldo Líquido;${data.netBalance.toFixed(2).replace('.', ',')}`);
  const savingsPct = data.totalIncome > 0 ? ((data.netBalance / data.totalIncome) * 100).toFixed(1) : '0,0';
  lines.push(`Taxa de Poupança;${savingsPct}%`);
  lines.push('');

  // Section 3: Categories
  lines.push('DESPESAS POR CATEGORIA');
  lines.push('Categoria;Qtd. Lançamentos;Total (R$);% do Total');

  const expenseCategoriesMap: Record<string, { name: string; amount: number; count: number }> = {};
  data.transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
      const catName = resolved.name;
      if (!expenseCategoriesMap[catName]) {
        expenseCategoriesMap[catName] = { name: catName, amount: 0, count: 0 };
      }
      expenseCategoriesMap[catName].amount += t.amount;
      expenseCategoriesMap[catName].count += 1;
    });

  Object.values(expenseCategoriesMap)
    .sort((a, b) => b.amount - a.amount)
    .forEach(c => {
      const pct = data.totalExpense > 0 ? ((c.amount / data.totalExpense) * 100).toFixed(1).replace('.', ',') : '0,0';
      lines.push(`"${c.name}";${c.count};${c.amount.toFixed(2).replace('.', ',')};${pct}%`);
    });

  lines.push('');

  // Section 4: Transaction Statement
  lines.push('DEMONSTRATIVO DETALHADO DE LANÇAMENTOS');
  lines.push('Data;Descrição;Categoria;Conta ou Cartão;Tipo;Status;Valor (R$)');

  const sortedTxs = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  sortedTxs.forEach(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, t.type);
    let paymentMethod = 'Carteira';
    if (t.cardId) {
      const card = data.cards.find(c => c.id === t.cardId);
      paymentMethod = card ? `Cartão ${card.name}` : 'Cartão';
    } else if (t.accountId) {
      const acc = data.accounts.find(a => a.id === t.accountId);
      paymentMethod = acc ? acc.name : 'Conta';
    }

    const typeStr = t.type === 'expense' ? 'Despesa' : 'Receita';
    const valFormatted = (t.type === 'expense' ? -t.amount : t.amount).toFixed(2).replace('.', ',');

    lines.push(
      `"${formatDate(t.date)}";"${(t.description || '').replace(/"/g, '""')}";"${resolved.name}";"${paymentMethod}";"${typeStr}";"${t.status}";${valFormatted}`
    );
  });

  // UTF-8 BOM (\uFEFF) ensures Excel opens with special characters correctly formatted
  downloadCSV(`relatorio_finly_${data.periodSlug}.csv`, lines.join('\n'));
}

/**
 * Triggers a robust file download in the browser using a UTF-8 BOM Blob.
 * Immune to URI length limits, and unencoded characters (#, %, &, etc.) that corrupt data URIs.
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface InvoiceExportData {
  card: CreditCard;
  monthLabel: string;
  periodSlug: string;
  invoiceTotal: number;
  statusLabel: string;
  transactions: Transaction[];
  categories: Category[];
  currency?: string;
  userEmail?: string;
}

/**
 * Generates and downloads a detailed CSV of a Credit Card Invoice statement
 */
export function exportInvoiceCSV(data: InvoiceExportData): void {
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');

  const lines: string[] = [];

  // Section 1: Header Metadata
  lines.push('FINLY - DETALHAMENTO DA FATURA DE CARTÃO DE CRÉDITO');
  lines.push(`Cartão;${data.card.name}`);
  lines.push(`Bandeira;${data.card.brand}`);
  lines.push(`Período da Fatura;${data.monthLabel}`);
  lines.push(`Fechamento da Fatura;Todo dia ${data.card.closingDay}`);
  lines.push(`Vencimento da Fatura;Todo dia ${data.card.dueDay}`);
  lines.push(`Limite Total;${data.card.limit.toFixed(2).replace('.', ',')}`);
  lines.push(`Total da Fatura;${data.invoiceTotal.toFixed(2).replace('.', ',')}`);
  lines.push(`Status da Fatura;${data.statusLabel}`);
  lines.push(`Gerado em;${generationDateStr}`);
  if (data.userEmail) lines.push(`Usuário;${data.userEmail}`);
  lines.push('');

  // Section 2: Category Breakdown
  lines.push('GASTOS POR CATEGORIA NESTA FATURA');
  lines.push('Categoria;Qtd. Lançamentos;Total (R$);% da Fatura');

  const catMap: Record<string, { name: string; amount: number; count: number }> = {};
  data.transactions.forEach(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
    const name = resolved.name;
    if (!catMap[name]) {
      catMap[name] = { name, amount: 0, count: 0 };
    }
    catMap[name].amount += t.amount;
    catMap[name].count += 1;
  });

  Object.values(catMap)
    .sort((a, b) => b.amount - a.amount)
    .forEach(c => {
      const pct = data.invoiceTotal > 0 ? ((c.amount / data.invoiceTotal) * 100).toFixed(1).replace('.', ',') : '0,0';
      lines.push(`"${c.name}";${c.count};${c.amount.toFixed(2).replace('.', ',')};${pct}%`);
    });

  lines.push('');

  // Section 3: Itemized Transactions Statement
  lines.push('LANÇAMENTOS DA FATURA');
  lines.push('Data da Compra;Descrição;Categoria;Parcela;Terceiro;Status;Valor (R$)');

  const sortedTxs = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  sortedTxs.forEach(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
    const parcelas = t.installments ? `${t.installments.current}/${t.installments.total}` : 'À vista';
    const terceiro = t.isThirdParty ? `${t.thirdPartyName || 'Terceiro'}${t.reimbursed ? ' (Reembolsado)' : ''}` : '-';
    const statusStr = t.status === 'completed' ? 'Paga' : 'Aberta';
    const valorStr = t.amount.toFixed(2).replace('.', ',');

    lines.push(
      `"${formatDate(t.date)}";"${(t.description || '').replace(/"/g, '""')}";"${resolved.name}";"${parcelas}";"${terceiro}";"${statusStr}";${valorStr}`
    );
  });

  if (sortedTxs.length === 0) {
    lines.push('"-";"Nenhum lançamento nesta fatura";"-";"-";"-";"-";"0,00"');
  }

  downloadCSV(`fatura_${data.periodSlug}.csv`, lines.join('\n'));
}

/**
 * Generates and downloads a formatted PDF statement of a Credit Card Invoice
 */
export function exportInvoicePDF(data: InvoiceExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = data.currency || 'BRL';
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Header Banner
  doc.setFillColor(30, 27, 75); // Indigo 950
  doc.rect(0, 0, 210, 38, 'F');
  doc.setFillColor(147, 51, 234); // Purple 600
  doc.rect(0, 36, 210, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('FINLY', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(196, 181, 253);
  doc.text(`Demonstrativo de Fatura • Cartão ${data.card.name}`, 14, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fatura de ${data.monthLabel}`, 14, 31);

  // Metadata right-aligned
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Gerado em: ${generationDateStr}`, 196, 15, { align: 'right' });
  doc.text(`Vencimento: Dia ${data.card.dueDay} | Fechamento: Dia ${data.card.closingDay}`, 196, 20, { align: 'right' });
  doc.text(`Status: ${data.statusLabel}`, 196, 25, { align: 'right' });

  let currentY = 46;

  // Invoice Summary Cards
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Resumo da Fatura', 14, currentY);
  currentY += 5;

  const cardWidth = 58;
  const cardHeight = 22;
  const cardGap = 7;
  const startX = 14;

  const summaryCards = [
    {
      title: 'TOTAL DA FATURA',
      value: formatCurrency(data.invoiceTotal, currency, false),
      color: [225, 29, 72],
      bgColor: [255, 241, 242],
    },
    {
      title: 'LIMITE TOTAL',
      value: formatCurrency(data.card.limit, currency, false),
      color: [124, 58, 237],
      bgColor: [245, 243, 255],
    },
    {
      title: 'STATUS DA FATURA',
      value: data.statusLabel,
      color: [30, 41, 59],
      bgColor: [241, 245, 249],
    },
  ];

  summaryCards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + cardGap);
    doc.setFillColor(c.bgColor[0], c.bgColor[1], c.bgColor[2]);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(c.color[0], c.color[1], c.color[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 4, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.value, x + 4, currentY + 16);
  });

  currentY += cardHeight + 10;

  // Category Table
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Gastos por Categoria', 14, currentY);
  currentY += 3;

  const catMap: Record<string, { name: string; amount: number; count: number }> = {};
  data.transactions.forEach(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
    const name = resolved.name;
    if (!catMap[name]) catMap[name] = { name, amount: 0, count: 0 };
    catMap[name].amount += t.amount;
    catMap[name].count += 1;
  });

  const catRows = Object.values(catMap)
    .sort((a, b) => b.amount - a.amount)
    .map(c => {
      const pct = data.invoiceTotal > 0 ? ((c.amount / data.invoiceTotal) * 100).toFixed(1) : '0.0';
      return [c.name, String(c.count), formatCurrency(c.amount, currency, false), `${pct}%`];
    });

  if (catRows.length === 0) {
    catRows.push(['Nenhuma despesa nesta fatura', '0', formatCurrency(0, currency, false), '0%']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Categoria', 'Qtd. Lançamentos', 'Total Gasto', '% da Fatura']],
    body: catRows,
    theme: 'striped',
    headStyles: {
      fillColor: [109, 40, 217],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Items Table
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 10;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Lançamentos da Fatura', 14, currentY);
  currentY += 3;

  const sortedTxs = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date));
  const txRows = sortedTxs.map(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
    const parcelas = t.installments ? `${t.installments.current}/${t.installments.total}` : 'À vista';
    const terceiro = t.isThirdParty ? `${t.thirdPartyName || 'Terceiro'}${t.reimbursed ? ' (Reemb.)' : ''}` : '-';
    return [
      formatDate(t.date),
      t.description || 'Sem descrição',
      resolved.name,
      parcelas,
      terceiro,
      formatCurrency(t.amount, currency, false),
    ];
  });

  if (txRows.length === 0) {
    txRows.push(['-', 'Nenhum lançamento nesta fatura', '-', '-', '-', '-']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Data Compra', 'Descrição', 'Categoria', 'Parcela', 'Terceiro', 'Valor']],
    body: txRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 60 },
      2: { cellWidth: 40 },
      3: { halign: 'center', cellWidth: 22 },
      4: { halign: 'center', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 24 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (dataHook) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Finly • Fatura ${data.card.name} (${data.monthLabel}) • Página ${dataHook.pageNumber} de ${pageCount}`,
        105,
        290,
        { align: 'center' }
      );
    },
  });

  doc.save(`fatura_${data.periodSlug}.pdf`);
}
