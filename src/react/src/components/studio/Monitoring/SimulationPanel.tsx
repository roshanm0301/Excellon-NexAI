import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Play, FlaskConical, ChevronDown, ChevronRight, CheckCircle, XCircle,
  AlertTriangle, ArrowRight, Zap,
} from 'lucide-react'
import { Button, Badge, Banner, Input, Select, TabGroup } from '../../../design-system'
import {
  simulateRules,
  type SimulationResult, type SimulationTrace,
} from '../../../config/studioApi'

const SIM_TABS = [
  { id: 'rules', label: 'Rule Simulation' },
  { id: 'workflow', label: 'Workflow Dry Run' },
]

export function SimulationPanel() {
  const [activeTab, setActiveTab] = useState('rules')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <FlaskConical size={16} color="var(--brand-500)" />
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)' }}>
          Simulation Lab
        </span>
      </div>
      <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-primary)' }}>
        <TabGroup
          tabs={SIM_TABS}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'rules' && <RuleSimulation />}
        {activeTab === 'workflow' && <WorkflowDryRun />}
      </div>
    </div>
  )
}

// ─── Rule Simulation ──────────────────────────────────────────────────────────

function RuleSimulation() {
  const [entityType, setEntityType] = useState('')
  const [ruleSetKey, setRuleSetKey] = useState('')
  const [triggerType, setTriggerType] = useState('on_change')
  const [payloadStr, setPayloadStr] = useState('{\n  \n}')
  const [parseError, setParseError] = useState('')

  const simMutation = useMutation({
    mutationFn: (body: { rule_set_key: string; entity_type: string; trigger_type?: string; payload: Record<string, unknown> }) =>
      simulateRules(body),
  })

  const handleRun = () => {
    setParseError('')
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(payloadStr)
    } catch {
      setParseError('Invalid JSON payload')
      return
    }
    if (!entityType.trim()) {
      setParseError('Entity type is required')
      return
    }
    if (!ruleSetKey.trim()) {
      setParseError('Rule set key is required')
      return
    }
    simMutation.mutate({ rule_set_key: ruleSetKey, entity_type: entityType, trigger_type: triggerType || undefined, payload })
  }

  const result = simMutation.data

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Input form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Entity Type</label>
          <Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. order" />
        </div>
        <div>
          <label style={labelStyle}>Rule Set Key</label>
          <Input value={ruleSetKey} onChange={(e) => setRuleSetKey(e.target.value)} placeholder="e.g. order.validation" />
        </div>
        <div>
          <label style={labelStyle}>Trigger</label>
          <Select
            value={triggerType}
            onChange={(e) => setTriggerType(e.target.value)}
            options={[
              { label: 'on_change', value: 'on_change' },
              { label: 'on_create', value: 'on_create' },
              { label: 'on_submit', value: 'on_submit' },
              { label: 'manual', value: 'manual' },
            ]}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Payload (JSON)</label>
        <textarea
          value={payloadStr}
          onChange={(e) => setPayloadStr(e.target.value)}
          style={{
            width: '100%', minHeight: 120, fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)', padding: 10, borderRadius: 6,
            border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
            color: 'var(--fg-primary)', resize: 'vertical',
          }}
        />
      </div>

      {parseError && <Banner variant="error" title={parseError} />}

      <Button
        variant="primary"
        icon={<Play size={14} />}
        onClick={handleRun}
        disabled={simMutation.isPending}
      >
        {simMutation.isPending ? 'Running...' : 'Run Simulation'}
      </Button>

      {/* Results */}
      {simMutation.isError && (
        <Banner variant="error" title="Simulation failed" message={(simMutation.error as Error).message} />
      )}

      {result && <SimulationResultView result={result} />}
    </div>
  )
}

