/**
 * RuntimePreviewCanvas — Standalone runtime renderer for published views.
 *
 * Unlike the designer's PreviewCanvas (which reads from useCanvasStore),
 * this component accepts a ViewPayload directly as a prop. It is used by
 * the Screens section to render published views outside the designer shell.
 *
 * Key differences from PreviewCanvas:
 * - No useCanvasStore dependency
 * - designMode: false — visibility/permission rules are actually enforced
 * - Accepts role and fieldValues for runtime context
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { getRenderer } from '../../pages/studio/view-designer/ComponentRenderMap'
import { applyRuntimeContext } from '../../lib/viewRuntime'
import { ViewEventEngine, type EventEngineError } from '../../lib/viewEventEngine'
import type { ComponentNode, ViewPayload, EventType, VisibilityRule } from '../../types/viewStudio'

// ─── Types ────────────────────────────────────────────────────────────────────

type OnEventFn = (
  eventType: EventType,
  sourceKey: string,
  data?: Record<string, unknown>,
) => void

export interface RuntimePreviewCanvasProps {
  payload: ViewPayload
  /** User role for permission resolution. Defaults to empty (no restrictions). */
  role?: string
  /** Current field values for field_equals visibility conditions. */
  fieldValues?: Record<string, unknown>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RuntimePreviewCanvas({
  payload,
  role = '',
  fieldValues = {},
}: RuntimePreviewCanvasProps) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const engineRef = useRef<ViewEventEngine | null>(null)

  // Instantiate the event engine for this view session
  useEffect(() => {
    const engine = new ViewEventEngine(payload.events ?? [])
    const unsub = engine.onError((err: EventEngineError) => {
      console.warn('[RuntimeCanvas] EventEngineError:', err.message)
    })
    engineRef.current = engine
    return () => {
      unsub()
      engine.destroy()
      engineRef.current = null
    }
  }, [payload.events])

  const onEvent = useCallback<OnEventFn>((eventType, sourceKey, data) => {
    if (!engineRef.current) return
    void engineRef.current.emit({ type: eventType, source_key: sourceKey, data })
  }, [])

  // Apply runtime context with designMode: false — actually hide/remove
  // nodes that fail visibility or permission rules.
  const runtimeTree = useMemo(
    () => payload.component_tree
      ? applyRuntimeContext(payload.component_tree, { role, fieldValues, designMode: false })
      : null,
    [payload.component_tree, role, fieldValues],
  )

  if (!runtimeTree) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#94a3b8', fontSize: '0.85rem' }}>
        No content to display.
      </div>
    )
  }

  return (
    <div className="prev-canvas">
      <div className="prev-canvas__frame" onClick={() => setSelectedKey(null)}>
        <RuntimeRenderNode
          node={runtimeTree}
          selectedKey={selectedKey}
          onEvent={onEvent}
          isPreviewMode={true}
          onSelect={setSelectedKey}
        />
      </div>
    </div>
  )
}

// ─── Recursive Renderer ───────────────────────────────────────────────────────

interface RuntimeRenderNodeProps {
  node: ComponentNode
  selectedKey: string | null
  onEvent: OnEventFn
  isPreviewMode: boolean
  onSelect?: (key: string) => void
}

function RuntimeRenderNode({
  node,
  selectedKey,
  onEvent,
  isPreviewMode,
  onSelect,
}: RuntimeRenderNodeProps) {
  const Renderer = useMemo(() => getRenderer(node.component_code), [node.component_code])
  const isSelected = node.component_key === selectedKey

  // Legacy hidden flag
  if (node.props?.__runtime_hidden === true) return null

  // CSS-only hidden nodes (remove_from_dom: false)
  const isVisibilityHidden = node.props?.__visibility_hidden === true

  // Conditional indicator (not shown at runtime — designMode: false means nodes
  // were actually removed, so __is_conditional shouldn't appear here)
  const hasConditionalVisibility =
    node.props?.__is_conditional === true ||
    !!(node.visibility as VisibilityRule | undefined)?.condition

  const children = (node.children ?? []).map(child => (
    <RuntimeRenderNode
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
