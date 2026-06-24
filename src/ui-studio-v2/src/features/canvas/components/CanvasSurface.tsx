// Phase 3 §4 / Phase 5 T8.1.1 — Canvas surface: fetches model, renders via Renderer

import { usePreview } from "@/shared/query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { Renderer, NodeRegistryProvider } from "@/runtime-preview"
import { useContainerRef } from "@/runtime-preview/useNodeRegistryHooks"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import CircularProgress from "@mui/material/CircularProgress"
import MuiAlert from "@mui/material/Alert"

const DEFAULT_APP_ID = "app.dms"
const DEFAULT_PAGE_ID = "page.salesOrder"

function CanvasSurfaceInner() {
  const containerRef = useContainerRef()
  const zoomScale = usePanelsStore((s) => s.zoomScale)

  const env = useWorkspaceStore((s) => s.env)
  const previewScopeId = useWorkspaceStore((s) => s.previewScopeId)

  const { data: model, isLoading, error } = usePreview(
    env,
    DEFAULT_APP_ID,
    DEFAULT_PAGE_ID,
    previewScopeId,
  )

  // Loading state — shimmer
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", gap: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Resolving preview…
        </Typography>
      </Box>
    )
  }

  // Error state — inline banner
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <MuiAlert severity="error">
          Can&apos;t render: {error instanceof Error ? error.message : "Unknown error"}
        </MuiAlert>
      </Box>
    )
  }

  // Empty state — no model or no nodes
  if (!model || model.nodes.length === 0) {
    return (
      <Box sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        gap: 1,
      }}>
        <Typography variant="body2" color="text.secondary">
          Drop an archetype or component
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      ref={containerRef}
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
