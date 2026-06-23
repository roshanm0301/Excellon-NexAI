import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"

// Phase 4 §4 — /settings placeholder
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: function SettingsPage() {
    return null
  },
})
