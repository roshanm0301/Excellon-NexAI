import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface TemplateSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface VariableMapping {
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

export function TemplateSettings({ step, onChange }: TemplateSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const variables = (settings.variables as VariableMapping[] | undefined) ?? []

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

  function addVariable() {
    if (!newField.trim()) return
    update({
      variables: [
        ...variables,
        { id: `v-${Date.now()}`, field: newField.trim(), value: newValue.trim() },
      ],
    })
    setNewField('')
    setNewValue('')
  }

  function removeVariable(id: string) {
    update({ variables: variables.filter(v => v.id !== id) })
  }

  const templateSource = String(settings.templateSource ?? 'Inline template')
  const isInline = templateSource === 'Inline template'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Template source</label>
        <Select
          value={templateSource}
          onChange={e => update({ templateSource: e.target.value })}
          options={[
            { value: 'Inline template', label: 'Inline template' },
            { value: 'Template file reference', label: 'Template file reference' },
          ]}
        />
      </div>

      {isInline && (
        <div>
          <label style={labelStyle}>Template content</label>
          <Textarea
            value={String(settings.templateContent ?? '')}
            onChange={e => update({ templateContent: e.target.value })}
            placeholder={'Hello {{name}},\n\nYour request has been received.'}
            rows={8}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            Handlebars/Mustache template. Use {'{{variableName}}'} for substitutions.
          </div>
        </div>
      )}

      {!isInline && (
        <div>
          <label style={labelStyle}>Template file</label>
          <Input
            value={String(settings.templateFile ?? '')}
            onChange={e => update({ templateFile: e.target.value })}
            placeholder="emails/welcome.hbs"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
        </div>
      )}

      <div>
        <label style={labelStyle}>Variables</label>
        <div style={helpStyle}>Map template variables to workflow data.</div>

        {variables.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {variables.map(v => (
              <div key={v.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={v.field}
                  onChange={e =>
                    update({
                      variables: variables.map(x =>
                        x.id === v.id ? { ...x, field: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="variableName"
                  style={{ flex: 1, fontSize: '0.75rem' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>→</span>
                <Input
                  value={v.value}
                  onChange={e =>
                    update({
                      variables: variables.map(x =>
                        x.id === v.id ? { ...x, value: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="{$.body.value}"
                  style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeVariable(v.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                  }}
                  aria-label="Remove variable"
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
            placeholder="variableName"
            style={{ flex: 1, fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addVariable()}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>→</span>
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="{$.body.value}"
            style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addVariable()}
          />
          <button
            onClick={addVariable}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
            }}
            aria-label="Add variable"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Output variable</label>
        <Input
          value={String(settings.outputVar ?? '')}
          onChange={e => update({ outputVar: e.target.value })}
          placeholder="renderedHtml"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
      </div>
    </div>
  )
}
