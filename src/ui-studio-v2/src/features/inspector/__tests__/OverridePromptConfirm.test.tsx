import { describe, it, expect, vi } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { OverridePrompt, RevertDialog } from "@/features/inspector"
import type { MetaNode } from "@/domain/types"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

const node = {
  id: "uuid-cmp-002",
  logicalKey: "cmp.orderNumber",
  cascadeLevel: "vertical",
  objectVersion: 1,
  audit: { createdBy: "t", createdAt: "t", modifiedBy: "t", modifiedAt: "t" },
  kind: "component",
  semanticType: "FormField",
  props: {},
} as MetaNode

describe("OverridePrompt / RevertDialog — confirm flows (T12.3.1 coverage)", () => {
  it("confirms an override and closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<OverridePrompt open onOpenChange={onOpenChange} node={node} editingLevel="tenant" />, { wrapper })

    await user.click(screen.getByRole("button", { name: "Override" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("cancels an override", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<OverridePrompt open onOpenChange={onOpenChange} node={node} editingLevel="tenant" />, { wrapper })

    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("confirms a property revert and closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <RevertDialog open onOpenChange={onOpenChange} propKey="label" logicalKey="cmp.orderNumber" editingLevel="tenant" />,
      { wrapper },
    )

    await user.click(screen.getByRole("button", { name: "Revert" }))
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })
})
