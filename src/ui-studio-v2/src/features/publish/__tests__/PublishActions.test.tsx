import { describe, it, expect, beforeEach, vi } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { PublishDialog } from "@/features/publish"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { services } from "@/services"

vi.mock("@/features/publish/components/CascadeImpactDialog", () => ({
  CascadeImpactDialog: () => null,
}))

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("PublishDialog — promote & problems navigation (T12.3.1 coverage)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      editingLevel: "vertical",
      editingScopeId: "automotive",
    })
    vi.restoreAllMocks()
    vi.spyOn(services.versioning, "getVersions").mockResolvedValue([])
  })

  it("promotes dev→staging and shows the published version", async () => {
    const user = userEvent.setup()
    vi.spyOn(services.compiler, "validate").mockResolvedValue([])
    vi.spyOn(services.versioning, "promote").mockResolvedValue({
      success: true,
      artifactVersion: 3,
      message: "Promoted",
      issues: [],
    })

    render(<PublishDialog open onOpenChange={() => {}} />, { wrapper })

    await user.click(await screen.findByLabelText("Promote dev to staging"))

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/Published v\d+/)
    })
  })

  it("'View problems' opens the problems dock", async () => {
    const user = userEvent.setup()
    usePanelsStore.setState({ activeMode: "explorer", bottomDockVisible: false })
    vi.spyOn(services.compiler, "validate").mockResolvedValue([
      { type: "broken-binding", severity: "error", nodeId: "n1", path: "p", message: "boom" },
    ])

    const onOpenChange = vi.fn()
    render(<PublishDialog open onOpenChange={onOpenChange} />, { wrapper })

    await user.click(await screen.findByText("View problems"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(usePanelsStore.getState().activeMode).toBe("problems")
  })
})
