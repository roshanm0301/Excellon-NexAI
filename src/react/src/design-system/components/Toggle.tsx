type ToggleSize = 'sm' | 'md'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: ToggleSize
}

const SIZE_CONFIG: Record<ToggleSize, { track: { w: number; h: number }; thumb: number; onLeft: number }> = {
  sm: { track: { w: 28, h: 16 }, thumb: 12, onLeft: 14 },
  md: { track: { w: 36, h: 20 }, thumb: 16, onLeft: 18 },
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const { track, thumb, onLeft } = SIZE_CONFIG[size]
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)',
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}>
      <span style={{
        position: 'relative', width: track.w, height: track.h, flexShrink: 0,
        background: checked ? 'var(--brand-500)' : 'var(--neutral-300)',
        borderRadius: 'var(--radius-full)', transition: 'background 150ms',
        opacity: disabled ? 0.5 : 1,
      }}>
        <span style={{
          position: 'absolute', top: 2, left: checked ? onLeft : 2,
          width: thumb, height: thumb, background: 'white',
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
