import React from 'react';
import { Wallet } from 'lucide-react';
import {
  Nubank,
  Inter,
  Itau,
  Bradesco,
  BancoDoBrasil,
  Caixa,
  Santander,
  C6Bank,
  BTGPactual,
  XP,
  MercadoPago,
  PicPay,
  PagBank,
  Safra,
  Sicredi,
  Sicoob,
  Nomad,
  Wise,
  WillBank,
  Neon,
  Original,
  Pan,
  Daycoval,
  Agibank,
  Banrisul,
  Next,
  Mastercard,
  Visa,
  AmericanExpress,
  Hipercard,
  DinersClub,
  Alelo,
  Ticket,
  Pluxee,
  VRBeneficios,
  Flash,
  Caju,
  Outros,
} from 'react-bancos';

export interface BankInfo {
  id: string;
  name: string;
  code: string;
  color: string;
  textColor: string;
  bgGradient?: string;
}

export const ALL_BANKS: BankInfo[] = [
  { id: 'nubank', name: 'Nubank', code: '260', color: '#820ad1', textColor: '#ffffff', bgGradient: 'from-[#820ad1] to-[#590594]' },
  { id: 'inter', name: 'Banco Inter', code: '077', color: '#ff7a00', textColor: '#ffffff', bgGradient: 'from-[#ff7a00] to-[#e05600]' },
  { id: 'itau', name: 'Itaú Unibanco', code: '341', color: '#ec7000', textColor: '#ffffff', bgGradient: 'from-[#ec7000] to-[#003399]' },
  { id: 'bradesco', name: 'Bradesco', code: '237', color: '#cc092f', textColor: '#ffffff', bgGradient: 'from-[#cc092f] to-[#80051d]' },
  { id: 'bb', name: 'Banco do Brasil', code: '001', color: '#fcf800', textColor: '#003399', bgGradient: 'from-[#003399] to-[#002266]' },
  { id: 'santander', name: 'Santander', code: '033', color: '#ea1d25', textColor: '#ffffff', bgGradient: 'from-[#ea1d25] to-[#a30b11]' },
  { id: 'caixa', name: 'Caixa Econômica', code: '104', color: '#0066b3', textColor: '#ffffff', bgGradient: 'from-[#0066b3] to-[#004480]' },
  { id: 'c6', name: 'C6 Bank', code: '336', color: '#242424', textColor: '#ffffff', bgGradient: 'from-[#2b2b2b] to-[#121212]' },
  { id: 'btg', name: 'BTG Pactual', code: '208', color: '#001e62', textColor: '#ffffff', bgGradient: 'from-[#001e62] to-[#000f33]' },
  { id: 'xp', name: 'XP Investimentos', code: '102', color: '#000000', textColor: '#ffbb00', bgGradient: 'from-[#1a1a1a] to-[#000000]' },
  { id: 'mercadopago', name: 'Mercado Pago', code: '323', color: '#009ee3', textColor: '#ffffff', bgGradient: 'from-[#009ee3] to-[#0077b3]' },
  { id: 'picpay', name: 'PicPay', code: '380', color: '#11c76f', textColor: '#ffffff', bgGradient: 'from-[#11c76f] to-[#0b8047]' },
  { id: 'pagbank', name: 'PagBank', code: '290', color: '#00a859', textColor: '#ffffff', bgGradient: 'from-[#00a859] to-[#006633]' },
  { id: 'safra', name: 'Banco Safra', code: '422', color: '#1b5c46', textColor: '#ffffff', bgGradient: 'from-[#1b5c46] to-[#0d3326]' },
  { id: 'sicredi', name: 'Sicredi', code: '748', color: '#007a33', textColor: '#ffffff', bgGradient: 'from-[#007a33] to-[#004d20]' },
  { id: 'sicoob', name: 'Sicoob', code: '756', color: '#003641', textColor: '#00ae9d', bgGradient: 'from-[#003641] to-[#001f26]' },
  { id: 'nomad', name: 'Nomad Global', code: '998', color: '#1a1a1a', textColor: '#ffd700', bgGradient: 'from-[#2b2b2b] to-[#0a0a0a]' },
  { id: 'wise', name: 'Wise', code: '999', color: '#9fe870', textColor: '#163300', bgGradient: 'from-[#9fe870] to-[#7dc950]' },
  { id: 'will', name: 'Will Bank', code: '280', color: '#ffd600', textColor: '#000000', bgGradient: 'from-[#ffd600] to-[#e6c200]' },
  { id: 'neon', name: 'Neon', code: '735', color: '#00e5ff', textColor: '#003366', bgGradient: 'from-[#00e5ff] to-[#0099cc]' },
  { id: 'carteira', name: 'Carteira', code: '000', color: '#10b981', textColor: '#ffffff', bgGradient: 'from-[#10b981] to-[#047857]' },
];

