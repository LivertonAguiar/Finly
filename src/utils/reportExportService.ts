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
  activeChartImage?: string;
  activeChartTitle?: string;
}

/**
 * Generates an executive Donut Chart for category expenses on a high-DPI canvas
 */
function createDonutChartCanvas(
  categoriesMap: Record<string, { name: string; amount: number; count: number }>,
  totalExpense: number,
  currency: string
): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 880;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // White Card Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // Card Header
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
  ctx.fillText('DISTRIBUIÇÃO DE DESPESAS', 30, 44);

  const entries = Object.values(categoriesMap).sort((a, b) => b.amount - a.amount);
  const total = totalExpense > 0 ? totalExpense : entries.reduce((s, e) => s + e.amount, 0);

  if (total <= 0 || entries.length === 0) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma despesa registrada no período', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  // Top 5 categories + Outras
  const palette = ['#7C4DFF', '#0099CC', '#10B981', '#FF8A00', '#EC4899', '#6366F1', '#94A3B8'];
  const topCount = 5;
  const topItems: { name: string; amount: number; color: string; pct: number }[] = [];
  let otherAmount = 0;

  entries.forEach((entry, idx) => {
    if (idx < topCount) {
      topItems.push({
        name: entry.name,
        amount: entry.amount,
        color: palette[idx % palette.length],
        pct: (entry.amount / total) * 100,
      });
    } else {
      otherAmount += entry.amount;
    }
  });

  if (otherAmount > 0) {
    topItems.push({
      name: 'Outras Categorias',
      amount: otherAmount,
      color: palette[topCount % palette.length],
      pct: (otherAmount / total) * 100,
    });
  }

  // Draw Donut
  const cx = 200;
  const cy = 290;
  const outerR = 150;
  const innerR = 92;

  let currentAngle = -Math.PI / 2;

  topItems.forEach(item => {
    const sliceAngle = (item.amount / total) * (Math.PI * 2);
    const endAngle = currentAngle + sliceAngle;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, currentAngle, endAngle, false);
    ctx.arc(cx, cy, innerR, endAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = item.color;
    ctx.fill();

    // 2.5px white gap line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    currentAngle = endAngle;
  });

  // Donut Center Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
  ctx.fillText('TOTAL GASTO', cx, cy - 10);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 19px Helvetica, Arial, sans-serif';
  ctx.fillText(formatCurrency(total, currency, false), cx, cy + 18);

  // Legend on Right
  const legendX = 410;
  let legendY = 95;
  const rowH = 68;

  ctx.textAlign = 'left';
  topItems.forEach(item => {
    // Dot
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(legendX + 8, legendY + 12, 7, 0, Math.PI * 2);
    ctx.fill();

    // Category Name
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
    const cleanName = item.name.length > 20 ? item.name.substring(0, 18) + '...' : item.name;
    ctx.fillText(cleanName, legendX + 24, legendY + 16);

    // Value
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
    ctx.fillText(formatCurrency(item.amount, currency, false), legendX + 24, legendY + 40);

    // Percentage Pill
    ctx.fillStyle = '#F1F5F9';
    const pillW = 68;
    const pillH = 26;
    const pillX = canvas.width - pillW - 30;
    const pillY = legendY + 16;
    ctx.fillRect(pillX, pillY, pillW, pillH);

    ctx.fillStyle = item.color;
    ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.pct.toFixed(1)}%`, pillX + pillW / 2, pillY + 18);

    ctx.textAlign = 'left';
    legendY += rowH;
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates an executive Cash Flow Bar Chart on a high-DPI canvas
 */
function createBarChartCanvas(
  totalIncome: number,
  totalExpense: number,
  netBalance: number,
  currency: string
): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 880;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // White Card Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // Title
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
  ctx.fillText('BALANÇO FINANCEIRO', 30, 44);

  ctx.fillStyle = '#64748B';
  ctx.font = '13px Helvetica, Arial, sans-serif';
  ctx.fillText('Comparativo de Entradas, Saídas e Resultado Líquido', 30, 72);

  const maxVal = Math.max(totalIncome, totalExpense, Math.abs(netBalance), 100);
  const chartBottom = 420;
  const chartTop = 120;
  const chartHeight = chartBottom - chartTop;

  // Grid lines
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1.5;
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 30, y);
    ctx.stroke();

    const gridVal = maxVal * (1 - i / 4);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(gridVal, currency, false), canvas.width - 35, y - 6);
  }

  // Baseline
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, chartBottom);
  ctx.lineTo(canvas.width - 30, chartBottom);
  ctx.stroke();

  interface BarItem {
    label: string;
    amount: number;
    displayAmount: number;
    color: string;
    x: number;
  }

  // 3 Bars: Receitas, Despesas, Saldo
  const bars: BarItem[] = [
    {
      label: 'Receitas',
      amount: totalIncome,
      displayAmount: totalIncome,
      color: '#10B981',
      x: 100,
    },
    {
      label: 'Despesas',
      amount: totalExpense,
      displayAmount: totalExpense,
      color: '#E11D48',
      x: 350,
    },
    {
      label: 'Saldo Líquido',
      amount: Math.max(0, netBalance),
      displayAmount: netBalance,
      color: netBalance >= 0 ? '#7C4DFF' : '#F59E0B',
      x: 600,
    },
  ];

  const barW = 160;

  bars.forEach(b => {
    const h = (b.amount / maxVal) * chartHeight;
    const barY = chartBottom - h;

    // Draw Bar
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, barY, barW, h);

    // Value label on top of bar
    ctx.fillStyle = b.color;
    ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    const valStr = formatCurrency(b.displayAmount, currency, false);
    ctx.fillText(valStr, b.x + barW / 2, Math.max(barY - 12, chartTop - 8));

    // Label below bar
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 16px Helvetica, Arial, sans-serif';
    ctx.fillText(b.label, b.x + barW / 2, chartBottom + 35);

    // Percentage of income (for expense and balance)
    if (totalIncome > 0 && b.label !== 'Receitas') {
      const pct = (b.displayAmount / totalIncome) * 100;
      ctx.fillStyle = '#64748B';
      ctx.font = '13px Helvetica, Arial, sans-serif';
      ctx.fillText(`${pct.toFixed(1)}% das receitas`, b.x + barW / 2, chartBottom + 58);
    }
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates and downloads an Executive PDF Financial Report with Charts & Tables
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

  // --- 1. EXECUTIVE SUMMARY CARDS ---
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

  currentY += cardHeight + 8;

  // Aggregate expenses by category for charts & tables
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

  // --- 2. SECTION: VISUAL CHARTS & ANALYTICS ---
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Panorama Visual e Gráficos Analíticos', 14, currentY);
  currentY += 4;

  // Generate Programmatic Donut & Bar Charts
  const donutChartDataUrl = createDonutChartCanvas(expenseCategoriesMap, data.totalExpense, currency);
  const barChartDataUrl = createBarChartCanvas(data.totalIncome, data.totalExpense, data.netBalance, currency);

  const chartCardWidth = 88;
  const chartCardHeight = 55;

  if (donutChartDataUrl && barChartDataUrl) {
    // 1. Donut Chart on Left (X: 14)
    doc.addImage(donutChartDataUrl, 'PNG', 14, currentY, chartCardWidth, chartCardHeight);
    // 2. Bar Chart on Right (X: 108)
    doc.addImage(barChartDataUrl, 'PNG', 108, currentY, chartCardWidth, chartCardHeight);
    currentY += chartCardHeight + 8;
  }

  // If activeChartImage is provided from screen capture, embed it as featured visual
  if (data.activeChartImage) {
    if (currentY > 195) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(`2.1 Visualização da Análise: ${data.activeChartTitle || 'Gráfico Interativo'}`, 14, currentY);
    currentY += 4;

    const activeChartW = 182;
    const activeChartH = 75;

    // Card Frame
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, activeChartW, activeChartH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, activeChartW, activeChartH, 2, 2, 'S');

    doc.addImage(data.activeChartImage, 'PNG', 15, currentY + 1, activeChartW - 2, activeChartH - 2);
    currentY += activeChartH + 8;
  }

  // --- 3. SECTION: CATEGORY BREAKDOWN TABLE ---
  if (currentY > 210) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('3. Despesas por Categoria', 14, currentY);
  currentY += 3;

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
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center', cellWidth: 30 },
      2: { halign: 'right', cellWidth: 42 },
      3: { halign: 'right', cellWidth: 40 },
    },
    margin: { left: 14, right: 14 },
    didDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 3) {
        const raw = hookData.cell.raw as string;
        const pct = parseFloat(raw.replace('%', '')) || 0;
        const barX = hookData.cell.x + 3;
        const barY = hookData.cell.y + hookData.cell.height - 3;
        const maxW = hookData.cell.width - 6;
        const fillW = Math.max(0, Math.min(maxW, (pct / 100) * maxW));

        // Background progress rail
        doc.setFillColor(226, 232, 240); // Slate 200
        doc.roundedRect(barX, barY, maxW, 1.6, 0.8, 0.8, 'F');
        // Filled bar
        if (fillW > 0) {
          doc.setFillColor(124, 58, 237); // Purple 600
          doc.roundedRect(barX, barY, fillW, 1.6, 0.8, 0.8, 'F');
        }
      }
    },
  });

  // --- 4. SECTION: DETAILED STATEMENT TABLE ---
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 10;

  // If close to page bottom, add page
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('4. Demonstrativo Detalhado de Lançamentos', 14, currentY);
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
