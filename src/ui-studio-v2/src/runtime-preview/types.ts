// Phase 4 §7 / Phase 5 T8.1.1–T8.1.2 — shared types for runtime-preview

import type { CascadeLevel, OriginState } from "@/domain/types"
import type { ResolvedNode } from "@/services/interfaces"

export interface RuntimeComponentProps {
  node: ResolvedNode
  children?: React.ReactNode
}

export interface LayoutProps {
  layoutType: string
  direction?: string
  gap?: string
  padding?: string
}

export interface RenderTreeNode {
  node: ResolvedNode
  layoutProps?: LayoutProps
  children: RenderTreeNode[]
}

export interface NodeRegistryEntry {
  rect: DOMRectReadOnly
  level: CascadeLevel
  origin: OriginState
  visible: boolean
}

// Phase 4 §7.2 — convert screen-space rect to canvas-coordinate-space
// Overlays (T8.2.x) call this with zoomScale from usePanelsStore
export function toCanvasSpace(
  rect: DOMRectReadOnly,
  zoomScale: number,
): DOMRectReadOnly {
  if (zoomScale === 1) return rect
  const invScale = 1 / zoomScale
  return new DOMRect(
    rect.x * invScale,
    rect.y * invScale,
    rect.width * invScale,
    rect.height * invScale,
  )
}
