import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'spotify' | 'violet';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('merise-theme');
    return (saved as Theme) || 'violet';
  });

  useEffect(() => {
    localStorage.setItem('merise-theme', theme);
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'spotify', 'violet');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'spotify') {
      root.classList.add('spotify');
    } else if (theme === 'violet') {
      root.classList.add('violet');
    }
    // 'light' theme has no class (default)
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'violet') return 'light';
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'spotify';
      return 'violet';
    });
  };

  return { theme, setTheme, cycleTheme };
}
