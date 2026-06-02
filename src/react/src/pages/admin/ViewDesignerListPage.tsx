import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import {
  Button, StatusBadge, SearchInput, Select,
  VirtualGrid, PageLayout, Modal, ConfirmDialog, useToast,
  type VirtualGridColumn, type RowAction,
} from '../../design-system'
import { useViews, useArchiveView, useCreateView } from '../../hooks/useViewStudio'
import type { View, SurfaceType, CreateViewRequest } from '../../types/viewStudio'
import { SURFACE_TYPES } from '../../types/viewStudio'

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

export function ViewDesignerListPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  useQueryClient()

  const [search, setSearch] = useState('')
  const [surfaceFilter, setSurfaceFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [deleteTarget, setDeleteTarget] = useState<View | null>(null)
  const [creating, setCreating] = useState(false)

  // Create form state
  const [newLabel, setNewLabel] = useState('')
  const [newSurface, setNewSurface] = useState<SurfaceType>('standard_crud')
  const [newEntity, setNewEntity] = useState('')
  const [newCode, setNewCode] = useState('')

  const { data, isLoading } = useViews({
    surface: surfaceFilter as SurfaceType | undefined,
    status: statusFilter as 'draft' | 'published' | undefined,
  })
  const archiveMut = useArchiveView()
  const createMut = useCreateView()

  const filtered = (data?.items ?? []).filter(v =>
    (v.view_label ?? v.artifact_name).toLowerCase().includes(search.toLowerCase()) ||
    (v.primary_entity ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (v.view_code ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const columns: VirtualGridColumn<View>[] = [
    {
      key: 'view_label',
      label: 'View',
      width: '250px',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.view_label || row.artifact_name}</div>
          {row.view_code && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{row.view_code}</div>}
        </div>
      ),
    },
    {
      key: 'surface_type',
      label: 'Surface',
      width: '140px',
      render: (row) => <StatusBadge status={row.surface_type ?? 'unknown'} />,
    },
    {
      key: 'primary_entity',
      label: 'Entity',
      width: '140px',
      render: (row) => <span>{row.primary_entity ?? '—'}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (row) => (
        <StatusBadge status={row.is_active ? 'published' : row.is_draft ? 'draft' : 'inactive'} />
      ),
    },
    {
      key: 'version',
      label: 'Version',
      width: '80px',
      render: (row) => <span>v{row.latest_version_no ?? 0}</span>,
    },
    {
      key: 'updated_at',
      label: 'Modified',
      width: '120px',
      render: (row) => <span>{relativeDate(row.updated_at)}</span>,
    },
  ]

  const rowActions: RowAction<View>[] = [
    {
      label: 'Edit',
      onClick: (row) => navigate(`/studio/views/${row.artifact_id}/edit`),
    },
    {
      label: 'Archive',
      danger: true,
      onClick: (row) => setDeleteTarget(row),
    },
  ]

  function handleCreate() {
    if (!newLabel.trim() || !newEntity.trim()) {
      error('Validation', 'View label and entity are required')
      return
    }
    const req: CreateViewRequest = {
      view_label: newLabel.trim(),
      surface_type: newSurface,
      primary_entity: newEntity.trim(),
      view_code: newCode.trim() || undefined,
    }
    createMut.mutate(req, {
      onSuccess: (view) => {
        success('View created', `${view.view_label ?? view.artifact_name} draft ready`)
        setCreating(false)
        resetForm()
        navigate(`/studio/views/${view.artifact_id}/edit`)
      },
      onError: () => error('Failed', 'Could not create view'),
    })
  }

  function resetForm() {
    setNewLabel('')
    setNewSurface('standard_crud')
    setNewEntity('')
    setNewCode('')
  }

  function handleArchive() {
    if (!deleteTarget) return
    archiveMut.mutate(deleteTarget.artifact_id, {
      onSuccess: () => {
        success('Archived', `${deleteTarget.view_label ?? deleteTarget.artifact_name} archived`)
        setDeleteTarget(null)
      },
      onError: () => error('Failed', 'Could not archive view'),
    })
  }

  return (
    <PageLayout
      title="View Designer"
      subtitle={`${data?.total ?? 0} views`}
      headerActions={
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={14} /> New View
        </Button>
      }
    >
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search views..."
          style={{ width: 260 }}
        />
        <Select
          value={surfaceFilter}
          onChange={(e) => setSurfaceFilter(e.target.value)}
          options={[{ value: '', label: 'All surfaces' }, ...SURFACE_TYPES.map(s => ({ value: s, label: s.replace(/_/g, ' ') }))]}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' },
          ]}
        />
      </div>

      <VirtualGrid
        data={filtered}
        columns={columns}
        rowActions={rowActions}
        loading={isLoading}
        onRowClick={(row) => navigate(`/studio/views/${row.artifact_id}/edit`)}
        emptyMessage="No views found. Create your first view to get started."
      />

      {/* Create Modal */}
      <Modal open={creating} onClose={() => { setCreating(false); resetForm() }} title="Create New View">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>View Label *</label>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Customer List"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>Primary Entity *</label>
            <input
              type="text"
              value={newEntity}
              onChange={e => setNewEntity(e.target.value)}
              placeholder="e.g. customer"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>Surface Type</label>
            <Select
              value={newSurface}
              onChange={(e) => setNewSurface(e.target.value as unknown as SurfaceType)}
              options={SURFACE_TYPES.map(s => ({ value: s, label: s.replace(/_/g, ' ') }))}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>View Code (optional)</label>
            <input
              type="text"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="e.g. customer_list"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6 }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Lowercase, digits, underscores. 3-50 chars.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => { setCreating(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating...' : 'Create View'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Archive Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleArchive}
        title="Archive View"
        message={`Are you sure you want to archive "${deleteTarget?.view_label ?? deleteTarget?.artifact_name}"? This will deactivate the published version.`}
        confirmLabel="Archive"
        danger={true}
      />
    </PageLayout>
  )
}

export default ViewDesignerListPage
