import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LayoutGrid, Search, Plus } from 'lucide-react'
import {
  Button, StatusBadge, Select, Modal, ConfirmDialog,
  ActionMenu, useToast,
  type ActionMenuItem,
} from '../../design-system'
import {
  useViews, useArchiveView, useCreateView, useEntityTypes, useViewStats,
  usePublishViewById, useDuplicateView, useUnpublishView,
} from '../../hooks/useViewStudio'
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusPill({ view }: { view: View }) {
  if (view.is_active) {
    return (
      <span style={{
        background: '#F1F9F2', color: '#1AB049',
        borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 600,
      }}>Published</span>
    )
  }
  return (
    <span style={{
      background: '#FFFAEB', color: '#F59E0B',
      borderRadius: 20, padding: '2px 10px', fontSize: 11.5, fontWeight: 600,
    }}>Draft</span>
  )
}

function VersionChip({ no }: { no: number }) {
  return (
    <span style={{
      background: '#F5F6F8', border: '1px solid #EBEDF0',
      borderRadius: 5, padding: '1px 8px', fontSize: 11.5, fontFamily: 'monospace', color: '#8593A3',
    }}>v{no}</span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ViewDesignerListPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [entitySearch, setEntitySearch] = useState('')
  const [viewSearch, setViewSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<View | null>(null)
  const [confirmUnpublish, setConfirmUnpublish] = useState<View | null>(null)
  const [creating, setCreating] = useState(false)
  const [preselectedEntity, setPreselectedEntity] = useState<string | null>(null)

  // Create form state
  const [newLabel, setNewLabel] = useState('')
  const [newSurface, setNewSurface] = useState<SurfaceType>('standard_crud')
  const [newEntity, setNewEntity] = useState('')
  const [newCode, setNewCode] = useState('')

  const selectedEntity = searchParams.get('entity') ?? null

  const { data: statsData } = useViewStats()
  const { data: entityTypesData } = useEntityTypes()
  // Unfiltered fetch — always reflects all views; used for entity browser regardless of active filter
  const { data: allViewsData } = useViews()
  const { data: viewsData, isLoading } = useViews({
    entity: selectedEntity ?? undefined,
    search: viewSearch || undefined,
    status: statusFilter as 'draft' | 'published' | undefined,
  })

  const archiveMut = useArchiveView()
  const createMut = useCreateView()
  const publishMut = usePublishViewById()
  const duplicateMut = useDuplicateView()
  const unpublishMut = useUnpublishView()

  const entityDisplayNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entityTypesData?.items ?? []) {
      map[e.entity_type] = e.display_name
    }
    return map
  }, [entityTypesData])

  // Prefer statsData when available; fall back to grouping the unfiltered views list.
  // Using allViewsData (not viewsData) means the entity browser stays populated even
  // when an entity filter is active on the right panel.
  const entitiesWithViews = useMemo(() => {
    if (statsData?.by_entity?.length) {
      return statsData.by_entity.map(s => ({
        key: s.entity,
        displayName: entityDisplayNames[s.entity] ?? s.entity.replace(/_/g, ' '),
        count: s.count,
      }))
    }
    const counts: Record<string, number> = {}
    for (const v of allViewsData?.items ?? []) {
      if (v.primary_entity) counts[v.primary_entity] = (counts[v.primary_entity] ?? 0) + 1
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([key, count]) => ({
        key,
        displayName: entityDisplayNames[key] ?? key.replace(/_/g, ' '),
        count,
      }))
  }, [statsData, allViewsData, entityDisplayNames])

  const entitiesWithViewsSet = useMemo(() =>
    new Set(entitiesWithViews.map(e => e.key)),
    [entitiesWithViews],
  )

  const entitiesWithoutViews = useMemo(() => {
    if (!entitySearch.trim()) return []
    return (entityTypesData?.items ?? [])
      .filter(e => !entitiesWithViewsSet.has(e.entity_type))
      .filter(e =>
        e.display_name.toLowerCase().includes(entitySearch.toLowerCase()) ||
        e.entity_type.toLowerCase().includes(entitySearch.toLowerCase()),
      )
  }, [entityTypesData, entitiesWithViewsSet, entitySearch])

  const filteredEntitiesWithViews = useMemo(() => {
    if (!entitySearch.trim()) return entitiesWithViews
    return entitiesWithViews.filter(e =>
      e.displayName.toLowerCase().includes(entitySearch.toLowerCase()) ||
      e.key.toLowerCase().includes(entitySearch.toLowerCase()),
    )
  }, [entitiesWithViews, entitySearch])

  const views = viewsData?.items ?? []
  const totalViews = statsData?.by_entity?.length
    ? statsData.by_entity.reduce((s, e) => s + e.count, 0)
    : (allViewsData?.total ?? 0)
  const totalEntities = entitiesWithViews.length

  const publishedCount = views.filter(v => v.is_active).length

  // Auto-select first entity on mount
  useEffect(() => {
    if (!selectedEntity && entitiesWithViews.length > 0) {
      setSearchParams({ entity: entitiesWithViews[0].key }, { replace: true })
    }
  }, [entitiesWithViews, selectedEntity, setSearchParams])

  function selectEntity(key: string | null) {
    setSearchParams(key ? { entity: key } : {}, { replace: true })
    setViewSearch('')
    setStatusFilter('')
  }

  function openCreate(preEntity?: string) {
    setPreselectedEntity(preEntity ?? null)
    setNewEntity(preEntity ?? '')
    setNewLabel('')
    setNewSurface('standard_crud')
    setNewCode('')
    setCreating(true)
  }

  function resetForm() {
    setNewLabel('')
    setNewSurface('standard_crud')
    setNewEntity('')
    setNewCode('')
    setPreselectedEntity(null)
  }

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

  function handleUnpublish() {
    if (!confirmUnpublish) return
    unpublishMut.mutate(confirmUnpublish.artifact_id, {
      onSuccess: () => {
        success('Unpublished', `${confirmUnpublish.view_label} reverted to draft`)
        setConfirmUnpublish(null)
      },
      onError: () => error('Failed', 'Could not unpublish view'),
    })
  }

  function rowActions(row: View): ActionMenuItem[] {
    return [
      {
        label: 'Open in Designer',
        onClick: () => navigate(`/studio/views/${row.artifact_id}/edit`),
      },
      {
        label: 'Duplicate',
        onClick: () => duplicateMut.mutate(row.artifact_id, {
          onSuccess: () => success('Duplicated', `${row.view_label} (Copy) created`),
          onError: () => error('Failed', 'Could not duplicate view'),
        }),
      },
      row.is_active
        ? { label: 'Unpublish', onClick: () => setConfirmUnpublish(row) }
        : {
          label: 'Publish',
          onClick: () => publishMut.mutate(row.artifact_id, {
            onSuccess: () => success('Published', `${row.view_label} is now live`),
            onError: () => error('Failed', 'Could not publish view'),
          }),
        },
      {
        label: 'Delete',
        variant: 'danger' as const,
        onClick: () => setDeleteTarget(row),
      },
    ]
  }

  const selectedDisplayName = selectedEntity === '__unassigned__'
    ? 'Unassigned'
    : selectedEntity
      ? (entityDisplayNames[selectedEntity] ?? selectedEntity.replace(/_/g, ' '))
      : 'All Views'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Compact page header ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #E7E9ED',
        padding: '0 32px',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#1A2030', marginRight: 10 }}>
            Views
          </span>
          <span style={{ fontSize: 13, color: '#8593A3' }}>
            {totalViews} views · {totalEntities} entities
          </span>
        </div>
      </div>

      {/* ── Split panel ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Left: Entity browser ── */}
        <aside style={{
          width: 296,
          flexShrink: 0,
          background: '#fff',
          borderRight: '1px solid #E7E9ED',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Search */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #E7E9ED' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #E7E9ED', borderRadius: 8, padding: '6px 10px',
              background: '#F5F6F8',
            }}>
              <Search size={13} color="#8593A3" />
              <input
                value={entitySearch}
                onChange={e => setEntitySearch(e.target.value)}
                placeholder="Search all entities..."
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: '#1A2030', flex: 1,
                }}
              />
            </div>
          </div>

          {/* Entity list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Entities with views */}
            {filteredEntitiesWithViews.map(e => {
              const isActive = selectedEntity === e.key
              return (
                <button
                  key={e.key}
                  onClick={() => selectEntity(e.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                    border: 'none', textAlign: 'left', width: '100%',
                    background: isActive ? '#FCEBE3' : 'transparent',
                    boxShadow: isActive ? 'inset 3px 0 0 #EB6A2C' : 'none',
                    transition: 'background 120ms',
                  }}
                  onMouseEnter={e2 => { if (!isActive) (e2.currentTarget as HTMLButtonElement).style.background = '#F5F6F8' }}
                  onMouseLeave={e2 => { if (!isActive) (e2.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div style={{
                    width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                    background: isActive ? '#F5D4C4' : '#EEF1F4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <LayoutGrid size={15} color={isActive ? '#C04910' : '#586A70'} />
                  </div>
                  <span style={{
                    flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#C04910' : '#1A2030',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{e.displayName}</span>
                  <span style={{
                    background: isActive ? '#F5D4C4' : '#F5F6F8',
                    color: isActive ? '#C04910' : '#8593A3',
                    borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600,
                  }}>{e.count}</span>
                </button>
              )
            })}

            {/* Entities without views — only shown when searching */}
            {entitiesWithoutViews.length > 0 && (
              <>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                  textTransform: 'uppercase', color: '#B6BDC6',
                  padding: '10px 10px 4px',
                }}>No Views Yet</div>
                {entitiesWithoutViews.map(e => (
                  <button
                    key={e.entity_type}
                    onClick={() => openCreate(e.entity_type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                      border: '1.5px dashed #D3D0DC', textAlign: 'left', width: '100%',
                      background: '#FAFBFC', transition: 'background 120ms',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                      background: '#F5F6F8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Plus size={14} color="#B6BDC6" />
                    </div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: '#8593A3' }}>
                      {e.display_name}
                    </span>
                    <span style={{ fontSize: 11, color: '#B6BDC6' }}>+ Create</span>
                  </button>
                ))}
              </>
            )}

            {/* Unassigned divider + entry */}
            <div style={{ height: 1, background: '#E7E9ED', margin: '8px 0' }} />
            <button
              onClick={() => selectEntity('__unassigned__')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                border: 'none', textAlign: 'left', width: '100%',
                background: selectedEntity === '__unassigned__' ? '#FCEBE3' : 'transparent',
                boxShadow: selectedEntity === '__unassigned__' ? 'inset 3px 0 0 #EB6A2C' : 'none',
                transition: 'background 120ms',
                color: selectedEntity === '__unassigned__' ? '#C04910' : '#8593A3',
                fontSize: 13,
              }}
              onMouseEnter={e => { if (selectedEntity !== '__unassigned__') (e.currentTarget as HTMLButtonElement).style.background = '#F5F6F8' }}
              onMouseLeave={e => { if (selectedEntity !== '__unassigned__') (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <div style={{
                width: 32, height: 32, flexShrink: 0, borderRadius: 8,
                background: '#F5F6F8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LayoutGrid size={15} color="#B6BDC6" />
              </div>
              <span style={{ fontWeight: 500 }}>Unassigned</span>
            </button>
          </div>
        </aside>

        {/* ── Right: Views panel ── */}
        <div style={{ flex: 1, background: '#F5F6F8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Panel header */}
          <div style={{
            background: '#fff', borderBottom: '1px solid #E7E9ED',
            padding: '0 20px', height: 58,
            display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#1A2030', lineHeight: 1.2 }}>
                {selectedDisplayName}
              </span>
              <span style={{ fontSize: 12, color: '#8593A3', marginTop: 1 }}>
                {views.length} views · {publishedCount} published
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid #E7E9ED', borderRadius: 8, padding: '5px 10px',
              background: '#F5F6F8', width: 160,
            }}>
              <Search size={13} color="#8593A3" />
              <input
                value={viewSearch}
                onChange={e => setViewSearch(e.target.value)}
                placeholder="Search views..."
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12.5, color: '#1A2030', flex: 1 }}
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
            />
            <Button onClick={() => openCreate(selectedEntity && selectedEntity !== '__unassigned__' ? selectedEntity : undefined)} size="sm">
              <Plus size={14} /> New View
            </Button>
          </div>

          {/* Views table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            {isLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#8593A3', fontSize: 13 }}>
                Loading views…
              </div>
            ) : views.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '60px 20px', gap: 12,
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 12,
                  background: '#EEF1F4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LayoutGrid size={24} color="#B6BDC6" />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1A2030' }}>No views yet</div>
                <div style={{ fontSize: 13, color: '#8593A3', textAlign: 'center' }}>
                  {selectedEntity && selectedEntity !== '__unassigned__'
                    ? `Create the first view for ${selectedDisplayName}.`
                    : 'No views match your filters.'
                  }
                </div>
                {selectedEntity && selectedEntity !== '__unassigned__' && (
                  <Button onClick={() => openCreate(selectedEntity)} size="sm">
                    <Plus size={14} /> New View
                  </Button>
                )}
              </div>
            ) : (
              <div style={{
                background: '#fff',
                border: '1px solid #E7E9ED',
                borderRadius: 14,
                overflow: 'hidden',
              }}>
                {/* Column headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 95px 80px 100px 40px',
                  background: '#F5F6F8',
                  borderBottom: '1px solid #E7E9ED',
                }}>
                  {['View', 'Surface', 'Status', 'Version', 'Modified', ''].map(h => (
                    <div key={h} style={{
                      padding: '8px 14px',
                      fontSize: 10.5, fontWeight: 600,
                      letterSpacing: '0.05em', textTransform: 'uppercase',
                      color: '#8593A3',
                    }}>{h}</div>
                  ))}
                </div>

                {/* Rows */}
                {views.map((row, i) => (
                  <div
                    key={row.artifact_id}
                    onClick={() => navigate(`/studio/views/${row.artifact_id}/edit`)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 140px 95px 80px 100px 40px',
                      borderBottom: i < views.length - 1 ? '1px solid #E7E9ED' : 'none',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: row.is_draft && !row.is_active ? '#FFFCFA' : '#fff',
                      boxShadow: row.is_draft && !row.is_active ? 'inset 3px 0 0 #F59E0B' : 'none',
                      transition: 'background 80ms',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#FAFBFC'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background =
                      row.is_draft && !row.is_active ? '#FFFCFA' : '#fff'
                    }
                  >
                    {/* View name */}
                    <div style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2030' }}>
                        {row.view_label || row.artifact_name}
                      </div>
                      {row.view_code && (
                        <div style={{ fontSize: 11, color: '#8593A3', fontFamily: 'monospace', marginTop: 2 }}>
                          {row.view_code}
                        </div>
                      )}
                    </div>

                    {/* Surface */}
                    <div style={{ padding: '10px 14px' }}>
                      <StatusBadge status={row.surface_type ?? 'unknown'} label={surfaceLabel(row.surface_type ?? '')} />
                    </div>

                    {/* Status */}
                    <div style={{ padding: '10px 14px' }}>
                      <StatusPill view={row} />
                    </div>

                    {/* Version */}
                    <div style={{ padding: '10px 14px' }}>
                      <VersionChip no={row.latest_version_no ?? 0} />
                    </div>

                    {/* Modified */}
                    <div style={{ padding: '10px 14px', fontSize: 12.5, color: '#8593A3' }}>
                      {relativeDate(row.updated_at)}
                    </div>

                    {/* Actions */}
                    <div
                      style={{ padding: '10px 8px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <ActionMenu items={rowActions(row)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Modal ── */}
      <Modal
        open={creating}
        onClose={() => { setCreating(false); resetForm() }}
        title="Create New View"
        data-testid="create-view-modal"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>View Label *</label>
            <input
              type="text"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="e.g. Sale Order List"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: '0.875rem' }}>Primary Entity *</label>
            {preselectedEntity ? (
              <div style={{
                padding: '0.5rem', border: '1px solid #E7E9ED', borderRadius: 6,
                background: '#F5F6F8', color: '#1A2030', fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                {entityDisplayNames[preselectedEntity] ?? preselectedEntity}
                <span style={{ color: '#8593A3', marginLeft: 6, fontWeight: 400, fontSize: 12 }}>
                  (pre-selected)
                </span>
              </div>
            ) : (
              <Select
                value={newEntity}
                onChange={e => setNewEntity(e.target.value)}
                options={[
                  { value: '', label: 'Select entity…' },
                  ...(entityTypesData?.items ?? []).map(e => ({ value: e.entity_type, label: e.display_name })),
                ]}
              />
            )}
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
              placeholder="e.g. sale_order_list"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6 }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={() => { setCreating(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending}>
              {createMut.isPending ? 'Creating…' : 'Create View'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Archive Confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleArchive}
        title="Archive View"
        message={`Are you sure you want to archive "${deleteTarget?.view_label ?? deleteTarget?.artifact_name}"? This will deactivate the published version.`}
        confirmLabel="Archive"
        danger={true}
      />

      {/* ── Unpublish Confirm ── */}
      <ConfirmDialog
        open={!!confirmUnpublish}
        onClose={() => setConfirmUnpublish(null)}
        onConfirm={handleUnpublish}
        title="Unpublish View"
        message={`Unpublishing "${confirmUnpublish?.view_label}" will revert it to draft status. Users will no longer see the live version.`}
        confirmLabel="Unpublish"
        danger={false}
      />
    </div>
  )
}

export default ViewDesignerListPage
