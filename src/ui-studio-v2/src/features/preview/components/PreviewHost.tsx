import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore, type Breakpoint } from "@/stores/panels.store"
import { usePreview } from "@/shared/query"
import { Renderer } from "@/runtime-preview/Renderer"
import {
  Button,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui"
import { cn } from "@/shared/lib/utils"

const BREAKPOINTS: { value: Breakpoint; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
]

const PREVIEW_SCOPES: { value: string; label: string }[] = [
  { value: "toyota", label: "Toyota" },
  { value: "dealer-x", label: "Dealer-X" },
]

const PREVIEW_ROLES: { value: string; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "User" },
]

export function PreviewHost() {
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const pageId = useWorkspaceStore((s) => s.pageId)
  const previewScopeId = useWorkspaceStore((s) => s.previewScopeId)
  const previewRole = useWorkspaceStore((s) => s.previewRole)
  const setPreviewScope = useWorkspaceStore((s) => s.setPreviewScope)
  const breakpoint = usePanelsStore((s) => s.breakpoint)
  const setBreakpoint = usePanelsStore((s) => s.setBreakpoint)

  const { data, isLoading, isError, error, refetch } = usePreview(
    env,
    appId,
    pageId || "main-page",
    previewScopeId,
    previewRole,
  )

  return (
    <div className="flex h-full flex-col bg-muted/20" aria-label="Preview mode">
      <div
        role="toolbar"
        aria-label="Preview toolbar"
        className="flex h-9 items-center gap-2 border-b border-border bg-background px-2"
      >
        <span className="text-xs font-medium text-muted-foreground">Preview as:</span>
        <div className="w-28">
          <Select
            value={previewScopeId || undefined}
            onValueChange={(v) => setPreviewScope(v, previewRole)}
          >
            <SelectTrigger aria-label="Preview scope" className="h-7 text-xs">
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

        <div className="w-24">
          <Select
            value={previewRole || undefined}
            onValueChange={(v) => setPreviewScope(previewScopeId, v)}
          >
            <SelectTrigger aria-label="Preview role" className="h-7 text-xs">
              <SelectValue placeholder="Role…" />
            </SelectTrigger>
            <SelectContent>
              {PREVIEW_ROLES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mx-1 h-4 w-px bg-border" />

        <div role="group" aria-label="Breakpoint" className="flex items-center gap-0.5">
          {BREAKPOINTS.map((bp) => (
            <Button
              key={bp.value}
              variant={breakpoint === bp.value ? "secondary" : "ghost"}
              size="sm"
              aria-label={bp.label}
              aria-pressed={breakpoint === bp.value}
              onClick={() => setBreakpoint(bp.value)}
              className={cn("h-7 px-2 text-xs")}
            >
              {bp.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {!previewScopeId && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select a preview scope to see the resolved view
            </p>
          </div>
        )}

        {previewScopeId && isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        )}

        {previewScopeId && isError && (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load preview"}
            </p>
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        )}

        {previewScopeId && data && (
          <div>
            <Renderer model={data} />
          </div>
        )}
      </div>
    </div>
  )
}
