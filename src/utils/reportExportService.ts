import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Category, Account, CreditCard } from '../types';
import { ViewRegime } from './invoiceCalculator';
import { formatCurrency, formatDate } from './formatters';
import { resolveCategory } from './categoryResolver';
import { saveOrShareFile } from './fileDownloadHelper';
import { getCardBankInfo, BankLogo, CardBrandLogo } from './bankLogos';

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

import {
  type BankPdfTheme,
  BANK_PDF_THEMES,
  resolveBankPdfTheme,
  hexToRgb,
  darkenRgb,
} from './bankPdfThemes';

export type { BankPdfTheme };
export {
  BANK_PDF_THEMES,
  resolveBankPdfTheme,
  hexToRgb,
  darkenRgb,
};

/**
 * Rasterizes an SVG markup string into a high-resolution PNG data URL for jsPDF embedding
 */
export async function rasterizeSvgToPng(svgString: string, width = 160, height = 160): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let cleanSvg = svgString;
      if (!cleanSvg.includes('xmlns=')) {
        cleanSvg = cleanSvg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
      }
      if (!cleanSvg.includes('width=')) {
        cleanSvg = cleanSvg.replace('<svg ', `<svg width="${width}" height="${height}" `);
      }
      const svgBase64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cleanSvg);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = svgBase64;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Draws the official Finly header logo and branding symbol
 */
function drawFinlyHeaderLogo(doc: jsPDF, x: number, y: number, subtitle: string) {
  // Blue circular badge with Finly symbol
  doc.setFillColor(2, 132, 199); // Sky 600
  doc.circle(x + 4, y + 4, 4, 'F');
  doc.setFillColor(56, 189, 248); // Sky 400
  doc.circle(x + 4, y + 4, 2.5, 'F');

  // Piggy ear & coin notch
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 3.4, y + 3.2, 0.8, 'F');

  // FINLY title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text('FINLY', x + 10.5, y + 5.5);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`|  ${subtitle}`, x + 27.5, y + 5.5);
}

/**
 * Draws a realistic, high-end credit card mockup on the top-right of the header
 */
function drawRealisticCreditCardMockup(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  theme: BankPdfTheme,
  card: CreditCard,
  bankLogoPng: string | null,
  brandLogoPng: string | null
) {
  const cardBg = theme.cardBg;
  const brandName = (card.brand || theme.defaultBrand || 'Mastercard').toLowerCase();

  // Drop shadow hint
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(x + 0.6, y + 0.8, w, h, 2.5, 2.5, 'F');

  // Card Body
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'F');

  // Subtle specular highlight diagonal stroke across card
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, 2.5, 2.5, 'S');

  // Top Left: Metallic EMV Chip
  const chipX = x + 4;
  const chipY = y + 7.5;
  const chipW = 6.2;
  const chipH = 4.6;

  doc.setFillColor(232, 220, 184); // Champagne gold
  doc.roundedRect(chipX, chipY, chipW, chipH, 0.8, 0.8, 'F');
  doc.setDrawColor(180, 155, 110);
  doc.setLineWidth(0.15);
  doc.roundedRect(chipX, chipY, chipW, chipH, 0.8, 0.8, 'S');
  // Chip circuit contact lines
  doc.line(chipX, chipY + 2.3, chipX + chipW, chipY + 2.3);
  doc.line(chipX + 2.4, chipY, chipX + 2.4, chipY + chipH);
  doc.line(chipX + 4.2, chipY, chipX + 4.2, chipY + chipH);

  // Contactless waves beside chip
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.25);
  const nfcX = chipX + chipW + 2.4;
  const nfcY = chipY + 2.3;
  // 3 subtle wave arcs
  doc.line(nfcX, nfcY - 1.6, nfcX + 0.8, nfcY);
  doc.line(nfcX + 0.8, nfcY, nfcX, nfcY + 1.6);

  doc.line(nfcX + 1.2, nfcY - 2.2, nfcX + 2.2, nfcY);
  doc.line(nfcX + 2.2, nfcY, nfcX + 1.2, nfcY + 2.2);

  // Top Right: Institution wordmark / logo in white (aspect ratio 1:1 rigoroso)
  if (bankLogoPng) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + w - 12.5, y + 3.2, 9, 6.5, 1.2, 1.2, 'F');
    doc.addImage(bankLogoPng, 'PNG', x + w - 11, y + 3.45, 6, 6);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    const displayBankName = theme.name.toLowerCase();
    doc.text(displayBankName, x + w - 3.5, y + 7.5, { align: 'right' });
  }

  // Bottom Right: Official Brand Logo
  if (brandLogoPng) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x + w - 13.5, y + h - 9, 10.5, 6.8, 1.2, 1.2, 'F');
    doc.addImage(brandLogoPng, 'PNG', x + w - 13, y + h - 8.5, 9.5, 5.8);
  } else if (brandName.includes('master')) {
    // Exact vector Mastercard overlapping dual circles
    const mcCenterY = y + h - 6;
    const mcRadius = 2.7;
    const mcLeftX = x + w - 9.5;
    const mcRightX = mcLeftX + 3.2;

    // Left Red Circle
    doc.setFillColor(235, 0, 27); // Mastercard Red
    doc.circle(mcLeftX, mcCenterY, mcRadius, 'F');

    // Right Yellow Circle
    doc.setFillColor(247, 158, 27); // Mastercard Yellow
    doc.circle(mcRightX, mcCenterY, mcRadius, 'F');

    // Overlapping intersection
    doc.setFillColor(255, 95, 0); // Orange intersection
    doc.ellipse((mcLeftX + mcRightX) / 2, mcCenterY, 1.1, mcRadius - 0.3, 'F');
  } else if (brandName.includes('visa')) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('VISA', x + w - 4, y + h - 4.5, { align: 'right' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(card.brand || 'CARD', x + w - 4, y + h - 4.5, { align: 'right' });
  }

  // Bottom Left: Masked card digits (Formatação ASCII 100% segura no jsPDF, exibindo XXXX na ausência)
  doc.setFont('courier', 'bold');
  doc.setFontSize(6.2);
  doc.setTextColor(255, 255, 255);
  const rawDigits = (card.last4Digits || '').replace(/\D/g, '').trim();
  const digitsDisplay = rawDigits.length >= 2 ? `**** **** **** ${rawDigits}` : `**** **** **** XXXX`;
  doc.text(digitsDisplay, x + 4, y + h - 4.8);
}

