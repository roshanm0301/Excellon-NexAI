import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { LeftPanel } from "@/features/shell"
import { usePanelsStore } from "@/stores/panels.store"
import { useWorkspaceStore } from "@/stores/workspace.store"

// VersionHistoryPanel and ThemeDesigner have their own coverage; stub them so this
// test isolates LeftPanel's mode-routing branches.
vi.mock("@/features/versioning", () => ({
  VersionHistoryPanel: () => <div data-testid="version-history" />,
}))
vi.mock("@/features/theme-designer", () => ({
  ThemeDesigner: () => <div data-testid="theme-designer" />,
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

describe("LeftPanel — activity-mode routing (T12.3.1 coverage)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ env: "dev", editingLevel: "vertical", editingScopeId: "automotive", appId: "app.dms" })
  })

  it("renders the version history in history mode", () => {
    usePanelsStore.setState({ activeMode: "history" })
    render(<LeftPanel />, { wrapper })
    expect(screen.getByTestId("version-history")).toBeInTheDocument()
  })

  it("renders the theme designer in settings mode", () => {
    usePanelsStore.setState({ activeMode: "settings" })
    render(<LeftPanel />, { wrapper })
    expect(screen.getByTestId("theme-designer")).toBeInTheDocument()
  })

  it("renders the Explorer/Assets tabs in explorer mode", () => {
    usePanelsStore.setState({ activeMode: "explorer" })
    render(<LeftPanel />, { wrapper })
    expect(screen.getByRole("tab", { name: "Explorer" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Assets" })).toBeInTheDocument()
  })
})
