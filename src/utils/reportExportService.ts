import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Account, CreditCard } from '../types';
import { ViewRegime } from './invoiceCalculator';
import { formatCurrency, formatDate } from './formatters';
import { resolveCategory } from './categoryResolver';
import { saveOrShareFile } from './fileDownloadHelper';
import { getCardBankInfo } from './bankLogos';

export interface ReportExportData {
  periodLabel: string;
  periodSlug: string;
  viewRegime: ViewRegime;
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
export async function exportReportPDF(data: ReportExportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = data.currency || 'BRL';
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const regimeLabel = data.viewRegime === 'invoice_month' ? 'Competência / Fatura do Cartão' : data.viewRegime === 'due_date' ? 'Vencimento da Fatura (Caixa)' : 'Data da Compra';

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

  // Save / Share PDF (Mobile native, mobile web, or desktop)
  const filename = `relatorio_finly_${data.periodSlug}.pdf`;
  const blob = doc.output('blob');
  await saveOrShareFile({
    filename,
    blob,
    mimeType: 'application/pdf',
    dialogTitle: 'Relatório Executivo Finly (PDF)',
  });
}

/**
 * Generates and downloads a CSV Report with Summary and Transactions
 */
export async function exportReportCSV(data: ReportExportData): Promise<void> {
  const currency = data.currency || 'BRL';
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
  const regimeLabel = data.viewRegime === 'invoice_month' ? 'Competência / Fatura do Cartão' : data.viewRegime === 'due_date' ? 'Vencimento da Fatura (Caixa)' : 'Data da Compra';

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
  await downloadCSV(`relatorio_finly_${data.periodSlug}.csv`, lines.join('\n'), 'Relatório Finly (CSV)');
}

/**
 * Triggers a universal file download or share using a UTF-8 BOM Blob.
 * Compatible with native Android/iOS (Capacitor), mobile web browsers, and desktop.
 */
export async function downloadCSV(filename: string, content: string, dialogTitle?: string): Promise<void> {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  await saveOrShareFile({
    filename,
    blob,
    mimeType: 'text/csv;charset=utf-8;',
    dialogTitle: dialogTitle || `Exportar ${filename}`,
  });
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
  availableLimit?: number;
  totalCommitted?: number;
  isPaid?: boolean;
  paymentDate?: string;
  paymentAmount?: number;
}

/**
 * Generates and downloads a detailed CSV of a Credit Card Invoice statement
 */
export async function exportInvoiceCSV(data: InvoiceExportData): Promise<void> {
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

  await downloadCSV(`fatura_${data.periodSlug}.csv`, lines.join('\n'), `Fatura ${data.card.name} (CSV)`);
}

/**
 * Converts a hex color string (#RRGGBB or #RGB) to an [R, G, B] tuple
 */
function hexToRgb(hex?: string): [number, number, number] {
  if (!hex) return [130, 10, 209];
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [isNaN(r) ? 130 : r, isNaN(g) ? 10 : g, isNaN(b) ? 209 : b];
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [isNaN(r) ? 130 : r, isNaN(g) ? 10 : g, isNaN(b) ? 209 : b];
  }
  return [130, 10, 209];
}

/**
 * Creates a deeper shade of an RGB color for rich header backgrounds
 */
function darkenRgb([r, g, b]: [number, number, number], factor = 0.32): [number, number, number] {
  return [
    Math.max(0, Math.min(255, Math.round(r * factor))),
    Math.max(0, Math.min(255, Math.round(g * factor))),
    Math.max(0, Math.min(255, Math.round(b * factor))),
  ];
}

/**
 * Determines whether text over this background color should be white or dark slate
 */
function getContrastTextColor([r, g, b]: [number, number, number]): [number, number, number] {
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance >= 160 ? [15, 23, 42] : [255, 255, 255];
}

/**
 * Generates an executive Donut Chart canvas for invoice category distribution
 */
