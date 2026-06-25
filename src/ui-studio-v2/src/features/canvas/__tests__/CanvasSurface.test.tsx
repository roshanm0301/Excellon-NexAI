// P0-01 — Canvas page routing: CanvasSurface reads active pageId from workspace store
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"

// Stub MUI imports so tests run without full MUI setup
vi.mock("@mui/material/CircularProgress", () => ({
  default: () => <div data-testid="spinner" />,
}))
vi.mock("@mui/material/Alert", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-alert">{children}</div>
  ),
}))

// Stub runtime-preview so NodeRegistryProvider / Renderer don't need a canvas DOM
vi.mock("@/runtime-preview", () => ({
  Renderer: ({ model }: { model: { nodes: unknown[] } }) => (
    <div data-testid="renderer" data-node-count={model.nodes.length} />
  ),
  NodeRegistryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock("@/runtime-preview/useNodeRegistryHooks", () => ({
  useContainerRef: () => vi.fn(),
  useNodeRegistry: () => ({ recalculateAll: vi.fn() }),
}))
vi.mock("@/runtime-preview/overlay", () => ({
  CanvasOverlay: () => null,
}))
vi.mock("@/features/canvas/hooks/useInsertComponent", () => ({
  useInsertComponent: () => vi.fn(),
}))

// Capture what pageId usePreview was called with
const mockUsePreview = vi.fn()
vi.mock("@/shared/query", () => ({
  usePreview: (...args: unknown[]) => mockUsePreview(...args),
}))

import { CanvasSurface } from "@/features/canvas"

function renderCanvas() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CanvasSurface />
    </QueryClientProvider>,
  )
}

describe("CanvasSurface — active page routing (P0-01)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      pageId: "",
      previewScopeId: "automotive",
    })
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
    mockUsePreview.mockReturnValue({ data: null, isLoading: false, error: null })
  })

  it("shows 'no page selected' empty state when pageId is empty", () => {
    renderCanvas()
    expect(screen.getByText(/no page selected/i)).toBeInTheDocument()
    expect(screen.getByText(/select a page from the explorer/i)).toBeInTheDocument()
  })

  it("does not call usePreview when pageId is empty", () => {
    renderCanvas()
    expect(mockUsePreview).not.toHaveBeenCalled()
  })

  it("calls usePreview with workspace pageId when pageId is set", () => {
    useWorkspaceStore.setState({ pageId: "page.orderList" })
    mockUsePreview.mockReturnValue({ data: null, isLoading: true, error: null })
    renderCanvas()
    expect(mockUsePreview).toHaveBeenCalledWith(
      "dev",
      "app.dms",
      "page.orderList",
      "automotive",
    )
  })

  it("does NOT call usePreview with hardcoded 'page.salesOrder'", () => {
    useWorkspaceStore.setState({ pageId: "page.orderList" })
    mockUsePreview.mockReturnValue({ data: null, isLoading: true, error: null })
    renderCanvas()
    const calls = mockUsePreview.mock.calls
    expect(calls.length).toBeGreaterThan(0)
    for (const call of calls) {
      expect(call[2]).not.toBe("page.salesOrder")
    }
  })

  it("shows spinner while preview is loading", () => {
    useWorkspaceStore.setState({ pageId: "page.salesOrder" })
    mockUsePreview.mockReturnValue({ data: null, isLoading: true, error: null })
    renderCanvas()
    expect(screen.getByTestId("spinner")).toBeInTheDocument()
  })

  it("shows error banner when preview fails", () => {
    useWorkspaceStore.setState({ pageId: "page.salesOrder" })
    mockUsePreview.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error("Network error"),
    })
    renderCanvas()
    expect(screen.getByTestId("error-alert")).toBeInTheDocument()
  })

  it("shows 'No content to render' empty state when preview returns empty nodes", () => {
    useWorkspaceStore.setState({ pageId: "page.nonexistent" })
    mockUsePreview.mockReturnValue({
      data: { pageId: "page.nonexistent", scopeId: "automotive", nodes: [] },
      isLoading: false,
      error: null,
    })
    renderCanvas()
    expect(screen.getByText(/no content to render/i)).toBeInTheDocument()
  })

  it("renders canvas when preview returns nodes", () => {
    useWorkspaceStore.setState({ pageId: "page.salesOrder" })
    mockUsePreview.mockReturnValue({
      data: {
        pageId: "page.salesOrder",
        scopeId: "automotive",
        nodes: [{ logicalKey: "page.salesOrder", kind: "page" }],
      },
      isLoading: false,
      error: null,
    })
    renderCanvas()
    expect(screen.getByTestId("renderer")).toBeInTheDocument()
  })
})
