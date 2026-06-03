import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3, TrendingUp, TrendingDown, AlertTriangle, Zap, Shield, Clock,
} from 'lucide-react'
import { Badge, Spinner, Banner, Select } from '../../../design-system'
import {
  getRuleCoverage, getTopFiredRules, getDeadRules, getRuleExecutionStats,
  type RuleCoverageRow, type TopFiredRule, type DeadRule, type RuleExecStatBucket,
} from '../../../config/studioApi'

export function RuleCoverageDashboard() {
  const [days, setDays] = useState(30)

  const { data: coverage, isLoading: loadingCov } = useQuery({
    queryKey: ['rule-coverage', days],
    queryFn: () => getRuleCoverage({ days }),
  })

  const { data: topFired, isLoading: loadingTop } = useQuery({
    queryKey: ['top-fired-rules', days],
    queryFn: () => getTopFiredRules({ days, limit: 15 }),
  })

  const { data: deadRules, isLoading: loadingDead } = useQuery({
    queryKey: ['dead-rules', days],
    queryFn: () => getDeadRules({ days }),
  })

  const { data: stats } = useQuery({
    queryKey: ['rule-exec-stats', Math.min(days, 7)],
    queryFn: () => getRuleExecutionStats({ days: Math.min(days, 7) }),
  })

  const isLoading = loadingCov || loadingTop || loadingDead

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>

  const coverageItems = coverage?.items ?? []
  const topItems = topFired?.items ?? []
  const deadItems = deadRules?.items ?? []
  const statBuckets = stats?.items ?? []

  // Aggregate stats
  const totalExecs = coverageItems.reduce((s, c) => s + c.total_executions, 0)
  const totalBlocked = coverageItems.reduce((s, c) => s + c.blocked_count, 0)
  const avgMs = coverageItems.length > 0
    ? coverageItems.reduce((s, c) => s + c.avg_execution_ms, 0) / coverageItems.length
    : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 20, overflow: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)' }}>
          Rule Coverage Analysis
        </h2>
        <Select
          value={String(days)}
          onChange={(v) => setDays(Number(v))}
          options={[
            { label: 'Last 7 days', value: '7' },
            { label: 'Last 14 days', value: '14' },
            { label: 'Last 30 days', value: '30' },
            { label: 'Last 90 days', value: '90' },
          ]}
          style={{ width: 160 }}
        />
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <MetricCard icon={<Zap size={18} />} label="Total Executions" value={totalExecs.toLocaleString()} color="var(--brand-500)" />
        <MetricCard icon={<Shield size={18} />} label="Blocked" value={totalBlocked.toLocaleString()} color="var(--error-500)" />
        <MetricCard icon={<Clock size={18} />} label="Avg Latency" value={`${avgMs.toFixed(1)}ms`} color="var(--warning-500)" />
        <MetricCard icon={<AlertTriangle size={18} />} label="Dead Rules" value={String(deadItems.length)} color="var(--neutral-500)" />
        <MetricCard icon={<TrendingUp size={18} />} label="Active Rule Sets" value={String(coverageItems.reduce((s, c) => s + c.total_rule_sets, 0))} color="var(--success-500)" />
      </div>

      {/* Execution Sparkline */}
      {statBuckets.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12 }}>
            Execution Volume (Hourly)
          </div>
          <SparkBar buckets={statBuckets} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Per-Entity Coverage */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12 }}>
            Coverage by Entity Type
          </div>
          {coverageItems.length === 0 ? (
            <div style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No data in this window</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {coverageItems.map((row) => (
                <CoverageBar key={row.entity_type} row={row} />
              ))}
            </div>
          )}
        </div>

        {/* Top Fired Rules */}
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={14} /> Top Fired Rules
          </div>
          {topItems.length === 0 ? (
            <div style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)' }}>No rules fired in this window</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflow: 'auto' }}>
              {topItems.map((rule, i) => (
                <TopRuleRow key={`${rule.rule_key}-${rule.entity_type}`} rule={rule} rank={i + 1} maxCount={topItems[0]?.fire_count ?? 1} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dead Rules */}
      {deadItems.length > 0 && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: 16, border: '1px solid var(--border-primary)' }}>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} color="var(--warning-500)" /> Dead Rules (not fired in {days} days)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {deadItems.map((d) => (
              <Badge key={`${d.rule_key}-${d.entity_type}`} variant="warning">
                {d.entity_type}/{d.rule_key}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: 8, padding: '14px 16px',
      border: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ color, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--fg-primary)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>{label}</div>
      </div>
    </div>
  )
}

function CoverageBar({ row }: { row: RuleCoverageRow }) {
  const coveragePct = row.total_rule_sets > 0
    ? Math.min(100, (row.fired_rule_count / row.total_rule_sets) * 100)
    : 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', marginBottom: 4 }}>
        <span style={{ fontWeight: 600 }}>{row.entity_type}</span>
        <span>{row.fired_rule_count}/{row.total_rule_sets} rules fired · {row.total_executions} execs</span>
      </div>
      <div style={{ height: 6, background: 'var(--neutral-200)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 3, transition: 'width 0.3s',
          width: `${coveragePct}%`,
          background: coveragePct > 80 ? 'var(--success-500)' : coveragePct > 50 ? 'var(--warning-500)' : 'var(--error-500)',
        }} />
      </div>
    </div>
  )
}

function TopRuleRow({ rule, rank, maxCount }: { rule: TopFiredRule; rank: number; maxCount: number }) {
  const pct = (rule.fire_count / maxCount) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)' }}>
      <span style={{ color: 'var(--fg-tertiary)', width: 20, textAlign: 'right' }}>#{rank}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {rule.rule_key}
          </span>
          <span style={{ color: 'var(--fg-tertiary)', flexShrink: 0, marginLeft: 8 }}>{rule.fire_count}x</span>
        </div>
        <div style={{ height: 3, background: 'var(--neutral-200)', borderRadius: 2 }}>
          <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: 'var(--brand-400)' }} />
        </div>
      </div>
    </div>
  )
}

function SparkBar({ buckets }: { buckets: RuleExecStatBucket[] }) {
  const max = Math.max(...buckets.map((b) => b.total), 1)
  const barCount = Math.min(buckets.length, 72) // show last 72 hours max
  const visible = buckets.slice(-barCount)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 48 }}>
      {visible.map((b, i) => {
        const h = (b.total / max) * 100
        const blockedPct = b.total > 0 ? (b.blocked / b.total) * 100 : 0
        return (
          <div
            key={i}
            title={`${new Date(b.bucket).toLocaleString()}: ${b.total} execs, ${b.blocked} blocked`}
            style={{
              flex: 1, minWidth: 2, borderRadius: '2px 2px 0 0',
              height: `${Math.max(h, 2)}%`,
              background: blockedPct > 50 ? 'var(--error-400)' : 'var(--brand-400)',
              opacity: 0.8,
            }}
          />
        )
      })}
    </div>
  )
}
