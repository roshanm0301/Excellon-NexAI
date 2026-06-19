import MuiCheckbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}

export function Checkbox({ checked, onChange, label, disabled, indeterminate }: CheckboxProps) {
  const checkboxEl = (
    <MuiCheckbox
      checked={checked}
      indeterminate={indeterminate && !checked}
      onChange={e => onChange(e.target.checked)}
      disabled={disabled}
      size="small"
      sx={{
        p: '2px',
        color: 'var(--border-primary)',
        '&.Mui-checked, &.MuiCheckbox-indeterminate': { color: 'var(--brand-500)' },
      }}
    />
  )

  if (!label) return checkboxEl

  return (
    <FormControlLabel
      control={checkboxEl}
      label={label}
      disabled={disabled}
      sx={{
        m: 0, gap: '6px',
        '& .MuiFormControlLabel-label': {
          fontSize: '0.8125rem',
          color: disabled ? 'var(--fg-disabled)' : 'var(--fg-primary)',
        },
      }}
    />
  )
}
