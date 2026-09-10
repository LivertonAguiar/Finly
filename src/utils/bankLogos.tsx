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

/** Official Elo Vector Icon */
export const EloIcon: React.FC<{ size?: number | string; radius?: number | string; className?: string }> = ({
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

/** High-Definition Official Cartão Amazon Vector Icon */
export const AmazonCardIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Cartão Amazon"
  >
    <defs>
      <linearGradient id="amazon-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#232f3e" />
        <stop offset="100%" stopColor="#131921" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#amazon-hd-bg)" />
    <text
      x="50"
      y="46"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="21"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      letterSpacing="-0.8"
    >
      amazon
    </text>
    <path
      d="M24 57c16 11 36 11 52 0"
      stroke="#ff9900"
      strokeWidth="4.5"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M73 51l5 7-8 1.5 3-8.5z" fill="#ff9900" />
  </svg>
);

/** High-Definition Official Bradescard Vector Icon */
export const BradescardIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Bradescard"
  >
    <defs>
      <linearGradient id="bradescard-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d91a3d" />
        <stop offset="100%" stopColor="#8a001a" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#bradescard-hd-bg)" />
    <g transform="translate(4, -3)">
      <path
        d="M38 48h-5v-18h5v18zm10 0h-7v-25h7v25zm-22-22c4-12 14-16 25-16s21 4 25 16c-3-2-7-3-11-3-10 0-14 4-14 4s-4-4-14-4c-4 0-8 1-11 3z"
        fill="#ffffff"
      />
    </g>
    <text
      x="50"
      y="74"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="13"
      fontWeight="800"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="-0.3"
    >
      bradescard
    </text>
  </svg>
);

/** High-Definition Official Casas Bahia Card Vector Icon */
export const CasasBahiaCardIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Casas Bahia Card"
  >
    <defs>
      <linearGradient id="cb-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#003cd6" />
        <stop offset="100%" stopColor="#001e7a" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#cb-hd-bg)" />
    <path
      d="M43 30c-12 0-20 8-20 20s8 20 20 20c6 0 12-3 15-7l-6-5c-2 3-5 5-9 5-8 0-12-6-12-13s4-13 12-13c4 0 7 2 9 5l6-5c-3-4-9-7-15-7z"
      fill="#ffffff"
    />
    <path
      d="M53 31h14c6 0 10 3 10 8 0 3-2 6-5 7 4 1 7 4 7 9 0 6-5 10-12 10H53V31zm8 14h5c2 0 4-1 4-3s-2-3-4-3h-5v6zm0 13h6c3 0 5-1 5-4s-2-4-5-4h-6v8z"
      fill="#e71a3b"
    />
    <text
      x="50"
      y="83"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="8"
      fontWeight="800"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="0.8"
    >
      CASAS BAHIA
    </text>
  </svg>
);

/** High-Definition Official Cartão Americanas Vector Icon */
export const AmericanasCardIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Cartão Americanas"
  >
    <defs>
      <linearGradient id="americanas-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f80032" />
        <stop offset="100%" stopColor="#b30022" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#americanas-hd-bg)" />
    <rect x="16" y="26" width="68" height="4.5" rx="2.25" fill="#ffffff" />
    <text
      x="50"
      y="57"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="13.5"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      letterSpacing="-0.5"
    >
      americanas
    </text>
    <rect x="16" y="69" width="68" height="4.5" rx="2.25" fill="#ffffff" />
  </svg>
);

/** High-Definition Official Santander Way Vector Icon */
export const SantanderWayIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Santander Way"
  >
    <defs>
      <linearGradient id="way-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ea1d25" />
        <stop offset="100%" stopColor="#990000" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#way-hd-bg)" />
    <path
      d="M62 42c-.1-1.3-.4-2.6-1-3.7l-5.6-10.3c-.4-.8-.7-1.6-.9-2.5l-.2.4c-1.4 2.5-1.4 5.7 0 8.2l4.5 8.2c1.4 2.5 1.4 5.7 0 8.2l-.2.4c-.2-.9-.5-1.7-.9-2.5l-4.1-7.5-2.6-4.9c-.4-.8-.7-1.6-.9-2.5l-.2.4c-1.4 2.5-1.4 5.6 0 8.2l4.5 8.2c1.4 2.5 1.4 5.7 0 8.2l-.2.4c-.2-.9-.5-1.7-.9-2.5l-5.7-10.3c-.7-1.4-1.1-2.9-1.1-4.5-6 1.6-10.2 5.2-10.2 9.3 0 5.7 8.1 10.3 18 10.3s18-4.6 18-10.3c0-3.9-4-7.4-10.1-9.1z"
      fill="#ffffff"
      transform="translate(4, -8) scale(0.92)"
    />
    <text
      x="50"
      y="82"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="21"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="-1"
    >
      way
    </text>
  </svg>
);

