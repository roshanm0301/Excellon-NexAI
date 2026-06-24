// Phase 4 §3.2 — query hooks: thin wrappers over TanStack Query
import { useQuery } from "@tanstack/react-query"
import type { CascadeLevel, Env } from "@/domain/types"
import { services } from "@/services"
import { qk } from "./keys"

export function useTree(env: Env, appId: string, editingLevel: CascadeLevel, scopeId: string) {
  return useQuery({
    queryKey: qk.tree(env, appId, editingLevel, scopeId),
    queryFn: () => services.metadata.getTree({ env, appId, editingLevel, scopeId }),
  })
}

export function useNode(id: string) {
  return useQuery({
    queryKey: qk.node(id),
    queryFn: () => services.metadata.getNode(id),
    enabled: id !== "",
  })
}

export function usePreview(
  env: Env,
  appId: string,
  pageId: string,
  previewScopeId: string,
  role?: string,
) {
  return useQuery({
    queryKey: qk.preview(env, appId, pageId, previewScopeId, role),
    queryFn: () =>
      services.preview.resolve({ env, appId, pageId, previewScopeId, role }),
  })
}

export function useValidation(env: Env, appId: string) {
  return useQuery({
    queryKey: qk.validate(env, appId),
    queryFn: () =>
      services.compiler.validate({
        env,
        appId,
        editingLevel: "platform",
        scopeId: "",
      }),
  })
}

export function useImpact(env: Env, appId: string, level: CascadeLevel, scopeId: string) {
  return useQuery({
    queryKey: qk.impact(env, appId, level, scopeId),
    queryFn: () => services.compiler.impact({ env, appId, editingLevel: level, scopeId }),
  })
}

export function useRegistrySearch(query: string) {
  return useQuery({
    queryKey: qk.registrySearch(query),
    queryFn: () => services.registry.search(query),
    enabled: query.length > 0,
  })
}

export function useRegistryShape(ref: string) {
  return useQuery({
    queryKey: qk.registryShape(ref),
    queryFn: () => services.registry.shape(ref),
    enabled: ref !== "",
  })
}
