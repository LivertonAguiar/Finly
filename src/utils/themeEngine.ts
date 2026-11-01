export type ThemePreset =
  | 'sleek-obsidian'
  | 'sleek-neo-glass'
  | 'tech-green'
  | 'swiss-navy'
  | 'linear-mono'
  | 'finly-dark'
  | 'finly-deep-dark'
  | 'midnight-oled'
  | 'emerald-slate'
  | 'clean-light'
  | 'teal-terracotta'
  | 'forest-ochre'
  | 'spruce-olive'
  | 'mocha-caramel'
  | 'midnight-amber'
  | 'amethyst-coral'
  | 'nightshade-gold'
  | 'cyber-fuchsia'
  // Fundos / Temas Escuros
  | 'teal-abyssal'
  | 'teal-night'
  | 'forest-moss'
  | 'forest-pine'
  | 'spruce-black'
  | 'spruce-nordic'
  | 'mocha-espresso'
  | 'mocha-warm'
  | 'midnight-abyssal'
  | 'midnight-blue'
  | 'amethyst-deep'
  | 'amethyst-imperial'
  | 'nightshade-graphite'
  | 'nightshade-violet'
  | 'cyber-black'
  | 'cyber-slate'
  // Fundos / Temas Claros
  | 'sand-gold-light'
  | 'wheat-soft-light'
  | 'almond-soft-light'
  | 'peach-soft-light'
  | 'rose-pale-light'
  | 'vanilla-soft-light'
  | 'ice-white-light';

export interface ThemePresetDetails {
  id: ThemePreset;
  label: string;
  desc: string;
  category: 'dark' | 'light' | 'classic';
  bg: string;
  cardBg: string;
  accent: string;
  palette: string[];
}

export type CardRadius = 'squircle' | 'rounded' | 'medium' | 'sharp';

export interface ThemeConfig {
  preset: ThemePreset;
  accentColor: string;
  cardRadius: CardRadius;
  mode?: 'dark' | 'light';
}

export const getContrastTextColor = (hexColor: string): '#000000' | '#FFFFFF' => {
  if (!hexColor) return '#FFFFFF';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2) || '0', 16);
  const g = parseInt(hex.substring(2, 4) || '0', 16);
  const b = parseInt(hex.substring(4, 6) || '0', 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 180 ? '#000000' : '#FFFFFF';
};

export const PRESET_COLORS: Record<
  ThemePreset,
  { bg: string; cardBg: string; text: string; mode: 'dark' | 'light'; defaultAccent: string }
