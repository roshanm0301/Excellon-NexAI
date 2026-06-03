import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Play, AlertTriangle, XCircle, CheckCircle, Activity } from 'lucide-react'
import { Button, Badge, Spinner, Banner } from '../../../design-system'
import { simulateRules, type SimulationResult } from '../../../config/studioApi'

interface RuleSimulatorProps {
  entityType: string
}

export function RuleSimulator({ entityType }: RuleSimulatorProps) {
  const [payload, setPayload] = useState('{\n  \n}')
  const [triggerType, setTriggerType] = useState('on_create')

  const mutation = useMutation({
    mutationFn: () => {
      const parsed = JSON.parse(payload)
      return simulateRules({ entity_type: entityType, trigger_type: triggerType, payload: parsed })
    },
  })

  const result = mutation.data as SimulationResult | undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Input area */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)' }}>
              Payload (JSON)
            </label>
            <select
              style={{
                marginLeft: 'auto', height: 28, padding: '0 24px 0 8px',
                border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-primary)', color: 'var(--fg-primary)',
                fontSize: 'var(--text-xs)', appearance: 'none',
              }}
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value)}
            >
              <option value="on_create">on_create</option>
              <option value="on_update">on_update</option>
              <option value="on_delete">on_delete</option>
              <option value="on_status_change">on_status_change</option>
            </select>
          </div>
          <textarea
            style={{
              width: '100%', minHeight: 200, padding: 12,
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-sm)', resize: 'vertical', boxSizing: 'border-box',
            }}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            spellCheck={false}
          />
          <Button
            variant="primary"
            size="sm"
            icon={mutation.isPending ? <Spinner /> : <Play size={14} />}
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Run Simulation
          </Button>
          {mutation.isError && (
            <Banner variant="error" title={mutation.error instanceof SyntaxError ? 'Invalid JSON in payload' : String(mutation.error)} />
          )}
        </div>

        {/* Results panel */}
        {result && (
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SimulationResults result={result} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Results Display ──────────────────────────────────────────────────────────

function SimulationResults({ result }: { result: SimulationResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Status banner */}
      {result.blocked ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 'var(--radius-lg)',
          background: 'var(--error-50)', border: '1px solid var(--error-200)',
          color: 'var(--error-700)', fontSize: 'var(--text-sm)', fontWeight: 600,
        }}>
          <XCircle size={16} /> BLOCKED: {result.blockMessage}
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 'var(--radius-lg)',
          background: 'var(--success-50)', border: '1px solid var(--success-200)',
          color: 'var(--success-700)', fontSize: 'var(--text-sm)', fontWeight: 600,
        }}>
          <CheckCircle size={16} /> ALLOWED — {result.firedRules.length} rule(s) fired
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Section title="Warnings" icon={<AlertTriangle size={14} />} color="var(--warning-600)">
          {result.warnings.map((w, i) => (
            <div key={i} style={{
              padding: '6px 10px', background: 'var(--warning-50)',
              border: '1px solid var(--warning-200)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: 'var(--warning-700)',
            }}>
              {w}
            </div>
          ))}
        </Section>
      )}

      {/* Mutations */}
      {Object.keys(result.mutations).length > 0 && (
        <Section title="Field Mutations" icon={<Activity size={14} />} color="var(--brand-600)">
          <div style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px',
            fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
          }}>
            {Object.entries(result.mutations).map(([field, value]) => (
              <Fragment key={field}>
                <span style={{ color: 'var(--fg-secondary)', fontWeight: 600 }}>{field}:</span>
                <span style={{ color: 'var(--brand-600)' }}>{JSON.stringify(value)}</span>
              </Fragment>
            ))}
          </div>
        </Section>
      )}

      {/* Field Behaviors */}
      {Object.keys(result.fieldBehaviors).length > 0 && (
        <Section title="Field Behaviors" icon={<Activity size={14} />} color="var(--fg-secondary)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(result.fieldBehaviors).map(([field, behavior]) => (
              <Badge key={field} variant="gray">
                {field}: {behavior}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {/* Approval Requests */}
      {result.approvalRequests.length > 0 && (
        <Section title="Approval Required" icon={<AlertTriangle size={14} />} color="var(--warning-600)">
          {result.approvalRequests.map((a, i) => (
            <div key={i} style={{
              padding: '6px 10px', background: 'var(--warning-50)',
              border: '1px solid var(--warning-200)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
            }}>
              <strong>{a.category}</strong>: {a.reason} (approver: {a.approverRole})
            </div>
          ))}
        </Section>
      )}

      {/* Conflict Log */}
      {result.conflictLog.length > 0 && (
        <Section title="Conflict Resolution" icon={<Activity size={14} />} color="var(--fg-secondary)">
          <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
            {result.conflictLog.map((c, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--border-secondary)' }}>
                <span style={{ color: 'var(--fg-secondary)' }}>{c.field}</span>
                {' → '}
                <span style={{ color: 'var(--brand-600)' }}>{c.resolution}</span>
                {' (winner: '}
                <span style={{ fontWeight: 600 }}>{c.winner}</span>{')'}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Trace */}
      {result.trace.length > 0 && (
        <Section title="Execution Trace" icon={<Activity size={14} />} color="var(--fg-tertiary)">
          <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', maxHeight: 200, overflowY: 'auto' }}>
            {result.trace.map((t, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, padding: '3px 0',
                borderBottom: '1px solid var(--border-secondary)',
                opacity: t.matched ? 1 : 0.6,
              }}>
                <span style={{ color: t.matched ? 'var(--success-600)' : 'var(--fg-tertiary)', minWidth: 12 }}>
                  {t.matched ? '✓' : '✗'}
                </span>
                <span style={{ color: 'var(--fg-primary)' }}>{t.ruleKey}</span>
                {t.rowId && <span style={{ color: 'var(--fg-tertiary)' }}>row:{t.rowId}</span>}
                {t.error && <span style={{ color: 'var(--error-500)' }}>ERR: {t.error}</span>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

import { Fragment, type ReactNode } from 'react'

function Section({ title, icon, color, children }: { title: string; icon: ReactNode; color: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontWeight: 600, fontSize: 'var(--text-xs)', textTransform: 'uppercase' }}>
        {icon} {title}
      </div>
      {children}
    </div>
  )
}
