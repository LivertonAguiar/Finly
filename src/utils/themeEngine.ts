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

  let preset = config.preset || savedPreset;
  const accent = config.accentColor || savedAccent;
  const radius = config.cardRadius || savedRadius;

  // Auto-heal: If document has class 'dark' and preset is 'clean-light' and config didn't explicitly request clean-light
  if (root.classList.contains('dark') && preset === 'clean-light' && !config.preset) {
    const lastDark = (localStorage.getItem('finly_last_dark_preset') as ThemePreset) || 'sleek-neo-glass';
    preset = lastDark;
  }

  const presetData = PRESET_COLORS[preset] || PRESET_COLORS['sleek-neo-glass'];
  const isDark = presetData.mode === 'dark';

  // Save to localStorage
  localStorage.setItem('finly_theme_preset', preset);
  if (isDark) {
    localStorage.setItem('finly_last_dark_preset', preset);
  }
  if (config.accentColor) localStorage.setItem('finly_accent_color', config.accentColor);
  if (config.cardRadius) localStorage.setItem('finly_card_radius', config.cardRadius);

  // Set DOM attributes and classes
  root.setAttribute('data-theme-preset', preset);
  root.setAttribute('data-card-radius', radius);
  root.setAttribute('data-theme-mode', presetData.mode);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Set CSS Variables directly on root
  const radiusPx = RADIUS_MAP[radius] || '36px';

  root.style.setProperty('--primary-accent', accent);
  root.style.setProperty('--card-radius', radiusPx);

  const darkBg = isDark ? presetData.bg : '#080B14';
  const darkCardBg = isDark ? presetData.cardBg : '#121826';

  if (isDark) {
    root.style.setProperty('--app-bg', darkBg);
    root.style.setProperty('--app-card-bg', darkCardBg);
    document.body.style.backgroundColor = darkBg;
    document.body.style.color = '#FFFFFF';
  } else {
    root.style.setProperty('--app-bg', '#F1F5F9');
    root.style.setProperty('--app-card-bg', '#FFFFFF');
    document.body.style.backgroundColor = '#F1F5F9';
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
      --card-radius: ${radiusPx} !important;
    }
    html.dark, :root.dark {
      --app-bg: ${darkBg} !important;
      --app-card-bg: ${darkCardBg} !important;
    }
    html:not(.dark), :root:not(.dark) {
      --app-bg: #F1F5F9 !important;
      --app-card-bg: #FFFFFF !important;
    }
    ${isDark ? `
      html.dark body {
        background-color: ${darkBg} !important;
        color: #FFFFFF !important;
      }
    ` : `
      html:not(.dark) body {
        background-color: #F1F5F9 !important;
        color: #0F172A !important;
      }
    `}
  `;

  // Notify active components immediately
  try {
    window.dispatchEvent(new CustomEvent('finly_theme_changed', {
      detail: { preset, accentColor: accent, cardRadius: radius, mode: presetData.mode }
    }));
  } catch (e) {}
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
