import type { ReactNode } from 'react'

type BadgeVariant = 'success' | 'warn' | 'error' | 'info' | 'purple' | 'brand' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  dot?: boolean
  children: ReactNode
}

export function Badge({ variant = 'gray', dot = true, children }: BadgeProps) {
  return (
    <span className={`ex-badge ${variant}`}>
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
  failed: 'error',
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'gray'
  return (
    <Badge variant={variant}>
      {label ?? status}
    </Badge>
  )
}
