import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WorkspaceHome } from "@/features/workspace-home"
import { services } from "@/services"

const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

const TWO_APPS = [
  {
    id: "app-1",
    name: "Fleet Manager",
    vertical: "automotive",
    description: "Vehicle fleet tracking",
    createdAt: "2025-01-01T00:00:00.000Z",
    modifiedAt: "2025-06-01T00:00:00.000Z",
  },
  {
    id: "app-2",
    name: "Patient Portal",
    vertical: "healthcare",
    description: "Patient appointment system",
    createdAt: "2025-02-01T00:00:00.000Z",
    modifiedAt: "2025-06-10T00:00:00.000Z",
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

describe("WorkspaceHome", () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    vi.restoreAllMocks()
  })

  it("lists app cards from API data", async () => {
    vi.spyOn(services.metadata, "listApps").mockResolvedValue(TWO_APPS)

    renderWithProviders(<WorkspaceHome />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /open fleet manager/i }),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: /open patient portal/i }),
    ).toBeInTheDocument()
  })

  it("shows empty state when there are no applications", async () => {
    vi.spyOn(services.metadata, "listApps").mockResolvedValue([])

    renderWithProviders(<WorkspaceHome />)

    await waitFor(() => {
      expect(
        screen.getByLabelText("No applications"),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByText("No applications yet. Create one to get started."),
    ).toBeInTheDocument()
  })

  it("renders the New Application button", async () => {
    vi.spyOn(services.metadata, "listApps").mockResolvedValue([])

    renderWithProviders(<WorkspaceHome />)

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "New application" }),
      ).toBeInTheDocument()
    })
  })

  it("renders environment selector with Development option visible", async () => {
    vi.spyOn(services.metadata, "listApps").mockResolvedValue([])

    renderWithProviders(<WorkspaceHome />)

    const envTrigger = await screen.findByRole("combobox", {
      name: "Environment",
    })
    expect(envTrigger).toBeInTheDocument()
    expect(envTrigger).toHaveTextContent("Development")
  })

  it("shows error state when API returns 500", async () => {
    vi.spyOn(services.metadata, "listApps").mockRejectedValue(new Error("Internal Server Error"))

    renderWithProviders(<WorkspaceHome />)

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load applications"),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole("button", { name: /retry/i }),
    ).toBeInTheDocument()
  })
})
