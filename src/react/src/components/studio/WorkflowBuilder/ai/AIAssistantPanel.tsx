import { useState } from 'react'
import { X, Sparkles } from 'lucide-react'
import { Button, Textarea, Banner, Spinner } from '../../../../design-system'
import {
  nlpGenerateWorkflow,
  nlpExplainWorkflow,
  nlpImproveWorkflow,
} from '../../../../config/studioApi'
import type { AIImprovementSuggestion } from '../../../../config/studioApi'
import { validateImportJson } from '../utils/workflowIO'
import type { WorkflowDefinition } from '../../../../types/workflowBuilder'

// ── Types ─────────────────────────────────────────────────────────────────────

type ActiveTab = 'generate' | 'explain' | 'improve'

export interface AIAssistantPanelProps {
  tabId: string
  definition: WorkflowDefinition
  onApply: (def: WorkflowDefinition) => void
  onClose: () => void
}

// ── Severity colour helpers ───────────────────────────────────────────────────

const SEVERITY_BORDER: Record<AIImprovementSuggestion['severity'], string> = {
  error: 'var(--error-500)',
  warning: 'var(--warning-500)',
  info: 'var(--info-500)',
}

const SEVERITY_BG: Record<AIImprovementSuggestion['severity'], string> = {
  error: 'var(--error-50)',
  warning: 'var(--warning-50)',
  info: 'var(--info-50)',
}

// ── Generate tab ──────────────────────────────────────────────────────────────

interface GenerateTabProps {
  definition: WorkflowDefinition
  onApply: (def: WorkflowDefinition) => void
}

function GenerateTab({ definition, onApply }: GenerateTabProps) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [generated, setGenerated] = useState<WorkflowDefinition | null>(null)

  const existingStepIds = definition.sequence.map(s => s.id)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setErrorMsg(null)
    setGenerated(null)
    try {
      const result = await nlpGenerateWorkflow({
        prompt: prompt.trim(),
        context: { entityTypes: [], existingStepIds },
      })
      // Validate by wrapping in the envelope format validateImportJson expects
      const envelope = { definition: result, version: 1, name: 'ai-generated', exportedAt: new Date().toISOString() }
      const validationError = validateImportJson(envelope)
      if (validationError !== null) {
        setErrorMsg(`Validation failed: ${validationError}`)
      } else {
        setGenerated(result)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'AI generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (generated) {
      onApply(generated)
      setGenerated(null)
      setPrompt('')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Textarea
        label="Describe your workflow"
        placeholder="e.g. Fetch a customer record by ID, validate required fields, then return a 200 response with the customer data."
        value={prompt}
        onChange={e => setPrompt(e.currentTarget.value)}
        rows={5}
        disabled={loading}
      />

      <Button
        variant="primary"
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
        loading={loading}
      >
        {loading ? 'Generating…' : 'Generate Workflow'}
      </Button>

      {errorMsg && (
        <Banner variant="error" title="Generation failed" message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}

      {generated && !errorMsg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Banner
            variant="success"
            title="Workflow ready"
            message={`Generated ${generated.sequence.filter(s => s.type !== 'start' && s.type !== 'end').length} step(s). Review and apply to the canvas.`}
          />
          <Button variant="secondary" onClick={handleApply}>
            Apply to Canvas
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Explain tab ───────────────────────────────────────────────────────────────

interface ExplainTabProps {
  definition: WorkflowDefinition
}

function ExplainTab({ definition }: ExplainTabProps) {
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleExplain = async () => {
    setLoading(true)
    setErrorMsg(null)
    setExplanation(null)
    try {
      const result = await nlpExplainWorkflow(definition)
      setExplanation(result.explanation)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not explain the workflow. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', margin: 0 }}>
        Get a plain-English description of what this workflow does, written for non-technical stakeholders.
      </p>

      <Button
        variant="secondary"
        onClick={handleExplain}
        disabled={loading}
        loading={loading}
      >
        {loading ? 'Explaining…' : 'Explain this workflow'}
      </Button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Spinner size={20} />
        </div>
      )}

      {errorMsg && (
        <Banner variant="error" title="Explanation failed" message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}

      {explanation && !errorMsg && (
        <div
          style={{
            background: 'var(--neutral-50)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 14px',
          }}
        >
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.6 }}>
            {explanation}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Improve tab ───────────────────────────────────────────────────────────────

interface ImproveTabProps {
  definition: WorkflowDefinition
}

function ImproveTab({ definition }: ImproveTabProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<AIImprovementSuggestion[] | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleImprove = async () => {
    setLoading(true)
    setErrorMsg(null)
    setSuggestions(null)
    try {
      const result = await nlpImproveWorkflow(definition)
      setSuggestions(result.suggestions)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not analyse the workflow. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', margin: 0 }}>
        Analyse this workflow for potential issues, missing steps, and best-practice recommendations.
      </p>

      <Button
        variant="secondary"
        onClick={handleImprove}
        disabled={loading}
        loading={loading}
      >
        {loading ? 'Analysing…' : 'Suggest improvements'}
      </Button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0' }}>
          <Spinner size={20} />
        </div>
      )}

      {errorMsg && (
        <Banner variant="error" title="Analysis failed" message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}

      {suggestions !== null && !errorMsg && (
        suggestions.length === 0 ? (
          <Banner variant="success" title="Looking good!" message="No suggestions — your workflow looks good!" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map((s, i) => (
              <div
                key={i}
                style={{
                  background: SEVERITY_BG[s.severity],
                  borderRadius: 'var(--radius-md)',
                  borderLeft: `4px solid ${SEVERITY_BORDER[s.severity]}`,
                  padding: '10px 12px',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', marginBottom: 4 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
                  {s.description}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

const TAB_LABELS: { id: ActiveTab; label: string }[] = [
  { id: 'generate', label: 'Generate' },
  { id: 'explain', label: 'Explain' },
  { id: 'improve', label: 'Improve' },
]

export function AIAssistantPanel({ definition, onApply, onClose }: AIAssistantPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('generate')

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.10)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
          background: 'var(--color-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} style={{ color: 'var(--brand-500)' }} />
          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
            AI Assistant
          </span>
        </div>
        <button
          onClick={onClose}
          title="Close AI Assistant"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        {TAB_LABELS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--brand-500)' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--brand-600)' : 'var(--color-text-muted)',
              fontFamily: 'inherit',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {activeTab === 'generate' && (
          <GenerateTab definition={definition} onApply={onApply} />
        )}
        {activeTab === 'explain' && (
          <ExplainTab definition={definition} />
        )}
        {activeTab === 'improve' && (
          <ImproveTab definition={definition} />
        )}
      </div>
    </div>
  )
}
