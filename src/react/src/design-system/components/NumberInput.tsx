import TextField from '@mui/material/TextField'

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
  label, value, onChange, min, max, step, placeholder, error, hint, disabled,
}: NumberInputProps) {
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
    <TextField
      type="number"
      label={label}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      placeholder={placeholder}
      helperText={error ?? hint}
      error={!!error}
      fullWidth
      size="small"
      slotProps={{
        htmlInput: { min, max, step },
        formHelperText: {
          sx: { color: error ? 'var(--error-600)' : 'var(--fg-tertiary)' },
        },
      }}
    />
  )
}
