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
  const { payload, selectedKey, previewMode, select } = useCanvasStore()
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

  // Preview uses designMode: true so all nodes remain visible to the designer.
  // Nodes with role_in / field_equals / expression conditions are kept in the
  // tree and marked __is_conditional so they render with a dimmed indicator.
  const runtimeTree = useMemo(
    () => tree ? applyRuntimeContext(tree, { designMode: true }) : null,
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
      {/* Click canvas background to deselect */}
      <div className="prev-canvas__frame" onClick={() => select(null)}>
        <RenderNode
          node={runtimeTree}
          selectedKey={selectedKey}
          onEvent={onEvent}
          isPreviewMode={previewMode}
          onSelect={select}
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
  onSelect?: (key: string) => void
}

function RenderNode({ node, selectedKey, onEvent, isPreviewMode, onSelect }: RenderNodeProps) {
  const Renderer = useMemo(() => getRenderer(node.component_code), [node.component_code])
  const isSelected = node.component_key === selectedKey

  // Legacy hidden flag (kept for backwards compatibility with payloads that
  // pre-date the shared runtime helper).
  if (node.props?.__runtime_hidden === true) {
    return null
  }

  // CSS-hidden nodes: remove_from_dom=false — render as display:none so they
  // stay in the DOM but are invisible at runtime.
  const isVisibilityHidden = node.props?.__visibility_hidden === true

  // Conditional indicator: applyRuntimeContext marks nodes __is_conditional
  // when designMode=true. Fall back to checking node.visibility.condition.
  const hasConditionalVisibility =
    node.props?.__is_conditional === true ||
    node.props?.__is_permission_hidden === true ||
    !!(node.visibility as VisibilityRule | undefined)?.condition

  const children = (node.children ?? []).map(child => (
    <RenderNode
      key={child.component_key}
      node={child}
      selectedKey={selectedKey}
      onEvent={onEvent}
      isPreviewMode={isPreviewMode}
      onSelect={onSelect}
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
      style={{
        cursor: onSelect ? 'pointer' : undefined,
        ...(isVisibilityHidden ? { display: 'none' } : {}),
      }}
      onClick={(e) => {
        // Click a component in preview to select it for property editing
        e.stopPropagation()
        onSelect?.(node.component_key)
      }}
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
