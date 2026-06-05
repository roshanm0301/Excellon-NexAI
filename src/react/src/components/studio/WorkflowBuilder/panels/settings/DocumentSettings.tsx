import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Select, Input } from '../../../../../design-system'
import { listArtifacts } from '../../../../../config/studioApi'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface FieldMapping {
  id: string
  field: string
  value: string
}

interface DocumentSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = ['FindOne', 'FindMany', 'FindPaging', 'Create', 'Update', 'Delete', 'Count']

export function DocumentSettings({ step, onChange }: DocumentSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const mappings = (settings.fieldMappings as FieldMapping[] | undefined) ?? []

  const { data } = useQuery({
    queryKey: ['artifacts', 'entity_schema', 'active'],
    queryFn: () => listArtifacts({ entity_type: 'entity_schema', status: 'active' }),
  })
  const entities = (data?.items ?? []).map(a => ({ value: a.artifact_name, label: a.artifact_name }))

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  const [newField, setNewField] = useState('')
  const [newValue, setNewValue] = useState('')

  function addMapping() {
    if (!newField.trim()) return
    update({
      fieldMappings: [
        ...mappings,
        { id: `m-${Date.now()}`, field: newField.trim(), value: newValue.trim() },
      ],
    })
    setNewField('')
    setNewValue('')
  }

  function removeMapping(id: string) {
    update({ fieldMappings: mappings.filter(m => m.id !== id) })
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>What entity?</label>
        <Select
          value={String(settings.entityType ?? '')}
          onChange={e => update({ entityType: e.target.value })}
          options={[{ value: '', label: 'Select entity…' }, ...entities]}
        />
        <div style={helpStyle}>Choose the data entity you want to work with.</div>
      </div>

      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={String(settings.operation ?? 'FindOne')}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS.map(o => ({ value: o, label: o }))}
        />
        <div style={helpStyle}>
          FindOne = get a single record · Create = add a new record · Update = change a record · Delete = remove a record
        </div>
      </div>

      {/* Field mappings */}
      <div>
        <label style={labelStyle}>Field mappings</label>
        <div style={helpStyle}>Map entity fields to values or expressions from previous steps.</div>

        {mappings.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mappings.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={m.field}
                  onChange={e => update({
                    fieldMappings: mappings.map(x => x.id === m.id ? { ...x, field: e.target.value } : x)
                  })}
                  placeholder="field"
                  style={{ flex: 1, fontSize: '0.75rem' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>→</span>
                <Input
                  value={m.value}
                  onChange={e => update({
                    fieldMappings: mappings.map(x => x.id === m.id ? { ...x, value: e.target.value } : x)
                  })}
                  placeholder="{$.body.value}"
                  style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeMapping(m.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--error-500)' }}
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
    </div>
  )
}