> = {
  'sleek-obsidian': {
    bg: '#07080A',
    cardBg: '#14151B',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#FF8A00',
  },
  'sleek-neo-glass': {
    bg: '#080B14',
    cardBg: '#121826',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#06B6D4',
  },
  'tech-green': {
    bg: '#0A0D0C',
    cardBg: '#121714',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#00FF88',
  },
  'swiss-navy': {
    bg: '#071026',
    cardBg: '#0D1B3E',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#D4AF37',
  },
  'linear-mono': {
    bg: '#000000',
    cardBg: '#121215',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#FFFFFF',
  },
  'finly-dark': {
    bg: '#121214',
    cardBg: '#18181B',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#7C4DFF',
  },
  'finly-deep-dark': {
    bg: '#121214',
    cardBg: '#18181B',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#7C4DFF',
  },
  'midnight-oled': {
    bg: '#000000',
    cardBg: '#101012',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#7C4DFF',
  },
  'emerald-slate': {
    bg: '#0F172A',
    cardBg: '#1E293B',
    text: '#F8FAFC',
    mode: 'dark',
    defaultAccent: '#00A884',
  },
  'clean-light': {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#0284C7',
  },
  'teal-terracotta': {
    bg: '#0A0F14',
    cardBg: '#0F3D3E',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#C6601F',
  },
  'forest-ochre': {
    bg: '#0B0F0D',
    cardBg: '#1F2A1F',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#B08D57',
  },
  'spruce-olive': {
    bg: '#0F1F17',
    cardBg: '#1E3A2E',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#8CA98C',
  },
  'mocha-caramel': {
    bg: '#1A120E',
    cardBg: '#3A2418',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#A88462',
  },
  'midnight-amber': {
    bg: '#0B132B',
    cardBg: '#1C2541',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#D97706',
  },
  'amethyst-coral': {
    bg: '#1A0F2E',
    cardBg: '#3B1B4F',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#FF6B6B',
  },
  'nightshade-gold': {
    bg: '#1A1A1F',
    cardBg: '#2D2B55',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#F4A62A',
  },
  'cyber-fuchsia': {
    bg: '#121212',
    cardBg: '#1F2937',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#EC4899',
  },
  // Fundos / Temas Escuros
  'teal-abyssal': {
    bg: '#0A0F14',
    cardBg: '#0F3D3E',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#C6601F',
  },
  'teal-night': {
    bg: '#0F3D3E',
    cardBg: '#184F50',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#7FB3B8',
  },
  'forest-moss': {
    bg: '#0B0F0D',
    cardBg: '#1F2A1F',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#B08D57',
  },
  'forest-pine': {
    bg: '#1F2A1F',
    cardBg: '#2E3F2E',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#8CA98C',
  },
  'spruce-black': {
    bg: '#0F1F17',
    cardBg: '#1E3A2E',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#8CA98C',
  },
  'spruce-nordic': {
    bg: '#1E3A2E',
    cardBg: '#2B4F3F',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#6B7F67',
  },
  'mocha-espresso': {
    bg: '#1A120E',
    cardBg: '#3A2418',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#A88462',
  },
  'mocha-warm': {
    bg: '#3A2418',
    cardBg: '#543623',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#D5C4AE',
  },
  'midnight-abyssal': {
    bg: '#0B132B',
    cardBg: '#1C2541',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#D97706',
  },
  'midnight-blue': {
    bg: '#1C2541',
    cardBg: '#2A3861',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#5BC0DE',
  },
  'amethyst-deep': {
    bg: '#1A0F2E',
    cardBg: '#3B1B4F',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#FF6B6B',
  },
  'amethyst-imperial': {
    bg: '#3B1B4F',
    cardBg: '#572873',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#D6598F',
  },
  'nightshade-graphite': {
    bg: '#1A1A1F',
    cardBg: '#2D2B55',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#F4A62A',
  },
  'nightshade-violet': {
    bg: '#2D2B55',
    cardBg: '#3E3A73',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#A678B9',
  },
  'cyber-black': {
    bg: '#121212',
    cardBg: '#1F2937',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#EC4899',
  },
  'cyber-slate': {
    bg: '#1F2937',
    cardBg: '#334155',
    text: '#FFFFFF',
    mode: 'dark',
    defaultAccent: '#64748B',
  },
  // Fundos / Temas Claros
  'sand-gold-light': {
    bg: '#EADCC8',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#C6601F',
  },
  'wheat-soft-light': {
    bg: '#D9C7A3',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#B08D57',
  },
  'almond-soft-light': {
    bg: '#D5C4AE',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#A88462',
  },
  'peach-soft-light': {
    bg: '#F4D6B0',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#D97706',
  },
  'rose-pale-light': {
    bg: '#F4D7D4',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#D6598F',
  },
  'vanilla-soft-light': {
    bg: '#F0D9B5',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#F4A62A',
  },
  'ice-white-light': {
    bg: '#F1F5F9',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
    defaultAccent: '#334155',
  },
};

