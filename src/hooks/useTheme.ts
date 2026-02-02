import { useState, useEffect } from 'react';
import { Theme } from '@/types/content';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('eduScroll-theme');
    return (stored as Theme) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'neon', 'safari');
    root.classList.add(theme);
    localStorage.setItem('eduScroll-theme', theme);
  }, [theme]);

  return { theme, setTheme };
};
