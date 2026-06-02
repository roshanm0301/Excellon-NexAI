/**
 * PermissionEditor — Field-level and role-based permission configuration
 *
 * Configures how a component behaves for different roles:
 * - Visible / Hidden
 * - Editable / Read-only
 * - Required / Optional
 */

import { useState, useCallback } from 'react'
import { Plus, Trash2, Shield } from 'lucide-react'
import { Button } from '../../../design-system'
import { useCanvasStore } from './useCanvasStore'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PermissionRule {
  role: string
  access: 'full' | 'readonly' | 'hidden'
  required?: boolean
}

export interface ComponentPermissions {
  default_access: 'full' | 'readonly' | 'hidden'
  rules: PermissionRule[]
}

const ACCESS_OPTIONS: { value: PermissionRule['access']; label: string }[] = [
  { value: 'full', label: 'Full Access (edit)' },
  { value: 'readonly', label: 'Read Only' },
  { value: 'hidden', label: 'Hidden' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function PermissionEditor() {
  const { selectedKey, getNode, updateNodeProps } = useCanvasStore()
  const node = selectedKey ? getNode(selectedKey) : null

  if (!node) return null

  const permissions: ComponentPermissions = (node.props?.__permissions as ComponentPermissions) ?? {
    default_access: 'full',
    rules: [],
  }

  const handleUpdate = useCallback((updated: ComponentPermissions) => {
    if (!selectedKey) return
    updateNodeProps(selectedKey, { __permissions: updated })
  }, [selectedKey, updateNodeProps])

  const handleAddRule = useCallback(() => {
    handleUpdate({
      ...permissions,
      rules: [...permissions.rules, { role: '', access: 'readonly' }],
    })
  }, [permissions, handleUpdate])

  const handleUpdateRule = useCallback((idx: number, rule: PermissionRule) => {
    const newRules = [...permissions.rules]
    newRules[idx] = rule
    handleUpdate({ ...permissions, rules: newRules })
  }, [permissions, handleUpdate])

  const handleRemoveRule = useCallback((idx: number) => {
    handleUpdate({
      ...permissions,
      rules: permissions.rules.filter((_, i) => i !== idx),
    })
  }, [permissions, handleUpdate])

  return (
    <div className="pp-section">
      <div className="pp-section__title">
        <Shield size={14} style={{ marginRight: 4 }} />
        Permissions
      </div>

      {/* Default access */}
      <div className="pp-field">
        <label className="pp-field__label">Default Access</label>
        <select
          className="pp-field__input"
          value={permissions.default_access}
          onChange={e => handleUpdate({ ...permissions, default_access: e.target.value as PermissionRule['access'] })}
        >
          {ACCESS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="pp-field__hint">Applied when no role-specific rule matches</span>
      </div>

      {/* Role rules */}
      <div className="perm-rules">
        <div className="perm-rules__title">Role Overrides</div>
        {permissions.rules.length === 0 && (
          <p className="pp-empty-msg">No role-specific rules. All users get default access.</p>
        )}
        {permissions.rules.map((rule, idx) => (
          <PermissionRuleRow
            key={idx}
            rule={rule}
            onUpdate={(r) => handleUpdateRule(idx, r)}
            onRemove={() => handleRemoveRule(idx)}
          />
        ))}
        <Button variant="ghost" size="sm" onClick={handleAddRule}>
          <Plus size={12} /> Add Role Rule
        </Button>
      </div>
    </div>
  )
}

// ─── Permission Rule Row ─────────────────────────────────────────────────────

function PermissionRuleRow({
  rule,
  onUpdate,
  onRemove,
}: {
  rule: PermissionRule
  onUpdate: (r: PermissionRule) => void
  onRemove: () => void
}) {
  return (
    <div className="perm-rule">
      <div className="perm-rule__fields">
        <input
          type="text"
          className="pp-field__input"
          value={rule.role}
          onChange={e => onUpdate({ ...rule, role: e.target.value })}
          placeholder="Role name"
          style={{ flex: 2 }}
        />
        <select
          className="pp-field__input"
          value={rule.access}
          onChange={e => onUpdate({ ...rule, access: e.target.value as PermissionRule['access'] })}
          style={{ flex: 2 }}
        >
          {ACCESS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={rule.required ?? false}
            onChange={e => onUpdate({ ...rule, required: e.target.checked })}
          />
          Req
        </label>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 size={10} />
        </Button>
      </div>
    </div>
  )
}

// ─── Standalone hook for runtime permission resolution ───────────────────────

export function resolvePermission(
  permissions: ComponentPermissions | undefined,
  userRole: string,
): { access: 'full' | 'readonly' | 'hidden'; required: boolean } {
  if (!permissions) return { access: 'full', required: false }

  const matchingRule = permissions.rules.find(r => r.role === userRole)
  if (matchingRule) {
    return { access: matchingRule.access, required: matchingRule.required ?? false }
  }

  return { access: permissions.default_access, required: false }
}
