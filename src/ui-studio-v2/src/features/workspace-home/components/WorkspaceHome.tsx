import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useApps } from "@/shared/query"
import type { Env } from "@/domain/types"
import {
  Button,
  Skeleton,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/shared/ui"
import { Plus } from "lucide-react"
import { AppCard } from "./AppCard"
import { CreateAppDialog } from "./CreateAppDialog"

interface WorkspaceHomeProps {
  env?: Env
}

export function WorkspaceHome({ env = "dev" }: WorkspaceHomeProps) {
  const [currentEnv, setCurrentEnv] = useState<Env>(env)
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const { data: apps, isLoading, isError, refetch } = useApps()

  const handleAppClick = (appId: string) => {
    void navigate({
      to: "/editor/$appId",
      params: { appId },
      search: { env: currentEnv, editingLevel: "vertical", scopeId: "automotive" },
    })
  }

  const handleCreated = (appId: string) => {
    handleAppClick(appId)
  }

  return (
    <div className="mx-auto max-w-4xl p-8" aria-label="Workspace home">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <div className="flex items-center gap-3">
          <Select value={currentEnv} onValueChange={(v) => setCurrentEnv(v as Env)}>
            <SelectTrigger aria-label="Environment" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} aria-label="New application">
            <Plus className="mr-1.5 h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-destructive">Failed to load applications</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      )}

      {apps && apps.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground" aria-label="No applications">
            No applications yet. Create one to get started.
          </p>
        </div>
      )}

      {apps && apps.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} onClick={() => handleAppClick(app.id)} />
          ))}
        </div>
      )}

      <CreateAppDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </div>
  )
}
