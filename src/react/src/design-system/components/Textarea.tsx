import { useRef } from 'react'

export interface TextareaProps {
  label?: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
}

export function Textarea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  error,
  hint,
  disabled,
}: TextareaProps) {
  const idRef = useRef(`ta-${Math.random().toString(36).slice(2)}`)
  const id = idRef.current

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-secondary)' }}
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: `1px solid ${error ? 'var(--border-error)' : 'var(--border-primary)'}`,
          borderRadius: 'var(--radius-lg)',
          background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          color: 'var(--fg-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)',
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'auto',
        }}
      />
      {error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)' }}>{error}</span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{hint}</span>
      )}
    </div>
  )
}
