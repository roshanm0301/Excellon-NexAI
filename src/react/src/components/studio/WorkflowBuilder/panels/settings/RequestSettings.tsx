import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface Extraction {
  id: string
  source: string
  fieldName: string
  variableName: string
  required: boolean
}

interface RequestSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const SOURCES = [
  { value: 'body', label: 'Body' },
  { value: 'query', label: 'Query String' },
  { value: 'path', label: 'Path Param' },
  { value: 'header', label: 'Header' },
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

function makeId() {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function RequestSettings({ step, onChange }: RequestSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const extractions = (settings.extractions as Extraction[] | undefined) ?? []

  const [newSource, setNewSource] = useState('body')
  const [newField, setNewField] = useState('')
  const [newVar, setNewVar] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addExtraction() {
    if (!newField.trim()) return
    const varName = newVar.trim() || newField.trim()
    update({
      extractions: [
        ...extractions,
        {
          id: makeId(),
          source: newSource,
          fieldName: newField.trim(),
          variableName: varName,
          required: newRequired,
        },
      ],
    })
    setNewField('')
    setNewVar('')
    setNewRequired(false)
  }

  function removeExtraction(id: string) {
    update({ extractions: extractions.filter(e => e.id !== id) })
  }

  function updateExtraction(id: string, patch: Partial<Extraction>) {
    update({
      extractions: extractions.map(e => (e.id === id ? { ...e, ...patch } : e)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Request extractions</label>
        <div style={helpStyle}>
          Pull values from the incoming HTTP request into workflow variables. Reference them later
          as {'{$.variableName}'}.
        </div>
      </div>

      {/* Existing extraction rows */}
      {extractions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {extractions.map(ex => (
            <div
              key={ex.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {/* Source + remove button */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...labelStyle, marginBottom: 2 }}>Source</label>
                  <Select
                    value={ex.source}
                    onChange={e => updateExtraction(ex.id, { source: e.target.value })}
                    options={SOURCES}
                  />
                </div>
                <button
                  onClick={() => removeExtraction(ex.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    color: 'var(--error-500)',
                    alignSelf: 'flex-end',
                    marginBottom: 2,
                  }}
                  aria-label="Remove extraction"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Field name */}
              <div>
                <label style={{ ...labelStyle, marginBottom: 2 }}>Field name</label>
                <Input
                  value={ex.fieldName}
                  onChange={e => updateExtraction(ex.id, { fieldName: e.target.value })}
                  placeholder="userId"
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
                <div style={helpStyle}>Name of the field in the request</div>
              </div>

              {/* Variable name */}
              <div>
                <label style={{ ...labelStyle, marginBottom: 2 }}>Variable name</label>
                <Input
                  value={ex.variableName}
                  onChange={e => updateExtraction(ex.id, { variableName: e.target.value })}
                  placeholder="userId"
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
                <div style={helpStyle}>
                  What to call it in this workflow ({'{$.'}
                  {ex.variableName || 'variableName'}
                  {'}'})
                </div>
              </div>

              {/* Required toggle */}
              <Toggle
                checked={ex.required}
                onChange={checked => updateExtraction(ex.id, { required: checked })}
                label="Required"
                size="sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add new extraction row */}
      <div
        style={{
          border: '1px dashed var(--color-border)',
          borderRadius: 6,
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
          New extraction
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, marginBottom: 2 }}>Source</label>
            <Select
              value={newSource}
              onChange={e => setNewSource(e.target.value)}
              options={SOURCES}
            />
          </div>
        </div>

        <div>
          <label style={{ ...labelStyle, marginBottom: 2 }}>Field name</label>
          <Input
            value={newField}
            onChange={e => setNewField(e.target.value)}
            placeholder="userId"
            style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addExtraction()}
          />
        </div>

        <div>
          <label style={{ ...labelStyle, marginBottom: 2 }}>Variable name</label>
          <Input
            value={newVar}
            onChange={e => setNewVar(e.target.value)}
            placeholder="userId"
            style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addExtraction()}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Toggle
            checked={newRequired}
            onChange={setNewRequired}
            label="Required"
            size="sm"
          />
          <button
            onClick={addExtraction}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '4px 10px',
              color: 'var(--brand-600)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={12} />
            Add extraction
          </button>
        </div>
      </div>
    </div>
  )
}
