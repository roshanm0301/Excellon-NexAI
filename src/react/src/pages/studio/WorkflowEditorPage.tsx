import { useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Play, Settings, Link2, Eye,
} from 'lucide-react'
import {
  Button, Spinner, Banner, Badge, useToast, TabGroup, Toggle, Modal,
} from '../../design-system'
import {
  getWorkflowDefinition, saveWorkflowDefinition,
  listWorkflowBindings, createWorkflowBinding, updateWorkflowBinding, deleteWorkflowBinding,
  startWorkflowInstance,
  type ProcessDefinitionV2, type DAGDefinition, type WorkflowBinding, type TriggerEvent,
} from '../../config/studioApi'
import { WorkflowCanvas } from '../../components/studio/WorkflowCanvas'

const TRIGGER_OPTIONS: { value: TriggerEvent; label: string }[] = [
  { value: 'on_create', label: 'On Create' },
  { value: 'on_update', label: 'On Update' },
  { value: 'on_status_change', label: 'On Status Change' },
  { value: 'on_field_change', label: 'On Field Change' },
  { value: 'manual', label: 'Manual' },
]

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [showBindings, setShowBindings] = useState(false)
  const [showTestRun, setShowTestRun] = useState(false)
  const [testEntityId, setTestEntityId] = useState('')

  // Server state
  const { data: definition, isLoading, error } = useQuery({
    queryKey: ['workflow-definition', id],
    queryFn: () => getWorkflowDefinition(id!),
    enabled: !!id,
  })

  // Local editor state
  const [localDef, setLocalDef] = useState<ProcessDefinitionV2 | null>(null)
  const def = localDef ?? definition ?? null

  if (definition && !localDef) setLocalDef(definition)

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!def || !id) throw new Error('No definition to save')
      return saveWorkflowDefinition(id, {
        name: def.name,
        entityType: def.entityType,
        triggerEvent: def.triggerEvent,
        dag: def.dag,
      })
    },
    onSuccess: () => {
      toast({ title: 'Workflow saved', variant: 'success' })
      queryClient.invalidateQueries({ queryKey: ['workflow-definition', id] })
    },
    onError: (err) => toast({ title: 'Save failed', description: String(err), variant: 'error' }),
  })

  // Test run mutation
  const testRunMutation = useMutation({
    mutationFn: () => startWorkflowInstance({
      definitionId: id!,
      entityType: def!.entityType,
      entityId: testEntityId.trim() || 'test-entity-001',
      context: {},
    }),
    onSuccess: (instance) => {
      toast({ title: 'Instance started', description: `ID: ${instance.id.slice(0, 8)}…`, variant: 'success' })
      setShowTestRun(false)
      navigate(`/workflow/${id}/instances/${instance.id}`)
    },
    onError: (err) => toast({ title: 'Failed to start', description: String(err), variant: 'error' }),
  })

  // Update helpers
  const updateDef = (updates: Partial<ProcessDefinitionV2>) => {
    if (!def) return
    setLocalDef({ ...def, ...updates })
  }

  const handleDAGChange = useCallback((dag: DAGDefinition) => {
    setLocalDef(prev => prev ? { ...prev, dag } : null)
  }, [])

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center' }}><Spinner /></div>
  if (error) return <Banner variant="error">Failed to load workflow definition</Banner>
  if (!def) return <Banner variant="error">Workflow not found</Banner>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 20px', borderBottom: '1px solid var(--border-primary)',
        background: 'var(--bg-primary)', flexShrink: 0,
      }}>
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/workflow')} />
        <input
          style={{
            flex: '0 1 300px', height: 34, padding: '0 12px',
            border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)', color: 'var(--fg-primary)',
            fontSize: 'var(--text-base)', fontWeight: 600, boxSizing: 'border-box',
          }}
          value={def.name}
          onChange={(e) => updateDef({ name: e.target.value })}
        />
        <Badge variant="neutral">{def.entityType}</Badge>
        <Badge variant="info">v{def.version}</Badge>

        <div style={{ flex: 1 }} />

        {/* Trigger selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)', fontWeight: 600 }}>Trigger:</span>
          <select
            style={{
              height: 30, padding: '0 24px 0 8px',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-primary)', color: 'var(--fg-primary)',
              fontSize: 'var(--text-xs)', appearance: 'none',
            }}
            value={def.triggerEvent ?? 'manual'}
            onChange={(e) => updateDef({ triggerEvent: e.target.value as TriggerEvent })}
          >
            {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <Button variant="ghost" size="sm" icon={<Link2 size={14} />} onClick={() => setShowBindings(true)}>
          Bindings
        </Button>
        <Button variant="ghost" size="sm" icon={<Play size={14} />} onClick={() => setShowTestRun(true)}>
          Test Run
        </Button>
        <Button variant="primary" size="sm" icon={<Save size={14} />} onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <WorkflowCanvas dag={def.dag ?? null} onChange={handleDAGChange} />
      </div>

      {/* Bindings modal */}
      {showBindings && (
        <Modal open onClose={() => setShowBindings(false)} title="Workflow Bindings">
          <BindingsPanel definitionId={id!} entityType={def.entityType} />
        </Modal>
      )}

      {/* Test run modal */}
      <Modal open={showTestRun} onClose={() => setShowTestRun(false)} title="Start Test Instance">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', margin: 0 }}>
            This will create a new workflow instance using the currently saved definition.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--fg-secondary)' }}>Entity ID (optional)</label>
            <input
              style={{
                width: '100%', height: 34, padding: '0 10px',
                border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
                background: 'var(--bg-primary)', color: 'var(--fg-primary)',
                fontSize: 'var(--text-sm)', fontFamily: 'var(--font-mono)', boxSizing: 'border-box',
              }}
              placeholder="test-entity-001"
              value={testEntityId}
              onChange={(e) => setTestEntityId(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowTestRun(false)}>Cancel</Button>
            <Button variant="primary" icon={<Play size={14} />} onClick={() => testRunMutation.mutate()} disabled={testRunMutation.isPending}>
              Start Instance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ─── Bindings Panel (inside modal) ────────────────────────────────────────────

function BindingsPanel({ definitionId, entityType }: { definitionId: string; entityType: string }) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-bindings', entityType],
    queryFn: () => listWorkflowBindings(entityType),
  })

  const createMut = useMutation({
    mutationFn: () => createWorkflowBinding({
      entityType,
      triggerEvent: 'on_create',
      definitionId,
      priority: 1,
      enabled: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-bindings'] })
      toast({ title: 'Binding created', variant: 'success' })
    },
  })

  const toggleMut = useMutation({
    mutationFn: (binding: WorkflowBinding) => updateWorkflowBinding(binding.id, { enabled: !binding.enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflow-bindings'] }),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteWorkflowBinding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-bindings'] })
      toast({ title: 'Binding removed', variant: 'success' })
    },
  })

  const bindings = data?.items ?? []

  if (isLoading) return <Spinner />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)', margin: 0 }}>
        Bindings link entity events to this workflow definition.
      </p>

      {bindings.length > 0 && (
        <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {bindings.map(b => (
            <div key={b.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              borderBottom: '1px solid var(--border-secondary)',
            }}>
              <Badge variant="info">{b.triggerEvent}</Badge>
              <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--fg-primary)' }}>
                → {b.definitionId.slice(0, 8)}…
              </span>
              {b.condition && (
                <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--fg-tertiary)' }}>
                  if: {b.condition.slice(0, 25)}
                </span>
              )}
              <Toggle checked={b.enabled} onChange={() => toggleMut.mutate(b)} size="sm" />
              <button
                onClick={() => deleteMut.mutate(b.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error-500)', padding: 4, fontSize: 'var(--text-xs)' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {bindings.length === 0 && (
        <div style={{ padding: 16, textAlign: 'center', color: 'var(--fg-tertiary)', fontSize: 'var(--text-sm)', border: '1px dashed var(--border-secondary)', borderRadius: 'var(--radius-lg)' }}>
          No bindings configured yet.
        </div>
      )}

      <Button variant="secondary" size="sm" icon={<Link2 size={14} />} onClick={() => createMut.mutate()}>
        Add Binding
      </Button>
    </div>
  )
}
