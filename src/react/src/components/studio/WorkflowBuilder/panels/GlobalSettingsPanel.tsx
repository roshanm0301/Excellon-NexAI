import { useState } from 'react'
import { Settings } from 'lucide-react'
import { Input, Select, Textarea } from '../../../../design-system'
import type { WorkflowDefinition } from '../../../../types/workflowBuilder'

interface GlobalSettingsPanelProps {
  definition: WorkflowDefinition
  onChange: (def: WorkflowDefinition) => void
}

const ACTION_TYPE_OPTIONS = [
  { value: 'process', label: 'Process' },
  { value: 'create', label: 'Create' },
  { value: 'read', label: 'Read' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'list', label: 'List' },
  { value: 'validate', label: 'Validate' },
  { value: 'report', label: 'Report' },
]

const HTTP_METHOD_OPTIONS = [
  { value: 'POST', label: 'POST' },
  { value: 'GET', label: 'GET' },
  { value: 'PUT', label: 'PUT' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'DELETE', label: 'DELETE' },
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
  marginBottom: 8,
}

const sectionStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--color-border)',
  paddingBottom: 14,
  marginBottom: 14,
}

export function GlobalSettingsPanel({ definition, onChange }: GlobalSettingsPanelProps) {
  const props = definition.properties ?? {}
  const stepCount = definition.sequence.length

  // Auto-dismiss tips once workflow has more than 2 steps.
  // User can bring them back via the toggle link below.
  const [tipsManuallyShown, setTipsManuallyShown] = useState(false)
  const showTips = stepCount <= 2 || tipsManuallyShown

  const displayName = (props.displayName as string | undefined) ?? ''
  const method = (props.method as string | undefined) ?? 'POST'
  const actionType = (props.actionType as string | undefined) ?? 'process'
  const desc = (props.description as string | undefined) ?? ''
  const tags = (props.tags as string[] | undefined) ?? []

  function update(patch: Record<string, unknown>) {
    onChange({ ...definition, properties: { ...props, ...patch } })
  }

  return (
    <div
      style={{
        width: 360,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <Settings size={14} color="var(--brand-500)" />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
            Workflow Settings
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
            Click a node to edit its settings
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>

        {/* Identity — the three fields that define what this workflow IS */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
            Identity
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Workflow name *</label>
            <Input
              value={displayName}
              onChange={e => update({ displayName: e.target.value })}
              placeholder="e.g. Create Customer Order"
            />
            <div style={helpStyle}>The human-readable name shown in dashboards and logs.</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>HTTP method</label>
              <Select
                value={method}
                onChange={e => update({ method: e.target.value })}
                options={HTTP_METHOD_OPTIONS}
              />
            </div>
            <div style={{ flex: 2 }}>
              <label style={labelStyle}>Action type</label>
              <Select
                value={actionType}
                onChange={e => update({ actionType: e.target.value })}
                options={ACTION_TYPE_OPTIONS}
              />
            </div>
          </div>
          <div style={helpStyle}>HTTP method and action type determine the API endpoint signature.</div>
        </div>

        {/* Additional info */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
            Details
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Description</label>
            <Textarea
              value={desc}
              onChange={e => update({ description: e.target.value })}
              placeholder="What does this workflow do?"
              rows={2}
            />
            <div style={helpStyle}>Optional. Helps your team understand this workflow's purpose.</div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <Input
              value={tags.join(', ')}
              onChange={e => update({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
              placeholder="e.g. finance, approval, v2"
            />
          </div>
        </div>

        {/* Step count summary */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 700, fontSize: '0.6875rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 10 }}>
            Summary
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {stepCount} {stepCount === 1 ? 'step' : 'steps'} in this workflow
          </div>
        </div>

        {/* Getting started tips — auto-hidden after 2 steps */}
        {showTips && (
          <div
            style={{
              background: 'var(--brand-50, #eff6ff)',
              border: '1px solid var(--brand-200, #bfdbfe)',
              borderRadius: 8,
              padding: '10px 12px',
              marginBottom: 8,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--brand-700, #1d4ed8)', marginBottom: 4 }}>
              Getting started
            </div>
            <ul style={{ fontSize: '0.6875rem', color: 'var(--brand-600, #2563eb)', paddingLeft: 14, margin: 0, lineHeight: 1.6 }}>
              <li>Drag tasks from the <strong>Task Library</strong> onto the canvas</li>
              <li>Or drag entity operations from the left sidebar</li>
              <li>Click a node to configure its settings here</li>
              <li>Connect nodes by dragging from the bottom ● handle to the top ● of the next node</li>
              <li>Use <code style={{ background: 'var(--brand-100)', padding: '0 3px', borderRadius: 3 }}>{'{$.stepId.data}'}</code> to reference previous step outputs</li>
            </ul>
          </div>
        )}

        {!showTips && (
          <button
            onClick={() => setTipsManuallyShown(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.6875rem',
              color: 'var(--brand-500)',
              padding: 0,
              fontFamily: 'inherit',
            }}
          >
            Show tips ▾
          </button>
        )}
      </div>
    </div>
  )
}
