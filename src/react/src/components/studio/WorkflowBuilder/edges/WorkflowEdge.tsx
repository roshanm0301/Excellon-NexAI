import { BaseEdge, getSmoothStepPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'

export function WorkflowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  })

  let strokeColor = 'var(--color-border, #e5e7eb)'
  if (sourceHandleId === 'onSuccess') strokeColor = 'var(--success-500, #22c55e)'
  if (sourceHandleId === 'onFailure') strokeColor = 'var(--error-500, #ef4444)'
  if (sourceHandleId === 'rollback') strokeColor = 'var(--warning-500, #f59e0b)'

  const computedStyle = {
    stroke: strokeColor,
    strokeWidth: 2,
    ...style,
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={computedStyle}
    />
  )
}
