import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { ThemeDesigner } from "@/features/theme-designer"
import { services } from "@/services"

vi.mock("@/shared/ui/origin-badge", () => ({
  OriginBadge: ({ state }: { state: string }) => (
    <span data-testid="origin-badge">{state}</span>
  ),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

const themeTreeResponse = [
  {
    id: "theme-1",
    logicalKey: "theme.default",
    kind: "theme",
    cascadeLevel: "vertical",
    originState: "own",
    label: "Default Theme",
    parentKey: null,
    children: [],
    data: { tokens: {} },
  },
]

beforeEach(() => {
  useWorkspaceStore.setState({
    env: "dev",
    appId: "test-app",
    editingLevel: "vertical",
    editingScopeId: "automotive",
  })

  vi.restoreAllMocks()
  vi.spyOn(services.metadata, "getTree").mockResolvedValue(themeTreeResponse)
})

describe("ThemeDesigner", () => {
  it("renders token categories (Colors, Typography, Layout, Brand Assets)", async () => {
    renderWithProviders(<ThemeDesigner />)

    await waitFor(() => {
      expect(screen.getByText("Colors")).toBeInTheDocument()
    })

    expect(screen.getByText("Typography")).toBeInTheDocument()
    expect(screen.getByText("Layout")).toBeInTheDocument()
    expect(screen.getByText("Brand Assets")).toBeInTheDocument()
  })

  it("shows all token labels", async () => {
    renderWithProviders(<ThemeDesigner />)

    await waitFor(() => {
      expect(screen.getByText("colorPrimary")).toBeInTheDocument()
    })

    expect(screen.getByText("colorSecondary")).toBeInTheDocument()
    expect(screen.getByText("colorBackground")).toBeInTheDocument()
    expect(screen.getByText("fontFamily")).toBeInTheDocument()
    expect(screen.getByText("borderRadius")).toBeInTheDocument()
  })

  it("Save button is disabled when no changes have been made", async () => {
    renderWithProviders(<ThemeDesigner />)

    await waitFor(() => {
      expect(screen.getByLabelText("Save theme")).toBeInTheDocument()
    })

    expect(screen.getByLabelText("Save theme")).toBeDisabled()
  })

  it("changing a token value enables the Save button", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ThemeDesigner />)

    await waitFor(() => {
      expect(screen.getByLabelText("fontFamily value")).toBeInTheDocument()
    })

    const fontFamilyInput = screen.getByLabelText("fontFamily value")
    await user.clear(fontFamilyInput)
    await user.type(fontFamilyInput, "Roboto, sans-serif")

    expect(screen.getByLabelText("Save theme")).toBeEnabled()
  })

  it("Brand Assets section shows Logo URL and Favicon URL inputs", async () => {
    renderWithProviders(<ThemeDesigner />)

    await waitFor(() => {
      expect(screen.getByLabelText("Brand logo URL")).toBeInTheDocument()
    })

    expect(screen.getByLabelText("Brand favicon URL")).toBeInTheDocument()
  })
})
