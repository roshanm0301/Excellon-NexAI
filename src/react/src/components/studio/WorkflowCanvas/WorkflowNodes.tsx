import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Play, Square, CheckCircle, UserCheck, Server, Code2,
  Clock, GitBranch, GitMerge, Workflow, AlertTriangle, XCircle,
  Loader2, Pause, SkipForward,
} from 'lucide-react'
import type { StepType, GatewayType, NodeStatus } from '../../../config/studioApi'

// ─── Node Data Types ──────────────────────────────────────────────────────────

export interface WorkflowNodeData {
  label: string
  stepType: StepType
  gatewayType?: GatewayType
  isJoin?: boolean
  status?: NodeStatus
  timeoutMins?: number
  retryCount?: number
  config?: Record<string, unknown>
  [key: string]: unknown
}

// ─── Status Colors ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<NodeStatus, { bg: string; border: string; pulse?: boolean }> = {
  pending: { bg: 'var(--neutral-50)', border: 'var(--neutral-300)' },
  ready: { bg: 'var(--brand-50)', border: 'var(--brand-300)' },
  running: { bg: 'var(--brand-50)', border: 'var(--brand-500)', pulse: true },
  completed: { bg: 'var(--success-50)', border: 'var(--success-400)' },
  failed: { bg: 'var(--error-50)', border: 'var(--error-400)' },
  skipped: { bg: 'var(--neutral-100)', border: 'var(--neutral-300)' },
  waiting: { bg: 'var(--warning-50)', border: 'var(--warning-400)', pulse: true },
}

const STATUS_ICONS: Record<NodeStatus, React.ReactNode> = {
  pending: null,
  ready: <Loader2 size={10} style={{ color: 'var(--brand-500)' }} />,
  running: <Loader2 size={10} className="wf-spin" style={{ color: 'var(--brand-600)' }} />,
  completed: <CheckCircle size={10} style={{ color: 'var(--success-600)' }} />,
  failed: <XCircle size={10} style={{ color: 'var(--error-600)' }} />,
  skipped: <SkipForward size={10} style={{ color: 'var(--neutral-500)' }} />,
  waiting: <Pause size={10} style={{ color: 'var(--warning-600)' }} />,
}

// ─── Step Type Icons ──────────────────────────────────────────────────────────

function StepIcon({ type, size = 16 }: { type: StepType; size?: number }) {
  switch (type) {
    case 'approval': return <UserCheck size={size} />
    case 'service_call': return <Server size={size} />
    case 'script': return <Code2 size={size} />
    case 'wait': return <Clock size={size} />
    case 'sub_workflow': return <Workflow size={size} />
    case 'rule_evaluation': return <AlertTriangle size={size} />
    case 'gateway': return <GitBranch size={size} />
    default: return <Square size={size} />
  }
}

// ─── Start Node ───────────────────────────────────────────────────────────────

export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'var(--success-500)', border: `3px solid ${selected ? 'var(--brand-500)' : 'var(--success-600)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: selected ? '0 0 0 3px var(--brand-200)' : '0 2px 6px rgba(0,0,0,0.1)',
      cursor: 'pointer',
    }}>
      <Play size={22} fill="white" color="white" />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
})
StartNode.displayName = 'StartNode'

// ─── End Node ─────────────────────────────────────────────────────────────────

export const EndNode = memo(({ data, selected }: NodeProps) => {
  return (
    <div style={{
      width: 56, height: 56, borderRadius: '50%',
      background: 'var(--error-500)', border: `3px solid ${selected ? 'var(--brand-500)' : 'var(--error-600)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: selected ? '0 0 0 3px var(--brand-200)' : '0 2px 6px rgba(0,0,0,0.1)',
      cursor: 'pointer',
    }}>
      <Square size={18} fill="white" color="white" />
      <Handle type="target" position={Position.Top} style={handleStyle} />
    </div>
  )
})
EndNode.displayName = 'EndNode'

// ─── Task Node (Approval, Service, Script, Wait, SubWorkflow, RuleEval) ──────

