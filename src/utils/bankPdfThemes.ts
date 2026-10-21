import { CreditCard } from '../types';
import { getCardBankInfo } from './bankLogos';

export interface BankPdfTheme {
  id: string;
  name: string;
  code: string;
  accent: string;
  accentRgb: [number, number, number];
  headerGradientStart: [number, number, number];
  headerGradientEnd: [number, number, number];
  cardBg: [number, number, number];
  cardSecondaryBg: [number, number, number];
  defaultBrand: string;
  pillLabel?: string;
}

export const BANK_PDF_THEMES: Record<string, BankPdfTheme> = {
  inter: {
    id: 'inter',
    name: 'Banco Inter',
    code: '077',
    accent: '#FF7A00',
    accentRgb: [255, 122, 0],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [194, 89, 26],
    cardBg: [255, 122, 0],
    cardSecondaryBg: [235, 105, 0],
    defaultBrand: 'Mastercard',
    pillLabel: 'Banco Inter (077) - MASTERCARD',
  },
  nubank: {
    id: 'nubank',
    name: 'Nubank',
    code: '260',
    accent: '#820AD1',
    accentRgb: [130, 10, 209],
    headerGradientStart: [19, 17, 28],
    headerGradientEnd: [97, 27, 143],
    cardBg: [130, 10, 209],
    cardSecondaryBg: [97, 27, 143],
    defaultBrand: 'Mastercard',
    pillLabel: 'Nubank (260) - MASTERCARD',
  },
  itau: {
    id: 'itau',
    name: 'Itaú',
    code: '341',
    accent: '#EC7000',
    accentRgb: [236, 112, 0],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [181, 70, 0],
    cardBg: [236, 112, 0],
    cardSecondaryBg: [0, 43, 73],
    defaultBrand: 'Mastercard',
    pillLabel: 'Itaú Unibanco (341) - MASTERCARD',
  },
  mercadopago: {
    id: 'mercadopago',
    name: 'Mercado Pago',
    code: '323',
    accent: '#009EE3',
    accentRgb: [0, 158, 227],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [0, 126, 181],
    cardBg: [0, 158, 227],
    cardSecondaryBg: [0, 90, 150],
    defaultBrand: 'Visa',
    pillLabel: 'Mercado Pago (323) - VISA',
  },
  c6: {
    id: 'c6',
    name: 'C6 Bank',
    code: '336',
    accent: '#27272A',
    accentRgb: [39, 39, 42],
    headerGradientStart: [9, 13, 22],
    headerGradientEnd: [39, 39, 42],
    cardBg: [36, 36, 36],
    cardSecondaryBg: [18, 18, 18],
    defaultBrand: 'Mastercard',
    pillLabel: 'C6 Bank (336) - MASTERCARD',
  },
  bradesco: {
    id: 'bradesco',
    name: 'Bradesco',
    code: '237',
    accent: '#CC092F',
    accentRgb: [204, 9, 47],
    headerGradientStart: [20, 22, 36],
    headerGradientEnd: [163, 0, 0],
    cardBg: [204, 9, 47],
    cardSecondaryBg: [140, 6, 32],
    defaultBrand: 'Visa',
    pillLabel: 'Banco Bradesco (237) - VISA',
  },
  bb: {
    id: 'bb',
    name: 'Banco do Brasil',
    code: '001',
    accent: '#0038A8',
    accentRgb: [0, 56, 168],
    headerGradientStart: [15, 30, 54],
    headerGradientEnd: [0, 56, 168],
    cardBg: [0, 56, 168],
    cardSecondaryBg: [248, 209, 23],
    defaultBrand: 'Visa',
    pillLabel: 'Banco do Brasil (001) - VISA',
  },
  caixa: {
    id: 'caixa',
    name: 'Caixa',
    code: '104',
    accent: '#005CA9',
    accentRgb: [0, 92, 169],
    headerGradientStart: [15, 30, 54],
    headerGradientEnd: [0, 92, 169],
    cardBg: [0, 92, 169],
    cardSecondaryBg: [243, 146, 0],
    defaultBrand: 'Elo',
    pillLabel: 'Caixa Econômica (104) - ELO',
  },
  btg: {
    id: 'btg',
    name: 'BTG Pactual',
    code: '208',
    accent: '#19386B',
    accentRgb: [25, 56, 107],
    headerGradientStart: [10, 17, 32],
    headerGradientEnd: [25, 56, 107],
    cardBg: [25, 56, 107],
    cardSecondaryBg: [10, 20, 40],
    defaultBrand: 'Mastercard',
    pillLabel: 'BTG Pactual (208) - MASTERCARD',
  },
  santander: {
    id: 'santander',
    name: 'Santander',
    code: '033',
    accent: '#EC0000',
    accentRgb: [236, 0, 0],
    headerGradientStart: [22, 8, 8],
    headerGradientEnd: [163, 0, 0],
    cardBg: [236, 0, 0],
    cardSecondaryBg: [180, 0, 0],
    defaultBrand: 'Mastercard',
    pillLabel: 'Banco Santander (033) - MASTERCARD',
  },
  picpay: {
    id: 'picpay',
    name: 'PicPay',
    code: '380',
    accent: '#11C76F',
    accentRgb: [17, 199, 111],
    headerGradientStart: [11, 25, 44],
    headerGradientEnd: [14, 122, 70],
    cardBg: [17, 199, 111],
    cardSecondaryBg: [10, 30, 20],
    defaultBrand: 'Mastercard',
    pillLabel: 'PicPay Bank (380) - MASTERCARD',
  },
  amazon: {
    id: 'amazon',
    name: 'Amazon Prime',
    code: '237',
    accent: '#FF9900',
    accentRgb: [255, 153, 0],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [35, 47, 62],
    cardBg: [35, 47, 62],
    cardSecondaryBg: [19, 25, 33],
    defaultBrand: 'Mastercard',
    pillLabel: 'Amazon | Bradesco (237) - MASTERCARD',
  },
  casasbahia: {
    id: 'casasbahia',
    name: 'Casas Bahia',
    code: '237',
    accent: '#0047BB',
    accentRgb: [0, 71, 187],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [0, 56, 168],
    cardBg: [0, 71, 187],
    cardSecondaryBg: [204, 9, 47],
    defaultBrand: 'Visa',
    pillLabel: 'Casas Bahia | Bradesco (237) - VISA',
  },
  credicard: {
    id: 'credicard',
    name: 'Credicard On',
    code: '341',
    accent: '#0284C7',
    accentRgb: [2, 132, 199],
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: [3, 105, 161],
    cardBg: [2, 132, 199],
    cardSecondaryBg: [0, 43, 73],
    defaultBrand: 'Visa',
    pillLabel: 'Credicard On | Itaú (341) - VISA',
  },
};

