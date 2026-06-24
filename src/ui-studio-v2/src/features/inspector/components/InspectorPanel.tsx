import { useState } from "react"
import { Skeleton, Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@/shared/ui"
import { useSelectionStore } from "@/stores/selection.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useNode } from "@/shared/query"
import type { MetaNode, OriginState } from "@/domain/types"
import { NodeHeader } from "./NodeHeader"
import { PropsTab } from "./PropsTab"
import { EventBuilder } from "./EventBuilder"

const TABS = [
  { value: "props", label: "Props" },
  { value: "bindings", label: "Bindings" },
  { value: "events", label: "Events" },
  { value: "validation", label: "Validation" },
  { value: "a11y", label: "A11y" },
  { value: "responsive", label: "Responsive" },
  { value: "security", label: "Security" },
  { value: "mobile", label: "Mobile" },
] as const

function deriveOrigin(node: MetaNode): OriginState {
  if (!node.overrideOf) return "own"
  if (node.overrideOps && node.overrideOps.length > 0) return "overridden"
  return "inherited"
}

export function InspectorPanel() {
  const selectedKey = useSelectionStore((s) => s.selectedKeys[0] ?? "")
  const { data: node, isLoading, error } = useNode(selectedKey)
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const [eventBuilderOpen, setEventBuilderOpen] = useState(false)

  if (!selectedKey) {
    return (
      <aside aria-label="Inspector" className="flex h-full flex-col">
        <div className="flex h-full items-center justify-center">
          <p className="text-xs text-muted-foreground">Select a node to edit</p>
        </div>
      </aside>
    )
  }

  if (isLoading) {
    return (
      <aside aria-label="Inspector" className="flex h-full flex-col gap-2 p-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </aside>
    )
  }

  if (error || !node) {
    return (
      <aside aria-label="Inspector" className="flex h-full flex-col p-3">
        <p className="text-xs text-destructive">
          {error instanceof Error ? error.message : "Failed to load node"}
        </p>
      </aside>
    )
  }

  const origin = deriveOrigin(node)

  return (
    <aside aria-label="Inspector" className="flex h-full flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-background">
        <NodeHeader node={node} origin={origin} />
      </div>

      <Tabs defaultValue="props" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="m-2 h-auto flex-wrap justify-start gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-[10px]">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-auto">
          <TabsContent value="props" className="mt-0 px-1 py-1">
            {node.kind === "component" ? (
              <PropsTab node={node} origin={origin} />
            ) : (
              <p className="px-2 text-xs text-muted-foreground">
                Not applicable for {node.kind}
              </p>
            )}
          </TabsContent>

          <TabsContent value="bindings" className="mt-0 px-3 py-2 text-xs text-muted-foreground">
            Bindings — Prompt 10
          </TabsContent>

          <TabsContent value="events" className="mt-0 px-3 py-2">
            {node.kind === "component" ? (
              <div className="flex flex-col gap-2">
                {node.eventHandlers && node.eventHandlers.length > 0 ? (
                  <ul className="flex flex-col gap-1">
                    {node.eventHandlers.map((ref) => (
                      <li key={ref} className="rounded border px-2 py-1 font-mono text-xs">
                        {ref}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No event handlers</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setEventBuilderOpen(true)}
                >
                  + Add Event
                </Button>
                <EventBuilder
                  open={eventBuilderOpen}
                  onOpenChange={setEventBuilderOpen}
                  node={node}
                  editingLevel={editingLevel}
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Not applicable for {node.kind}
              </p>
            )}
          </TabsContent>

          <TabsContent value="validation" className="mt-0 px-3 py-2 text-xs">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <span className="text-muted-foreground">Key:</span>
                <span className="font-mono text-xs">{node.logicalKey}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Kind:</span>
                <span className="font-mono text-xs">{node.kind}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground">Level:</span>
                <span className="font-mono text-xs">{node.cascadeLevel}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="a11y" className="mt-0 px-3 py-2 text-xs text-muted-foreground">
            Accessibility — coming soon
          </TabsContent>

          <TabsContent value="responsive" className="mt-0 px-3 py-2 text-xs text-muted-foreground">
            Responsive — coming soon
          </TabsContent>

          <TabsContent value="security" className="mt-0 px-3 py-2 text-xs text-muted-foreground">
            Security — coming soon
          </TabsContent>

          <TabsContent value="mobile" className="mt-0 px-3 py-2 text-xs text-muted-foreground">
            Mobile — coming soon
          </TabsContent>
        </div>
      </Tabs>
    </aside>
  )
}
