import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Modal, Button, Toggle, useToast, Spinner } from '../../../design-system'
import { getEntityFields } from '../../../config/studioApi'
import { useCreateEntityRecord } from '../../../hooks/useEntityRecords'
import type { EntityFieldDef } from '../../../types/viewStudio'

interface RuntimeCreateModalProps {
  open: boolean
  onClose: () => void
  entityType: string
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: EntityFieldDef
  value: unknown
  onChange: (val: unknown) => void
}) {
  const type = field.field_type

  if (type === 'boolean') {
    return (
      <div className="rv-toggle-row">
        <Toggle
          checked={value === true || value === 'true'}
          onChange={checked => onChange(checked)}
        />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
          {value === true || value === 'true' ? 'Yes' : 'No'}
        </span>
      </div>
    )
  }

  if (type === 'enum' && Array.isArray(field.options) && field.options.length > 0) {
    return (
      <div className="rv-field-wrapper">
        <select
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    )
  }

  if (type === 'integer' || type === 'decimal') {
    return (
      <div className="rv-field-wrapper">
        <input
          type="number"
          value={String(value ?? '')}
          onChange={e => onChange(type === 'integer' ? parseInt(e.target.value || '0') : parseFloat(e.target.value || '0'))}
          step={type === 'decimal' ? '0.01' : '1'}
        />
      </div>
    )
  }

  if (type === 'date') {
    return (
      <div className="rv-field-wrapper">
        <input
          type="date"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    )
  }

  return (
    <div className="rv-field-wrapper">
      <input
        type="text"
        value={String(value ?? '')}
        onChange={e => onChange(e.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}…`}
      />
    </div>
  )
}

export function RuntimeCreateModal({ open, onClose, entityType }: RuntimeCreateModalProps) {
  const { addToast } = useToast()
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: schemaData, isLoading: schemaLoading } = useQuery({
    queryKey: ['entity-fields', entityType],
    queryFn: () => getEntityFields(entityType),
    enabled: open && !!entityType,
    staleTime: 300_000,
  })

  const createMutation = useCreateEntityRecord(entityType)

  const fields: EntityFieldDef[] = schemaData?.items ?? []

  const handleChange = (key: string, val: unknown) => {
    setFormData(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    fields.forEach(f => {
      if (f.required && !formData[f.field_key] && formData[f.field_key] !== false && formData[f.field_key] !== 0) {
        errs[f.field_key] = `${f.label} is required`
      }
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    // Strip empty strings from payload; keep booleans and 0 as-is
    const cleanPayload: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(formData)) {
      if (v !== '' && v !== null && v !== undefined) {
        cleanPayload[k] = v
      }
    }
    try {
      await createMutation.mutateAsync(cleanPayload)
      addToast({ type: 'success', message: 'Product created successfully' })
      setFormData({})
      setErrors({})
      onClose()
    } catch {
      addToast({ type: 'error', message: 'Failed to create product' })
    }
  }

  const handleClose = () => {
    setFormData({})
    setErrors({})
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="New Product"
      size="md"
      data-testid="rv-create-modal"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={createMutation.isPending}
            data-testid="rv-create-save"
          >
            {createMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      {schemaLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner />
        </div>
      ) : (
        <div className="rv-create-form">
          {fields.map(field => (
            <div key={field.field_key}>
              <label className="rv-field-label">
                {field.label}
                {field.required && <span className="rv-required">*</span>}
              </label>
              <FieldInput
                field={field}
                value={formData[field.field_key] ?? ''}
                onChange={val => handleChange(field.field_key, val)}
              />
              {errors[field.field_key] && (
                <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--error-fg, #ef4444)' }}>
                  {errors[field.field_key]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
