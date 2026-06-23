import { create } from "zustand"
import type { Env, CascadeLevel } from "@/domain/types"

// Phase 4 §3.1 — workspace/cascade context state

interface WorkspaceState {
  env: Env
  editingLevel: CascadeLevel
  editingScopeId: string
  previewScopeId: string
  previewRole?: string
  setEditingLevel: (level: CascadeLevel, scopeId: string) => void
  setPreviewScope: (scopeId: string, role?: string) => void
  setEnv: (env: Env) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  env: "dev",
  editingLevel: "platform",
  editingScopeId: "",
  previewScopeId: "",
  previewRole: undefined,
  setEditingLevel: (level, scopeId) => set({ editingLevel: level, editingScopeId: scopeId }),
  setPreviewScope: (scopeId, role) => set({ previewScopeId: scopeId, previewRole: role }),
  setEnv: (env) => set({ env }),
}))
