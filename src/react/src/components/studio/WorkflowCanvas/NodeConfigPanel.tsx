import { useState } from 'react'
import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button, Toggle, Badge } from '../../../design-system'
import type {
  StepType, ApprovalConfig, ApprovalMode, ApprovalPolicy,
  ServiceCallConfig, ScriptConfig, WaitConfig, SubWorkflowConfig,
  RuleEvalConfig, ApproverDef, EscalationConfig,
} from '../../../config/studioApi'
import type { WorkflowNodeData } from './WorkflowNodes'

interface NodeConfigPanelProps {
  node: WorkflowNodeData & { id: string }
  onUpdate: (id: string, data: Partial<WorkflowNodeData>) => void
  onClose: () => void
  onDelete: (id: string) => void
}

export function NodeConfigPanel({ node, onUpdate, onClose, onDelete }: NodeConfigPanelProps) {
  const update = (changes: Partial<WorkflowNodeData>) => onUpdate(node.id, changes)
  const updateConfig = (key: string, value: unknown) => {
    update({ config: { ...(node.config ?? {}), [key]: value } })
  }

  return (
    <div style={{
      width: 340, borderLeft: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)', overflow: 'auto',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <h3 style={{ flex: 1, margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--fg-primary)' }}>
          Configure Node
        </h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-tertiary)', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        {/* Common fields */}
        <Field label="Name">
          <input
            style={inputStyle}
            value={node.label}
            onChange={(e) => update({ label: e.target.value })}
          />
        </Field>

        <Field label="Timeout (minutes)">
          <input
            type="number"
            style={{ ...inputStyle, width: 100 }}
            value={node.timeoutMins ?? 0}
            onChange={(e) => update({ timeoutMins: parseInt(e.target.value) || 0 })}
            min={0}
          />
        </Field>

        <Field label="Retry Count">
          <input
            type="number"
            style={{ ...inputStyle, width: 100 }}
            value={node.retryCount ?? 0}
            onChange={(e) => update({ retryCount: parseInt(e.target.value) || 0 })}
            min={0}
            max={10}
          />
        </Field>

        {/* Type-specific config */}
        {node.stepType === 'approval' && (
          <ApprovalConfigPanel
            config={(node.config as ApprovalConfig | undefined) ?? { mode: 'sequential', policy: 'unanimous', approvers: [] }}
            onChange={(cfg) => update({ config: cfg as unknown as Record<string, unknown> })}
          />
        )}
        {node.stepType === 'service_call' && (
          <ServiceCallConfigPanel
            config={(node.config as unknown as ServiceCallConfig | undefined) ?? { serviceKey: '', method: '' }}
            onChange={(cfg) => update({ config: cfg as unknown as Record<string, unknown> })}
          />
        )}
        {node.stepType === 'script' && (
          <ScriptConfigPanel
            config={(node.config as unknown as ScriptConfig | undefined) ?? { expression: '', outputVar: '' }}
            onChange={(cfg) => update({ config: cfg as unknown as Record<string, unknown> })}
          />
        )}
        {node.stepType === 'wait' && (
          <WaitConfigPanel
            config={(node.config as unknown as WaitConfig | undefined) ?? {}}
            onChange={(cfg) => update({ config: cfg as unknown as Record<string, unknown> })}
          />
        )}
        {node.stepType === 'sub_workflow' && (
          <SubWorkflowConfigPanel
            config={(node.config as unknown as SubWorkflowConfig | undefined) ?? { definitionId: '' }}
            onChange={(cfg) => update({ config: cfg as unknown as Record<string, unknown> })}
          />
        )}
        {node.stepType === 'rule_evaluation' && (
          <RuleEvalConfigPanel
            config={(node.config as unknown as RuleEvalConfig | undefined) ?? { entityType: '' }}
            onChange={(cfg) => update({ config: cfg as unknown as Record<string, unknown> })}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--border-primary)',
        display: 'flex', justifyContent: 'flex-end',
      }}>
        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} onClick={() => onDelete(node.id)} style={{ color: 'var(--error-600)' }}>
          Delete Node
        </Button>
      </div>
    </div>
  )
}

// ─── Approval Config ──────────────────────────────────────────────────────────

