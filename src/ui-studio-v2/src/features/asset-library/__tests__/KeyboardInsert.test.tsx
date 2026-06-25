import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { AssetLibrary } from "@/features/asset-library"
import { ARCHETYPES } from "@/features/asset-library/catalogue"
import { useSelectionStore } from "@/stores/selection.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

function renderLibrary() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <AssetLibrary />
        </TooltipProvider>
      </DndProvider>
    </QueryClientProvider>,
  )
}

describe("AssetLibrary — keyboard insert (T12.2.1)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ editingLevel: "vertical", editingScopeId: "automotive", appId: "app.dms" })
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
  })

  it("archetype cards are keyboard focusable (tabIndex 0)", () => {
    renderLibrary()
    const first = screen.getByTestId(`asset-card-${ARCHETYPES[0].semanticType}`)
    expect(first).toHaveAttribute("tabindex", "0")
    expect(first).toHaveAttribute("role", "button")
  })

  it("prompts to pick a container when nothing is selected", async () => {
    const user = userEvent.setup()
    renderLibrary()
    const card = screen.getByTestId(`asset-card-${ARCHETYPES[0].semanticType}`)
    card.focus()
    await user.keyboard("{Enter}")

    const announcer = screen.getByTestId("asset-insert-announcer")
    await waitFor(() => {
      expect(announcer).toHaveTextContent(/Select a container/i)
    })
  })

  it("inserts into the selected container and announces it on Enter", async () => {
    useSelectionStore.setState({ selectedKeys: ["section.orderHeader"], hoverKey: null })
    const user = userEvent.setup()
    renderLibrary()

    const card = screen.getByTestId(`asset-card-${ARCHETYPES[0].semanticType}`)
    card.focus()
    await user.keyboard("{Enter}")

    const announcer = screen.getByTestId("asset-insert-announcer")
    await waitFor(() => {
      expect(announcer).toHaveTextContent(new RegExp(`Inserted ${ARCHETYPES[0].label}`, "i"))
    })
  })
})
