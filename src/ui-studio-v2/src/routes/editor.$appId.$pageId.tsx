import { createRoute } from "@tanstack/react-router"
import { Route as editorAppRoute } from "./editor.$appId"

// Phase 4 §4 — /editor/$appId/$pageId: page-level canvas (Prompt 05+)
// Search params (selection) added in Prompt 04
export const Route = createRoute({
  getParentRoute: () => editorAppRoute,
  path: "$pageId",
  component: function EditorPagePage() {
    return null
  },
})
