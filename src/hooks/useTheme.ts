import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'spotify';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('merise-theme');
    return (saved as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('merise-theme', theme);
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('dark', 'spotify');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'spotify') {
      root.classList.add('spotify');
    }
    // 'light' theme has no class (default)
  }, [theme]);

  const cycleTheme = () => {
    setTheme((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'spotify';
      return 'light';
    });
  };

  return { theme, setTheme, cycleTheme };
}
