import { usePanelsStore } from "@/stores/panels.store"
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@/shared/ui"
import { X } from "lucide-react"

// Phase 3 §2 / Phase 2 §D2 — Problems + Preview dock (bottom)
export function BottomDock() {
  const visible = usePanelsStore((s) => s.bottomDockVisible)
  const toggle = usePanelsStore((s) => s.toggleBottomDock)
  const height = usePanelsStore((s) => s.bottomDockHeight)

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
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
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
        <TabsContent value="problems" className="mt-0 flex-1 overflow-auto p-3 text-xs">
          <span className="text-muted-foreground">
            ✓ No issues (Problems dock detail in Prompt 11)
          </span>
        </TabsContent>
        <TabsContent value="preview" className="mt-0 flex-1 overflow-auto p-3 text-xs">
          <span className="text-muted-foreground">Preview mode arrives in Prompt 11</span>
        </TabsContent>
      </Tabs>
    </section>
  )
}
