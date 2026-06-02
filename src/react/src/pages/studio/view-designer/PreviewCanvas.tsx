/**
 * PreviewCanvas — Live preview renderer for the View Designer
 *
 * Recursively renders the component tree using the ComponentRenderMap
 * to produce a WYSIWYG preview of the configured view.
 */

import { useMemo } from 'react'
import { useCanvasStore } from './useCanvasStore'
import { getRenderer } from './ComponentRenderMap'
import type { ComponentNode } from '../../../types/viewStudio'

// ─── Component ───────────────────────────────────────────────────────────────

export function PreviewCanvas() {
  const { payload, selectedKey } = useCanvasStore()
  const tree = payload?.component_tree

  if (!tree) {
    return (
      <div className="prev-empty">
        <p>No component tree to preview.</p>
      </div>
    )
  }

  return (
    <div className="prev-canvas">
      <div className="prev-canvas__frame">
        <RenderNode node={tree} selectedKey={selectedKey} />
      </div>
    </div>
  )
}

// ─── Recursive Renderer ──────────────────────────────────────────────────────

function RenderNode({ node, selectedKey }: { node: ComponentNode; selectedKey: string | null }) {
  const Renderer = useMemo(() => getRenderer(node.component_code), [node.component_code])
  const isSelected = node.component_key === selectedKey

  // Check visibility (skip hidden nodes in preview)
  if (node.visibility) {
    if (node.visibility.condition === 'role_in') {
      // In preview, show with indicator
    }
    // For expression/field_equals, we show in preview with dimming
  }

  const children = (node.children ?? []).map(child => (
    <RenderNode key={child.component_key} node={child} selectedKey={selectedKey} />
  ))

  return (
    <div
      className={`prev-node ${isSelected ? 'prev-node--selected' : ''}`}
      data-component-key={node.component_key}
    >
      <Renderer
        node={node}
        isSelected={isSelected}
      >
        {children}
      </Renderer>
    </div>
  )
}

export default PreviewCanvas
