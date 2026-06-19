import { useMemo, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  LayoutGrid, Search, Plus,
  List, Table2, FileText, LayoutDashboard, GitMerge, FileEdit, PanelLeft, Trello, Calendar, Layout,
} from 'lucide-react'
import {
  Button, StatusBadge, Select, Modal, ConfirmDialog,
  ActionMenu, useToast,
  type ActionMenuItem,
} from '../../design-system'
import {
  useViews, useArchiveView, useCreateView, useEntityTypes, useViewStats,
  usePublishViewById, useDuplicateView, useUnpublishView, useDeleteViewPermanently,
} from '../../hooks/useViewStudio'
import type { View, SurfaceType, CreateViewRequest } from '../../types/viewStudio'
import { SURFACE_TYPES, SURFACE_TYPE_META } from '../../types/viewStudio'
import { applyTemplate } from '../../templates'

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

const surfaceLabel = (s: string) => SURFACE_TYPE_META[s as SurfaceType]?.label ?? s.replace(/_/g, ' ')

// Icon map — avoids dynamic import
const SURFACE_ICONS: Record<SurfaceType, React.ComponentType<{ size?: number; color?: string }>> = {
  standard_crud: List,
  advanced_crud: Table2,
  header_line:   FileText,
  dashboard:     LayoutDashboard,
  wizard:        GitMerge,
  detail_page:   FileEdit,
  split_view:    PanelLeft,
  kanban:        Trello,
  calendar:      Calendar,
  custom_page:   Layout,
}

function suggestName(entity: string, surface: SurfaceType, displayNames: Record<string, string>): string {
  const eName = displayNames[entity] ?? entity.replace(/_/g, ' ')
  const sLabel = SURFACE_TYPE_META[surface].label
  return eName ? `${eName} ${sLabel}` : sLabel
}

