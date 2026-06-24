import { useCallback } from "react"
import type { CascadeLevel } from "@/domain/types"
import type { MetaNode } from "@/domain/types"
import { useOverrideNode } from "@/shared/query/mutations"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@/shared/ui"

interface OverridePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  node: MetaNode
  editingLevel: CascadeLevel
}

export function OverridePrompt({
  open,
  onOpenChange,
  node,
  editingLevel,
}: OverridePromptProps) {
  const overrideNode = useOverrideNode()
  const queryClient = useQueryClient()

  const handleOverride = useCallback(() => {
    overrideNode.mutate(
      { logicalKey: node.logicalKey, level: editingLevel, ops: [] },
      {
        onSettled: () => {
          void queryClient.invalidateQueries({ queryKey: ["node"] })
          void queryClient.invalidateQueries({ queryKey: ["tree"] })
          onOpenChange(false)
        },
      },
    )
  }, [overrideNode, node.logicalKey, editingLevel, queryClient, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Override Node?</DialogTitle>
          <DialogDescription className="text-xs">
            Override at <strong>{editingLevel}</strong> level? This node is inherited
            from <strong>{node.cascadeLevel}</strong>. Editing here forks this node;
            the baseline is unchanged.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs"
            disabled={overrideNode.isPending}
            onClick={handleOverride}
          >
            {overrideNode.isPending ? "Overriding…" : "Override"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Revert confirmation dialog — separate component for prop-level revert
interface RevertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propKey: string
  logicalKey: string
  editingLevel: CascadeLevel
}

export function RevertDialog({
  open,
  onOpenChange,
  propKey,
  logicalKey,
  editingLevel,
}: RevertDialogProps) {
  const overrideNode = useOverrideNode()
  const queryClient = useQueryClient()

  const handleRevert = useCallback(() => {
    overrideNode.mutate(
      {
        logicalKey,
        level: editingLevel,
        ops: [{ op: "set", path: `props.${propKey}`, value: null }],
      },
      {
        onSettled: () => {
          void queryClient.invalidateQueries({ queryKey: ["node"] })
          void queryClient.invalidateQueries({ queryKey: ["preview"] })
          onOpenChange(false)
        },
      },
    )
  }, [overrideNode, logicalKey, editingLevel, propKey, queryClient, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Revert Property?</DialogTitle>
          <DialogDescription className="text-xs">
            Revert <strong>{propKey}</strong> to its inherited value? This removes
            your override for this property.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="text-xs"
            disabled={overrideNode.isPending}
            onClick={handleRevert}
          >
            {overrideNode.isPending ? "Reverting…" : "Revert"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
