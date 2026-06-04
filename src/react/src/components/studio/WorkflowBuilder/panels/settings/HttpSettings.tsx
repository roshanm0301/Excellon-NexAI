import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface HeaderRow {
  id: string
  key: string
  value: string
}

interface HttpSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].map(m => ({ value: m, label: m }))

const AUTH_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'apikey', label: 'API Key Header' },
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

function authLabel(authType: string): string {
  if (authType === 'bearer') return 'Bearer token value'
  if (authType === 'basic') return 'Base64-encoded credentials (user:pass)'
  if (authType === 'apikey') return 'API key value'
  return 'Auth value'
}

function authHelp(authType: string): string {
  if (authType === 'bearer') return 'Sent as Authorization: Bearer <value>.'
  if (authType === 'basic') return 'Sent as Authorization: Basic <value>. Encode user:pass in Base64 first.'
  if (authType === 'apikey') return 'Sent as X-API-Key: <value>.'
  return ''
}

export function HttpSettings({ step, onChange }: HttpSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const headers = (settings.headers as HeaderRow[] | undefined) ?? []
  const authType = String(settings.authType ?? 'none')

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

  function addHeader() {
    if (!newKey.trim()) return
    update({
      headers: [
        ...headers,
        { id: `h-${Date.now()}`, key: newKey.trim(), value: newValue.trim() },
      ],
    })
    setNewKey('')
    setNewValue('')
  }

  function removeHeader(id: string) {
    update({ headers: headers.filter(h => h.id !== id) })
  }

  function updateHeader(id: string, field: 'key' | 'value', val: string) {
    update({ headers: headers.map(h => h.id === id ? { ...h, [field]: val } : h) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>HTTP method</label>
        <Select
          value={String(settings.method ?? 'GET')}
          onChange={e => update({ method: e.target.value })}
          options={HTTP_METHODS}
        />
        <div style={helpStyle}>The HTTP verb to use for this request.</div>
      </div>

      <div>
        <label style={labelStyle}>URL</label>
        <Input
          value={String(settings.url ?? '')}
          onChange={e => update({ url: e.target.value })}
          placeholder="https://api.example.com/resource"
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>Use {'{$.stepId.data}'} for dynamic values from previous steps.</div>
      </div>

      <div>
        <label style={labelStyle}>Request body</label>
        <Textarea
          value={String(settings.body ?? '')}
          onChange={e => update({ body: e.target.value })}
          rows={4}
          placeholder={'{\n  "key": "{$.body.value}"\n}'}
          style={{ fontFamily: 'monospace', fontSize: '0.8125rem', width: '100%', boxSizing: 'border-box' }}
        />
        <div style={helpStyle}>JSON or expression. Leave empty for GET requests.</div>
      </div>

      <div>
        <label style={labelStyle}>Headers</label>
        <div style={helpStyle}>Custom request headers as key/value pairs.</div>

        {headers.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {headers.map(h => (
              <div key={h.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Input
                  value={h.key}
                  onChange={e => updateHeader(h.id, 'key', e.target.value)}
                  placeholder="Header-Name"
                  style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>:</span>
                <Input
                  value={h.value}
                  onChange={e => updateHeader(h.id, 'value', e.target.value)}
                  placeholder="value"
                  style={{ flex: 2, fontSize: '0.75rem', fontFamily: 'monospace' }}
                />
                <button
                  onClick={() => removeHeader(h.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--error-500)' }}
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
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
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
        <label style={labelStyle}>Auth type</label>
        <Select
          value={authType}
          onChange={e => update({ authType: e.target.value })}
          options={AUTH_TYPES}
        />
        <div style={helpStyle}>How to authenticate this HTTP request.</div>
      </div>

      {authType !== 'none' && (
        <div>
          <label style={labelStyle}>{authLabel(authType)}</label>
          <Input
            value={String(settings.authValue ?? '')}
            onChange={e => update({ authValue: e.target.value })}
            placeholder={
              authType === 'bearer' ? 'eyJhbGci...' :
              authType === 'basic' ? 'dXNlcjpwYXNz' :
              'api-key-value'
            }
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={helpStyle}>{authHelp(authType)}</div>
        </div>
      )}

      <div>
        <label style={labelStyle}>Timeout (seconds)</label>
        <Input
          type="number"
          value={String(settings.timeout ?? 30)}
          onChange={e => update({ timeout: e.target.value === '' ? 30 : Number(e.target.value) })}
          placeholder="30"
          min="1"
          style={{ fontSize: '0.8125rem' }}
        />
        <div style={helpStyle}>How long to wait before aborting the request. Default is 30 seconds.</div>
      </div>
    </div>
  )
}
