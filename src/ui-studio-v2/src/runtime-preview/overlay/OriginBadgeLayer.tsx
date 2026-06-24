// Phase 5 T8.2.1 — OriginBadgeLayer: shows cascade origin badges on nodes
// Helps the designer see which nodes are inherited, overridden, etc.

import { memo } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { OriginState } from "@/domain/types"
import { useRegistrySnapshot } from "@/runtime-preview/useNodeRegistryHooks"
import { toOverlayRect } from "./types"

interface OriginBadgeLayerProps {
  containerEl: HTMLElement
}

const ORIGIN_COLORS: Record<OriginState, { bg: string; fg: string; label: string }> = {
  inherited: { bg: "#9e9e9e", fg: "#fff", label: "INH" },
  overridden: { bg: "#1976d2", fg: "#fff", label: "OVR" },
  own: { bg: "#4caf50", fg: "#fff", label: "OWN" },
  suppressed: { bg: "#d32f2f", fg: "#fff", label: "SUP" },
  orphaned: { bg: "#ff9800", fg: "#fff", label: "ORP" },
}

export const OriginBadgeLayer = memo(function OriginBadgeLayer({
  containerEl,
}: OriginBadgeLayerProps) {
  const snapshot = useRegistrySnapshot()

  const containerRect = containerEl.getBoundingClientRect()

  const badges: React.ReactNode[] = []

  for (const [key, entry] of snapshot) {
    if (!entry.visible) continue
    if (entry.origin === "own") continue

    const r = toOverlayRect(entry.rect, containerRect)
    const cfg = ORIGIN_COLORS[entry.origin]

    badges.push(
      <Box
        key={`badge-${key}`}
        sx={{
          position: "absolute",
          left: r.left + r.width - 28,
          top: r.top - 6,
          px: 0.5,
          py: 0,
          bgcolor: cfg.bg,
          color: cfg.fg,
          borderRadius: "3px",
          lineHeight: 1,
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: "9px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            lineHeight: "14px",
          }}
        >
          {cfg.label}
        </Typography>
      </Box>,
    )
  }

  return <>{badges}</>
})