/** High-Definition Official Bradesco Neo Vector Icon */
export const BradescoNeoIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Bradesco Neo"
  >
    <defs>
      <linearGradient id="neo-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#d60036" />
        <stop offset="48%" stopColor="#7a1862" />
        <stop offset="100%" stopColor="#162970" />
      </linearGradient>
      <pattern id="neo-icon-lines" width="10" height="10" patternTransform="rotate(28 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="10" stroke="#ff3b69" strokeWidth="1.2" opacity="0.4" />
      </pattern>
    </defs>
    {/* Gradiente Oficial Tricolor (Vermelho -> Violeta -> Azul) */}
    <rect width="100" height="100" rx={radius * 2} fill="url(#neo-hd-bg)" />
    
    {/* Padrão de Linhas Diagonais */}
    <rect width="100" height="100" rx={radius * 2} fill="url(#neo-icon-lines)" />

    {/* Símbolo + Nome Bradesco no canto superior esquerdo */}
    <g transform="translate(10, 13) scale(0.62)">
      <path
        d="M12 20h-3v-9h3v9zm4 0h-3v-13h3v13zm-8-10.5c1.8-4.5 5.5-6.5 9.5-6.5s7.7 2 9.5 6.5c-1-1-2.8-1.5-4.2-1.5-3.5 0-5.3 1.5-5.3 1.5s-1.8-1.5-5.3-1.5c-1.4 0-3.2.5-4.2 1.5z"
        fill="#ffffff"
      />
      <text
        x="24"
        y="17"
        fill="#ffffff"
        fontSize="13"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        bradesco
      </text>
    </g>

    {/* Símbolo Contactless no canto superior direito */}
    <g transform="translate(76, 14) scale(0.7)">
      <path d="M12 2c2.2 2.2 3.5 5.2 3.5 8.5s-1.3 6.3-3.5 8.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M8 5c1.4 1.4 2.2 3.3 2.2 5.5s-.8 4.1-2.2 5.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M4 8c.6.6 1 1.5 1 2.5s-.4 1.9-1 2.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.9" />
    </g>

    {/* Tipografia Central Característica: N E O */}
    <text
      x="50"
      y="66"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="17"
      fontWeight="900"
      fontFamily="system-ui, -apple-system, sans-serif"
      letterSpacing="4"
    >
      NEO
    </text>

    {/* Flag Visa no canto inferior */}
    <text
      x="78"
      y="88"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="9"
      fontWeight="900"
      fontFamily="Arial, sans-serif"
      letterSpacing="0.5"
      opacity="0.95"
    >
      VISA
    </text>
  </svg>
);

