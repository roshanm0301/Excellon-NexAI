/**
 * PreviewCanvas — Live preview renderer for the View Designer
 *
 * Recursively renders the component tree using the ComponentRenderMap.
 * Applies shared runtime rules: visibility (role_in, field_equals) and
 * permission DOM removal (__permissions.hidden_rule).
 *
 * Phase 4: an event engine is instantiated per preview session. Component
 * renderers receive an onEvent callback so they can fire events. Engine
 * errors are reported via console.warn (preview context, not production).
 */

import { useMemo, useEffect, useCallback, useRef } from 'react'
import { useCanvasStore } from './useCanvasStore'
import { getRenderer } from './ComponentRenderMap'
import { applyRuntimeContext } from '../../../lib/viewRuntime'
import { ViewEventEngine, EventEngineError } from '../../../lib/viewEventEngine'
import type { ComponentNode, VisibilityRule, EventType } from '../../../types/viewStudio'

// ─── onEvent callback type ────────────────────────────────────────────────────

export type OnEventFn = (
  eventType: EventType,
  sourceKey: string,
  data?: Record<string, unknown>,
) => void

// ─── Component ───────────────────────────────────────────────────────────────

export function PreviewCanvas() {
  const { payload, selectedKey, previewMode } = useCanvasStore()
  const tree = payload?.component_tree

  // Instantiate a per-session event engine; recreate when event definitions change
  const engineRef = useRef<ViewEventEngine | null>(null)

  useEffect(() => {
    const engine = new ViewEventEngine(payload?.events ?? [])

    // Subscribe to engine errors and surface them as console warnings in preview
    const unsub = engine.onError((err: EventEngineError) => {
      console.warn('[PreviewCanvas] EventEngineError:', err.message)
    })

    engineRef.current = engine

    return () => {
      unsub()
      engine.destroy()
      engineRef.current = null
    }
  }, [payload?.events])

  // Update engine definitions when they change without recreating the engine
  useEffect(() => {
    if (engineRef.current && payload?.events) {
      engineRef.current.setDefinitions(payload.events)
    }
  }, [payload?.events])

  const onEvent = useCallback<OnEventFn>((eventType, sourceKey, data) => {
    if (!engineRef.current) return
    void engineRef.current.emit({ type: eventType, source_key: sourceKey, data })
  }, [])

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
        <RenderNode
          node={runtimeTree}
          selectedKey={selectedKey}
          onEvent={onEvent}
          isPreviewMode={previewMode}
        />
      </div>
    </div>
  )
}

// ─── Recursive Renderer ──────────────────────────────────────────────────────

interface RenderNodeProps {
  node: ComponentNode
  selectedKey: string | null
  onEvent: OnEventFn
  isPreviewMode: boolean
}

function RenderNode({ node, selectedKey, onEvent, isPreviewMode }: RenderNodeProps) {
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
    <RenderNode
      key={child.component_key}
      node={child}
      selectedKey={selectedKey}
      onEvent={onEvent}
      isPreviewMode={isPreviewMode}
    />
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
        onEvent={onEvent}
        isPreviewMode={isPreviewMode}
      >
        {children}
      </Renderer>
    </div>
  )
}

export default PreviewCanvas
