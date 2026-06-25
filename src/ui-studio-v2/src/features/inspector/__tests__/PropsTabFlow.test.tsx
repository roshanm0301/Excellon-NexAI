import { describe, it, expect, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { PropsTab } from "@/features/inspector"
import { useWorkspaceStore } from "@/stores/workspace.store"
import type { ComponentNode } from "@/domain/types"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

const node: ComponentNode = {
  id: "uuid-cmp-003",
  logicalKey: "cmp.customerName",
  cascadeLevel: "vertical",
  objectVersion: 1,
  audit: { createdBy: "t", createdAt: "t", modifiedBy: "t", modifiedAt: "t" },
  kind: "component",
  semanticType: "FormField",
  props: { label: "Customer", fieldType: "text" },
}

describe("PropsTab — origin & binding branches (T12.3.1 coverage)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({ editingLevel: "tenant", editingScopeId: "toyota" })
  })

  it("shows the inherited notice and disables Save for an inherited node", () => {
    render(<PropsTab node={node} origin="inherited" />, { wrapper })
    expect(screen.getByText(/This node is inherited/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled()
  })

  it("opens the binding picker from a property switched to binding mode", async () => {
    const user = userEvent.setup()
    render(<PropsTab node={node} origin="overridden" />, { wrapper })

    // Toggle the "label" property from value → binding mode (the "B" button).
    const toggles = screen.getAllByTitle("Switch to binding")
    await user.click(toggles[0])
    await user.click(screen.getByRole("button", { name: "Change" }))

    // BindingPicker dialog surfaces.
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("offers a revert control for an overridden property", async () => {
    const user = userEvent.setup()
    render(<PropsTab node={node} origin="overridden" />, { wrapper })

    const revert = screen.getAllByTitle("Revert to inherited")[0]
    await user.click(revert)
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })
})
