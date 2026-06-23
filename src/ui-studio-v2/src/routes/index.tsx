import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function IndexPage() {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">UI Studio V2 — scaffold ready</p>
      </div>
    )
  },
})