/**
 * Draws the smooth Executive Header Gradient Banner across the top
 */
function drawHeaderBanner(doc: jsPDF, startRgb: [number, number, number], endRgb: [number, number, number], height = 44) {
  const steps = 42;
  const stepWidth = 210 / steps;

  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const r = Math.round(startRgb[0] + (endRgb[0] - startRgb[0]) * t);
    const g = Math.round(startRgb[1] + (endRgb[1] - startRgb[1]) * t);
    const b = Math.round(startRgb[2] + (endRgb[2] - startRgb[2]) * t);

    doc.setFillColor(r, g, b);
    doc.rect(i * stepWidth, 0, stepWidth + 0.3, height, 'F');
  }
}

/**
 * Draws the modern institution identification pill badge
 */
function drawInstitutionPill(
  doc: jsPDF,
  x: number,
  y: number,
  labelText: string,
  accentRgb: [number, number, number],
  bankLogoPng: string | null,
  brandLogoPng: string | null
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const textWidth = doc.getTextWidth(labelText);
  const pillW = textWidth + (bankLogoPng ? 14 : 9) + (brandLogoPng ? 12 : 5);
  const pillH = 6.2;

  // White / Light Slate pill background
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, pillW, pillH, 1.8, 1.8, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, pillW, pillH, 1.8, 1.8, 'S');

  let curX = x + 2.5;

  // Mini emblem icon on left
  if (bankLogoPng) {
    doc.addImage(bankLogoPng, 'PNG', curX, y + 1, 4.2, 4.2);
    curX += 5.5;
  } else {
    doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.roundedRect(curX, y + 1.2, 3.8, 3.8, 0.8, 0.8, 'F');
    curX += 5;
  }

  // Text
  doc.setTextColor(30, 41, 59);
  doc.text(labelText, curX, y + 4.4);
  curX += textWidth + 3;

  // Mini Brand Logo on right if available
  if (brandLogoPng) {
    doc.addImage(brandLogoPng, 'PNG', curX, y + 1.2, 6.5, 3.8);
  }

  return pillW;
}

/**
 * Generates an executive Donut Chart canvas for invoice category distribution.
 * Rendered at 1456x416 to guarantee an exact 3.5:1 ratio matching the 182x52mm PDF box,
 * ensuring the donut is rendered as a geometrically perfect 1:1 circle with zero distortion.
 */