export interface CardBrandInfo {
  id: string;
  name: string;
  color: string;
  bgGradient: string;
}

export const CARD_BRANDS: CardBrandInfo[] = [
  { id: 'mastercard', name: 'Mastercard', color: '#eb001b', bgGradient: 'from-[#242424] to-[#0a0a0a]' },
  { id: 'visa', name: 'Visa', color: '#1a1f71', bgGradient: 'from-[#1a1f71] to-[#0d103c]' },
  { id: 'elo', name: 'Elo', color: '#000000', bgGradient: 'from-[#1e1e1e] to-[#000000]' },
  { id: 'amex', name: 'American Express', color: '#006fcf', bgGradient: 'from-[#006fcf] to-[#003a6c]' },
  { id: 'hipercard', name: 'Hipercard', color: '#b3131b', bgGradient: 'from-[#b3131b] to-[#6b080d]' },
  { id: 'diners', name: 'Diners Club', color: '#004a98', bgGradient: 'from-[#004a98] to-[#002752]' },
  { id: 'alelo', name: 'Alelo', color: '#007a33', bgGradient: 'from-[#007a33] to-[#004d20]' },
  { id: 'ticket', name: 'Ticket', color: '#e4002b', bgGradient: 'from-[#e4002b] to-[#99001d]' },
  { id: 'sodexo', name: 'Sodexo / Pluxee', color: '#ec008c', bgGradient: 'from-[#ec008c] to-[#99005a]' },
  { id: 'vr', name: 'VR Benefícios', color: '#007a33', bgGradient: 'from-[#007a33] to-[#004d20]' },
  { id: 'flash', name: 'Flash Benefícios', color: '#ff3366', bgGradient: 'from-[#ff3366] to-[#cc0033]' },
  { id: 'caju', name: 'Caju', color: '#ff6600', bgGradient: 'from-[#ff6600] to-[#cc4400]' },
];

/** Official Elo Vector Icon */
const EloIcon: React.FC<{ size?: number | string; radius?: number | string; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg width={size} height={size} viewBox="0 0 54 34" fill="none" className={className}>
    <rect width="54" height="34" rx={radius} fill="#000000" />
    <circle cx="14" cy="17" r="5" fill="#EF4123" />
    <circle cx="21.5" cy="17" r="5" fill="#FFD400" />
    <circle cx="29" cy="17" r="5" fill="#00A4E4" />
    <text x="41" y="21" fill="white" fontSize="12" fontWeight="900" fontFamily="Arial, sans-serif" letterSpacing="-0.5">
      elo
    </text>
  </svg>
);

/**
 * BankLogo: Renders the official bank icons directly from react-bancos (Henrique Zolini).
 */