export const THEME_PRESET_DETAILS: ThemePresetDetails[] = [
  // --- FUNDOS ESCUROS & AMBIENTES ---
  {
    id: 'teal-abyssal',
    label: 'Preto Abissal Teal',
    desc: 'Fundo #0A0F14 com cartões #0F3D3E e âmbar',
    category: 'dark',
    bg: '#0A0F14',
    cardBg: '#0F3D3E',
    accent: '#C6601F',
    palette: ['#0A0F14', '#0F3D3E', '#2E6F73', '#7FB3B8', '#EADCC8', '#C6601F'],
  },
  {
    id: 'teal-night',
    label: 'Teal Noturno',
    desc: 'Fundo #0F3D3E imersivo com cartões elevados e aqua',
    category: 'dark',
    bg: '#0F3D3E',
    cardBg: '#184F50',
    accent: '#7FB3B8',
    palette: ['#0F3D3E', '#184F50', '#2E6F73', '#7FB3B8', '#EADCC8', '#C6601F'],
  },
  {
    id: 'forest-moss',
    label: 'Preto Musgo Floresta',
    desc: 'Fundo #0B0F0D com cartões #1F2A1F e ocre',
    category: 'dark',
    bg: '#0B0F0D',
    cardBg: '#1F2A1F',
    accent: '#B08D57',
    palette: ['#0B0F0D', '#1F2A1F', '#3E5A3F', '#8CA98C', '#D9C7A3', '#B08D57'],
  },
  {
    id: 'forest-pine',
    label: 'Pinho Escuro',
    desc: 'Fundo #1F2A1F com cartões profundos e sálvia',
    category: 'dark',
    bg: '#1F2A1F',
    cardBg: '#2E3F2E',
    accent: '#8CA98C',
    palette: ['#1F2A1F', '#2E3F2E', '#3E5A3F', '#8CA98C', '#D9C7A3', '#B08D57'],
  },
  {
    id: 'spruce-black',
    label: 'Preto Esmeralda',
    desc: 'Fundo #0F1F17 com cartões #1E3A2E e sálvia nórdica',
    category: 'dark',
    bg: '#0F1F17',
    cardBg: '#1E3A2E',
    accent: '#8CA98C',
    palette: ['#0F1F17', '#1E3A2E', '#3E5A3F', '#6B7F67', '#C7CBB8', '#8CA98C'],
  },
  {
    id: 'spruce-nordic',
    label: 'Pinho Nórdico',
    desc: 'Fundo #1E3A2E acolhedor com cartões verdes e oliva',
    category: 'dark',
    bg: '#1E3A2E',
    cardBg: '#2B4F3F',
    accent: '#6B7F67',
    palette: ['#1E3A2E', '#2B4F3F', '#3E5A3F', '#6B7F67', '#C7CBB8', '#8CA98C'],
  },
  {
    id: 'mocha-espresso',
    label: 'Café Profundo',
    desc: 'Fundo #1A120E café com cartões mocha e caramelo',
    category: 'dark',
    bg: '#1A120E',
    cardBg: '#3A2418',
    accent: '#A88462',
    palette: ['#1A120E', '#3A2418', '#6B4A2E', '#A88462', '#D5C4AE', '#A88462'],
  },
  {
    id: 'mocha-warm',
    label: 'Mocha Expresso',
    desc: 'Fundo #3A2418 aveludado com cartões quentes e avelã',
    category: 'dark',
    bg: '#3A2418',
    cardBg: '#543623',
    accent: '#D5C4AE',
    palette: ['#3A2418', '#543623', '#6B4A2E', '#A88462', '#D5C4AE', '#A88462'],
  },
  {
    id: 'midnight-abyssal',
    label: 'Marinho Abissal',
    desc: 'Fundo #0B132B com cartões #1C2541 e âmbar solar',
    category: 'dark',
    bg: '#0B132B',
    cardBg: '#1C2541',
    accent: '#D97706',
    palette: ['#0B132B', '#1C2541', '#3A506B', '#5BC0DE', '#F4D6B0', '#D97706'],
  },
  {
    id: 'midnight-blue',
    label: 'Azul Meia-Noite',
    desc: 'Fundo #1C2541 azul profundo com cartões índigo e celeste',
    category: 'dark',
    bg: '#1C2541',
    cardBg: '#2A3861',
    accent: '#5BC0DE',
    palette: ['#1C2541', '#2A3861', '#3A506B', '#5BC0DE', '#F4D6B0', '#D97706'],
  },
  {
    id: 'amethyst-deep',
    label: 'Púrpura Profundo',
    desc: 'Fundo #1A0F2E com cartões ametista e coral neon',
    category: 'dark',
    bg: '#1A0F2E',
    cardBg: '#3B1B4F',
    accent: '#FF6B6B',
    palette: ['#1A0F2E', '#3B1B4F', '#7A2E6F', '#D6598F', '#F4D7D4', '#FF6B6B'],
  },
  {
    id: 'amethyst-imperial',
    label: 'Violeta Imperial',
    desc: 'Fundo #3B1B4F nobre com cartões ametista e orquídea',
    category: 'dark',
    bg: '#3B1B4F',
    cardBg: '#572873',
    accent: '#D6598F',
    palette: ['#3B1B4F', '#572873', '#7A2E6F', '#D6598F', '#F4D7D4', '#FF6B6B'],
  },
  {
    id: 'nightshade-graphite',
    label: 'Grafite Noturno',
    desc: 'Fundo #1A1A1F com cartões violeta e ouro açafrão',
    category: 'dark',
    bg: '#1A1A1F',
    cardBg: '#2D2B55',
    accent: '#F4A62A',
    palette: ['#1A1A1F', '#2D2B55', '#6A5ACD', '#A678B9', '#F0D9B5', '#F4A62A'],
  },
  {
    id: 'nightshade-violet',
    label: 'Violeta Meia-Noite',
    desc: 'Fundo #2D2B55 espacial com cartões ardósia e lavanda',
    category: 'dark',
    bg: '#2D2B55',
    cardBg: '#3E3A73',
    accent: '#A678B9',
    palette: ['#2D2B55', '#3E3A73', '#6A5ACD', '#A678B9', '#F0D9B5', '#F4A62A'],
  },
  {
    id: 'cyber-black',
    label: 'Preto Grafite Cyber',
    desc: 'Fundo #121212 puro com cartões carvão e rosa elétrico',
    category: 'dark',
    bg: '#121212',
    cardBg: '#1F2937',
    accent: '#EC4899',
    palette: ['#121212', '#1F2937', '#334155', '#64748B', '#F1F5F9', '#EC4899'],
  },
  {
    id: 'cyber-slate',
    label: 'Cinza Carvão Slate',
    desc: 'Fundo #1F2937 com cartões petróleo e cinza azulado',
    category: 'dark',
    bg: '#1F2937',
    cardBg: '#334155',
    accent: '#64748B',
    palette: ['#1F2937', '#334155', '#64748B', '#94A3B8', '#F1F5F9', '#EC4899'],
  },

  // --- FUNDOS CLAROS & SUAVES ---
  {
    id: 'sand-gold-light',
    label: 'Areia Dourada Light',
    desc: 'Fundo #EADCC8 areia suave com cartões brancos puros',
    category: 'light',
    bg: '#EADCC8',
    cardBg: '#FFFFFF',
    accent: '#C6601F',
    palette: ['#EADCC8', '#FFFFFF', '#D9C7A3', '#7FB3B8', '#0A0F14', '#C6601F'],
  },
  {
    id: 'wheat-soft-light',
    label: 'Trigo Suave Light',
    desc: 'Fundo #D9C7A3 trigo amadeirado com cartões brancos',
    category: 'light',
    bg: '#D9C7A3',
    cardBg: '#FFFFFF',
    accent: '#B08D57',
    palette: ['#D9C7A3', '#FFFFFF', '#EADCC8', '#8CA98C', '#0B0F0D', '#B08D57'],
  },
  {
    id: 'almond-soft-light',
    label: 'Amêndoa Suave Light',
    desc: 'Fundo #D5C4AE amêndoa clássica com cartões brancos',
    category: 'light',
    bg: '#D5C4AE',
    cardBg: '#FFFFFF',
    accent: '#A88462',
    palette: ['#D5C4AE', '#FFFFFF', '#EADCC8', '#A88462', '#1A120E', '#A88462'],
  },
  {
    id: 'peach-soft-light',
    label: 'Pêssego Suave Light',
    desc: 'Fundo #F4D6B0 pêssego acolhedor com cartões brancos',
    category: 'light',
    bg: '#F4D6B0',
    cardBg: '#FFFFFF',
    accent: '#D97706',
    palette: ['#F4D6B0', '#FFFFFF', '#F0D9B5', '#5BC0DE', '#0B132B', '#D97706'],
  },
  {
    id: 'rose-pale-light',
    label: 'Rosa Pálido Light',
    desc: 'Fundo #F4D7D4 blush delicado com cartões brancos',
    category: 'light',
    bg: '#F4D7D4',
    cardBg: '#FFFFFF',
    accent: '#D6598F',
    palette: ['#F4D7D4', '#FFFFFF', '#F0D9B5', '#D6598F', '#1A0F2E', '#FF6B6B'],
  },
  {
    id: 'vanilla-soft-light',
    label: 'Baunilha Suave Light',
    desc: 'Fundo #F0D9B5 baunilha nobre com cartões brancos',
    category: 'light',
    bg: '#F0D9B5',
    cardBg: '#FFFFFF',
    accent: '#F4A62A',
    palette: ['#F0D9B5', '#FFFFFF', '#F4D6B0', '#A678B9', '#1A1A1F', '#F4A62A'],
  },
  {
    id: 'ice-white-light',
    label: 'Branco Gelo Light',
    desc: 'Fundo #F1F5F9 moderno com cartões brancos e contraste suave',
    category: 'light',
    bg: '#F1F5F9',
    cardBg: '#FFFFFF',
    accent: '#334155',
    palette: ['#F1F5F9', '#FFFFFF', '#E2E8F0', '#64748B', '#0F172A', '#EC4899'],
  },

  // --- CLÁSSICOS FINLY ---
  {
    id: 'sleek-neo-glass',
    label: 'Sleek Neo-Glass',
    desc: 'Vidro translúcido espacial e Ciano Neon',
    category: 'classic',
    bg: '#080B14',
    cardBg: '#121826',
    accent: '#06B6D4',
    palette: ['#080B14', '#121826', '#1A233A', '#06B6D4', '#E2E8F0', '#06B6D4'],
  },
  {
    id: 'sleek-obsidian',
    label: 'Sleek Obsidian',
    desc: 'Preto nobre e Âmbar Elétrico',
    category: 'classic',
    bg: '#07080A',
    cardBg: '#14151B',
    accent: '#FF8A00',
    palette: ['#07080A', '#14151B', '#232530', '#FF8A00', '#F8FAFC', '#FF8A00'],
  },
  {
    id: 'tech-green',
    label: 'Tech Green',
    desc: 'Preto fosco e Esmeralda Neon',
    category: 'classic',
    bg: '#0A0D0C',
    cardBg: '#121714',
    accent: '#00FF88',
    palette: ['#0A0D0C', '#121714', '#1B241E', '#00FF88', '#F0FDF4', '#00FF88'],
  },
  {
    id: 'swiss-navy',
    label: 'Swiss Luxury',
    desc: 'Azul marinho nobre e Ouro Champanhe',
    category: 'classic',
    bg: '#071026',
    cardBg: '#0D1B3E',
    accent: '#D4AF37',
    palette: ['#071026', '#0D1B3E', '#16285A', '#D4AF37', '#F8FAFC', '#D4AF37'],
  },
  {
    id: 'linear-mono',
    label: 'Linear Mono',
    desc: 'Preto absoluto e alto contraste puro',
    category: 'classic',
    bg: '#000000',
    cardBg: '#121215',
    accent: '#FFFFFF',
    palette: ['#000000', '#121215', '#27272A', '#A1A1AA', '#FFFFFF', '#FFFFFF'],
  },
  {
    id: 'finly-dark',
    label: 'Finly Dark',
    desc: 'Preto suave padrão e Púrpura Finly',
    category: 'classic',
    bg: '#121214',
    cardBg: '#18181B',
    accent: '#7C4DFF',
    palette: ['#121214', '#18181B', '#27272A', '#7C4DFF', '#F4F4F5', '#7C4DFF'],
  },
  {
    id: 'midnight-oled',
    label: 'Midnight OLED',
    desc: 'Preto absoluto para economia máxima',
    category: 'classic',
    bg: '#000000',
    cardBg: '#101012',
    accent: '#7C4DFF',
    palette: ['#000000', '#101012', '#1E1E22', '#7C4DFF', '#FFFFFF', '#7C4DFF'],
  },
  {
    id: 'clean-light',
    label: 'Clean Light',
    desc: 'Branco puro e minimalista clássico',
    category: 'classic',
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    accent: '#0284C7',
    palette: ['#F8FAFC', '#FFFFFF', '#E2E8F0', '#0284C7', '#0F172A', '#0284C7'],
  },
];

