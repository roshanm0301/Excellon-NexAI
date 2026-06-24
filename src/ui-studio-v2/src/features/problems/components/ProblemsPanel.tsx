import { AlertCircle, AlertTriangle } from "lucide-react"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useSelectionStore } from "@/stores/selection.store"
import { useValidation } from "@/shared/query"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Skeleton,
  Button,
  ScrollArea,
} from "@/shared/ui"
import type { Issue } from "@/domain/types"

function SeverityIcon({ severity }: { severity: Issue["severity"] }) {
  if (severity === "error") {
    return <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-label="Error" />
  }
  return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" aria-label="Warning" />
}

export function ProblemsPanel() {
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const setSelected = useSelectionStore((s) => s.setSelected)
  const { data: issues, isLoading, isError, refetch } = useValidation(env, appId)

  const errorCount = issues?.filter((i) => i.severity === "error").length ?? 0
  const warningCount = issues?.filter((i) => i.severity === "warning").length ?? 0

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-3">
        <p className="text-xs text-destructive">Failed to validate</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!issues || issues.length === 0) {
    return (
      <div className="p-3">
        <p className="text-xs text-muted-foreground" aria-label="No issues">No issues found</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span className="text-xs font-medium" aria-label="Error count">
          {errorCount} errors
        </span>
        <span className="text-xs text-muted-foreground" aria-label="Warning count">
          {warningCount} warnings
        </span>
      </div>
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-32">Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-48">Node</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues.map((issue, idx) => (
              <TableRow
                key={`${issue.nodeId}-${issue.type}-${idx}`}
                className="cursor-pointer"
                role="button"
                aria-label={`${issue.severity}: ${issue.message}`}
                onClick={() => setSelected([issue.nodeId])}
              >
                <TableCell>
                  <SeverityIcon severity={issue.severity} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {issue.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{issue.message}</TableCell>
                <TableCell className="truncate font-mono text-[10px] text-muted-foreground">
                  {issue.nodeId}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
