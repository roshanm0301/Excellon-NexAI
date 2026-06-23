import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"

// Phase 4 §4 — /home: application list (Prompt 05+)
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  component: function HomePage() {
    return null
  },
})
