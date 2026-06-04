import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, GitBranch } from 'lucide-react'
import {
  Button, StatusBadge, SearchInput, Select,
  VirtualGrid, PageLayout, Modal, useToast,
  type VirtualGridColumn, type RowAction,
} from '../../design-system'
import { useWorkflowArtifacts, useCreateWorkflow, useDeleteWorkflow } from '../../hooks/useWorkflowBuilder'
import type { WorkflowArtifact } from '../../types/workflowBuilder'

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function WorkflowListPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')

  const { data, isLoading } = useWorkflowArtifacts(statusFilter ? { status: statusFilter } : undefined)
  const createMut = useCreateWorkflow()
  const deleteMut = useDeleteWorkflow()

  const items = (data?.items ?? []).filter(w =>
    w.artifact_name.toLowerCase().includes(search.toLowerCase())
  )

  const columns: VirtualGridColumn<WorkflowArtifact>[] = [
    {
      key: 'artifact_name',
      label: 'Workflow',
      width: 280,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <GitBranch size={14} color="var(--brand-500)" />
          <div>
            <div style={{ fontWeight: 500 }}>{row.artifact_name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {(row.payload as Record<string, unknown>)?.properties
                ? (((row.payload as Record<string, unknown>).properties as Record<string, unknown>)?.description as string | undefined)
                : undefined}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 100,
      render: (row) => (
        <StatusBadge status={row.is_active ? 'published' : row.is_draft ? 'draft' : 'inactive'} />
      ),
    },
    {
      key: 'version_no',
      label: 'Version',
      width: 80,
      render: (row) => <span>v{row.version_no}</span>,
    },
    {
      key: 'created_at',
      label: 'Modified',
      width: 120,
      render: (row) => <span>{relativeDate(row.created_at)}</span>,
    },
    {
      key: 'created_by',
      label: 'Created by',
      width: 140,
      render: (row) => <span style={{ color: 'var(--color-text-muted)' }}>{row.created_by}</span>,
    },
  ]

  const rowActions: RowAction<WorkflowArtifact>[] = [
    {
      label: 'Edit',
      onClick: (row) => navigate(`/admin/workflows/${row.artifact_id}/edit`),
    },
    {
      label: 'Delete',
      variant: 'danger',
      onClick: (row) => {
        deleteMut.mutate(row.artifact_id, {
          onSuccess: () => success('Deleted', `${row.artifact_name} deleted`),
          onError: () => error('Failed', 'Could not delete workflow'),
        })
      },
    },
  ]

  function handleCreate() {
    if (!newName.trim()) {
      error('Validation', 'Workflow name is required')
      return
    }
    createMut.mutate(
      {
        artifact_name: newName.trim(),
        artifact_type: 'workflow_builder',
      },
      {
        onSuccess: (artifact) => {
          success('Created', `${artifact.artifact_name} is ready`)
          setCreating(false)
          setNewName('')
          setNewDescription('')
          navigate(`/admin/workflows/${artifact.artifact_id}/edit`)
        },
        onError: () => error('Failed', 'Could not create workflow'),
      }
    )
  }

  return (
    <PageLayout
      title="Workflow Builder"
      subtitle={`${data?.total ?? 0} workflows`}
      headerActions={
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={14} /> New Workflow
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search workflows..."
          style={{ width: 280 }}
        />
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
          ]}
        />
      </div>

      <VirtualGrid
        data={items}
        columns={columns}
        rowActions={rowActions}
        loading={isLoading}
        onRowClick={(row) => navigate(`/admin/workflows/${row.artifact_id}/edit`)}
        emptyMessage="No workflows yet. Create your first workflow to get started."
      />

      {/* Create Modal */}
      <Modal
        open={creating}
        onClose={() => { setCreating(false); setNewName(''); setNewDescription('') }}
        title="Create New Workflow"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>
              Workflow name *
            </label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g. Get Provider By ID"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.875rem' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              Give it a clear name so your team knows what it does.
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>
              Description (optional)
            </label>
            <textarea
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="What does this workflow do?"
              rows={2}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <Button variant="secondary" onClick={() => { setCreating(false); setNewName('') }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating…' : 'Create Workflow'}
            </Button>
          </div>
        </div>
      </Modal>
    </PageLayout>
  )
}

export default WorkflowListPage
