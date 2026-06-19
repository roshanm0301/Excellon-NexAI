import MuiSwitch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

type ToggleSize = 'sm' | 'md'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: ToggleSize
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const switchEl = (
    <MuiSwitch
      checked={checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      size={size === 'sm' ? 'small' : 'medium'}
      sx={{
        '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--brand-500)' },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--brand-500)' },
      }}
    />
  )

  if (!label) return switchEl

  return (
    <FormControlLabel
      control={switchEl}
      label={label}
      disabled={disabled}
      sx={{
        m: 0, gap: 0,
        '& .MuiFormControlLabel-label': {
          fontSize: '0.8125rem',
          color: disabled ? 'var(--fg-disabled)' : 'var(--fg-primary)',
        },
      }}
    />
  )
}
