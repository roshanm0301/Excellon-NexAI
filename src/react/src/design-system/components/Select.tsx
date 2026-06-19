import type { SelectHTMLAttributes } from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import NativeSelect from '@mui/material/NativeSelect'
import FormHelperText from '@mui/material/FormHelperText'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}

let _idCounter = 0

export function Select({ label, hint, error, options, placeholder, id, disabled, ...props }: SelectProps) {
  const selectId = id ?? `sel-${++_idCounter}`

  return (
    <FormControl fullWidth size="small" error={!!error} disabled={disabled}>
      {label && <InputLabel htmlFor={selectId}>{label}</InputLabel>}
      <NativeSelect
        inputProps={{ id: selectId, ...props }}
        sx={{
          '&:before': { borderColor: error ? 'var(--border-error)' : 'var(--border-primary)' },
          '& select': {
            fontSize: '0.8125rem',
            color: 'var(--fg-primary)',
            fontFamily: 'var(--font-sans)',
            bgcolor: 'var(--bg-primary)',
            py: '8px',
          },
        }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </NativeSelect>
      {(error || hint) && (
        <FormHelperText sx={{ color: error ? 'var(--error-600)' : 'var(--fg-tertiary)' }}>
          {error ?? hint}
        </FormHelperText>
      )}
    </FormControl>
  )
}
