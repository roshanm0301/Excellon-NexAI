import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { EventBuilder } from "@/features/inspector"
import type { ComponentNode, Audit } from "@/domain/types"

const audit: Audit = {
  createdBy: "seed",
  createdAt: "2024-01-01T00:00:00Z",
  modifiedBy: "seed",
  modifiedAt: "2024-01-01T00:00:00Z",
}

const mockComponent: ComponentNode = {
  id: "uuid-cmp-007",
  logicalKey: "cmp.submitButton",
  cascadeLevel: "vertical",
  objectVersion: 1,
  audit,
  kind: "component",
  semanticType: "TransitionButton",
  props: { label: "Submit", transition: "submit" },
  eventHandlers: [],
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

describe("EventBuilder", () => {
  it("renders dialog with title when open", () => {
    render(
      <EventBuilder
        open={true}
        onOpenChange={vi.fn()}
        node={mockComponent}
        editingLevel="vertical"
      />,
      { wrapper },
    )
    expect(screen.getByText("Add Event Handler")).toBeInTheDocument()
  })

  it("renders trigger select", () => {
    render(
      <EventBuilder
        open={true}
        onOpenChange={vi.fn()}
        node={mockComponent}
        editingLevel="vertical"
      />,
      { wrapper },
    )
    expect(screen.getByText("Trigger")).toBeInTheDocument()
  })

  it("renders + Add Action button", () => {
    render(
      <EventBuilder
        open={true}
        onOpenChange={vi.fn()}
        node={mockComponent}
        editingLevel="vertical"
      />,
      { wrapper },
    )
    expect(screen.getByRole("button", { name: /add action/i })).toBeInTheDocument()
  })

  it("shows validation error when saving without trigger", async () => {
    render(
      <EventBuilder
        open={true}
        onOpenChange={vi.fn()}
        node={mockComponent}
        editingLevel="vertical"
      />,
      { wrapper },
    )

    fireEvent.click(screen.getByRole("button", { name: /save event/i }))

    await waitFor(() => {
      expect(screen.getByText("Trigger is required")).toBeInTheDocument()
    })
  })

  it("renders condition and security gate inputs", () => {
    render(
      <EventBuilder
        open={true}
        onOpenChange={vi.fn()}
        node={mockComponent}
        editingLevel="vertical"
      />,
      { wrapper },
    )
    expect(screen.getByPlaceholderText("e.g. rule.orderHasLines")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g. connector.erp")).toBeInTheDocument()
  })

  it("renders Remove button on action row", () => {
    render(
      <EventBuilder
        open={true}
        onOpenChange={vi.fn()}
        node={mockComponent}
        editingLevel="vertical"
      />,
      { wrapper },
    )
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument()
  })
})
