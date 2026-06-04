import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface WorkflowSettingsProps {
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

export function WorkflowSettings({ step, onChange }: WorkflowSettingsProps) {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Workflow name</label>
        <Input
          value={String(settings.workflowName ?? '')}
          onChange={e => update({ workflowName: e.target.value })}
          placeholder="ProviderOnboardingWorkflow"
        />
        <div style={helpStyle}>The system name of the workflow to trigger.</div>
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
        <label style={labelStyle}>Execution mode</label>
        <Select
          value={String(settings.executionMode ?? 'Call and wait (synchronous)')}
          onChange={e => update({ executionMode: e.target.value })}
          options={[
            { value: 'Call and wait (synchronous)', label: 'Call and wait (synchronous)' },
            { value: 'Fire and forget (async)', label: 'Fire and forget (async)' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>On error</label>
        <Select
          value={String(settings.onError ?? 'Stop workflow')}
          onChange={e => update({ onError: e.target.value })}
          options={[
            { value: 'Stop workflow', label: 'Stop workflow' },
            { value: 'Continue', label: 'Continue' },
          ]}
        />
      </div>
    </div>
  )
}
