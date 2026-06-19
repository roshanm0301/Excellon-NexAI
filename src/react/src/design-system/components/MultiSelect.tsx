import { type SelectChangeEvent } from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MuiSelect from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import FormHelperText from '@mui/material/FormHelperText'
import Box from '@mui/material/Box'

export interface MultiSelectOption {
  value: string
  label: string
}

export interface MultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  error?: string
  hint?: string
}

let _idCounter = 0

export function MultiSelect({
  label, options, value, onChange, placeholder = 'Select…', error, hint,
}: MultiSelectProps) {
  const id = `ms-${++_idCounter}`

  const handleChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value
    onChange(typeof val === 'string' ? val.split(',') : val)
  }

  const optionMap = Object.fromEntries(options.map(o => [o.value, o.label]))

  return (
    <FormControl fullWidth size="small" error={!!error}>
      {label && <InputLabel id={`${id}-label`}>{label}</InputLabel>}
      <MuiSelect
        labelId={`${id}-label`}
        multiple
        value={value}
        onChange={handleChange}
        label={label}
        displayEmpty={!label}
        renderValue={selected =>
          selected.length === 0 ? (
            <span style={{ color: 'var(--fg-quaternary)', fontSize: '0.8125rem' }}>{placeholder}</span>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(selected as string[]).map(v => (
                <Chip
                  key={v}
                  label={optionMap[v] ?? v}
                  size="small"
                  onDelete={e => {
                    e.stopPropagation()
                    onChange(value.filter(x => x !== v))
                  }}
                  onMouseDown={e => e.stopPropagation()}
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    bgcolor: 'var(--brand-50)',
                    color: 'var(--brand-700)',
                    border: '1px solid var(--brand-200)',
                    '& .MuiChip-deleteIcon': { color: 'var(--brand-500)', fontSize: 14 },
                  }}
                />
              ))}
            </Box>
          )
        }
        MenuProps={{ slotProps: { paper: { sx: { maxHeight: 240 } } } }}
      >
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8125rem' }}>
            {opt.label}
          </MenuItem>
        ))}
      </MuiSelect>
      {(error || hint) && (
        <FormHelperText sx={{ color: error ? 'var(--error-600)' : 'var(--fg-tertiary)' }}>
          {error ?? hint}
        </FormHelperText>
      )}
    </FormControl>
  )
}
