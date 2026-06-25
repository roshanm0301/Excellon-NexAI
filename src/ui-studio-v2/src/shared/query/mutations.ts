// Phase 4 §3.2 — mutation hooks
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { services } from "@/services"
import { ApiError } from "@/services/http/client"
import type {
  NodeInput,
  OverrideNodeParams,
  TreeNode,
  CreateAppInput,
  CreatePageInput,
  PromoteParams,
  RollbackParams,
  Lock,
} from "@/services/interfaces"
import type { MetaNode, Env } from "@/domain/types"
import { applyOverrideOps } from "@/domain/cascade"

// T12.1.1 — node-level optimistic lock acquisition. A 409 means another user
// already holds the lock; we resolve to a non-throwing "denied" outcome so the
// caller can flip into the read-only/locked-by-other state rather than error.
export type LockOutcome =
  | { acquired: true; lock: Lock }
  | { acquired: false }

export function useLock() {
  return useMutation<LockOutcome, Error, string>({
    mutationFn: async (key: string): Promise<LockOutcome> => {
      try {
        const lock = await services.presence.lock(key)
        return { acquired: true, lock }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { acquired: false }
        }
        throw err
      }
    },
  })
}

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

export function usePublish() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      env: Env
      appId: string
      editingLevel: MetaNode["cascadeLevel"]
      scopeId: string
      targetEnv: Env
    }) => services.compiler.publish(params),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["validate"] })
      void qc.invalidateQueries({ queryKey: ["versions"] })
    },
  })
}

export function usePromote() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: PromoteParams) => services.versioning.promote(params),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["versions"] })
    },
  })
}

export function useRollback() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (params: RollbackParams) => services.versioning.rollback(params),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["versions"] })
    },
  })
}

export function useCreateApp() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAppInput) => services.metadata.createApp(input),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["apps"] })
    },
  })
}

export function useCreatePage() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: CreatePageInput) => services.metadata.createPage(input),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["tree"] })
    },
  })
}
