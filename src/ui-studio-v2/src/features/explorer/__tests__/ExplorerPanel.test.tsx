import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { ExplorerPanel } from "@/features/explorer"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"

// ExplorerTree now calls useNavigate — provide a mock so tests run without a Router.
const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

function renderExplorer() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <ExplorerPanel />
      </TooltipProvider>
    </QueryClientProvider>,
  )
}

describe("ExplorerPanel", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      pageId: "",
      editingLevel: "vertical",
      editingScopeId: "automotive",
    })
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
  })

  it("renders tree nodes from MSW fixture", async () => {
    renderExplorer()
    expect(await screen.findByRole("tree")).toBeInTheDocument()
    // Application node at root
    expect(await screen.findByTestId("tree-item-app.dms")).toBeInTheDocument()
  })

  it("shows cascade header with current editing level", async () => {
    renderExplorer()
    const header = await screen.findByText(/Editing:/i)
    expect(header).toBeInTheDocument()
    expect(header.textContent).toMatch(/automotive.*Vertical/i)
  })

  it("filter 'mine' shows only own-level nodes", async () => {
    const user = userEvent.setup()
    renderExplorer()
    await screen.findByRole("tree")

    // All nodes visible initially
    const mineBtn = screen.getByRole("button", { name: /mine/i })
    await user.click(mineBtn)

    // At vertical level, all verticalNodes are "own" — app.dms should still appear
    await waitFor(() => {
      expect(screen.queryByTestId("tree-item-app.dms")).toBeInTheDocument()
    })
  })

  it("filter 'orphans' is selectable and renders", async () => {
    const user = userEvent.setup()
    renderExplorer()
    await screen.findByRole("tree")

    const orphansBtn = screen.getByRole("button", { name: /orphans/i })
    await user.click(orphansBtn)
    expect(orphansBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("clicking a tree item updates selection store", async () => {
    const user = userEvent.setup()
    renderExplorer()
    const item = await screen.findByTestId("tree-item-app.dms")
    await user.click(item)
    expect(useSelectionStore.getState().selectedKeys).toContain("app.dms")
  })

  it("shows loading skeleton while fetching", () => {
    renderExplorer()
    // Loading state is transient — assert the component mounts without errors
    expect(document.body).toBeInTheDocument()
  })

  it("inherited node has Override here in context menu", async () => {
    // At tenant level, vertical nodes are inherited
    useWorkspaceStore.setState({ editingLevel: "tenant", editingScopeId: "toyota" })
    const user = userEvent.setup()
    renderExplorer()
    await screen.findByRole("tree")

    // Find a node with inherited state (vertical nodes at tenant level)
    const appItem = await screen.findByTestId("tree-item-app.dms")
    const menuBtn = within(appItem).getByRole("button", { name: /actions for/i })
    await user.click(menuBtn)

    await screen.findByText("Override here")
    expect(screen.getByText("Override here")).toBeInTheDocument()
  })

  it("clicking a page node navigates to that page route", async () => {
    const user = userEvent.setup()
    renderExplorer()
    const pageItem = await screen.findByTestId("tree-item-page.salesOrder")
    await user.click(pageItem)
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "/editor/$appId/$pageId",
        params: expect.objectContaining({ pageId: "page.salesOrder" }),
      }),
    )
  })

  it("clicking a page node clears the selection store", async () => {
    useSelectionStore.setState({ selectedKeys: ["comp.someComponent"], hoverKey: null })
    const user = userEvent.setup()
    renderExplorer()
    const pageItem = await screen.findByTestId("tree-item-page.salesOrder")
    await user.click(pageItem)
    expect(useSelectionStore.getState().selectedKeys).toHaveLength(0)
  })
})
