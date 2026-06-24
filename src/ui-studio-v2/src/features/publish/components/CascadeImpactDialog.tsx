import { useWorkspaceStore } from "@/stores/workspace.store"
import { useImpact } from "@/shared/query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Skeleton,
} from "@/shared/ui"

interface CascadeImpactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appId: string
  onProceed: () => void
}

export function CascadeImpactDialog({
  open,
  onOpenChange,
  appId,
  onProceed,
}: CascadeImpactDialogProps) {
  const env = useWorkspaceStore((s) => s.env)
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const scopeId = useWorkspaceStore((s) => s.editingScopeId)

  const { data, isLoading, isError } = useImpact(env, appId, editingLevel, scopeId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-label="Cascade impact analysis">
        <DialogHeader>
          <DialogTitle>Cascade Impact Analysis</DialogTitle>
          <DialogDescription>
            Review the impact of publishing changes across the cascade hierarchy.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3 py-4" aria-label="Computing impact">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {isError && (
          <div className="rounded border border-destructive/50 bg-destructive/10 p-4" role="alert">
            <p className="text-sm font-medium text-destructive">
              Couldn&apos;t compute impact — publish blocked
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Impact analysis must succeed before publishing. Please try again.
            </p>
          </div>
        )}

        {data && (
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Affected OEMs</p>
                <p className="text-lg font-semibold" aria-label="Affected OEMs count">
                  {data.affectedOems}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Affected Dealers</p>
                <p className="text-lg font-semibold" aria-label="Affected dealers count">
                  {data.affectedDealers}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Orphaned Overrides</p>
                <p className="text-lg font-semibold" aria-label="Orphaned overrides count">
                  {data.orphanedOverrides}
                </p>
              </div>
              <div className="rounded border p-3">
                <p className="text-xs text-muted-foreground">Broken Bindings</p>
                <p className="text-lg font-semibold" aria-label="Broken bindings count">
                  {data.brokenBindings}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{data.summary}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onProceed}
            disabled={isLoading || isError}
            aria-label="Proceed to publish"
          >
            Proceed to publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
