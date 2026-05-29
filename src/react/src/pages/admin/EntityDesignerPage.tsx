import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Upload } from 'lucide-react'
import {
  Button, StatusBadge, SearchInput, DataTable,
  ConfirmDialog, useToast, type Column,
} from '../../design-system'
import { listArtifacts, createArtifact, publishArtifact, deleteArtifact, type Artifact } from '../../config/studioApi'
import { useNavigate } from 'react-router-dom'

export function EntityDesignerPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Artifact | null>(null)
  const [creating, setCreating] = useState(false)
  const [newEntityType, setNewEntityType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['artifacts'],
    queryFn: () => listArtifacts(),
  })

  const createMut = useMutation({
    mutationFn: (entityType: string) => createArtifact({ entity_type: entityType, payload: { fields: [], sections: [], relationships: [] } }),
    onSuccess: (artifact) => {
      qc.invalidateQueries({ queryKey: ['artifacts'] })
      success('Entity created', `${artifact.entity_type} draft created`)
      navigate(`/entities/${artifact.entity_type}?id=${artifact.id}`)
    },
    onError: () => error('Failed to create entity'),
  })

  const publishMut = useMutation({
    mutationFn: publishArtifact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['artifacts'] }); success('Published', 'Entity schema compiled successfully') },
    onError: () => error('Publish failed', 'Check the entity definition for errors'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteArtifact,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['artifacts'] }); setDeleteTarget(null); success('Deleted') },
    onError: () => error('Delete failed'),
  })

  const filtered = (data?.items ?? []).filter(a =>
    a.entity_type.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<Artifact>[] = [
    { key: 'entity_type', label: 'Entity Type', sortable: true, render: row => (
      <button
        className="ex-link"
        style={{ fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-600)', padding: 0 }}
        onClick={() => navigate(`/entities/${row.entity_type}?id=${row.id}`)}
      >
        {row.entity_type}
      </button>
    )},
    { key: 'version', label: 'Version', width: 80, render: row => `v${row.version}` },
    { key: 'status', label: 'Status', width: 120, render: row => <StatusBadge status={row.status} /> },
    { key: 'updated_at', label: 'Last Updated', width: 160, sortable: true, render: row => new Date(row.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { key: 'actions', label: '', width: 180, render: row => (
      <div style={{ display: 'flex', gap: 4 }}>
        {row.status === 'draft' && (
          <Button variant="ghost" onClick={e => { e.stopPropagation(); publishMut.mutate(row.id) }} icon={<Upload size={14} />}>
            Publish
          </Button>
        )}
        <Button variant="ghost" onClick={e => { e.stopPropagation(); setDeleteTarget(row) }} style={{ color: 'var(--error-600)' }}>
          Delete
        </Button>
      </div>
    )},
  ]

  return (
    <div>
      <div className="ex-page-header">
        <div className="ex-page-head-row">
          <div>
            <h1 className="ex-h1">Entity Designer</h1>
            <p className="ex-page-sub">Define entity schemas, fields, relationships and lifecycle rules</p>
          </div>
          <div className="ex-page-actions">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => { setCreating(true); setNewEntityType('') }}
            >
              New Entity
            </Button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <SearchInput
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entities..."
            style={{ maxWidth: 320 }}
          />
        </div>
      </div>

      <DataTable<Artifact & Record<string, unknown>>
        columns={columns as Column<Artifact & Record<string, unknown>>[]}
        rows={filtered as (Artifact & Record<string, unknown>)[]}
        loading={isLoading}
        emptyTitle="No entities yet"
        emptyDescription='Create your first entity to get started. Click "New Entity" above.'
        keyField="id"
      />

      {/* New entity modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)' }} onClick={() => setCreating(false)} />
          <div style={{ position: 'relative', zIndex: 101, background: 'var(--bg-primary)', borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-3xl)', padding: 24, width: 400 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 'var(--text-lg)', fontWeight: 600 }}>New Entity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <label className="label">Entity type key</label>
              <input
                autoFocus
                value={newEntityType}
                onChange={e => setNewEntityType(e.target.value.replace(/[^a-z0-9_]/g, '_'))}
                placeholder="e.g. vehicle, job_card, invoice"
                style={{ height: 40, padding: '0 12px', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)', outline: 'none' }}
              />
              <span className="caption">Lowercase letters, numbers, underscores only</span>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!newEntityType || createMut.isPending}
                loading={createMut.isPending}
                onClick={() => createMut.mutate(newEntityType)}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        title="Delete entity"
        message={`This will permanently delete "${deleteTarget?.entity_type}". This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMut.isPending}
      />
    </div>
  )
}
export default EntityDesignerPage
