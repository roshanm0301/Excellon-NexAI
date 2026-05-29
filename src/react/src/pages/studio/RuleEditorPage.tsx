import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Editor from '@monaco-editor/react'
import { ArrowLeft, Plus, Trash2, Code2, EyeOff } from 'lucide-react'
import {
  Button, useToast, Spinner, Banner,
} from '../../design-system'
import { getRuleSet, saveRuleSet, type Condition, type RuleAction } from '../../config/studioApi'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultCondition(): Condition {
  return { type: 'AND', conditions: [] }
}

function defaultFieldCondition(): Condition {
  return { type: 'FIELD', field: '', operator: 'eq', value: '' }
}

function defaultAction(): RuleAction {
  return { type: 'BLOCK', message: '' }
}

const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'gt', label: 'greater than' },
  { value: 'gte', label: 'greater than or equal' },
  { value: 'lt', label: 'less than' },
  { value: 'lte', label: 'less than or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'startsWith', label: 'starts with' },
  { value: 'in', label: 'in (comma-separated)' },
  { value: 'notIn', label: 'not in (comma-separated)' },
  { value: 'isNull', label: 'is null' },
  { value: 'isNotNull', label: 'is not null' },
]

const COMBINATOR_OPTIONS = [
  { value: 'AND', label: 'AND — all conditions must match' },
  { value: 'OR', label: 'OR — any condition must match' },
]

const ACTION_TYPE_OPTIONS = [
  { value: 'BLOCK', label: 'BLOCK — reject the operation' },
  { value: 'WARN', label: 'WARN — show a warning' },
  { value: 'SET_FIELD', label: 'SET_FIELD — set a field value' },
]

// ─── ConditionNode ─────────────────────────────────────────────────────────────

interface ConditionNodeProps {
  condition: Condition
  onChange: (c: Condition) => void
  onDelete: () => void
  depth: number
}

