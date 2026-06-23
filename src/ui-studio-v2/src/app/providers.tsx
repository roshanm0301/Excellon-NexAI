import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "@tanstack/react-router"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { queryClient } from "@/shared/query/client"
import { router } from "@/app/router"

// Phase 5 T1.1.3 — Query + Router + DnD providers
// RouterProvider renders the route tree; App shell is mounted by __root.tsx
export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <RouterProvider router={router} />
      </DndProvider>
    </QueryClientProvider>
  )
}
