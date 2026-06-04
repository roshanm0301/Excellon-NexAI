import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'
import { Shuffle } from 'lucide-react'

interface SwitchNodeData {
  step: WorkflowStep
  label: string
  taskType: string
}

export function SwitchNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as SwitchNodeData
  const branches = nodeData.step.branches ? Object.keys(nodeData.step.branches) : ['case1', 'default']

  return (
    <div
      style={{
        width: Math.max(180, branches.length * 80),
        background: 'var(--warning-50, #fffbeb)',
        border: `1.5px solid ${selected ? 'var(--brand-400, #60a5fa)' : 'var(--warning-400, #fbbf24)'}`,
        borderRadius: 8,
        boxShadow: selected
          ? '0 0 0 2px rgba(59,130,246,0.25)'
          : '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s',
        cursor: 'grab',
      }}
    >
      <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shuffle size={14} color="var(--warning-600)" />
        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--warning-700)' }}>
          {nodeData.label}
        </span>
      </div>

      {/* Branch labels row */}
      <div
        style={{
          display: 'flex',
          borderTop: '1px solid var(--warning-200, #fde68a)',
          padding: '4px 8px',
          gap: 4,
        }}
      >
        {branches.map(b => (
          <span
            key={b}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.625rem',
              color: 'var(--warning-600)',
              fontWeight: 600,
            }}
          >
            {b}
          </span>
        ))}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--warning-400)', border: '2px solid white', width: 10, height: 10 }}
      />

      {/* Source handle per branch */}
      {branches.map((branch, idx) => {
        const leftPct = ((idx + 0.5) / branches.length) * 100
        return (
          <Handle
            key={branch}
            type="source"
            position={Position.Bottom}
            id={branch}
            style={{
              background: branch === 'default' ? 'var(--color-text-secondary)' : 'var(--warning-500)',
              border: '2px solid white',
              width: 10,
              height: 10,
              left: `${leftPct}%`,
            }}
          />
        )
      })}
    </div>
  )
}
