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
    document.body.style.backgroundColor = darkBg;
    document.body.style.color = '#FFFFFF';
  } else {
    root.style.setProperty('--app-bg', lightBg);
    root.style.setProperty('--app-card-bg', lightCardBg);
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
    }
    html:not(.dark), :root:not(.dark) {
      --app-bg: ${lightBg} !important;
      --app-card-bg: ${lightCardBg} !important;
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
