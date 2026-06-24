import { useState, useCallback, useEffect } from "react"
import type { BindingKind, PropType } from "@/domain/types"
import type { RegistryHit, TypeShapeField } from "@/services/interfaces"
import { useRegistrySearch, useRegistryShape } from "@/shared/query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  Input,
  Button,
  Badge,
} from "@/shared/ui"

interface BindingPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propKey: string
  propType: PropType
  onBind: (binding: { bind: { kind: BindingKind; ref: string; path?: string } }) => void
}

function inferKind(ref: string): BindingKind {
  if (ref.startsWith("entity.") || ref.startsWith("ds.")) return "dataSource"
  if (ref.startsWith("rule.")) return "rule"
  if (ref.startsWith("wf.")) return "workflow"
  if (ref.startsWith("state.")) return "state"
  return "dataSource"
}

const KIND_LABELS: Record<string, string> = {
  entity: "Entities",
  relationship: "Relationships",
  rule: "Rules",
  workflow: "Workflows",
  connector: "Connectors",
}

function isTypeCompatible(propType: PropType, refKind: string): { ok: boolean; reason?: string } {
  if (propType === "binding" || propType === "unknown" || propType === "record") {
    return { ok: true }
  }
  if (propType === "string" && refKind === "workflow") {
    return { ok: false, reason: "Cannot bind a workflow ref to a string prop" }
  }
  return { ok: true }
}

function groupByKind(hits: RegistryHit[]): Record<string, RegistryHit[]> {
  const groups: Record<string, RegistryHit[]> = {}
  for (const hit of hits) {
    const arr = groups[hit.kind] ?? []
    arr.push(hit)
    groups[hit.kind] = arr
  }
  return groups
}

export function BindingPicker({
  open,
  onOpenChange,
  propKey,
  propType,
  onBind,
}: BindingPickerProps) {
  const [query, setQuery] = useState("")
  const [selectedRef, setSelectedRef] = useState("")
  const [path, setPath] = useState("")

  const { data: hits } = useRegistrySearch(query || " ")
  const { data: shape, isLoading: shapeLoading } = useRegistryShape(selectedRef)

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedRef("")
      setPath("")
    }
  }, [open])

  const selectedHit = hits?.find((h) => h.ref === selectedRef)
  const compat = selectedHit ? isTypeCompatible(propType, selectedHit.kind) : { ok: true }

  const handleSelect = useCallback((ref: string) => {
    setSelectedRef(ref)
    setPath("")
  }, [])

  const handleBind = useCallback(() => {
    if (!selectedRef || !compat.ok) return
    const kind = inferKind(selectedRef)
    onBind({ bind: { kind, ref: selectedRef, path: path || undefined } })
    onOpenChange(false)
  }, [selectedRef, compat.ok, path, onBind, onOpenChange])

  const grouped = groupByKind(hits ?? [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div className="flex h-[420px] flex-col">
          <DialogHeader className="border-b px-4 py-3">
            <DialogTitle className="text-sm">
              Bind &ldquo;{propKey}&rdquo;
            </DialogTitle>
            <DialogDescription className="text-xs">
              Search the registry and select a reference
            </DialogDescription>
          </DialogHeader>

          <div className="flex min-h-0 flex-1">
            {/* Left: search + results */}
            <div className="flex w-1/2 flex-col border-r">
              <Command shouldFilter={false} className="flex flex-1 flex-col">
                <CommandInput
                  placeholder="Search registry…"
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList className="flex-1">
                  <CommandEmpty>No results found.</CommandEmpty>
                  {Object.entries(grouped).map(([kind, items]) => (
                    <CommandGroup key={kind} heading={KIND_LABELS[kind] ?? kind}>
                      {items.map((hit) => (
                        <CommandItem
                          key={hit.ref}
                          value={hit.ref}
                          onSelect={() => handleSelect(hit.ref)}
                          className={selectedRef === hit.ref ? "bg-accent" : ""}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-mono text-xs">{hit.ref}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {hit.name}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ))}
                </CommandList>
              </Command>
            </div>

            {/* Right: shape preview + path + bind button */}
            <div className="flex w-1/2 flex-col">
              {!selectedRef && (
                <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
                  Select a registry entry
                </div>
              )}

              {selectedRef && (
                <div className="flex flex-1 flex-col overflow-auto">
                  <div className="border-b px-3 py-2">
                    <span className="font-mono text-xs font-semibold">{selectedRef}</span>
                    {selectedHit && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {selectedHit.kind}
                      </Badge>
                    )}
                  </div>

                  {shapeLoading && (
                    <div className="p-3 text-xs text-muted-foreground">Loading shape…</div>
                  )}

                  {shape && (
                    <div className="flex-1 overflow-auto px-3 py-2">
                      <table className="w-full text-xs" role="table">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="pb-1 pr-2 font-medium">Field</th>
                            <th className="pb-1 pr-2 font-medium">Type</th>
                            <th className="pb-1 font-medium">Req</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shape.fields.map((f: TypeShapeField) => (
                            <tr
                              key={f.name}
                              className="cursor-pointer border-b border-dashed hover:bg-accent/50"
                              onClick={() => setPath(f.name)}
                            >
                              <td className="py-1 pr-2 font-mono">{f.name}</td>
                              <td className="py-1 pr-2 text-muted-foreground">{f.type}</td>
                              <td className="py-1">{f.required ? "✓" : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="border-t px-3 py-2">
                    <label className="mb-1 block text-[10px] font-medium text-muted-foreground">
                      Path (field within shape)
                    </label>
                    <Input
                      value={path}
                      onChange={(e) => setPath(e.target.value)}
                      placeholder="e.g. orderNumber"
                      className="h-7 font-mono text-xs"
                    />
                  </div>

                  {!compat.ok && (
                    <div className="px-3 pb-2 text-[10px] text-destructive">
                      {compat.reason}
                    </div>
                  )}

                  <div className="border-t px-3 py-2">
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      disabled={!selectedRef || !compat.ok}
                      onClick={handleBind}
                    >
                      Bind
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
