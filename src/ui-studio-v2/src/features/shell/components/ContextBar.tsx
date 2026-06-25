import { useState } from "react"
import { Command as CommandIcon } from "lucide-react"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { useValidation } from "@/shared/query"
import { PublishDialog } from "@/features/publish"
import type { CascadeLevel } from "@/domain/types"
import type { PresenceUser } from "@/services/interfaces"
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Avatar,
  AvatarFallback,
  Separator,
} from "@/shared/ui"

const EDITING_LEVELS: { value: CascadeLevel; label: string }[] = [
  { value: "platform", label: "Platform" },
  { value: "vertical", label: "Vertical" },
  { value: "tenant", label: "OEM" },
  { value: "org", label: "Dealer" },
]

const PREVIEW_SCOPES: { value: string; label: string }[] = [
  { value: "toyota", label: "Toyota" },
  { value: "dealer-x", label: "Dealer-X" },
]

interface ContextBarProps {
  onOpenCommandPalette: () => void
  presenceUsers?: PresenceUser[]
}

export function ContextBar({ onOpenCommandPalette, presenceUsers = [] }: ContextBarProps) {
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const editingScopeId = useWorkspaceStore((s) => s.editingScopeId)
  const previewScopeId = useWorkspaceStore((s) => s.previewScopeId)
  const setEditingLevel = useWorkspaceStore((s) => s.setEditingLevel)
  const setPreviewScope = useWorkspaceStore((s) => s.setPreviewScope)
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const toggleBottomDock = usePanelsStore((s) => s.toggleBottomDock)
  const setActiveMode = usePanelsStore((s) => s.setActiveMode)
  const bottomDockVisible = usePanelsStore((s) => s.bottomDockVisible)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  const { data: issues } = useValidation(env, appId)
  const errorCount = issues?.filter((i) => i.severity === "error").length ?? 0

  const handleValidate = () => {
    setActiveMode("problems")
    if (!bottomDockVisible) {
      toggleBottomDock()
    }
  }

  return (
    <header
      role="banner"
      aria-label="Context Bar"
      className="flex h-10 items-center gap-2 border-b border-border bg-background px-3"
    >
      <span className="text-xs font-medium text-muted-foreground">Editing:</span>
      <div className="w-32">
        <Select
          value={editingLevel}
          onValueChange={(v) => setEditingLevel(v as CascadeLevel, editingScopeId)}
        >
          <SelectTrigger aria-label="Editing level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDITING_LEVELS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <span className="text-xs font-medium text-muted-foreground">Preview as:</span>
      <div className="w-32">
        <Select
          value={previewScopeId || undefined}
          onValueChange={(v) => setPreviewScope(v)}
        >
          <SelectTrigger aria-label="Preview scope">
            <SelectValue placeholder="Select scope…" />
          </SelectTrigger>
          <SelectContent>
            {PREVIEW_SCOPES.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Open command palette"
          onClick={onOpenCommandPalette}
          className="gap-1.5"
        >
          <CommandIcon className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">&#8984;K</span>
        </Button>

        {presenceUsers.length > 0 && (
          <div className="flex -space-x-2" aria-label="Presence">
            {presenceUsers.slice(0, 3).map((u) => (
              <Avatar key={u.userId} aria-label={u.displayName}>
                <AvatarFallback>{u.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleValidate}
          aria-label="Validate"
          className="gap-1.5"
        >
          Validate
          {errorCount > 0 && (
            <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
              {errorCount}
            </Badge>
          )}
        </Button>
        <Button
          variant="default"
          size="sm"
          aria-label="Publish"
          onClick={() => setPublishDialogOpen(true)}
        >
          Publish
        </Button>
      </div>

      <PublishDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen} />
    </header>
  )
}
