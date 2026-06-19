import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Info } from 'lucide-react'
import { SearchInput } from '../../../design-system'
import { useComponentRegistry } from '../../../hooks/useViewStudio'
import { useCanvasStore } from './useCanvasStore'
import type { ComponentRegistryEntry, ComponentCategory, SurfaceType } from '../../../types/viewStudio'
import { SURFACE_TYPE_META } from '../../../types/viewStudio'
import {
  LayoutGrid, Type, MousePointer, Database, Navigation,
  Layers, Box, ToggleLeft,
} from 'lucide-react'
import { ComponentInfoPopover } from './ComponentInfoPopover'
import { COMPONENT_INFO } from './ComponentInfoData'

const CATEGORY_ICONS: Record<string, typeof LayoutGrid> = {
  layout:    LayoutGrid,
  input:     ToggleLeft,
  display:   Type,
  action:    MousePointer,
  data:      Database,
  navigation: Navigation,
  composite: Layers,
  container: Box,
}

const CATEGORY_LABELS: Record<string, string> = {
  layout:    'Layout',
  input:     'Input',
  display:   'Display',
  action:    'Action',
  data:      'Data',
  navigation: 'Navigation',
  composite: 'Composite',
  container: 'Container',
}

const CATEGORY_ORDER: ComponentCategory[] = [
  'layout', 'input', 'display', 'data', 'action', 'navigation', 'composite', 'container',
]

