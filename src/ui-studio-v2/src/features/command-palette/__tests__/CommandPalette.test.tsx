import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommandPalette, useCommandPalette } from "@/features/command-palette"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"
import { usePanelsStore } from "@/stores/panels.store"
import { useState } from "react"

// Phase 5 T5.4.1 — command palette integration

function Harness() {
  const { isOpen, setIsOpen } = useCommandPalette()
  return <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
}

function ControlledHarness({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  return <CommandPalette open={open} onOpenChange={setOpen} />
}

describe("CommandPalette", () => {
  beforeEach(() => {
    useWorkspaceStore.setState({
      env: "dev",
      editingLevel: "vertical",
      editingScopeId: "automotive",
      previewScopeId: "",
      previewRole: undefined,
    })
    useSelectionStore.setState({ selectedKeys: [], hoverKey: null })
    usePanelsStore.setState({ bottomDockVisible: false, activeMode: "explorer" })
  })

  it("opens on Cmd+K keyboard shortcut", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    await user.keyboard("{Meta>}k{/Meta}")
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("opens on Ctrl+K keyboard shortcut", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard("{Control>}k{/Control}")
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("renders the four command groups when open", async () => {
    render(<ControlledHarness initialOpen />)
    expect(await screen.findByText(/Actions/i)).toBeInTheDocument()
    expect(screen.getByText(/Switch editing level/i)).toBeInTheDocument()
    expect(screen.getByText(/Go to/i)).toBeInTheDocument()
  })

  it("switching editing level via palette updates workspace store", async () => {
    const user = userEvent.setup()
    render(<ControlledHarness initialOpen />)
    const oemItem = await screen.findByRole("option", { name: /OEM \(Tenant\)/i })
    await user.click(oemItem)
    expect(useWorkspaceStore.getState().editingLevel).toBe("tenant")
  })

  it("'Go to' item updates selection store", async () => {
    const user = userEvent.setup()
    render(<ControlledHarness initialOpen />)
    const item = await screen.findByRole("option", { name: /Sales Order page/i })
    await user.click(item)
    expect(useSelectionStore.getState().selectedKeys).toEqual(["page.salesOrder"])
  })

  it("empty filter shows 'No commands match'", async () => {
    const user = userEvent.setup()
    render(<ControlledHarness initialOpen />)
    const input = await screen.findByPlaceholderText(/type a command/i)
    await user.type(input, "zzzzzzz")
    expect(await screen.findByText(/No commands match/i)).toBeInTheDocument()
  })

  it("close handler closes the palette", async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.keyboard("{Control>}k{/Control}")
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    // Escape closes via Radix Dialog
    await act(async () => {
      await user.keyboard("{Escape}")
    })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
