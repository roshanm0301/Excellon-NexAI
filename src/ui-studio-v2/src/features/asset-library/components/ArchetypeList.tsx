import { DraggableCard } from "./DraggableCard"
import type { InsertableAsset } from "./AssetLibrary"
import { DND_TYPES } from "@/features/asset-library/dnd-types"
import type { ArchetypeEntry } from "@/features/asset-library/catalogue"

interface ArchetypeListProps {
  archetypes: ArchetypeEntry[]
  onInsert?: (asset: InsertableAsset) => void
}

export function ArchetypeList({ archetypes, onInsert }: ArchetypeListProps) {
  if (archetypes.length === 0) {
    return (
      <p className="p-4 text-center text-xs text-muted-foreground">
        No archetypes match.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 p-2" role="list" aria-label="Archetypes">
      {archetypes.map((a) => (
        <div key={a.semanticType} role="listitem">
          <DraggableCard
            type={DND_TYPES.ARCHETYPE}
            label={a.label}
            icon={a.icon}
            semanticType={a.semanticType}
            defaultProps={a.defaultProps}
            onActivate={
              onInsert
                ? () => onInsert({ semanticType: a.semanticType, defaultProps: a.defaultProps, label: a.label })
                : undefined
            }
          />
        </div>
      ))}
    </div>
  )
}
