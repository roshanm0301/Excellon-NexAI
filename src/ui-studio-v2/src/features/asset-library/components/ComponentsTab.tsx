import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/ui"
import { DraggableCard } from "./DraggableCard"
import type { InsertableAsset } from "./AssetLibrary"
import { DND_TYPES } from "@/features/asset-library/dnd-types"
import { CATEGORIES, type CatalogueEntry, type CatalogueCategory } from "@/features/asset-library/catalogue"

interface ComponentsTabProps {
  components: CatalogueEntry[]
  onInsert?: (asset: InsertableAsset) => void
}

export function ComponentsTab({ components, onInsert }: ComponentsTabProps) {
  const byCategory = CATEGORIES.reduce<Record<CatalogueCategory, CatalogueEntry[]>>(
    (acc, cat) => {
      acc[cat] = components.filter((c) => c.category === cat)
      return acc
    },
    {} as Record<CatalogueCategory, CatalogueEntry[]>,
  )

  const nonEmpty = CATEGORIES.filter((cat) => byCategory[cat].length > 0)

  if (nonEmpty.length === 0) {
    return (
      <p className="p-4 text-center text-xs text-muted-foreground">
        No components match.
      </p>
    )
  }

  return (
    <Accordion type="multiple" defaultValue={nonEmpty} className="px-2">
      {nonEmpty.map((cat) => (
        <AccordionItem key={cat} value={cat}>
          <AccordionTrigger className="px-1 text-xs">
            {cat} ({byCategory[cat].length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-3 gap-1.5" role="list" aria-label={`${cat} components`}>
              {byCategory[cat].map((c) => (
                <div key={c.semanticType} role="listitem">
                  <DraggableCard
                    type={DND_TYPES.COMPONENT}
                    label={c.label}
                    icon={c.icon}
                    semanticType={c.semanticType}
                    defaultProps={c.defaultProps}
                    onActivate={
                      onInsert
                        ? () => onInsert({ semanticType: c.semanticType, defaultProps: c.defaultProps, label: c.label })
                        : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
