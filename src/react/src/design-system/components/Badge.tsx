import type { CSSProperties, ReactNode } from 'react'
import MuiChip from '@mui/material/Chip'

export type BadgeVariant =
  | 'success' | 'warn' | 'warning'
  | 'error'
  | 'info'
  | 'neutral' | 'gray'
  | 'purple' | 'brand'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
  style?: CSSProperties
  className?: string
}

const VARIANT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  success: { bg: '#ecfdf3', text: '#027a48', border: '#12b76a' },
  warn:    { bg: '#fffaeb', text: '#b54708', border: '#f79009' },
  error:   { bg: '#fef3f2', text: '#b42318', border: '#f04438' },
  info:    { bg: '#eff8ff', text: '#175cd3', border: '#2e90fa' },
  gray:    { bg: '#f4f7fa', text: '#505862', border: '#dee4eb' },
  purple:  { bg: '#f5f0ff', text: '#6929c4', border: '#d2b0ff' },
  brand:   { bg: '#fff7f0', text: '#c44b1b', border: '#ffb282' },
}

function resolveVariant(v: BadgeVariant): string {
  if (v === 'warning') return 'warn'
  if (v === 'neutral') return 'gray'
  return v
}

export function Badge({ variant = 'gray', dot = true, children, style, className }: BadgeProps) {
  const key = resolveVariant(variant)
  const colors = VARIANT_COLORS[key] ?? VARIANT_COLORS.gray

  const label = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: colors.border, flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )

  return (
    <MuiChip
      label={label}
      size="small"
      className={className}
      style={style}
      sx={{
        height: 22,
        borderRadius: '9999px',
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontWeight: 500,
        fontSize: '0.6875rem',
        '.MuiChip-label': { px: '8px' },
      }}
    />
  )
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  draft: 'gray',
  'in-review': 'warn',
  published: 'success',
  deprecated: 'error',
  active: 'success',
  inactive: 'gray',
  pending: 'warn',
  warning: 'warning',
  failed: 'error',
  standard_crud: 'info',
  advanced_crud: 'purple',
  header_line: 'brand',
  dashboard: 'success',
  wizard: 'warn',
  detail_page: 'gray',
  split_view: 'info',
  kanban: 'warn',
  calendar: 'success',
  custom_page: 'gray',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'gray'
  return <Badge variant={variant}>{label ?? status}</Badge>
}
