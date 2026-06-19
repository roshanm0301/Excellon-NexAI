import { createTheme } from '@mui/material/styles'
import type {} from '@mui/x-data-grid-pro/themeAugmentation'

// Exact hex values from /public/design-system/colors_and_type.css
// Hardcoded here so MUI can compute derived colours (hover, focus, contrast text).
// The CSS vars remain the source of truth for all non-MUI component styling.
export const nexaiTheme = createTheme({
  palette: {
    primary: {
      light: '#ffb282',   // --brand-300
      main:  '#eb6a2c',   // --brand-500 (Excellon orange)
      dark:  '#9e320e',   // --brand-700
      contrastText: '#ffffff',
    },
    error: {
      light: '#fef3f2',   // --error-50
      main:  '#f04438',   // --error-500
      dark:  '#b42318',   // --error-700
      contrastText: '#ffffff',
    },
    warning: {
      light: '#fffaeb',   // --warning-50
      main:  '#f79009',   // --warning-500
      dark:  '#b54708',   // --warning-700
    },
    success: {
      light: '#ecfdf3',   // --success-50
      main:  '#12b76a',   // --success-500
      dark:  '#027a48',   // --success-700
      contrastText: '#ffffff',
    },
    info: {
      light: '#eff8ff',   // --info-50
      main:  '#2e90fa',   // --info-500
      dark:  '#175cd3',   // --info-700
      contrastText: '#ffffff',
    },
    text: {
      primary:   '#1b1d21',  // --fg-primary
      secondary: '#505862',  // --fg-secondary
      disabled:  '#a8b5c2',  // --fg-disabled
    },
    background: {
      default: '#f4f7fa',  // --bg-secondary
      paper:   '#ffffff',  // --bg-primary
    },
    divider: '#dee4eb',    // --border-secondary
    grey: {
      50:  '#f4f7fa',
      100: '#eff2f5',
      200: '#dee4eb',
      300: '#c3ccd6',
      400: '#a8b5c2',
      500: '#8593a3',
      600: '#6a7682',
      700: '#505862',
      800: '#353b41',
      900: '#1b1d21',
    },
  },

  typography: {
    fontFamily: '"Noto Sans", system-ui, -apple-system, sans-serif',
    fontSize: 13,
    fontWeightRegular: 400,
    fontWeightMedium:  500,
    fontWeightBold:    600,
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 8,   // --radius-lg — matches buttons, inputs, cards
  },

  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: 0,
        },
        sizeSmall: { padding: '4px 12px', fontSize: '0.75rem' },
        sizeMedium: { padding: '7px 16px', fontSize: '0.8125rem' },
        sizeLarge: { padding: '10px 20px', fontSize: '0.875rem' },
      },
    },

    MuiTextField: {
      defaultProps: { size: 'small', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '0.8125rem',
            backgroundColor: '#ffffff',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#eb6a2c',
              boxShadow: '0 0 0 3px rgba(235,106,44,0.15)',
            },
          },
        },
      },
    },

    MuiSelect: {
      defaultProps: { size: 'small' },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          fontWeight: 500,
          color: '#505862',
          '&.Mui-focused': { color: '#eb6a2c' },
        },
      },
    },

    MuiFormHelperText: {
      styleOverrides: {
        root: { fontSize: '0.7rem', marginTop: 4 },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
          fontWeight: 600,
          padding: '20px 24px 12px',
          color: '#1b1d21',
        },
      },
    },

    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '0 24px 8px' },
      },
    },

    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '12px 24px 20px', gap: 8 },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.8125rem' },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontSize: '0.75rem', fontWeight: 500 },
        sizeSmall: { height: 22 },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1b1d21',
          fontSize: '0.7rem',
          fontWeight: 500,
          borderRadius: 6,
          padding: '4px 8px',
        },
        arrow: { color: '#1b1d21' },
      },
    },

    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 36 },
        indicator: { backgroundColor: '#eb6a2c', height: 2 },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          minHeight: 36,
          padding: '8px 16px',
          color: '#505862',
          '&.Mui-selected': { color: '#eb6a2c', fontWeight: 600 },
        },
      },
    },

    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #dee4eb',
          borderRadius: '8px !important',
          '&:before': { display: 'none' },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 44, padding: '0 16px' },
        content: { margin: '10px 0' },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: '1px solid #dee4eb',
          borderRadius: 10,
        },
      },
    },

    MuiDataGrid: {
      defaultProps: {
        disableRowSelectionOnClick: true,
        density: 'compact',
      },
      styleOverrides: {
        root: {
          border: 'none',
          fontFamily: '"Noto Sans", system-ui, sans-serif',
          fontSize: '0.8125rem',
          color: '#1b1d21',
        },
        columnHeader: {
          backgroundColor: '#f4f7fa',
          fontWeight: 600,
          fontSize: '0.75rem',
          color: '#505862',
        },
        row: {
          '&:hover': { backgroundColor: '#fff7f0' },
          '&.Mui-selected': {
            backgroundColor: '#ffe7d4',
            '&:hover': { backgroundColor: '#ffceab' },
          },
        },
        cell: {
          borderBottom: '1px solid #eff2f5',
        },
        footerContainer: {
          borderTop: '1px solid #dee4eb',
          backgroundColor: '#f4f7fa',
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 9999, height: 6 },
        bar: { borderRadius: 9999 },
      },
    },

    MuiCircularProgress: {
      defaultProps: { size: 24 },
    },

    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 4 },
      },
    },

    MuiSwitch: {
      defaultProps: { size: 'small' },
    },
  },
})
