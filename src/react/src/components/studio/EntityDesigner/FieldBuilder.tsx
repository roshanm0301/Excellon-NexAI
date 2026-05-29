import { useState, type ReactNode } from 'react'
import { Trash2, Settings, Lock, Plus } from 'lucide-react'
import {
  AccordionRow, Button, IconButton, Input, Checkbox,
  Select, MultiSelect, Badge,
} from '../../../design-system'
import { FieldTypeSelector } from './FieldTypeSelector'
import { FieldValidationEditor, type ValidationConfig } from './FieldValidationEditor'
import { IDConfigPanel, type IDConfig } from './IDConfigPanel'

export interface FieldDef {
  name: string
  label: string
  type: string
  required: boolean
  unique: boolean
  indexed: boolean
  storageType: 'physical' | 'computed'
  computeExpression?: string
  nullText?: string
  displayMask?: string
  readOnly?: boolean
  lookupType?: 'none' | 'picklist' | 'datasource'
  picklistKey?: string
  datasourceKey?: string
  referenceEntity?: string
  displayField?: string
  valueField?: string
  piiCategory?: 'none' | 'indirect' | 'direct' | 'special_category' | 'biometric'
  maskingRule?: string
  visibleRoles?: string[]
  legalBasis?: string
  retentionDays?: number
  validation?: ValidationConfig
}

interface FieldBuilderProps {
  fields: FieldDef[]
  onChange: (fields: FieldDef[]) => void
  idConfig: IDConfig
  onIdConfigChange: (c: IDConfig) => void
}

const SYSTEM_FIELDS = ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'VIEWER', label: 'Viewer' },
]

const PII_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'indirect', label: 'Indirect' },
  { value: 'direct', label: 'Direct' },
  { value: 'special_category', label: 'Special Category' },
  { value: 'biometric', label: 'Biometric' },
]

function updateField(fields: FieldDef[], idx: number, patch: Partial<FieldDef>): FieldDef[] {
  return fields.map((f, i) => i === idx ? { ...f, ...patch } : f)
}

