import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"

// Phase 4 §4 — /editor/$appId: main editor surface (Prompt 05+)
// Search params (env, editingLevel, scopeId, previewScopeId) added in Prompt 04 with Zod validateSearch
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/$appId",
  component: function EditorAppPage() {
    return null
  },
})
