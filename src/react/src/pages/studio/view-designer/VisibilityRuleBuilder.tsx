/**
 * VisibilityRuleBuilder — Interactive condition builder for component visibility
 *
 * Supports 4 condition types:
 * - always: component is always visible
 * - field_equals: visible when entity field equals a value
 * - expression: visible when JSONata expression evaluates truthy
 * - role_in: visible for specified user roles
 */

import { useCallback } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'
import type { VisibilityRule } from '../../../types/viewStudio'

// ─── Constants ───────────────────────────────────────────────────────────────

type ConditionType = VisibilityRule['condition']

const CONDITION_OPTIONS: { value: ConditionType; label: string; description: string }[] = [
  { value: 'always', label: 'Always Visible', description: 'No conditions applied' },
  { value: 'field_equals', label: 'Field Equals', description: 'Show when a field matches a value' },
  { value: 'expression', label: 'Expression', description: 'Show when expression is truthy' },
  { value: 'role_in', label: 'Role-Based', description: 'Show only for specific roles' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function VisibilityRuleBuilder() {
  const { selectedKey, getNode } = useCanvasStore()
  const updateNodeVisibility = useCanvasStore(s => s.updateNodeVisibility)
  const node = selectedKey ? getNode(selectedKey) : null

  if (!node) return null

  const visibility = node.visibility

  const handleSetCondition = useCallback((condition: ConditionType) => {
    if (!selectedKey) return
    if (condition === 'always') {
      updateNodeVisibility(selectedKey, undefined)
    } else {
      const base: VisibilityRule = { condition, remove_from_dom: false }
      if (condition === 'field_equals') {
        base.field_key = ''
        base.value = ''
      } else if (condition === 'expression') {
        base.expression = ''
      } else if (condition === 'role_in') {
        base.roles = []
      }
      updateNodeVisibility(selectedKey, base)
    }
  }, [selectedKey, updateNodeVisibility])

  const handleUpdate = useCallback((partial: Partial<VisibilityRule>) => {
    if (!selectedKey || !visibility) return
    updateNodeVisibility(selectedKey, { ...visibility, ...partial })
  }, [selectedKey, visibility, updateNodeVisibility])

  const handleRemove = useCallback(() => {
    if (!selectedKey) return
    updateNodeVisibility(selectedKey, undefined)
  }, [selectedKey, updateNodeVisibility])

  const currentCondition: ConditionType = visibility?.condition ?? 'always'

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        {visibility ? <EyeOff size={14} style={{ marginRight: 4 }} /> : <Eye size={14} style={{ marginRight: 4 }} />}
        Visibility Rules
      </div>

      {/* Condition Type Selector */}
      <div className="pp-field">
        <label className="pp-field__label">Condition</label>
        <select
          className="pp-field__input"
          value={currentCondition}
          onChange={e => handleSetCondition(e.target.value as ConditionType)}
        >
          {CONDITION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="pp-field__hint">
          {CONDITION_OPTIONS.find(o => o.value === currentCondition)?.description}
        </span>
      </div>

      {/* Condition-specific fields */}
      {visibility?.condition === 'field_equals' && (
        <FieldEqualsInputs visibility={visibility} onUpdate={handleUpdate} />
      )}
      {visibility?.condition === 'expression' && (
        <ExpressionInputs visibility={visibility} onUpdate={handleUpdate} />
      )}
      {visibility?.condition === 'role_in' && (
        <RoleInputs visibility={visibility} onUpdate={handleUpdate} />
      )}

      {/* Remove from DOM toggle */}
      {visibility && visibility.condition !== 'always' && (
        <div className="pp-field" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
          <input
            type="checkbox"
            id="vr-remove-dom"
            checked={visibility.remove_from_dom ?? false}
            onChange={e => handleUpdate({ remove_from_dom: e.target.checked })}
          />
          <label htmlFor="vr-remove-dom" className="pp-field__label" style={{ marginBottom: 0 }}>
            Remove from DOM when hidden
          </label>
        </div>
      )}

      {/* Clear button */}
      {visibility && (
        <div style={{ marginTop: '0.75rem' }}>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            Clear Rule (Always Visible)
          </Button>
        </div>
      )}
    </div>
  )
}

// ─── Condition Inputs ────────────────────────────────────────────────────────

function FieldEqualsInputs({
  visibility,
  onUpdate,
}: {
  visibility: VisibilityRule
  onUpdate: (partial: Partial<VisibilityRule>) => void
}) {
  return (
    <>
      <div className="pp-field">
        <label className="pp-field__label">Field Key</label>
        <input
          type="text"
          className="pp-field__input"
          value={visibility.field_key ?? ''}
          onChange={e => onUpdate({ field_key: e.target.value })}
          placeholder="e.g., status"
        />
      </div>
      <div className="pp-field">
        <label className="pp-field__label">Equals Value</label>
        <input
          type="text"
          className="pp-field__input"
          value={visibility.value !== undefined ? String(visibility.value) : ''}
          onChange={e => {
            const raw = e.target.value
            let parsed: unknown = raw
            if (raw === 'true') parsed = true
            else if (raw === 'false') parsed = false
            else if (raw !== '' && !isNaN(Number(raw))) parsed = Number(raw)
            onUpdate({ value: parsed })
          }}
          placeholder="e.g., active"
        />
      </div>
    </>
  )
}

function ExpressionInputs({
  visibility,
  onUpdate,
}: {
  visibility: VisibilityRule
  onUpdate: (partial: Partial<VisibilityRule>) => void
}) {
  return (
    <div className="pp-field">
      <label className="pp-field__label">JSONata Expression</label>
      <textarea
        className="pp-field__input pp-field__textarea"
        rows={3}
        value={visibility.expression ?? ''}
        onChange={e => onUpdate({ expression: e.target.value })}
        placeholder="$count(items) > 0"
      />
      <span className="pp-field__hint">Expression must evaluate to a truthy value for component to be visible</span>
    </div>
  )
}

function RoleInputs({
  visibility,
  onUpdate,
}: {
  visibility: VisibilityRule
  onUpdate: (partial: Partial<VisibilityRule>) => void
}) {
  const roles = visibility.roles ?? []

  const handleRolesChange = (value: string) => {
    const parsed = value.split(',').map(r => r.trim()).filter(Boolean)
    onUpdate({ roles: parsed })
  }

  return (
    <div className="pp-field">
      <label className="pp-field__label">Allowed Roles</label>
      <input
        type="text"
        className="pp-field__input"
        value={roles.join(', ')}
        onChange={e => handleRolesChange(e.target.value)}
        placeholder="admin, manager, supervisor"
      />
      <span className="pp-field__hint">Comma-separated list of role names</span>
    </div>
  )
}
