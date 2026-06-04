import { Input, Textarea, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ResponseSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
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

export function ResponseSettings({ step, onChange }: ResponseSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status code */}
      <div>
        <label style={labelStyle}>Status code</label>
        <Input
          type="number"
          value={String(settings.statusCode ?? 200)}
          onChange={e =>
            update({ statusCode: e.target.value === '' ? 200 : Number(e.target.value) })
          }
          placeholder="200"
          min="100"
          max="599"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          200 = success · 400 = bad request · 404 = not found · 500 = error
        </div>
      </div>

      {/* Response message */}
      <div>
        <label style={labelStyle}>Response message</label>
        <Input
          value={String(settings.message ?? '')}
          onChange={e => update({ message: e.target.value })}
          placeholder="Success"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Short description of what happened, included in the response body.</div>
      </div>

      {/* Response data */}
      <div>
        <label style={labelStyle}>Response data</label>
        <Textarea
          value={String(settings.data ?? '')}
          onChange={e => update({ data: e.target.value })}
          rows={4}
          placeholder="{$.previousStep.data}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem', width: '100%', boxSizing: 'border-box' }}
        />
        <div style={helpStyle}>
          JSONata expression for the response payload. Usually the output of the last step.
        </div>
      </div>

      {/* Include step output */}
      <div>
        <Toggle
          checked={Boolean(settings.includeEnvelope ?? false)}
          onChange={checked => update({ includeEnvelope: checked })}
          label="Include full step output"
          size="sm"
        />
        <div style={{ ...helpStyle, marginTop: 6 }}>
          When on, wraps the response in a standard{' '}
          <code style={{ fontFamily: 'monospace', fontSize: '0.6875rem' }}>
            {'{ success, data, message }'}
          </code>{' '}
          envelope.
        </div>
      </div>
    </div>
  )
}
