import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Layers, StickyNote } from 'lucide-react'
import type { WorkflowStep } from '../../../../types/workflowBuilder'
import { getTaskConfig } from '../toolbox/taskTypeRegistry'
import { BRANCHING_TASK_TYPES, type TaskType } from '../../../../types/workflowBuilder'
import { TaskIcon } from './TaskIcon'

interface TaskNodeData {
  step: WorkflowStep
  label: string
  taskType: string
}

const CONTAINER_TYPES = new Set(['Loop', 'Iterator', 'Transaction', 'Sequence', 'Parallel', 'Promise'])

function getSummary(type: string, settings: Record<string, unknown>): string | null {
  switch (type) {
    case 'Document':
    case 'Entity':
    case 'Query':
      if (settings.entityType && settings.operation) {
        return `${String(settings.entityType)} · ${String(settings.operation)}`
      }
      return null
    case 'HTTP':
      if (settings.url) {
        try {
          const hostname = new URL(String(settings.url)).hostname
          return `${String(settings.method ?? 'GET')} ${hostname}`
        } catch {
          return `${String(settings.method ?? 'GET')} ${String(settings.url).slice(0, 30)}`
        }
      }
      return null
    case 'SMTP':
      return settings.to ? `To: ${String(settings.to)}` : null
    case 'Response':
      return settings.statusCode ? `Status ${String(settings.statusCode)}` : null
    case 'Condition': {
      const cols = settings.conditions as Array<{ left: string }> | undefined
      if (cols && cols.length > 0) return cols[0].left.slice(0, 30)
      return null
    }
    case 'Approval':
      return settings.approverRole ? `Approver: ${String(settings.approverRole)}` : null
    case 'Timer':
      return settings.hours ? `Wait ${String(settings.hours)}h` : null
    case 'Variable':
      return settings.varName ? `var: ${String(settings.varName)}` : null
    case 'Cache':
      return settings.operation && settings.cacheKey
        ? `${String(settings.operation)} · ${String(settings.cacheKey).slice(0, 20)}`
        : null
    case 'AI':
      return settings.provider ? `via ${String(settings.provider)}` : null
    default:
      return null
  }
}

export function TaskNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TaskNodeData
  const config = getTaskConfig(nodeData.taskType)
  const isContainer = CONTAINER_TYPES.has(nodeData.taskType)
  const isBranching = BRANCHING_TASK_TYPES.has(nodeData.taskType as TaskType)

  const borderColor = selected
    ? 'var(--brand-400, #60a5fa)'
    : isContainer
      ? 'var(--color-border-strong, #d1d5db)'
      : 'var(--color-border, #e5e7eb)'

  const stripColor = config?.color ?? 'var(--brand-500)'
  const bgColor = isContainer
    ? 'var(--color-surface-raised, #fafafa)'
    : 'var(--color-surface, #ffffff)'

  const branchCount = nodeData.step.branches
    ? Object.keys(nodeData.step.branches).length
    : 0

  const hasNote = Boolean(nodeData.step.note)
  const settings = (nodeData.step.properties?.taskSettings ?? {}) as Record<string, unknown>
  const summary = getSummary(nodeData.taskType, settings)

  return (
    <div
      style={{
        width: 220,
        background: bgColor,
        border: isContainer
          ? `1.5px dashed ${selected ? 'var(--brand-400, #60a5fa)' : 'var(--color-border-strong, #d1d5db)'}`
          : `1.5px solid ${borderColor}`,
        borderRadius: 8,
        boxShadow: selected
          ? '0 0 0 2px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 2px 6px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        cursor: 'grab',
        fontFamily: 'inherit',
        position: 'relative',
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

      {/* Sticky-note indicator (top-right corner) */}
      {hasNote && (
        <div
          title={nodeData.step.note}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            cursor: 'default',
          }}
        >
          <StickyNote size={10} color="#78350f" />
        </div>
      )}

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
          {isContainer && (
            <span title="Contains child steps" style={{ color: stripColor, flexShrink: 0 }}>
              <Layers size={11} />
            </span>
          )}
        </div>

        {/* Step ID badge + branch/child info */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
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
          {(isContainer || isBranching) && branchCount > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: '0.625rem',
                color: stripColor,
                background: config?.bgColor ?? 'var(--color-surface-2)',
                borderRadius: 4,
                padding: '1px 5px',
                fontWeight: 500,
              }}
            >
              {branchCount} {branchCount === 1 ? 'branch' : 'branches'}
            </div>
          )}
        </div>

        {/* 1-line configuration summary */}
        {summary && (
          <div
            style={{
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              marginTop: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={summary}
          >
            {summary}
          </div>
        )}
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
