import { createRoute } from "@tanstack/react-router"
import { Route as rootRoute } from "./__root"
import { editorAppSearchSchema } from "./search-schemas"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { queryClient } from "@/shared/query/client"
import { qk } from "@/shared/query/keys"
import { services } from "@/services"
import type { CascadeLevel, Env } from "@/domain/types"
import { ShellLayout } from "@/features/shell"

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
  beforeLoad: ({ search }) => {
    const state = useWorkspaceStore.getState()
    state.setEnv(search.env as Env)
    state.setEditingLevel(
      search.editingLevel as CascadeLevel,
      search.scopeId as string,
    )
    if (search.previewScopeId) {
      state.setPreviewScope(search.previewScopeId as string)
    }
  },
  component: function EditorAppPage() {
    return <ShellLayout />
  },
})