export const TaskNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData
  const status = nodeData.status
  const statusStyle = status ? STATUS_STYLES[status] : STATUS_STYLES.pending
  const statusIcon = status ? STATUS_ICONS[status] : null

  return (
    <div style={{
      minWidth: 180, maxWidth: 260, padding: '12px 16px',
      borderRadius: 'var(--radius-xl)',
      background: statusStyle.bg,
      border: `2px solid ${selected ? 'var(--brand-500)' : statusStyle.border}`,
      boxShadow: selected ? '0 0 0 3px var(--brand-200)' : '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'pointer',
      animation: statusStyle.pulse ? 'wf-pulse 2s ease-in-out infinite' : undefined,
    }}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-lg)',
          background: getStepColor(nodeData.stepType),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', flexShrink: 0,
        }}>
          <StepIcon type={nodeData.stepType} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {nodeData.label}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            {formatStepType(nodeData.stepType)}
            {statusIcon && <span style={{ marginLeft: 4, display: 'flex' }}>{statusIcon}</span>}
          </div>
        </div>
      </div>
      {/* Metadata badges */}
      {(nodeData.timeoutMins || nodeData.retryCount) && (
        <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {nodeData.timeoutMins ? (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--radius-full)', background: 'var(--warning-100)', color: 'var(--warning-700)' }}>
              ⏱ {nodeData.timeoutMins}m
            </span>
          ) : null}
          {nodeData.retryCount ? (
            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--radius-full)', background: 'var(--neutral-100)', color: 'var(--neutral-700)' }}>
              ↺ {nodeData.retryCount}
            </span>
          ) : null}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
})
TaskNode.displayName = 'TaskNode'

// ─── Gateway Node (Diamond shape) ────────────────────────────────────────────

export const GatewayNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WorkflowNodeData
  const status = nodeData.status
  const statusStyle = status ? STATUS_STYLES[status] : STATUS_STYLES.pending
  const isJoin = nodeData.isJoin
  const gwType = nodeData.gatewayType ?? 'parallel'

  return (
    <div style={{
      width: 52, height: 52, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }}>
      {/* Diamond shape via rotated square */}
      <div style={{
        width: 40, height: 40, position: 'absolute',
        transform: 'rotate(45deg)',
        background: statusStyle.bg,
        border: `2px solid ${selected ? 'var(--brand-500)' : statusStyle.border}`,
        borderRadius: 6,
        boxShadow: selected ? '0 0 0 3px var(--brand-200)' : '0 1px 4px rgba(0,0,0,0.1)',
      }} />
      {/* Icon on top */}
      <div style={{ position: 'relative', zIndex: 1, color: getGatewayColor(gwType), display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {isJoin ? <GitMerge size={16} /> : <GitBranch size={16} />}
        <span style={{ fontSize: 7, fontWeight: 700, textTransform: 'uppercase', marginTop: 1 }}>
          {gwType.slice(0, 3)}
        </span>
      </div>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      {/* Side handles for parallel branches */}
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
    </div>
  )
})
GatewayNode.displayName = 'GatewayNode'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStepColor(type: StepType): string {
  switch (type) {
    case 'approval': return 'var(--warning-500)'
    case 'service_call': return 'var(--brand-500)'
    case 'script': return 'var(--neutral-600)'
    case 'wait': return 'var(--neutral-400)'
    case 'sub_workflow': return 'var(--success-500)'
    case 'rule_evaluation': return 'var(--error-400)'
    case 'gateway': return 'var(--brand-600)'
    default: return 'var(--neutral-500)'
  }
}

function getGatewayColor(type: GatewayType): string {
  switch (type) {
    case 'parallel': return 'var(--brand-600)'
    case 'exclusive': return 'var(--warning-600)'
    case 'inclusive': return 'var(--success-600)'
  }
}

function formatStepType(type: StepType): string {
  switch (type) {
    case 'approval': return 'Approval'
    case 'service_call': return 'Service Call'
    case 'script': return 'Script'
    case 'wait': return 'Wait / Timer'
    case 'sub_workflow': return 'Sub-Workflow'
    case 'rule_evaluation': return 'Rule Eval'
    case 'gateway': return 'Gateway'
    default: return type
  }
}

const handleStyle: React.CSSProperties = {
  width: 10, height: 10,
  background: 'var(--bg-primary)',
  border: '2px solid var(--brand-400)',
  borderRadius: '50%',
}

// Node type registry for ReactFlow
export const workflowNodeTypes = {
  start: StartNode,
  end: EndNode,
  task: TaskNode,
  gateway: GatewayNode,
}
