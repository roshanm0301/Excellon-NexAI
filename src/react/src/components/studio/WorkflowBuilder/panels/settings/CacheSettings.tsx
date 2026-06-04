import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface CacheSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const OPERATIONS = [
  { value: 'Get', label: 'Get' },
  { value: 'Set', label: 'Set' },
  { value: 'Delete', label: 'Delete' },
  { value: 'Check if exists', label: 'Check if exists' },
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

export function CacheSettings({ step, onChange }: CacheSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const operation = String(settings.operation ?? 'Get')

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
      <div>
        <label style={labelStyle}>Operation</label>
        <Select
          value={operation}
          onChange={e => update({ operation: e.target.value })}
          options={OPERATIONS}
        />
      </div>

      <div>
        <label style={labelStyle}>Cache key</label>
        <Input
          value={String(settings.cacheKey ?? '')}
          onChange={e => update({ cacheKey: e.target.value })}
          placeholder="provider:{$.body.id}"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>
          Unique key for this cached value. Use expressions for dynamic keys.
        </div>
      </div>

      {operation === 'Set' && (
        <div>
          <label style={labelStyle}>TTL (seconds)</label>
          <Input
            type="number"
            value={String(settings.ttl ?? '')}
            onChange={e =>
              update({ ttl: e.target.value === '' ? undefined : Number(e.target.value) })
            }
            placeholder="3600"
          />
          <div style={helpStyle}>How long to keep this value. 3600 = 1 hour.</div>
        </div>
      )}

      {operation === 'Get' && (
        <div>
          <label style={labelStyle}>Default value</label>
          <Textarea
            value={String(settings.defaultValue ?? '')}
            onChange={e => update({ defaultValue: e.target.value })}
            placeholder="null"
            rows={2}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>Returned when the key doesn&apos;t exist in cache.</div>
        </div>
      )}

      {operation === 'Set' && (
        <div>
          <label style={labelStyle}>Value to cache</label>
          <Textarea
            value={String(settings.valueToCache ?? '')}
            onChange={e => update({ valueToCache: e.target.value })}
            placeholder="{$.queryResult.data}"
            rows={3}
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>
            The value to store. Usually a step output expression.
          </div>
        </div>
      )}
    </div>
  )
}
