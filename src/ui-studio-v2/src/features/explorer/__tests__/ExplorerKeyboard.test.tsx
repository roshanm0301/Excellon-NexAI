import { describe, it, expect, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { ExplorerTree } from "@/features/explorer"
import { useSelectionStore } from "@/stores/selection.store"
import type { TreeNode } from "@/services/interfaces"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

function makeNode(key: string, children: TreeNode[] = [], parentKey: string | null = null): TreeNode {
  return {
    id: key,
    logicalKey: key,
    kind: "component",
    label: key,
    cascadeLevel: "vertical",
    originState: "own",
    parentKey,
    children,
  }
}

describe("ExplorerTree — keyboard navigation (T12.2.1)", () => {
  beforeEach(() => {
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
  })

  const nodes: TreeNode[] = [
    {
      ...makeNode("root.app"),
      label: "App",
      children: [
        makeNode("root.app.child1", [], "root.app"),
        makeNode("root.app.child2", [], "root.app"),
      ],
    },
  ]

  it("selects the active node on Enter", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    const tree = screen.getByRole("tree")
    tree.focus()
    await user.keyboard("{Enter}")

    // Active index starts at 0 → the root node.
    expect(useSelectionStore.getState().selectedKeys).toContain("root.app")
  })

  it("moves the active node with ArrowDown then selects with Enter", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    const tree = screen.getByRole("tree")
    tree.focus()
    await user.keyboard("{ArrowDown}{Enter}")

    expect(useSelectionStore.getState().selectedKeys).toContain("root.app.child1")
  })

  it("collapses an expanded node with ArrowLeft, hiding its children", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    // Children visible initially.
    expect(screen.getByTestId("tree-item-root.app.child1")).toBeInTheDocument()

    const tree = screen.getByRole("tree")
    tree.focus()
    // Active index 0 = root.app (has children, expanded) → ArrowLeft collapses.
    await user.keyboard("{ArrowLeft}")

    expect(screen.queryByTestId("tree-item-root.app.child1")).not.toBeInTheDocument()
    // Root remains, now collapsed.
    expect(screen.getByTestId("tree-item-root.app")).toHaveAttribute("aria-expanded", "false")
  })

  it("toggles collapse via the chevron button", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    const collapseBtn = screen.getByRole("button", { name: /collapse app/i })
    await user.click(collapseBtn)

    expect(screen.queryByTestId("tree-item-root.app.child1")).not.toBeInTheDocument()
  })

  it("re-expands a collapsed node with ArrowRight", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    const tree = screen.getByRole("tree")
    tree.focus()
    await user.keyboard("{ArrowLeft}") // collapse root (active index 0)
    expect(screen.queryByTestId("tree-item-root.app.child1")).not.toBeInTheDocument()
    await user.keyboard("{ArrowRight}") // expand again
    expect(screen.getByTestId("tree-item-root.app.child1")).toBeInTheDocument()
  })

  it("ArrowLeft on a leaf moves focus to its parent", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    const tree = screen.getByRole("tree")
    tree.focus()
    // index0=root → ArrowDown → child1 (leaf) → ArrowLeft → parent (root) → Enter
    await user.keyboard("{ArrowDown}{ArrowLeft}{Enter}")
    expect(useSelectionStore.getState().selectedKeys).toContain("root.app")
  })

  it("ArrowUp, Home, and End move the active node", async () => {
    const user = userEvent.setup()
    render(<ExplorerTree nodes={nodes} filter="all" />, { wrapper })

    const tree = screen.getByRole("tree")
    tree.focus()
    await user.keyboard("{End}{Enter}") // last visible node = child2
    expect(useSelectionStore.getState().selectedKeys).toContain("root.app.child2")

    await user.keyboard("{Home}{Enter}") // back to first = root
    expect(useSelectionStore.getState().selectedKeys).toContain("root.app")

    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{Enter}") // 0→1→2→1 = child1
    expect(useSelectionStore.getState().selectedKeys).toContain("root.app.child1")
  })
})

describe("ExplorerTree — virtualization windowing (T12.4.1)", () => {
  beforeEach(() => {
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
  })

  it("renders only a windowed subset of a large tree", () => {
    const bigTree: TreeNode[] = Array.from({ length: 500 }, (_, i) => makeNode(`node-${i}`))

    render(<ExplorerTree nodes={bigTree} filter="all" />, { wrapper })

    const rendered = screen.getAllByRole("treeitem")
    // With a ~600px viewport and 28px rows + overscan, far fewer than 500 mount.
    expect(rendered.length).toBeGreaterThan(0)
    expect(rendered.length).toBeLessThan(100)
    // The first node is always in the initial window.
    expect(screen.getByTestId("tree-item-node-0")).toBeInTheDocument()
  })
})
