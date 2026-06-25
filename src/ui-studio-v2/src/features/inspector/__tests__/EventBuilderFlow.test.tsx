import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { EventBuilder } from "@/features/inspector"
import type { ComponentNode } from "@/domain/types"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

// Uses an existing seeded key so the override endpoint returns a node with `kind`.
const node: ComponentNode = {
  id: "uuid-cmp-007",
  logicalKey: "cmp.submitButton",
  cascadeLevel: "vertical",
  objectVersion: 1,
  audit: { createdBy: "t", createdAt: "t", modifiedBy: "t", modifiedAt: "t" },
  kind: "component",
  semanticType: "TransitionButton",
  props: { label: "Submit" },
}

async function pickFromCombobox(user: ReturnType<typeof userEvent.setup>, combobox: HTMLElement, optionName: string) {
  combobox.focus()
  await user.keyboard("{Enter}")
  await user.click(await screen.findByRole("option", { name: optionName }))
}

describe("EventBuilder — full flow (T12.3.1 coverage)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks save and shows validation when no trigger is set", async () => {
    const user = userEvent.setup()
    render(<EventBuilder open node={node} editingLevel="vertical" onOpenChange={() => {}} />, { wrapper })

    await user.click(screen.getByRole("button", { name: /save event/i }))
    expect(screen.getByText("Trigger is required")).toBeInTheDocument()
  })

  it("adds and removes action rows", async () => {
    const user = userEvent.setup()
    render(<EventBuilder open node={node} editingLevel="vertical" onOpenChange={() => {}} />, { wrapper })

    await user.click(screen.getByRole("button", { name: /add action/i }))
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(2)

    await user.click(screen.getAllByRole("button", { name: "Remove" })[0])
    expect(screen.getAllByRole("button", { name: "Remove" })).toHaveLength(1)
  })

  it("saves a valid trigger + navigate action and closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<EventBuilder open node={node} editingLevel="vertical" onOpenChange={onOpenChange} />, { wrapper })

    // First combobox = trigger; second = the action-kind select inside ActionRow.
    const triggerSelect = screen.getAllByRole("combobox")[0]
    await pickFromCombobox(user, triggerSelect, "On Click")

    const actionKindSelect = screen.getAllByRole("combobox")[1]
    await pickFromCombobox(user, actionKindSelect, "Navigate")

    await user.type(screen.getByPlaceholderText("e.g. wf.orderApproval"), "page.home")
    // Optional condition input exercises that branch too.
    await user.type(screen.getByPlaceholderText("e.g. rule.orderHasLines"), "rule.x")

    await user.click(screen.getByRole("button", { name: /save event/i }))

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false))
  })

  it("surfaces workflow transitions when the action targets a workflow", async () => {
    const user = userEvent.setup()
    render(<EventBuilder open node={node} editingLevel="vertical" onOpenChange={() => {}} />, { wrapper })

    const actionKindSelect = screen.getAllByRole("combobox")[1]
    await pickFromCombobox(user, actionKindSelect, "Trigger Workflow Transition")

    // Target a workflow whose registry shape exposes transitions.
    await user.type(screen.getByPlaceholderText("e.g. wf.orderApproval"), "wf.orderApproval")

    // The Transition label appears once the workflow target is set.
    await waitFor(() => {
      expect(screen.getByText("Transition")).toBeInTheDocument()
    })
  })
})
