import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Textarea, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ActionSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface InputMapping {
  id: string
  field: string
  value: string
}

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

export function ActionSettings({ step, onChange }: ActionSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const mappings = (settings.inputMappings as InputMapping[] | undefined) ?? []

  const [newField, setNewField] = useState('')
  const [newValue, setNewValue] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addMapping() {
    if (!newField.trim()) return
    update({
      inputMappings: [
        ...mappings,
        { id: `m-${Date.now()}`, field: newField.trim(), value: newValue.trim() },
      ],
    })
    setNewField('')
    setNewValue('')
  }

  function removeMapping(id: string) {
    update({ inputMappings: mappings.filter(m => m.id !== id) })
  }

  const onError = String(settings.onError ?? 'Stop workflow')
  const showFallback = onError === 'Use fallback value'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Action name</label>
        <Input
          value={String(settings.actionName ?? '')}
          onChange={e => update({ actionName: e.target.value })}
          placeholder="GetProviderById"
        />
        <div style={helpStyle}>The system name of the action to call.</div>
      </div>

      <div>
        <label style={labelStyle}>Input mappings</label>
        <div style={helpStyle}>Map input fields to values or expressions from previous steps.</div>

        {mappings.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mappings.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={m.field}
                  onChange={e =>
                    update({
                      inputMappings: mappings.map(x =>
                        x.id === m.id ? { ...x, field: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="field"
                  style={{ flex: 1, fontSize: '0.75rem' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>→</span>
                <Input
                  value={m.value}
                  onChange={e =>
                    update({
                      inputMappings: mappings.map(x =>
                        x.id === m.id ? { ...x, value: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="{$.body.value}"
                  style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeMapping(m.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                  }}
                  aria-label="Remove mapping"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Input
            value={newField}
            onChange={e => setNewField(e.target.value)}
            placeholder="field name"
            style={{ flex: 1, fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addMapping()}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>→</span>
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="{$.body.value}"
            style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addMapping()}
          />
          <button
            onClick={addMapping}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
            }}
            aria-label="Add mapping"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Wait for result</label>
        <Toggle
          checked={Boolean(settings.waitForResult ?? true)}
          onChange={checked => update({ waitForResult: checked })}
        />
        <div style={helpStyle}>
          When on, this step waits for the action to complete before continuing.
        </div>
      </div>

      <div>
        <label style={labelStyle}>On error</label>
        <Select
          value={onError}
          onChange={e => update({ onError: e.target.value })}
          options={[
            { value: 'Stop workflow', label: 'Stop workflow' },
            { value: 'Continue with null result', label: 'Continue with null result' },
            { value: 'Use fallback value', label: 'Use fallback value' },
          ]}
        />
      </div>

      {showFallback && (
        <div>
          <label style={labelStyle}>Fallback value</label>
          <Textarea
            value={String(settings.fallbackValue ?? '')}
            onChange={e => update({ fallbackValue: e.target.value })}
            placeholder="null"
            rows={2}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
        </div>
      )}
    </div>
  )
}
