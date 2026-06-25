import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"
import { ProblemsPanel } from "@/features/problems"
import { services } from "@/services"

const mockIssues = [
  {
    nodeId: "node-1",
    severity: "error",
    type: "broken-binding",
    path: "props.label",
    message: "Missing required field 'name'",
  },
  {
    nodeId: "node-2",
    severity: "warning",
    type: "orphaned-override",
    path: "props.count",
    message: "Unused variable 'count'",
  },
  {
    nodeId: "node-3",
    severity: "error",
    type: "contract-violation",
    path: "props.expr",
    message: "Invalid expression syntax",
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

describe("ProblemsPanel", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ appId: "test-app", env: "dev" })
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
    vi.restoreAllMocks()
    vi.spyOn(services.compiler, "validate").mockResolvedValue(mockIssues)
  })

  it("renders issue list from mock validation data", async () => {
    renderWithProviders(<ProblemsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Missing required field 'name'")).toBeInTheDocument()
    })
    expect(screen.getByText("Unused variable 'count'")).toBeInTheDocument()
    expect(screen.getByText("Invalid expression syntax")).toBeInTheDocument()
  })

  it("updates selection store with nodeId when a row is clicked", async () => {
    const user = userEvent.setup()
    renderWithProviders(<ProblemsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Missing required field 'name'")).toBeInTheDocument()
    })

    const row = screen.getByRole("button", { name: /error: Missing required field/ })
    await user.click(row)

    expect(useSelectionStore.getState().selectedKeys).toContain("node-1")
  })

  it("shows 'No issues found' when validation returns empty array", async () => {
    vi.spyOn(services.compiler, "validate").mockResolvedValue([])

    renderWithProviders(<ProblemsPanel />)

    await waitFor(() => {
      expect(screen.getByText("No issues found")).toBeInTheDocument()
    })
  })

  it("displays correct error and warning counts in the header", async () => {
    renderWithProviders(<ProblemsPanel />)

    await waitFor(() => {
      expect(screen.getByLabelText("Error count")).toBeInTheDocument()
    })

    expect(screen.getByLabelText("Error count")).toHaveTextContent("2 errors")
    expect(screen.getByLabelText("Warning count")).toHaveTextContent("1 warnings")
  })

  it("shows correct severity icons for error and warning rows", async () => {
    renderWithProviders(<ProblemsPanel />)

    await waitFor(() => {
      expect(screen.getByText("Missing required field 'name'")).toBeInTheDocument()
    })

    const errorIcons = screen.getAllByLabelText("Error")
    expect(errorIcons).toHaveLength(2)

    const warningIcons = screen.getAllByLabelText("Warning")
    expect(warningIcons).toHaveLength(1)
  })
})