/**
 * Converts a hex color string (#RRGGBB or #RGB) to an [R, G, B] tuple
 */
export function hexToRgb(hex?: string): [number, number, number] {
  if (!hex) return [255, 122, 0];
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [isNaN(r) ? 255 : r, isNaN(g) ? 122 : g, isNaN(b) ? 0 : b];
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return [isNaN(r) ? 255 : r, isNaN(g) ? 122 : g, isNaN(b) ? 0 : b];
  }
  return [255, 122, 0];
}

/**
 * Creates a deeper shade of an RGB color
 */
export function darkenRgb([r, g, b]: [number, number, number], factor = 0.32): [number, number, number] {
  return [
    Math.max(0, Math.min(255, Math.round(r * factor))),
    Math.max(0, Math.min(255, Math.round(g * factor))),
    Math.max(0, Math.min(255, Math.round(b * factor))),
  ];
}

/**
 * Resolves full bank visual theme for PDF export
 */
export function resolveBankPdfTheme(card: CreditCard): BankPdfTheme {
  const bankInfo = getCardBankInfo(card);
  const cardNameLower = (card.name || '').toLowerCase();

  // 1. Co-branded overrides
  if (cardNameLower.includes('amazon') || cardNameLower.includes('prime')) {
    return BANK_PDF_THEMES.amazon;
  }
  if (cardNameLower.includes('bahia') || cardNameLower.includes('casas bahia')) {
    return BANK_PDF_THEMES.casasbahia;
  }
  if (cardNameLower.includes('credicard')) {
    return BANK_PDF_THEMES.credicard;
  }

  // 2. Direct ID or COMPE code match
  if (bankInfo?.id && BANK_PDF_THEMES[bankInfo.id]) {
    return BANK_PDF_THEMES[bankInfo.id];
  }
  if (bankInfo?.code) {
    const found = Object.values(BANK_PDF_THEMES).find(t => t.code === bankInfo.code);
    if (found) return found;
  }

  // 3. Fallback from card.color or default Finly theme
  const customRgb = hexToRgb(card.color || bankInfo?.color || '#FF7A00');
  const brandName = (card.brand || 'Mastercard').toUpperCase();

  return {
    id: bankInfo?.id || 'custom',
    name: bankInfo?.name || card.name,
    code: bankInfo?.code && bankInfo.code !== '000' ? bankInfo.code : '',
    accent: card.color || bankInfo?.color || '#FF7A00',
    accentRgb: customRgb,
    headerGradientStart: [15, 23, 42],
    headerGradientEnd: darkenRgb(customRgb, 0.75),
    cardBg: customRgb,
    cardSecondaryBg: darkenRgb(customRgb, 0.6),
    defaultBrand: card.brand || 'Mastercard',
    pillLabel: `${bankInfo?.name || card.name}${bankInfo?.code ? ` (${bankInfo.code})` : ''} - ${brandName}`,
  };
}
