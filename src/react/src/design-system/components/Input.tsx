import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  icon?: ReactNode
  prefix?: string
  suffix?: string
}

export function Input({
  label, hint, error, icon, prefix, suffix,
  id, disabled, value, onChange, placeholder,
  type, autoFocus, autoComplete, maxLength, minLength, name, required, readOnly,
}: InputProps) {
  return (
    <TextField
      id={id}
      label={label}
      helperText={error ?? hint}
      error={!!error}
      disabled={disabled}
      value={value}
      onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
      placeholder={placeholder}
      type={type}
      name={name}
      required={required}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      fullWidth
      size="small"
      slotProps={{
        input: {
          readOnly,
          startAdornment: (icon || prefix) ? (
            <InputAdornment position="start">
              {icon ?? <span style={{ fontSize: '0.8rem', color: 'var(--fg-tertiary)' }}>{prefix}</span>}
            </InputAdornment>
          ) : undefined,
          endAdornment: suffix ? (
            <InputAdornment position="end">
              <span style={{ fontSize: '0.8rem', color: 'var(--fg-tertiary)' }}>{suffix}</span>
            </InputAdornment>
          ) : undefined,
        },
        htmlInput: { maxLength, minLength },
        formHelperText: {
          sx: { color: error ? 'var(--error-600)' : 'var(--fg-tertiary)' },
        },
      }}
    />
  )
}

export function SearchInput({
  value, onChange, placeholder = 'Search...', disabled,
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <TextField
      value={value}
      onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
      placeholder={placeholder}
      disabled={disabled}
      size="small"
      fullWidth
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 16, color: 'var(--fg-tertiary)' }} />
            </InputAdornment>
          ),
        },
      }}
      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'var(--bg-primary)' } }}
    />
  )
}

export function Textarea({
  label, hint, error, id, disabled, value, onChange, placeholder, rows, maxLength, name,
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: string; error?: string }) {
  return (
    <TextField
      id={id}
      label={label}
      helperText={error ?? hint}
      error={!!error}
      disabled={disabled}
      value={value}
      onChange={onChange as unknown as React.ChangeEventHandler<HTMLInputElement>}
      placeholder={placeholder}
      name={name}
      multiline
      rows={rows ?? 4}
      fullWidth
      size="small"
      slotProps={{
        htmlInput: { maxLength },
        formHelperText: {
          sx: { color: error ? 'var(--error-600)' : 'var(--fg-tertiary)' },
        },
      }}
    />
  )
}
