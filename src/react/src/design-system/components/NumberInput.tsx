import { useRef } from 'react'

export interface NumberInputProps {
  label?: string
  value: number | ''
  onChange: (value: number | '') => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
  error,
  hint,
  disabled,
}: NumberInputProps) {
  const idRef = useRef(`ni-${Math.random().toString(36).slice(2)}`)
  const id = idRef.current

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') {
      onChange('')
    } else {
      const parsed = Number(raw)
      if (!isNaN(parsed)) onChange(parsed)
    }
  }

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
      <input
        id={id}
        type="number"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          height: 40,
          padding: '0 12px',
          border: `1px solid ${error ? 'var(--border-error)' : 'var(--border-primary)'}`,
          borderRadius: 'var(--radius-lg)',
          background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
          color: 'var(--fg-primary)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-sans)',
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