const RADIUS_MAP: Record<CardRadius, string> = {
  squircle: '36px',
  rounded: '25px',
  medium: '16px',
  sharp: '6px',
};

export const applyTheme = (config: Partial<ThemeConfig>) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const savedPreset = (localStorage.getItem('finly_theme_preset') as ThemePreset) || 'sleek-neo-glass';
  const savedAccent = localStorage.getItem('finly_accent_color') || '#06B6D4';
  const savedRadius = (localStorage.getItem('finly_card_radius') as CardRadius) || 'squircle';

  let preset = config.preset || savedPreset;
  let accent = config.accentColor || savedAccent;
  const radius = config.cardRadius || savedRadius;

  // Auto-heal: If document has class 'dark' and preset is 'clean-light' and config didn't explicitly request clean-light
  if (root.classList.contains('dark') && preset === 'clean-light' && !config.preset) {
    const lastDark = (localStorage.getItem('finly_last_dark_preset') as ThemePreset) || 'sleek-neo-glass';
    preset = lastDark;
  }

  const presetData = PRESET_COLORS[preset] || PRESET_COLORS['sleek-neo-glass'];

  // Determine dark/light mode
  let mode: 'dark' | 'light' = config.mode || (preset === 'clean-light' ? 'light' : presetData.mode);
  if (!config.mode && preset === 'linear-mono') {
    const storedMode = localStorage.getItem('finly_theme_mode') as 'dark' | 'light' | null;
    mode = storedMode || (root.classList.contains('dark') ? 'dark' : 'dark');
  }

  const isDark = mode === 'dark';

  // Handle Linear Mono accents and light-mode white accent safeguard
  if (preset === 'linear-mono') {
    if (isDark) {
      if (!config.accentColor && (accent === '#18181B' || accent === '#0284C7')) {
        accent = '#FFFFFF';
      }
    } else {
      if (!config.accentColor || accent.toUpperCase() === '#FFFFFF') {
        accent = '#18181B';
      }
    }
  } else if (!isDark && accent.toUpperCase() === '#FFFFFF') {
    accent = '#0284C7';
  }

  // Save to localStorage
  localStorage.setItem('finly_theme_preset', preset);
  localStorage.setItem('finly_theme_mode', mode);
  if (isDark && preset !== 'clean-light') {
    localStorage.setItem('finly_last_dark_preset', preset);
  }
  localStorage.setItem('finly_accent_color', accent);
  if (config.cardRadius) localStorage.setItem('finly_card_radius', config.cardRadius);

  // Set DOM attributes and classes
  root.setAttribute('data-theme-preset', preset);
  root.setAttribute('data-card-radius', radius);
  root.setAttribute('data-theme-mode', mode);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set CSS Variables directly on root
  const radiusPx = RADIUS_MAP[radius] || '36px';
  const accentForeground = getContrastTextColor(accent);

  root.style.setProperty('--primary-accent', accent);
  root.style.setProperty('--primary-accent-foreground', accentForeground);
  root.style.setProperty('--card-radius', radiusPx);

  let darkBg = presetData.bg;
  let darkCardBg = presetData.cardBg;
  let lightBg = '#F1F5F9';
  let lightCardBg = '#FFFFFF';

  if (preset === 'linear-mono') {
    darkBg = '#000000';
    darkCardBg = '#121215';
    lightBg = '#F4F4F5';
    lightCardBg = '#FFFFFF';
  }

  if (isDark) {
    root.style.setProperty('--app-bg', darkBg);
    root.style.setProperty('--app-card-bg', darkCardBg);
    root.style.setProperty('--text-primary', '#FFFFFF');
    root.style.setProperty('--text-secondary', '#E2E8F0');
    root.style.setProperty('--text-muted', '#CBD5E1');
    document.body.style.backgroundColor = darkBg;
    document.body.style.color = '#FFFFFF';
  } else {
    root.style.setProperty('--app-bg', lightBg);
    root.style.setProperty('--app-card-bg', lightCardBg);
    root.style.setProperty('--text-primary', '#0F172A');
    root.style.setProperty('--text-secondary', '#334155');
    root.style.setProperty('--text-muted', '#475569');
    document.body.style.backgroundColor = lightBg;
    document.body.style.color = '#0F172A';
  }

  // Update dynamic style tag
  let dynamicStyleTag = document.getElementById('finly-dynamic-theme-style');
  if (!dynamicStyleTag) {
    dynamicStyleTag = document.createElement('style');
    dynamicStyleTag.id = 'finly-dynamic-theme-style';
    document.head.appendChild(dynamicStyleTag);
  }

  dynamicStyleTag.innerHTML = `
    :root {
      --primary-accent: ${accent} !important;
      --primary-accent-foreground: ${accentForeground} !important;
      --card-radius: ${radiusPx} !important;
    }
    html.dark, :root.dark {
      --app-bg: ${darkBg} !important;
      --app-card-bg: ${darkCardBg} !important;
      --finly-page: ${darkBg} !important;
      --finly-surface: ${darkCardBg} !important;
      --text-primary: #FFFFFF !important;
      --text-secondary: #E2E8F0 !important;
      --text-muted: #CBD5E1 !important;
    }
    html:not(.dark), :root:not(.dark) {
      --app-bg: ${lightBg} !important;
      --app-card-bg: ${lightCardBg} !important;
      --finly-page: ${lightBg} !important;
      --finly-surface: ${lightCardBg} !important;
      --text-primary: #0F172A !important;
      --text-secondary: #334155 !important;
      --text-muted: #475569 !important;
    }
    ${isDark ? `
      html.dark body {
        background-color: ${darkBg} !important;
        color: #FFFFFF !important;
      }
    ` : `
      html:not(.dark) body {
        background-color: ${lightBg} !important;
        color: #0F172A !important;
      }
    `}
  `;

  // Notify active components immediately
  try {
    window.dispatchEvent(new CustomEvent('finly_theme_changed', {
      detail: { preset, accentColor: accent, cardRadius: radius, mode }
    }));
  } catch (e) {}

  // Sincroniza a barra de status do celular e meta tags do sistema
  syncNativeStatusBar(isDark, isDark ? darkBg : lightBg).catch(() => {});
};

