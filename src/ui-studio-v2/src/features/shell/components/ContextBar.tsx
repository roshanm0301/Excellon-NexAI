import { useState } from "react"
import { Command as CommandIcon } from "lucide-react"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import type { CascadeLevel } from "@/domain/types"
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Avatar,
  AvatarFallback,
  Separator,
} from "@/shared/ui"

// Phase 3 §2 / Phase 2 §A3 — Context Bar (top): editing level + preview-as +
// Validate/Publish actions + presence + Command Palette trigger.

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
  presenceUsers?: { userId: string; displayName: string }[]
}

export function ContextBar({ onOpenCommandPalette, presenceUsers = [] }: ContextBarProps) {
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const editingScopeId = useWorkspaceStore((s) => s.editingScopeId)
  const previewScopeId = useWorkspaceStore((s) => s.previewScopeId)
  const setEditingLevel = useWorkspaceStore((s) => s.setEditingLevel)
  const setPreviewScope = useWorkspaceStore((s) => s.setPreviewScope)
  const toggleBottomDock = usePanelsStore((s) => s.toggleBottomDock)
  const [isPublishing, setIsPublishing] = useState(false)

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
          <span className="hidden text-xs sm:inline">⌘K</span>
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

        <Button variant="outline" size="sm" onClick={toggleBottomDock} aria-label="Validate">
          Validate
        </Button>
        <Button
          variant="default"
          size="sm"
          aria-label="Publish"
          onClick={() => setIsPublishing((v) => !v)}
          disabled={isPublishing}
        >
          Publish
        </Button>
      </div>
    </header>
  )
}
