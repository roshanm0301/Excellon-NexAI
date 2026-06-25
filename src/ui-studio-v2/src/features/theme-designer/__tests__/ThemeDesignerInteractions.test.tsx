import { describe, it, expect, beforeEach } from "vitest"
import type { ReactNode } from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/shared/ui"
import { ThemeDesigner } from "@/features/theme-designer"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { server } from "@/mocks/server"
import { http, HttpResponse } from "msw"

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

// Use the real seeded theme key so the override endpoint resolves an existing
// node (and returns one with a `kind`, satisfying response-schema validation).
const themeTree = [
  {
    id: "uuid-theme-001",
    logicalKey: "theme.automotive",
    kind: "theme",
    cascadeLevel: "vertical",
    originState: "own",
    label: "Automotive Theme",
    parentKey: null,
    children: [],
  },
]

describe("ThemeDesigner — token editing (T12.3.1 coverage)", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      editingLevel: "tenant",
      editingScopeId: "toyota",
    })
    server.use(http.get("/api/v1/metadata/tree", () => HttpResponse.json(themeTree)))
  })

  it("enables Save after editing a token, then saves", async () => {
    const user = userEvent.setup()
    render(<ThemeDesigner />, { wrapper })

    const input = await screen.findByLabelText("fontFamily value")
    expect(screen.getByLabelText("Save theme")).toBeDisabled()

    await user.clear(input)
    await user.type(input, "Roboto")
    expect(screen.getByLabelText("Save theme")).toBeEnabled()

    await user.click(screen.getByLabelText("Save theme"))
    // Save fires the override mutation against MSW; the dirty flag clears on success.
    await waitFor(() => expect(screen.getByLabelText("Save theme")).toBeDisabled())
  })

  it("shows a revert control once a token is overridden and reverts it", async () => {
    const user = userEvent.setup()
    render(<ThemeDesigner />, { wrapper })

    const input = await screen.findByLabelText("borderRadius value")
    await user.clear(input)
    await user.type(input, "10px")

    const revert = await screen.findByLabelText("Revert borderRadius")
    await user.click(revert)
    // After revert the local override is dropped; the revert control disappears.
    await waitFor(() =>
      expect(screen.queryByLabelText("Revert borderRadius")).not.toBeInTheDocument(),
    )
  })

  it("edits brand asset URLs", async () => {
    const user = userEvent.setup()
    render(<ThemeDesigner />, { wrapper })

    const logo = await screen.findByLabelText("Brand logo URL")
    await user.type(logo, "https://cdn/logo.png")
    expect(logo).toHaveValue("https://cdn/logo.png")
    expect(screen.getByLabelText("Save theme")).toBeEnabled()
  })
})
