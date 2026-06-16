import { Toggle } from '../../../design-system'

export interface CapabilityFlags {
  dbStoreType?: 'master' | 'transaction' | 'log'
  softDelete?: boolean
  auditTrail?: boolean
  expressions?: boolean
  nodeScoping?: boolean
  pii?: boolean
}

interface CapabilityFlagsPanelProps {
  value: CapabilityFlags
  onChange: (v: CapabilityFlags) => void
}

const STORE_TYPES: { value: 'master' | 'transaction' | 'log'; label: string; description: string }[] = [
  { value: 'master', label: 'Master', description: 'Reference data (customers, products)' },
  { value: 'transaction', label: 'Transaction', description: 'Business events (orders, invoices)' },
  { value: 'log', label: 'Log', description: 'Append-only event records' },
]

const TOGGLE_FLAGS: { key: keyof Omit<CapabilityFlags, 'dbStoreType'>; label: string; description: string }[] = [
  { key: 'softDelete', label: 'Soft Delete', description: 'Records move to recycle bin instead of hard delete' },
  { key: 'auditTrail', label: 'Full Audit Trail', description: 'Record every change with actor and timestamp' },
  { key: 'expressions', label: 'Computed Fields (Expressions)', description: 'Allow JSONata expressions on fields' },
  { key: 'nodeScoping', label: 'Node / Branch Scoping', description: 'Scope records to org hierarchy nodes' },
  { key: 'pii', label: 'Contains PII Fields', description: 'Enable PII masking, encryption, and GDPR controls' },
]

export function CapabilityFlagsPanel({ value, onChange }: CapabilityFlagsPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Store type */}
      <fieldset style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
        <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Store Type
        </legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {STORE_TYPES.map(({ value: v, label, description }) => (
            <label key={v} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
              <input
                type="radio"
                name="store-type"
                value={v}
                checked={(value.dbStoreType ?? 'master') === v}
                onChange={() => onChange({ ...value, dbStoreType: v })}
                style={{ marginTop: 3 }}
              />
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{description}</div>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Feature toggles */}
      <fieldset style={{ border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
        <legend style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-tertiary)', padding: '0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Capabilities
        </legend>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {TOGGLE_FLAGS.map(({ key, label, description }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>{label}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>{description}</div>
              </div>
              <Toggle
                checked={!!(value[key])}
                onChange={checked => onChange({ ...value, [key]: checked })}
              />
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  )
}
