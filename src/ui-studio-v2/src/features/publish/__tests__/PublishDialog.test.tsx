import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { server } from "@/mocks/server"
import { http, HttpResponse } from "msw"

vi.mock("@/features/publish/components/CascadeImpactDialog", () => ({
  CascadeImpactDialog: ({
    open,
    onProceed,
    onOpenChange,
  }: {
    open: boolean
    onProceed: () => void
    onOpenChange: (v: boolean) => void
  }) =>
    open ? (
      <div data-testid="impact-dialog">
        <button onClick={onProceed}>Proceed to publish</button>
        <button onClick={() => onOpenChange(false)}>Cancel impact</button>
      </div>
    ) : null,
}))

import { PublishDialog } from "@/features/publish"

const API_BASE_URL = "/api/v1"

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe("PublishDialog", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      appId: "test-app",
      env: "dev",
      editingLevel: "platform",
      editingScopeId: "",
    })
  })

  it("renders target env selector with Development/Staging/Production options", async () => {
    const user = userEvent.setup()

    server.use(
      http.post(`${API_BASE_URL}/compiler/validate`, () => {
        return HttpResponse.json([])
      }),
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(
      <PublishDialog open={true} onOpenChange={() => {}} />,
    )

    const trigger = await screen.findByLabelText("Target environment")
    expect(trigger).toBeInTheDocument()

    // Radix Select in jsdom needs keyboard interaction to open
    trigger.focus()
    await user.keyboard("{Enter}")

    expect(await screen.findByRole("option", { name: "Development" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Staging" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Production" })).toBeInTheDocument()
  })

  it("shows 'Publish blocked' when validation has errors", async () => {
    server.use(
      http.post(`${API_BASE_URL}/compiler/validate`, () => {
        return HttpResponse.json([
          {
            type: "broken-binding",
            severity: "error",
            nodeId: "node-1",
            path: "props.dataSource",
            message: "Binding target not found",
          },
          {
            type: "contract-violation",
            severity: "error",
            nodeId: "node-2",
            path: "props.columns",
            message: "Type mismatch",
          },
        ])
      }),
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(
      <PublishDialog open={true} onOpenChange={() => {}} />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("Publish blocked")).toBeInTheDocument()
    })

    expect(screen.getByLabelText("Publish blocked")).toBeDisabled()
  })

  it("shows 'View impact' button when validation is clean", async () => {
    server.use(
      http.post(`${API_BASE_URL}/compiler/validate`, () => {
        return HttpResponse.json([])
      }),
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(
      <PublishDialog open={true} onOpenChange={() => {}} />,
    )

    await waitFor(() => {
      expect(screen.getByLabelText("View impact")).toBeInTheDocument()
    })

    expect(screen.getByLabelText("View impact")).not.toBeDisabled()
  })

  it("renders promote buttons with correct labels", async () => {
    server.use(
      http.post(`${API_BASE_URL}/compiler/validate`, () => {
        return HttpResponse.json([])
      }),
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(
      <PublishDialog open={true} onOpenChange={() => {}} />,
    )

    await waitFor(() => {
      expect(
        screen.getByLabelText("Promote dev to staging"),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByLabelText("Promote staging to prod"),
    ).toBeInTheDocument()

    expect(screen.getByText(/Dev → Staging/)).toBeInTheDocument()
    expect(screen.getByText(/Staging → Prod/)).toBeInTheDocument()
  })

  it("shows 'View problems' link when errors exist", async () => {
    server.use(
      http.post(`${API_BASE_URL}/compiler/validate`, () => {
        return HttpResponse.json([
          {
            type: "broken-binding",
            severity: "error",
            nodeId: "node-1",
            path: "props.dataSource",
            message: "Binding target not found",
          },
        ])
      }),
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(
      <PublishDialog open={true} onOpenChange={() => {}} />,
    )

    await waitFor(() => {
      expect(screen.getByText("View problems")).toBeInTheDocument()
    })
  })
})
