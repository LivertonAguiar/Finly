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
  | 'cyber-fuchsia';

export interface ThemePresetDetails {
  id: ThemePreset;
  label: string;
  desc: string;
  palette: string[]; // [bg, cardBg, midtone, highlight, neutral, accent]
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
};

export const THEME_PRESET_DETAILS: ThemePresetDetails[] = [
  {
    id: 'teal-terracotta',
    label: 'Teal & Terracota',
    desc: 'Teal nobre e Âmbar Terracota vibrante',
    palette: ['#0A0F14', '#0F3D3E', '#2E6F73', '#7FB3B8', '#EADCC8', '#C6601F'],
  },
  {
    id: 'forest-ochre',
    label: 'Forest & Ochre',
    desc: 'Verde floresta nobre e Ocre Dourado',
    palette: ['#0B0F0D', '#1F2A1F', '#3E5A3F', '#8CA98C', '#D9C7A3', '#B08D57'],
  },
  {
    id: 'spruce-olive',
    label: 'Nordic Spruce',
    desc: 'Pinho nórdico e Sálvia Suave',
    palette: ['#0F1F17', '#1E3A2E', '#3E5A3F', '#6B7F67', '#C7CBB8', '#8CA98C'],
  },
  {
    id: 'mocha-caramel',
    label: 'Mocha & Caramel',
    desc: 'Expresso aveludado e Caramelo Avelã',
    palette: ['#1A120E', '#3A2418', '#6B4A2E', '#A88462', '#D5C4AE', '#A88462'],
  },
  {
    id: 'midnight-amber',
    label: 'Midnight & Amber',
    desc: 'Azul meia-noite e Âmbar Solar',
    palette: ['#0B132B', '#1C2541', '#3A506B', '#5BC0DE', '#F4D6B0', '#D97706'],
  },
  {
    id: 'amethyst-coral',
    label: 'Amethyst & Coral',
    desc: 'Ametista púrpura e Coral Neon',
    palette: ['#1A0F2E', '#3B1B4F', '#7A2E6F', '#D6598F', '#F4D7D4', '#FF6B6B'],
  },
  {
    id: 'nightshade-gold',
    label: 'Nightshade & Gold',
    desc: 'Violeta noturno e Ouro Açafrão',
    palette: ['#1A1A1F', '#2D2B55', '#6A5ACD', '#A678B9', '#F0D9B5', '#F4A62A'],
  },
  {
    id: 'cyber-fuchsia',
    label: 'Cyber Slate & Pink',
    desc: 'Grafite cyber e Rosa Neon elétrico',
    palette: ['#121212', '#1F2937', '#334155', '#64748B', '#F1F5F9', '#EC4899'],
  },
  {
    id: 'sleek-neo-glass',
    label: 'Sleek Neo-Glass',
    desc: 'Vidro translúcido espacial e Ciano Neon',
    palette: ['#080B14', '#121826', '#1A233A', '#06B6D4', '#E2E8F0', '#06B6D4'],
  },
  {
    id: 'sleek-obsidian',
    label: 'Sleek Obsidian',
    desc: 'Preto nobre e Âmbar Elétrico',
    palette: ['#07080A', '#14151B', '#232530', '#FF8A00', '#F8FAFC', '#FF8A00'],
  },
  {
    id: 'tech-green',
    label: 'Tech Green',
    desc: 'Preto fosco e Esmeralda Neon',
    palette: ['#0A0D0C', '#121714', '#1B241E', '#00FF88', '#F0FDF4', '#00FF88'],
  },
  {
    id: 'swiss-navy',
    label: 'Swiss Luxury',
    desc: 'Azul marinho nobre e Ouro Champanhe',
    palette: ['#071026', '#0D1B3E', '#16285A', '#D4AF37', '#F8FAFC', '#D4AF37'],
  },
  {
    id: 'linear-mono',
    label: 'Linear Mono',
    desc: 'Preto absoluto e alto contraste puro',
    palette: ['#000000', '#121215', '#27272A', '#A1A1AA', '#FFFFFF', '#FFFFFF'],
  },
  {
    id: 'finly-dark',
    label: 'Finly Dark',
    desc: 'Preto suave padrão e Púrpura Finly',
    palette: ['#121214', '#18181B', '#27272A', '#7C4DFF', '#F4F4F5', '#7C4DFF'],
  },
  {
    id: 'midnight-oled',
    label: 'Midnight OLED',
    desc: 'Preto absoluto para economia máxima',
    palette: ['#000000', '#101012', '#1E1E22', '#7C4DFF', '#FFFFFF', '#7C4DFF'],
  },
  {
    id: 'clean-light',
    label: 'Clean Light',
    desc: 'Branco puro e minimalista clássico',
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
