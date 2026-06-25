import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ContextBar } from "@/features/shell"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { services } from "@/services"

vi.mock("@/features/publish", () => ({
  PublishDialog: ({ open }: { open: boolean }) => (open ? <div data-testid="publish-dialog" /> : null),
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("ContextBar (T12.3.1 coverage)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ env: "dev", appId: "app.dms", editingLevel: "vertical", editingScopeId: "automotive" })
    usePanelsStore.setState({ activeMode: "explorer", bottomDockVisible: false })
    vi.restoreAllMocks()
  })

  it("shows an error-count badge and opens the problems dock on Validate", async () => {
    const user = userEvent.setup()
    vi.spyOn(services.compiler, "validate").mockResolvedValue([
      { type: "broken-binding", severity: "error", nodeId: "n1", path: "p", message: "x" },
      { type: "contract-violation", severity: "error", nodeId: "n2", path: "p", message: "y" },
    ])

    render(<ContextBar onOpenCommandPalette={() => {}} presenceUsers={[{ userId: "u-jordan", displayName: "Jordan Lee", lockedKeys: [], lastSeen: "t" }]} />, { wrapper })

    // Presence avatar renders for the collaborator.
    expect(screen.getByLabelText("Jordan Lee")).toBeInTheDocument()

    const validate = screen.getByRole("button", { name: "Validate" })
    await waitFor(() => expect(validate).toHaveTextContent("2"))

    await user.click(validate)
    expect(usePanelsStore.getState().activeMode).toBe("problems")
    expect(usePanelsStore.getState().bottomDockVisible).toBe(true)
  })

  it("opens the publish dialog from the Publish button", async () => {
    const user = userEvent.setup()
    vi.spyOn(services.compiler, "validate").mockResolvedValue([])
    render(<ContextBar onOpenCommandPalette={() => {}} />, { wrapper })

    await user.click(screen.getByRole("button", { name: "Publish" }))
    expect(screen.getByTestId("publish-dialog")).toBeInTheDocument()
  })
})
