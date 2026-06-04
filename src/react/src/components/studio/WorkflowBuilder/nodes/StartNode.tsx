import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export function StartNode({ selected }: NodeProps) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--brand-600, #2563eb)',
        border: selected ? '3px solid var(--brand-300, #93c5fd)' : '3px solid var(--brand-700, #1d4ed8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.3)' : '0 2px 6px rgba(0,0,0,0.15)',
        cursor: 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
        <polygon points="4,2 14,8 4,14" />
      </svg>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'var(--brand-400)', border: '2px solid white', width: 10, height: 10 }}
      />
    </div>
  )
}
