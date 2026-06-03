import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../design-system'
import type { Condition } from '../../../config/studioApi'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultCondition(): Condition {
  return { type: 'AND', conditions: [] }
}

function defaultFieldCondition(): Condition {
  return { type: 'FIELD', field: '', operator: 'eq', value: '' }
}

const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'in', label: 'in (comma-separated)' },
  { value: 'notIn', label: 'not in (comma-separated)' },
  { value: 'isNull', label: 'is null' },
  { value: 'isNotNull', label: 'is not null' },
  { value: 'regex', label: 'matches regex' },
  { value: 'between', label: 'between' },
]

const COMBINATOR_OPTIONS = [
  { value: 'AND', label: 'AND — all conditions must match' },
  { value: 'OR', label: 'OR — any condition must match' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConditionTreeBuilderProps {
  condition: Condition
  onChange: (c: Condition) => void
}

export function ConditionTreeBuilder({ condition, onChange }: ConditionTreeBuilderProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <ConditionNode
        condition={condition}
        onChange={onChange}
        onDelete={() => onChange(defaultCondition())}
        depth={0}
      />
    </div>
  )
}

// ─── ConditionNode (recursive) ────────────────────────────────────────────────

interface ConditionNodeProps {
  condition: Condition
  onChange: (c: Condition) => void
  onDelete: () => void
  depth: number
}

function ConditionNode({ condition, onChange, onDelete, depth }: ConditionNodeProps) {
  const indentColor = ['var(--brand-200)', 'var(--success-200)', 'var(--warning-200)', 'var(--neutral-200)'][depth % 4]

  const addChild = (type: 'FIELD' | 'AND' | 'OR' | 'NOT') => {
    const children = condition.conditions ?? []
    const newChild: Condition = type === 'FIELD'
      ? defaultFieldCondition()
      : { type, conditions: type === 'NOT' ? [defaultFieldCondition()] : [] }
    onChange({ ...condition, conditions: [...children, newChild] })
  }

  const updateChild = (index: number, child: Condition) => {
    const children = [...(condition.conditions ?? [])]
    children[index] = child
    onChange({ ...condition, conditions: children })
  }

  const deleteChild = (index: number) => {
    const children = [...(condition.conditions ?? [])]
    children.splice(index, 1)
    onChange({ ...condition, conditions: children })
  }

  // FIELD leaf node
  if (condition.type === 'FIELD') {
    const noValue = condition.operator === 'isNull' || condition.operator === 'isNotNull'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 140px', minWidth: 120 }}>
          <input
            style={{
              width: '100%', height: 34, padding: '0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
            }}
            placeholder="field.name"
            value={condition.field ?? ''}
            onChange={(e) => onChange({ ...condition, field: e.target.value })}
          />
        </div>
        <div style={{ flex: '0 0 190px' }}>
          <select
            style={{
              width: '100%', height: 34, padding: '0 28px 0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)', appearance: 'none', boxSizing: 'border-box',
            }}
            value={condition.operator ?? 'eq'}
            onChange={(e) => onChange({ ...condition, operator: e.target.value as Condition['operator'], value: '' })}
          >
            {OPERATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {!noValue && (
          <div style={{ flex: '1 1 120px', minWidth: 100 }}>
            <input
              style={{
                width: '100%', height: 34, padding: '0 10px',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
                color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
              }}
              placeholder={condition.operator === 'in' || condition.operator === 'notIn' ? 'a, b, c' : 'value'}
              value={Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value ?? '')}
              onChange={(e) => {
                const raw = e.target.value
                const val = (condition.operator === 'in' || condition.operator === 'notIn')
                  ? raw.split(',').map(s => s.trim())
                  : raw
                onChange({ ...condition, value: val })
              }}
            />
          </div>
        )}
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, display: 'flex', alignItems: 'center' }}
          title="Delete condition"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  // NOT node (single child)
  if (condition.type === 'NOT') {
    const child = condition.conditions?.[0]
    return (
      <div style={{
        borderLeft: `3px solid var(--error-300)`,
        paddingLeft: 12, marginLeft: depth > 0 ? 12 : 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontWeight: 700, color: 'var(--error-600)', fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>NOT</span>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 2 }}>
            <Trash2 size={12} />
          </button>
        </div>
        {child && (
          <ConditionNode
            condition={child}
            onChange={(c) => onChange({ ...condition, conditions: [c] })}
            onDelete={() => onChange({ ...condition, conditions: [defaultFieldCondition()] })}
            depth={depth + 1}
          />
        )}
      </div>
    )
  }

  // AND / OR group
  return (
    <div style={{
      borderLeft: `3px solid ${indentColor}`,
      paddingLeft: 16, marginLeft: depth > 0 ? 12 : 0,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Group header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select
          style={{
            height: 30, padding: '0 24px 0 8px',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-xs)',
            fontWeight: 700, appearance: 'none',
          }}
          value={condition.type}
          onChange={(e) => onChange({ ...condition, type: e.target.value as 'AND' | 'OR' })}
        >
          {COMBINATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('FIELD')}>Field</Button>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('AND')}>Group</Button>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('NOT')}>NOT</Button>
        {depth > 0 && (
          <button onClick={onDelete} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4 }}>
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Children */}
      {(condition.conditions ?? []).map((child, i) => (
        <ConditionNode
          key={i}
          condition={child}
          onChange={(c) => updateChild(i, c)}
          onDelete={() => deleteChild(i)}
          depth={depth + 1}
        />
      ))}

      {/* Empty state */}
      {(!condition.conditions || condition.conditions.length === 0) && (
        <div style={{
          padding: '16px', textAlign: 'center', color: 'var(--fg-tertiary)',
          fontSize: 'var(--text-sm)', border: '1px dashed var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
        }}>
          No conditions yet. Click "+ Field" to add one.
        </div>
      )}
    </div>
  )
}

export function createBlankConditionTree(): Condition {
  return defaultCondition()
}
