import { useState, useCallback } from "react"
import type { EventTrigger, ComponentNode, CascadeLevel } from "@/domain/types"
import { useOverrideNode } from "@/shared/query/mutations"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Input,
  Button,
} from "@/shared/ui"
import { ActionRow } from "./ActionRow"
import type { ActionRowValue } from "./ActionRow"

const EVENT_TRIGGERS: EventTrigger[] = [
  "onClick",
  "onChange",
  "onLoad",
  "onSelect",
  "onSubmit",
  "onWorkflowEvent",
  "onTimer",
]

const TRIGGER_LABELS: Record<EventTrigger, string> = {
  onClick: "On Click",
  onChange: "On Change",
  onLoad: "On Load",
  onSelect: "On Select",
  onSubmit: "On Submit",
  onWorkflowEvent: "On Workflow Event",
  onTimer: "On Timer",
}

interface EventBuilderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  node: ComponentNode
  editingLevel: CascadeLevel
}

function emptyAction(): ActionRowValue {
  return { actionKind: "", target: "", transition: "" }
}

function validateActions(actions: ActionRowValue[]): boolean {
  for (const a of actions) {
    if (!a.actionKind) return false
    if (a.actionKind === "trigger-workflow-transition") {
      if (!a.target || !a.transition) return false
    }
  }
  return actions.length > 0
}

export function EventBuilder({
  open,
  onOpenChange,
  node,
  editingLevel,
}: EventBuilderProps) {
  const [trigger, setTrigger] = useState<EventTrigger | "">("")
  const [condition, setCondition] = useState("")
  const [securityGate, setSecurityGate] = useState("")
  const [actions, setActions] = useState<ActionRowValue[]>([emptyAction()])
  const [saveAttempted, setSaveAttempted] = useState(false)

  const overrideNode = useOverrideNode()
  const queryClient = useQueryClient()

  const isValid = trigger !== "" && validateActions(actions)

  const handleAddAction = useCallback(() => {
    setActions((prev) => [...prev, emptyAction()])
  }, [])

  const handleActionChange = useCallback((index: number, value: ActionRowValue) => {
    setActions((prev) => prev.map((a, i) => (i === index ? value : a)))
  }, [])

  const handleActionRemove = useCallback((index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSave = useCallback(() => {
    setSaveAttempted(true)
    if (!isValid) return

    const eventLogicalKey = `evt.${node.logicalKey}.${trigger}`
    const actionOps = actions.map((a, i) => ({
      op: "set" as const,
      path: `actions[${i}]`,
      value: {
        actionKind: a.actionKind,
        target: a.target,
        ...(a.transition ? { inputs: { transition: a.transition } } : {}),
      },
    }))

    overrideNode.mutate(
      {
        logicalKey: node.logicalKey,
        level: editingLevel,
        ops: [
          {
            op: "set",
            path: `eventHandlers`,
            value: [
              ...(node.eventHandlers ?? []),
              eventLogicalKey,
            ],
          },
          ...actionOps,
        ],
      },
      {
        onSettled: () => {
          void queryClient.invalidateQueries({ queryKey: ["node"] })
          void queryClient.invalidateQueries({ queryKey: ["preview"] })
          onOpenChange(false)
        },
      },
    )
  }, [isValid, trigger, actions, node, editingLevel, overrideNode, queryClient, onOpenChange])

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setTrigger("")
        setCondition("")
        setSecurityGate("")
        setActions([emptyAction()])
        setSaveAttempted(false)
      }
      onOpenChange(nextOpen)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm">Add Event Handler</DialogTitle>
          <DialogDescription className="text-xs">
            Configure a trigger and its actions for {node.logicalKey}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Trigger */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Trigger</label>
            <Select value={trigger} onValueChange={(v) => setTrigger(v as EventTrigger)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select trigger…" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TRIGGERS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TRIGGER_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {saveAttempted && !trigger && (
              <p className="text-[10px] text-destructive">Trigger is required</p>
            )}
          </div>

          {/* Condition (optional rule ref) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              Condition <span className="font-normal text-muted-foreground">(optional rule ref)</span>
            </label>
            <Input
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. rule.orderHasLines"
              className="h-7 font-mono text-xs"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium">Actions</label>
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px]"
                onClick={handleAddAction}
              >
                + Add Action
              </Button>
            </div>
            {actions.map((action, index) => (
              <ActionRow
                key={index}
                value={action}
                onChange={(v) => handleActionChange(index, v)}
                onRemove={() => handleActionRemove(index)}
              />
            ))}
            {saveAttempted && actions.length === 0 && (
              <p className="text-[10px] text-destructive">At least one action is required</p>
            )}
          </div>

          {/* Security gate (optional) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">
              Security Gate <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={securityGate}
              onChange={(e) => setSecurityGate(e.target.value)}
              placeholder="e.g. connector.erp"
              className="h-7 font-mono text-xs"
            />
          </div>

          {/* Save */}
          <Button
            size="sm"
            className="w-full text-xs"
            disabled={saveAttempted && !isValid}
            onClick={handleSave}
          >
            {overrideNode.isPending ? "Saving…" : "Save Event"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
