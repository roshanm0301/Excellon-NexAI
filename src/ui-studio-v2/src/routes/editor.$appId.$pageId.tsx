import { createRoute } from "@tanstack/react-router"
import { Route as editorAppRoute } from "./editor.$appId"
import { editorPageSearchSchema } from "./search-schemas"
import { useSelectionStore } from "@/stores/selection.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

export const Route = createRoute({
  getParentRoute: () => editorAppRoute,
  path: "$pageId",
  validateSearch: editorPageSearchSchema,
  beforeLoad: ({ params, search }) => {
    const prevPageId = useWorkspaceStore.getState().pageId
    useWorkspaceStore.getState().setApp(params.appId, params.pageId)
    // Clear stale component selection when navigating to a different page.
    if (prevPageId !== params.pageId) {
      useSelectionStore.getState().clearSelection()
    }
    const selection = search.selection as string[]
    if (selection.length > 0) {
      useSelectionStore.getState().setSelected(selection)
    }
  },
  component: function EditorPagePage() {
    return null
  },
})
