import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'
import { getTaskConfig } from '../toolbox/taskTypeRegistry'
import { TaskIcon } from './TaskIcon'

interface TaskNodeData {
  step: WorkflowStep
  label: string
  taskType: string
}

export function TaskNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TaskNodeData
  const config = getTaskConfig(nodeData.taskType)

  const borderColor = selected
    ? 'var(--brand-400, #60a5fa)'
    : 'var(--color-border, #e5e7eb)'
  const stripColor = config?.color ?? 'var(--brand-500)'
  const bgColor = 'var(--color-surface, #ffffff)'

  return (
    <div
      style={{
        width: 220,
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 8,
        boxShadow: selected
          ? '0 0 0 2px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 2px 6px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        cursor: 'grab',
        fontFamily: 'inherit',
      }}
    >
      {/* Color strip at left edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: '100%',
          background: stripColor,
          borderRadius: '8px 0 0 8px',
        }}
      />

      {/* Node content */}
      <div style={{ padding: '10px 12px 10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <TaskIcon iconName={config?.iconName ?? 'Box'} color={stripColor} size={14} />
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.8125rem',
              color: 'var(--color-text-primary, #111827)',
              lineHeight: 1.2,
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {nodeData.label}
          </span>
        </div>

        {/* Step ID badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted, #9ca3af)',
            background: 'var(--color-surface-2, #f3f4f6)',
            borderRadius: 4,
            padding: '1px 6px',
            fontFamily: 'monospace',
          }}
        >
          {'{$.'}{nodeData.step.id}{'}'}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--color-border)', border: '2px solid white', width: 10, height: 10 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'var(--color-border)', border: '2px solid white', width: 10, height: 10 }}
      />
    </div>
  )
}
