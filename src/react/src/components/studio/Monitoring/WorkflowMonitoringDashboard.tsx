import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity, CheckCircle, XCircle, AlertTriangle, Clock, Pause, BarChart3,
} from 'lucide-react'
import { Badge, Spinner, Select } from '../../../design-system'
import {
  getWorkflowHealth, getWorkflowStepMetrics, getWorkflowSLABreaches,
  type WorkflowStepMetric, type SLABreach,
} from '../../../config/studioApi'

export function WorkflowMonitoringDashboard() {
  const [days, setDays] = useState(7)

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['workflow-health', days],
    queryFn: () => getWorkflowHealth({ days }),
  })

  const { data: stepMetrics, isLoading: loadingSteps } = useQuery({
    queryKey: ['workflow-step-metrics', days],
    queryFn: () => getWorkflowStepMetrics({ days }),
  })

  const { data: slaData } = useQuery({
    queryKey: ['workflow-sla-breaches'],
    queryFn: () => getWorkflowSLABreaches({ limit: 10 }),
  })

  const isLoading = loadingHealth || loadingSteps

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>

  const metrics = health ?? {
    active_instances: 0, completed_instances: 0, failed_instances: 0,
    aborted_instances: 0, waiting_instances: 0, total_instances: 0,
    avg_duration_ms: 0, failure_rate: 0,
  }
  const steps = stepMetrics?.items ?? []
  const breaches = slaData?.items ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
          Workflow Monitoring
        </h2>
        <Select
          value={String(days)}
          onChange={(v) => setDays(Number(v))}
          options={[
            { label: 'Last 24 hours', value: '1' },
            { label: 'Last 7 days', value: '7' },
            { label: 'Last 14 days', value: '14' },
            { label: 'Last 30 days', value: '30' },
          ]}
          style={{ width: 160 }}
        />
      </div>

      {/* Instance Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
        <StatusCard icon={<Activity size={18} />} label="Active" value={metrics.active_instances} color="var(--brand-500)" />
        <StatusCard icon={<Pause size={18} />} label="Waiting" value={metrics.waiting_instances} color="var(--warning-500)" />
        <StatusCard icon={<CheckCircle size={18} />} label="Completed" value={metrics.completed_instances} color="var(--success-500)" />
        <StatusCard icon={<XCircle size={18} />} label="Failed" value={metrics.failed_instances} color="var(--error-500)" />
        <StatusCard icon={<AlertTriangle size={18} />} label="Aborted" value={metrics.aborted_instances} color="var(--neutral-500)" />
      </div>

      {/* Health Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <HealthGauge
          label="Failure Rate"
          value={metrics.failure_rate * 100}
          unit="%"
          thresholds={{ warn: 5, danger: 15 }}
        />
        <HealthGauge
          label="Avg Duration"
          value={metrics.avg_duration_ms / 1000}
          unit="s"
          thresholds={{ warn: 30, danger: 120 }}
        />
        <HealthGauge
          label="SLA Breaches"
          value={breaches.length}
          unit=""
          thresholds={{ warn: 1, danger: 5 }}
        />
      </div>

      {/* Step Performance Table */}
      {steps.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={14} /> Step Performance Metrics
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th style={thStyle}>Step Type</th>
                  <th style={thStyle}>Executions</th>
                  <th style={thStyle}>Success Rate</th>
                  <th style={thStyle}>Avg Duration</th>
                  <th style={thStyle}>P95 Duration</th>
                  <th style={thStyle}>Max Duration</th>
                </tr>
              </thead>
              <tbody>
                {steps.map((s) => (
                  <StepRow key={s.step_type} metric={s} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLA Breaches */}
      {breaches.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--error-600)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} /> Active SLA Breaches
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {breaches.map((b) => (
              <SLABreachRow key={b.instance_id} breach={b} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  textAlign: 'left', padding: '8px 12px', color: 'var(--fg-tertiary)', fontWeight: 500,
}
const tdStyle: React.CSSProperties = {
  padding: '8px 12px', borderBottom: '1px solid var(--border-secondary)', color: 'var(--fg-primary)',
}

function StatusCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: 8, padding: '14px 16px',
      border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--fg-primary)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{label}</div>
      </div>
    </div>
  )
}

function HealthGauge({ label, value, unit, thresholds }: {
  label: string; value: number; unit: string; thresholds: { warn: number; danger: number }
}) {
  const color = value >= thresholds.danger ? 'var(--error-500)'
    : value >= thresholds.warn ? 'var(--warning-500)'
    : 'var(--success-500)'

  return (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: 8, padding: '16px',
      border: '1px solid var(--border-primary)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color, lineHeight: 1.2 }}>
        {value < 10 ? value.toFixed(1) : Math.round(value)}{unit}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', marginTop: 4 }}>{label}</div>
    </div>
  )
}

function StepRow({ metric }: { metric: WorkflowStepMetric }) {
  const successRate = metric.total_executions > 0
    ? ((metric.completed / metric.total_executions) * 100)
    : 0
  const rateColor = successRate >= 95 ? 'var(--success-600)' : successRate >= 80 ? 'var(--warning-600)' : 'var(--error-600)'

  return (
    <tr>
      <td style={tdStyle}>
        <Badge variant="neutral">{metric.step_type}</Badge>
      </td>
      <td style={tdStyle}>{metric.total_executions}</td>
      <td style={{ ...tdStyle, color: rateColor, fontWeight: 600 }}>{successRate.toFixed(1)}%</td>
      <td style={tdStyle}>{formatDuration(metric.avg_duration_ms)}</td>
      <td style={tdStyle}>{formatDuration(metric.p95_duration_ms)}</td>
      <td style={tdStyle}>{formatDuration(metric.max_duration_ms)}</td>
    </tr>
  )
}

function SLABreachRow({ breach }: { breach: SLABreach }) {
  const elapsed = breach.elapsed_ms / 1000
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 'var(--text-xs)', padding: '6px 0', borderBottom: '1px solid var(--border-secondary)' }}>
      <Clock size={12} color="var(--error-500)" />
      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)' }}>
        {breach.instance_id.slice(0, 8)}…
      </span>
      <Badge variant="neutral">{breach.entity_type}</Badge>
      <Badge variant={breach.status === 'running' ? 'info' : 'warn'}>{breach.status}</Badge>
      <span style={{ marginLeft: 'auto', color: 'var(--error-600)', fontWeight: 600 }}>
        {elapsed > 3600 ? `${(elapsed / 3600).toFixed(1)}h` : `${(elapsed / 60).toFixed(0)}m`} overdue
      </span>
    </div>
  )
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60000).toFixed(1)}m`
}
