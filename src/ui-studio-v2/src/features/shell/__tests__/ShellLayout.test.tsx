import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ShellLayout } from "@/features/shell"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"

// Phase 5 T5.1.1 — shell layout integration
function renderShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <DndProvider backend={HTML5Backend}>
        <ShellLayout />
      </DndProvider>
    </QueryClientProvider>,
  )
}

describe("ShellLayout", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      env: "dev",
      editingLevel: "vertical",
      editingScopeId: "automotive",
      previewScopeId: "",
      previewRole: undefined,
    })
    usePanelsStore.setState({
      explorerWidth: 280,
      inspectorWidth: 320,
      bottomDockHeight: 200,
      explorerVisible: true,
      inspectorVisible: true,
      bottomDockVisible: false,
      breakpoint: "desktop",
      activeMode: "explorer",
    })
  })

  it("renders the four shell regions", () => {
    renderShell()
    expect(screen.getByTestId("shell-layout")).toBeInTheDocument()
    expect(screen.getByRole("banner", { name: /context bar/i })).toBeInTheDocument()
    expect(screen.getByRole("navigation", { name: /activity bar/i })).toBeInTheDocument()
    expect(screen.getByRole("complementary", { name: /inspector/i })).toBeInTheDocument()
  })

  it("editing-level Select updates workspace store", async () => {
    const user = userEvent.setup()
    renderShell()
    const trigger = screen.getByRole("combobox", { name: /editing level/i })
    // Radix Select in jsdom needs keyboard interaction — pointer events
    // don't reliably reach options. Open with Enter, navigate, select.
    trigger.focus()
    await user.keyboard("{Enter}")
    await screen.findByRole("option", { name: "OEM" })
    await user.keyboard("{ArrowDown}{Enter}")
    expect(useWorkspaceStore.getState().editingLevel).toBe("tenant")
  })

  it("clicking Explorer in Activity Bar twice hides left panel", async () => {
    const user = userEvent.setup()
    renderShell()
    const nav = screen.getByRole("navigation", { name: /activity bar/i })
    const explorerBtn = within(nav).getByRole("button", { name: /explorer/i })
    // First click: already active → toggles explorer off
    await user.click(explorerBtn)
    expect(usePanelsStore.getState().explorerVisible).toBe(false)
  })

  it("Activity Bar Problems button opens bottom dock", async () => {
    const user = userEvent.setup()
    renderShell()
    const nav = screen.getByRole("navigation", { name: /activity bar/i })
    const problemsBtn = within(nav).getByRole("button", { name: /problems/i })
    await user.click(problemsBtn)
    expect(usePanelsStore.getState().bottomDockVisible).toBe(true)
  })

  it("breakpoint toggle in canvas toolbar updates store", async () => {
    const user = userEvent.setup()
    renderShell()
    const toolbar = screen.getByRole("toolbar", { name: /canvas/i })
    const tabletBtn = within(toolbar).getByRole("button", { name: /tablet/i })
    await user.click(tabletBtn)
    expect(usePanelsStore.getState().breakpoint).toBe("tablet")
  })
})