export const BankLogo: React.FC<{ nameOrId?: string; className?: string; size?: number; radius?: number }> = ({
  nameOrId = '',
  className = 'w-6 h-6',
  size = 28,
  radius = 6,
}) => {
  const norm = nameOrId.trim().toLowerCase();

  if (norm.includes('carteira') || norm.includes('dinheiro') || norm.includes('cash') || norm.includes('carteira-padrao')) {
    return <Wallet size={size} className={className} />;
  }

  if (norm.includes('nu') || norm.includes('260')) return <Nubank size={size} radius={radius} className={className} />;
  if (norm.includes('inter') || norm.includes('077')) return <Inter size={size} radius={radius} className={className} />;
  if (norm.includes('ita') || norm.includes('341')) return <Itau size={size} radius={radius} className={className} />;
  if (norm.includes('bradesco') || norm.includes('237')) return <Bradesco size={size} radius={radius} className={className} />;
  if (norm.includes('brasil') || norm.includes('bb') || norm.includes('001')) return <BancoDoBrasil size={size} radius={radius} className={className} />;
  if (norm.includes('caixa') || norm.includes('104')) return <Caixa size={size} radius={radius} className={className} />;
  if (norm.includes('santander') || norm.includes('033')) return <Santander size={size} radius={radius} className={className} />;
  if (norm.includes('c6') || norm.includes('336')) return <C6Bank size={size} radius={radius} className={className} />;
  if (norm.includes('btg') || norm.includes('208')) return <BTGPactual size={size} radius={radius} className={className} />;
  if (norm.includes('xp') || norm.includes('102') || norm.includes('348')) return <XP size={size} radius={radius} className={className} />;
  if (norm.includes('mercado') || norm.includes('323')) return <MercadoPago size={size} radius={radius} className={className} />;
  if (norm.includes('picpay') || norm.includes('380')) return <PicPay size={size} radius={radius} className={className} />;
  if (norm.includes('pagbank') || norm.includes('pagseguro') || norm.includes('290')) return <PagBank size={size} radius={radius} className={className} />;
  if (norm.includes('safra') || norm.includes('422')) return <Safra size={size} radius={radius} className={className} />;
  if (norm.includes('sicredi') || norm.includes('748')) return <Sicredi size={size} radius={radius} className={className} />;
  if (norm.includes('sicoob') || norm.includes('756')) return <Sicoob size={size} radius={radius} className={className} />;
  if (norm.includes('nomad')) return <Nomad size={size} radius={radius} className={className} />;
  if (norm.includes('wise')) return <Wise size={size} radius={radius} className={className} />;
  if (norm.includes('will')) return <WillBank size={size} radius={radius} className={className} />;
  if (norm.includes('neon')) return <Neon size={size} radius={radius} className={className} />;
  if (norm.includes('original')) return <Original size={size} radius={radius} className={className} />;
  if (norm.includes('pan')) return <Pan size={size} radius={radius} className={className} />;
  if (norm.includes('daycoval')) return <Daycoval size={size} radius={radius} className={className} />;
  if (norm.includes('agi')) return <Agibank size={size} radius={radius} className={className} />;
  if (norm.includes('banrisul')) return <Banrisul size={size} radius={radius} className={className} />;
  if (norm.includes('next')) return <Next size={size} radius={radius} className={className} />;

  return <Outros size={size} radius={radius} className={className} />;
};

/**
 * CardBrandLogo: Renders official card brand and voucher icons directly from react-bancos.
 */
export const CardBrandLogo: React.FC<{ brand?: string; className?: string; size?: number; radius?: number }> = ({
  brand = '',
  className = 'w-10 h-7',
  size = 32,
  radius = 6,
}) => {
  const norm = brand.trim().toLowerCase();

  // Strict Matching (Alelo checked before Elo)
  if (norm.includes('alelo')) return <Alelo size={size} radius={radius} className={className} />;
  if (norm.includes('master')) return <Mastercard size={size} radius={radius} className={className} />;
  if (norm.includes('visa')) return <Visa size={size} radius={radius} className={className} />;
  if (norm === 'elo' || norm.includes('elo card') || (norm.includes('elo') && !norm.includes('alelo'))) {
    return <EloIcon size={size} radius={radius} className={className} />;
  }
  if (norm.includes('amex') || norm.includes('american')) return <AmericanExpress size={size} radius={radius} className={className} />;
  if (norm.includes('hiper')) return <Hipercard size={size} radius={radius} className={className} />;
  if (norm.includes('diners')) return <DinersClub size={size} radius={radius} className={className} />;
  if (norm.includes('ticket')) return <Ticket size={size} radius={radius} className={className} />;
  if (norm.includes('sodexo') || norm.includes('pluxee')) return <Pluxee size={size} radius={radius} className={className} />;
  if (norm.includes('vr')) return <VRBeneficios size={size} radius={radius} className={className} />;
  if (norm.includes('flash')) return <Flash size={size} radius={radius} className={className} />;
  if (norm.includes('caju')) return <Caju size={size} radius={radius} className={className} />;

  return <Mastercard size={size} radius={radius} className={className} />;
};
