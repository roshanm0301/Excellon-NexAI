import { create } from "zustand"

// Phase 4 §3.1 — workspace/cascade context state
// CascadeLevel and Env will be imported from domain/types in Prompt 02;
// inline literals used here until the domain layer exists.
type Env = "dev" | "staging" | "prod"
type CascadeLevel = "platform" | "vertical" | "tenant" | "org"

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
