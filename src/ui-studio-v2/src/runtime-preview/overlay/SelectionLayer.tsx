// Phase 5 T8.2.1 — SelectionLayer: outlines selected + hovered nodes
// Absolute positioning is chrome, not authored layout — no [L34] violation

import { memo } from "react"
import Box from "@mui/material/Box"
import { useSelectionStore } from "@/stores/selection.store"
import { useRegistrySnapshot } from "@/runtime-preview/useNodeRegistryHooks"
import type { NodeRegistryEntry } from "@/runtime-preview/types"
import { toOverlayRect } from "./types"

interface SelectionLayerProps {
  containerEl: HTMLElement
}

const SELECTION_COLOR = "#1976d2"
const HOVER_COLOR = "#90caf9"

function SelectionOutline({
  entry,
  containerRect,
  color,
  width,
  nodeKey,
}: {
  entry: NodeRegistryEntry
  containerRect: DOMRect
  color: string
  width: number
  nodeKey: string
}) {
  const r = toOverlayRect(entry.rect, containerRect)
  return (
    <Box
      data-overlay-key={nodeKey}
      sx={{
        position: "absolute",
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        border: `${width}px solid ${color}`,
        borderRadius: "2px",
        pointerEvents: "none",
        boxSizing: "border-box",
        transition: "all 80ms ease-out",
      }}
    />
  )
}

export const SelectionLayer = memo(function SelectionLayer({
  containerEl,
}: SelectionLayerProps) {
  const selectedKeys = useSelectionStore((s) => s.selectedKeys)
  const hoverKey = useSelectionStore((s) => s.hoverKey)
  const snapshot = useRegistrySnapshot()

  const containerRect = containerEl.getBoundingClientRect()

  const elements: React.ReactNode[] = []

  if (hoverKey && !selectedKeys.includes(hoverKey)) {
    const entry = snapshot.get(hoverKey)
    if (entry?.visible) {
      elements.push(
        <SelectionOutline
          key={`hover-${hoverKey}`}
          nodeKey={hoverKey}
          entry={entry}
          containerRect={containerRect}
          color={HOVER_COLOR}
          width={1}
        />,
      )
    }
  }

  for (const key of selectedKeys) {
    const entry = snapshot.get(key)
    if (entry?.visible) {
      elements.push(
        <SelectionOutline
          key={`sel-${key}`}
          nodeKey={key}
          entry={entry}
          containerRect={containerRect}
          color={SELECTION_COLOR}
          width={2}
        />,
      )
    }
  }

  return <>{elements}</>
})
