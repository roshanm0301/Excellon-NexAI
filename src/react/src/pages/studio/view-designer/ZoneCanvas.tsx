import { useState, useCallback } from 'react'
import {
  Plus, ChevronRight, ChevronDown,
  LayoutGrid, Type, MousePointer, Database, Navigation,
  Layers, Box, ToggleLeft,
} from 'lucide-react'
import { useCanvasStore } from './useCanvasStore'
import { useComponentRegistry } from '../../../hooks/useViewStudio'
import type { ComponentNode, ComponentRegistryEntry, FieldBinding } from '../../../types/viewStudio'
import { FIELD_TYPE_TO_COMPONENT, type FieldDragData } from './EntityFieldPicker'

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  layout: LayoutGrid,
  input: ToggleLeft,
  display: Type,
  action: MousePointer,
  data: Database,
  navigation: Navigation,
  composite: Layers,
  container: Box,
}

function getComponentIcon(code: string, registry: ComponentRegistryEntry[]) {
  const entry = registry.find(r => r.component_code === code)
  const cat = entry?.category ?? 'layout'
  return CATEGORY_ICONS[cat] ?? Box
}

function formatLabel(code: string) {
  return code.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ─── ZoneCanvas ───────────────────────────────────────────────────────────────

export function ZoneCanvas() {
  const {
    payload, selectedKey, hoveredKey, primaryEntity,
    select, hover, insertNode, updateNodeBindings, canInsertChild,
  } = useCanvasStore()
  const { data: registry = [] } = useComponentRegistry()

  // Track which containers are expanded (pre-expand level-1 children of page_root)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const root = payload?.component_tree
    const initial = new Set<string>()
    if (root) {
      for (const child of root.children ?? []) {
        initial.add(child.component_key)
      }
    }
    return initial
  })

  // Drop state: which key is being hovered as a drop target
  const [dropTarget, setDropTarget] = useState<{ key: string; valid: boolean } | null>(null)

  const toggleExpand = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // Drag-drop handlers for a zone/container body
  function makeDragOver(targetKey: string) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const isField = e.dataTransfer.types.includes('application/x-entity-field')
      const code = e.dataTransfer.types.includes('application/x-component-code')
        ? e.dataTransfer.getData('application/x-component-code')
        : ''
      // For field drops, assume valid (we don't know the component code until drop)
      const valid = isField ? true : (code ? canInsertChild(targetKey, code) : true)
      e.dataTransfer.dropEffect = valid ? 'copy' : 'none'
      setDropTarget({ key: targetKey, valid })
    }
  }

  function makeDragLeave() {
    return (e: React.DragEvent) => {
      e.stopPropagation()
      setDropTarget(null)
    }
  }

  function makeDrop(targetKey: string) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDropTarget(null)

      // ── Field drop (from EntityFieldPicker) ──────────────────────────────
      const fieldDataRaw = e.dataTransfer.getData('application/x-entity-field')
      if (fieldDataRaw) {
        let fieldData: FieldDragData
        try { fieldData = JSON.parse(fieldDataRaw) } catch { return }
        const componentCode = FIELD_TYPE_TO_COMPONENT[fieldData.field_type] ?? 'text_input'
        if (!canInsertChild(targetKey, componentCode)) return
        const newKey = `${componentCode}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
        insertNode(targetKey, {
          component_key: newKey,
          component_code: componentCode,
          label: fieldData.label,
          props: { label: fieldData.label },
          children: [],
        })
        // Set initial binding — NOT the binding editor, just initial data on creation
        const binding: FieldBinding = {
          source: 'field',
          entity: primaryEntity ?? undefined,
          field_key: fieldData.field_key,
        }
        updateNodeBindings(newKey, { value: binding })
        return
      }

      // ── Component drop (from ComponentPalette) ───────────────────────────
      const code = e.dataTransfer.getData('application/x-component-code')
      const name = e.dataTransfer.getData('application/x-component-name')
      if (!code) return
      if (!canInsertChild(targetKey, code)) return
      const newKey = `${code}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
      insertNode(targetKey, {
        component_key: newKey,
        component_code: code,
        label: name || formatLabel(code),
        props: {},
        children: [],
      })
    }
  }

  const root = payload?.component_tree
  if (!root) return null

  const zones = root.children ?? []

  // Empty canvas
  if (zones.length === 0) {
    return (
      <div
        className="zc-canvas"
        data-testid="zone-canvas"
        onClick={() => select(null)}
        onDragOver={makeDragOver(root.component_key)}
        onDragLeave={makeDragLeave()}
        onDrop={makeDrop(root.component_key)}
      >
        <div className={`zc-empty${dropTarget?.key === root.component_key ? (dropTarget.valid ? ' zc-empty--drop-valid' : ' zc-empty--drop-invalid') : ''}`}>
          <LayoutGrid size={32} />
          <p>Drag components from the <strong>Library</strong> tab to start building</p>
          <small>or drag entity fields from the <strong>Fields</strong> tab</small>
        </div>
      </div>
    )
  }

  return (
    <div
      className="zc-canvas"
      data-testid="zone-canvas"
      onClick={() => select(null)}
      onDragOver={makeDragOver(root.component_key)}
      onDragLeave={makeDragLeave()}
      onDrop={makeDrop(root.component_key)}
    >
      {zones.map(zone => (
        <ZoneCard
          key={zone.component_key}
          node={zone}
          registry={registry}
          selectedKey={selectedKey}
          hoveredKey={hoveredKey}
          expanded={expanded}
          dropTarget={dropTarget}
          onSelect={select}
          onHover={hover}
          onToggleExpand={toggleExpand}
          onDragOver={makeDragOver}
          onDragLeave={makeDragLeave}
          onDrop={makeDrop}
          canInsertChild={canInsertChild}
          insertNode={insertNode}
        />
      ))}
      {/* Drop zone at page_root level — for Toolbar, Drawer, Side Panel etc. */}
      <div
        className={`zc-root-drop${dropTarget?.key === root.component_key ? (dropTarget.valid ? ' zc-root-drop--valid' : ' zc-root-drop--invalid') : ''}`}
        data-testid="zone-root-drop"
      >
        Drop here to add a new top-level zone (Toolbar, Drawer, Side Panel…)
      </div>
    </div>
  )
}

