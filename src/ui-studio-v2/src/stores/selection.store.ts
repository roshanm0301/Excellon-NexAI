import { create } from "zustand"

// Phase 4 §3.1 — selection state: drives Canvas highlight + Inspector load
interface SelectionState {
  selectedKeys: string[]
  hoverKey: string | null
  setSelected: (keys: string[]) => void
  setHover: (key: string | null) => void
  clearSelection: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedKeys: [],
  hoverKey: null,
  setSelected: (keys) => set({ selectedKeys: keys }),
  setHover: (key) => set({ hoverKey: key }),
  clearSelection: () => set({ selectedKeys: [], hoverKey: null }),
}))
