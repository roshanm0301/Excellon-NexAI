import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-32) var(--space-16)',
        textAlign: 'center',
        gap: 'var(--space-4)',
      }}
    >
      {/* Error icon */}
      <div style={{ color: 'var(--error-500)', marginBottom: 8 }}>
        <svg
          width={40}
          height={40}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx={12} cy={12} r={10} />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      </div>

      <div
        style={{
          fontSize: 'var(--text-md)',
          fontWeight: 600,
          color: 'var(--fg-primary)',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--fg-tertiary)',
          maxWidth: 360,
          lineHeight: 'var(--lh-sm)',
        }}
      >
        {message}
      </div>

      {onRetry && (
        <div style={{ marginTop: 8 }}>
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
