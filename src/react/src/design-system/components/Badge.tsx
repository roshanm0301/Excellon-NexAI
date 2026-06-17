import type { CSSProperties, ReactNode } from 'react'

// 'warning' is an alias for 'warn'; 'neutral' is an alias for 'gray'
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

function resolveVariant(v: BadgeVariant): string {
  if (v === 'warning') return 'warn'
  if (v === 'neutral') return 'gray'
  return v
}

export function Badge({ variant = 'gray', dot = true, children, style, className }: BadgeProps) {
  return (
    <span
      className={`ex-badge ${resolveVariant(variant)}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {dot && <span className="dot" />}
      {children}
    </span>
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
  // Surface types — distinct colors for at-a-glance scanning
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
  return (
    <Badge variant={variant}>
      {label ?? status}
    </Badge>
  )
}
