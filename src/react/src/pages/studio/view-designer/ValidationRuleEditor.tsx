/**
 * ValidationRuleEditor — Per-component validation rule configuration
 *
 * Allows users to add validation rules to input components:
 * - required, min_length, max_length, pattern, min, max, email, url, custom expression
 *
 * At runtime, these rules are evaluated before form submission.
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, ShieldCheck, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ComponentValidationRule {
  rule_type: ValidationRuleType
  message: string
  params?: Record<string, unknown>
  is_active?: boolean
}

export type ValidationRuleType =
  | 'required'
  | 'min_length'
  | 'max_length'
  | 'min_value'
  | 'max_value'
  | 'pattern'
  | 'email'
  | 'url'
  | 'numeric'
  | 'alpha'
  | 'alphanumeric'
  | 'date_range'
  | 'file_size'
  | 'file_type'
  | 'custom_expression'

const RULE_TYPES: { value: ValidationRuleType; label: string; hasParams: boolean }[] = [
  { value: 'required', label: 'Required', hasParams: false },
  { value: 'min_length', label: 'Min Length', hasParams: true },
  { value: 'max_length', label: 'Max Length', hasParams: true },
  { value: 'min_value', label: 'Min Value', hasParams: true },
  { value: 'max_value', label: 'Max Value', hasParams: true },
  { value: 'pattern', label: 'Regex Pattern', hasParams: true },
  { value: 'email', label: 'Email Format', hasParams: false },
  { value: 'url', label: 'URL Format', hasParams: false },
  { value: 'numeric', label: 'Numeric Only', hasParams: false },
  { value: 'alpha', label: 'Alpha Only', hasParams: false },
  { value: 'alphanumeric', label: 'Alphanumeric Only', hasParams: false },
  { value: 'date_range', label: 'Date Range', hasParams: true },
  { value: 'file_size', label: 'Max File Size', hasParams: true },
  { value: 'file_type', label: 'Allowed File Types', hasParams: true },
  { value: 'custom_expression', label: 'Custom Expression', hasParams: true },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function ValidationRuleEditor() {
  const { selectedKey, getNode, updateNodeProps } = useCanvasStore()
  const node = selectedKey ? getNode(selectedKey) : null

  if (!node) return null

  const rules: ComponentValidationRule[] = (node.props?.__validation_rules as ComponentValidationRule[]) ?? []

  const handleUpdate = useCallback((newRules: ComponentValidationRule[]) => {
    if (!selectedKey) return
    updateNodeProps(selectedKey, { __validation_rules: newRules })
  }, [selectedKey, updateNodeProps])

  const handleAdd = useCallback(() => {
    handleUpdate([...rules, {
      rule_type: 'required',
      message: 'This field is required',
      is_active: true,
    }])
  }, [rules, handleUpdate])

  const handleUpdateRule = useCallback((idx: number, updated: ComponentValidationRule) => {
    const newRules = [...rules]
    newRules[idx] = updated
    handleUpdate(newRules)
  }, [rules, handleUpdate])

  const handleRemoveRule = useCallback((idx: number) => {
    handleUpdate(rules.filter((_, i) => i !== idx))
  }, [rules, handleUpdate])

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        <ShieldCheck size={14} style={{ marginRight: 4 }} />
        Validation Rules
      </div>

      {rules.length === 0 && (
        <p className="pp-empty-msg">No validation rules. Input will accept any value.</p>
      )}

      {rules.map((rule, idx) => (
        <ValidationRuleRow
          key={idx}
          rule={rule}
          onUpdate={(r) => handleUpdateRule(idx, r)}
          onRemove={() => handleRemoveRule(idx)}
        />
      ))}

      <Button variant="ghost" size="sm" onClick={handleAdd} style={{ marginTop: '0.5rem' }}>
        <Plus size={12} /> Add Validation Rule
      </Button>
    </div>
  )
}

// ─── Rule Row ────────────────────────────────────────────────────────────────

function ValidationRuleRow({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: ComponentValidationRule
  onUpdate: (r: ComponentValidationRule) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const ruleInfo = RULE_TYPES.find(r => r.value === rule.rule_type)

  return (
    <div className="vr-rule">
      <div className="vr-rule__header">
        <button className="vr-rule__toggle" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>
        <select
          className="pp-field__input"
          value={rule.rule_type}
          onChange={e => onUpdate({ ...rule, rule_type: e.target.value as ValidationRuleType })}
          style={{ flex: 1 }}
        >
          {RULE_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem' }}>
          <input
            type="checkbox"
            checked={rule.is_active !== false}
            onChange={e => onUpdate({ ...rule, is_active: e.target.checked })}
          />
          On
        </label>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 size={10} />
        </Button>
      </div>

      {expanded && (
        <div className="vr-rule__body">
          {/* Error message */}
          <div className="pp-field">
            <label className="pp-field__label">Error Message</label>
            <input
              type="text"
              className="pp-field__input"
              value={rule.message}
              onChange={e => onUpdate({ ...rule, message: e.target.value })}
              placeholder="Validation error message"
            />
          </div>

          {/* Rule-specific params */}
          {ruleInfo?.hasParams && (
            <RuleParams rule={rule} onUpdate={onUpdate} />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Rule Parameters ─────────────────────────────────────────────────────────

function RuleParams({
  rule,
  onUpdate,
}: {
  rule: ComponentValidationRule
  onUpdate: (r: ComponentValidationRule) => void
}) {
  const params = rule.params ?? {}
  const setParam = (key: string, value: unknown) => {
    onUpdate({ ...rule, params: { ...params, [key]: value } })
  }

  switch (rule.rule_type) {
    case 'min_length':
    case 'max_length':
      return (
        <div className="pp-field">
          <label className="pp-field__label">Length</label>
          <input
            type="number"
            className="pp-field__input"
            value={(params.length as number) ?? ''}
            min={0}
            onChange={e => setParam('length', Number(e.target.value))}
          />
        </div>
      )

    case 'min_value':
    case 'max_value':
      return (
        <div className="pp-field">
          <label className="pp-field__label">Value</label>
          <input
            type="number"
            className="pp-field__input"
            value={(params.value as number) ?? ''}
            onChange={e => setParam('value', Number(e.target.value))}
          />
        </div>
      )

    case 'pattern':
      return (
        <div className="pp-field">
          <label className="pp-field__label">Regex Pattern</label>
          <input
            type="text"
            className="pp-field__input"
            value={(params.pattern as string) ?? ''}
            onChange={e => setParam('pattern', e.target.value)}
            placeholder="^[A-Z]{2,}$"
            style={{ fontFamily: 'monospace' }}
          />
        </div>
      )

    case 'date_range':
      return (
        <>
          <div className="pp-field">
            <label className="pp-field__label">Min Date</label>
            <input
              type="date"
              className="pp-field__input"
              value={(params.min_date as string) ?? ''}
              onChange={e => setParam('min_date', e.target.value)}
            />
          </div>
          <div className="pp-field">
            <label className="pp-field__label">Max Date</label>
            <input
              type="date"
              className="pp-field__input"
              value={(params.max_date as string) ?? ''}
              onChange={e => setParam('max_date', e.target.value)}
            />
          </div>
        </>
      )

    case 'file_size':
      return (
        <div className="pp-field">
          <label className="pp-field__label">Max Size (MB)</label>
          <input
            type="number"
            className="pp-field__input"
            value={(params.max_mb as number) ?? ''}
            min={0}
            onChange={e => setParam('max_mb', Number(e.target.value))}
          />
        </div>
      )

    case 'file_type':
      return (
        <div className="pp-field">
          <label className="pp-field__label">Allowed Types</label>
          <input
            type="text"
            className="pp-field__input"
            value={(params.types as string) ?? ''}
            onChange={e => setParam('types', e.target.value)}
            placeholder=".pdf,.docx,.xlsx"
          />
          <span className="pp-field__hint">Comma-separated extensions</span>
        </div>
      )

    case 'custom_expression':
      return (
        <div className="pp-field">
          <label className="pp-field__label">Expression</label>
          <textarea
            className="pp-field__input pp-field__textarea"
            rows={3}
            value={(params.expression as string) ?? ''}
            onChange={e => setParam('expression', e.target.value)}
            placeholder="$length(value) > 0 and $contains(value, '@')"
          />
          <span className="pp-field__hint">JSONata expression. Must evaluate to truthy for valid input.</span>
        </div>
      )

    default:
      return null
  }
}

// ─── Runtime Validation Executor ─────────────────────────────────────────────

export function validateField(
  value: unknown,
  rules: ComponentValidationRule[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const rule of rules) {
    if (rule.is_active === false) continue

    const str = value !== undefined && value !== null ? String(value) : ''
    const params = rule.params ?? {}

    switch (rule.rule_type) {
      case 'required':
        if (value === undefined || value === null || str.trim() === '') {
          errors.push(rule.message)
        }
        break
      case 'min_length':
        if (str.length < ((params.length as number) ?? 0)) {
          errors.push(rule.message)
        }
        break
      case 'max_length':
        if (str.length > ((params.length as number) ?? Infinity)) {
          errors.push(rule.message)
        }
        break
      case 'min_value':
        if (Number(value) < ((params.value as number) ?? -Infinity)) {
          errors.push(rule.message)
        }
        break
      case 'max_value':
        if (Number(value) > ((params.value as number) ?? Infinity)) {
          errors.push(rule.message)
        }
        break
      case 'pattern':
        if (params.pattern && !new RegExp(params.pattern as string).test(str)) {
          errors.push(rule.message)
        }
        break
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
          errors.push(rule.message)
        }
        break
      case 'url':
        try { new URL(str) } catch { errors.push(rule.message) }
        break
      case 'numeric':
        if (str && isNaN(Number(str))) errors.push(rule.message)
        break
      case 'alpha':
        if (str && !/^[a-zA-Z]+$/.test(str)) errors.push(rule.message)
        break
      case 'alphanumeric':
        if (str && !/^[a-zA-Z0-9]+$/.test(str)) errors.push(rule.message)
        break
    }
  }

  return { valid: errors.length === 0, errors }
}
