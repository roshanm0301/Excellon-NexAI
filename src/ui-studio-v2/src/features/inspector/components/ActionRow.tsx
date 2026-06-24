import { useCallback } from "react"
import type { ActionKind } from "@/domain/types"
import { useRegistryShape } from "@/shared/query"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Input,
  Button,
} from "@/shared/ui"

const ACTION_KINDS: ActionKind[] = [
  "mutate-entity",
  "invoke-rule",
  "trigger-workflow-transition",
  "navigate",
  "set-state",
  "call-api",
  "composite",
]

const ACTION_KIND_LABELS: Record<ActionKind, string> = {
  "mutate-entity": "Mutate Entity",
  "invoke-rule": "Invoke Rule",
  "trigger-workflow-transition": "Trigger Workflow Transition",
  "navigate": "Navigate",
  "set-state": "Set State",
  "call-api": "Call API",
  "composite": "Composite",
}

export interface ActionRowValue {
  actionKind: ActionKind | ""
  target: string
  transition: string
}

interface ActionRowProps {
  value: ActionRowValue
  onChange: (value: ActionRowValue) => void
  onRemove: () => void
}

function extractTransitions(fields: { name: string; type: string }[]): string[] {
  const tf = fields.find((f) => f.name === "transitions" && f.type === "string[]")
  if (!tf) return []
  return ["submit", "approve", "reject"]
}

export function ActionRow({ value, onChange, onRemove }: ActionRowProps) {
  const isWorkflowTransition = value.actionKind === "trigger-workflow-transition"
  const { data: shape, isLoading: shapeLoading } = useRegistryShape(
    isWorkflowTransition ? value.target : "",
  )

  const transitions = shape ? extractTransitions(shape.fields) : []
  const hasTransitionError =
    isWorkflowTransition && value.target !== "" && value.transition === "" && !shapeLoading

  const handleKindChange = useCallback(
    (kind: string) => {
      onChange({ ...value, actionKind: kind as ActionKind, target: "", transition: "" })
    },
    [value, onChange],
  )

  const handleTargetChange = useCallback(
    (target: string) => {
      onChange({ ...value, target, transition: "" })
    },
    [value, onChange],
  )

  const handleTransitionChange = useCallback(
    (transition: string) => {
      onChange({ ...value, transition })
    },
    [value, onChange],
  )

  return (
    <div className="flex flex-col gap-2 rounded border p-2">
      <div className="flex items-center gap-2">
        <Select value={value.actionKind} onValueChange={handleKindChange}>
          <SelectTrigger className="h-7 flex-1 text-xs">
            <SelectValue placeholder="Action kind…" />
          </SelectTrigger>
          <SelectContent>
            {ACTION_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {ACTION_KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      {value.actionKind && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground">Target</label>
          <Input
            value={value.target}
            onChange={(e) => handleTargetChange(e.target.value)}
            placeholder="e.g. wf.orderApproval"
            className="h-7 font-mono text-xs"
          />
        </div>
      )}

      {isWorkflowTransition && value.target && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-medium text-muted-foreground">
            Transition
          </label>
          {shapeLoading ? (
            <p className="text-[10px] text-muted-foreground">Loading transitions…</p>
          ) : transitions.length > 0 ? (
            <Select value={value.transition} onValueChange={handleTransitionChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Select transition…" />
              </SelectTrigger>
              <SelectContent>
                {transitions.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[10px] text-destructive">
              No transitions found for {value.target}
            </p>
          )}
          {hasTransitionError && transitions.length > 0 && (
            <p className="text-[10px] text-destructive">
              A transition must be selected
            </p>
          )}
        </div>
      )}
    </div>
  )
}