function ApprovalConfigPanel({ config, onChange }: { config: ApprovalConfig; onChange: (c: ApprovalConfig) => void }) {
  const addApprover = () => {
    onChange({ ...config, approvers: [...config.approvers, { type: 'role', value: '', order: config.approvers.length + 1 }] })
  }
  const updateApprover = (i: number, updates: Partial<ApproverDef>) => {
    const approvers = [...config.approvers]
    approvers[i] = { ...approvers[i], ...updates }
    onChange({ ...config, approvers })
  }
  const removeApprover = (i: number) => {
    onChange({ ...config, approvers: config.approvers.filter((_, idx) => idx !== i) })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Approval Settings" />

      <Field label="Mode">
        <select style={selectStyle} value={config.mode} onChange={(e) => onChange({ ...config, mode: e.target.value as ApprovalMode })}>
          <option value="sequential">Sequential — one after another</option>
          <option value="parallel">Parallel — all at once</option>
        </select>
      </Field>

      <Field label="Policy">
        <select style={selectStyle} value={config.policy} onChange={(e) => onChange({ ...config, policy: e.target.value as ApprovalPolicy })}>
          <option value="unanimous">Unanimous — all must approve</option>
          <option value="majority">Majority — &gt;50% approve</option>
          <option value="any">Any — first approval wins</option>
        </select>
      </Field>

      <Field label="Approvers">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {config.approvers.map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <GripVertical size={12} style={{ color: 'var(--fg-tertiary)', flexShrink: 0 }} />
              <select
                style={{ ...selectStyle, flex: '0 0 80px' }}
                value={a.type}
                onChange={(e) => updateApprover(i, { type: e.target.value as 'role' | 'user' | 'expression' })}
              >
                <option value="role">Role</option>
                <option value="user">User</option>
                <option value="expression">Expr</option>
              </select>
              <input
                style={{ ...inputStyle, flex: 1 }}
                placeholder={a.type === 'expression' ? 'JSONata expr' : a.type === 'user' ? 'User ID' : 'Role name'}
                value={a.value}
                onChange={(e) => updateApprover(i, { value: e.target.value })}
              />
              <button onClick={() => removeApprover(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 2 }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={addApprover}>Add Approver</Button>
        </div>
      </Field>

      {/* Escalation */}
      <EscalationPanel
        escalation={config.escalation}
        onChange={(esc) => onChange({ ...config, escalation: esc })}
      />
    </div>
  )
}

function EscalationPanel({ escalation, onChange }: { escalation?: EscalationConfig; onChange: (e?: EscalationConfig) => void }) {
  const enabled = !!escalation
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-secondary)' }}>Escalation</span>
        <Toggle
          checked={enabled}
          onChange={(v) => onChange(v ? { timeoutMins: 60, escalateTo: '' } : undefined)}
          size="sm"
        />
      </div>
      {escalation && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 8, borderLeft: '2px solid var(--warning-200)' }}>
          <Field label="Timeout (min)">
            <input type="number" style={{ ...inputStyle, width: 80 }} value={escalation.timeoutMins} onChange={(e) => onChange({ ...escalation, timeoutMins: parseInt(e.target.value) || 60 })} min={1} />
          </Field>
          <Field label="Escalate to">
            <input style={inputStyle} placeholder="Role or user" value={escalation.escalateTo} onChange={(e) => onChange({ ...escalation, escalateTo: e.target.value })} />
          </Field>
          <Field label="Auto-decision on final timeout">
            <select style={selectStyle} value={escalation.autoDecision ?? ''} onChange={(e) => onChange({ ...escalation, autoDecision: e.target.value as 'approve' | 'reject' | undefined || undefined })}>
              <option value="">None</option>
              <option value="approve">Auto-Approve</option>
              <option value="reject">Auto-Reject</option>
            </select>
          </Field>
        </div>
      )}
    </div>
  )
}

// ─── Service Call Config ──────────────────────────────────────────────────────

function ServiceCallConfigPanel({ config, onChange }: { config: ServiceCallConfig; onChange: (c: ServiceCallConfig) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Service Call Settings" />
      <Field label="Service Key">
        <input style={inputStyle} placeholder="e.g. notification, email, webhook" value={config.serviceKey} onChange={(e) => onChange({ ...config, serviceKey: e.target.value })} />
      </Field>
      <Field label="Method">
        <input style={inputStyle} placeholder="e.g. send, create, validate" value={config.method} onChange={(e) => onChange({ ...config, method: e.target.value })} />
      </Field>
      <Field label="Input Expression (JSONata)">
        <textarea
          style={{ ...inputStyle, height: 60, resize: 'vertical', fontFamily: 'var(--font-mono)' }}
          placeholder={'{ "to": $.assignee, "subject": $.name }'}
          value={config.inputExpr ?? ''}
          onChange={(e) => onChange({ ...config, inputExpr: e.target.value })}
        />
      </Field>
      <Field label="Output Mapping (field → variable)">
        <OutputMapEditor
          outputMap={config.outputMap ?? {}}
          onChange={(m) => onChange({ ...config, outputMap: m })}
        />
      </Field>
    </div>
  )
}

