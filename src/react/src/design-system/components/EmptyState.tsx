import type { ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: '64px 32px', textAlign: 'center', gap: 1,
    }}>
      {icon && <Box sx={{ color: 'var(--neutral-300)', mb: 1 }}>{icon}</Box>}
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--fg-primary)' }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: 'var(--fg-tertiary)', maxWidth: 360, lineHeight: 1.5 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1 }}>{action}</Box>}
    </Box>
  )
}
