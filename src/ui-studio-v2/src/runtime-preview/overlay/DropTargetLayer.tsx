// Phase 5 T8.2.1 + T8.3.1 — DropTargetLayer: drop zones for DnD insertion
// Shows drop indicators over section nodes when dragging from Asset Library

import { memo, useCallback } from "react"
import { useDrop } from "react-dnd"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import { DND_TYPES } from "@/features/asset-library"
import { useRegistrySnapshot } from "@/runtime-preview/useNodeRegistryHooks"
import type { NodeRegistryEntry } from "@/runtime-preview/types"
import { toOverlayRect } from "./types"

interface DropTargetLayerProps {
  containerEl: HTMLElement
  onDrop: (sectionKey: string, item: DropItem) => void
}

export interface DropItem {
  semanticType: string
  kind: string
  defaultProps: Record<string, unknown>
}

interface SectionDropZoneProps {
  logicalKey: string
  entry: NodeRegistryEntry
  containerRect: DOMRect
  onDrop: (sectionKey: string, item: DropItem) => void
}

function SectionDropZone({
  logicalKey,
  entry,
  containerRect,
  onDrop,
}: SectionDropZoneProps) {
  const handleDrop = useCallback(
    (item: DropItem) => { onDrop(logicalKey, item) },
    [logicalKey, onDrop],
  )

  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: [DND_TYPES.COMPONENT, DND_TYPES.ARCHETYPE],
      drop: handleDrop,
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [handleDrop],
  )

  const r = toOverlayRect(entry.rect, containerRect)
  const showIndicator = canDrop
  const active = isOver && canDrop

  if (!showIndicator) return null

  return (
    <Box
      ref={dropRef}
      sx={{
        position: "absolute",
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        border: active ? "2px solid #4caf50" : "2px dashed #90caf9",
        bgcolor: active ? "rgba(76, 175, 80, 0.08)" : "rgba(25, 118, 210, 0.04)",
        borderRadius: "4px",
        transition: "all 120ms ease",
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {active && (
        <Typography
          variant="caption"
          sx={{ color: "#4caf50", fontWeight: 600, pointerEvents: "none" }}
        >
          Drop here
        </Typography>
      )}
    </Box>
  )
}

export const DropTargetLayer = memo(function DropTargetLayer({
  containerEl,
  onDrop,
}: DropTargetLayerProps) {
  const snapshot = useRegistrySnapshot()

  const containerRect = containerEl.getBoundingClientRect()

  const zones: React.ReactNode[] = []

  for (const [key, entry] of snapshot) {
    if (!entry.visible) continue
    zones.push(
      <SectionDropZone
        key={`drop-${key}`}
        logicalKey={key}
        entry={entry}
        containerRect={containerRect}
        onDrop={onDrop}
      />,
    )
  }

  return <>{zones}</>
})