function createInvoiceDonutChartCanvas(
  categoriesMap: Record<string, { name: string; amount: number; count: number }>,
  totalAmount: number,
  currency: string,
  primaryHex: string,
  centerLabel = 'TOTAL FATURA'
): string | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1456;
  canvas.height = 416;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle Border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  const entries = Object.values(categoriesMap).sort((a, b) => b.amount - a.amount);
  const total = totalAmount > 0 ? totalAmount : entries.reduce((s, e) => s + e.amount, 0);

  if (total <= 0 || entries.length === 0) {
    ctx.fillStyle = '#94A3B8';
    ctx.font = '20px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nenhuma despesa categorizada nesta fatura', canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  }

  // Rich harmonized executive palette
  const palette = [
    primaryHex,
    '#6366F1', // Indigo
    '#0EA5E9', // Sky
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#64748B', // Slate
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

  // Draw Donut on the left - perfectly centered vertically at cy = 208 with 1:1 circle geometry
  const cx = 205;
  const cy = 208;
  const outerR = 148;
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

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.stroke();

    currentAngle = endAngle;
  });

  // Donut Center Text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
  ctx.fillText(centerLabel, cx, cy - 10);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 24px Helvetica, Arial, sans-serif';
  ctx.fillText(formatCurrency(total, currency, false), cx, cy + 20);

  // Legend on Right
  const legendX = 420;
  let legendY = 32;
  const rowH = 58;

  ctx.textAlign = 'left';
  topItems.forEach(item => {
    // Color Dot
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(legendX + 10, legendY + 16, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // Category Name
    ctx.fillStyle = '#1E293B';
    ctx.font = 'bold 17px Helvetica, Arial, sans-serif';
    const cleanName = item.name.length > 24 ? item.name.substring(0, 22) + '...' : item.name;
    ctx.fillText(cleanName, legendX + 30, legendY + 22);

    // Value
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
    ctx.fillText(formatCurrency(item.amount, currency, false), legendX + 30, legendY + 44);

    // Progress bar
    const barX = legendX + 330;
    const maxBarW = 380;
    const barY = legendY + 15;
    const barH = 10;
    const fillW = Math.max(4, (item.pct / 100) * maxBarW);

    ctx.fillStyle = '#F1F5F9';
    ctx.fillRect(barX, barY, maxBarW, barH);
    ctx.fillStyle = item.color;
    ctx.fillRect(barX, barY, fillW, barH);

    // Percentage Pill
    const pillW = 76;
    const pillH = 30;
    const pillX = canvas.width - pillW - 24;
    const pillY = legendY + 6;

    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(pillX, pillY, pillW, pillH);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(pillX, pillY, pillW, pillH);

    ctx.fillStyle = item.color;
    ctx.font = 'bold 15px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${item.pct.toFixed(1)}%`, pillX + pillW / 2, pillY + 20);

    ctx.textAlign = 'left';
    legendY += rowH;
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates an executive Donut Chart canvas for general reports/extratos
 */
function createDonutChartCanvas(
  categoriesMap: Record<string, { name: string; amount: number; count: number }>,
  totalExpense: number,
  currency: string
): string | null {
  return createInvoiceDonutChartCanvas(categoriesMap, totalExpense, currency, '#7C3AED', 'TOTAL GASTOS');
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
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 18px Helvetica, Arial, sans-serif';
  ctx.fillText('BALANÇO FINANCEIRO', 26, 36);

  const maxVal = Math.max(totalIncome, totalExpense, Math.abs(netBalance), 100);
  const chartBottom = 330;
  const chartTop = 80;
  const chartHeight = chartBottom - chartTop;

  // Grid lines
  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 4; i++) {
    const y = chartTop + (chartHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(26, y);
    ctx.lineTo(canvas.width - 26, y);
    ctx.stroke();

    const gridVal = maxVal * (1 - i / 4);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatCurrency(gridVal, currency, false), canvas.width - 30, y - 5);
  }

  // Baseline
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(26, chartBottom);
  ctx.lineTo(canvas.width - 26, chartBottom);
  ctx.stroke();

  const bars = [
    { label: 'Receitas', amount: totalIncome, color: '#10B981', x: 80 },
    { label: 'Despesas', amount: totalExpense, color: '#E11D48', x: 330 },
    { label: 'Saldo Líquido', amount: Math.max(0, netBalance), color: netBalance >= 0 ? '#7C3AED' : '#F59E0B', x: 580 },
  ];

  const barW = 160;
  bars.forEach(b => {
    const h = (b.amount / maxVal) * chartHeight;
    const barY = chartBottom - h;

    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, barY, barW, h);

    ctx.fillStyle = b.color;
    ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(formatCurrency(b.amount, currency, false), b.x + barW / 2, Math.max(barY - 10, chartTop - 4));

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 14px Helvetica, Arial, sans-serif';
    ctx.fillText(b.label, b.x + barW / 2, chartBottom + 28);
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

  // 1. Resolve Bank Theme & Visuals
  const theme = resolveBankPdfTheme(data.card);
  const closingDay = data.card.closingDay;
  const dueDay = data.card.dueDay;
  const bestBuyDay = closingDay + 1 > 31 ? 1 : closingDay + 1;

  const cardLimit = data.card.limit || 0;
  const availableLimit = typeof data.availableLimit === 'number'
    ? data.availableLimit
    : Math.max(0, cardLimit - data.invoiceTotal);
  const usedPercentage = cardLimit > 0 ? Math.min(100, Math.max(0, ((cardLimit - availableLimit) / cardLimit) * 100)) : 0;

  // 2. Rasterize Official Bank and Card Brand Logos
  let bankLogoPng: string | null = null;
  let brandLogoPng: string | null = null;

  const bankIdentifier = (theme.id && theme.id !== 'custom')
    ? theme.id
    : (data.card.bankId || data.card.name);

  try {
    const bankSvg = renderToStaticMarkup(
      React.createElement(BankLogo, {
        nameOrId: bankIdentifier,
        size: 140,
        radius: 8,
      })
    );
    bankLogoPng = await rasterizeSvgToPng(bankSvg, 140, 140);
  } catch (err) {
    console.warn('Notice: Failed to rasterize bank logo:', err);
  }

  try {
    const brandSvg = renderToStaticMarkup(
      React.createElement(CardBrandLogo, {
        brand: data.card.brand || theme.defaultBrand || 'Mastercard',
        size: 140,
        radius: 6,
      })
    );
    brandLogoPng = await rasterizeSvgToPng(brandSvg, 160, 110);
  } catch (err) {
    console.warn('Notice: Failed to rasterize card brand logo:', err);
  }

  // 3. Header Banner (44mm height with gradient, official Finly branding and Realistic Card Art)
  const headerHeight = 44;
  drawHeaderBanner(doc, theme.headerGradientStart, theme.headerGradientEnd, headerHeight);

  // Bottom Accent Line
  doc.setFillColor(theme.accentRgb[0], theme.accentRgb[1], theme.accentRgb[2]);
  doc.rect(0, headerHeight - 1.2, 210, 1.2, 'F');

  // Finly Logo on Top-Left
  drawFinlyHeaderLogo(doc, 14, 7.5, 'DEMONSTRATIVO DE FATURA');

  // Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fatura de ${data.monthLabel}`, 14, 23);

  // Institution Pill Badge (com identificação elegante do final do cartão: Final XXXX na ausência)
  const rawCardDigits = (data.card.last4Digits || '').replace(/\D/g, '').trim();
  const finalCardStr = rawCardDigits.length >= 2 ? `Final ${rawCardDigits}` : 'Final XXXX';
  const pillBase = theme.pillLabel || `${theme.name}${theme.code ? ` (${theme.code})` : ''} - ${(data.card.brand || theme.defaultBrand).toUpperCase()}`;
  const pillLabel = `${pillBase} | ${finalCardStr}`;
  drawInstitutionPill(doc, 14, 28, pillLabel, theme.accentRgb, bankLogoPng, brandLogoPng);

  // Realistic Card Mockup on Top-Right (54mm x 34mm)
  const cardMockX = 142;
  const cardMockY = 5.2;
  const cardMockW = 54;
  const cardMockH = 34;
  drawRealisticCreditCardMockup(doc, cardMockX, cardMockY, cardMockW, cardMockH, theme, data.card, bankLogoPng, brandLogoPng);

  // 4. Metadata Info Bar (Y: 46.5mm, Height: 7.5mm)
  let currentY = 46.5;
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(14, currentY, 182, 7.5, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(14, currentY, 182, 7.5, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Competência: ${data.monthLabel}`, 18, currentY + 4.9);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Fechamento: Todo dia ${closingDay}  |  Vencimento: Todo dia ${dueDay}`, 105, currentY + 4.9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Emissão: ${generationDateStr}`, 192, currentY + 4.9, { align: 'right' });

  currentY += 11;

  // 5. Section 1: Resumo Executivo da Fatura (4 Modern KPI Cards)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. Resumo Executivo da Fatura', 14, currentY);
  currentY += 3.8;

  const cardWidth = 43;
  const cardHeight = 22.5;
  const cardGap = 3.33;
  const startX = 14;

  const isPaidStatus = data.isPaid || data.statusLabel.toLowerCase().includes('paga');
  const isOverdueStatus = data.statusLabel.toLowerCase().includes('venc');

  const summaryCards = [
    {
      title: 'TOTAL DA FATURA',
      value: formatCurrency(data.invoiceTotal, currency, false),
      sub: 'Valor do ciclo atual',
      accentColor: [225, 29, 72] as [number, number, number],
      badge: null,
      bar: null,
    },
    {
      title: 'FECHAMENTO',
      value: `Todo dia ${closingDay}`,
      sub: `Melhor compra: Dia ${bestBuyDay}`,
      accentColor: [16, 185, 129] as [number, number, number],
      badge: null,
      bar: null,
    },
    {
      title: 'VENCIMENTO',
      value: `Todo dia ${dueDay}`,
      sub: isPaidStatus ? 'Pagamento efetuado' : 'Aguardando liquidação',
      accentColor: (isPaidStatus ? [16, 185, 129] : isOverdueStatus ? [225, 29, 72] : [245, 158, 11]) as [number, number, number],
      badge: isPaidStatus ? '✓ FATURA PAGA' : isOverdueStatus ? 'FATURA VENCIDA' : 'FATURA ABERTA',
      bar: null,
    },
    {
      title: 'LIMITE TOTAL',
      value: formatCurrency(cardLimit, currency, false),
      sub: `Disponível: ${formatCurrency(availableLimit, currency, false)}`,
      accentColor: theme.accentRgb,
      badge: null,
      bar: usedPercentage,
    },
  ];

  summaryCards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + cardGap);
    // Card background
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.8, 1.8, 'F');
    // Subtle border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.8, 1.8, 'S');

    // Left accent stripe (2mm)
    doc.setFillColor(c.accentColor[0], c.accentColor[1], c.accentColor[2]);
    doc.roundedRect(x, currentY, 2.2, cardHeight, 1, 1, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 5, currentY + 5.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(idx === 0 ? 11 : 9.8);
    doc.setTextColor(idx === 0 ? c.accentColor[0] : 15, idx === 0 ? c.accentColor[1] : 23, idx === 0 ? c.accentColor[2] : 42);
    doc.text(c.value, x + 5, currentY + 12.8);

    // Subtitle or Bar
    if (c.bar !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text(c.sub, x + 5, currentY + 17.5);

      // Usage bar
      const barX = x + 5;
      const barY = currentY + 18.8;
      const barW = cardWidth - 9.5;
      const barH = 1.6;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');
      const fillW = Math.max(1, (c.bar / 100) * barW);
      doc.setFillColor(theme.accentRgb[0], theme.accentRgb[1], theme.accentRgb[2]);
      doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, 'F');
    } else if (c.badge) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      const isOk = c.badge.includes('PAGA');
      const isErr = c.badge.includes('VENC');

      doc.setFillColor(isOk ? 220 : isErr ? 254 : 254, isOk ? 252 : isErr ? 226 : 243, isOk ? 231 : isErr ? 226 : 199);
      const badgeW = doc.getTextWidth(c.badge) + 4.5;
      doc.roundedRect(x + 5, currentY + 15.5, Math.min(cardWidth - 8, badgeW), 4.6, 1, 1, 'F');
      doc.setTextColor(isOk ? 21 : isErr ? 190 : 180, isOk ? 128 : isErr ? 18 : 83, isOk ? 61 : isErr ? 60 : 9);
      doc.text(c.badge, x + 7.2, currentY + 18.7);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(idx === 1 ? 5 : 100, idx === 1 ? 150 : 116, idx === 1 ? 105 : 139);
      doc.text(c.sub, x + 5, currentY + 18.2);
    }
  });

  currentY += cardHeight + 6;

  // 6. Section 2: Distribuição de Gastos da Fatura
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
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

  const donutImg = createInvoiceDonutChartCanvas(catMap, data.invoiceTotal, currency, theme.accent);
  if (donutImg) {
    doc.addImage(donutImg, 'PNG', 14, currentY, 182, 52);
    currentY += 56;
  }

  // Category Summary Table
  const catRows = Object.values(catMap)
    .sort((a, b) => b.amount - a.amount)
    .map(c => {
      const pct = data.invoiceTotal > 0 ? ((c.amount / data.invoiceTotal) * 100).toFixed(1) : '0.0';
      return [c.name, String(c.count), formatCurrency(c.amount, currency, false), `${pct}%`];
    });

  if (catRows.length === 0) {
    catRows.push(['Nenhuma despesa nesta fatura', '0', formatCurrency(0, currency, false), '0%']);
  }

  // Single-Page A4 Check: If compact room needed, scale table cell padding
  const totalTxCount = data.transactions.length;
  const isCompactA4 = totalTxCount <= 14;

  autoTable(doc, {
    startY: currentY,
    head: [['Categoria', 'Qtd. Lançamentos', 'Total Gasto', '% da Fatura']],
    body: catRows,
    theme: 'plain',
    headStyles: {
      fillColor: [39, 52, 68], // Slate escuro elegante #273444
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      cellPadding: isCompactA4 ? 1.6 : 2.0,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: isCompactA4 ? 1.5 : 1.9,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  // 7. Section 3: Lançamentos Detalhados da Fatura
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 6;

  // If table won't fit on this page, start clean on next page
  if (currentY > 225 && !isCompactA4) {
    doc.addPage();
    currentY = 18;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
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

  // Summary Row at bottom
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
    head: [['DATA COMPRA', 'DESCRIÇÃO / ESTABELECIMENTO', 'CATEGORIA', 'PARCELA', 'TERCEIRO', 'VALOR']],
    body: txRows,
    theme: 'plain',
    headStyles: {
      fillColor: [39, 52, 68], // Slate escuro elegante #273444
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      cellPadding: isCompactA4 ? 1.6 : 2.0,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: isCompactA4 ? 1.4 : 1.9,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 22 },
      1: { cellWidth: 58 },
      2: { cellWidth: 40 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 22 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (dataHook) => {
      // Highlight the last total row
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

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(14, pageY - 2.8, 196, pageY - 2.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Finly • ${theme.name}${theme.code ? ` (${theme.code})` : ''} • Fatura ${data.monthLabel}`,
        14,
        pageY
      );

      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Autenticação: FINLY.C.C.${theme.code || 'FINLY'}.FATURA.${data.periodSlug.toUpperCase()}.${Math.abs(Math.round(data.invoiceTotal * 100))}`,
        105,
        pageY,
        { align: 'center' }
      );

      doc.setFontSize(7.2);
      doc.text(
        pageCount === 1 ? 'Autenticação eletrônica de um extrato oficial Finly' : `Página ${dataHook.pageNumber} de ${pageCount}`,
        196,
        pageY,
        { align: 'right' }
      );
    },
  });

  // Save / Share PDF
  const filename = `fatura_${data.periodSlug}.pdf`;
  const blob = doc.output('blob');
  await saveOrShareFile({
    filename,
    blob,
    mimeType: 'application/pdf',
    dialogTitle: `Fatura ${data.card.name} (PDF)`,
  });
}

/**
 * Generates and downloads an executive, bank-branded PDF of General Reports / Extratos
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

  const savingsRate = data.totalIncome > 0
    ? ((data.netBalance / data.totalIncome) * 100).toFixed(1)
    : '0.0';

  // Finly Executive Theme
  const headerStartRgb: [number, number, number] = [15, 23, 42]; // Deep Slate #0F172A
  const headerEndRgb: [number, number, number] = [49, 46, 129]; // Indigo 900 #312E81
  const accentRgb: [number, number, number] = [124, 58, 237]; // Violet 600

  // 1. Header Banner (44mm)
  const headerHeight = 44;
  drawHeaderBanner(doc, headerStartRgb, headerEndRgb, headerHeight);

  // Bottom Accent Line
  doc.setFillColor(accentRgb[0], accentRgb[1], accentRgb[2]);
  doc.rect(0, headerHeight - 1.2, 210, 1.2, 'F');

  // Finly Logo on Top-Left
  drawFinlyHeaderLogo(doc, 14, 7.5, 'DEMONSTRATIVO DE EXTRATO FINANCEIRO');

  // Main Report Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Extrato Financeiro - ${data.periodLabel}`, 14, 23);

  // Pill Badge
  drawInstitutionPill(
    doc,
    14,
    28,
    `Finly Inteligência Financeira • Regime: ${regimeLabel}`,
    accentRgb,
    null,
    null
  );

  // Virtual Finly Platinum Card Mockup on Top-Right
  const finlyMockCard: CreditCard = {
    id: 'finly-wallet',
    name: 'Finly Platinum',
    brand: 'Mastercard',
    limit: data.totalIncome + data.totalExpense,
    closingDay: 1,
    dueDay: 10,
    color: '#7C3AED',
  };
  const finlyTheme: BankPdfTheme = {
    id: 'finly',
    name: 'Finly Platinum',
    code: '000',
    accent: '#7C3AED',
    accentRgb: [124, 58, 237],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [49, 46, 129],
    cardBg: [30, 27, 75],
    cardSecondaryBg: [49, 46, 129],
    defaultBrand: 'Mastercard',
    pillLabel: 'Finly Platinum Digital Wallet',
  };
  drawRealisticCreditCardMockup(doc, 142, 5.2, 54, 34, finlyTheme, finlyMockCard, null, null);

  // 2. Metadata Info Bar (Y: 46.5mm)
  let currentY = 46.5;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, 182, 7.5, 1.5, 1.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.roundedRect(14, currentY, 182, 7.5, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Período: ${data.periodLabel}`, 18, currentY + 4.9);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`Regime: ${regimeLabel}`, 105, currentY + 4.9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Emissão: ${generationDateStr}`, 192, currentY + 4.9, { align: 'right' });

  currentY += 11;

  // 3. Section 1: Resumo Executivo do Período
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. Resumo Executivo do Extrato', 14, currentY);
  currentY += 3.8;

  const cardWidth = 43;
  const cardHeight = 22.5;
  const cardGap = 3.33;
  const startX = 14;

  const isNetPositive = data.netBalance >= 0;

  const summaryCards = [
    {
      title: 'RECEITAS TOTAIS',
      value: formatCurrency(data.totalIncome, currency, false),
      sub: 'Entradas consolidadas',
      accentColor: [16, 185, 129] as [number, number, number],
      badge: null,
      bar: null,
    },
    {
      title: 'DESPESAS TOTAIS',
      value: formatCurrency(data.totalExpense, currency, false),
      sub: 'Saídas consolidadas',
      accentColor: [225, 29, 72] as [number, number, number],
      badge: null,
      bar: null,
    },
    {
      title: 'SALDO LÍQUIDO',
      value: formatCurrency(data.netBalance, currency, false),
      sub: isNetPositive ? 'Superávit do período' : 'Déficit do período',
      accentColor: (isNetPositive ? [16, 185, 129] : [225, 29, 72]) as [number, number, number],
      badge: isNetPositive ? '✓ SUPERÁVIT' : 'DÉFICIT',
      bar: null,
    },
    {
      title: 'TAXA DE POUPANÇA',
      value: `${savingsRate}%`,
      sub: 'Economia acumulada',
      accentColor: [124, 58, 237] as [number, number, number],
      badge: null,
      bar: Math.max(0, Math.min(100, parseFloat(savingsRate) || 0)),
    },
  ];

  summaryCards.forEach((c, idx) => {
    const x = startX + idx * (cardWidth + cardGap);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.8, 1.8, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 1.8, 1.8, 'S');

    doc.setFillColor(c.accentColor[0], c.accentColor[1], c.accentColor[2]);
    doc.roundedRect(x, currentY, 2.2, cardHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(idx === 1 ? 10.5 : 10);
    doc.setTextColor(idx === 1 ? 225 : idx === 0 ? 16 : 15, idx === 1 ? 29 : idx === 0 ? 185 : 23, idx === 1 ? 72 : idx === 0 ? 129 : 42);
    doc.text(c.value, x + 5, currentY + 12.8);

    if (c.bar !== null) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(71, 85, 105);
      doc.text(c.sub, x + 5, currentY + 17.5);

      const barX = x + 5;
      const barY = currentY + 18.8;
      const barW = cardWidth - 9.5;
      const barH = 1.6;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(barX, barY, barW, barH, 0.8, 0.8, 'F');
      const fillW = Math.max(1, (c.bar / 100) * barW);
      doc.setFillColor(124, 58, 237);
      doc.roundedRect(barX, barY, fillW, barH, 0.8, 0.8, 'F');
    } else if (c.badge) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      const isOk = c.badge.includes('SUPERÁVIT');
      doc.setFillColor(isOk ? 220 : 254, isOk ? 252 : 226, isOk ? 231 : 226);
      const badgeW = doc.getTextWidth(c.badge) + 4.5;
      doc.roundedRect(x + 5, currentY + 15.5, Math.min(cardWidth - 8, badgeW), 4.6, 1, 1, 'F');
      doc.setTextColor(isOk ? 21 : 190, isOk ? 128 : 18, isOk ? 61 : 60);
      doc.text(c.badge, x + 7.2, currentY + 18.7);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(idx === 0 ? 5 : 100, idx === 0 ? 150 : 116, idx === 0 ? 105 : 139);
      doc.text(c.sub, x + 5, currentY + 18.2);
    }
  });

  currentY += cardHeight + 6;

  // 4. Section 2: Distribuição Financeira e Gastos
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. Distribuição Financeira e Gastos do Período', 14, currentY);
  currentY += 3.5;

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

  const donutImg = createDonutChartCanvas(expenseCategoriesMap, data.totalExpense, currency);
  if (donutImg) {
    doc.addImage(donutImg, 'PNG', 14, currentY, 182, 52);
    currentY += 56;
  }

  const categoryRows = Object.values(expenseCategoriesMap)
    .sort((a, b) => b.amount - a.amount)
    .map(c => {
      const pct = data.totalExpense > 0 ? ((c.amount / data.totalExpense) * 100).toFixed(1) : '0.0';
      return [c.name, String(c.count), formatCurrency(c.amount, currency, false), `${pct}%`];
    });

  if (categoryRows.length === 0) {
    categoryRows.push(['Nenhuma despesa registrada no período', '0', formatCurrency(0, currency, false), '0%']);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Categoria', 'Qtd. Lançamentos', 'Total Gasto', '% do Total']],
    body: categoryRows,
    theme: 'plain',
    headStyles: {
      fillColor: [39, 52, 68],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      cellPadding: 1.8,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: 'center', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 40 },
      3: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
  });

  // 5. Section 3: Demonstrativo Detalhado de Lançamentos
  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 6;
  if (currentY > 225) {
    doc.addPage();
    currentY = 18;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('3. Demonstrativo Detalhado de Lançamentos', 14, currentY);
  currentY += 3.5;

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
    const typeLabel = t.type === 'expense' ? 'Despesa' : 'Receita';

    return [
      formatDate(t.date),
      t.description || 'Sem descrição',
      resolved.name,
      paymentMethod,
      typeLabel,
      typePrefix + formatCurrency(t.amount, currency, false),
    ];
  });

  if (txRows.length === 0) {
    txRows.push(['-', 'Nenhum lançamento encontrado', '-', '-', '-', '-']);
  }

  // Summary Row
  txRows.push([
    '',
    'TOTAL GERAL',
    '',
    '',
    `${sortedTxs.length} item(ns)`,
    formatCurrency(data.netBalance, currency, false),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['DATA', 'DESCRIÇÃO', 'CATEGORIA', 'CONTA / CARTÃO', 'TIPO', 'VALOR']],
    body: txRows,
    theme: 'plain',
    headStyles: {
      fillColor: [39, 52, 68],
      textColor: [255, 255, 255],
      fontSize: 7.2,
      fontStyle: 'bold',
      cellPadding: 1.8,
    },
    styles: {
      fontSize: 7.2,
      cellPadding: 1.6,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 20 },
      1: { cellWidth: 58 },
      2: { cellWidth: 36 },
      3: { cellWidth: 30 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 20 },
    },
    margin: { left: 14, right: 14 },
    didParseCell: (dataHook) => {
      if (dataHook.row.index === txRows.length - 1) {
        dataHook.cell.styles.fontStyle = 'bold';
        dataHook.cell.styles.fillColor = [241, 245, 249];
        if (dataHook.column.index === 5) {
          dataHook.cell.styles.textColor = isNetPositive ? [16, 185, 129] : [225, 29, 72];
        }
      }
    },
    didDrawPage: (dataHook) => {
      const pageCount = doc.getNumberOfPages();
      const pageY = 290;

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(14, pageY - 2.8, 196, pageY - 2.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Finly Gestão Financeira | Extrato ${data.periodLabel}`,
        14,
        pageY
      );

      doc.setFontSize(6.5);
      doc.text(
        `Autenticação: FINLY.EXTRATO.${data.periodSlug.toUpperCase()}.${Math.abs(Math.round(data.netBalance * 100))}`,
        105,
        pageY,
        { align: 'center' }
      );

      doc.setFontSize(7.2);
      doc.text(
        pageCount === 1 ? 'Autenticação eletrônica de um extrato oficial Finly' : `Página ${dataHook.pageNumber} de ${pageCount}`,
        196,
        pageY,
        { align: 'right' }
      );
    },
  });

  const filename = `extrato_finly_${data.periodSlug}.pdf`;
  const blob = doc.output('blob');
  await saveOrShareFile({
    filename,
    blob,
    mimeType: 'application/pdf',
    dialogTitle: 'Extrato Financeiro Finly (PDF)',
  });
}

/**
 * Triggers a universal file download or share using a UTF-8 BOM Blob.
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

/**
 * Generates and downloads an executive, structured CSV of a Credit Card Invoice statement
 */
export async function exportInvoiceCSV(data: InvoiceExportData): Promise<void> {
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
  const theme = resolveBankPdfTheme(data.card);
  const closingDay = data.card.closingDay;
  const dueDay = data.card.dueDay;
  const bestBuyDay = closingDay + 1 > 31 ? 1 : closingDay + 1;

  const cardLimit = data.card.limit || 0;
  const availableLimit = typeof data.availableLimit === 'number'
    ? data.availableLimit
    : Math.max(0, cardLimit - data.invoiceTotal);

  const lines: string[] = [];

  // Section 1: Header Metadata
  lines.push('FINLY - DEMONSTRATIVO DE FATURA DE CARTÃO DE CRÉDITO');
  lines.push(`Instituição Emissora;${theme.name}`);
  lines.push(`Código COMPE;${theme.code || '000'}`);
  lines.push(`Cartão;${data.card.name}`);
  lines.push(`Bandeira;${(data.card.brand || theme.defaultBrand).toUpperCase()}`);
  lines.push(`Competência / Período;${data.monthLabel}`);
  lines.push(`Fechamento da Fatura;Todo dia ${closingDay}`);
  lines.push(`Vencimento da Fatura;Todo dia ${dueDay}`);
  lines.push(`Melhor Dia de Compra;Dia ${bestBuyDay}`);
  lines.push(`Status da Fatura;${data.statusLabel}`);
  lines.push(`Limite Total (R$);${cardLimit.toFixed(2).replace('.', ',')}`);
  lines.push(`Limite Disponível (R$);${availableLimit.toFixed(2).replace('.', ',')}`);
  lines.push(`Total da Fatura (R$);${data.invoiceTotal.toFixed(2).replace('.', ',')}`);
  lines.push(`Data de Emissão;${generationDateStr}`);
  lines.push(`Autenticação Eletrônica;FINLY.C.C.${theme.code || 'FINLY'}.FATURA.${data.periodSlug.toUpperCase()}.${Math.abs(Math.round(data.invoiceTotal * 100))}`);
  if (data.userEmail) lines.push(`Usuário Titular;${data.userEmail}`);
  lines.push('');

  // Section 2: Executive Summary
  lines.push('1. RESUMO EXECUTIVO DA FATURA');
  lines.push('Métrica;Valor;Detalhe');
  lines.push(`Total da Fatura;R$ ${data.invoiceTotal.toFixed(2).replace('.', ',')};Valor do ciclo atual`);
  lines.push(`Fechamento;Todo dia ${closingDay};Melhor compra: Dia ${bestBuyDay}`);
  lines.push(`Vencimento;Todo dia ${dueDay};${data.statusLabel}`);
  const limitPct = cardLimit > 0 ? ((availableLimit / cardLimit) * 100).toFixed(1).replace('.', ',') : '0,0';
  lines.push(`Limite Total;R$ ${cardLimit.toFixed(2).replace('.', ',')};Disponível: R$ ${availableLimit.toFixed(2).replace('.', ',')} (${limitPct}% livre)`);
  lines.push('');

  // Section 3: Category Breakdown
  lines.push('2. DISTRIBUIÇÃO DE GASTOS DA FATURA');
  lines.push('Categoria;Qtd. Lançamentos;Total Gasto (R$);% da Fatura');

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

  // Section 4: Itemized Transactions Statement
  lines.push('3. LANÇAMENTOS DETALHADOS DA FATURA');
  lines.push('Data Compra;Descrição / Estabelecimento;Categoria;Parcela;Terceiro;Status;Valor (R$)');

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

  // Summary row at the bottom
  lines.push(`"";"TOTAL DA FATURA";"";"";"${sortedTxs.length} item(ns)";"";${data.invoiceTotal.toFixed(2).replace('.', ',')}`);

  await downloadCSV(`fatura_${data.periodSlug}.csv`, lines.join('\n'), `Fatura ${data.card.name} (CSV)`);
}

/**
 * Generates and downloads an executive, structured CSV Report with Summary, Categories and Transactions
 */
export async function exportReportCSV(data: ReportExportData): Promise<void> {
  const now = new Date();
  const generationDateStr = now.toLocaleDateString('pt-BR') + ' às ' + now.toLocaleTimeString('pt-BR');
  const regimeLabel = data.viewRegime === 'invoice_month' ? 'Competência / Fatura do Cartão' : data.viewRegime === 'due_date' ? 'Vencimento da Fatura (Caixa)' : 'Data da Compra';

  const lines: string[] = [];

  // Section 1: Metadata
  lines.push('FINLY - DEMONSTRATIVO DE EXTRATO FINANCEIRO');
  lines.push(`Período de Referência;${data.periodLabel}`);
  lines.push(`Regime de Apuração;${regimeLabel}`);
  lines.push(`Data de Emissão;${generationDateStr}`);
  lines.push(`Autenticação Eletrônica;FINLY.EXTRATO.${data.periodSlug.toUpperCase()}.${Math.abs(Math.round(data.netBalance * 100))}`);
  if (data.userEmail) lines.push(`Usuário Titular;${data.userEmail}`);
  lines.push('');

  // Section 2: Executive Summary
  lines.push('1. RESUMO EXECUTIVO DO EXTRATO');
  lines.push('Métrica;Valor;Detalhe');
  lines.push(`Receitas Totais;R$ ${data.totalIncome.toFixed(2).replace('.', ',')};Entradas consolidadas no período`);
  lines.push(`Despesas Totais;R$ ${data.totalExpense.toFixed(2).replace('.', ',')};Saídas consolidadas no período`);
  const isNetPositive = data.netBalance >= 0;
  lines.push(`Saldo Líquido;R$ ${data.netBalance.toFixed(2).replace('.', ',')};${isNetPositive ? 'Superávit do período' : 'Déficit do período'}`);
  const savingsPct = data.totalIncome > 0 ? ((data.netBalance / data.totalIncome) * 100).toFixed(1).replace('.', ',') : '0,0';
  lines.push(`Taxa de Poupança;${savingsPct}%;Economia acumulada no período`);
  lines.push('');

  // Section 3: Categories Breakdown
  lines.push('2. DESPESAS POR CATEGORIA');
  lines.push('Categoria;Qtd. Lançamentos;Total Gasto (R$);% do Total');

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
  lines.push('3. DEMONSTRATIVO DETALHADO DE LANÇAMENTOS');
  lines.push('Data;Descrição;Categoria;Conta / Cartão;Tipo;Status;Valor (R$)');

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

  if (sortedTxs.length === 0) {
    lines.push('"-";"Nenhum lançamento no período";"-";"-";"-";"-";"0,00"');
  }

  // Summary Row
  lines.push(`"";"TOTAL GERAL";"";"";"${sortedTxs.length} item(ns)";"";${data.netBalance.toFixed(2).replace('.', ',')}`);

  await downloadCSV(`extrato_finly_${data.periodSlug}.csv`, lines.join('\n'), 'Extrato Financeiro Finly (CSV)');
}
