import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { server } from "@/mocks/server"
import { http, HttpResponse } from "msw"

vi.mock("@/runtime-preview/Renderer", () => ({
  Renderer: ({ model }: { model: unknown }) => (
    <div data-testid="renderer">{JSON.stringify(model)}</div>
  ),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  )
}

// Lazy import so the vi.mock above takes effect before the module loads
async function importPreviewHost() {
  const mod = await import("@/features/preview/components/PreviewHost")
  return mod.PreviewHost
}

describe("PreviewHost", () => {
  it("shows empty state when no previewScopeId is set", async () => {
    useWorkspaceStore.setState({ previewScopeId: "" })

    const PreviewHost = await importPreviewHost()
    renderWithProviders(<PreviewHost />)

    expect(
      screen.getByText("Select a preview scope to see the resolved view"),
    ).toBeInTheDocument()
  })

  it("renders Renderer with resolved model when previewScopeId is set", async () => {
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      pageId: "page.salesOrder",
      previewScopeId: "automotive",
      previewRole: "admin",
    })

    const mockModel = {
      pageId: "page.salesOrder",
      scopeId: "automotive",
      nodes: [
        {
          logicalKey: "cmp.name",
          kind: "component",
          cascadeLevel: "vertical",
          originState: "inherited",
          data: { label: "Name" },
        },
      ],
    }

    server.use(
      http.post("/api/v1/preview/resolve", () => {
        return HttpResponse.json(mockModel)
      }),
    )

    const PreviewHost = await importPreviewHost()
    renderWithProviders(<PreviewHost />)

    await waitFor(() => {
      expect(screen.getByTestId("renderer")).toBeInTheDocument()
    })

    expect(screen.getByTestId("renderer").textContent).toContain("page.salesOrder")
    expect(screen.getByTestId("renderer").textContent).toContain("automotive")
  })

  it("shows skeleton loading state while preview is loading", async () => {
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      pageId: "page.salesOrder",
      previewScopeId: "automotive",
      previewRole: "admin",
    })

    // Use a handler that never resolves to keep the query in loading state
    server.use(
      http.post("/api/v1/preview/resolve", () => {
        return new Promise(() => {
          // intentionally never resolves
        })
      }),
    )

    const PreviewHost = await importPreviewHost()
    renderWithProviders(<PreviewHost />)

    await waitFor(() => {
      const skeletons = document.querySelectorAll(".animate-pulse")
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  it("renders Desktop, Tablet, and Mobile breakpoint buttons", async () => {
    useWorkspaceStore.setState({ previewScopeId: "" })
    usePanelsStore.setState({ breakpoint: "desktop" })

    const PreviewHost = await importPreviewHost()
    renderWithProviders(<PreviewHost />)

    expect(screen.getByRole("button", { name: "Desktop" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Tablet" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mobile" })).toBeInTheDocument()

    // Verify the active breakpoint is marked as pressed
    expect(screen.getByRole("button", { name: "Desktop" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(screen.getByRole("button", { name: "Tablet" })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("shows error message and Retry button when preview fails", async () => {
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      pageId: "page.salesOrder",
      previewScopeId: "automotive",
      previewRole: "admin",
    })

    server.use(
      http.post("/api/v1/preview/resolve", () => {
        return HttpResponse.json(
          { message: "Internal Server Error" },
          { status: 500 },
        )
      }),
    )

    const PreviewHost = await importPreviewHost()
    renderWithProviders(<PreviewHost />)

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument()
    })

    // The error message should be visible (ApiError throws "API error 500")
    expect(screen.getByText(/API error 500/i)).toBeInTheDocument()
  })
})