function generateKey(code: string): string {
  return `${code}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

interface InfoTarget {
  entry: ComponentRegistryEntry
  rect: DOMRect
}

function isCompatible(c: ComponentRegistryEntry, surface: SurfaceType | null): boolean {
  if (!surface) return true
  const s = c.supported_surfaces as string[]
  return s.includes('all') || s.includes(surface)
}

export function ComponentPalette() {
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<'compatible' | 'all'>('compatible')
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [infoTarget, setInfoTarget] = useState<InfoTarget | null>(null)

  const { data: components } = useComponentRegistry()
  const { insertNode, payload, canInsertChild, surfaceType, selectedKey, getNode } = useCanvasStore()

  const grouped = useMemo(() => {
    const all = (components ?? []).filter(c => c.component_code !== 'page_root')
    const bySearch = search
      ? all.filter(c =>
          c.component_name.toLowerCase().includes(search.toLowerCase()) ||
          c.component_code.toLowerCase().includes(search.toLowerCase())
        )
      : all

    // Compatible mode: filter by surface type only — no strikethrough, no disabled states.
    // When a specific container is selected, also filter by what that container allows.
    // All mode: show every component without any filtering.
    const filtered = filterMode === 'compatible'
      ? bySearch.filter(c => {
          // 1. Surface compatibility
          if (!isCompatible(c, surfaceType)) return false
          // 2. Parent context — only apply when a specific non-root container is selected
          const selectedNode = selectedKey ? getNode(selectedKey) : null
          const selectedEntry = selectedNode
            ? (components ?? []).find(r => r.component_code === selectedNode.component_code)
            : null
          if (selectedKey && selectedEntry?.is_container) {
            // A container is explicitly selected — filter to what it allows
            return canInsertChild(selectedKey, c.component_code)
          }
          // No specific container selected — show all surface-compatible items
          return true
        })
      : bySearch

    const groups: Record<string, ComponentRegistryEntry[]> = {}
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [components, search, filterMode, surfaceType, selectedKey, canInsertChild, getNode])

  const totalFiltered = useMemo(
    () => Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0),
    [grouped]
  )

  function toggleCategory(cat: string) {
    setCollapsedCats(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function handleDragStart(e: React.DragEvent, component: ComponentRegistryEntry) {
    e.dataTransfer.setData('application/x-component-code', component.component_code)
    e.dataTransfer.setData('application/x-component-name', component.component_name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function handleDoubleClick(component: ComponentRegistryEntry) {
    if (!payload?.component_tree) return
    const parentKey = payload.component_tree.component_key
    if (!canInsertChild(parentKey, component.component_code)) return
    insertNode(parentKey, {
      component_key: generateKey(component.component_code),
      component_code: component.component_code,
      label: component.component_name,
      props: component.default_props as Record<string, unknown>,
      children: component.is_container ? [] : undefined,
    })
  }

  const surfaceLabel = surfaceType
    ? (SURFACE_TYPE_META[surfaceType]?.label ?? surfaceType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
    : null

  return (
    <div className="cp-panel" data-testid="component-palette">

      {/* Search */}
      <div className="cp-panel__search">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search components..."
        />
      </div>

      {/* Surface filter chips */}
      <div className="cp-filter-bar">
        <button
          className={`cp-filter-chip${filterMode === 'all' ? ' cp-filter-chip--active' : ''}`}
          onClick={() => setFilterMode('all')}
        >
          All
        </button>
        <button
          className={`cp-filter-chip${filterMode === 'compatible' ? ' cp-filter-chip--active' : ''}`}
          onClick={() => setFilterMode('compatible')}
          title={surfaceLabel ? `Show only components that work on ${surfaceLabel}` : 'Filter by current surface'}
        >
          {surfaceLabel ? `For ${surfaceLabel}` : 'Compatible'}
        </button>
        <span className="cp-filter-count">{totalFiltered}</span>
      </div>

      {/* Info popover */}
      {infoTarget && (
        <ComponentInfoPopover
          entry={infoTarget.entry}
          info={COMPONENT_INFO[infoTarget.entry.component_code] ?? {
            tagline: infoTarget.entry.component_name,
            description: `A ${infoTarget.entry.category} component.`,
            useCases: [],
            keyProps: [],
            previewTemplate: 'section',
          }}
          anchorRect={infoTarget.rect}
          onClose={() => setInfoTarget(null)}
        />
      )}

      {/* Empty state */}
      {totalFiltered === 0 && (
        <div className="cp-empty">
          {search ? `No components match "${search}"` : 'No compatible components for this surface'}
        </div>
      )}

      {/* Category groups */}
      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null
        const Icon = CATEGORY_ICONS[cat] ?? Box
        const isCollapsed = collapsedCats.has(cat)
        const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown

        return (
          <div key={cat} className={`cp-category${isCollapsed ? ' cp-category--collapsed' : ''}`}>
            <button
              className="cp-category__title"
              onClick={() => toggleCategory(cat)}
              aria-expanded={!isCollapsed}
            >
              <Icon size={12} className="cp-category__icon" />
              <span>{CATEGORY_LABELS[cat] ?? cat}</span>
              <span className="cp-category__count">({items.length})</span>
              <CollapseIcon size={11} className="cp-category__chevron" />
            </button>

            {!isCollapsed && (
              <div className="cp-category__items">
                {items.map(c => {
                  return (
                    <div
                      key={c.component_code}
                      className="cp-item"
                      draggable
                      onDragStart={e => handleDragStart(e, c)}
                      onDoubleClick={() => handleDoubleClick(c)}
                      title={`${c.component_name} — double-click or drag to add`}
                    >
                      <Icon size={14} className="cp-item__icon" />
                      <span className="cp-item__name">{c.component_name}</span>
                      {c.is_container && <span className="cp-item__badge">container</span>}
                      <button
                        className={`cp-item__info-btn${infoTarget?.entry.component_code === c.component_code ? ' cp-item__info-btn--active' : ''}`}
                        onClick={e => {
                          e.stopPropagation()
                          e.preventDefault()
                          const rect = e.currentTarget.getBoundingClientRect()
                          setInfoTarget(prev =>
                            prev?.entry.component_code === c.component_code ? null : { entry: c, rect }
                          )
                        }}
                        aria-label={`Info: ${c.component_name}`}
                        title={`About ${c.component_name}`}
                      >
                        <Info size={11} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