export const syncNativeStatusBar = async (isDark: boolean, bgHex: string) => {
  if (typeof window === 'undefined') return;

  // 1. Atualiza meta tags theme-color no HTML para navegadores web e PWA
  try {
    let metaTheme = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', bgHex);

    const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]');
    if (darkMeta) darkMeta.setAttribute('content', isDark ? bgHex : '#121214');
    const lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]');
    if (lightMeta) lightMeta.setAttribute('content', !isDark ? bgHex : '#F8FAFC');
  } catch (_) {}

  // 2. Capacitor Android / iOS nativo
  const Capacitor = (window as any).Capacitor;
  if (Capacitor?.isNativePlatform?.()) {
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: bgHex }).catch(() => {});
    } catch (_) {}
  }
};

export const initThemeEngine = () => {
  if (typeof window === 'undefined') return;
  let preset = (localStorage.getItem('finly_theme_preset') as ThemePreset) || 'sleek-neo-glass';
  const accent = localStorage.getItem('finly_accent_color') || '#06B6D4';
  const radius = (localStorage.getItem('finly_card_radius') as CardRadius) || 'squircle';

  const isDocDark = document.documentElement.classList.contains('dark');
  if (isDocDark && preset === 'clean-light') {
    preset = (localStorage.getItem('finly_last_dark_preset') as ThemePreset) || 'sleek-neo-glass';
    localStorage.setItem('finly_theme_preset', preset);
  }

  applyTheme({ preset, accentColor: accent, cardRadius: radius });
};
