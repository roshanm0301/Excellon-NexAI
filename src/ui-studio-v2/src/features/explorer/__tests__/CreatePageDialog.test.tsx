import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { TreeNode, RegistryHit } from "@/services/interfaces"
import type { MetaNode } from "@/domain/types"
import { CreatePageDialog } from "@/features/explorer"
import { useWorkspaceStore } from "@/stores/workspace.store"

// ── Router mock ───────────────────────────────────────────────────────────────
const mockNavigate = vi.fn()
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}))

// ── Shared query mocks ────────────────────────────────────────────────────────
const mockMutate = vi.fn()

vi.mock("@/shared/query", () => ({
  useCreatePage: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useTree: () => ({
    data: [
      {
        id: "mod-001",
        logicalKey: "mod.sales",
        kind: "module",
        label: "Sales Module",
        cascadeLevel: "vertical",
        originState: "own",
        parentKey: null,
        children: [],
      } satisfies TreeNode,
    ],
    isLoading: false,
  }),
  useRegistryList: () => ({
    data: [
      { ref: "entity.SalesOrder", kind: "entity", name: "Sales Order" },
      { ref: "entity.Customer", kind: "entity", name: "Customer" },
    ] satisfies RegistryHit[],
  }),
}))

function renderDialog(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onOpenChange = vi.fn()
  render(
    <QueryClientProvider client={qc}>
      <CreatePageDialog open={open} onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

// Opens a Radix combobox and clicks the option matching the given text.
async function selectOption(comboboxLabel: RegExp | string, optionText: RegExp | string) {
  const user = userEvent.setup()
  const trigger = screen.getByRole("combobox", { name: comboboxLabel })
  await user.click(trigger)
  // Radix renders the listbox in a portal; all visible options are role="option"
  const option = await screen.findByRole("option", { name: optionText })
  await user.click(option)
}

describe("CreatePageDialog", () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockMutate.mockClear()
    useWorkspaceStore.setState({
      env: "dev",
      appId: "app.dms",
      pageId: "",
      editingLevel: "vertical",
      editingScopeId: "automotive",
    })
  })

  it("renders all four fields (title, archetype, module, entity)", async () => {
    renderDialog()
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/customer list/i)).toBeInTheDocument()
    // Labels via getByLabelText to avoid ambiguity with hidden Radix option text
    expect(screen.getByLabelText(/archetype/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/parent module/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/primary entity/i)).toBeInTheDocument()
  })

  it("submit button is disabled when title is empty", async () => {
    renderDialog()
    await screen.findByRole("dialog")
    const submitBtn = screen.getByRole("button", { name: /create page/i })
    expect(submitBtn).toBeDisabled()
  })

  it("logicalKey preview updates as user types title", async () => {
    const user = userEvent.setup()
    renderDialog()
    const titleInput = await screen.findByPlaceholderText(/customer list/i)
    await user.type(titleInput, "Customer List")
    await waitFor(() => {
      expect(screen.getByText("page.customerList")).toBeInTheDocument()
    })
  })

  it("calls createPage.mutate with correct moduleKey, archetype, entityRef", async () => {
    const user = userEvent.setup()
    renderDialog()
    await screen.findByRole("dialog")

    // Fill title
    await user.type(screen.getByPlaceholderText(/customer list/i), "Customer List")

    // Select archetype
    await selectOption(/archetype/i, /list report/i)

    // Select module
    await selectOption(/parent module/i, "Sales Module")

    // Select entity
    await selectOption(/primary entity/i, "Customer")

    // Submit
    await user.click(screen.getByRole("button", { name: /create page/i }))

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Customer List",
        archetype: "list-report",
        moduleKey: "mod.sales",
        entityRef: "entity.Customer",
        appId: "app.dms",
      }),
      expect.any(Object),
    )
  })

  it("on success, navigate is called with the new page's logicalKey", async () => {
    const user = userEvent.setup()

    const newPage: MetaNode = {
      id: "uuid-page-new",
      logicalKey: "page.customerList",
      cascadeLevel: "vertical",
      objectVersion: 1,
      audit: { createdBy: "test", createdAt: "", modifiedBy: "test", modifiedAt: "" },
      kind: "page",
      archetype: "list-report",
      title: "Customer List",
      route: "/customer-list",
      views: [],
      layoutRef: "layout.customerList",
    }
    mockMutate.mockImplementation((_input: unknown, opts: { onSuccess?: (page: MetaNode) => void }) => {
      opts?.onSuccess?.(newPage)
    })

    renderDialog()
    await screen.findByRole("dialog")

    await user.type(screen.getByPlaceholderText(/customer list/i), "Customer List")
    await selectOption(/archetype/i, /list report/i)
    await selectOption(/parent module/i, "Sales Module")

    await user.click(screen.getByRole("button", { name: /create page/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "/editor/$appId/$pageId",
          params: expect.objectContaining({ pageId: "page.customerList" }),
        }),
      )
    })
  })

  it("module select is pre-populated from tree data", async () => {
    const user = userEvent.setup()
    renderDialog()
    await screen.findByRole("dialog")

    await user.click(screen.getByRole("combobox", { name: /parent module/i }))
    expect(await screen.findByRole("option", { name: "Sales Module" })).toBeInTheDocument()
  })

  it("entity select includes None option", async () => {
    const user = userEvent.setup()
    renderDialog()
    await screen.findByRole("dialog")

    await user.click(screen.getByRole("combobox", { name: /primary entity/i }))
    // Radix renders options; "None" is the first item with empty value
    const options = await screen.findAllByRole("option")
    const noneOption = options.find((o) => within(o).queryByText("None") !== null)
    expect(noneOption).toBeDefined()
  })
})
