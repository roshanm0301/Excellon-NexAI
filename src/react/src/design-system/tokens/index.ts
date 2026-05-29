export const tokens = {
  color: {
    brand: {
      50: 'var(--brand-50)', 100: 'var(--brand-100)', 200: 'var(--brand-200)',
      300: 'var(--brand-300)', 400: 'var(--brand-400)', 500: 'var(--brand-500)',
      600: 'var(--brand-600)', 700: 'var(--brand-700)', 800: 'var(--brand-800)',
      900: 'var(--brand-900)',
    },
    neutral: {
      50: 'var(--neutral-50)', 100: 'var(--neutral-100)', 200: 'var(--neutral-200)',
      300: 'var(--neutral-300)', 400: 'var(--neutral-400)', 500: 'var(--neutral-500)',
      600: 'var(--neutral-600)', 700: 'var(--neutral-700)', 800: 'var(--neutral-800)',
      900: 'var(--neutral-900)',
    },
    fg: {
      primary: 'var(--fg-primary)', secondary: 'var(--fg-secondary)',
      tertiary: 'var(--fg-tertiary)', disabled: 'var(--fg-disabled)',
      onBrand: 'var(--fg-on-brand)', brand: 'var(--fg-brand)',
    },
    bg: {
      primary: 'var(--bg-primary)', secondary: 'var(--bg-secondary)',
      tertiary: 'var(--bg-tertiary)', brandSoft: 'var(--bg-brand-soft)',
    },
    border: {
      primary: 'var(--border-primary)', secondary: 'var(--border-secondary)',
      brand: 'var(--border-brand)', error: 'var(--border-error)',
    },
    semantic: {
      success: 'var(--success-500)', warning: 'var(--warning-500)',
      error: 'var(--error-500)', info: 'var(--info-500)', purple: 'var(--purple-500)',
    },
  },
  spacing: {
    0: 'var(--space-0)', 1: 'var(--space-1)', 2: 'var(--space-2)', 3: 'var(--space-3)',
    4: 'var(--space-4)', 5: 'var(--space-5)', 6: 'var(--space-6)', 8: 'var(--space-8)',
    10: 'var(--space-10)', 12: 'var(--space-12)', 16: 'var(--space-16)', 20: 'var(--space-20)',
    24: 'var(--space-24)', 32: 'var(--space-32)',
  },
  radius: {
    none: 'var(--radius-none)', xs: 'var(--radius-xs)', sm: 'var(--radius-sm)',
    md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)', full: 'var(--radius-full)',
  },
  shadow: {
    xs: 'var(--shadow-xs)', sm: 'var(--shadow-sm)', md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)', xl: 'var(--shadow-xl)', '3xl': 'var(--shadow-3xl)',
  },
  font: {
    sans: 'var(--font-sans)', display: 'var(--font-display)',
    mono: 'var(--font-mono)', spec: 'var(--font-spec)',
  },
  text: {
    xs: 'var(--text-xs)', sm: 'var(--text-sm)', md: 'var(--text-md)',
    lg: 'var(--text-lg)', xl: 'var(--text-xl)', '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
  },
} as const
