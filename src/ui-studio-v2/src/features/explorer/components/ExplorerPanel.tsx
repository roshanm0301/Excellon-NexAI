import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Skeleton, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui"
import { useTree } from "@/shared/query/hooks"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { CascadeHeader } from "./CascadeHeader"
import { FilterBar } from "./FilterBar"
import { ExplorerTree } from "./ExplorerTree"
import { CreatePageDialog } from "./CreatePageDialog"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import type { ExplorerFilter } from "@/features/explorer/hooks/useExplorerTree"

export function ExplorerPanel() {
  const [filter, setFilter] = useState<ExplorerFilter>("all")
  const [createPageOpen, setCreatePageOpen] = useState(false)
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const editingScopeId = useWorkspaceStore((s) => s.editingScopeId)

  const { data, isLoading, isError, refetch } = useTree(
    env,
    appId,
    editingLevel,
    editingScopeId,
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3" aria-label="Loading explorer" aria-busy>
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" style={{ width: `${85 - i * 5}%` }} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm text-destructive">Couldn&apos;t load the composition tree.</p>
        <button
          className="text-xs text-muted-foreground underline"
          onClick={() => void refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
        No application open.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <CascadeHeader />
      <div className="flex items-center gap-1 pr-1">
        <div className="flex-1">
          <FilterBar value={filter} onChange={setFilter} />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                aria-label="New page"
                onClick={() => setCreatePageOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New page</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex-1 overflow-hidden">
        <ExplorerTree nodes={data} filter={filter} />
      </div>
      <CreatePageDialog open={createPageOpen} onOpenChange={setCreatePageOpen} />
    </div>
  )
}