// ─── ZoneCard ─────────────────────────────────────────────────────────────────

interface ZoneCardProps {
  node: ComponentNode
  registry: ComponentRegistryEntry[]
  selectedKey: string | null
  hoveredKey: string | null
  expanded: Set<string>
  dropTarget: { key: string; valid: boolean } | null
  onSelect: (key: string | null) => void
  onHover: (key: string | null) => void
  onToggleExpand: (key: string) => void
  onDragOver: (key: string) => (e: React.DragEvent) => void
  onDragLeave: () => (e: React.DragEvent) => void
  onDrop: (key: string) => (e: React.DragEvent) => void
  canInsertChild: (parentKey: string, childCode: string) => boolean
  insertNode: (parentKey: string, node: ComponentNode, index?: number) => void
}

function ZoneCard({
  node, registry, selectedKey, hoveredKey, expanded, dropTarget,
  onSelect, onHover, onToggleExpand,
  onDragOver, onDragLeave, onDrop,
}: ZoneCardProps) {
  const isDropping = dropTarget?.key === node.component_key
  const isValid = isDropping && dropTarget?.valid

  let bodyClass = 'zc-zone__body'
  if (isDropping) bodyClass += isValid ? ' zc-zone__body--drop-valid' : ' zc-zone__body--drop-invalid'

  const children = node.children ?? []

  return (
    <div className="zc-zone" data-testid="zone-card">
      <div className="zc-zone__header">
        <span className="zc-zone__label">{node.label || formatLabel(node.component_code)}</span>
        <span className="zc-zone__type">{node.component_code}</span>
      </div>
      <div
        className={bodyClass}
        data-testid="zone-body"
        onDragOver={onDragOver(node.component_key)}
        onDragLeave={onDragLeave()}
        onDrop={onDrop(node.component_key)}
      >
        {children.length === 0
          ? <div className="zc-zone__empty">Drop components here</div>
          : children.map(child => (
              <ComponentBlock
                key={child.component_key}
                node={child}
                depth={0}
                registry={registry}
                selectedKey={selectedKey}
                hoveredKey={hoveredKey}
                expanded={expanded}
                dropTarget={dropTarget}
                onSelect={onSelect}
                onHover={onHover}
                onToggleExpand={onToggleExpand}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              />
            ))
        }
      </div>
    </div>
  )
}

