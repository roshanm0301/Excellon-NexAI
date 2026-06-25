import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { AssetLibrary } from "@/features/asset-library"
import { ARCHETYPES, COMPONENTS, CATEGORIES } from "@/features/asset-library/catalogue"

function renderLibrary() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <DndProvider backend={HTML5Backend}>
        <TooltipProvider>
          <AssetLibrary />
        </TooltipProvider>
      </DndProvider>
    </QueryClientProvider>,
  )
}

describe("AssetLibrary", () => {
  it("renders all 5 archetypes in the Archetypes tab", () => {
    renderLibrary()
    const archetypesList = screen.getByRole("list", { name: /archetypes/i })
    const items = within(archetypesList).getAllByRole("listitem")
    expect(items).toHaveLength(ARCHETYPES.length)
    expect(items).toHaveLength(5)
  })

  it("renders all 6 categories in the Components tab", async () => {
    const user = userEvent.setup()
    renderLibrary()
    const compTab = screen.getByRole("tab", { name: /components/i })
    await user.click(compTab)

    for (const cat of CATEGORIES) {
      expect(screen.getByText(new RegExp(cat))).toBeInTheDocument()
    }
  })

  it("search filters components correctly", async () => {
    const user = userEvent.setup()
    renderLibrary()
    const compTab = screen.getByRole("tab", { name: /components/i })
    await user.click(compTab)

    const searchInput = screen.getByRole("searchbox", { name: /search assets/i })
    await user.type(searchInput, "Data Table")

    expect(screen.getByTestId("asset-card-DataTable")).toBeInTheDocument()
    expect(screen.queryByTestId("asset-card-Container")).not.toBeInTheDocument()
  })

  it("empty search in archetypes shows 'No archetypes match'", async () => {
    const user = userEvent.setup()
    renderLibrary()
    const searchInput = screen.getByRole("searchbox", { name: /search assets/i })
    await user.type(searchInput, "xyznonexistent")

    expect(screen.getByText(/no archetypes match/i)).toBeInTheDocument()
  })

  it("empty search in components shows 'No components match'", async () => {
    const user = userEvent.setup()
    renderLibrary()
    const compTab = screen.getByRole("tab", { name: /components/i })
    await user.click(compTab)

    const searchInput = screen.getByRole("searchbox", { name: /search assets/i })
    await user.type(searchInput, "xyznonexistent")

    expect(screen.getByText(/no components match/i)).toBeInTheDocument()
  })

  it("DraggableCard has correct aria attributes", () => {
    renderLibrary()
    const card = screen.getByTestId("asset-card-list-report")
    expect(card).toHaveAttribute("aria-label", "List Report")
    expect(card).toHaveAttribute("aria-grabbed", "false")
    expect(card).toHaveAttribute("aria-disabled", "false")
  })

  it("catalogue has the expected total component count", () => {
    expect(COMPONENTS).toHaveLength(42)
  })
})
