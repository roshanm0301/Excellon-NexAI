import { useWorkspaceStore } from "@/stores/workspace.store"

const LEVEL_LABEL: Record<string, string> = {
  platform: "Platform",
  vertical: "Vertical",
  tenant: "OEM",
  org: "Dealer",
}

export function CascadeHeader() {
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const editingScopeId = useWorkspaceStore((s) => s.editingScopeId)

  const levelLabel = LEVEL_LABEL[editingLevel] ?? editingLevel
  const scopeLabel = editingScopeId || editingLevel

  return (
    <div className="border-b border-border px-3 py-1.5">
      <p className="text-[11px] text-muted-foreground">
        Editing:{" "}
        <span className="font-medium text-foreground">
          {scopeLabel} ({levelLabel})
        </span>
      </p>
    </div>
  )
}
