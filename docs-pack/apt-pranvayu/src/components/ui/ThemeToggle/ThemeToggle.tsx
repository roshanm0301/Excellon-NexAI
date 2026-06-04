// ============================================================================
// ThemeToggle — Compact IDE-style theme switcher
// Renders an icon button that cycles through dark → light → system modes.
// Designed for placement in the header toolbar or status bar.
// ============================================================================

import React, { useCallback } from 'react';
import { useTheme, ThemeMode } from '../../../contexts/ThemeContext';
import './ThemeToggle.scss';

// SVG icons inline to avoid external dependencies
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.36 10.06A6 6 0 015.94 2.64a6 6 0 107.42 7.42z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const SystemIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5 14h6M8 11v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const modeLabels: Record<ThemeMode, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
};

const modeOrder: ThemeMode[] = ['dark', 'light', 'system'];

interface ThemeToggleProps {
  /** Show mode label next to icon */
  showLabel?: boolean;
  /** CSS class override */
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
}) => {
  const { mode, setMode } = useTheme();

  const cycleMode = useCallback(() => {
    const currentIndex = modeOrder.indexOf(mode);
    const next = modeOrder[(currentIndex + 1) % modeOrder.length];
    setMode(next);
  }, [mode, setMode]);

  const getIcon = () => {
    switch (mode) {
      case 'dark': return <MoonIcon />;
      case 'light': return <SunIcon />;
      default: return <SystemIcon />;
    }
  };
  const icon = getIcon();

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={cycleMode}
      title={`Theme: ${modeLabels[mode]} (click to change)`}
      aria-label={`Current theme: ${modeLabels[mode]}. Click to switch.`}
      type="button"
    >
      <span className="theme-toggle__icon">{icon}</span>
      {showLabel && (
        <span className="theme-toggle__label">{modeLabels[mode]}</span>
      )}
    </button>
  );
};

export default ThemeToggle;
