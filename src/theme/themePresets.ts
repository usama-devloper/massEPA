// Central color presets → CSS variables on :root (see index.css)

export type ThemeId = 'forest' | 'ocean' | 'slate' | 'warm';

export interface ThemePreset {
  id: ThemeId;
  label: string;
  description: string;
  background: string;
  surface: string;
  sidebar: string;
  primary: string;
  primaryDark: string;
  onBackground: string;
}

export const THEME_STORAGE_KEY = 'buildingID_themeId';

export const THEME_PRESETS: Record<ThemeId, ThemePreset> = {
  forest: {
    id: 'forest',
    label: 'Forest',
    description: 'Default BuildingID greens and soft off‑white surfaces.',
    background: '#f8faf8',
    surface: '#f9faf4',
    sidebar: '#f3f4ee',
    primary: '#24512c',
    primaryDark: '#315c37',
    onBackground: '#1a1c19',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    description: 'Cool blues with airy backgrounds.',
    background: '#f4f9fb',
    surface: '#f0f7fa',
    sidebar: '#e8f2f6',
    primary: '#0c4a6e',
    primaryDark: '#075985',
    onBackground: '#0f172a',
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    description: 'Neutral slate with indigo accents.',
    background: '#f8fafc',
    surface: '#f1f5f9',
    sidebar: '#e2e8f0',
    primary: '#3730a3',
    primaryDark: '#4338ca',
    onBackground: '#0f172a',
  },
  warm: {
    id: 'warm',
    label: 'Warm clay',
    description: 'Warm stone surfaces with terracotta primary.',
    background: '#faf8f5',
    surface: '#f5f0ea',
    sidebar: '#efe6dc',
    primary: '#9a3412',
    primaryDark: '#c2410c',
    onBackground: '#1c1917',
  },
};

export const THEME_ORDER: ThemeId[] = ['forest', 'ocean', 'slate', 'warm'];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function applyThemePreset(id: ThemeId): void {
  const preset = THEME_PRESETS[id] ?? THEME_PRESETS.forest;
  const [r, g, b] = hexToRgb(preset.primary);
  const root = document.documentElement;
  root.style.setProperty('--color-background', preset.background);
  root.style.setProperty('--color-surface', preset.surface);
  root.style.setProperty('--color-sidebar', preset.sidebar);
  root.style.setProperty('--color-primary', preset.primary);
  root.style.setProperty('--color-primary-dark', preset.primaryDark);
  root.style.setProperty('--color-on-background', preset.onBackground);
  root.style.setProperty('--color-primary-muted', `rgba(${r},${g},${b},0.1)`);
}

export function isThemeId(value: string): value is ThemeId {
  return value in THEME_PRESETS;
}
