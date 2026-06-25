import { lazy, Suspense } from "react"
import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"
import { editorAppSearchSchema } from "./search-schemas"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { queryClient } from "@/shared/query/client"
import { qk } from "@/shared/query/keys"
import { services } from "@/services"
import type { CascadeLevel, Env } from "@/domain/types"

// Code-split the editor shell (pulls in the MUI runtime canvas) so it loads on
// demand and stays out of the initial Workspace Home / sign-in bundle. [T12.4.1]
const ShellLayout = lazy(() =>
  import("@/features/shell").then((m) => ({ default: m.ShellLayout })),
)

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/editor/$appId",
  validateSearch: editorAppSearchSchema,
  loaderDeps: ({ search }) => ({
    env: search.env,
    editingLevel: search.editingLevel,
    scopeId: search.scopeId,
  }),
  loader: ({ params, deps }) =>
    queryClient.ensureQueryData({
      queryKey: qk.tree(
        deps.env as Env,
        params.appId,
        deps.editingLevel as CascadeLevel,
        deps.scopeId as string,
      ),
      queryFn: () =>
        services.metadata.getTree({
          env: deps.env as Env,
          appId: params.appId,
          editingLevel: deps.editingLevel as CascadeLevel,
          scopeId: deps.scopeId as string,
        }),
    }),
  beforeLoad: ({ params, search }) => {
    const state = useWorkspaceStore.getState()
    state.setEnv(search.env as Env)
    state.setEditingLevel(
      search.editingLevel as CascadeLevel,
      search.scopeId as string,
    )
    state.setApp(params.appId, "")
    if (search.previewScopeId) {
      state.setPreviewScope(search.previewScopeId as string)
    }
  },
  component: function EditorAppPage() {
    return (
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center text-sm text-muted-foreground">
            Loading editor…
          </div>
        }
      >
        <ShellLayout />
      </Suspense>
    )
  },
})
