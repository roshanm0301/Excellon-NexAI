// Phase 3 §4 / Phase 5 T8.1.1–T8.5.1 — Canvas surface: fetches model, renders + overlays

import { useCallback, useEffect, useRef, useState } from "react"
import { usePreview } from "@/shared/query"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import { useInsertComponent } from "@/features/canvas/hooks/useInsertComponent"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { useSelectionStore } from "@/stores/selection.store"
import { Renderer, NodeRegistryProvider } from "@/runtime-preview"
import { useContainerRef, useNodeRegistry } from "@/runtime-preview/useNodeRegistryHooks"
import { CanvasOverlay, type DropItem } from "@/runtime-preview/overlay"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import MuiAlert from "@mui/material/Alert"

const DEFAULT_APP_ID = "app.dms"
const DEFAULT_PAGE_ID = "page.salesOrder"

function CanvasSurfaceInner() {
  const registryContainerRef = useContainerRef()
  const registry = useNodeRegistry()
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null)
  const zoomScale = usePanelsStore((s) => s.zoomScale)

  const env = useWorkspaceStore((s) => s.env)
  const previewScopeId = useWorkspaceStore((s) => s.previewScopeId)

  const setSelected = useSelectionStore((s) => s.setSelected)
  const clearSelection = useSelectionStore((s) => s.clearSelection)
  const setHover = useSelectionStore((s) => s.setHover)

  const insertComponent = useInsertComponent()

  const { data: model, isLoading, error } = usePreview(
    env,
    DEFAULT_APP_ID,
    DEFAULT_PAGE_ID,
    previewScopeId,
  )

  const mergedRef = useCallback(
    (el: HTMLElement | null) => {
      registryContainerRef(el)
      setContainerEl(el)
    },
    [registryContainerRef],
  )

  // Recalculate registry rects on scroll (viewport-relative rects shift)
  const tickingRef = useRef(false)
  useEffect(() => {
    if (!containerEl) return
    const onScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true
        requestAnimationFrame(() => {
          registry.recalculateAll()
          tickingRef.current = false
        })
      }
    }
    containerEl.addEventListener("scroll", onScroll, { passive: true })
    return () => containerEl.removeEventListener("scroll", onScroll)
  }, [containerEl, registry])

  // Click-to-select via event delegation on data-node-key attributes
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const nodeEl = target.closest("[data-node-key]")
      if (nodeEl) {
        const key = nodeEl.getAttribute("data-node-key")
        if (key) {
          setSelected([key])
          return
        }
      }
      clearSelection()
    },
    [setSelected, clearSelection],
  )

  // Hover tracking via event delegation
  const handleMouseOver = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const nodeEl = target.closest("[data-node-key]")
      setHover(nodeEl?.getAttribute("data-node-key") ?? null)
    },
    [setHover],
  )

  const handleMouseLeave = useCallback(() => {
    setHover(null)
  }, [setHover])

  // DnD drop handler: inserts a new component into the target section.
  // Shares insert logic with the keyboard (Enter/Space) affordance via useInsertComponent.
  const handleDrop = useCallback(
    (sectionKey: string, item: DropItem) => {
      insertComponent(
        { semanticType: item.semanticType, defaultProps: item.defaultProps },
        sectionKey,
      )
    },
    [insertComponent],
  )

  // T8.5.1 — Loading state: spinner + shimmer text
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 1.5,
        }}
      >
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">
          Resolving preview…
        </Typography>
      </Box>
    )
  }

  // T8.5.1 — Error state: inline banner with retry guidance
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <MuiAlert severity="error" variant="outlined">
          Can&apos;t render: {error instanceof Error ? error.message : "Unknown error"}
        </MuiAlert>
      </Box>
    )
  }

  // T8.5.1 — Empty state: centered message with drop prompt
  if (!model || model.nodes.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 1,
          color: "text.disabled",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 400, fontSize: "1rem" }}>
          No content to render
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Drop an archetype or component from the Asset Library
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={mergedRef}
      role="region"
      aria-label="Design canvas"
      onClick={handleClick}
      onMouseOver={handleMouseOver}
      onMouseLeave={handleMouseLeave}
      sx={{
        flex: 1,
        overflow: "auto",
        position: "relative",
      }}
    >
      <Box
        sx={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "top left",
          minHeight: "100%",
        }}
      >
        <Renderer model={model} />
      </Box>
      {containerEl && (
        <CanvasOverlay containerEl={containerEl} onDrop={handleDrop} />
      )}
    </Box>
  )
}

export function CanvasSurface() {
  return (
    <NodeRegistryProvider>
      <CanvasSurfaceInner />
    </NodeRegistryProvider>
  )
}
