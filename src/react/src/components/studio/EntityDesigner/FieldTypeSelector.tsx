import { Select } from '../../../design-system'

export const FIELD_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'text', label: 'Text (long)' },
  { value: 'number', label: 'Number' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'enum', label: 'Enum (picklist)' },
  { value: 'reference', label: 'Reference' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'uuid', label: 'UUID' },
  { value: 'computed', label: 'Computed' },
  { value: 'json', label: 'JSON / Array' },
]

interface FieldTypeSelectorProps {
  value: string
  onChange: (type: string) => void
  disabled?: boolean
  label?: string
}

export function FieldTypeSelector({ value, onChange, disabled, label = 'Type' }: FieldTypeSelectorProps) {
  return (
    <Select
      label={label}
      value={value}
      onChange={e => onChange(e.target.value)}
      options={FIELD_TYPES}
      disabled={disabled}
      placeholder="Select type…"
    />
  )
}
