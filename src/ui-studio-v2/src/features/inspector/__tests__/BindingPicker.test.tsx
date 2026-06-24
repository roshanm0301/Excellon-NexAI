import { describe, it, expect, vi } from "vitest"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { BindingPicker } from "@/features/inspector"

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

describe("BindingPicker", () => {
  it("renders dialog with title when open", () => {
    render(
      <BindingPicker
        open={true}
        onOpenChange={vi.fn()}
        propKey="label"
        propType="string"
        onBind={vi.fn()}
      />,
      { wrapper },
    )
    expect(screen.getByText(/bind.*label/i)).toBeInTheDocument()
  })

  it("shows registry results after search", async () => {
    render(
      <BindingPicker
        open={true}
        onOpenChange={vi.fn()}
        propKey="source"
        propType="binding"
        onBind={vi.fn()}
      />,
      { wrapper },
    )

    const input = screen.getByPlaceholderText("Search registry…")
    fireEvent.change(input, { target: { value: "order" } })

    await waitFor(() => {
      expect(screen.getByText("entity.SalesOrder")).toBeInTheDocument()
    })
  })

  it("shows shape preview after selecting a registry entry", async () => {
    render(
      <BindingPicker
        open={true}
        onOpenChange={vi.fn()}
        propKey="source"
        propType="binding"
        onBind={vi.fn()}
      />,
      { wrapper },
    )

    const input = screen.getByPlaceholderText("Search registry…")
    fireEvent.change(input, { target: { value: "order" } })

    await waitFor(() => {
      expect(screen.getByText("entity.SalesOrder")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("entity.SalesOrder"))

    await waitFor(() => {
      expect(screen.getByText("orderNumber")).toBeInTheDocument()
      expect(screen.getByText("customerId")).toBeInTheDocument()
    })
  })

  it("disables Bind when workflow ref is selected for string prop", async () => {
    render(
      <BindingPicker
        open={true}
        onOpenChange={vi.fn()}
        propKey="label"
        propType="string"
        onBind={vi.fn()}
      />,
      { wrapper },
    )

    const input = screen.getByPlaceholderText("Search registry…")
    fireEvent.change(input, { target: { value: "order" } })

    await waitFor(() => {
      expect(screen.getByText("wf.orderApproval")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("wf.orderApproval"))

    await waitFor(() => {
      expect(screen.getByText(/cannot bind a workflow ref/i)).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: "Bind" })).toBeDisabled()
  })

  it("calls onBind with correct shape when Bind is clicked", async () => {
    const onBind = vi.fn()
    render(
      <BindingPicker
        open={true}
        onOpenChange={vi.fn()}
        propKey="source"
        propType="binding"
        onBind={onBind}
      />,
      { wrapper },
    )

    const input = screen.getByPlaceholderText("Search registry…")
    fireEvent.change(input, { target: { value: "order" } })

    await waitFor(() => {
      expect(screen.getByText("entity.SalesOrder")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText("entity.SalesOrder"))

    await waitFor(() => {
      expect(screen.getByText("orderNumber")).toBeInTheDocument()
    })

    // Click a field row to set path
    fireEvent.click(screen.getByText("orderNumber"))

    fireEvent.click(screen.getByRole("button", { name: "Bind" }))

    expect(onBind).toHaveBeenCalledWith({
      bind: {
        kind: "dataSource",
        ref: "entity.SalesOrder",
        path: "orderNumber",
      },
    })
  })

  it("shows 'Select a registry entry' when nothing is selected", () => {
    render(
      <BindingPicker
        open={true}
        onOpenChange={vi.fn()}
        propKey="label"
        propType="string"
        onBind={vi.fn()}
      />,
      { wrapper },
    )

    expect(screen.getByText("Select a registry entry")).toBeInTheDocument()
  })
})