function ConditionNode({ condition, onChange, onDelete, depth }: ConditionNodeProps) {
  const indentColor = ['var(--brand-200)', 'var(--success-200)', 'var(--warning-200)', 'var(--neutral-200)'][depth % 4]

  const addChild = (type: 'FIELD' | 'AND' | 'OR' | 'NOT') => {
    const children = condition.conditions ?? []
    const newChild: Condition = type === 'FIELD' ? defaultFieldCondition() : { type, conditions: type === 'NOT' ? [defaultFieldCondition()] : [] }
    onChange({ ...condition, conditions: [...children, newChild] })
  }

  const updateChild = (index: number, child: Condition) => {
    const children = [...(condition.conditions ?? [])]
    children[index] = child
    onChange({ ...condition, conditions: children })
  }

  const deleteChild = (index: number) => {
    const children = [...(condition.conditions ?? [])]
    children.splice(index, 1)
    onChange({ ...condition, conditions: children })
  }

  if (condition.type === 'FIELD') {
    const noValue = condition.operator === 'isNull' || condition.operator === 'isNotNull'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: '1 1 140px', minWidth: 120 }}>
          <input
            className="ex-input"
            style={{
              width: '100%', height: 34, padding: '0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
            }}
            placeholder="field.name"
            value={condition.field ?? ''}
            onChange={(e) => onChange({ ...condition, field: e.target.value })}
          />
        </div>
        <div style={{ flex: '0 0 190px' }}>
          <select
            style={{
              width: '100%', height: 34, padding: '0 28px 0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)', appearance: 'none', boxSizing: 'border-box',
            }}
            value={condition.operator ?? 'eq'}
            onChange={(e) => onChange({ ...condition, operator: e.target.value as Condition['operator'], value: '' })}
          >
            {OPERATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {!noValue && (
          <div style={{ flex: '1 1 120px', minWidth: 100 }}>
            <input
              className="ex-input"
              style={{
                width: '100%', height: 34, padding: '0 10px',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
                color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
              }}
              placeholder={condition.operator === 'in' || condition.operator === 'notIn' ? 'a, b, c' : 'value'}
              value={Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value ?? '')}
              onChange={(e) => {
                const raw = e.target.value
                const val = (condition.operator === 'in' || condition.operator === 'notIn')
                  ? raw.split(',').map(s => s.trim())
                  : raw
                onChange({ ...condition, value: val })
              }}
            />
          </div>
        )}
        <button
          onClick={onDelete}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--error-500)', padding: 4, display: 'flex', alignItems: 'center',
          }}
          title="Delete condition"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

  if (condition.type === 'NOT') {
    const child = condition.conditions?.[0]
    return (
      <div style={{
        borderLeft: `3px solid ${indentColor}`,
        paddingLeft: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '2px 10px', borderRadius: 'var(--radius-full)',
            background: 'var(--error-100)', color: 'var(--error-700)',
            fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '0.05em',
          }}>NOT</span>
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, display: 'flex', alignItems: 'center' }}
            title="Delete NOT block"
          >
            <Trash2 size={14} />
          </button>
        </div>
        {child ? (
          <ConditionNode
            condition={child}
            onChange={(c) => onChange({ ...condition, conditions: [c] })}
            onDelete={() => onChange({ ...condition, conditions: [] })}
            depth={depth + 1}
          />
        ) : (
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => onChange({ ...condition, conditions: [defaultFieldCondition()] })}>
            Add condition
          </Button>
        )}
      </div>
    )
  }

  // AND / OR
  return (
    <div style={{
      borderLeft: `3px solid ${indentColor}`,
      paddingLeft: 12,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <select
          style={{
            height: 30, padding: '0 24px 0 10px',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
            fontWeight: 600, fontFamily: 'var(--font-sans)', appearance: 'none',
          }}
          value={condition.type}
          onChange={(e) => onChange({ ...condition, type: e.target.value as 'AND' | 'OR' })}
        >
          {COMBINATOR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
        </select>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('FIELD')}>
          Field
        </Button>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('AND')}>
          AND group
        </Button>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('OR')}>
          OR group
        </Button>
        <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => addChild('NOT')}>
          NOT
        </Button>
        {depth > 0 && (
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
            title="Delete group"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      {(condition.conditions ?? []).length === 0 && (
        <div style={{ padding: '8px 12px', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic' }}>
          No conditions — add a field or nested group above.
        </div>
      )}
      {(condition.conditions ?? []).map((child, i) => (
        <ConditionNode
          key={i}
          condition={child}
          onChange={(c) => updateChild(i, c)}
          onDelete={() => deleteChild(i)}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

// ─── ActionRow ─────────────────────────────────────────────────────────────────

interface ActionRowProps {
  action: RuleAction
  onChange: (a: RuleAction) => void
  onDelete: () => void
}

function ActionRow({ action, onChange, onDelete }: ActionRowProps) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <select
            style={{
              width: '100%', height: 36, padding: '0 28px 0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)', appearance: 'none', boxSizing: 'border-box',
            }}
            value={action.type}
            onChange={(e) => onChange({ type: e.target.value as RuleAction['type'] })}
          >
            {ACTION_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <button
          onClick={onDelete}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, display: 'flex', alignItems: 'center' }}
          title="Delete action"
        >
          <Trash2 size={14} />
        </button>
      </div>
      {(action.type === 'BLOCK' || action.type === 'WARN') && (
        <input
          style={{
            width: '100%', height: 36, padding: '0 10px',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
            color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
          }}
          placeholder="Message shown to user…"
          value={action.message ?? ''}
          onChange={(e) => onChange({ ...action, message: e.target.value })}
        />
      )}
      {action.type === 'SET_FIELD' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{
              flex: 1, height: 36, padding: '0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
            }}
            placeholder="field.name"
            value={action.field ?? ''}
            onChange={(e) => onChange({ ...action, field: e.target.value })}
          />
          <input
            style={{
              flex: 1, height: 36, padding: '0 10px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)', background: 'var(--bg-primary)',
              color: 'var(--fg-primary)', fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)', boxSizing: 'border-box',
            }}
            placeholder="value"
            value={String(action.value ?? '')}
            onChange={(e) => onChange({ ...action, value: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

// ─── RuleEditorPage ────────────────────────────────────────────────────────────

export function RuleEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [conditions, setConditions] = useState<Condition>(defaultCondition())
  const [actions, setActions] = useState<RuleAction[]>([])
  const [jsonMode, setJsonMode] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  const { data: ruleSet, isLoading } = useQuery({
    queryKey: ['ruleSet', id],
    queryFn: () => getRuleSet(id!),
    enabled: !!id,
  })

  // Initialise state once data loads
  useEffect(() => {
    if (!ruleSet) return
    setName(ruleSet.name)
    const def = ruleSet.definition ?? { conditions: defaultCondition(), actions: [] }
    setConditions(def.conditions ?? defaultCondition())
    setActions(def.actions ?? [])
    setJsonText(JSON.stringify(def, null, 2))
    setDirty(false)
  }, [ruleSet])

  const saveMut = useMutation({
    mutationFn: () => saveRuleSet(id!, {
      name,
      definition: { conditions, actions },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ruleSet', id] })
      qc.invalidateQueries({ queryKey: ['ruleSets'] })
      success('Saved', 'Rule set updated successfully')
      setDirty(false)
    },
    onError: () => error('Save failed'),
  })

  const handleConditionsChange = useCallback((c: Condition) => {
    setConditions(c)
    setDirty(true)
    setJsonText(JSON.stringify({ conditions: c, actions }, null, 2))
  }, [actions])

  const handleActionsChange = useCallback((a: RuleAction[]) => {
    setActions(a)
    setDirty(true)
    setJsonText(JSON.stringify({ conditions, actions: a }, null, 2))
  }, [conditions])

  const handleJsonChange = (val: string | undefined) => {
    const text = val ?? ''
    setJsonText(text)
    setDirty(true)
    try {
      const parsed = JSON.parse(text)
      if (parsed && typeof parsed === 'object') {
        if (parsed.conditions) setConditions(parsed.conditions)
        if (Array.isArray(parsed.actions)) setActions(parsed.actions)
        setJsonError(null)
      }
    } catch {
      setJsonError('Invalid JSON')
    }
  }

  const addAction = () => handleActionsChange([...actions, defaultAction()])
  const updateAction = (i: number, a: RuleAction) => {
    const next = [...actions]; next[i] = a; handleActionsChange(next)
  }
  const deleteAction = (i: number) => {
    const next = [...actions]; next.splice(i, 1); handleActionsChange(next)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spinner />
      </div>
    )
  }

  if (!ruleSet && !isLoading) {
    return (
      <div style={{ padding: 40 }}>
        <Banner variant="error" title="Rule set not found" message="The requested rule set could not be loaded." />
      </div>
    )
  }

  const entityType = ruleSet?.entity_type ?? ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Header */}
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="ex-icon-btn"
              onClick={() => navigate('/rules')}
              title="Back to Rule Builder"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="ex-badge" style={{
                  padding: '2px 8px', borderRadius: 'var(--radius-full)',
                  background: 'var(--brand-100)', color: 'var(--brand-700)',
                  fontSize: 'var(--text-xs)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                }}>
                  {entityType}
                </span>
                {dirty && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    background: 'var(--warning-100)', color: 'var(--warning-700)',
                    fontSize: 'var(--text-xs)', fontWeight: 500,
                  }}>
                    Unsaved changes
                  </span>
                )}
              </div>
              <input
                style={{
                  fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--fg-primary)',
                  background: 'none', border: 'none', outline: 'none', padding: 0,
                  fontFamily: 'var(--font-sans)', width: 400,
                }}
                value={name}
                onChange={(e) => { setName(e.target.value); setDirty(true) }}
                placeholder="Rule set name"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              variant="secondary"
              icon={jsonMode ? <EyeOff size={14} /> : <Code2 size={14} />}
              onClick={() => {
                if (!jsonMode) setJsonText(JSON.stringify({ conditions, actions }, null, 2))
                setJsonMode(v => !v)
              }}
            >
              {jsonMode ? 'Visual mode' : 'Switch to JSON'}
            </Button>
            <Button
              variant="primary"
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
            >
              {saveMut.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      {jsonMode ? (
        <div style={{ flex: 1, padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          {jsonError && (
            <Banner variant="error" title="JSON parse error" message={jsonError} />
          )}
          <div style={{ flex: 1, border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', minHeight: 400 }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonText}
              onChange={handleJsonChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                tabSize: 2,
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px',
          gap: 0, minHeight: 0, overflow: 'hidden',
        }}>
          {/* Left — Condition Tree */}
          <div style={{ padding: '20px 16px 24px 24px', overflowY: 'auto', borderRight: '1px solid var(--border-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                Conditions
              </h3>
            </div>
            {conditions ? (
              <ConditionNode
                condition={conditions}
                onChange={handleConditionsChange}
                onDelete={() => { setConditions(defaultCondition()); setDirty(true) }}
                depth={0}
              />
            ) : (
              <Button variant="secondary" icon={<Plus size={14} />} onClick={() => { setConditions(defaultCondition()); setDirty(true) }}>
                Add root group
              </Button>
            )}
          </div>

          {/* Right — Actions */}
          <div style={{ padding: '20px 24px 24px 16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--fg-primary)' }}>
                Actions
              </h3>
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={addAction}>
                Add action
              </Button>
            </div>
            {actions.length === 0 && (
              <div style={{ padding: '16px 12px', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)', fontStyle: 'italic', textAlign: 'center' }}>
                No actions yet. Add one above.
              </div>
            )}
            {actions.map((action, i) => (
              <ActionRow
                key={i}
                action={action}
                onChange={(a) => updateAction(i, a)}
                onDelete={() => deleteAction(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
export default RuleEditorPage
