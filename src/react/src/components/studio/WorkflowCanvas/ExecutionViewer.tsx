import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Activity, Clock, CheckCircle, XCircle, Pause, RefreshCw } from 'lucide-react'
import { Badge, Spinner, Banner, TabGroup } from '../../../design-system'
import {
  getWorkflowInstance, getDAGState, getWorkflowLogs,
  type WorkflowExecutionLog, type NodeStatus,
} from '../../../config/studioApi'
import { WorkflowCanvas } from './WorkflowCanvas'

interface ExecutionViewerProps {
  instanceId: string
}

const EXEC_TABS = [
  { id: 'dag', label: 'DAG View' },
  { id: 'log', label: 'Execution Log' },
  { id: 'vars', label: 'Variables' },
]

export function ExecutionViewer({ instanceId }: ExecutionViewerProps) {
  const [activeTab, setActiveTab] = useState('dag')

  const { data: instance, isLoading: loadingInstance } = useQuery({
    queryKey: ['workflow-instance', instanceId],
    queryFn: () => getWorkflowInstance(instanceId),
    refetchInterval: 3000, // Poll every 3s for live updates
  })

  const { data: dagState } = useQuery({
    queryKey: ['dag-state', instanceId],
    queryFn: () => getDAGState(instanceId),
    refetchInterval: 3000,
  })

  const { data: logsData } = useQuery({
    queryKey: ['workflow-logs', instanceId],
    queryFn: () => getWorkflowLogs(instanceId),
    refetchInterval: 5000,
  })

  if (loadingInstance) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
  if (!instance) return <Banner variant="error" title="Instance not found" />

  // Build execution state map for the canvas
  const executionStateMap: Record<string, string> = {}
  if (dagState) {
    for (const [nodeId, state] of Object.entries(dagState.nodeStates)) {
      executionStateMap[nodeId] = state.status
    }
  }

  const logs = logsData?.items ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Instance header */}
      <div style={{
        padding: '12px 20px', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        background: 'var(--bg-primary)',
      }}>
        <StatusBadge status={instance.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
            Instance: {instanceId.slice(0, 8)}…
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>
            Entity: {instance.entityType} / {instance.entityId?.slice(0, 8)}… · Started: {instance.startedAt ? new Date(instance.startedAt).toLocaleString() : '—'}
          </div>
        </div>
        {dagState && (
          <div style={{ display: 'flex', gap: 8, fontSize: 'var(--text-xs)' }}>
            <StatChip label="Active" value={dagState.activeNodes.length} color="var(--brand-500)" />
            <StatChip label="Completed" value={dagState.completedNodes.length} color="var(--success-500)" />
            <StatChip label="Variables" value={Object.keys(dagState.variables).length} color="var(--neutral-500)" />
          </div>
        )}
      </div>

      {/* Tab strip */}
      <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-primary)' }}>
        <TabGroup
          tabs={EXEC_TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'dag' && (
          <WorkflowCanvas
            dag={null} // Canvas will load from instance.dagState
            onChange={() => {}} // Read-only
            readOnly
            executionState={executionStateMap}
          />
        )}
        {activeTab === 'log' && (
          <ExecutionLogTimeline logs={logs} />
        )}
        {activeTab === 'vars' && dagState && (
          <VariablesPanel variables={dagState.variables} nodeStates={dagState.nodeStates} />
        )}
      </div>
    </div>
  )
}

// ─── Execution Log Timeline ───────────────────────────────────────────────────