// ─── ComponentBlock ───────────────────────────────────────────────────────────

interface ComponentBlockProps {
  node: ComponentNode
  depth: number
  registry: ComponentRegistryEntry[]
  selectedKey: string | null
  hoveredKey: string | null
  expanded: Set<string>
  dropTarget: { key: string; valid: boolean } | null
  onSelect: (key: string | null) => void
  onHover: (key: string | null) => void
  onToggleExpand: (key: string) => void
  onDragOver: (key: string) => (e: React.DragEvent) => void
  onDragLeave: () => (e: React.DragEvent) => void
  onDrop: (key: string) => (e: React.DragEvent) => void
}

function ComponentBlock({
  node, depth, registry, selectedKey, hoveredKey, expanded, dropTarget,
  onSelect, onHover, onToggleExpand, onDragOver, onDragLeave, onDrop,
}: ComponentBlockProps) {
  const isSelected = selectedKey === node.component_key
  const isHovered = hoveredKey === node.component_key
  const entry = registry.find(r => r.component_code === node.component_code)
  const isContainer = entry?.is_container ?? (node.children && node.children.length > 0)
  const hasChildren = (node.children ?? []).length > 0
  const isExpanded = expanded.has(node.component_key)
  const isDropping = dropTarget?.key === node.component_key

  const Icon = getComponentIcon(node.component_code, registry)

  let blockClass = 'zc-block'
  if (isSelected) blockClass += ' zc-block--selected'
  else if (isHovered) blockClass += ' zc-block--hovered'
  if (depth > 0) blockClass += ' zc-block--indented'

  let containerClass = 'zc-container'
  if (isDropping) {
    containerClass += dropTarget?.valid ? ' zc-container--drop-valid' : ' zc-container--drop-invalid'
  }

  return (
    <div style={{ marginLeft: depth > 0 ? `${depth * 16}px` : undefined }}>
      <div
        className={blockClass}
        data-testid="zc-block"
        onClick={(e) => { e.stopPropagation(); onSelect(node.component_key) }}
        onMouseEnter={() => onHover(node.component_key)}
        onMouseLeave={() => onHover(null)}
      >
        {isContainer && (
          <button
            className="zc-block__expand"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.component_key) }}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        )}
        {!isContainer && <span className="zc-block__expand-spacer" />}
        <Icon size={13} className="zc-block__icon" />
        <span className="zc-block__label">{node.label || formatLabel(node.component_code)}</span>
        <span className="zc-block__key">{node.component_key}</span>
      </div>

      {/* Children — only render if container, has children, and is expanded */}
      {isContainer && hasChildren && isExpanded && (
        <div
          className={containerClass}
          onDragOver={onDragOver(node.component_key)}
          onDragLeave={onDragLeave()}
          onDrop={onDrop(node.component_key)}
        >
          {(node.children ?? []).map(child => (
            <ComponentBlock
              key={child.component_key}
              node={child}
              depth={depth + 1}
              registry={registry}
              selectedKey={selectedKey}
              hoveredKey={hoveredKey}
              expanded={expanded}
              dropTarget={dropTarget}
              onSelect={onSelect}
              onHover={onHover}
              onToggleExpand={onToggleExpand}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
            />
          ))}
        </div>
      )}
    </div>
  )
}
