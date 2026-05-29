import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Map } from 'lucide-react'
import {
  Button, StatusBadge, SearchInput,
  VirtualGrid, PageLayout, Modal, ConfirmDialog, useToast,
  type VirtualGridColumn, type RowAction,
} from '../../design-system'
import { createArtifact, forkArtifact, type Artifact } from '../../config/studioApi'
import { useNavigate } from 'react-router-dom'
import { useEntityArtifacts, useDeleteArtifact } from '../../hooks/useEntityArtifacts'

export function EntityDesignerPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Artifact | null>(null)
  const [creating, setCreating] = useState(false)
  const [newEntityType, setNewEntityType] = useState('')

  const { data, isLoading } = useEntityArtifacts()
  const deleteMut = useDeleteArtifact()

  const createMut = useMutation({
    mutationFn: (entityType: string) =>
      createArtifact({ entity_type: entityType, payload: { fields: [], sections: [], relationships: [] } }),
    onSuccess: (artifact) => {
      qc.invalidateQueries({ queryKey: ['entity-artifacts'] })
      success('Entity created', `${artifact.entity_type} draft created`)
      setCreating(false)
      navigate(`/admin/entities/${artifact.id}/edit`)
    },
    onError: () => error('Failed to create entity'),
  })

  const duplicateMut = useMutation({
    mutationFn: (id: string) => forkArtifact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['entity-artifacts'] })
      success('Duplicated', 'Entity duplicated as a new draft')
    },
    onError: () => error('Duplicate failed'),
  })

  const filtered = (data?.items ?? []).filter(a =>
    a.entity_type.toLowerCase().includes(search.toLowerCase())
  )

  const columns: VirtualGridColumn<Artifact>[] = [
    {
      key: 'entity_type',
      label: 'Entity Type',
      width: 260,
      render: row => (
        <span style={{ fontWeight: 600, color: 'var(--brand-600)' }}>
          {row.entity_type.replace(/^entity\./, '')}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      width: 160,
      render: row => {
        const category = (row.payload?.category as string) ?? '—'
        return <span style={{ color: 'var(--fg-secondary)' }}>{category}</span>
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 120,
      render: row => <StatusBadge status={row.status} />,
    },
    {
      key: 'updated_at',
      label: 'Last Updated',
      width: 160,
      render: row =>
        new Date(row.updated_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    },
  ]

  const rowActions: RowAction<Artifact>[] = [
    {
      label: 'Edit',
      onClick: row => navigate(`/admin/entities/${row.id}/edit`),
    },
    {
      label: 'Duplicate',
      onClick: row => duplicateMut.mutate(row.id),
    },
    {
      label: 'Delete',
      variant: 'danger',
      onClick: row => setDeleteTarget(row),
    },
  ]

  return (
    <PageLayout
      title="Entities"
      headerActions={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entities..."
            style={{ width: 280 }}
          />
          <Button
            variant="secondary"
            icon={<Map size={16} />}
            onClick={() => navigate('/admin/entities/map')}
          >
            View Map
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => { setCreating(true); setNewEntityType('') }}
          >
            New Entity
          </Button>
        </div>
      }
    >
      <div style={{ padding: '24px 40px' }}>
        <VirtualGrid<Artifact>
          columns={columns}
          data={filtered}
          loading={isLoading}
          rowActions={rowActions}
          getRowId={row => row.id}
          emptyMessage="No entities yet — click New Entity to get started"
          onRowClick={row => navigate(`/admin/entities/${row.id}/edit`)}
        />
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New Entity"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!newEntityType || createMut.isPending}
              loading={createMut.isPending}
              onClick={() => createMut.mutate(newEntityType)}
            >
              Create
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label className="label">Entity type key</label>
          <input
            autoFocus
            value={newEntityType}
            onChange={e => setNewEntityType(e.target.value.replace(/[^a-z0-9_]/g, '_'))}
            placeholder="e.g. vehicle, job_card, invoice"
            style={{
              height: 40,
              padding: '0 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              fontSize: 'var(--text-sm)',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
          />
          <span className="caption">Lowercase letters, numbers, underscores only</span>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMut.mutate(deleteTarget.id, {
              onSuccess: () => { setDeleteTarget(null); success('Deleted') },
              onError: () => error('Delete failed'),
            })
          }
        }}
        title="Delete entity"
        message={`This will permanently delete "${deleteTarget?.entity_type}". This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMut.isPending}
      />
    </PageLayout>
  )
}
export default EntityDesignerPage
