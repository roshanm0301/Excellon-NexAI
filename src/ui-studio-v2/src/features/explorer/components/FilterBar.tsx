import { Button } from "@/shared/ui"
import { cn } from "@/shared/lib/utils"
// eslint-disable-next-line no-restricted-imports -- intra-feature hook import; same-feature deep imports allowed by convention
import type { ExplorerFilter } from "@/features/explorer/hooks/useExplorerTree"

interface FilterBarProps {
  value: ExplorerFilter
  onChange: (filter: ExplorerFilter) => void
}

const FILTERS: { value: ExplorerFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "orphans", label: "Orphans" },
]

export function FilterBar({ value, onChange }: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filter nodes"
      className="flex gap-1 border-b border-border px-3 py-1.5"
    >
      {FILTERS.map((f) => (
        <Button
          key={f.value}
          variant={value === f.value ? "secondary" : "ghost"}
          size="sm"
          className={cn("h-6 px-2 text-xs")}
          onClick={() => onChange(f.value)}
          aria-pressed={value === f.value}
        >
          {f.label}
        </Button>
      ))}
    </div>
  )
}
