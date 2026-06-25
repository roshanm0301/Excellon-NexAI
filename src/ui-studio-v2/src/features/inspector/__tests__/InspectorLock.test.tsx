import { describe, it, expect, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { InspectorPanel } from "@/features/inspector"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

describe("InspectorPanel — node-level locks (T12.1.1)", () => {
  beforeEach(() => {
    // appId non-empty so presence subscribes; vertical level so origin is "own"
    // (the lock — not inheritance — is the only thing that blocks editing).
    useWorkspaceStore.setState({
      env: "dev",
      editingLevel: "vertical",
      editingScopeId: "automotive",
      appId: "app.dms",
    })
  })

  it("shows a lock banner and disables Save when the node is locked by another user", async () => {
    // cmp.customerName is seed-locked by Jordan Lee.
    useSelectionStore.setState({ selectedKeys: ["cmp.customerName"], hoverKey: null })
    render(<InspectorPanel />, { wrapper })

    await waitFor(() => {
      expect(screen.getByLabelText("Locked by Jordan Lee")).toBeInTheDocument()
    })

    const save = await screen.findByRole("button", { name: /save changes/i })
    expect(save).toBeDisabled()
  })

  it("shows no lock banner for an unlocked node", async () => {
    useSelectionStore.setState({ selectedKeys: ["cmp.orderNumber"], hoverKey: null })
    render(<InspectorPanel />, { wrapper })

    // Node header eventually renders for the selected node…
    await screen.findByRole("button", { name: /save changes/i })
    // …and there is no lock banner for this unlocked node.
    expect(screen.queryByLabelText(/^Locked by /)).not.toBeInTheDocument()
  })
})
