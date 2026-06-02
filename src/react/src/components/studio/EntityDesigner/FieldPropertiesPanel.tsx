import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
import { Badge, Select, LayerBadge, Toggle } from '../../../design-system'
import type { FieldDef } from './FieldBuilder'
import type { Layer } from '../../../design-system'

interface FieldPropertiesPanelProps {
  field: FieldDef
  onChange: (patch: Partial<FieldDef>) => void
  onClose: () => void
  onOpenFullEditor: () => void
}

const PRESENCE_OPTIONS = [
  { value: 'optional', label: 'Optional' },
  { value: 'required', label: 'Required' },
  { value: 'conditional', label: 'Conditional' },
]

const CLASSIFICATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'pii', label: 'PII' },
  { value: 'sensitive', label: 'Sensitive' },
  { value: 'confidential', label: 'Confidential' },
]

function CollapsibleSection({ title, children, defaultOpen = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle, rgba(0,0,0,0.06))' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          color: 'var(--fg-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open && (
        <div style={{ padding: '4px 16px 12px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function VisibilityToggle({ value, onChange }: {
  value: 'all' | 'auth' | 'admin'
  onChange: (v: 'all' | 'auth' | 'admin') => void
}) {
  const opts: Array<{ key: 'all' | 'auth' | 'admin'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'auth', label: 'Auth' },
    { key: 'admin', label: 'Admin' },
  ]
  return (
    <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 2 }}>
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            flex: 1,
            padding: '4px 8px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: value === o.key ? 'var(--bg-primary)' : 'transparent',
            color: value === o.key ? 'var(--fg-primary)' : 'var(--fg-tertiary)',
            fontWeight: value === o.key ? 600 : 400,
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: value === o.key ? 'var(--shadow-xs)' : 'none',
            transition: 'all 100ms',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function EnumValuesEditor({ values, onChange }: {
  values: Array<{ code: string; label: string; sortOrder?: number }>
  onChange: (v: Array<{ code: string; label: string; sortOrder?: number }>) => void
}) {
  const add = () => onChange([...values, { code: '', label: '', sortOrder: values.length }])
  const remove = (i: number) => onChange(values.filter((_, idx) => idx !== i))
  const update = (i: number, patch: { code?: string; label?: string }) =>
    onChange(values.map((v, idx) => idx === i ? { ...v, ...patch } : v))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Enum Values
      </div>
      {values.map((v, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="text"
            value={v.code}
            onChange={e => update(i, { code: e.target.value })}
            placeholder="code"
            style={{ flex: 1, fontSize: 12, padding: '4px 8px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--fg-primary)' }}
          />
          <input
            type="text"
            value={v.label}
            onChange={e => update(i, { label: e.target.value })}
            placeholder="label"
            style={{ flex: 1, fontSize: 12, padding: '4px 8px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)', color: 'var(--fg-primary)' }}
          />
          <button
            onClick={() => remove(i)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', padding: 2, flexShrink: 0 }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        style={{ alignSelf: 'flex-start', fontSize: 11, padding: '3px 10px', border: '1px dashed var(--border-primary)', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--fg-secondary)', cursor: 'pointer' }}
      >
        + Add Value
      </button>
    </div>
  )
}

export function FieldPropertiesPanel({ field, onChange, onClose, onOpenFullEditor }: FieldPropertiesPanelProps) {
  const layer = (field as FieldDef & { layer?: Layer }).layer

  const presence = field.required ? 'required' : 'optional'
  const visibility: 'all' | 'auth' | 'admin' = (field as FieldDef & { visibility?: 'all' | 'auth' | 'admin' }).visibility ?? 'all'
  const classification = (field as FieldDef & { classification?: string }).classification ?? 'none'
  const searchable = (field as FieldDef & { searchable?: boolean }).searchable ?? false

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      borderLeft: '1px solid var(--border-secondary)',
      overflow: 'auto',
    }}>
      {/* Panel Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '14px 16px 10px',
        borderBottom: '1px solid var(--border-secondary)',
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <code style={{
            display: 'block',
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            color: 'var(--fg-primary)',
            marginBottom: 6,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {field.name || 'unnamed'}
          </code>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Badge variant="gray" dot={false}>{field.type}</Badge>
            {layer && <LayerBadge layer={layer} />}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', padding: 4, flexShrink: 0 }}
          aria-label="Close properties panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Quick Settings */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0 }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--fg-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Quick Settings
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Select
            label="Presence"
            value={presence}
            onChange={e => onChange({ required: e.target.value === 'required' })}
            options={PRESENCE_OPTIONS}
          />

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)', marginBottom: 4 }}>Visibility</div>
            <VisibilityToggle
              value={visibility}
              onChange={v => onChange({ visibility: v } as Partial<FieldDef>)}
            />
          </div>

          <Select
            label="Classification"
            value={classification}
            onChange={e => onChange({ classification: e.target.value } as Partial<FieldDef>)}
            options={CLASSIFICATION_OPTIONS}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>Searchable</span>
            <Toggle
              checked={searchable}
              onChange={v => onChange({ searchable: v } as Partial<FieldDef>)}
            />
          </div>
        </div>
      </div>

      {/* Enum values editor */}
      {field.type === 'enum' && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-secondary)', flexShrink: 0 }}>
          <EnumValuesEditor
            values={(field as FieldDef & { enumValues?: Array<{ code: string; label: string; sortOrder?: number }> }).enumValues ?? []}
            onChange={vals => onChange({ enumValues: vals } as Partial<FieldDef>)}
          />
        </div>
      )}

      {/* Collapsible sections */}
      <div style={{ flex: 1 }}>
        <CollapsibleSection title="Validation">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', margin: 0 }}>
            {field.type === 'string' && 'Pattern, min/max length'}
            {field.type === 'number' && 'Min, max, precision'}
            {field.type === 'date' && 'Min date, max date'}
            {!['string', 'number', 'date'].includes(field.type) && 'No constraints for this type'}
            {' — '}
            <button onClick={onOpenFullEditor} style={{ background: 'none', border: 'none', color: 'var(--fg-brand)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
              open full editor
            </button>
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Display">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', margin: 0 }}>
            {field.nullText ? `Null text: "${field.nullText}"` : 'No null text set'}
            {field.displayMask ? `, Mask: ${field.displayMask}` : ''}
            {' — '}
            <button onClick={onOpenFullEditor} style={{ background: 'none', border: 'none', color: 'var(--fg-brand)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}>
              open full editor
            </button>
          </p>
        </CollapsibleSection>

        {field.storageType === 'computed' && (
          <CollapsibleSection title="Computed">
            <code style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)', display: 'block', wordBreak: 'break-all' }}>
              {field.computeExpression || '(no expression)'}
            </code>
          </CollapsibleSection>
        )}

        <CollapsibleSection title="Governance">
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', margin: 0 }}>
            PII: {field.piiCategory ?? 'none'}
            {field.legalBasis ? `, Basis: ${field.legalBasis}` : ''}
          </p>
        </CollapsibleSection>

        <CollapsibleSection title="Compile Readiness">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { label: 'Name set', ok: !!field.name },
              { label: 'Label set', ok: !!field.label },
              { label: 'Type set', ok: !!field.type },
              ...(field.storageType === 'computed' ? [{ label: 'Expression set', ok: !!field.computeExpression }] : []),
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
                <span style={{ color: ok ? 'var(--success-500)' : 'var(--error-500)', fontWeight: 700 }}>{ok ? '✓' : '✗'}</span>
                <span style={{ color: ok ? 'var(--fg-secondary)' : 'var(--fg-primary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-secondary)', flexShrink: 0 }}>
        <button
          onClick={onOpenFullEditor}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            color: 'var(--fg-primary)',
            cursor: 'pointer',
          }}
        >
          Open full editor ↗
        </button>
      </div>
    </div>
  )
}
