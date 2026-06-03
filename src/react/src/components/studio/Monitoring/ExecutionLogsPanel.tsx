import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText, Filter, RefreshCw } from 'lucide-react'
import { Badge, Spinner, Button, Input, Select, Toggle } from '../../../design-system'
import {
  getRuleExecutionLog, getWorkflowExecutionLog,
  type RuleLogEntry, type WorkflowLogEntry,
} from '../../../config/studioApi'

type LogSource = 'rules' | 'workflow' | 'all'

export function ExecutionLogsPanel() {
  const [source, setSource] = useState<LogSource>('all')
  const [entityType, setEntityType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [includeSim, setIncludeSim] = useState(false)
  const [limit] = useState(50)

  const { data: ruleData, isLoading: loadingRules, refetch: refetchRules } = useQuery({
    queryKey: ['monitoring-rule-logs', entityType, includeSim, limit],
    queryFn: () => getRuleExecutionLog({ entity_type: entityType || undefined, include_simulations: includeSim, limit }),
    enabled: source === 'rules' || source === 'all',
  })

  const { data: wfData, isLoading: loadingWf, refetch: refetchWf } = useQuery({
    queryKey: ['monitoring-wf-logs', statusFilter, limit],
    queryFn: () => getWorkflowExecutionLog({ status: statusFilter || undefined, limit }),
    enabled: source === 'workflow' || source === 'all',
  })

  const isLoading = (source !== 'workflow' && loadingRules) || (source !== 'rules' && loadingWf)

  // Merge and sort by time
  const ruleItems: UnifiedLog[] = (source !== 'workflow' ? (ruleData?.items ?? []) : []).map((r) => ({
    id: r.id,
    source: 'rule' as const,
    timestamp: r.created_at,
    entityType: r.entity_type,
    identifier: r.rule_set_key,
    status: r.blocked ? 'blocked' : 'passed',
    durationMs: r.execution_ms,
    details: `${r.fired_rules?.length ?? 0} rules fired`,
    isSimulation: r.is_simulation,
  }))

  const wfItems: UnifiedLog[] = (source !== 'rules' ? (wfData?.items ?? []) : []).map((w) => ({
    id: w.id,
    source: 'workflow' as const,
    timestamp: w.started_at,
    entityType: '',
    identifier: `${w.step_id} (${w.step_type})`,
    status: w.status,
    durationMs: w.duration_ms,
    details: w.error_message || '',
    isSimulation: false,
  }))

  const allLogs = [...ruleItems, ...wfItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, height: '100%' }}>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Filter size={14} color="var(--fg-tertiary)" />
        <Select
          value={source}
          onChange={(v) => setSource(v as LogSource)}
          options={[
            { label: 'All Sources', value: 'all' },
            { label: 'Rules Only', value: 'rules' },
            { label: 'Workflow Only', value: 'workflow' },
          ]}
          style={{ width: 140 }}
        />
        {(source === 'rules' || source === 'all') && (
          <>
            <Input
              placeholder="Entity type..."
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              style={{ width: 140 }}
            />
            <Toggle
              checked={includeSim}
              onChange={setIncludeSim}
              label="Simulations"
            />
          </>
        )}
        {(source === 'workflow' || source === 'all') && (
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Completed', value: 'completed' },
              { label: 'Failed', value: 'failed' },
              { label: 'Running', value: 'running' },
            ]}
            style={{ width: 130 }}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={() => { refetchRules(); refetchWf() }}
        >
          Refresh
        </Button>
        <Badge variant="neutral" style={{ marginLeft: 'auto' }}>{allLogs.length} entries</Badge>
      </div>

      {/* Log entries */}
      {isLoading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
      ) : allLogs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>
          No execution logs found for the current filters.
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '70px 160px 1fr 100px 80px 70px', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-primary)', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 1 }}>
            <span style={colHeaderStyle}>Source</span>
            <span style={colHeaderStyle}>Time</span>
            <span style={colHeaderStyle}>Identifier</span>
            <span style={colHeaderStyle}>Status</span>
            <span style={colHeaderStyle}>Duration</span>
            <span style={colHeaderStyle}>Details</span>
          </div>
          {allLogs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Types & Sub-components ──────────────────────────────────────────────────

interface UnifiedLog {
  id: string
  source: 'rule' | 'workflow'
  timestamp: string
  entityType: string
  identifier: string
  status: string
  durationMs: number
  details: string
  isSimulation: boolean
}

const colHeaderStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 500,
}

function LogRow({ log }: { log: UnifiedLog }) {
  const statusVariant = getStatusVariant(log.status)

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '70px 160px 1fr 100px 80px 70px',
      gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--border-secondary)',
      fontSize: 'var(--text-xs)',
      background: log.isSimulation ? 'var(--bg-tertiary)' : undefined,
    }}>
      <div>
        <Badge variant={log.source === 'rule' ? 'info' : 'neutral'} style={{ fontSize: 10 }}>
          {log.source === 'rule' ? 'Rule' : 'WF'}
        </Badge>
      </div>
      <div style={{ color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)' }}>
        {new Date(log.timestamp).toLocaleString()}
      </div>
      <div style={{ color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.identifier}
        {log.entityType && <span style={{ color: 'var(--fg-tertiary)', marginLeft: 6 }}>({log.entityType})</span>}
        {log.isSimulation && <Badge variant="warning" style={{ marginLeft: 6, fontSize: 9 }}>SIM</Badge>}
      </div>
      <div>
        <Badge variant={statusVariant}>{log.status}</Badge>
      </div>
      <div style={{ color: 'var(--fg-secondary)', fontFamily: 'var(--font-mono)' }}>
        {log.durationMs > 0 ? `${log.durationMs}ms` : '—'}
      </div>
      <div style={{ color: 'var(--fg-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {log.details}
      </div>
    </div>
  )
}

function getStatusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'neutral' {
  switch (status) {
    case 'completed': case 'passed': return 'success'
    case 'failed': case 'blocked': return 'error'
    case 'running': return 'info'
    case 'waiting': return 'warning'
    default: return 'neutral'
  }
}
