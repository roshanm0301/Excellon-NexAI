import { useState, type ReactNode } from 'react'
import { Trash2, Settings, Lock, Plus, GripVertical, Eye, EyeOff } from 'lucide-react'
import {
  Button, IconButton, Input, Checkbox,
  Select, MultiSelect, Badge, LayerBadge,
} from '../../../design-system'
import type { Layer } from '../../../design-system'
import { FieldTypeSelector } from './FieldTypeSelector'
import { FieldValidationEditor, type ValidationConfig } from './FieldValidationEditor'
import { IDConfigPanel, type IDConfig } from './IDConfigPanel'
import { FieldPropertiesPanel } from './FieldPropertiesPanel'

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
  layer?: Layer
  visibility?: 'all' | 'auth' | 'admin'
  classification?: string
  searchable?: boolean
  enumValues?: Array<{ code: string; label: string; sortOrder?: number }>
}

interface FieldBuilderProps {
  fields: FieldDef[]
  onChange: (fields: FieldDef[]) => void
  idConfig: IDConfig
  onIdConfigChange: (c: IDConfig) => void
}

const SYSTEM_FIELDS = [
  { name: 'id', label: 'Record ID' },
  { name: 'created_at', label: 'Created At' },
  { name: 'updated_at', label: 'Updated At' },
  { name: 'created_by', label: 'Created By' },
  { name: 'updated_by', label: 'Updated By' },
]

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

const COL_WIDTHS = { label: 200, type: 120, layer: 90, required: 80, visible: 64, status: 90, actions: 48 }