// ─── Script Config ────────────────────────────────────────────────────────────

function ScriptConfigPanel({ config, onChange }: { config: ScriptConfig; onChange: (c: ScriptConfig) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Script Settings" />
      <Field label="JSONata Expression">
        <textarea
          style={{ ...inputStyle, height: 100, resize: 'vertical', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
          placeholder={'$sum(items.amount)'}
          value={config.expression}
          onChange={(e) => onChange({ ...config, expression: e.target.value })}
        />
      </Field>
      <Field label="Output Variable">
        <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder="e.g. totalAmount" value={config.outputVar} onChange={(e) => onChange({ ...config, outputVar: e.target.value })} />
      </Field>
    </div>
  )
}

// ─── Wait Config ──────────────────────────────────────────────────────────────

function WaitConfigPanel({ config, onChange }: { config: WaitConfig; onChange: (c: WaitConfig) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Wait / Timer Settings" />
      <Field label="Duration (minutes)">
        <input type="number" style={{ ...inputStyle, width: 100 }} value={config.durationMins ?? 0} onChange={(e) => onChange({ ...config, durationMins: parseInt(e.target.value) || undefined })} min={0} />
      </Field>
      <Field label="Wait for Event">
        <input style={inputStyle} placeholder="Event name (e.g. payment_received)" value={config.untilEvent ?? ''} onChange={(e) => onChange({ ...config, untilEvent: e.target.value || undefined })} />
      </Field>
      <Field label="Resume Condition (JSONata)">
        <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder='$.status = "approved"' value={config.untilExpr ?? ''} onChange={(e) => onChange({ ...config, untilExpr: e.target.value || undefined })} />
      </Field>
    </div>
  )
}

// ─── Sub-Workflow Config ──────────────────────────────────────────────────────

function SubWorkflowConfigPanel({ config, onChange }: { config: SubWorkflowConfig; onChange: (c: SubWorkflowConfig) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Sub-Workflow Settings" />
      <Field label="Definition ID">
        <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder="UUID of the sub-workflow definition" value={config.definitionId} onChange={(e) => onChange({ ...config, definitionId: e.target.value })} />
      </Field>
    </div>
  )
}

// ─── Rule Evaluation Config ──────────────────────────────────────────────────

function RuleEvalConfigPanel({ config, onChange }: { config: RuleEvalConfig; onChange: (c: RuleEvalConfig) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionTitle title="Rule Evaluation Settings" />
      <Field label="Entity Type">
        <input style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }} placeholder="e.g. order, invoice" value={config.entityType} onChange={(e) => onChange({ ...config, entityType: e.target.value })} />
      </Field>
      <Field label="Trigger Type">
        <select style={selectStyle} value={config.triggerType ?? 'on_create'} onChange={(e) => onChange({ ...config, triggerType: e.target.value })}>
          <option value="on_create">on_create</option>
          <option value="on_update">on_update</option>
          <option value="on_status_change">on_status_change</option>
        </select>
      </Field>
    </div>
  )
}

// ─── Output Map Editor ────────────────────────────────────────────────────────

function OutputMapEditor({ outputMap, onChange }: { outputMap: Record<string, string>; onChange: (m: Record<string, string>) => void }) {
  const entries = Object.entries(outputMap)
  const add = () => onChange({ ...outputMap, '': '' })
  const remove = (key: string) => {
    const m = { ...outputMap }
    delete m[key]
    onChange(m)
  }
  const update = (oldKey: string, newKey: string, val: string) => {
    const m = { ...outputMap }
    if (oldKey !== newKey) delete m[oldKey]
    m[newKey] = val
    onChange(m)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {entries.map(([key, val]) => (
        <div key={key} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} placeholder="response.field" value={key} onChange={(e) => update(key, e.target.value, val)} />
          <span style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-xs)' }}>→</span>
          <input style={{ ...inputStyle, flex: 1, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} placeholder="variable" value={val} onChange={(e) => update(key, key, e.target.value)} />
          <button onClick={() => remove(key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 2 }}><Trash2 size={11} /></button>
        </div>
      ))}
      <Button variant="ghost" size="sm" icon={<Plus size={11} />} onClick={add}>Add Mapping</Button>
    </div>
  )
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--fg-tertiary)', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-secondary)', paddingBottom: 4 }}>
      {title}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 32, padding: '0 10px',
  border: '1px solid var(--border-primary)',
  borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)',
  color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'none', paddingRight: 28,
}
