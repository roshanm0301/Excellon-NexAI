import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"
import { homeSearchSchema } from "./search-schemas"
import { WorkspaceHome } from "@/features/workspace-home"
import type { Env } from "@/domain/types"

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/home",
  validateSearch: homeSearchSchema,
  component: function HomePage() {
    const search = Route.useSearch()
    return <WorkspaceHome env={search.env as Env} />
  },
})
