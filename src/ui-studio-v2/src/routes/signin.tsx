import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"

// Phase 4 §4 — /signin placeholder (auth stubbed per CLAUDE.md)
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  component: function SignInPage() {
    return null
  },
})
