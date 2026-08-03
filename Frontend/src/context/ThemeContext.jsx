import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState(() => {
    const hasChosen = localStorage.getItem('hasChosenThemeMode');
    if (hasChosen === 'true') {
      const savedMode = localStorage.getItem('themeMode');
      if (savedMode && ['system', 'light', 'dark'].includes(savedMode)) {
        return savedMode;
      }
    }
    return 'system';
  });

  const [effectiveTheme, setEffectiveTheme] = useState(() => {
    if (themeMode === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const active = themeMode === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : themeMode;
      setEffectiveTheme(active);

      const root = document.documentElement;
      if (active === 'dark') {
        root.setAttribute('data-theme', 'dark');
        root.classList.add('dark');
      } else {
        root.removeAttribute('data-theme');
        root.classList.remove('dark');
      }
      localStorage.setItem('theme', active);
      localStorage.setItem('themeMode', themeMode);
    };

    updateTheme();

    const handleChange = () => {
      if (themeMode === 'system') {
        updateTheme();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [themeMode]);

  const setThemeMode = (mode) => {
    if (['system', 'light', 'dark'].includes(mode)) {
      localStorage.setItem('hasChosenThemeMode', 'true');
      setThemeModeState(mode);
    }
  };

  const toggleTheme = () => {
    setThemeModeState((prev) => (effectiveTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark: effectiveTheme === 'dark'
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
