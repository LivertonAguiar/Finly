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
  | 'clean-light';

export type CardRadius = 'squircle' | 'rounded' | 'medium' | 'sharp';

export interface ThemeConfig {
  preset: ThemePreset;
  accentColor: string;
  cardRadius: CardRadius;
}

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
};

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

  const preset = config.preset || savedPreset;
  const accent = config.accentColor || savedAccent;
  const radius = config.cardRadius || savedRadius;

  const presetData = PRESET_COLORS[preset] || PRESET_COLORS['sleek-neo-glass'];

  // Save to localStorage
  if (config.preset) localStorage.setItem('finly_theme_preset', config.preset);
  if (config.accentColor) localStorage.setItem('finly_accent_color', config.accentColor);
  if (config.cardRadius) localStorage.setItem('finly_card_radius', config.cardRadius);

  // Set DOM attributes
  root.setAttribute('data-theme-preset', preset);
  root.setAttribute('data-card-radius', radius);
  root.setAttribute('data-theme-mode', presetData.mode);

  if (presetData.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set CSS Variables directly on root
  const radiusPx = RADIUS_MAP[radius] || '36px';

  root.style.setProperty('--app-bg', presetData.bg);
  root.style.setProperty('--app-card-bg', presetData.cardBg);
  root.style.setProperty('--primary-accent', accent);
  root.style.setProperty('--card-radius', radiusPx);

  document.body.style.backgroundColor = presetData.bg;
  document.body.style.color = presetData.text;

  // Update dynamic style tag
  let dynamicStyleTag = document.getElementById('finly-dynamic-theme-style');
  if (!dynamicStyleTag) {
    dynamicStyleTag = document.createElement('style');
    dynamicStyleTag.id = 'finly-dynamic-theme-style';
    document.head.appendChild(dynamicStyleTag);
  }

  dynamicStyleTag.innerHTML = `
    :root {
      --app-bg: ${presetData.bg} !important;
      --app-card-bg: ${presetData.cardBg} !important;
      --primary-accent: ${accent} !important;
      --card-radius: ${radiusPx} !important;
    }
    ${presetData.mode === 'light' ? `
      body {
        background-color: #F1F5F9 !important;
        color: #0F172A !important;
      }
    ` : `
      body {
        background-color: ${presetData.bg} !important;
        color: #FFFFFF !important;
      }
    `}
  `;

  // Notify active components immediately
  try {
    window.dispatchEvent(new CustomEvent('finly_theme_changed', {
      detail: { preset, accentColor: accent, cardRadius: radius }
    }));
  } catch (e) {}
};

export const initThemeEngine = () => {
  if (typeof window === 'undefined') return;
  const preset = (localStorage.getItem('finly_theme_preset') as ThemePreset) || 'sleek-neo-glass';
  const accent = localStorage.getItem('finly_accent_color') || '#06B6D4';
  const radius = (localStorage.getItem('finly_card_radius') as CardRadius) || 'squircle';
  applyTheme({ preset, accentColor: accent, cardRadius: radius });
};
