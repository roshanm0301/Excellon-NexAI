import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { OverridePrompt, RevertDialog } from "@/features/inspector"
import type { MetaNode, Audit } from "@/domain/types"

const audit: Audit = {
  createdBy: "seed",
  createdAt: "2024-01-01T00:00:00Z",
  modifiedBy: "seed",
  modifiedAt: "2024-01-01T00:00:00Z",
}

const mockNode: MetaNode = {
  id: "uuid-cmp-001",
  logicalKey: "cmp.objectHeader",
  cascadeLevel: "platform",
  objectVersion: 1,
  audit,
  kind: "component",
  semanticType: "ObjectHeader",
  props: { title: "Order Details" },
}

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

describe("OverridePrompt", () => {
  it("renders override dialog with correct level text", () => {
    render(
      <OverridePrompt
        open={true}
        onOpenChange={vi.fn()}
        node={mockNode}
        editingLevel="tenant"
      />,
      { wrapper },
    )
    expect(screen.getByText("Override Node?")).toBeInTheDocument()
    expect(screen.getByText(/tenant/)).toBeInTheDocument()
    expect(screen.getByText(/platform/)).toBeInTheDocument()
  })

  it("renders Cancel and Override buttons", () => {
    render(
      <OverridePrompt
        open={true}
        onOpenChange={vi.fn()}
        node={mockNode}
        editingLevel="tenant"
      />,
      { wrapper },
    )
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /override/i })).toBeInTheDocument()
  })

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = vi.fn()
    render(
      <OverridePrompt
        open={true}
        onOpenChange={onOpenChange}
        node={mockNode}
        editingLevel="tenant"
      />,
      { wrapper },
    )
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe("RevertDialog", () => {
  it("renders revert dialog with prop name", () => {
    render(
      <RevertDialog
        open={true}
        onOpenChange={vi.fn()}
        propKey="discount"
        logicalKey="cmp.discountField"
        editingLevel="tenant"
      />,
      { wrapper },
    )
    expect(screen.getByText("Revert Property?")).toBeInTheDocument()
    expect(screen.getByText(/discount/)).toBeInTheDocument()
  })

  it("renders Cancel and Revert buttons", () => {
    render(
      <RevertDialog
        open={true}
        onOpenChange={vi.fn()}
        propKey="discount"
        logicalKey="cmp.discountField"
        editingLevel="tenant"
      />,
      { wrapper },
    )
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /revert/i })).toBeInTheDocument()
  })

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = vi.fn()
    render(
      <RevertDialog
        open={true}
        onOpenChange={onOpenChange}
        propKey="discount"
        logicalKey="cmp.discountField"
        editingLevel="tenant"
      />,
      { wrapper },
    )
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
