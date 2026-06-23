import { create } from "zustand"

// Phase 4 §3.1 — panel layout state (sizes, visibility, breakpoint)
type Breakpoint = "desktop" | "tablet" | "mobile"

interface PanelsState {
  explorerWidth: number
  inspectorWidth: number
  bottomDockHeight: number
  explorerVisible: boolean
  inspectorVisible: boolean
  bottomDockVisible: boolean
  breakpoint: Breakpoint
  setExplorerWidth: (w: number) => void
  setInspectorWidth: (w: number) => void
  setBottomDockHeight: (h: number) => void
  toggleExplorer: () => void
  toggleInspector: () => void
  toggleBottomDock: () => void
  setBreakpoint: (b: Breakpoint) => void
}

export const usePanelsStore = create<PanelsState>((set) => ({
  explorerWidth: 280,
  inspectorWidth: 320,
  bottomDockHeight: 200,
  explorerVisible: true,
  inspectorVisible: true,
  bottomDockVisible: false,
  breakpoint: "desktop",
  setExplorerWidth: (w) => set({ explorerWidth: w }),
  setInspectorWidth: (w) => set({ inspectorWidth: w }),
  setBottomDockHeight: (h) => set({ bottomDockHeight: h }),
  toggleExplorer: () => set((s) => ({ explorerVisible: !s.explorerVisible })),
  toggleInspector: () => set((s) => ({ inspectorVisible: !s.inspectorVisible })),
  toggleBottomDock: () => set((s) => ({ bottomDockVisible: !s.bottomDockVisible })),
  setBreakpoint: (b) => set({ breakpoint: b }),
}))