/** High-Definition Official Cartão Carrefour Vector Icon */
export const CarrefourCardIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Cartão Carrefour"
  >
    <defs>
      <linearGradient id="carrefour-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00387b" />
        <stop offset="100%" stopColor="#001e47" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#carrefour-hd-bg)" />
    <g transform="translate(20, 20) scale(0.6)">
      <path
        d="M38 18c.5-.5 1-.8 1.4-.8.8 0 1.3.7 1.3 1.6 0 .5-.3 1.1-.7 1.6-19 23.5-32.8 51-32.8 89s13.8 65 32.8 88.5c.5.5.7 1.1.7 1.6 0 .8-.5 1.6-1.3 1.6-.4 0-.9-.3-1.4-.8L-42.5 122.5c-4-3.5-6.6-7.4-6.6-13.2 0-5.7 2.6-9.8 6.6-13.1L38 18z"
        fill="#e2001a"
      />
      <path
        d="M100 11.5c-31.5 0-43.9 44.7-43.9 98s12.3 97.4 43.9 97.4c19 0 35-11 35-20.3 0-2-.8-3.9-2.5-5.6-9-8.7-12.4-17.3-12.4-25 0-14.5 12.6-25.5 24.3-25.5 16.1 0 25.5 12.6 25.5 29 0 15.5-6.6 28.4-13.7 38.7-.3.4-.4.9-.4 1.3 0 .8.5 1.4 1.2 1.4.4 0 .9-.3 1.6-.8l80.6-77.9c4-3.5 6.6-7.4 6.6-13.2 0-5.7-2.6-9.8-6.6-13.1l-80.6-77.8c-.5-.5-1-.8-1.6-.8-.8 0-1.2.6-1.2 1.4 0 .4.1.9.4 1.3 7.2 10.2 13.7 23.3 13.7 38.7 0 16.4-9.5 29-25.5 29-11.7 0-24.3-10.9-24.3-25.5 0-7.7 3.5-16.4 12.4-25 1.7-1.7 2.5-3.6 2.5-5.6 0-9.4-16.1-20.3-35-20.3z"
        fill="#ffffff"
      />
    </g>
  </svg>
);

