import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ObjectSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface KeyValueRow {
  id: string
  key: string
  value: string
}

const OPERATIONS = [
  { value: 'build', label: 'Build object' },
  { value: 'merge', label: 'Merge objects' },
  { value: 'pick', label: 'Pick fields' },
  { value: 'omit', label: 'Omit fields' },
  { value: 'flatten', label: 'Flatten nested' },
]

const CONFLICT_STRATEGIES = [
  { value: 'keepOriginal', label: 'Keep original' },
  { value: 'useNew', label: 'Use new value' },
]

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: 4,
}

const helpStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  color: 'var(--color-text-muted)',
  marginTop: 2,
  marginBottom: 10,
}

export function ObjectSettings({ step, onChange }: ObjectSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'build')
  const rows = (settings.buildRows as KeyValueRow[] | undefined) ?? []

  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addRow() {
    if (!newKey.trim()) return
    update({
      buildRows: [
        ...rows,
        { id: `r-${Date.now()}`, key: newKey.trim(), value: newValue.trim() },
      ],
    })
    setNewKey('')
    setNewValue('')
  }

  function removeRow(id: string) {
    update({ buildRows: rows.filter(r => r.id !== id) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      {operation !== 'build' && (
        <div>
          <label style={labelStyle}>Source</label>
          <Input
            value={String(settings.source ?? '')}
            onChange={e => update({ source: e.target.value })}
            placeholder="{$.step.data}"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>The object to start with.</div>
        </div>
      )}

      {operation === 'build' && (
        <div>
          <label style={labelStyle}>Fields</label>
          <div style={helpStyle}>Define the key-value pairs for the new object.</div>

          {rows.length > 0 && (
            <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {rows.map(r => (
                <div key={r.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input
                    value={r.key}
                    onChange={e =>
                      update({
                        buildRows: rows.map(x =>
                          x.id === r.id ? { ...x, key: e.target.value } : x
                        ),
                      })
                    }
                    placeholder="key"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>:</span>
                  <Input
                    value={r.value}
                    onChange={e =>
                      update({
                        buildRows: rows.map(x =>
                          x.id === r.id ? { ...x, value: e.target.value } : x
                        ),
                      })
                    }
                    placeholder="{$.body.value}"
                    style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={() => removeRow(r.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'var(--error-500)',
                    }}
                    aria-label="Remove field"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Input
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder="key"
              style={{ flex: 1, fontSize: '0.75rem' }}
              onKeyDown={e => e.key === 'Enter' && addRow()}
            />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>:</span>
            <Input
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="{$.body.value}"
              style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
              onKeyDown={e => e.key === 'Enter' && addRow()}
            />
            <button
              onClick={addRow}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 5,
                cursor: 'pointer',
                padding: '3px 6px',
                color: 'var(--brand-600)',
              }}
              aria-label="Add field"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
      )}

      {operation === 'merge' && (
        <>
          <div>
            <label style={labelStyle}>Second object</label>
            <Input
              value={String(settings.secondObject ?? '')}
              onChange={e => update({ secondObject: e.target.value })}
              placeholder="{$.otherStep.data}"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Conflict strategy</label>
            <Select
              value={String(settings.conflictStrategy ?? 'keepOriginal')}
              onChange={e => update({ conflictStrategy: e.target.value })}
              options={CONFLICT_STRATEGIES}
            />
          </div>
        </>
      )}

      {operation === 'pick' && (
        <div>
          <label style={labelStyle}>Fields to keep</label>
          <Textarea
            value={String(settings.pickFields ?? '')}
            onChange={e => update({ pickFields: e.target.value })}
            placeholder="id, name, status"
            rows={3}
          />
          <div style={helpStyle}>One per line or comma-separated.</div>
        </div>
      )}

      {operation === 'omit' && (
        <div>
          <label style={labelStyle}>Fields to remove</label>
          <Textarea
            value={String(settings.omitFields ?? '')}
            onChange={e => update({ omitFields: e.target.value })}
            placeholder="password, __v"
            rows={3}
          />
        </div>
      )}

      {operation === 'flatten' && (
        <div>
          <label style={labelStyle}>Depth</label>
          <Input
            type="number"
            value={String(settings.flattenDepth ?? '')}
            onChange={e =>
              update({ flattenDepth: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="1"
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="result"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
