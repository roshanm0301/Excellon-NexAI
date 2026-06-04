import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save, Code2, Eye } from 'lucide-react'
import Editor from '@monaco-editor/react'
import {
  Button, TabGroup, Spinner, Banner, Badge, useToast, Toggle,
} from '../../design-system'
import {
  getRuleSetV2, saveRuleSetV2,
  type RuleSetV2, type RuleCategory,
} from '../../config/studioApi'
import {
  DecisionTableEditor, createBlankDecisionTable,
  DecisionGraphEditor, createBlankDecisionGraph,
  ConditionTreeBuilder, createBlankConditionTree,
  ConflictMatrixPanel, RuleSimulator, ActionsEditor,
} from '../../components/studio/RuleEngine'

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS: { value: RuleCategory; label: string; color: string }[] = [
  { value: 'Validation', label: 'Validation', color: 'var(--error-500)' },
  { value: 'Approval', label: 'Approval', color: 'var(--warning-500)' },
  { value: 'Pricing', label: 'Pricing', color: 'var(--brand-500)' },
  { value: 'ChargeDiscount', label: 'Charge / Discount', color: 'var(--brand-500)' },
  { value: 'Taxation', label: 'Taxation', color: 'var(--error-500)' },
  { value: 'Accounting', label: 'Accounting', color: 'var(--error-500)' },
  { value: 'BusinessProcess', label: 'Business Process', color: 'var(--success-500)' },
  { value: 'Eligibility', label: 'Eligibility', color: 'var(--neutral-500)' },
  { value: 'FieldBehavior', label: 'Field Behavior', color: 'var(--success-500)' },
  { value: 'DerivationCalculation', label: 'Derivation / Calculation', color: 'var(--brand-500)' },
]

// ─── Page Component ───────────────────────────────────────────────────────────