export function FieldBuilder({ fields, onChange, idConfig, onIdConfigChange }: FieldBuilderProps) {
  const [idConfigOpen, setIdConfigOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const addField = () => {
    onChange([...fields, {
      name: '',
      label: '',
      type: 'string',
      required: false,
      unique: false,
      indexed: false,
      storageType: 'physical',
    }])
  }

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx))
  }

  const handleDragStart = (idx: number) => setDragIdx(idx)
  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) return
    const next = [...fields]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(targetIdx, 0, moved)
    onChange(next)
    setDragIdx(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* System fields */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        padding: '10px 14px',
        marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Lock size={14} style={{ color: 'var(--fg-tertiary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            System Fields (locked)
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SYSTEM_FIELDS.map(name => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
              <Lock size={12} style={{ color: 'var(--fg-disabled)', flexShrink: 0 }} />
              <code style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', flex: 1 }}>{name}</code>
              {name === 'id' && (
                <IconButton
                  onClick={() => setIdConfigOpen(true)}
                  title="Configure ID strategy"
                  style={{ width: 24, height: 24 }}
                >
                  <Settings size={14} />
                </IconButton>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User fields */}
      {fields.map((field, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={e => e.preventDefault()}
          onDrop={() => handleDrop(idx)}
          style={{ opacity: dragIdx === idx ? 0.5 : 1 }}
        >
          <AccordionRow
            dragHandle
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>
                  {field.name || <em style={{ color: 'var(--fg-tertiary)' }}>unnamed</em>}
                </span>
                <Badge variant="gray" dot={false}>{field.type}</Badge>
                {field.required && <Badge variant="brand" dot={false}>required</Badge>}
              </div>
            }
            right={
              <IconButton
                onClick={e => { e.stopPropagation(); removeField(idx) }}
                title="Remove field"
                style={{ width: 28, height: 28, color: 'var(--error-500)' }}
              >
                <Trash2 size={14} />
              </IconButton>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Core */}
              <FieldSection title="Core">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="Field Name (snake_case)"
                    value={field.name}
                    onChange={e => onChange(updateField(fields, idx, { name: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    placeholder="e.g. customer_name"
                  />
                  <Input
                    label="Label"
                    value={field.label}
                    onChange={e => onChange(updateField(fields, idx, { label: e.target.value }))}
                    placeholder="e.g. Customer Name"
                  />
                  <FieldTypeSelector
                    value={field.type}
                    onChange={type => onChange(updateField(fields, idx, { type }))}
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                    <Checkbox
                      label="Required"
                      checked={field.required}
                      onChange={required => onChange(updateField(fields, idx, { required }))}
                    />
                  </div>
                </div>
              </FieldSection>

              {/* Storage */}
              <FieldSection title="Storage">
                <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
                  {(['physical', 'computed'] as const).map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>
                      <input
                        type="radio"
                        name={`storage-${idx}`}
                        value={s}
                        checked={field.storageType === s}
                        onChange={() => onChange(updateField(fields, idx, { storageType: s }))}
                      />
                      {s === 'physical' ? 'Physical (stored)' : 'Computed (expression)'}
                    </label>
                  ))}
                </div>
                {field.storageType === 'computed' && (
                  <Input
                    label="Compute Expression (JSONata)"
                    value={field.computeExpression ?? ''}
                    onChange={e => onChange(updateField(fields, idx, { computeExpression: e.target.value }))}
                    placeholder="e.g. unit_price * qty"
                  />
                )}
              </FieldSection>

              {/* Display */}
              <FieldSection title="Display">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    label="Null Text"
                    value={field.nullText ?? ''}
                    onChange={e => onChange(updateField(fields, idx, { nullText: e.target.value }))}
                    placeholder="e.g. —"
                  />
                  <Input
                    label="Display Mask"
                    value={field.displayMask ?? ''}
                    onChange={e => onChange(updateField(fields, idx, { displayMask: e.target.value }))}
                    placeholder="e.g. ###-####"
                  />
                  <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                    <Checkbox
                      label="Read Only"
                      checked={field.readOnly ?? false}
                      onChange={readOnly => onChange(updateField(fields, idx, { readOnly }))}
                    />
                  </div>
                </div>
              </FieldSection>

              {/* Lookup — only for enum */}
              {field.type === 'enum' && (
                <FieldSection title="Lookup">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                      {(['none', 'picklist', 'datasource'] as const).map(lt => (
                        <label key={lt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>
                          <input
                            type="radio"
                            name={`lookup-${idx}`}
                            value={lt}
                            checked={(field.lookupType ?? 'none') === lt}
                            onChange={() => onChange(updateField(fields, idx, { lookupType: lt }))}
                          />
                          {lt.charAt(0).toUpperCase() + lt.slice(1)}
                        </label>
                      ))}
                    </div>
                    {field.lookupType === 'picklist' && (
                      <Input
                        label="Picklist Key"
                        value={field.picklistKey ?? ''}
                        onChange={e => onChange(updateField(fields, idx, { picklistKey: e.target.value }))}
                      />
                    )}
                    {field.lookupType === 'datasource' && (
                      <Input
                        label="Datasource Key"
                        value={field.datasourceKey ?? ''}
                        onChange={e => onChange(updateField(fields, idx, { datasourceKey: e.target.value }))}
                      />
                    )}
                  </div>
                </FieldSection>
              )}

              {/* Reference */}
              {field.type === 'reference' && (
                <FieldSection title="Reference">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input
                      label="Reference Entity"
                      value={field.referenceEntity ?? ''}
                      onChange={e => onChange(updateField(fields, idx, { referenceEntity: e.target.value }))}
                      placeholder="e.g. customer"
                    />
                    <Input
                      label="Display Field"
                      value={field.displayField ?? 'name'}
                      onChange={e => onChange(updateField(fields, idx, { displayField: e.target.value }))}
                    />
                    <Input
                      label="Value Field"
                      value={field.valueField ?? 'id'}
                      onChange={e => onChange(updateField(fields, idx, { valueField: e.target.value }))}
                    />
                  </div>
                </FieldSection>
              )}

              {/* Compliance & Privacy */}
              <FieldSection title="Compliance & Privacy">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Select
                    label="PII Category"
                    value={field.piiCategory ?? 'none'}
                    onChange={e => onChange(updateField(fields, idx, { piiCategory: e.target.value as FieldDef['piiCategory'] }))}
                    options={PII_OPTIONS}
                  />
                  <Input
                    label="Masking Rule"
                    value={field.maskingRule ?? ''}
                    onChange={e => onChange(updateField(fields, idx, { maskingRule: e.target.value }))}
                    placeholder="e.g. name, email"
                  />
                  <div style={{ gridColumn: '1 / -1' }}>
                    <MultiSelect
                      label="Visible Roles"
                      options={ROLE_OPTIONS}
                      value={field.visibleRoles ?? []}
                      onChange={visibleRoles => onChange(updateField(fields, idx, { visibleRoles }))}
                    />
                  </div>
                  <Input
                    label="Legal Basis"
                    value={field.legalBasis ?? ''}
                    onChange={e => onChange(updateField(fields, idx, { legalBasis: e.target.value }))}
                    placeholder="e.g. GDPR Article 6(1)(b)"
                  />
                  <Input
                    label="Retention Days"
                    type="number"
                    value={field.retentionDays !== undefined ? String(field.retentionDays) : ''}
                    onChange={e => onChange(updateField(fields, idx, { retentionDays: e.target.value ? Number(e.target.value) : undefined }))}
                    placeholder="e.g. 730"
                  />
                </div>
              </FieldSection>

              {/* Validation */}
              <FieldSection title="Validation">
                <FieldValidationEditor
                  type={field.type}
                  value={field.validation ?? {}}
                  onChange={validation => onChange(updateField(fields, idx, { validation }))}
                />
              </FieldSection>
            </div>
          </AccordionRow>
        </div>
      ))}

      <Button
        variant="secondary"
        icon={<Plus size={16} />}
        onClick={addField}
        style={{ alignSelf: 'flex-start', marginTop: 4 }}
      >
        Add Field
      </Button>

      <IDConfigPanel
        open={idConfigOpen}
        onClose={() => setIdConfigOpen(false)}
        value={idConfig}
        onChange={onIdConfigChange}
      />
    </div>
  )
}

function FieldSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: '12px 14px' }}>
      <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', padding: '0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {title}
      </legend>
      {children}
    </fieldset>
  )
}
