'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type {
  ThemeColor,
  ThemeMode,
} from '@/config/theme';
import {
  DEFAULT_THEME_COLOR,
  DEFAULT_THEME_MODE,
  THEME_COLORS,
  THEME_STORAGE_KEYS,
} from '@/config/theme';

// ── Context types ──────────────────────────────────────────────────────────────

interface ThemeContextValue {
  /** Currently selected primary color */
  themeColor: ThemeColor;
  /** Set a new primary color (persisted to localStorage) */
  setThemeColor: (color: ThemeColor) => void;
  /** Current mode: 'light' | 'dark' | 'system' */
  themeMode: ThemeMode;
  /** All available color options for the settings picker */
  availableColors: typeof THEME_COLORS;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────────

interface AppThemeProviderProps {
  children: React.ReactNode;
}

/**
 * AppThemeProvider wraps next-themes for dark/light mode and manages
 * the primary color theme by setting [data-theme] on <html>.
 *
 * Wrap this around your root layout.
 */
export function AppThemeProvider({ children }: AppThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_MODE}
      enableSystem
      disableTransitionOnChange={false}
    >
      <ColorThemeProvider>{children}</ColorThemeProvider>
    </NextThemesProvider>
  );
}

function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(DEFAULT_THEME_COLOR);
  const [themeMode] = useState<ThemeMode>(DEFAULT_THEME_MODE);

  // Restore saved color preference on mount
  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEYS.COLOR) as ThemeColor | null;
    if (saved && THEME_COLORS.some((c) => c.id === saved)) {
      applyColor(saved);
      setThemeColorState(saved);
    } else {
      applyColor(DEFAULT_THEME_COLOR);
    }
  }, []);

  const setThemeColor = useCallback((color: ThemeColor) => {
    applyColor(color);
    setThemeColorState(color);
    localStorage.setItem(THEME_STORAGE_KEYS.COLOR, color);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        setThemeColor,
        themeMode,
        availableColors: THEME_COLORS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/** Applies a theme color by setting [data-theme] on <html> */
function applyColor(color: ThemeColor): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', color);
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Access the theme color context.
 * Must be used inside AppThemeProvider.
 */
export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }
  return ctx;
}
