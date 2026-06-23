// Phase 4 §4 — Zustand→Router sync: components call these to update URL
import { useNavigate } from "@tanstack/react-router"
import type { CascadeLevel, Env } from "@/domain/types"

export function useCascadeNav() {
  const navigate = useNavigate()

  return {
    setEditingLevel: (level: CascadeLevel, scopeId: string) =>
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          editingLevel: level,
          scopeId,
        }),
      }),

    setPreviewScope: (previewScopeId: string) =>
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          previewScopeId,
        }),
      }),

    setEnv: (env: Env) =>
      navigate({
        search: (prev: Record<string, unknown>) => ({ ...prev, env }),
      }),

    setSelection: (selection: string[]) =>
      navigate({
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          selection,
        }),
      }),
  }
}
