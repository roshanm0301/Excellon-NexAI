import { useState, useMemo } from 'react'
import { SearchInput } from '../../../design-system'
import { useComponentRegistry } from '../../../hooks/useViewStudio'
import { useCanvasStore } from './useCanvasStore'
import type { ComponentRegistryEntry, ComponentCategory } from '../../../types/viewStudio'
import {
  LayoutGrid, Type, MousePointer, Database, Navigation,
  Layers, Box, ToggleLeft,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, typeof LayoutGrid> = {
  layout: LayoutGrid,
  input: ToggleLeft,
  display: Type,
  action: MousePointer,
  data: Database,
  navigation: Navigation,
  composite: Layers,
  container: Box,
}

const CATEGORY_ORDER: ComponentCategory[] = [
  'layout', 'input', 'display', 'data', 'action', 'navigation', 'composite', 'container',
]

function generateKey(code: string): string {
  return `${code}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
}

export function ComponentPalette() {
  const [search, setSearch] = useState('')
  const { data: components } = useComponentRegistry()
  const { insertNode, payload, canInsertChild } = useCanvasStore()

  const grouped = useMemo(() => {
    const items = components ?? []
    const filtered = search
      ? items.filter(c =>
          c.component_name.toLowerCase().includes(search.toLowerCase()) ||
          c.component_code.toLowerCase().includes(search.toLowerCase())
        )
      : items

    const groups: Record<string, ComponentRegistryEntry[]> = {}
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    }
    return groups
  }, [components, search])

  function handleDragStart(e: React.DragEvent, component: ComponentRegistryEntry) {
    e.dataTransfer.setData('application/x-component-code', component.component_code)
    e.dataTransfer.setData('application/x-component-name', component.component_name)
    e.dataTransfer.effectAllowed = 'copy'
  }

  function handleDoubleClick(component: ComponentRegistryEntry) {
    if (!payload) return
    // Insert at page_root if nothing selected, or at the root
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

  return (
    <div className="cp-panel" data-testid="component-palette">
      <div className="cp-panel__search">
        <SearchInput
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search components..."
        />
      </div>

      {CATEGORY_ORDER.map(cat => {
        const items = grouped[cat]
        if (!items || items.length === 0) return null
        const Icon = CATEGORY_ICONS[cat] ?? Box
        return (
          <div key={cat} className="cp-category">
            <div className="cp-category__title">
              {cat} ({items.length})
            </div>
            <div className="cp-category__items">
              {items.map(c => {
                const rootKey = payload?.component_tree.component_key ?? ''
                const rootAllowed = !rootKey || canInsertChild(rootKey, c.component_code)
                return (
                  <div
                    key={c.component_code}
                    className={`cp-item${rootAllowed ? '' : ' cp-item--disabled'}`}
                    draggable={rootAllowed}
                    onDragStart={(e) => rootAllowed ? handleDragStart(e, c) : e.preventDefault()}
                    onDoubleClick={() => rootAllowed && handleDoubleClick(c)}
                    title={rootAllowed
                      ? `${c.component_name} — double-click or drag to add`
                      : `${c.component_name} — cannot be placed here`}
                    aria-disabled={!rootAllowed}
                  >
                    <Icon size={14} className="cp-item__icon" />
                    <span className="cp-item__name">{c.component_name}</span>
                    {c.is_container && <span className="cp-item__badge">container</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
