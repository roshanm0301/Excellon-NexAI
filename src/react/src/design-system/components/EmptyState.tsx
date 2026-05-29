import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-32) var(--space-16)', textAlign: 'center', gap: 'var(--space-4)',
    }}>
      {icon && <div style={{ color: 'var(--neutral-300)', marginBottom: 'var(--space-4)' }}>{icon}</div>}
      <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</div>
      {description && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)', maxWidth: 360, lineHeight: 'var(--lh-sm)' }}>{description}</div>}
      {action && <div style={{ marginTop: 'var(--space-4)' }}>{action}</div>}
    </div>
  )
}
