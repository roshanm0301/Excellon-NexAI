import { Input, NumberInput } from '../../../design-system'

export interface ValidationConfig {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  precision?: number
  scale?: number
  minDate?: string
  maxDate?: string
}

interface FieldValidationEditorProps {
  type: string
  value: ValidationConfig
  onChange: (v: ValidationConfig) => void
}

export function FieldValidationEditor({ type, value, onChange }: FieldValidationEditorProps) {
  const set = (key: keyof ValidationConfig, val: number | string | '') => {
    onChange({ ...value, [key]: val === '' ? undefined : val })
  }

  if (type === 'string') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <NumberInput
          label="Min Length"
          value={value.minLength ?? ''}
          onChange={v => set('minLength', v)}
          min={0}
        />
        <NumberInput
          label="Max Length"
          value={value.maxLength ?? ''}
          onChange={v => set('maxLength', v)}
          min={0}
        />
        <div style={{ gridColumn: '1 / -1' }}>
          <Input
            label="Pattern (regex)"
            value={value.pattern ?? ''}
            onChange={e => set('pattern', e.target.value)}
            placeholder="e.g. ^[A-Z]+"
          />
        </div>
      </div>
    )
  }

  if (type === 'text') {
    return (
      <NumberInput
        label="Max Length"
        value={value.maxLength ?? ''}
        onChange={v => set('maxLength', v)}
        min={0}
      />
    )
  }

  if (type === 'number' || type === 'decimal') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <NumberInput label="Min" value={value.min ?? ''} onChange={v => set('min', v)} />
        <NumberInput label="Max" value={value.max ?? ''} onChange={v => set('max', v)} />
        <NumberInput label="Precision" value={value.precision ?? ''} onChange={v => set('precision', v)} min={0} />
      </div>
    )
  }

  if (type === 'integer') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <NumberInput label="Min" value={value.min ?? ''} onChange={v => set('min', v)} />
        <NumberInput label="Max" value={value.max ?? ''} onChange={v => set('max', v)} />
      </div>
    )
  }

  if (type === 'date' || type === 'datetime') {
    const inputType = type === 'datetime' ? 'datetime-local' : 'date'
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input
          label="Min Date"
          type={inputType}
          value={value.minDate ?? ''}
          onChange={e => set('minDate', e.target.value)}
        />
        <Input
          label="Max Date"
          type={inputType}
          value={value.maxDate ?? ''}
          onChange={e => set('maxDate', e.target.value)}
        />
      </div>
    )
  }

  return (
    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)', margin: 0 }}>
      No validation options for this field type.
    </p>
  )
}
