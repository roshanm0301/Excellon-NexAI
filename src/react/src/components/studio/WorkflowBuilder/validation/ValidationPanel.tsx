import { useState, useEffect, useRef, useCallback } from 'react'
import { CheckCircle, AlertTriangle, XCircle, ChevronUp, ChevronDown } from 'lucide-react'
import type { Node, Edge, ReactFlowInstance } from '@xyflow/react'
import type { WorkflowDefinition } from '../../../../types/workflowBuilder'
import { validateWorkflow } from './workflowValidation'
import type { ValidationResult } from './workflowValidation'

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWorkflowValidation(
  definition: WorkflowDefinition,
  nodes: Node[],
  edges: Edge[],
): ValidationResult {
  const [result, setResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const r = validateWorkflow(definition, nodes, edges)
      setResult(r)
    }, 300)

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [definition, nodes, edges])

  return result
}

// ── Component ─────────────────────────────────────────────────────────────────

interface ValidationPanelProps {
  definition: WorkflowDefinition
  nodes: Node[]
  edges: Edge[]
  reactFlowInstance: ReactFlowInstance | null
}

export function ValidationPanel({
  definition,
  nodes,
  edges,
  reactFlowInstance,
}: ValidationPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const result = useWorkflowValidation(definition, nodes, edges)

  const total = result.errors.length + result.warnings.length

  const jumpToNode = useCallback(
    (nodeId: string) => {
      if (!reactFlowInstance) return
      const node = nodes.find(n => n.id === nodeId)
      if (!node) return
      reactFlowInstance.fitView({ nodes: [node], duration: 400, padding: 0.4 })
    },
    [reactFlowInstance, nodes],
  )

  // Badge label and colour
  const badgeStyle: React.CSSProperties = (() => {
    if (result.errors.length > 0) {
      return { color: 'var(--error-600, #dc2626)', background: 'var(--error-50, #fef2f2)', borderColor: 'var(--error-200, #fecaca)' }
    }
    if (result.warnings.length > 0) {
      return { color: 'var(--warning-600, #d97706)', background: 'var(--warning-50, #fffbeb)', borderColor: 'var(--warning-200, #fde68a)' }
    }
    return { color: 'var(--success-600, #16a34a)', background: 'var(--success-50, #f0fdf4)', borderColor: 'var(--success-200, #bbf7d0)' }
  })()

  const badgeLabel = (() => {
    if (result.errors.length > 0) return `${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`
    if (result.warnings.length > 0) return `${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`
    return 'Valid'
  })()

  const BadgeIcon = result.errors.length > 0 ? XCircle : result.warnings.length > 0 ? AlertTriangle : CheckCircle

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 5,
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.25s ease',
        maxHeight: expanded ? 220 : 36,
        overflow: 'hidden',
        boxShadow: expanded ? '0 -4px 12px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      {/* Header row */}
      <button
        onClick={() => total > 0 && setExpanded(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 12px',
          height: 36,
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: total > 0 ? 'pointer' : 'default',
          fontFamily: 'inherit',
          textAlign: 'left',
          width: '100%',
        }}
        aria-expanded={expanded}
        aria-label="Toggle validation panel"
      >
        {/* Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 8px',
            borderRadius: 12,
            border: '1px solid',
            fontSize: '0.75rem',
            fontWeight: 600,
            lineHeight: 1.4,
            ...badgeStyle,
          }}
        >
          <BadgeIcon size={12} />
          {badgeLabel}
        </span>

        {total > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flex: 1 }}>
            {result.errors.length > 0 && `${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`}
            {result.errors.length > 0 && result.warnings.length > 0 && ', '}
            {result.warnings.length > 0 && `${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`}
          </span>
        )}

        {total === 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flex: 1 }}>
            No issues found
          </span>
        )}

        {total > 0 && (
          <span style={{ color: 'var(--color-text-muted)' }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </span>
        )}
      </button>

      {/* Issue list */}
      {expanded && total > 0 && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 12px 12px',
          }}
        >
          {result.errors.map((err, i) => (
            <div
              key={`err-${i}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '5px 0',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
              }}
            >
              <XCircle size={14} color="var(--error-500, #ef4444)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ flex: 1, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{err.message}</span>
              {err.nodeId && reactFlowInstance && (
                <button
                  onClick={() => jumpToNode(err.nodeId!)}
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: '1px 8px',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    color: 'var(--brand-600)',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Jump to
                </button>
              )}
            </div>
          ))}

          {result.warnings.map((warn, i) => (
            <div
              key={`warn-${i}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '5px 0',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
              }}
            >
              <AlertTriangle size={14} color="var(--warning-500, #f59e0b)" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ flex: 1, color: 'var(--color-text-primary)', lineHeight: 1.4 }}>{warn.message}</span>
              {warn.nodeId && reactFlowInstance && (
                <button
                  onClick={() => jumpToNode(warn.nodeId!)}
                  style={{
                    flexShrink: 0,
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: '1px 8px',
                    fontSize: '0.6875rem',
                    cursor: 'pointer',
                    color: 'var(--brand-600)',
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Jump to
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
