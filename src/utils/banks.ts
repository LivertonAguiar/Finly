export interface BankPreset {
  name: string;
  code: string;
  color: string;
  textColor: string;
  icon: string;
}

export const BRAZILIAN_BANKS: BankPreset[] = [
  { name: 'Nubank', code: '260', color: '#820ad1', textColor: '#ffffff', icon: '🟣' },
  { name: 'Inter', code: '077', color: '#ff7a00', textColor: '#ffffff', icon: '🟠' },
  { name: 'Itaú', code: '341', color: '#ec7000', textColor: '#ffffff', icon: '🟧' },
  { name: 'Bradesco', code: '237', color: '#cc092f', textColor: '#ffffff', icon: '🔴' },
  { name: 'Banco do Brasil', code: '001', color: '#fcf800', textColor: '#003399', icon: '🟡' },
  { name: 'Santander', code: '033', color: '#ea1d25', textColor: '#ffffff', icon: '🛑' },
  { name: 'Caixa Econômica', code: '104', color: '#0066b3', textColor: '#ffffff', icon: '🔷' },
  { name: 'C6 Bank', code: '336', color: '#242424', textColor: '#ffffff', icon: '⚫' },
  { name: 'BTG Pactual', code: '208', color: '#001e62', textColor: '#ffffff', icon: '💎' },
  { name: 'XP Investimentos', code: '102', color: '#000000', textColor: '#ffbb00', icon: '🟡' },
  { name: 'Mercado Pago', code: '323', color: '#009ee3', textColor: '#ffffff', icon: '💳' },
  { name: 'PicPay', code: '380', color: '#11c76f', textColor: '#ffffff', icon: '🟢' },
  { name: 'Outro / Dinheiro', code: '000', color: '#10b981', textColor: '#ffffff', icon: '💵' },
];
