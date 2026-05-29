import { Trash2, Plus } from 'lucide-react'
import { Button, IconButton, Input, Select, Toggle } from '../../../design-system'

export interface StatusDef {
  key: string
  label: string
  initial: boolean
  terminal: boolean
}

export interface Transition {
  from: string
  to: string
  command: string
}

interface StatusFlowEditorProps {
  statuses: StatusDef[]
  transitions: Transition[]
  onStatusesChange: (s: StatusDef[]) => void
  onTransitionsChange: (t: Transition[]) => void
}

export function StatusFlowEditor({
  statuses,
  transitions,
  onStatusesChange,
  onTransitionsChange,
}: StatusFlowEditorProps) {
  const addStatus = () => {
    onStatusesChange([...statuses, { key: '', label: '', initial: false, terminal: false }])
  }

  const removeStatus = (idx: number) => {
    onStatusesChange(statuses.filter((_, i) => i !== idx))
  }

  const updateStatus = (idx: number, patch: Partial<StatusDef>) => {
    onStatusesChange(statuses.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  const addTransition = () => {
    onTransitionsChange([...transitions, { from: '', to: '', command: '' }])
  }

  const removeTransition = (idx: number) => {
    onTransitionsChange(transitions.filter((_, i) => i !== idx))
  }

  const updateTransition = (idx: number, patch: Partial<Transition>) => {
    onTransitionsChange(transitions.map((t, i) => i === idx ? { ...t, ...patch } : t))
  }

  const statusOptions = statuses
    .filter(s => s.key)
    .map(s => ({ value: s.key, label: s.label || s.key }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Statuses */}
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12 }}>
          Statuses
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {statuses.map((status, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 14,
                background: 'var(--bg-primary)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto auto', gap: 12, alignItems: 'flex-end' }}>
                <Input
                  label="Key (UPPER_CASE)"
                  value={status.key}
                  onChange={e => updateStatus(idx, { key: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="e.g. DRAFT"
                />
                <Input
                  label="Label"
                  value={status.label}
                  onChange={e => updateStatus(idx, { label: e.target.value })}
                  placeholder="e.g. Draft"
                />
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 6 }}>Initial</div>
                  <Toggle
                    checked={status.initial}
                    onChange={initial => updateStatus(idx, { initial })}
                  />
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginBottom: 6 }}>Terminal</div>
                  <Toggle
                    checked={status.terminal}
                    onChange={terminal => updateStatus(idx, { terminal })}
                  />
                </div>
                <IconButton
                  onClick={() => removeStatus(idx)}
                  title="Remove status"
                  style={{ color: 'var(--error-500)', paddingBottom: 4 }}
                >
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            icon={<Plus size={16} />}
            onClick={addStatus}
            style={{ alignSelf: 'flex-start' }}
          >
            Add Status
          </Button>
        </div>
      </div>

      {/* Transitions */}
      <div>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12 }}>
          Transitions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {transitions.map((transition, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                gap: 12,
                alignItems: 'flex-end',
                border: '1px solid var(--border-secondary)',
                borderRadius: 'var(--radius-lg)',
                padding: 14,
                background: 'var(--bg-primary)',
              }}
            >
              <Select
                label="From"
                value={transition.from}
                onChange={e => updateTransition(idx, { from: e.target.value })}
                options={statusOptions}
                placeholder="Select status…"
              />
              <Select
                label="To"
                value={transition.to}
                onChange={e => updateTransition(idx, { to: e.target.value })}
                options={statusOptions}
                placeholder="Select status…"
              />
              <Input
                label="Command"
                value={transition.command}
                onChange={e => updateTransition(idx, { command: e.target.value })}
                placeholder="e.g. approve"
              />
              <IconButton
                onClick={() => removeTransition(idx)}
                title="Remove transition"
                style={{ color: 'var(--error-500)', paddingBottom: 4 }}
              >
                <Trash2 size={16} />
              </IconButton>
            </div>
          ))}
          <Button
            variant="secondary"
            icon={<Plus size={16} />}
            onClick={addTransition}
            style={{ alignSelf: 'flex-start' }}
          >
            Add Transition
          </Button>
        </div>
      </div>
    </div>
  )
}