/** High-Definition Official Credicard On Vector Icon */
export const CredicardOnIcon: React.FC<{ size?: number; radius?: number; className?: string }> = ({
  size = 32,
  radius = 6,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    className={className}
    role="img"
    aria-label="Credicard On"
  >
    <defs>
      <linearGradient id="credicard-hd-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#003559" />
        <stop offset="100%" stopColor="#001a2c" />
      </linearGradient>
      <linearGradient id="credicard-on-pill" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="100%" stopColor="#00b4d8" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx={radius * 2} fill="url(#credicard-hd-bg)" />
    
    {/* Credicard Ribbon / Símbolo clássico com anéis entrelaçados */}
    <g transform="translate(18, 20)">
      <circle cx="24" cy="18" r="13" stroke="#ffffff" strokeWidth="4" fill="none" opacity="0.95" />
      <circle cx="40" cy="18" r="13" stroke="#00e5ff" strokeWidth="4" fill="none" opacity="0.95" />
    </g>

    {/* Tipografia Oficial: credicard */}
    <text
      x="39"
      y="69"
      textAnchor="middle"
      fill="#ffffff"
      fontSize="13"
      fontWeight="900"
      fontFamily="Arial, system-ui, -apple-system, sans-serif"
      letterSpacing="-0.5"
    >
      credicard
    </text>

    {/* Badge Neon: on */}
    <g transform="translate(68, 56)">
      <rect width="18" height="15" rx="7.5" fill="url(#credicard-on-pill)" />
      <text
        x="9"
        y="11.5"
        textAnchor="middle"
        fill="#001a2c"
        fontSize="10"
        fontWeight="900"
        fontFamily="Arial, sans-serif"
      >
        on
      </text>
    </g>
  </svg>
);

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
  { id: 'amazon', name: 'Cartão Amazon', code: '000', color: '#131921', textColor: '#ffffff', bgGradient: 'from-[#232f3e] to-[#131921]' },
  { id: 'bradescard', name: 'Bradescard', code: '063', color: '#cc092f', textColor: '#ffffff', bgGradient: 'from-[#cc092f] to-[#80051d]' },
  { id: 'casasbahia', name: 'Casas Bahia Card', code: '000', color: '#0033c5', textColor: '#ffffff', bgGradient: 'from-[#0033c5] to-[#001c73]' },
  { id: 'americanas', name: 'Cartão Americanas', code: '000', color: '#f80032', textColor: '#ffffff', bgGradient: 'from-[#f80032] to-[#a80022]' },
  { id: 'santanderway', name: 'Santander Way', code: '033', color: '#ea1d25', textColor: '#ffffff', bgGradient: 'from-[#ea1d25] to-[#800000]' },
  { id: 'bradesconeo', name: 'Bradesco Neo', code: '237', color: '#d60036', textColor: '#ffffff', bgGradient: 'from-[#d60036] via-[#7a1862] to-[#162970]' },
  { id: 'carrefour', name: 'Cartão Carrefour', code: '000', color: '#00387b', textColor: '#ffffff', bgGradient: 'from-[#00387b] to-[#001c3d]' },
  { id: 'credicard', name: 'Credicard On', code: '000', color: '#002b49', textColor: '#ffffff', bgGradient: 'from-[#003559] to-[#001726]' },
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

/**
 * Finds matching BankInfo by ID, name keywords, or bank color.
 */
export function getCardBankInfo(cardOrName?: string | { name?: string; bankId?: string; color?: string }): BankInfo | undefined {
  if (!cardOrName) return undefined;
  const nameOrId = typeof cardOrName === 'string' ? cardOrName : (cardOrName.bankId || cardOrName.name || '');
  const norm = nameOrId.trim().toLowerCase();
  if (!norm) return undefined;

  // 1. Direct ID match
  let found = ALL_BANKS.find(b => b.id.toLowerCase() === norm);
  if (found) return found;

  // 2. Direct name match
  found = ALL_BANKS.find(b => norm.includes(b.name.toLowerCase()) || norm.includes(b.id.toLowerCase()));
  if (found) return found;

  // 3. Known bank aliases & keywords (specific variants before broader ones)
  if (norm.includes('nu') || norm.includes('roxo') || norm.includes('ultravioleta') || norm.includes('260')) return ALL_BANKS.find(b => b.id === 'nubank');
  if (norm.includes('inter') || norm.includes('077')) return ALL_BANKS.find(b => b.id === 'inter');
  if (norm.includes('ita') || norm.includes('341')) return ALL_BANKS.find(b => b.id === 'itau');
  if (norm.includes('neo') || norm.includes('bradesco neo')) return ALL_BANKS.find(b => b.id === 'bradesconeo');
  if (norm.includes('bradescard') || norm.includes('063')) return ALL_BANKS.find(b => b.id === 'bradescard');
  if (norm.includes('bradesco') || norm.includes('237')) return ALL_BANKS.find(b => b.id === 'bradesco');
  if (norm.includes('brasil') || norm.includes('bb') || norm.includes('ourocard') || norm.includes('001')) return ALL_BANKS.find(b => b.id === 'bb');
  if (norm.includes('caixa') || norm.includes('104')) return ALL_BANKS.find(b => b.id === 'caixa');
  if (norm.includes('way') || norm.includes('santander way')) return ALL_BANKS.find(b => b.id === 'santanderway');
  if (norm.includes('santander') || norm.includes('033')) return ALL_BANKS.find(b => b.id === 'santander');
  if (norm.includes('amazon') || norm.includes('prime')) return ALL_BANKS.find(b => b.id === 'amazon');
  if (norm.includes('bahia') || norm.includes('casas bahia')) return ALL_BANKS.find(b => b.id === 'casasbahia');
  if (norm.includes('americana') || norm.includes('americanas')) return ALL_BANKS.find(b => b.id === 'americanas');
  if (norm.includes('carrefour') || norm.includes('csf')) return ALL_BANKS.find(b => b.id === 'carrefour');
  if (norm.includes('credicard') || norm.includes('credicard on')) return ALL_BANKS.find(b => b.id === 'credicard');
  if (norm.includes('c6') || norm.includes('336')) return ALL_BANKS.find(b => b.id === 'c6');
  if (norm.includes('btg') || norm.includes('208')) return ALL_BANKS.find(b => b.id === 'btg');
  if (norm.includes('xp') || norm.includes('102') || norm.includes('348')) return ALL_BANKS.find(b => b.id === 'xp');
  if (norm.includes('mercado') || norm.includes('mp') || norm.includes('323')) return ALL_BANKS.find(b => b.id === 'mercadopago');
  if (norm.includes('picpay') || norm.includes('380')) return ALL_BANKS.find(b => b.id === 'picpay');
  if (norm.includes('pagbank') || norm.includes('pagseguro') || norm.includes('290')) return ALL_BANKS.find(b => b.id === 'pagbank');
  if (norm.includes('safra') || norm.includes('422')) return ALL_BANKS.find(b => b.id === 'safra');
  if (norm.includes('sicredi') || norm.includes('748')) return ALL_BANKS.find(b => b.id === 'sicredi');
  if (norm.includes('sicoob') || norm.includes('756')) return ALL_BANKS.find(b => b.id === 'sicoob');
  if (norm.includes('nomad')) return ALL_BANKS.find(b => b.id === 'nomad');
  if (norm.includes('wise')) return ALL_BANKS.find(b => b.id === 'wise');
  if (norm.includes('will')) return ALL_BANKS.find(b => b.id === 'will');
  if (norm.includes('neon') || norm.includes('735')) return ALL_BANKS.find(b => b.id === 'neon');
  if (norm.includes('original')) return ALL_BANKS.find(b => b.id === 'original');
  if (norm.includes('pan')) return ALL_BANKS.find(b => b.id === 'pan');
  if (norm.includes('daycoval')) return ALL_BANKS.find(b => b.id === 'daycoval');
  if (norm.includes('agi')) return ALL_BANKS.find(b => b.id === 'agi');
  if (norm.includes('banrisul')) return ALL_BANKS.find(b => b.id === 'banrisul');
  if (norm.includes('next')) return ALL_BANKS.find(b => b.id === 'next');

  return undefined;
}

/**
 * BankLogo: Renders the official bank icons directly from react-bancos or custom high-definition vector icons.
 */
export const BankLogo: React.FC<{
  nameOrId?: string;
  fallbackBrand?: string;
  className?: string;
  size?: number;
  radius?: number;
}> = ({
  nameOrId = '',
  fallbackBrand = '',
  className = 'w-6 h-6',
  size = 28,
  radius = 6,
}) => {
  const norm = nameOrId.trim().toLowerCase();

  if (norm.includes('carteira') || norm.includes('dinheiro') || norm.includes('cash') || norm.includes('carteira-padrao')) {
    return <Wallet size={size} className={className} />;
  }

  // Priority: Custom High-Definition Retail & Specialty Cards
  if (norm === 'amazon' || norm.includes('amazon') || norm.includes('prime')) {
    return <AmazonCardIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'bradescard' || norm.includes('bradescard')) {
    return <BradescardIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'casasbahia' || norm.includes('casas bahia') || norm.includes('bahia card') || (norm.includes('bahia') && !norm.includes('banco da amazonia'))) {
    return <CasasBahiaCardIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'americanas' || norm.includes('americana')) {
    return <AmericanasCardIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'santanderway' || norm.includes('santander way') || norm === 'way' || norm.includes('way')) {
    return <SantanderWayIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'bradesconeo' || norm.includes('bradesco neo') || norm === 'neo' || norm.includes('cartao neo') || norm.includes('cartão neo')) {
    return <BradescoNeoIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'carrefour' || norm.includes('carrefour')) {
    return <CarrefourCardIcon size={size} radius={radius} className={className} />;
  }
  if (norm === 'credicard' || norm.includes('credicard') || norm.includes('credicard on')) {
    return <CredicardOnIcon size={size} radius={radius} className={className} />;
  }

  if (norm.includes('nu') || norm.includes('260') || norm.includes('roxo') || norm.includes('ultravioleta')) return <Nubank size={size} radius={radius} className={className} />;
  if (norm.includes('inter') || norm.includes('077')) return <Inter size={size} radius={radius} className={className} />;
  if (norm.includes('ita') || norm.includes('341')) return <Itau size={size} radius={radius} className={className} />;
  if (norm.includes('bradesco') || norm.includes('237')) return <Bradesco size={size} radius={radius} className={className} />;
  if (norm.includes('brasil') || norm.includes('bb') || norm.includes('001') || norm.includes('ourocard')) return <BancoDoBrasil size={size} radius={radius} className={className} />;
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
  if (norm.includes('neon') || norm.includes('735')) return <Neon size={size} radius={radius} className={className} />;
  if (norm.includes('original')) return <Original size={size} radius={radius} className={className} />;
  if (norm.includes('pan')) return <Pan size={size} radius={radius} className={className} />;
  if (norm.includes('daycoval')) return <Daycoval size={size} radius={radius} className={className} />;
  if (norm.includes('agi')) return <Agibank size={size} radius={radius} className={className} />;
  if (norm.includes('banrisul')) return <Banrisul size={size} radius={radius} className={className} />;
  if (norm.includes('next')) return <Next size={size} radius={radius} className={className} />;

  // If no bank matched, render Outros institution bank icon (never fallback to a card brand flag)
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
