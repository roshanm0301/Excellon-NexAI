import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { CascadeImpactDialog } from "@/features/publish"
import { services } from "@/services"

const mockImpactResponse = {
  affectedOems: 3,
  affectedDealers: 5,
  orphanedOverrides: 1,
  brokenBindings: 2,
  summary: "11 issues found across cascade hierarchy",
}

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe("CascadeImpactDialog", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      env: "dev",
      editingLevel: "platform",
      editingScopeId: "",
    })
    vi.restoreAllMocks()
    vi.spyOn(services.compiler, "impact").mockResolvedValue(mockImpactResponse)
  })

  it("shows impact counts when data loads", async () => {
    renderWithProviders(
      <CascadeImpactDialog
        open={true}
        onOpenChange={vi.fn()}
        appId="test-app"
        onProceed={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Affected OEMs count")).toHaveTextContent(
        "3",
      )
    })

    expect(screen.getByLabelText("Affected dealers count")).toHaveTextContent(
      "5",
    )
    expect(
      screen.getByLabelText("Orphaned overrides count"),
    ).toHaveTextContent("1")
    expect(screen.getByLabelText("Broken bindings count")).toHaveTextContent(
      "2",
    )
    expect(
      screen.getByText("11 issues found across cascade hierarchy"),
    ).toBeInTheDocument()
  })

  it("error state blocks publish with fail-safe message", async () => {
    vi.spyOn(services.compiler, "impact").mockRejectedValue(new Error("Internal Server Error"))

    renderWithProviders(
      <CascadeImpactDialog
        open={true}
        onOpenChange={vi.fn()}
        appId="test-app"
        onProceed={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Couldn.t compute impact — publish blocked/),
    ).toBeInTheDocument()

    const proceedButton = screen.getByRole("button", {
      name: "Proceed to publish",
    })
    expect(proceedButton).toBeDisabled()
  })

  it("cancel button calls onOpenChange(false)", async () => {
    const onOpenChange = vi.fn()

    renderWithProviders(
      <CascadeImpactDialog
        open={true}
        onOpenChange={onOpenChange}
        appId="test-app"
        onProceed={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Affected OEMs count")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("proceed button calls onProceed when data is loaded", async () => {
    const onProceed = vi.fn()

    renderWithProviders(
      <CascadeImpactDialog
        open={true}
        onOpenChange={vi.fn()}
        appId="test-app"
        onProceed={onProceed}
      />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Affected OEMs count")).toBeInTheDocument()
    })

    const user = userEvent.setup()
    await user.click(
      screen.getByRole("button", { name: "Proceed to publish" }),
    )

    expect(onProceed).toHaveBeenCalledOnce()
  })

  it("proceed button is disabled during loading", () => {
    vi.spyOn(services.compiler, "impact").mockImplementation(() => new Promise(() => {}))

    renderWithProviders(
      <CascadeImpactDialog
        open={true}
        onOpenChange={vi.fn()}
        appId="test-app"
        onProceed={vi.fn()}
      />,
    )

    const proceedButton = screen.getByRole("button", {
      name: "Proceed to publish",
    })
    expect(proceedButton).toBeDisabled()
  })
})
