import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'

interface ConditionNodeData {
  step: WorkflowStep
  label: string
  taskType: string
}

export function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ConditionNodeData
  const size = 110

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* Diamond SVG */}
      <svg
        width={size}
        height={size}
        style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        <polygon
          points={`${size / 2},4 ${size - 4},${size / 2} ${size / 2},${size - 4} 4,${size / 2}`}
          fill="var(--warning-50, #fffbeb)"
          stroke={selected ? 'var(--brand-400, #60a5fa)' : 'var(--warning-400, #fbbf24)'}
          strokeWidth={selected ? 2.5 : 1.5}
          filter={selected ? 'drop-shadow(0 0 4px rgba(59,130,246,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))'}
        />
      </svg>

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 12,
          gap: 2,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning-700, #b45309)', lineHeight: 1.2 }}>
          {nodeData.label}
        </span>
        <span style={{ fontSize: '0.625rem', color: 'var(--warning-500, #f59e0b)', fontFamily: 'monospace' }}>
          ?
        </span>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--warning-400)', border: '2px solid white', width: 10, height: 10, top: -5 }}
      />
      {/* Success handle — left */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="onSuccess"
        style={{
          background: 'var(--success-500, #22c55e)',
          border: '2px solid white',
          width: 10,
          height: 10,
          left: '28%',
          bottom: -5,
        }}
      />
      {/* Failure handle — right */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="onFailure"
        style={{
          background: 'var(--error-500, #ef4444)',
          border: '2px solid white',
          width: 10,
          height: 10,
          left: '72%',
          bottom: -5,
        }}
      />

      {/* Branch labels */}
      <div
        style={{
          position: 'absolute',
          bottom: -22,
          left: '0%',
          fontSize: '0.625rem',
          color: 'var(--success-600)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        Yes
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -22,
          right: '-4%',
          fontSize: '0.625rem',
          color: 'var(--error-600)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        No
      </div>
    </div>
  )
}
