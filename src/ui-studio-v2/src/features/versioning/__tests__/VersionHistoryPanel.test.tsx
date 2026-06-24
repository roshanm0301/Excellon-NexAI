import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { server } from "@/mocks/server"
import { http, HttpResponse } from "msw"
import { VersionHistoryPanel } from "@/features/versioning"

const API_BASE_URL = "/api/v1"

const mockVersions = [
  {
    version: 1,
    env: "dev",
    publishedAt: "2026-06-20T10:00:00.000Z",
    publishedBy: "alice",
    message: "Initial publish",
  },
  {
    version: 2,
    env: "dev",
    publishedAt: "2026-06-21T12:00:00.000Z",
    publishedBy: "bob",
    message: "Added customer form",
  },
  {
    version: 3,
    env: "staging",
    publishedAt: "2026-06-22T14:00:00.000Z",
    publishedBy: "alice",
    message: "Promoted to staging",
  },
]

const mockDiffEntries = [
  {
    logicalKey: "dms-app.main-module.vehicle-list",
    kind: "component",
    changeType: "modified",
    before: { props: { columns: 3 } },
    after: { props: { columns: 4 } },
  },
  {
    logicalKey: "dms-app.main-module.customer-form",
    kind: "component",
    changeType: "added",
    before: null,
    after: { props: { fields: ["name", "email"] } },
  },
]

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe("VersionHistoryPanel", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ appId: "test-app" })

    server.use(
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json(mockVersions)
      }),
      http.post(`${API_BASE_URL}/versioning/:appId/diff`, async ({ request }) => {
        const body = (await request.json()) as { v1: number; v2: number }
        return HttpResponse.json({
          v1: body.v1,
          v2: body.v2,
          entries: mockDiffEntries,
        })
      }),
    )
  })

  it("lists published versions from mock data", async () => {
    renderWithProviders(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Initial publish")).toBeInTheDocument()
    })

    expect(screen.getByText("Added customer form")).toBeInTheDocument()
    expect(screen.getByText("Promoted to staging")).toBeInTheDocument()

    expect(screen.getByText("v1")).toBeInTheDocument()
    expect(screen.getByText("v2")).toBeInTheDocument()
    expect(screen.getByText("v3")).toBeInTheDocument()

    expect(screen.getAllByText("alice")).toHaveLength(2)
    expect(screen.getByText("bob")).toBeInTheDocument()
  })

  it("shows empty state when no versions exist", async () => {
    server.use(
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json([])
      }),
    )

    renderWithProviders(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText("No versions")).toBeInTheDocument()
    })

    expect(screen.getByText("No published versions yet")).toBeInTheDocument()
  })

  it("shows Compare button after selecting two versions", async () => {
    const user = userEvent.setup()
    renderWithProviders(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText("Version 1")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Version 1"))
    expect(screen.queryByLabelText("Compare versions")).not.toBeInTheDocument()

    await user.click(screen.getByLabelText("Version 3"))

    const compareBtn = screen.getByLabelText("Compare versions")
    expect(compareBtn).toBeInTheDocument()
    expect(compareBtn).toHaveTextContent("Compare v1 ↔ v3")
  })

  it("shows diff entries after clicking Compare", async () => {
    const user = userEvent.setup()
    renderWithProviders(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText("Version 1")).toBeInTheDocument()
    })

    await user.click(screen.getByLabelText("Version 1"))
    await user.click(screen.getByLabelText("Version 2"))
    await user.click(screen.getByLabelText("Compare versions"))

    await waitFor(() => {
      expect(
        screen.getByText("dms-app.main-module.vehicle-list"),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText("dms-app.main-module.customer-form"),
    ).toBeInTheDocument()
    expect(screen.getByText("modified")).toBeInTheDocument()
    expect(screen.getByText("added")).toBeInTheDocument()
    expect(screen.getByText(/v1 → v2/)).toBeInTheDocument()
  })

  it("shows error state with Retry button on server error", async () => {
    server.use(
      http.get(`${API_BASE_URL}/versioning/:appId/versions`, () => {
        return HttpResponse.json(
          { message: "Internal Server Error" },
          { status: 500 },
        )
      }),
    )

    renderWithProviders(<VersionHistoryPanel />)

    await waitFor(() => {
      expect(screen.getByText("Failed to load versions")).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
  })
})
