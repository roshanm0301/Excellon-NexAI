import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select, Textarea } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface OrmSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

interface ParamBinding {
  id: string
  expression: string
}

const OPERATION_TYPES = [
  { value: 'SELECT', label: 'SELECT' },
  { value: 'INSERT', label: 'INSERT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'EXECUTE', label: 'EXECUTE (raw SQL)' },
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

const mono: React.CSSProperties = { fontFamily: 'monospace', fontSize: '0.8125rem' }

const SQL_PLACEHOLDER = "SELECT * FROM entity_record WHERE payload->>'status' = $1"

export function OrmSettings({ step, onChange }: OrmSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const bindings = (settings.paramBindings as ParamBinding[] | undefined) ?? []

  const [newExpr, setNewExpr] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addBinding() {
    if (!newExpr.trim()) return
    update({
      paramBindings: [
        ...bindings,
        { id: `pb-${Date.now()}`, expression: newExpr.trim() },
      ],
    })
    setNewExpr('')
  }

  function removeBinding(id: string) {
    update({ paramBindings: bindings.filter(b => b.id !== id) })
  }

  function updateBindingExpr(id: string, expression: string) {
    update({
      paramBindings: bindings.map(b => b.id === id ? { ...b, expression } : b),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={labelStyle}>Operation type</label>
        <Select
          value={String(settings.operationType ?? 'SELECT')}
          onChange={e => update({ operationType: e.target.value })}
          options={OPERATION_TYPES}
        />
      </div>

      <div>
        <label style={labelStyle}>SQL query</label>
        <Textarea
          value={String(settings.sqlQuery ?? '')}
          onChange={e => update({ sqlQuery: e.target.value })}
          rows={6}
          placeholder={SQL_PLACEHOLDER}
        />
        <div style={helpStyle}>SQL query. Use $1, $2, ... for parameter bindings (prevents SQL injection).</div>
      </div>

      <div>
        <label style={labelStyle}>Parameter bindings</label>
        <div style={helpStyle}>Map each $N placeholder to an expression from workflow state.</div>

        {bindings.length > 0 && (
          <div style={{ marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {bindings.map((b, idx) => (
              <div key={b.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{
                  minWidth: 28,
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: 'var(--color-text-muted)',
                  flexShrink: 0,
                }}>
                  ${idx + 1}
                </span>
                <Input
                  value={b.expression}
                  onChange={e => updateBindingExpr(b.id, e.target.value)}
                  placeholder="{$.body.value}"
                  style={{ flex: 1, ...mono }}
                />
                <button
                  onClick={() => removeBinding(b.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                    flexShrink: 0,
                  }}
                  aria-label={`Remove $${idx + 1} binding`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            minWidth: 28,
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}>
            ${bindings.length + 1}
          </span>
          <Input
            value={newExpr}
            onChange={e => setNewExpr(e.target.value)}
            placeholder="{$.body.value}"
            style={{ flex: 1, ...mono }}
            onKeyDown={e => e.key === 'Enter' && addBinding()}
          />
          <button
            onClick={addBinding}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
              flexShrink: 0,
            }}
            aria-label="Add parameter binding"
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
          placeholder="rows"
          style={mono}
        />
      </div>
    </div>
  )
}
