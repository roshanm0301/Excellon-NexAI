import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Textarea, Toggle } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface WebhookSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface HeaderEntry {
  id: string
  key: string
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

export function WebhookSettings({ step, onChange }: WebhookSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const headers = (settings.headers as HeaderEntry[] | undefined) ?? []

  const [newKey, setNewKey] = useState('')
  const [newVal, setNewVal] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addHeader() {
    if (!newKey.trim()) return
    update({
      headers: [
        ...headers,
        { id: `h-${Date.now()}`, key: newKey.trim(), value: newVal.trim() },
      ],
    })
    setNewKey('')
    setNewVal('')
  }

  function removeHeader(id: string) {
    update({ headers: headers.filter(h => h.id !== id) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Destination URL</label>
        <Input
          value={String(settings.url ?? '')}
          onChange={e => update({ url: e.target.value })}
          placeholder="https://your-system.com/webhook"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Where to send the webhook POST request.</div>
      </div>

      <div>
        <label style={labelStyle}>HTTP method</label>
        <Select
          value={String(settings.method ?? 'POST')}
          onChange={e => update({ method: e.target.value })}
          options={[
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>Headers</label>
        {headers.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {headers.map(h => (
              <div key={h.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={h.key}
                  onChange={e =>
                    update({
                      headers: headers.map(x =>
                        x.id === h.id ? { ...x, key: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="Header-Name"
                  style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>:</span>
                <Input
                  value={h.value}
                  onChange={e =>
                    update({
                      headers: headers.map(x =>
                        x.id === h.id ? { ...x, value: e.target.value } : x
                      ),
                    })
                  }
                  placeholder="value"
                  style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeHeader(h.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                  }}
                  aria-label="Remove header"
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
            placeholder="Header-Name"
            style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addHeader()}
          />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>:</span>
          <Input
            value={newVal}
            onChange={e => setNewVal(e.target.value)}
            placeholder="value"
            style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addHeader()}
          />
          <button
            onClick={addHeader}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
            }}
            aria-label="Add header"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Payload</label>
        <Textarea
          value={String(settings.payload ?? '')}
          onChange={e => update({ payload: e.target.value })}
          placeholder={'{"event": "created", "data": "{$.step.data}"}'}
          rows={4}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>The JSON body to send.</div>
      </div>

      <div>
        <label style={labelStyle}>Secret (HMAC)</label>
        <Input
          value={String(settings.secret ?? '')}
          onChange={e => update({ secret: e.target.value })}
          placeholder="{$.const.webhookSecret}"
        />
        <div style={helpStyle}>
          Optional. Used to sign the payload so the receiver can verify it&apos;s from you.
        </div>
      </div>

      <div>
        <label style={labelStyle}>Retry on failure</label>
        <Toggle
          checked={Boolean(settings.retryOnFailure ?? false)}
          onChange={checked => update({ retryOnFailure: checked })}
        />
        <div style={helpStyle}>
          When on, automatically retries up to 3 times if the webhook fails.
        </div>
      </div>
    </div>
  )
}
