import type { WorkflowStep } from '../../../../../types/workflowBuilder'
import { JsonViewer } from '../../../../../design-system'

interface GenericSettingsProps {
  step: WorkflowStep
  onChange: (patch: Partial<WorkflowStep>) => void
}

export function GenericSettings({ step }: GenericSettingsProps) {
  return (
    <div style={{ padding: '0 12px' }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 6 }}>
          Task type <strong>{step.type}</strong> — full settings editor coming in Phase 2.
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 10 }}>
          Current configuration:
        </div>
        <JsonViewer data={step.properties.taskSettings ?? {}} />
      </div>
    </div>
  )
}
