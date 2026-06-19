import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  /** Primary error detail. Use either `message` or `description` — they are equivalent. */
  message?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, description, onRetry }: ErrorStateProps) {
  const text = message ?? description ?? ''
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: '64px 32px', textAlign: 'center', gap: 1,
    }}>
      <Box sx={{ color: 'var(--error-500)', mb: 1 }}>
        <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <circle cx={12} cy={12} r={10} />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </Box>
      <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--fg-primary)' }}>{title}</Typography>
      <Typography variant="body2" sx={{ color: 'var(--fg-tertiary)', maxWidth: 360, lineHeight: 1.5 }}>
        {text}
      </Typography>
      {onRetry && (
        <Box sx={{ mt: 1 }}>
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </Box>
      )}
    </Box>
  )
}
