import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'

interface ValidationRule {
  id: string
  field: string
  rule: string
  value: string
  message: string
}

interface ValidatorSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

const RULE_OPTIONS = [
  { value: 'required', label: 'required' },
  { value: 'email', label: 'email' },
  { value: 'min_length', label: 'min length' },
  { value: 'max_length', label: 'max length' },
  { value: 'regex', label: 'regex' },
  { value: 'number', label: 'number' },
  { value: 'positive_number', label: 'positive number' },
]

const ON_FAIL_OPTIONS = [
  { value: 'stop', label: 'Stop workflow with 400 error' },
  { value: 'continue', label: 'Continue with warnings' },
  { value: 'error_var', label: 'Set error variable' },
]

/** Rules that accept a value parameter */
const VALUE_RULES = new Set(['min_length', 'max_length', 'regex'])

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

const monoStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
}

export function ValidatorSettings({ step, onChange }: ValidatorSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const rules = (settings.rules as ValidationRule[] | undefined) ?? []
  const onFail = String(settings.onFail ?? 'stop')

  const [newField, setNewField] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addRule() {
    if (!newField.trim()) return
    update({
      rules: [
        ...rules,
        {
          id: `vr-${Date.now()}`,
          field: newField.trim(),
          rule: 'required',
          value: '',
          message: '',
        },
      ],
    })
    setNewField('')
  }

  function removeRule(id: string) {
    update({ rules: rules.filter(r => r.id !== id) })
  }

  function updateRule(id: string, patch: Partial<ValidationRule>) {
    update({
      rules: rules.map(r => (r.id === id ? { ...r, ...patch } : r)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* What to validate */}
      <div>
        <label style={labelStyle}>What to validate</label>
        <Input
          value={String(settings.input ?? '')}
          onChange={e => update({ input: e.target.value })}
          placeholder="{$.body}"
          style={monoStyle}
        />
        <div style={helpStyle}>The data to validate. Usually the request body.</div>
      </div>

      {/* Validation rules list */}
      <div>
        <label style={labelStyle}>Validation rules</label>

        {rules.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
            {rules.map(r => (
              <div
                key={r.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  background: 'var(--bg-subtle, var(--neutral-50))',
                }}
              >
                {/* Row 1: field + rule + value */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input
                    value={r.field}
                    onChange={e => updateRule(r.id, { field: e.target.value })}
                    placeholder="email"
                    style={{ flex: '1 1 0', fontSize: '0.75rem', fontFamily: 'monospace' }}
                  />
                  <Select
                    value={r.rule}
                    onChange={e => updateRule(r.id, { rule: e.target.value, value: '' })}
                    options={RULE_OPTIONS}
                    style={{ flex: '1 1 0', fontSize: '0.75rem' } as React.CSSProperties}
                  />
                  {VALUE_RULES.has(r.rule) && (
                    <Input
                      value={r.value}
                      onChange={e => updateRule(r.id, { value: e.target.value })}
                      placeholder="5"
                      style={{ width: 60, fontSize: '0.75rem' }}
                    />
                  )}
                </div>

                {/* Row 2: error message + remove */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Input
                    value={r.message}
                    onChange={e => updateRule(r.id, { message: e.target.value })}
                    placeholder="Email is required"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                  />
                  <button
                    onClick={() => removeRule(r.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      color: 'var(--error-500)',
                      flexShrink: 0,
                    }}
                    aria-label="Remove rule"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new rule row */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Input
            value={newField}
            onChange={e => setNewField(e.target.value)}
            placeholder="field name"
            style={{ flex: 1, fontSize: '0.75rem', fontFamily: 'monospace' }}
            onKeyDown={e => e.key === 'Enter' && addRule()}
          />
          <button
            onClick={addRule}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              borderRadius: 5,
              cursor: 'pointer',
              padding: '3px 6px',
              color: 'var(--brand-600)',
              flexShrink: 0,
            }}
            aria-label="Add rule"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>

      {/* On validation failure */}
      <div>
        <label style={labelStyle}>On validation failure</label>
        <Select
          value={onFail}
          onChange={e => update({ onFail: e.target.value })}
          options={ON_FAIL_OPTIONS}
        />
      </div>

      {/* Error variable name — shown only when onFail === 'error_var' */}
      {onFail === 'error_var' && (
        <div>
          <label style={labelStyle}>Error variable name</label>
          <Input
            value={String(settings.errorVar ?? '')}
            onChange={e => update({ errorVar: e.target.value })}
            placeholder="validationErrors"
            style={monoStyle}
          />
          <div style={helpStyle}>
            The filtered validation errors will be stored in this variable for use in later steps.
          </div>
        </div>
      )}

    </div>
  )
}
