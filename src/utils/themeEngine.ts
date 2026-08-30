export type ThemePreset = 'mobills-dark' | 'midnight-oled' | 'emerald-slate' | 'clean-light' | 'warm-sand';
export type CardRadius = 'rounded' | 'medium' | 'sharp';

export interface ThemeConfig {
  preset: ThemePreset;
  accentColor: string;
  cardRadius: CardRadius;
  mode: 'dark' | 'light' | 'system';
}

const PRESET_COLORS: Record<ThemePreset, { bg: string; cardBg: string; text: string; mode: 'dark' | 'light' }> = {
  'mobills-dark': {
    bg: '#1C1C1E',
    cardBg: '#2C2C2E',
    text: '#FFFFFF',
    mode: 'dark',
  },
  'midnight-oled': {
    bg: '#000000',
    cardBg: '#121212',
    text: '#FFFFFF',
    mode: 'dark',
  },
  'emerald-slate': {
    bg: '#0F172A',
    cardBg: '#1E293B',
    text: '#F8FAFC',
    mode: 'dark',
  },
  'clean-light': {
    bg: '#F8FAFC',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
  },
  'warm-sand': {
    bg: '#FAF8F5',
    cardBg: '#FFFFFF',
    text: '#292524',
    mode: 'light',
  },
};

const RADIUS_VALUES: Record<CardRadius, string> = {
  rounded: '25px',
  medium: '16px',
  sharp: '8px',
};

export const applyTheme = (config: Partial<ThemeConfig>) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const savedPreset = (localStorage.getItem('plannerfin_theme_preset') as ThemePreset) || 'mobills-dark';
  const savedAccent = localStorage.getItem('plannerfin_accent_color') || '#7C4DFF';
  const savedRadius = (localStorage.getItem('plannerfin_card_radius') as CardRadius) || 'rounded';

  const preset = config.preset || savedPreset;
  const accent = config.accentColor || savedAccent;
  const radius = config.cardRadius || savedRadius;

  const presetData = PRESET_COLORS[preset] || PRESET_COLORS['mobills-dark'];

  // Save to localStorage
  if (config.preset) localStorage.setItem('plannerfin_theme_preset', config.preset);
  if (config.accentColor) localStorage.setItem('plannerfin_accent_color', config.accentColor);
  if (config.cardRadius) localStorage.setItem('plannerfin_card_radius', config.cardRadius);

  // Apply root attributes and CSS variables
  root.setAttribute('data-theme-preset', preset);
  root.setAttribute('data-card-radius', radius);

  if (presetData.mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.setProperty('--app-bg', presetData.bg);
  root.style.setProperty('--app-card-bg', presetData.cardBg);
  root.style.setProperty('--primary-accent', accent);
  root.style.setProperty('--card-radius', RADIUS_VALUES[radius] || '25px');

  document.body.style.backgroundColor = presetData.bg;
  document.body.style.color = presetData.text;
};

export const initThemeEngine = () => {
  if (typeof window === 'undefined') return;
  const preset = (localStorage.getItem('plannerfin_theme_preset') as ThemePreset) || 'mobills-dark';
  const accent = localStorage.getItem('plannerfin_accent_color') || '#7C4DFF';
  const radius = (localStorage.getItem('plannerfin_card_radius') as CardRadius) || 'rounded';
  applyTheme({ preset, accentColor: accent, cardRadius: radius });
};
