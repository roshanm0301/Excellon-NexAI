import { createRootRoute } from "@tanstack/react-router"
import { App } from "@/app/App"

// Phase 4 §4 — root route; App provides the shell layout once E5 is built
export const Route = createRootRoute({
  component: App,
})