function ExecutionLogTimeline({ logs }: { logs: WorkflowExecutionLog[] }) {
  if (logs.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No execution logs yet</div>
  }

  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {logs.map((log, i) => (
          <div key={log.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
            {/* Timeline line */}
            {i < logs.length - 1 && (
              <div style={{
                position: 'absolute', left: 11, top: 24, bottom: -4,
                width: 2, background: 'var(--border-secondary)',
              }} />
            )}
            {/* Dot */}
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: getLogStatusBg(log.status),
              border: `2px solid ${getLogStatusColor(log.status)}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {getLogStatusIcon(log.status)}
            </div>
            {/* Content */}
            <div style={{ flex: 1, paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                  {log.stepId}
                </span>
                <Badge variant="gray">{log.stepType}</Badge>
                <Badge variant={log.status === 'completed' ? 'success' : log.status === 'failed' ? 'error' : 'info'}>
                  {log.status}
                </Badge>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 2 }}>
                {new Date(log.startedAt).toLocaleTimeString()}
                {log.durationMs != null && ` · ${log.durationMs}ms`}
              </div>
              {log.errorMessage && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--error-600)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                  {log.errorMessage}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Variables Panel ──────────────────────────────────────────────────────────

function VariablesPanel({ variables, nodeStates }: { variables: Record<string, unknown>; nodeStates: Record<string, { nodeId: string; status: NodeStatus; output?: Record<string, unknown> }> }) {
  return (
    <div style={{ padding: 20, overflow: 'auto', height: '100%' }}>
      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--fg-secondary)', marginBottom: 12 }}>
        Workflow Variables
      </h4>
      {Object.keys(variables).length > 0 ? (
        <div style={{
          border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)',
          overflow: 'hidden', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
        }}>
          {Object.entries(variables).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', borderBottom: '1px solid var(--border-secondary)', padding: '8px 12px' }}>
              <span style={{ flex: '0 0 40%', fontWeight: 600, color: 'var(--brand-600)' }}>{key}</span>
              <span style={{ flex: 1, color: 'var(--fg-primary)', wordBreak: 'break-all' }}>{JSON.stringify(val)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No variables set yet</div>
      )}

      <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--fg-secondary)', marginTop: 24, marginBottom: 12 }}>
        Node Outputs
      </h4>
      {Object.entries(nodeStates).filter(([, s]) => s.output && Object.keys(s.output).length > 0).map(([id, state]) => (
        <div key={id} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-secondary)', marginBottom: 4 }}>
            {id} <Badge variant={state.status === 'completed' ? 'success' : 'gray'}>{state.status}</Badge>
          </div>
          <pre style={{
            padding: 8, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)',
            overflow: 'auto', maxHeight: 120, margin: 0,
          }}>
            {JSON.stringify(state.output, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    running: { color: 'var(--brand-700)', bg: 'var(--brand-50)', icon: <RefreshCw size={12} className="wf-spin" /> },
    completed: { color: 'var(--success-700)', bg: 'var(--success-50)', icon: <CheckCircle size={12} /> },
    failed: { color: 'var(--error-700)', bg: 'var(--error-50)', icon: <XCircle size={12} /> },
    aborted: { color: 'var(--neutral-700)', bg: 'var(--neutral-50)', icon: <XCircle size={12} /> },
    waiting: { color: 'var(--warning-700)', bg: 'var(--warning-50)', icon: <Pause size={12} /> },
  }
  const c = config[status] ?? config.running
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 'var(--radius-full)',
      background: c.bg, color: c.color, fontSize: 'var(--text-xs)', fontWeight: 700,
    }}>
      {c.icon} {status.toUpperCase()}
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ color: 'var(--fg-tertiary)' }}>{label}:</span>
      <span style={{ fontWeight: 700, color: 'var(--fg-primary)' }}>{value}</span>
    </div>
  )
}

function getLogStatusColor(status: string): string {
  if (status === 'completed') return 'var(--success-500)'
  if (status === 'failed') return 'var(--error-500)'
  if (status === 'running') return 'var(--brand-500)'
  return 'var(--neutral-400)'
}

function getLogStatusBg(status: string): string {
  if (status === 'completed') return 'var(--success-50)'
  if (status === 'failed') return 'var(--error-50)'
  if (status === 'running') return 'var(--brand-50)'
  return 'var(--neutral-50)'
}

function getLogStatusIcon(status: string): React.ReactNode {
  if (status === 'completed') return <CheckCircle size={12} style={{ color: 'var(--success-600)' }} />
  if (status === 'failed') return <XCircle size={12} style={{ color: 'var(--error-600)' }} />
  if (status === 'running') return <Activity size={10} style={{ color: 'var(--brand-600)' }} />
  return <Clock size={10} style={{ color: 'var(--neutral-500)' }} />
}
