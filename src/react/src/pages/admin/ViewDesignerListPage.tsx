import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import {
  Button, StatusBadge, SearchInput, Select, Tooltip,
  VirtualGrid, PageLayout, Modal, ConfirmDialog, useToast,
  type VirtualGridColumn, type RowAction,
} from '../../design-system'
import { useViews, useArchiveView, useCreateView, useEntityTypes, useViewStats } from '../../hooks/useViewStudio'
import type { View, SurfaceType, CreateViewRequest } from '../../types/viewStudio'
import { SURFACE_TYPES } from '../../types/viewStudio'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const SURFACE_LABELS: Record<string, string> = {
  standard_crud: 'Standard CRUD',
  advanced_crud: 'Advanced CRUD',
  header_line: 'Header / Line',
  dashboard: 'Dashboard',
  wizard: 'Wizard',
  detail_page: 'Detail Page',
  split_view: 'Split View',
  kanban: 'Kanban',
  calendar: 'Calendar',
  custom_page: 'Custom Page',
}

const surfaceLabel = (s: string) => SURFACE_LABELS[s] ?? s.replace(/_/g, ' ')

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 10px', borderRadius: 9999, fontSize: '0.75rem', fontWeight: 500,
        border: 'none', cursor: 'pointer',
        background: active ? 'var(--brand-500)' : 'var(--neutral-100)',
        color: active ? 'white' : 'var(--fg-primary)',
        transition: 'background 120ms, color 120ms',
      }}
    >
      {children}
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ViewDesignerListPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  useQueryClient()

  const [search, setSearch] = useState('')
  const [surfaceFilter, setSurfaceFilter] = useState<string>('')
  const [entityFilter, setEntityFilter] = useState<string>('')
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
    entity: entityFilter || undefined,
    status: statusFilter as 'draft' | 'published' | undefined,
    search: search || undefined,
  })
  const { data: entityTypesData } = useEntityTypes()
  const { data: statsData } = useViewStats()
  const archiveMut = useArchiveView()
  const createMut = useCreateView()

  const entityDisplayNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entityTypesData?.items ?? []) {
      map[e.entity_type] = e.display_name
    }
    return map
  }, [entityTypesData])

  const filtered = data?.items ?? []

  const columns: VirtualGridColumn<View>[] = [
    {
      key: 'view_label',
      label: 'View',
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
      width: 150,
      render: (row) => (
        <StatusBadge status={row.surface_type ?? 'unknown'} label={surfaceLabel(row.surface_type ?? '')} />
      ),
    },
    {
      key: 'primary_entity',
      label: 'Entity',
      width: 150,
      render: (row) => {
        if (!row.primary_entity) return <span>—</span>
        const name = entityDisplayNames[row.primary_entity] ?? row.primary_entity.replace(/_/g, ' ')
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setEntityFilter(row.primary_entity!) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              color: 'inherit', textDecoration: 'underline dotted', textUnderlineOffset: 3,
              fontSize: 'inherit', fontFamily: 'inherit',
            }}
            title={`Filter by ${name}`}
          >
            {name}
          </button>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: 140,
      render: (row) => {
        if (row.is_active) return <StatusBadge status="published" />
        if (row.is_draft && row.has_published) {
          return (
            <Tooltip content="Editing in progress — the previously published version is still live for users." placement="top">
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <StatusBadge status="draft" />
                <StatusBadge status="published" label="Live" />
              </div>
            </Tooltip>
          )
        }
        if (row.is_draft) return <StatusBadge status="draft" />
        return <StatusBadge status="inactive" />
      },
    },
    {
      key: 'version',
      label: 'Version',
      width: 80,
      render: (row) => (
        <Tooltip
          content={`Version ${row.latest_version_no ?? 0} — the latest saved draft. Publish state is shown in the Status column.`}
          placement="top"
        >
          <span style={{ cursor: 'default' }}>v{row.latest_version_no ?? 0}</span>
        </Tooltip>
      ),
    },
    {
      key: 'updated_at',
      label: 'Modified',
      width: 120,
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
      variant: 'danger',
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

  const entityOptions = [
    { value: '', label: 'All entities' },
    ...(statsData?.by_entity ?? []).map(s => ({
      value: s.entity,
      label: `${entityDisplayNames[s.entity] ?? s.entity.replace(/_/g, ' ')} (${s.count})`,
    })),
  ]

  return (
    <PageLayout
      title="UI Studio"
      subtitle={`${data?.total ?? 0} views`}
      headerActions={
        <Button onClick={() => setCreating(true)} size="sm">
          <Plus size={14} /> New View
        </Button>
      }
    >
      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '0.75rem', marginBottom: '0.75rem',
        flexWrap: 'wrap', paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-tertiary)',
      }}>
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search views..."
          style={{ width: 260 }}
        />
        <Select
          value={surfaceFilter}
          onChange={(e) => setSurfaceFilter(e.target.value)}
          options={[{ value: '', label: 'All surfaces' }, ...SURFACE_TYPES.map(s => ({ value: s, label: surfaceLabel(s) }))]}
        />
        <Select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          options={entityOptions}
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

      {/* Entity chips — quick entity filter with counts */}
      {statsData && statsData.by_entity.length > 0 && (
        <div style={{
          display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
          paddingBottom: '0.75rem', marginBottom: '0.75rem',
          borderBottom: '1px solid var(--border-secondary)',
        }}>
          <Chip active={entityFilter === ''} onClick={() => setEntityFilter('')}>All</Chip>
          {statsData.by_entity.map(s => (
            <Chip
              key={s.entity}
              active={entityFilter === s.entity}
              onClick={() => setEntityFilter(entityFilter === s.entity ? '' : s.entity)}
            >
              {entityDisplayNames[s.entity] ?? s.entity.replace(/_/g, ' ')} · {s.count}
            </Chip>
          ))}
        </div>
      )}

      <VirtualGrid
        data={filtered}
        columns={columns}
        rowActions={rowActions}
        loading={isLoading}
        onRowClick={(row) => navigate(`/studio/views/${row.artifact_id}/edit`)}
        emptyMessage="No views found. Create your first view to get started."
        data-testid="views-grid"
      />

      {/* Create Modal */}
      <Modal open={creating} onClose={() => { setCreating(false); resetForm() }} title="Create New View" data-testid="create-view-modal">
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
              options={SURFACE_TYPES.map(s => ({ value: s, label: surfaceLabel(s) }))}
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
