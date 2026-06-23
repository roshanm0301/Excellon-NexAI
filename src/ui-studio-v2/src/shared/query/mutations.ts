// Phase 4 §3.2 — mutation hooks
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { services } from "@/services"
import type { NodeInput, OverrideNodeParams, TreeNode } from "@/services/interfaces"
import type { MetaNode } from "@/domain/types"
import { applyOverrideOps } from "@/domain/cascade"

export function useCreateNode() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: NodeInput) => services.metadata.createNode(input),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["tree"] })
      void qc.invalidateQueries({ queryKey: ["validate"] })
    },
  })
}

export function useOverrideNode() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: OverrideNodeParams) => services.metadata.overrideNode(params),
    onMutate: async (params) => {
      await qc.cancelQueries({ queryKey: ["tree"] })
      await qc.cancelQueries({ queryKey: ["node"] })

      const treeSnapshot = qc.getQueriesData<TreeNode[]>({ queryKey: ["tree"] })
      const nodeSnapshot = qc.getQueriesData<MetaNode>({ queryKey: ["node"] })

      qc.setQueriesData<MetaNode>({ queryKey: ["node"] }, (old) => {
        if (!old || old.logicalKey !== params.logicalKey) return old
        return applyOverrideOps(old, params.ops)
      })

      return { treeSnapshot, nodeSnapshot }
    },
    onError: (_err, _params, context) => {
      if (context?.treeSnapshot) {
        for (const [key, data] of context.treeSnapshot) {
          qc.setQueryData(key, data)
        }
      }
      if (context?.nodeSnapshot) {
        for (const [key, data] of context.nodeSnapshot) {
          qc.setQueryData(key, data)
        }
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["tree"] })
      void qc.invalidateQueries({ queryKey: ["node"] })
      void qc.invalidateQueries({ queryKey: ["validate"] })
    },
  })
}