function TH({ children, width }: { children: ReactNode; width?: number }) {
  return (
    <th style={{
      width,
      padding: '8px 10px',
      textAlign: 'left',
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--fg-tertiary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: '1px solid var(--border-secondary)',
      background: 'var(--bg-secondary)',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  )
}

export function FieldBuilder({ fields, onChange, idConfig, onIdConfigChange }: FieldBuilderProps) {
  const [idConfigOpen, setIdConfigOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [fullEditorIdx, setFullEditorIdx] = useState<number | null>(null)

  const addField = () => {
    const newFields: FieldDef[] = [...fields, {
      name: '',
      label: '',
      type: 'string',
      required: false,
      unique: false,
      indexed: false,
      storageType: 'physical',
    }]
    onChange(newFields)
    setSelectedIdx(newFields.length - 1)
  }

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx))
    if (selectedIdx === idx) setSelectedIdx(null)
    else if (selectedIdx !== null && selectedIdx > idx) setSelectedIdx(selectedIdx - 1)
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

  const selectedField = selectedIdx !== null ? fields[selectedIdx] : null

  const panelOpen = selectedIdx !== null && fullEditorIdx !== selectedIdx

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 400, border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--bg-primary)' }}>
      {/* Left: field table */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: 36, borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)' }} />
                <TH width={COL_WIDTHS.label}>Label / Name</TH>
                <TH width={COL_WIDTHS.type}>Type</TH>
                <TH width={COL_WIDTHS.layer}>Layer</TH>
                <TH width={COL_WIDTHS.required}>Required</TH>
                <TH width={COL_WIDTHS.visible}>Visible</TH>
                <TH width={COL_WIDTHS.actions}>{''}</TH>
              </tr>
            </thead>
            <tbody>
              {/* System fields */}
              {SYSTEM_FIELDS.map(sf => (
                <tr
                  key={sf.name}
                  style={{
                    background: 'var(--surface-system, rgba(0,0,0,0.025))',
                    cursor: sf.name === 'id' ? 'pointer' : 'default',
                  }}
                  onClick={sf.name === 'id' ? () => setIdConfigOpen(true) : undefined}
                >
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                    <Lock size={12} style={{ color: 'var(--fg-disabled)' }} />
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-secondary)' }}>{sf.label}</div>
                    <code style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>{sf.name}</code>
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <Badge variant="gray" dot={false}>{sf.name === 'id' ? 'uuid' : sf.name.endsWith('_at') ? 'datetime' : 'uuid'}</Badge>
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <LayerBadge layer="platform" />
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                    <Lock size={12} style={{ color: 'var(--fg-disabled)' }} />
                  </td>
                  <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                    <Eye size={14} style={{ color: 'var(--fg-disabled)' }} />
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                    {sf.name === 'id' && (
                      <IconButton onClick={() => setIdConfigOpen(true)} title="Configure ID" style={{ width: 26, height: 26 }}>
                        <Settings size={12} />
                      </IconButton>
                    )}
                  </td>
                </tr>
              ))}

              {/* Divider */}
              {fields.length > 0 && (
                <tr>
                  <td colSpan={7} style={{ height: 1, padding: 0, background: 'var(--border-secondary)' }} />
                </tr>
              )}

              {/* User fields */}
              {fields.map((field, idx) => {
                const isSelected = selectedIdx === idx
                const isFullEditor = fullEditorIdx === idx
                return (
                  <>
                    <tr
                      key={`row-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => {
                        setSelectedIdx(isSelected ? null : idx)
                        if (!isSelected) setFullEditorIdx(null)
                      }}
                      style={{
                        background: isSelected ? 'var(--bg-brand-soft)' : 'transparent',
                        opacity: dragIdx === idx ? 0.4 : 1,
                        cursor: 'pointer',
                        transition: 'background 80ms',
                        borderLeft: isSelected ? '3px solid var(--brand-500)' : '3px solid transparent',
                      }}
                    >
                      <td style={{ padding: '7px 4px', textAlign: 'center', cursor: 'grab', color: 'var(--fg-disabled)' }}>
                        <GripVertical size={14} />
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: field.label ? 'var(--fg-primary)' : 'var(--fg-disabled)' }}>
                          {field.label || <em>no label</em>}
                        </div>
                        <code style={{ fontSize: 11, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)' }}>
                          {field.name || <em style={{ fontStyle: 'italic' }}>unnamed</em>}
                        </code>
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        <Badge variant={field.storageType === 'computed' ? 'purple' : 'gray'} dot={false}>{field.type}</Badge>
                      </td>
                      <td style={{ padding: '7px 10px' }}>
                        {field.layer ? <LayerBadge layer={field.layer} /> : <span style={{ color: 'var(--fg-disabled)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <Checkbox
                          checked={field.required}
                          onChange={required => { onChange(updateField(fields, idx, { required })); }}
                          label=""
                        />
                      </td>
                      <td style={{ padding: '7px 10px', textAlign: 'center' }}>
                        <button
                          onClick={e => { e.stopPropagation(); onChange(updateField(fields, idx, { readOnly: !field.readOnly })) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: field.readOnly ? 'var(--fg-disabled)' : 'var(--fg-secondary)', padding: 0 }}
                          title={field.readOnly ? 'Read only' : 'Visible'}
                        >
                          {field.readOnly ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                      <td style={{ padding: '7px 8px', textAlign: 'center' }}>
                        <IconButton
                          onClick={e => { e.stopPropagation(); removeField(idx) }}
                          title="Remove field"
                          style={{ width: 26, height: 26, color: 'var(--error-500)' }}
                        >
                          <Trash2 size={13} />
                        </IconButton>
                      </td>
                    </tr>

                    {/* Full editor inline expansion */}
                    {isSelected && isFullEditor && (
                      <tr key={`editor-${idx}`}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-secondary)', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                              </div>
                            </FieldSection>

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
                                    <Input label="Picklist Key" value={field.picklistKey ?? ''} onChange={e => onChange(updateField(fields, idx, { picklistKey: e.target.value }))} />
                                  )}
                                  {field.lookupType === 'datasource' && (
                                    <Input label="Datasource Key" value={field.datasourceKey ?? ''} onChange={e => onChange(updateField(fields, idx, { datasourceKey: e.target.value }))} />
                                  )}
                                </div>
                              </FieldSection>
                            )}

                            {field.type === 'reference' && (
                              <FieldSection title="Reference">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                  <Input label="Reference Entity" value={field.referenceEntity ?? ''} onChange={e => onChange(updateField(fields, idx, { referenceEntity: e.target.value }))} placeholder="e.g. customer" />
                                  <Input label="Display Field" value={field.displayField ?? 'name'} onChange={e => onChange(updateField(fields, idx, { displayField: e.target.value }))} />
                                  <Input label="Value Field" value={field.valueField ?? 'id'} onChange={e => onChange(updateField(fields, idx, { valueField: e.target.value }))} />
                                </div>
                              </FieldSection>
                            )}

                            <FieldSection title="Compliance & Privacy">
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <Select
                                  label="PII Category"
                                  value={field.piiCategory ?? 'none'}
                                  onChange={e => onChange(updateField(fields, idx, { piiCategory: e.target.value as FieldDef['piiCategory'] }))}
                                  options={PII_OPTIONS}
                                />
                                <Input label="Masking Rule" value={field.maskingRule ?? ''} onChange={e => onChange(updateField(fields, idx, { maskingRule: e.target.value }))} placeholder="e.g. name, email" />
                                <div style={{ gridColumn: '1 / -1' }}>
                                  <MultiSelect
                                    label="Visible Roles"
                                    options={ROLE_OPTIONS}
                                    value={field.visibleRoles ?? []}
                                    onChange={visibleRoles => onChange(updateField(fields, idx, { visibleRoles }))}
                                  />
                                </div>
                                <Input label="Legal Basis" value={field.legalBasis ?? ''} onChange={e => onChange(updateField(fields, idx, { legalBasis: e.target.value }))} placeholder="e.g. GDPR Article 6(1)(b)" />
                              </div>
                            </FieldSection>

                            <FieldSection title="Validation">
                              <FieldValidationEditor
                                type={field.type}
                                value={field.validation ?? {}}
                                onChange={validation => onChange(updateField(fields, idx, { validation }))}
                              />
                            </FieldSection>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border-secondary)' }}>
          <Button
            variant="secondary"
            icon={<Plus size={15} />}
            onClick={addField}
            size="sm"
          >
            Add Field
          </Button>
        </div>
      </div>

      {/* Right: properties panel */}
      {panelOpen && selectedField && selectedIdx !== null && (
        <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--border-secondary)' }}>
          <FieldPropertiesPanel
            field={selectedField}
            onChange={patch => onChange(updateField(fields, selectedIdx, patch))}
            onClose={() => setSelectedIdx(null)}
            onOpenFullEditor={() => setFullEditorIdx(selectedIdx)}
          />
        </div>
      )}

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
