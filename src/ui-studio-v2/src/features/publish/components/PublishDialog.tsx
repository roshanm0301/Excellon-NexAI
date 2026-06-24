import { useState } from "react"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { usePanelsStore } from "@/stores/panels.store"
import { useValidation, usePublish, usePromote, useRollback, useVersions } from "@/shared/query"
import type { Env } from "@/domain/types"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
} from "@/shared/ui"
import { CascadeImpactDialog } from "./CascadeImpactDialog"

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PublishDialog({ open, onOpenChange }: PublishDialogProps) {
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const scopeId = useWorkspaceStore((s) => s.editingScopeId)
  const toggleBottomDock = usePanelsStore((s) => s.toggleBottomDock)
  const setActiveMode = usePanelsStore((s) => s.setActiveMode)

  const [targetEnv, setTargetEnv] = useState<Env>("dev")
  const [showImpact, setShowImpact] = useState(false)
  const [publishResult, setPublishResult] = useState<{ version: number; message: string } | null>(null)
  const [rollbackVersion, setRollbackVersion] = useState("")

  const { data: issues } = useValidation(env, appId)
  const { data: versions } = useVersions(appId)
  const publishMutation = usePublish()
  const promoteMutation = usePromote()
  const rollbackMutation = useRollback()

  const errorCount = issues?.filter((i) => i.severity === "error").length ?? 0
  const warningCount = issues?.filter((i) => i.severity === "warning").length ?? 0
  const hasErrors = errorCount > 0

  const handlePublish = () => {
    publishMutation.mutate(
      { env, appId, editingLevel, scopeId, targetEnv },
      {
        onSuccess: (result) => {
          setPublishResult({ version: result.artifactVersion, message: result.message })
          setShowImpact(false)
        },
      },
    )
  }

  const handlePromote = (fromEnv: Env, toEnv: Env) => {
    const latestVersion = versions?.length ?? 0
    promoteMutation.mutate(
      { env, appId, fromEnv, toEnv, version: latestVersion },
      {
        onSuccess: (result) => {
          setPublishResult({ version: result.artifactVersion, message: result.message })
        },
      },
    )
  }

  const handleRollback = () => {
    const targetVersion = Number(rollbackVersion)
    if (targetVersion > 0) {
      rollbackMutation.mutate(
        { env, appId, targetVersion },
        {
          onSuccess: (result) => {
            setPublishResult({ version: result.artifactVersion, message: result.message })
          },
        },
      )
    }
  }

  const openProblems = () => {
    onOpenChange(false)
    setActiveMode("problems")
    toggleBottomDock()
  }

  return (
    <>
      <Dialog open={open && !showImpact} onOpenChange={onOpenChange}>
        <DialogContent aria-label="Publish dialog">
          <DialogHeader>
            <DialogTitle>Publish Application</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Target environment</label>
              <Select value={targetEnv} onValueChange={(v) => setTargetEnv(v as Env)}>
                <SelectTrigger aria-label="Target environment" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dev">Development</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="prod">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded border p-3">
              <p className="text-xs font-medium">Validation Summary</p>
              <div className="mt-1 flex items-center gap-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" aria-label={`${errorCount} errors`}>
                    {errorCount} errors
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" aria-label={`${warningCount} warnings`}>
                    {warningCount} warnings
                  </Badge>
                )}
                {errorCount === 0 && warningCount === 0 && (
                  <span className="text-xs text-muted-foreground">All checks passed</span>
                )}
              </div>
              {hasErrors && (
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                  onClick={openProblems}
                >
                  View problems
                </Button>
              )}
            </div>

            {publishResult && (
              <div className="rounded border border-green-500/30 bg-green-500/10 p-3" role="status">
                <p className="text-sm font-medium text-green-700">
                  Published v{publishResult.version}
                </p>
                <p className="text-xs text-muted-foreground">{publishResult.message}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => setShowImpact(true)}
                disabled={hasErrors || publishMutation.isPending}
                aria-label={hasErrors ? "Publish blocked" : "View impact"}
              >
                {hasErrors ? "Publish blocked" : "View impact"}
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Promote</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromote("dev", "staging")}
                  disabled={promoteMutation.isPending}
                  aria-label="Promote dev to staging"
                >
                  Dev → Staging
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePromote("staging", "prod")}
                  disabled={promoteMutation.isPending}
                  aria-label="Promote staging to prod"
                >
                  Staging → Prod
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground">Rollback</p>
              <div className="flex items-center gap-2">
                <Select value={rollbackVersion} onValueChange={setRollbackVersion}>
                  <SelectTrigger aria-label="Rollback version" className="w-40">
                    <SelectValue placeholder="Version…" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions?.map((v) => (
                      <SelectItem key={v.version} value={String(v.version)}>
                        v{v.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRollback}
                  disabled={!rollbackVersion || rollbackMutation.isPending}
                  aria-label="Rollback"
                >
                  Rollback
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CascadeImpactDialog
        open={showImpact}
        onOpenChange={setShowImpact}
        appId={appId}
        onProceed={handlePublish}
      />
    </>
  )
}
