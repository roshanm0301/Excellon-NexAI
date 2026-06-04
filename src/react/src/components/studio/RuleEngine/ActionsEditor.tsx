import { Plus, Trash2 } from 'lucide-react'
import { Button } from '../../../design-system'
import type { ActionV2, ActionTypeV2, FieldBehaviorType } from '../../../config/studioApi'

const ACTION_TYPE_OPTIONS: { value: ActionTypeV2; label: string }[] = [
  { value: 'BLOCK', label: 'BLOCK — reject the operation' },
  { value: 'WARN', label: 'WARN — show a warning' },
  { value: 'SET_FIELD', label: 'SET_FIELD — set a field value' },
  { value: 'REQUIRE_APPROVAL', label: 'REQUIRE_APPROVAL — route to approver' },
  { value: 'FIELD_BEHAVIOR', label: 'FIELD_BEHAVIOR — control field visibility' },
  { value: 'INVOKE_SERVICE', label: 'INVOKE_SERVICE — call external service' },
  { value: 'REQUIRE_FIELD', label: 'REQUIRE_FIELD — make a field required' },
  { value: 'NOTIFY', label: 'NOTIFY — send a notification' },
  { value: 'ESCALATE', label: 'ESCALATE — escalate to a role' },
]

const BEHAVIOR_OPTIONS: { value: FieldBehaviorType; label: string }[] = [
  { value: 'hidden', label: 'Hidden' },
  { value: 'readonly', label: 'Read Only' },
  { value: 'mandatory', label: 'Required' },
  { value: 'editable', label: 'Editable' },
]

interface ActionsEditorProps {
  actions: ActionV2[]
  onChange: (actions: ActionV2[]) => void
}

export function ActionsEditor({ actions, onChange }: ActionsEditorProps) {
  const addAction = () => {
    onChange([...actions, { type: 'BLOCK', message: '' }])
  }

  const updateAction = (index: number, updates: Partial<ActionV2>) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], ...updates }
    onChange(updated)
  }

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {actions.map((action, i) => (
        <ActionRow key={i} action={action} onChange={(a) => updateAction(i, a)} onDelete={() => removeAction(i)} />
      ))}

      {actions.length === 0 && (
        <div style={{
          padding: 20, textAlign: 'center', color: 'var(--fg-tertiary)',
          fontSize: 'var(--text-sm)', border: '1px dashed var(--border-secondary)',
          borderRadius: 'var(--radius-lg)',
        }}>
          No actions defined. Add one below.
        </div>
      )}

      <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addAction}>
        Add Action
      </Button>
    </div>
  )
}

// ─── Single Action Row ────────────────────────────────────────────────────────

function ActionRow({ action, onChange, onDelete }: { action: ActionV2; onChange: (a: Partial<ActionV2>) => void; onDelete: () => void }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '10px 12px', borderRadius: 'var(--radius-lg)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select
          style={{
            height: 34, padding: '0 28px 0 10px',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)', appearance: 'none',
          }}
          value={action.type}
          onChange={(e) => onChange({ type: e.target.value as ActionTypeV2 })}
        >
          {ACTION_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={onDelete}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4 }}
          title="Remove action"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Type-specific fields */}
      {(action.type === 'BLOCK' || action.type === 'WARN' || action.type === 'NOTIFY') && (
        <input
          style={inputStyle}
          placeholder="Message to display"
          value={action.message ?? ''}
          onChange={(e) => onChange({ message: e.target.value })}
        />
      )}

      {action.type === 'SET_FIELD' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: '1 1 40%' }}
            placeholder="field.path"
            value={action.field ?? ''}
            onChange={(e) => onChange({ field: e.target.value })}
          />
          <input
            style={{ ...inputStyle, flex: '1 1 60%', fontFamily: 'var(--font-mono)' }}
            placeholder="JSONata expression or literal value"
            value={typeof action.value === 'string' ? action.value : JSON.stringify(action.value ?? '')}
            onChange={(e) => onChange({ value: e.target.value })}
          />
        </div>
      )}

      {action.type === 'REQUIRE_APPROVAL' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Category (e.g. high_value)"
            value={action.category ?? ''}
            onChange={(e) => onChange({ category: e.target.value })}
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Approver role"
            value={action.approver_role ?? ''}
            onChange={(e) => onChange({ approver_role: e.target.value })}
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Reason message"
            value={action.message ?? ''}
            onChange={(e) => onChange({ message: e.target.value })}
          />
        </div>
      )}

      {action.type === 'FIELD_BEHAVIOR' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="field.path"
            value={action.field ?? ''}
            onChange={(e) => onChange({ field: e.target.value })}
          />
          <select
            style={{
              height: 34, padding: '0 28px 0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              appearance: 'none',
            }}
            value={action.behavior ?? 'hidden'}
            onChange={(e) => onChange({ behavior: e.target.value as FieldBehaviorType })}
          >
            {BEHAVIOR_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {action.type === 'INVOKE_SERVICE' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Service key"
            value={action.service_key ?? ''}
            onChange={(e) => onChange({ service_key: e.target.value })}
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Method name"
            value={action.method ?? action.service_method ?? ''}
            onChange={(e) => onChange({ method: e.target.value, service_method: e.target.value })}
          />
        </div>
      )}

      {action.type === 'REQUIRE_FIELD' && (
        <input
          style={inputStyle}
          placeholder="field.path to mark required"
          value={action.field ?? ''}
          onChange={(e) => onChange({ field: e.target.value })}
        />
      )}

      {action.type === 'ESCALATE' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Escalation role"
            value={action.approver_role ?? ''}
            onChange={(e) => onChange({ approver_role: e.target.value })}
          />
          <input
            style={{ ...inputStyle, flex: 1 }}
            placeholder="Reason message"
            value={action.message ?? ''}
            onChange={(e) => onChange({ message: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 34, padding: '0 10px',
  border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
  color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
  boxSizing: 'border-box',
}