function SimulationResultView({ result }: { result: SimulationResult }) {
  const [expandedTrace, setExpandedTrace] = useState<Set<number>>(new Set())
  const warnings = result.warnings ?? []
  const mutations = result.mutations ?? {}
  const firedRules = result.fired_rules ?? []
  const conflictLog = result.conflict_log ?? []
  const fieldBehaviors = result.field_behaviors ?? []
  const trace = result.trace ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {result.blocked ? (
          <Badge variant="error"><XCircle size={12} /> BLOCKED</Badge>
        ) : (
          <Badge variant="success"><CheckCircle size={12} /> Passed</Badge>
        )}
        <Badge variant="neutral">{firedRules.length} rules fired</Badge>
        <Badge variant="neutral">{Object.keys(mutations).length} mutations</Badge>
        {warnings.length > 0 && <Badge variant="warning">{warnings.length} warnings</Badge>}
        {conflictLog.length > 0 && <Badge variant="info">{conflictLog.length} conflicts</Badge>}
      </div>

      {result.blocked && result.block_message && (
        <Banner variant="error" title={result.block_message} />
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-200)', borderRadius: 6, padding: 10 }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--warning-700)', marginBottom: 4 }}>Warnings</div>
          {warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 'var(--text-xs)', color: 'var(--warning-700)' }}>• {w}</div>
          ))}
        </div>
      )}

      {/* Mutations */}
      {Object.keys(mutations).length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: 12, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>Mutations</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(mutations).map(([field, val]) => (
              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-600)' }}>{field}</span>
                <ArrowRight size={10} color="var(--fg-tertiary)" />
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>{JSON.stringify(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Log */}
      {conflictLog.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: 12, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>
            <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />Conflict Resolution
          </div>
          {conflictLog.map((c, i) => (
            <div key={i} style={{ fontSize: 'var(--text-xs)', padding: '4px 0', borderBottom: '1px solid var(--border-secondary)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-600)' }}>{c.field}</span>
              <span style={{ color: 'var(--fg-tertiary)', margin: '0 6px' }}>→</span>
              <span style={{ color: 'var(--fg-primary)' }}>{c.resolution}</span>
              <span style={{ color: 'var(--fg-tertiary)', marginLeft: 6 }}>(winner: {c.winner})</span>
            </div>
          ))}
        </div>
      )}

      {/* Execution Trace */}
      {trace.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: 12, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>
            <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />Execution Trace
          </div>
          {trace.map((t, i) => (
            <TraceRow
              key={i}
              trace={t}
              expanded={expandedTrace.has(i)}
              onToggle={() => {
                const next = new Set(expandedTrace)
                next.has(i) ? next.delete(i) : next.add(i)
                setExpandedTrace(next)
              }}
            />
          ))}
        </div>
      )}

      {/* Field Behaviors */}
      {fieldBehaviors.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: 12, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 8 }}>Field Behaviors</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {fieldBehaviors.map((item) => (
              <Badge key={`${item.field}:${item.behavior}`} variant={item.behavior === 'hidden' ? 'error' : item.behavior === 'readonly' ? 'warn' : 'gray'}>
                {item.field}: {item.behavior}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TraceRow({ trace, expanded, onToggle }: {
  trace: SimulationTrace; expanded: boolean; onToggle: () => void
}) {
  return (
    <div style={{ fontSize: 'var(--text-xs)', marginBottom: 4 }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 0' }}
      >
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Badge variant={trace.matched ? 'success' : 'gray'} style={{ fontSize: 9 }}>
          {trace.matched ? 'MATCH' : 'SKIP'}
        </Badge>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>{trace.rule_key}</span>
        {trace.row_id && (
          <span style={{ color: 'var(--fg-tertiary)', marginLeft: 'auto' }}>row: {trace.row_id}</span>
        )}
      </div>
      {expanded && (
        <div style={{ paddingLeft: 20, color: 'var(--fg-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
          conditionOk: {String(trace.condition_ok)}
          {trace.error && <div style={{ color: 'var(--error-600)' }}>error: {trace.error}</div>}
        </div>
      )}
    </div>
  )
}

// ─── Workflow Dry Run ──────────────────────────────────────────────────────────

function WorkflowDryRun() {
  const [entityType, setEntityType] = useState('')
  const [entityId, setEntityId] = useState('')
  const [event, setEvent] = useState('on_create')
  const [payloadStr, setPayloadStr] = useState('{}')
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<{ triggered: number } | null>(null)

  const dryRunMutation = useMutation({
    mutationFn: async (body: { eventType: string; entityType: string; entityId: string; payload?: Record<string, unknown> }) => {
      // Use publishWorkflowEvent as a dry-run trigger
      const { publishWorkflowEvent } = await import('../../../config/studioApi')
      return publishWorkflowEvent(body)
    },
    onSuccess: (data) => setResult(data),
  })

  const handleRun = () => {
    setParseError('')
    setResult(null)
    let payload: Record<string, unknown> | undefined
    try {
      const parsed = JSON.parse(payloadStr)
      if (Object.keys(parsed).length > 0) payload = parsed
    } catch {
      setParseError('Invalid JSON payload')
      return
    }
    if (!entityType.trim() || !entityId.trim()) {
      setParseError('Entity type and ID are required')
      return
    }
    dryRunMutation.mutate({ eventType: event, entityType, entityId, payload })
  }

  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Banner variant="info" title="Workflow Dry Run" message="Publishes an event to trigger matching workflow bindings. Instances will be created if bindings match." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle}>Entity Type</label>
          <Input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="e.g. order" />
        </div>
        <div>
          <label style={labelStyle}>Entity ID</label>
          <Input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="UUID" />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Event Type</label>
        <Select
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          options={[
            { label: 'on_create', value: 'on_create' },
            { label: 'on_update', value: 'on_update' },
            { label: 'on_status_change', value: 'on_status_change' },
            { label: 'on_field_change', value: 'on_field_change' },
            { label: 'manual', value: 'manual' },
          ]}
        />
      </div>

      <div>
        <label style={labelStyle}>Event Payload (JSON, optional)</label>
        <textarea
          value={payloadStr}
          onChange={(e) => setPayloadStr(e.target.value)}
          style={{
            width: '100%', minHeight: 80, fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)', padding: 10, borderRadius: 6,
            border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)',
            color: 'var(--fg-primary)', resize: 'vertical',
          }}
        />
      </div>

      {parseError && <Banner variant="error" title={parseError} />}

      <Button
        variant="primary"
        icon={<Play size={14} />}
        onClick={handleRun}
        disabled={dryRunMutation.isPending}
      >
        {dryRunMutation.isPending ? 'Triggering...' : 'Trigger Event'}
      </Button>

      {dryRunMutation.isError && (
        <Banner variant="error" title="Failed" message={(dryRunMutation.error as Error).message} />
      )}

      {result && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 6, padding: 16, border: '1px solid var(--border-primary)' }}>
          <Badge variant={result.triggered > 0 ? 'success' : 'gray'}>
            {result.triggered} workflow instance(s) triggered
          </Badge>
        </div>
      )}
    </div>
  )
}

// ─── Shared ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--fg-secondary)',
  display: 'block', marginBottom: 4,
}
