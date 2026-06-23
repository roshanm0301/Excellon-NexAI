import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { useSelectionStore } from "@/stores/selection.store"
import type { CascadeLevel } from "@/domain/types"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/shared/ui"

// Phase 2 §B6 / Phase 3 §14 — Command palette overlay
interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EDITING_LEVELS: { value: CascadeLevel; label: string }[] = [
  { value: "platform", label: "Platform" },
  { value: "vertical", label: "Vertical" },
  { value: "tenant", label: "OEM (Tenant)" },
  { value: "org", label: "Dealer (Org)" },
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const setEditingLevel = useWorkspaceStore((s) => s.setEditingLevel)
  const editingScopeId = useWorkspaceStore((s) => s.editingScopeId)
  const toggleBottomDock = usePanelsStore((s) => s.toggleBottomDock)
  const setActiveMode = usePanelsStore((s) => s.setActiveMode)
  const setSelected = useSelectionStore((s) => s.setSelected)

  function run(fn: () => void) {
    fn()
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} label="Command palette">
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No commands match.</CommandEmpty>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(toggleBottomDock)}>Validate</CommandItem>
          <CommandItem onSelect={() => run(() => setActiveMode("history"))}>
            Open version history
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Switch editing level">
          {EDITING_LEVELS.map((lvl) => (
            <CommandItem
              key={lvl.value}
              onSelect={() => run(() => setEditingLevel(lvl.value, editingScopeId))}
            >
              {lvl.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Go to">
          <CommandItem onSelect={() => run(() => setSelected(["page.salesOrder"]))}>
            Sales Order page
          </CommandItem>
          <CommandItem onSelect={() => run(() => setSelected(["page.orderList"]))}>
            Order List page
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
