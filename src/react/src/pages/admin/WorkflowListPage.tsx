import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Eye, GitBranch } from 'lucide-react'
import {
  Button, Badge, Modal, DataTable, useToast,
  type Column,
} from '../../design-system'
import {
  listWorkflowDefinitions, createWorkflowDefinition,
  listWorkflowInstances,
  type ProcessDefinitionV2, type TriggerEvent,
} from '../../config/studioApi'

const TRIGGER_OPTIONS: { value: TriggerEvent; label: string }[] = [
  { value: 'on_create', label: 'On Create' },
  { value: 'on_update', label: 'On Update' },
  { value: 'on_status_change', label: 'On Status Change' },
  { value: 'on_field_change', label: 'On Field Change' },
  { value: 'manual', label: 'Manual' },
]

export function WorkflowListPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const qc = useQueryClient()

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEntityType, setNewEntityType] = useState('')
  const [newTrigger, setNewTrigger] = useState<TriggerEvent>('manual')

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-definitions'],
    queryFn: () => listWorkflowDefinitions(),
  })

  const { data: instancesData } = useQuery({
    queryKey: ['workflow-instances-summary'],
    queryFn: () => listWorkflowInstances(),
  })

  const createMut = useMutation({
    mutationFn: () => createWorkflowDefinition({
      name: newName.trim(),
      entityType: newEntityType.trim(),
      triggerEvent: newTrigger,
      dag: { startNodeId: '', nodes: [], edges: [] },
    }),
    onSuccess: (def) => {
      qc.invalidateQueries({ queryKey: ['workflow-definitions'] })
      toast('success', 'Workflow created')
      setCreating(false)
      setNewName('')
      setNewEntityType('')
      navigate(`/workflow/${def.id}/edit`)
    },
    onError: () => toast('error', 'Failed to create workflow'),
  })

  // Count running instances per definition
  const instanceCounts = new Map<string, number>()
  if (instancesData?.items) {
    for (const inst of instancesData.items) {
      instanceCounts.set(inst.definitionId, (instanceCounts.get(inst.definitionId) ?? 0) + 1)
    }
  }

  const columns: Column<ProcessDefinitionV2>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <button
          style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-primary)', padding: 0, textAlign: 'left', fontSize: 'var(--text-sm)' }}
          onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${row.id}/edit`) }}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: 'entityType',
      label: 'Entity Type',
      sortable: true,
      width: 150,
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--brand-600)' }}>
          {row.entityType}
        </span>
      ),
    },
    {
      key: 'triggerEvent',
      label: 'Trigger',
      width: 140,
      render: (row) => (
        <Badge variant={row.triggerEvent === 'manual' ? 'gray' : 'info'}>
          {row.triggerEvent ?? 'manual'}
        </Badge>
      ),
    },
    {
      key: 'version',
      label: 'Ver',
      width: 60,
      render: (row) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)' }}>v{row.version}</span>,
    },
    {
      key: 'dag',
      label: 'Nodes',
      width: 80,
      render: (row) => (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-secondary)' }}>
          {row.dag?.nodes?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'instances',
      label: 'Instances',
      width: 90,
      render: (row) => {
        const count = instanceCounts.get(row.id) ?? 0
        return count > 0
          ? <Badge variant="info">{count} active</Badge>
          : <span style={{ color: 'var(--fg-tertiary)', fontSize: 'var(--text-xs)' }}>—</span>
      },
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      width: 130,
      sortable: true,
      render: (row) => new Date(row.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
    {
      key: 'actions',
      label: '',
      width: 100,
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${row.id}/edit`) }} icon={<Edit2 size={14} />} />
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/workflow/${row.id}/instances`) }} icon={<Eye size={14} />} title="View Instances" />
        </div>
      ),
    },
  ]

  const items = data?.items ?? []

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <GitBranch size={22} style={{ color: 'var(--brand-500)' }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--fg-primary)', margin: 0 }}>
            Workflow Engine
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--fg-tertiary)', margin: 0 }}>
            Design DAG workflows with approvals, service calls, and parallel execution
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreating(true)}>
          New Workflow
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        rows={items as unknown as Record<string, unknown>[]}
        loading={isLoading}
        emptyTitle="No workflows defined yet. Create one to get started."
        onRowClick={(row) => navigate(`/workflow/${(row as unknown as ProcessDefinitionV2).id}/edit`)}
      />

      {/* Create modal */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Create Workflow">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 8 }}>
          <Field label="Name">
            <input
              style={inputStyle}
              placeholder="e.g. Order Approval Process"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Entity Type">
            <input
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
              placeholder="e.g. order, purchase_request"
              value={newEntityType}
              onChange={(e) => setNewEntityType(e.target.value)}
            />
          </Field>
          <Field label="Trigger">
            <select
              style={{ ...inputStyle, appearance: 'none', paddingRight: 28 }}
              value={newTrigger}
              onChange={(e) => setNewTrigger(e.target.value as TriggerEvent)}
            >
              {TRIGGER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => createMut.mutate()} disabled={!newName.trim() || !newEntityType.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--fg-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 36, padding: '0 12px',
  border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)',
  background: 'var(--bg-primary)', color: 'var(--fg-primary)',
  fontSize: 'var(--text-sm)', boxSizing: 'border-box',
}

export default WorkflowListPage
