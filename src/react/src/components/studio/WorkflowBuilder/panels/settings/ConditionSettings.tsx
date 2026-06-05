import { useState } from 'react'
import { Plus, Trash2, GitBranch } from 'lucide-react'
import { Input, Select } from '../../../../../design-system'
import type { WorkflowStep } from '../../../../../types/workflowBuilder'
import { DataPathPicker } from '../../utils/DataPathPicker'

interface Condition {
  id: string
  left: string
  operator: string
  right: string
}

interface ConditionSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
  upstreamSteps?: WorkflowStep[]
}

const MODE_OPTIONS = [
  { value: 'AND', label: 'All conditions must pass (AND)' },
  { value: 'OR', label: 'Any condition can pass (OR)' },
]

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'equals' },
  { value: 'not equals', label: 'not equals' },
  { value: 'greater than', label: 'greater than' },
  { value: 'less than', label: 'less than' },
  { value: 'contains', label: 'contains' },
  { value: 'starts with', label: 'starts with' },
  { value: 'ends with', label: 'ends with' },
  { value: 'is empty', label: 'is empty' },
  { value: 'is not empty', label: 'is not empty' },
]

/** Operators that don't require a right-hand value */
const UNARY_OPERATORS = new Set(['is empty', 'is not empty'])

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
  return `cond-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

export function ConditionSettings({ step, onChange, upstreamSteps = [] }: ConditionSettingsProps) {
  const settings = (step.properties.taskSettings ?? {}) as Record<string, unknown>
  const conditions = (settings.conditions as Condition[] | undefined) ?? []
  const mode = String(settings.mode ?? 'AND')

  const [newLeft, setNewLeft] = useState('')
  const [newOperator, setNewOperator] = useState('equals')
  const [newRight, setNewRight] = useState('')

  function update(patch: Record<string, unknown>) {
    onChange({
      properties: {
        ...step.properties,
        taskSettings: { ...settings, ...patch },
      },
    })
  }

  function addCondition() {
    if (!newLeft.trim()) return
    update({
      conditions: [
        ...conditions,
        {
          id: makeId(),
          left: newLeft.trim(),
          operator: newOperator,
          right: UNARY_OPERATORS.has(newOperator) ? '' : newRight.trim(),
        },
      ],
    })
    setNewLeft('')
    setNewOperator('equals')
    setNewRight('')
  }

  function removeCondition(id: string) {
    update({ conditions: conditions.filter(c => c.id !== id) })
  }

  function updateCondition(id: string, patch: Partial<Condition>) {
    update({
      conditions: conditions.map(c => (c.id === id ? { ...c, ...patch } : c)),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Info banner */}
      <div
        style={{
          background: 'var(--brand-50, #eff6ff)',
          border: '1px solid var(--brand-200, #bfdbfe)',
          borderRadius: 6,
          padding: '8px 10px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}
      >
        <GitBranch size={14} style={{ color: 'var(--brand-600)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: '0.6875rem', color: 'var(--brand-700, #1d4ed8)', lineHeight: 1.5 }}>
          If this condition passes, the <strong>YES branch</strong> runs. Otherwise the{' '}
          <strong>NO branch</strong> runs.
        </div>
      </div>

      {/* Condition mode */}
      <div>
        <label style={labelStyle}>Condition mode</label>
        <Select
          value={mode}
          onChange={e => update({ mode: e.target.value })}
          options={MODE_OPTIONS}
        />
        <div style={helpStyle}>
          AND = every row must be true · OR = at least one row must be true
        </div>
      </div>

      {/* Existing condition rows */}
      {conditions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {conditions.map((cond, idx) => (
            <div
              key={cond.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '6px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Condition {idx + 1}</span>
                <button
                  onClick={() => removeCondition(cond.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 2,
                    color: 'var(--error-500)',
                  }}
                  aria-label="Remove condition"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {/* Left value */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Input
                  value={cond.left}
                  onChange={e => updateCondition(cond.id, { left: e.target.value })}
                  placeholder="{$.step.data.status}"
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem', flex: 1 }}
                />
                <DataPathPicker
                  upstreamSteps={upstreamSteps}
                  onSelect={path => updateCondition(cond.id, { left: cond.left + path })}
                />
              </div>

              {/* Operator */}
              <Select
                value={cond.operator}
                onChange={e => {
                  const op = e.target.value
                  updateCondition(
                    cond.id,
                    UNARY_OPERATORS.has(op) ? { operator: op, right: '' } : { operator: op }
                  )
                }}
                options={OPERATOR_OPTIONS}
              />

              {/* Right value — hidden for unary operators */}
              {!UNARY_OPERATORS.has(cond.operator) && (
                <Input
                  value={cond.right}
                  onChange={e => updateCondition(cond.id, { right: e.target.value })}
                  placeholder="ACTIVE"
                  style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new condition row */}
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
          New condition
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Input
            value={newLeft}
            onChange={e => setNewLeft(e.target.value)}
            placeholder="{$.step.data.status}"
            style={{ fontFamily: 'monospace', fontSize: '0.75rem', flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && addCondition()}
          />
          <DataPathPicker
            upstreamSteps={upstreamSteps}
            onSelect={path => setNewLeft(v => v + path)}
          />
        </div>

        <Select
          value={newOperator}
          onChange={e => {
            setNewOperator(e.target.value)
            if (UNARY_OPERATORS.has(e.target.value)) setNewRight('')
          }}
          options={OPERATOR_OPTIONS}
        />

        {!UNARY_OPERATORS.has(newOperator) && (
          <Input
            value={newRight}
            onChange={e => setNewRight(e.target.value)}
            placeholder="ACTIVE"
            style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
            onKeyDown={e => e.key === 'Enter' && addCondition()}
          />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={addCondition}
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
            Add condition
          </button>
        </div>
      </div>

      {/* Branch legend */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div
          style={{
            flex: 1,
            background: 'var(--success-50, #f0fdf4)',
            border: '1px solid var(--success-200, #bbf7d0)',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: '0.6875rem',
            color: 'var(--success-700, #15803d)',
            textAlign: 'center',
          }}
        >
          YES path
        </div>
        <div
          style={{
            flex: 1,
            background: 'var(--error-50, #fef2f2)',
            border: '1px solid var(--error-200, #fecaca)',
            borderRadius: 6,
            padding: '6px 8px',
            fontSize: '0.6875rem',
            color: 'var(--error-700, #b91c1c)',
            textAlign: 'center',
          }}
        >
          NO path
        </div>
      </div>
    </div>
  )
}
