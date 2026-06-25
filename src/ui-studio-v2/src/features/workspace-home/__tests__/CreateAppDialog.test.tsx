import { describe, it, expect, vi } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { CreateAppDialog } from "@/features/workspace-home"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("CreateAppDialog (T12.3.1 coverage)", () => {
  it("disables Create until name and vertical are provided", async () => {
    render(<CreateAppDialog open onOpenChange={() => {}} onCreated={() => {}} />, { wrapper })
    expect(screen.getByLabelText("Create application")).toBeDisabled()
  })

  it("creates an application and invokes onCreated with the new id", async () => {
    const user = userEvent.setup()
    const onCreated = vi.fn()
    const onOpenChange = vi.fn()
    render(<CreateAppDialog open onOpenChange={onOpenChange} onCreated={onCreated} />, { wrapper })

    await user.type(screen.getByLabelText("Application name"), "Test App")

    // Radix Select — open via keyboard then pick an option.
    const verticalTrigger = screen.getByLabelText("Vertical")
    verticalTrigger.focus()
    await user.keyboard("{Enter}")
    await user.click(await screen.findByRole("option", { name: "Automotive" }))

    const create = screen.getByLabelText("Create application")
    await waitFor(() => expect(create).toBeEnabled())
    await user.click(create)

    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
    expect(typeof onCreated.mock.calls[0][0]).toBe("string")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
