import { useState, useEffect } from 'react';

export type Theme = 'cyber-yellow' | 'cyber-cyan' | 'cyber-violet' | 'cyber-dark';

export const THEMES_META: Record<
  Theme,
  { name: string; description: string; primaryColor: string; accentColor: string; bg: string }
> = {
  'cyber-yellow': {
    name: 'Cyberpunk Yellow',
    description: 'Ambiance Cyberpunk Jaune Électrique & Sombre (style PAGUERA)',
    primaryColor: '#facc15',
    accentColor: '#06b6d4',
    bg: '#07080e',
  },
  'cyber-cyan': {
    name: 'Neon Cyan',
    description: 'Bleu Fluo & Rose Néon Cyber',
    primaryColor: '#00f2fe',
    accentColor: '#ec4899',
    bg: '#07080e',
  },
  'cyber-violet': {
    name: 'Violet Neon',
    description: 'Violet Synthwave & Magenta Glow',
    primaryColor: '#a855f7',
    accentColor: '#f43f5e',
    bg: '#0d0520',
  },
  'cyber-dark': {
    name: 'Dark Stealth',
    description: 'Sombre Profond Minimaliste & Titane',
    primaryColor: '#38bdf8',
    accentColor: '#818cf8',
    bg: '#090d16',
  },
};

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('merise-theme');
    if (saved && (saved === 'cyber-yellow' || saved === 'cyber-cyan' || saved === 'cyber-violet' || saved === 'cyber-dark')) {
      return saved as Theme;
    }
    return 'cyber-yellow';
  });

  useEffect(() => {
    localStorage.setItem('merise-theme', theme);
    const root = document.documentElement;

    // Remove legacy and current theme classes
    root.classList.remove('dark', 'light', 'spotify', 'violet', 'cyber-yellow', 'cyber-cyan', 'cyber-violet', 'cyber-dark');
    root.classList.add('dark'); // Always dark mode base
    root.classList.add(theme);
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      switch (prev) {
        case 'cyber-yellow':
          return 'cyber-cyan';
        case 'cyber-cyan':
          return 'cyber-violet';
        case 'cyber-violet':
          return 'cyber-dark';
        case 'cyber-dark':
        default:
          return 'cyber-yellow';
      }
    });
  };

  return { theme, setTheme, cycleTheme, themesMeta: THEMES_META };
}
