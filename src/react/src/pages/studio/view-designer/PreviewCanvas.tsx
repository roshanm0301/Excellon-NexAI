/**
 * PreviewCanvas — Live preview renderer for the View Designer
 *
 * Recursively renders the component tree using the ComponentRenderMap.
 * Applies shared runtime rules: visibility (role_in, field_equals) and
 * permission DOM removal (__permissions.hidden_rule).
 */

import { useMemo } from 'react'
import { useCanvasStore } from './useCanvasStore'
import { getRenderer } from './ComponentRenderMap'
import { applyRuntimeContext } from '../../../lib/viewRuntime'
import type { ComponentNode, VisibilityRule } from '../../../types/viewStudio'

// ─── Component ───────────────────────────────────────────────────────────────

export function PreviewCanvas() {
  const { payload, selectedKey } = useCanvasStore()
  const tree = payload?.component_tree

  // Preview uses a neutral context (no role, no field values).
  // Visibility rules that depend on role or field values are shown with a
  // dimmed indicator rather than hidden, because the designer needs to see all
  // nodes regardless of runtime context.
  const runtimeTree = useMemo(
    () => tree ? applyRuntimeContext(tree, {}) : null,
    [tree],
  )

  if (!runtimeTree) {
    return (
      <div className="prev-empty">
        <p>No component tree to preview.</p>
      </div>
    )
  }

  return (
    <div className="prev-canvas">
      <div className="prev-canvas__frame">
        <RenderNode node={runtimeTree} selectedKey={selectedKey} />
      </div>
    </div>
  )
}

// ─── Recursive Renderer ──────────────────────────────────────────────────────

function RenderNode({ node, selectedKey }: { node: ComponentNode; selectedKey: string | null }) {
  const Renderer = useMemo(() => getRenderer(node.component_code), [node.component_code])
  const isSelected = node.component_key === selectedKey

  // Nodes returned by applyRuntimeContext have already had hidden/permission
  // nodes removed. The __runtime_hidden flag is the legacy path kept for
  // backwards compatibility with payloads that pre-date the shared runtime.
  if (node.props?.__runtime_hidden === true) {
    return null
  }

  // Visibility rule indicator for preview (role_in / field_equals nodes are
  // visible in the canvas but dimmed so the designer can select and configure them).
  const hasConditionalVisibility = !!(node.visibility as VisibilityRule | undefined)?.condition

  const children = (node.children ?? []).map(child => (
    <RenderNode key={child.component_key} node={child} selectedKey={selectedKey} />
  ))

  return (
    <div
      className={[
        'prev-node',
        isSelected ? 'prev-node--selected' : '',
        hasConditionalVisibility ? 'prev-node--conditional' : '',
        node.props?.__read_only ? 'prev-node--read-only' : '',
      ].filter(Boolean).join(' ')}
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
