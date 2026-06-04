import { X } from 'lucide-react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'
import { DocumentSettings } from './settings/DocumentSettings'
import { GenericSettings } from './settings/GenericSettings'
import { getTaskConfig } from '../toolbox/taskTypeRegistry'
import { TaskIcon } from '../nodes/TaskIcon'
import { Input } from '../../../../design-system'

interface StepSettingsPanelProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
  onClose: () => void
}

export function StepSettingsPanel({ step, onChange, onClose }: StepSettingsPanelProps) {
  const config = getTaskConfig(step.type)

  function renderSettings() {
    switch (step.type) {
      case 'Document':
      case 'Entity':
        return <DocumentSettings step={step} onChange={onChange} />
      default:
        return <GenericSettings step={step} onChange={onChange} />
    }
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    marginBottom: 4,
  }

  return (
    <div
      style={{
        width: 300,
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
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {config && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: config.bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TaskIcon iconName={config.iconName} color={config.color} size={14} />
          </div>
        )}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
            {config?.label ?? step.type}
          </div>
          {config && (
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.3 }}>
              {config.description}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--color-text-muted)',
            borderRadius: 4,
            display: 'flex',
            flexShrink: 0,
          }}
          aria-label="Close settings panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Identity fields */}
      <div
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flexShrink: 0,
          background: 'var(--color-surface-2)',
        }}
      >
        <div>
          <label style={labelStyle}>Step name</label>
          <Input
            value={step.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Human-readable label"
          />
        </div>
        <div>
          <label style={labelStyle}>
            Output variable{' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>
              (used as {'{$.'}{step.id}{'.'}'data}')
            </span>
          </label>
          <Input
            value={step.id}
            onChange={e => onChange({ id: e.target.value })}
            placeholder="camelCaseId"
            style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
          />
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
            Lowercase, no spaces. Other steps reference this result as {'{$.'}{step.id}{'.data}'}
          </div>
        </div>
      </div>

      {/* Type-specific settings */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {renderSettings()}
      </div>
    </div>
  )
}
