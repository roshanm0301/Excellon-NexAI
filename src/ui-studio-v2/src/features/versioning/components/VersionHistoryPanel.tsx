import { useState } from "react"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useVersions, useDiff } from "@/shared/query"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Button,
  Badge,
  Skeleton,
  ScrollArea,
  Separator,
} from "@/shared/ui"

export function VersionHistoryPanel() {
  const appId = useWorkspaceStore((s) => s.appId)
  const [selectedV1, setSelectedV1] = useState<number>(0)
  const [selectedV2, setSelectedV2] = useState<number>(0)
  const [comparing, setComparing] = useState(false)

  const { data: versions, isLoading, isError, refetch } = useVersions(appId)
  const { data: diff, isLoading: diffLoading } = useDiff(
    appId,
    comparing ? selectedV1 : 0,
    comparing ? selectedV2 : 0,
  )

  const toggleVersion = (version: number) => {
    if (selectedV1 === 0) {
      setSelectedV1(version)
    } else if (selectedV2 === 0 && version !== selectedV1) {
      setSelectedV2(version)
    } else {
      setSelectedV1(version)
      setSelectedV2(0)
      setComparing(false)
    }
  }

  const handleCompare = () => {
    if (selectedV1 > 0 && selectedV2 > 0) {
      setComparing(true)
    }
  }

  const handleClearSelection = () => {
    setSelectedV1(0)
    setSelectedV2(0)
    setComparing(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 p-4">
        <p className="text-xs text-destructive">Failed to load versions</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm font-medium">Version History</p>
        <p className="mt-2 text-xs text-muted-foreground" aria-label="No versions">
          No published versions yet
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" aria-label="Version history">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-sm font-medium">Version History</p>
        <div className="flex gap-1">
          {selectedV1 > 0 && selectedV2 > 0 && !comparing && (
            <Button variant="outline" size="sm" onClick={handleCompare} aria-label="Compare versions">
              Compare v{selectedV1} ↔ v{selectedV2}
            </Button>
          )}
          {(selectedV1 > 0 || comparing) && (
            <Button variant="ghost" size="sm" onClick={handleClearSelection}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Version</TableHead>
              <TableHead className="w-20">Env</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>By</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((v) => {
              const isSelected = v.version === selectedV1 || v.version === selectedV2
              return (
                <TableRow
                  key={v.version}
                  className={`cursor-pointer ${isSelected ? "bg-muted" : ""}`}
                  data-state={isSelected ? "selected" : undefined}
                  onClick={() => toggleVersion(v.version)}
                  aria-label={`Version ${v.version}`}
                >
                  <TableCell className="font-mono text-xs">v{v.version}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {v.env}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(v.publishedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">{v.publishedBy}</TableCell>
                  <TableCell className="text-xs">{v.message}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {comparing && (
          <>
            <Separator className="my-2" />
            <div className="px-4 py-2">
              <p className="text-xs font-medium">
                Diff: v{selectedV1} → v{selectedV2}
              </p>
            </div>
            {diffLoading && (
              <div className="space-y-2 px-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            )}
            {diff && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node</TableHead>
                    <TableHead className="w-20">Kind</TableHead>
                    <TableHead className="w-20">Change</TableHead>
                    <TableHead>Before</TableHead>
                    <TableHead>After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diff.entries.map((entry, idx) => (
                    <TableRow key={`${entry.logicalKey}-${idx}`}>
                      <TableCell className="truncate font-mono text-[10px]">
                        {entry.logicalKey}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {entry.kind}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.changeType === "added"
                              ? "default"
                              : entry.changeType === "removed"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {entry.changeType}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-[10px] text-muted-foreground">
                        {entry.before ? JSON.stringify(entry.before) : "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate font-mono text-[10px]">
                        {entry.after ? JSON.stringify(entry.after) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </ScrollArea>
    </div>
  )
}
