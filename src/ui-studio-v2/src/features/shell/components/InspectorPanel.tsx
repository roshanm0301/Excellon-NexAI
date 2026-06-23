import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui"

// Phase 3 §2 / Phase 2 §B5 — Inspector: 8 tabs (filled in Prompt 09)
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

export function InspectorPanel() {
  return (
    <aside aria-label="Inspector" className="flex h-full flex-col">
      <Tabs defaultValue="props" className="flex h-full flex-col">
        <TabsList className="m-2 h-auto flex-wrap justify-start gap-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="text-[10px]">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((t) => (
          <TabsContent
            key={t.value}
            value={t.value}
            className="flex-1 overflow-auto px-3 py-2 text-xs text-muted-foreground"
          >
            Inspector — {t.label} (Prompt 09)
          </TabsContent>
        ))}
      </Tabs>
    </aside>
  )
}
