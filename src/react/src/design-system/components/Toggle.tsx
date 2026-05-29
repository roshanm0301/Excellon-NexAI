interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <span style={{
        position: 'relative', width: 36, height: 20, flexShrink: 0,
        background: checked ? 'var(--brand-500)' : 'var(--neutral-300)',
        borderRadius: 'var(--radius-full)', transition: 'background 150ms',
        opacity: disabled ? 0.5 : 1,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, background: 'white',
          borderRadius: 'var(--radius-full)', transition: 'left 150ms',
          boxShadow: 'var(--shadow-xs)',
        }} />
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
        />
      </span>
      {label && <span className="label" style={{ color: 'var(--fg-primary)' }}>{label}</span>}
    </label>
  )
}
