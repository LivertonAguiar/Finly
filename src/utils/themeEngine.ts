export type ThemePreset = 'mobills-dark' | 'midnight-oled' | 'emerald-slate' | 'clean-light';
export type CardRadius = 'rounded' | 'medium' | 'sharp';

export interface ThemeConfig {
  preset: ThemePreset;
  accentColor: string;
  cardRadius: CardRadius;
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
    bg: '#F1F5F9',
    cardBg: '#FFFFFF',
    text: '#0F172A',
    mode: 'light',
  },
};

const RADIUS_MAP: Record<CardRadius, string> = {
  rounded: '25px',
  medium: '16px',
  sharp: '6px',
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
  const radiusPx = RADIUS_MAP[radius] || '25px';

  root.style.setProperty('--app-bg', presetData.bg);
  root.style.setProperty('--app-card-bg', presetData.cardBg);
  root.style.setProperty('--primary-accent', accent);
  root.style.setProperty('--card-radius', radiusPx);

  document.body.style.backgroundColor = presetData.bg;
  document.body.style.color = presetData.text;

  // Update dynamic style tag
  let dynamicStyleTag = document.getElementById('plannerfin-dynamic-theme-style');
  if (!dynamicStyleTag) {
    dynamicStyleTag = document.createElement('style');
    dynamicStyleTag.id = 'plannerfin-dynamic-theme-style';
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
};

export const initThemeEngine = () => {
  if (typeof window === 'undefined') return;
  const preset = (localStorage.getItem('plannerfin_theme_preset') as ThemePreset) || 'mobills-dark';
  const accent = localStorage.getItem('plannerfin_accent_color') || '#7C4DFF';
  const radius = (localStorage.getItem('plannerfin_card_radius') as CardRadius) || 'rounded';
  applyTheme({ preset, accentColor: accent, cardRadius: radius });
};
