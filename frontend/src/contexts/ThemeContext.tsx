import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUser } = useAuthStore();
  
  // Initialize from user preference if available, else localStorage, else system
  const [theme, setThemeState] = useState<Theme>(() => {
    if (user?.themePreference) return user.themePreference as Theme;
    const stored = localStorage.getItem('theme-preference');
    return (stored as Theme) || 'system';
  });

  useEffect(() => {
    if (user?.themePreference && user.themePreference !== theme) {
      setThemeState(user.themePreference as Theme);
    }
  }, [user?.themePreference]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme-preference', theme);
  }, [theme]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mediaQuery.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (user) {
      // Optioanlly dispatch API call to save to backend in background
      // This is handled in the UI settings directly, but we can optimistically update store
      updateUser({ themePreference: newTheme });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
