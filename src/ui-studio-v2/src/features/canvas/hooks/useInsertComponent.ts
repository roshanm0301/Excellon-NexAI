// Phase 6 T12.2.1 — shared component-insert logic used by BOTH the canvas
// drag-drop handler and the keyboard (Enter/Space) insert affordance, so the
// two paths stay in lockstep. Resolves the parent container and creates a node.

import { useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateNode } from "@/shared/query"
import { useWorkspaceStore } from "@/stores/workspace.store"

export interface InsertItem {
  semanticType: string
  defaultProps: Record<string, unknown>
}

export function useInsertComponent() {
  const editingLevel = useWorkspaceStore((s) => s.editingLevel)
  const createNode = useCreateNode()
  const queryClient = useQueryClient()

  return useCallback(
    (item: InsertItem, targetKey: string): string => {
      const logicalKey = `cmp.${item.semanticType.toLowerCase()}.${Date.now()}`
      createNode.mutate(
        {
          kind: "component",
          logicalKey,
          cascadeLevel: editingLevel,
          parentKey: targetKey,
          data: {
            semanticType: item.semanticType,
            props: item.defaultProps,
          },
        },
        {
          onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["preview"] })
          },
        },
      )
      return logicalKey
    },
    [createNode, editingLevel, queryClient],
  )
}