export default function RuleEditorPageV2() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [jsonMode, setJsonMode] = useState(false)
  const [activeTab, setActiveTab] = useState('conditions')

  // Server state
  const { data: ruleSet, isLoading, error } = useQuery({
    queryKey: ['rule-set-v2', id],
    queryFn: () => getRuleSetV2(id!),
    enabled: !!id,
  })

  // Local editor state
  const [localRule, setLocalRule] = useState<RuleSetV2 | null>(null)
  const rule = localRule ?? ruleSet ?? null

  // Initialize local state when data loads
  const initLocal = useCallback((data: RuleSetV2) => {
    if (!localRule) setLocalRule(data)
  }, [localRule])

  if (ruleSet && !localRule) initLocal(ruleSet)

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!rule || !id) throw new Error('No rule to save')
      return saveRuleSetV2(id, rule)
    },
    onSuccess: () => {
      toast('success', 'Rule saved')
      queryClient.invalidateQueries({ queryKey: ['rule-set-v2', id] })
    },
    onError: (err) => {
      toast('error', 'Save failed', String(err))
    },
  })

  // Update helpers
  const updateRule = (updates: Partial<RuleSetV2>) => {
    if (!rule) return
    setLocalRule({ ...rule, ...updates })
  }

  const setCategory = (category: RuleCategory) => updateRule({ rule_category: category, classifications: [category] })

  // ─── Loading / Error states ─────────────────────────────────────────────────

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
  if (error) return <Banner variant="error" title="Failed to load rule set" />
  if (!rule) return <Banner variant="error" title="Rule not found" />

  // ─── JSON mode ──────────────────────────────────────────────────────────────

  if (jsonMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header rule={rule} onBack={() => navigate(-1)} onSave={() => saveMutation.mutate()} saving={saveMutation.isPending}>
          <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setJsonMode(false)}>
            Visual Mode
          </Button>
        </Header>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Editor
            height="100%"
            language="json"
            theme="vs-dark"
            value={JSON.stringify(rule, null, 2)}
            onChange={(val) => {
              try { if (val) setLocalRule(JSON.parse(val)) } catch { /* ignore parse errors while editing */ }
            }}
            options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', wordWrap: 'on' }}
          />
        </div>
      </div>
    )
  }

  // ─── Visual mode ────────────────────────────────────────────────────────────

  const tabs = [
    { id: 'conditions', label: rule.content_type === 'decision_table' ? 'Decision Table' : rule.content_type === 'decision_graph' ? 'Decision Graph' : 'Conditions' },
    { id: 'actions', label: 'Actions' },
    { id: 'conflicts', label: 'Conflicts' },
    { id: 'simulator', label: 'Simulator' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Header rule={rule} onBack={() => navigate(-1)} onSave={() => saveMutation.mutate()} saving={saveMutation.isPending}>
        <Button variant="ghost" size="sm" icon={<Code2 size={14} />} onClick={() => setJsonMode(true)}>
          JSON Mode
        </Button>
      </Header>

      {/* Metadata bar */}
      <div style={{
        padding: '12px 24px', borderBottom: '1px solid var(--border-primary)',
        display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg-secondary)',
      }}>
        {/* Name + entity type row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <input
            style={{
              flex: '1 1 300px', height: 36, padding: '0 12px',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-primary)', color: 'var(--fg-primary)',
              fontSize: 'var(--text-base)', fontWeight: 600, boxSizing: 'border-box',
            }}
            value={rule.name}
            onChange={(e) => updateRule({ name: e.target.value })}
          />
          <Badge variant="gray">{rule.entity_type}</Badge>
          <Badge variant="info">{rule.content_type}</Badge>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)' }}>Enabled</span>
            <Toggle checked={rule.enabled} onChange={(v) => updateRule({ enabled: v })} />
          </div>
        </div>

        {/* Category row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 600 }}>Category:</span>
          {CATEGORY_OPTIONS.map(cls => {
            const active = rule.rule_category === cls.value
            return (
              <button
                key={cls.value}
                onClick={() => setCategory(cls.value)}
                style={{
                  padding: '3px 10px', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${active ? cls.color : 'var(--border-secondary)'}`,
                  background: active ? `${cls.color}15` : 'transparent',
                  color: active ? cls.color : 'var(--fg-tertiary)',
                  fontSize: 'var(--text-xs)', fontWeight: active ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {cls.label}
              </button>
            )
          })}
        </div>

        {/* Priority */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 600 }}>Priority:</span>
          <input
            type="number"
            style={{
              width: 70, height: 28, padding: '0 8px', textAlign: 'center',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-primary)', color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              boxSizing: 'border-box',
            }}
            value={rule.priority}
            onChange={(e) => updateRule({ priority: parseInt(e.target.value) || 0 })}
            min={0}
            max={9999}
          />
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 24px', borderBottom: '1px solid var(--border-primary)' }}>
          <TabGroup
            tabs={tabs}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          {activeTab === 'conditions' && (
            rule.content_type === 'decision_table' ? (
              <DecisionTableEditor
                table={rule.decision_table ?? createBlankDecisionTable()}
                onChange={(dt) => updateRule({ decision_table: dt })}
              />
            ) : rule.content_type === 'decision_graph' ? (
              <DecisionGraphEditor
                graph={rule.decision_graph ?? createBlankDecisionGraph()}
                onChange={(graph) => updateRule({ decision_graph: graph })}
              />
            ) : (
              <ConditionTreeBuilder
                condition={rule.conditions ?? createBlankConditionTree()}
                onChange={(c) => updateRule({ conditions: c })}
              />
            )
          )}
          {activeTab === 'actions' && (
            <ActionsEditor
              actions={rule.actions ?? []}
              onChange={(actions) => updateRule({ actions })}
            />
          )}
          {activeTab === 'conflicts' && (
            <ConflictMatrixPanel ruleSetKey={rule.rule_set_key || rule.id} />
          )}
          {activeTab === 'simulator' && (
            <RuleSimulator entityType={rule.entity_type} ruleSetKey={rule.rule_set_key || rule.id} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ rule: _rule, onBack, onSave, saving, children }: {
  rule: RuleSetV2
  onBack: () => void
  onSave: () => void
  saving: boolean
  children?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 24px', borderBottom: '1px solid var(--border-primary)',
      background: 'var(--bg-primary)',
    }}>
      <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={onBack} />
      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--fg-primary)', margin: 0, flex: 1 }}>
        Rule Editor
      </h2>
      {children}
      <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  )
}
