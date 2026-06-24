import { usePanelsStore } from "@/stores/panels.store"
import { useWorkspaceStore } from "@/stores/workspace.store"
import { useValidation } from "@/shared/query"
import { Tabs, TabsList, TabsTrigger, TabsContent, Button, Badge } from "@/shared/ui"
import { ProblemsPanel } from "@/features/problems"
import { X } from "lucide-react"

export function BottomDock() {
  const visible = usePanelsStore((s) => s.bottomDockVisible)
  const toggle = usePanelsStore((s) => s.toggleBottomDock)
  const height = usePanelsStore((s) => s.bottomDockHeight)
  const env = useWorkspaceStore((s) => s.env)
  const appId = useWorkspaceStore((s) => s.appId)
  const { data: issues } = useValidation(env, appId)

  const errorCount = issues?.filter((i) => i.severity === "error").length ?? 0

  if (!visible) return null

  return (
    <section
      aria-label="Bottom dock"
      className="flex flex-col border-t border-border bg-background"
      style={{ height: `${height}px` }}
    >
      <Tabs defaultValue="problems" className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-2">
          <TabsList className="my-1.5">
            <TabsTrigger value="problems" className="gap-1.5">
              Problems
              {errorCount > 0 && (
                <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">
                  {errorCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close bottom dock"
            onClick={toggle}
            className="h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <TabsContent value="problems" className="mt-0 flex-1 overflow-auto">
          <ProblemsPanel />
        </TabsContent>
      </Tabs>
    </section>
  )
}
