'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = 'cti-theme';

export function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const nextTheme = saved || (preferredDark ? 'dark' : 'light');
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-full text-left text-xs rounded-lg px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-colors"
      aria-label="Alternar tema"
    >
      Tema: <span className="font-semibold">{theme === 'dark' ? 'Escuro' : 'Claro'}</span>
    </button>
  );
}
