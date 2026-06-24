// Phase 5 T8.2.1 — CanvasOverlay: container for all overlay layers
// Positioned absolutely over the canvas viewport. pointer-events: none
// so clicks pass through to the rendered content.

import { memo } from "react"
import Box from "@mui/material/Box"
import { SelectionLayer } from "./SelectionLayer"
import { DropTargetLayer } from "./DropTargetLayer"
import { OriginBadgeLayer } from "./OriginBadgeLayer"
import type { DropItem } from "./DropTargetLayer"

interface CanvasOverlayProps {
  containerEl: HTMLElement
  onDrop: (sectionKey: string, item: DropItem) => void
}

export const CanvasOverlay = memo(function CanvasOverlay({
  containerEl,
  onDrop,
}: CanvasOverlayProps) {
  return (
    <Box
      data-testid="canvas-overlay"
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <DropTargetLayer containerEl={containerEl} onDrop={onDrop} />
      <SelectionLayer containerEl={containerEl} />
      <OriginBadgeLayer containerEl={containerEl} />
    </Box>
  )
})
