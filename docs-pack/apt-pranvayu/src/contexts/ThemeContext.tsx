// ============================================================================
// THEME PROVIDER — Runtime dark/light theme toggle
// Manages [data-theme] attribute on <html>, persists to localStorage, and
// auto-detects OS preference. No page reload required.
// ============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  /** The resolved visual theme (always 'dark' | 'light'). */
  theme: 'dark' | 'light';
  /** The user's preference ('dark' | 'light' | 'system'). */
  mode: ThemeMode;
  /** Switch the theme without reloading. */
  setMode: (mode: ThemeMode) => void;
  /** Toggle between dark and light. */
  toggle: () => void;
  /** True when the resolved theme is dark. */
  isDark: boolean;
}

const STORAGE_KEY = 'pranvayu-theme-mode';

// ── Helpers ─────────────────────────────────────────────────────────────────

function getSystemPreference(): 'dark' | 'light' {
  if (globalThis.window === undefined) return 'dark';
  return globalThis.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getSavedMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // localStorage may be unavailable
  }
  return 'dark'; // default to dark (IDE convention)
}

function applyTheme(theme: 'dark' | 'light') {
  const root = document.documentElement;
  root.dataset.theme = theme;

  // Update meta theme-color for mobile browsers
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme === 'dark' ? '#1e1e1e' : '#f9fafb');
  }
}

// ── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ── Provider ────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [modeValue, setModeValue] = useState<ThemeMode>(getSavedMode);
  const [systemPref, setSystemPref] = useState<'dark' | 'light'>(
    getSystemPreference
  );

  // Listen for OS preference changes
  useEffect(() => {
    const mq = globalThis.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemPref(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const theme: 'dark' | 'light' = useMemo(
    () => (modeValue === 'system' ? systemPref : modeValue),
    [modeValue, systemPref]
  );

  // Apply to DOM whenever resolved theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeValue(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // fail silently
    }
  }, []);

  const toggle = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setMode(nextTheme);
  }, [theme, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode: modeValue,
      setMode,
      toggle,
      isDark: theme === 'dark',
    }),
    [theme, modeValue, setMode, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}

export default ThemeContext;
