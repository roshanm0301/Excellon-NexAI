import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

export function EndNode({ selected }: NodeProps) {
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--color-text-primary, #111827)',
        border: selected ? '3px solid var(--brand-300, #93c5fd)' : '3px solid var(--color-text-secondary, #6b7280)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? '0 0 0 3px rgba(59,130,246,0.3)' : '0 2px 6px rgba(0,0,0,0.15)',
        cursor: 'default',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 2,
          background: 'white',
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'var(--color-text-secondary)', border: '2px solid white', width: 10, height: 10 }}
      />
    </div>
  )
}
