// Phase 5 T8.2.1 — shared types for overlay layers

export interface OverlayRect {
  left: number
  top: number
  width: number
  height: number
}

export function toOverlayRect(
  nodeRect: DOMRectReadOnly,
  containerRect: DOMRectReadOnly,
): OverlayRect {
  return {
    left: nodeRect.left - containerRect.left,
    top: nodeRect.top - containerRect.top,
    width: nodeRect.width,
    height: nodeRect.height,
  }
}
