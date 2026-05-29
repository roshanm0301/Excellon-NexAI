import { Trash2, Plus } from 'lucide-react'
import { AccordionRow, Button, IconButton, Input, MultiSelect, Badge } from '../../../design-system'

export interface EntityAction {
  id: string
  label: string
  icon?: string
  commandKey: string
  visibleRoles: string[]
}

interface EntityActionsPanelProps {
  actions: EntityAction[]
  onChange: (actions: EntityAction[]) => void
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'VIEWER', label: 'Viewer' },
]

export function EntityActionsPanel({ actions, onChange }: EntityActionsPanelProps) {
  const add = () => {
    onChange([...actions, {
      id: crypto.randomUUID(),
      label: '',
      commandKey: '',
      visibleRoles: [],
    }])
  }

  const remove = (idx: number) => {
    onChange(actions.filter((_, i) => i !== idx))
  }

  const update = (idx: number, patch: Partial<EntityAction>) => {
    onChange(actions.map((a, i) => i === idx ? { ...a, ...patch } : a))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {actions.map((action, idx) => (
        <AccordionRow
          key={action.id}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--fg-primary)' }}>
                {action.label || <em style={{ color: 'var(--fg-tertiary)' }}>unnamed action</em>}
              </span>
              {action.commandKey && (
                <Badge variant="gray" dot={false}>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{action.commandKey}</code>
                </Badge>
              )}
            </div>
          }
          right={
            <IconButton
              onClick={e => { e.stopPropagation(); remove(idx) }}
              title="Remove action"
              style={{ width: 28, height: 28, color: 'var(--error-500)' }}
            >
              <Trash2 size={14} />
            </IconButton>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Label"
              value={action.label}
              onChange={e => update(idx, { label: e.target.value })}
              placeholder="e.g. Approve"
            />
            <Input
              label="Icon (Lucide name)"
              value={action.icon ?? ''}
              onChange={e => update(idx, { icon: e.target.value })}
              placeholder="e.g. CheckCircle"
            />
            <Input
              label="Command Key"
              value={action.commandKey}
              onChange={e => update(idx, { commandKey: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
              placeholder="e.g. approve"
            />
            <MultiSelect
              label="Visible Roles"
              options={ROLE_OPTIONS}
              value={action.visibleRoles}
              onChange={visibleRoles => update(idx, { visibleRoles })}
            />
          </div>
        </AccordionRow>
      ))}

      <Button
        variant="secondary"
        icon={<Plus size={16} />}
        onClick={add}
        style={{ alignSelf: 'flex-start', marginTop: 4 }}
      >
        Add Action
      </Button>
    </div>
  )
}
