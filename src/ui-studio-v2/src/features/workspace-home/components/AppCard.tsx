import type { AppSummary } from "@/services/interfaces"
import { Badge } from "@/shared/ui"

interface AppCardProps {
  app: AppSummary
  onClick: () => void
}

export function AppCard({ app, onClick }: AppCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
      aria-label={`Open ${app.name}`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-medium">{app.name}</h3>
        <Badge variant="outline" className="text-[10px]">
          {app.vertical}
        </Badge>
      </div>
      {app.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{app.description}</p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Last modified: {new Date(app.modifiedAt).toLocaleDateString()}
      </p>
    </button>
  )
}