function createInvoiceDonutChartCanvas(
  categoriesMap: Record<string, { name: string; amount: number; count: number }>,
  totalAmount: number,
  currency: string,
  primaryHex: string
): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 880;
  canvas.height = 340;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  const entries = Object.values(categoriesMap).sort((a, b) => b.amount - a.amount);
  const total = totalAmount > 0 ? totalAmount : entries.reduce((s, e) => s + e.amount, 0);

  if (total <= 0 || entries.length === 0) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '16px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma despesa categorizada nesta fatura', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  // Palette centered around the bank's primary color
  const palette = [
    primaryHex,
    '#6366F1',
    '#0EA5E9',
    '#10B981',
    '#F59E0B',
    '#EC4899',
    '#8B5CF6',
    '#64748B',
  ];

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
      name: 'Outras',
      amount: otherAmount,
      color: palette[topCount % palette.length],
      pct: (otherAmount / total) * 100,
    });
  }

  // Draw Donut on the left
  const cx = 150;
  const cy = 170;
  const outerR = 110;
  const innerR = 68;
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

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    currentAngle = endAngle;
  });

  // Donut Center Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
  ctx.fillText('TOTAL FATURA', cx, cy - 8);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
  ctx.fillText(formatCurrency(total, currency, false), cx, cy + 16);

  // Legend on Right
  const legendX = 320;
  let legendY = 32;
  const rowH = 48;

  ctx.textAlign = 'left';
  topItems.forEach(item => {
    // Color Dot
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(legendX + 6, legendY + 10, 6, 0, Math.PI * 2);
    ctx.fill();

    // Category Name
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
    const cleanName = item.name.length > 22 ? item.name.substring(0, 20) + '...' : item.name;
    ctx.fillText(cleanName, legendX + 22, legendY + 14);

    // Value
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 13px Helvetica, Arial, sans-serif';
    ctx.fillText(formatCurrency(item.amount, currency, false), legendX + 22, legendY + 32);

    // Progress bar
    const barX = legendX + 220;
    const maxBarW = 210;
    const barY = legendY + 7;
    const barH = 7;
    const fillW = Math.max(4, (item.pct / 100) * maxBarW);

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(barX, barY, maxBarW, barH);
    ctx.fillStyle = item.color;
    ctx.fillRect(barX, barY, fillW, barH);

    // Percentage Pill
    const pillW = 62;
    const pillH = 22;
    const pillX = canvas.width - pillW - 25;
    const pillY = legendY + 2;

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(pillX, pillY, pillW, pillH);

    ctx.fillStyle = item.color;
    ctx.font = 'bold 12px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.pct.toFixed(1)}%`, pillX + pillW / 2, pillY + 15);

    ctx.textAlign = 'left';
    legendY += rowH;
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates and downloads an executive, bank-branded PDF statement of a Credit Card Invoice
 */
export async function exportInvoicePDF(data: InvoiceExportData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = data.currency || 'BRL';
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // 1. Bank Theme & Branding Resolution
  const bank = getCardBankInfo(data.card);
  const primaryHex = data.card.color || bank?.color || '#820AD1';
  const primaryRgb = hexToRgb(primaryHex);
  const darkRgb = darkenRgb(primaryRgb, 0.32);
  const textOnPrimary = getContrastTextColor(primaryRgb);
  const bankName = bank?.name || data.card.name;
  const bankCode = bank?.code && bank.code !== '000' ? bank.code : '';
  const cardBrand = (data.card.brand || 'Crédito').toUpperCase();

  // Closing day, due day & best buy day calculation
  const closingDay = data.card.closingDay;
  const dueDay = data.card.dueDay;
  const bestBuyDay = closingDay + 1 > 31 ? 1 : closingDay + 1;

  // Limits & Committed calculations
  const cardLimit = data.card.limit || 0;
  const availableLimit = typeof data.availableLimit === 'number'
    ? data.availableLimit
    : Math.max(0, cardLimit - data.invoiceTotal);
  const usedPercentage = cardLimit > 0 ? Math.min(100, Math.max(0, ((cardLimit - availableLimit) / cardLimit) * 100)) : 0;

  // 2. Executive Header Banner (Dark bank shade with primary accent line)
  doc.setFillColor(darkRgb[0], darkRgb[1], darkRgb[2]);
  doc.rect(0, 0, 210, 44, 'F');
  // Bottom accent line
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 42.5, 210, 1.5, 'F');

  // Title area
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('FINLY', 14, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text('•  DEMONSTRATIVO DE FATURA', 35, 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fatura de ${data.monthLabel}`, 14, 22);

  // Bank badge pill
  const bankPillText = `${bankName}${bankCode ? ` (${bankCode})` : ''} • ${cardBrand}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const pillTextWidth = doc.getTextWidth(bankPillText);
  const pillW = pillTextWidth + 10;
  const pillH = 6;
  const pillX = 14;
  const pillY = 26;

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(pillX, pillY, pillW, pillH, 1.5, 1.5, 'F');
  doc.setTextColor(textOnPrimary[0], textOnPrimary[1], textOnPrimary[2]);
  doc.text(bankPillText, pillX + 5, pillY + 4.3);

  // Subtitle with closing & due dates
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Fechamento: Todo dia ${closingDay}  |  Vencimento: Todo dia ${dueDay}`, 14, 38);

  // 3. Mini Virtual Credit Card on Top Right
  const cardX = 144;
  const cardY = 5.5;
  const cardW = 52;
  const cardH = 33;

  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2.5, 2.5, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2.5, 2.5, 'S');

  // Chip
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(cardX + 4, cardY + 4.5, 7.5, 5.5, 1, 1, 'F');
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(cardX + 4, cardY + 7.2, cardX + 11.5, cardY + 7.2);
  doc.line(cardX + 7.7, cardY + 4.5, cardX + 7.7, cardY + 10);

  // Contactless wave
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(')))', cardX + 13.5, cardY + 8.5);

  // Brand Logo / Badge
  if (cardBrand.includes('MASTER')) {
    doc.setFillColor(235, 0, 27);
    doc.circle(cardX + cardW - 11, cardY + 7.5, 3.2, 'F');
    doc.setFillColor(255, 95, 0);
    doc.circle(cardX + cardW - 6.5, cardY + 7.5, 3.2, 'F');
  } else if (cardBrand.includes('VISA')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('VISA', cardX + cardW - 5, cardY + 8.5, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(cardBrand, cardX + cardW - 4, cardY + 8, { align: 'right' });
  }

  // Masked Number
  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  const last4 = (data.card.id || '9876').slice(-4);
  doc.text(`••••  ••••  ••••  ${last4}`, cardX + 4, cardY + 18);

  // Cardholder and Due
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(226, 232, 240);
  const holderRaw = data.userEmail ? data.userEmail.split('@')[0] : data.card.name;
  const holderName = holderRaw.toUpperCase().substring(0, 16);
  doc.text(holderName, cardX + 4, cardY + 26);
  doc.text(`VENC: DIA ${dueDay.toString().padStart(2, '0')}`, cardX + cardW - 4, cardY + 26, { align: 'right' });

  // 4. Metadata Info Bar (Between Header and Cards)
  let currentY = 48;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 7, 1.2, 1.2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, currentY, 182, 7, 1.2, 1.2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Competência: ${data.monthLabel}`, 18, currentY + 4.7);
  doc.setFont('helvetica', 'bold');
  doc.text(`Fechamento: Todo dia ${closingDay}  |  Vencimento: Todo dia ${dueDay}`, 105, currentY + 4.7, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Emissão: ${generationDateStr}`, 192, currentY + 4.7, { align: 'right' });
  currentY += 12;

  // 5. Section 1: Resumo Executivo da Fatura (4 Modern KPI Cards)
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Resumo Executivo da Fatura', 14, currentY);
  currentY += 4.5;

  const cardWidth = 43;
  const cardHeight = 23;
  const cardGap = 3.33;
  const startX = 14;

  const isPaidStatus = data.isPaid || data.statusLabel.toLowerCase().includes('paga');
  const isOverdueStatus = data.statusLabel.toLowerCase().includes('venc');

  const summaryCards = [
    {
      title: 'TOTAL DA FATURA',
      value: formatCurrency(data.invoiceTotal, currency, false),
      sub: 'Valor do ciclo atual',
      accentColor: [225, 29, 72],
      badge: null,
      bar: null,
    },
    {
      title: 'FECHAMENTO',
      value: `Todo dia ${closingDay}`,
      sub: `Melhor compra: Dia ${bestBuyDay}`,
      accentColor: [16, 185, 129],
      badge: null,
      bar: null,
    },
    {
      title: 'VENCIMENTO',
      value: `Todo dia ${dueDay}`,
      sub: isPaidStatus ? 'Pagamento efetuado' : 'Aguardando liquidação',
      accentColor: isPaidStatus ? [16, 185, 129] : isOverdueStatus ? [225, 29, 72] : [245, 158, 11],
      badge: data.statusLabel.toUpperCase(),
      bar: null,
    },
    {
      title: 'LIMITE TOTAL',
      value: formatCurrency(cardLimit, currency, false),
      sub: `Disponível: ${formatCurrency(availableLimit, currency, false)}`,
      accentColor: primaryRgb,
      badge: null,
      bar: usedPercentage,
    },
  ];

  summaryCards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + cardGap);
    // Background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.8, 1.8, 'F');
    // Border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.8, 1.8, 'S');

    // Left accent stripe
    doc.setFillColor(c.accentColor[0], c.accentColor[1], c.accentColor[2]);
    doc.roundedRect(x, currentY, 2, cardHeight, 1, 1, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 5, currentY + 6);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(idx === 0 ? 11 : 10);
    doc.setTextColor(idx === 0 ? c.accentColor[0] : 15, idx === 0 ? c.accentColor[1] : 23, idx === 0 ? c.accentColor[2] : 42);
    doc.text(c.value, x + 5, currentY + 13.5);

    // Subtitle or Bar
    if (c.bar !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text(c.sub, x + 5, currentY + 18.5);

      // Usage bar
      const barX = x + 5;
      const barY = currentY + 20;
      const barW = cardWidth - 10;
      const barH = 1.6;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');
      const fillW = Math.max(1, (c.bar / 100) * barW);
      doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, 'F');
    } else if (c.badge) {
      // Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      const isOk = c.badge.includes('PAGA');
      const isErr = c.badge.includes('VENC');
      doc.setFillColor(isOk ? 220 : isErr ? 254 : 254, isOk ? 252 : isErr ? 226 : 243, isOk ? 231 : isErr ? 226 : 199);
      const badgeW = doc.getTextWidth(`● ${c.badge}`) + 5;
      doc.roundedRect(x + 5, currentY + 15.5, Math.min(cardWidth - 8, badgeW), 4.5, 1, 1, 'F');
      doc.setTextColor(isOk ? 22 : isErr ? 153 : 146, isOk ? 101 : isErr ? 27 : 64, isOk ? 52 : isErr ? 27 : 14);
      doc.text(`● ${c.badge}`, x + 7.5, currentY + 18.8);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(idx === 1 ? 16 : 100, idx === 1 ? 185 : 116, idx === 1 ? 129 : 139);
      doc.text(c.sub, x + 5, currentY + 19);
    }
  });

  currentY += cardHeight + 8;

  // 6. Section 2: Distribuição de Gastos da Fatura (Donut Chart + Table)
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Distribuição de Gastos da Fatura', 14, currentY);
  currentY += 3.5;

  const catMap: Record<string, { name: string; amount: number; count: number }> = {};
  data.transactions.forEach(t => {
    const resolved = resolveCategory(data.categories, t.categoryId, t.subcategoryId, 'expense');
    const name = resolved.name;
    if (!catMap[name]) catMap[name] = { name, amount: 0, count: 0 };
    catMap[name].amount += t.amount;
    catMap[name].count += 1;
  });

  const donutImg = createInvoiceDonutChartCanvas(catMap, data.invoiceTotal, currency, primaryHex);
  if (donutImg) {
    doc.addImage(donutImg, 'PNG', 14, currentY, 182, 52);
    currentY += 56;
  }

  // Category Table
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
      fillColor: [primaryRgb[0], primaryRgb[1], primaryRgb[2]],
      textColor: [textOnPrimary[0], textOnPrimary[1], textOnPrimary[2]],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 35 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 27 },
    },
    margin: { left: 14, right: 14 },
  });

  // 7. Section 3: Lançamentos Detalhados da Fatura
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 9;
  if (currentY > 215) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. Lançamentos Detalhados da Fatura', 14, currentY);
  currentY += 3.5;

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

  // Summary row at the bottom of the table
  txRows.push([
    '',
    'TOTAL DA FATURA',
    '',
    '',
    `${sortedTxs.length} item(ns)`,
    formatCurrency(data.invoiceTotal, currency, false),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Data Compra', 'Descrição / Estabelecimento', 'Categoria', 'Parcela', 'Terceiro', 'Valor']],
    body: txRows,
    theme: 'grid',
    headStyles: {
      fillColor: [darkRgb[0], darkRgb[1], darkRgb[2]],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    styles: { fontSize: 7.5, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 62 },
      2: { cellWidth: 38 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (dataHook) => {
      // Highlight last row (Total row)
      if (dataHook.row.index === txRows.length - 1) {
        dataHook.cell.styles.fontStyle = 'bold';
        dataHook.cell.styles.fillColor = [241, 245, 249];
        if (dataHook.column.index === 5) {
          dataHook.cell.styles.textColor = [225, 29, 72];
        }
      }
    },
    didDrawPage: (dataHook) => {
      const pageCount = doc.getNumberOfPages();
      const pageY = 290;

      // Top subtle border line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(14, pageY - 3, 196, pageY - 3);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Finly • ${bankName}${bankCode ? ` (${bankCode})` : ''} • Fatura ${data.monthLabel}`,
        14,
        pageY
      );
      doc.text(
        `Página ${dataHook.pageNumber} de ${pageCount}`,
        196,
        pageY,
        { align: 'right' }
      );
      doc.setFontSize(6.5);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `Autenticação: FINLY-${data.periodSlug.toUpperCase()}-${Math.abs(Math.round(data.invoiceTotal * 100))}`,
        105,
        pageY + 3,
        { align: 'center' }
      );
    },
  });

  // Save / Share PDF (Mobile native, mobile web, or desktop)
  const filename = `fatura_${data.periodSlug}.pdf`;
  const blob = doc.output('blob');
  await saveOrShareFile({
    filename,
    blob,
    mimeType: 'application/pdf',
    dialogTitle: `Fatura ${data.card.name} (PDF)`,
  });
}

