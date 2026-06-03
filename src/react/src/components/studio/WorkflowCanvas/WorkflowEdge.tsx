import { memo } from 'react'
import {
  BaseEdge, EdgeLabelRenderer, getBezierPath,
  type EdgeProps,
} from '@xyflow/react'

export interface WorkflowEdgeData {
  label?: string
  condition?: string
  priority?: number
  animated?: boolean
  status?: 'active' | 'completed' | 'inactive'
  [key: string]: unknown
}

function WorkflowEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, selected, markerEnd,
}: EdgeProps) {
  const edgeData = data as unknown as WorkflowEdgeData | undefined
  const isActive = edgeData?.status === 'active'
  const isCompleted = edgeData?.status === 'completed'

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition,
  })

  const strokeColor = isActive
    ? 'var(--brand-500)'
    : isCompleted
      ? 'var(--success-500)'
      : selected
        ? 'var(--brand-400)'
        : 'var(--neutral-300)'

  const strokeWidth = isActive || selected ? 2.5 : 1.8

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: edgeData?.condition ? '6 3' : undefined,
          animation: isActive ? 'wf-flow 1s linear infinite' : undefined,
        }}
      />
      {(edgeData?.label || edgeData?.condition) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              background: 'var(--bg-primary)',
              border: `1px solid ${selected ? 'var(--brand-400)' : 'var(--border-secondary)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '2px 8px',
              fontSize: 'var(--text-xs)',
              color: 'var(--fg-secondary)',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            className="nodrag nopan"
          >
            {edgeData?.label || (edgeData?.condition ? `⚡ ${edgeData.condition.slice(0, 30)}` : '')}
            {edgeData?.priority != null && (
              <span style={{ marginLeft: 4, color: 'var(--fg-tertiary)', fontSize: 9 }}>
                P{edgeData.priority}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export const WorkflowEdgeMemo = memo(WorkflowEdge)

export const workflowEdgeTypes = {
  workflow: WorkflowEdgeMemo,
}