function toViewCode(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

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
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<View | null>(null)
  const [confirmUnpublish, setConfirmUnpublish] = useState<View | null>(null)
  const [creating, setCreating] = useState(false)
  const [preselectedEntity, setPreselectedEntity] = useState<string | null>(null)

  // Create form state
  const [newLabel, setNewLabel] = useState('')
  const [newSurface, setNewSurface] = useState<SurfaceType>('standard_crud')
  const [newEntity, setNewEntity] = useState('')
  const [newCode, setNewCode] = useState('')
  const [nameAutoSet, setNameAutoSet] = useState(true) // false once user manually edits name

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
  const deletePermanentlyMut = useDeleteViewPermanently()
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

  // Auto-update name/code when surface or entity changes, unless user already typed a name
  useEffect(() => {
    if (!creating || !nameAutoSet) return
    const suggested = suggestName(newEntity, newSurface, entityDisplayNames)
    setNewLabel(suggested)
    setNewCode(toViewCode(suggested))
  }, [newSurface, newEntity, creating, nameAutoSet, entityDisplayNames])

  function openCreate(preEntity?: string) {
    setPreselectedEntity(preEntity ?? null)
    setNewEntity(preEntity ?? '')
    setNewLabel('')
    setNewSurface('standard_crud')
    setNewCode('')
    setNameAutoSet(true)
    setCreating(true)
  }

  function resetForm() {
    setNewLabel('')
    setNewSurface('standard_crud')
    setNewEntity('')
    setNewCode('')
    setNameAutoSet(true)
    setPreselectedEntity(null)
  }

  function handleCreate() {
    const entityRequired = SURFACE_TYPE_META[newSurface].requiresEntity
    if (!newLabel.trim()) {
      error('Validation', 'View name is required')
      return
    }
    if (entityRequired && !newEntity.trim()) {
      error('Validation', `Primary entity is required for a ${SURFACE_TYPE_META[newSurface].label}`)
      return
    }
    if (!newCode.trim()) {
      error('Validation', 'View code is required')
      return
    }
    const template = applyTemplate(newSurface, newEntity.trim() || 'record')
    const req: CreateViewRequest = {
      view_label: newLabel.trim(),
      surface_type: newSurface,
      primary_entity: newEntity.trim() || undefined,
      view_code: newCode.trim(),
      payload: template,
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

  function handlePermanentDelete() {
    if (!permanentDeleteTarget) return
    deletePermanentlyMut.mutate(permanentDeleteTarget.artifact_id, {
      onSuccess: () => {
        success('Deleted', `${permanentDeleteTarget.view_label ?? permanentDeleteTarget.artifact_name} permanently deleted`)
        setPermanentDeleteTarget(null)
      },
      onError: () => error('Failed', 'Could not delete view'),
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
        label: 'Open',
        onClick: () => navigate(`/studio/views/${row.artifact_id}/run`),
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
        label: 'Archive',
        onClick: () => setDeleteTarget(row),
      },
      {
        label: 'Delete Permanently',
        variant: 'danger' as const,
        onClick: () => setPermanentDeleteTarget(row),
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
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openCreate(selectedEntity && selectedEntity !== '__unassigned__' ? selectedEntity : undefined)}>
              New View
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
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => openCreate(selectedEntity)}>
                    New View
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
        title={preselectedEntity
          ? `New ${entityDisplayNames[preselectedEntity] ?? preselectedEntity.replace(/_/g, ' ')} View`
          : 'Create New View'
        }
        size="lg"
        data-testid="create-view-modal"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setCreating(false); resetForm() }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} loading={createMut.isPending}>Create View</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.25rem 0' }}>

          {/* ── Surface Type card grid (3 columns) ── */}
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#1A2030' }}>
              Surface Type <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: 8, maxHeight: 340, overflowY: 'auto',
            }}>
              {SURFACE_TYPES.map(s => {
                const meta = SURFACE_TYPE_META[s]
                const Icon = SURFACE_ICONS[s]
                const selected = newSurface === s
                const disabled = meta.disabled
                return (
                  <button
                    key={s}
                    data-testid={`surface-card-${s}`}
                    aria-disabled={disabled ? 'true' : undefined}
                    onClick={() => { if (!disabled) setNewSurface(s) }}
                    style={{
                      position: 'relative',
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      gap: 4, padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                      border: selected ? '2px solid #EB6A2C' : '1.5px solid #E7E9ED',
                      background: selected ? '#FCEBE3' : disabled ? '#F9FAFB' : '#fff',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.45 : 1,
                      transition: 'border-color 100ms, background 100ms',
                    }}
                    onMouseEnter={e => { if (!disabled && !selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#C5C9D1' }}
                    onMouseLeave={e => { if (!disabled && !selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#E7E9ED' }}
                  >
                    {disabled && (
                      <span style={{
                        position: 'absolute', top: 6, right: 6,
                        background: '#E7E9ED', color: '#8593A3',
                        borderRadius: 20, padding: '1px 7px', fontSize: 9.5, fontWeight: 700,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>Soon</span>
                    )}
                    <Icon size={18} color={selected ? '#C04910' : '#586A70'} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: selected ? '#C04910' : '#1A2030' }}>
                      {meta.label}
                    </span>
                    <span style={{ fontSize: 11, color: '#8593A3', lineHeight: 1.4 }}>
                      {meta.description}
                    </span>
                    <span style={{
                      marginTop: 2, fontSize: 10, fontWeight: 600,
                      color: meta.requiresEntity ? '#E53E3E' : '#22A06B',
                    }}>
                      {meta.requiresEntity ? '• Requires entity' : '• Entity optional'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Primary Entity — hidden when locked via preselectedEntity (shown in modal title instead) ── */}
          {!preselectedEntity && (
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#1A2030' }}>
                Primary Entity
                {SURFACE_TYPE_META[newSurface].requiresEntity
                  ? <span style={{ color: '#E53E3E', marginLeft: 3 }}>*</span>
                  : <span style={{ color: '#8593A3', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>(optional)</span>
                }
              </label>
              <Select
                value={newEntity}
                onChange={e => setNewEntity(e.target.value)}
                options={[
                  { value: '', label: SURFACE_TYPE_META[newSurface].requiresEntity ? 'Select entity…' : 'Select entity (optional)…' },
                  ...(entityTypesData?.items ?? []).map(e => ({ value: e.entity_type, label: e.display_name })),
                ]}
              />
              {newEntity && (
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: '#8593A3' }}>
                  Use for: {SURFACE_TYPE_META[newSurface].example}
                </p>
              )}
            </div>
          )}

          {/* ── View Name ── */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#1A2030' }}>
              View Name <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={e => {
                setNewLabel(e.target.value)
                setNameAutoSet(false) // user is typing — stop auto-updating name
                setNewCode(toViewCode(e.target.value))
              }}
              placeholder={suggestName(newEntity || 'my_entity', newSurface, entityDisplayNames)}
              style={{
                width: '100%', padding: '7px 10px', fontSize: 13,
                border: '1.5px solid #E7E9ED', borderRadius: 8, outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#EB6A2C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E7E9ED')}
            />
          </div>

          {/* ── View Code ── */}
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#1A2030' }}>
              View Code <span style={{ color: '#E53E3E' }}>*</span>
            </label>
            <input
              type="text"
              value={newCode}
              onChange={e => setNewCode(e.target.value)}
              placeholder="e.g. sale_order_list"
              style={{
                width: '100%', padding: '7px 10px', fontSize: 13, fontFamily: 'monospace',
                border: '1.5px solid #E7E9ED', borderRadius: 8, outline: 'none',
                boxSizing: 'border-box', color: '#586A70',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#EB6A2C')}
              onBlur={e => (e.currentTarget.style.borderColor = '#E7E9ED')}
            />
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
        loading={archiveMut.isPending}
      />

      {/* ── Permanent Delete Confirm ── */}
      <ConfirmDialog
        open={!!permanentDeleteTarget}
        onClose={() => setPermanentDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Delete View Permanently"
        message={`This will permanently delete "${permanentDeleteTarget?.view_label ?? permanentDeleteTarget?.artifact_name}" and all its versions. This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger={true}
        loading={deletePermanentlyMut.isPending}
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
