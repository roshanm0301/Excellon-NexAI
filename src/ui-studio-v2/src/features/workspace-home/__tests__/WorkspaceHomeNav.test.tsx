import { describe, it, expect, vi, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const navigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }))

import { WorkspaceHome } from "@/features/workspace-home"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

describe("WorkspaceHome — navigation & create (T12.3.1 coverage)", () => {
  beforeEach(() => navigate.mockReset())

  it("navigates to the editor when an app card is clicked", async () => {
    const user = userEvent.setup()
    render(<WorkspaceHome env="dev" />, { wrapper })

    const card = await screen.findByRole("button", { name: /open dms application/i })
    await user.click(card)

    expect(navigate).toHaveBeenCalledTimes(1)
    const arg = navigate.mock.calls[0][0]
    expect(arg.to).toBe("/editor/$appId")
    expect(arg.params.appId).toBe("app.dms")
  })

  it("opens the create dialog from the New Application button", async () => {
    const user = userEvent.setup()
    render(<WorkspaceHome env="dev" />, { wrapper })

    await user.click(screen.getByRole("button", { name: "New application" }))

    await waitFor(() => {
      expect(screen.getByLabelText("Create new application")).toBeInTheDocument()
    })
  })
})
