import { createRoute } from "@tanstack/react-router"
import { Route as editorAppRoute } from "./editor.$appId"
import { editorPageSearchSchema } from "./search-schemas"
import { useSelectionStore } from "@/stores/selection.store"

export const Route = createRoute({
  getParentRoute: () => editorAppRoute,
  path: "$pageId",
  validateSearch: editorPageSearchSchema,
  beforeLoad: ({ search }) => {
    const selection = search.selection as string[]
    if (selection.length > 0) {
      useSelectionStore.getState().setSelected(selection)
    }
  },
  component: function EditorPagePage() {
    return null
  },
})
