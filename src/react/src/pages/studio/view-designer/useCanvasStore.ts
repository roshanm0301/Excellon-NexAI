import { create } from 'zustand'
import type { ComponentNode, ViewPayload, EventDefinition, DataSourceConfig, FieldBinding, VisibilityRule } from '../../../types/viewStudio'

// ─── Canvas State Types ──────────────────────────────────────────────────────

export interface CanvasState {
  // Current view data
  viewId: string | null
  viewCode: string | null
  isDirty: boolean
  payload: ViewPayload | null

  // Selection
  selectedKey: string | null
  hoveredKey: string | null

  // UI state
  panelMode: 'properties' | 'events' | 'bindings' | 'visibility'
  paletteOpen: boolean
  previewMode: boolean
  insertTarget: InsertTarget | null

  // Undo/redo
  history: ViewPayload[]
  historyIndex: number

  // Actions
  setView: (viewId: string, viewCode: string | null, payload: ViewPayload) => void
  reset: () => void
  select: (key: string | null) => void
  hover: (key: string | null) => void
  setPanelMode: (mode: CanvasState['panelMode']) => void
  togglePalette: () => void
  togglePreview: () => void
  setInsertTarget: (target: InsertTarget | null) => void

  // Tree mutations
  updateTree: (tree: ComponentNode) => void
  updateNodeProps: (key: string, props: Record<string, unknown>) => void
  updateNodeBindings: (key: string, bindings: Record<string, FieldBinding>) => void
  updateNodeVisibility: (key: string, visibility: VisibilityRule | undefined) => void
  insertNode: (parentKey: string, node: ComponentNode, index?: number) => void
  removeNode: (key: string) => void
  moveNode: (key: string, newParentKey: string, index?: number) => void
  duplicateNode: (key: string) => void

  // Events / datasources
  setEvents: (events: EventDefinition[]) => void
  setDataSources: (ds: DataSourceConfig[]) => void

  // Undo/redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // Helpers
  getNode: (key: string) => ComponentNode | null
  getPayload: () => ViewPayload | null
}

export interface InsertTarget {
  parentKey: string
  index?: number
}

// ─── Tree Utilities ──────────────────────────────────────────────────────────

function findNode(tree: ComponentNode, key: string): ComponentNode | null {
  if (tree.component_key === key) return tree
  for (const child of tree.children ?? []) {
    const found = findNode(child, key)
    if (found) return found
  }
  return null
}

function updateNode(tree: ComponentNode, key: string, updater: (n: ComponentNode) => ComponentNode): ComponentNode {
  if (tree.component_key === key) return updater(tree)
  return {
    ...tree,
    children: (tree.children ?? []).map(c => updateNode(c, key, updater)),
  }
}

function removeFromTree(tree: ComponentNode, key: string): ComponentNode {
  return {
    ...tree,
    children: (tree.children ?? [])
      .filter(c => c.component_key !== key)
      .map(c => removeFromTree(c, key)),
  }
}

function insertInTree(tree: ComponentNode, parentKey: string, node: ComponentNode, index?: number): ComponentNode {
  if (tree.component_key === parentKey) {
    const children = [...(tree.children ?? [])]
    if (index !== undefined && index >= 0 && index <= children.length) {
      children.splice(index, 0, node)
    } else {
      children.push(node)
    }
    return { ...tree, children }
  }
  return {
    ...tree,
    children: (tree.children ?? []).map(c => insertInTree(c, parentKey, node, index)),
  }
}

function cloneNode(node: ComponentNode, suffix: string): ComponentNode {
  return {
    ...node,
    component_key: `${node.component_key}_${suffix}`,
    children: (node.children ?? []).map(c => cloneNode(c, suffix)),
  }
}

function generateSuffix(): string {
  return Math.random().toString(36).slice(2, 8)
}

// ─── Store ───────────────────────────────────────────────────────────────────

const MAX_HISTORY = 50

export const useCanvasStore = create<CanvasState>((set, get) => ({
  viewId: null,
  viewCode: null,
  isDirty: false,
  payload: null,
  selectedKey: null,
  hoveredKey: null,
  panelMode: 'properties',
  paletteOpen: true,
  previewMode: false,
  insertTarget: null,
  history: [],
  historyIndex: -1,

  setView: (viewId, viewCode, payload) => set({
    viewId,
    viewCode,
    payload,
    isDirty: false,
    selectedKey: null,
    hoveredKey: null,
    history: [payload],
    historyIndex: 0,
  }),

  reset: () => set({
    viewId: null,
    viewCode: null,
    isDirty: false,
    payload: null,
    selectedKey: null,
    hoveredKey: null,
    panelMode: 'properties',
    paletteOpen: true,
    previewMode: false,
    insertTarget: null,
    history: [],
    historyIndex: -1,
  }),

  select: (key) => set({ selectedKey: key }),
  hover: (key) => set({ hoveredKey: key }),
  setPanelMode: (mode) => set({ panelMode: mode }),
  togglePalette: () => set(s => ({ paletteOpen: !s.paletteOpen })),
  togglePreview: () => set(s => ({ previewMode: !s.previewMode })),
  setInsertTarget: (target) => set({ insertTarget: target }),

  updateTree: (tree) => {
    const state = get()
    const newPayload = { ...state.payload!, component_tree: tree }
    const history = state.history.slice(0, state.historyIndex + 1)
    history.push(newPayload)
    if (history.length > MAX_HISTORY) history.shift()
    set({
      payload: newPayload,
      isDirty: true,
      history,
      historyIndex: history.length - 1,
    })
  },

  updateNodeProps: (key, props) => {
    const state = get()
    if (!state.payload) return
    const newTree = updateNode(state.payload.component_tree, key, (n) => ({
      ...n,
      props: { ...(n.props ?? {}), ...props },
    }))
    get().updateTree(newTree)
  },

  updateNodeBindings: (key, bindings) => {
    const state = get()
    if (!state.payload) return
    const newTree = updateNode(state.payload.component_tree, key, (n) => ({
      ...n,
      bindings,
    }))
    get().updateTree(newTree)
  },

  updateNodeVisibility: (key, visibility) => {
    const state = get()
    if (!state.payload) return
    const newTree = updateNode(state.payload.component_tree, key, (n) => ({
      ...n,
      visibility,
    }))
    get().updateTree(newTree)
  },

  insertNode: (parentKey, node, index) => {
    const state = get()
    if (!state.payload) return
    const newTree = insertInTree(state.payload.component_tree, parentKey, node, index)
    get().updateTree(newTree)
  },

  removeNode: (key) => {
    const state = get()
    if (!state.payload) return
    const newTree = removeFromTree(state.payload.component_tree, key)
    set(s => ({ selectedKey: s.selectedKey === key ? null : s.selectedKey }))
    get().updateTree(newTree)
  },

  moveNode: (key, newParentKey, index) => {
    const state = get()
    if (!state.payload) return
    const node = findNode(state.payload.component_tree, key)
    if (!node) return
    const treeWithout = removeFromTree(state.payload.component_tree, key)
    const newTree = insertInTree(treeWithout, newParentKey, node, index)
    get().updateTree(newTree)
  },

  duplicateNode: (key) => {
    const state = get()
    if (!state.payload) return
    const node = findNode(state.payload.component_tree, key)
    if (!node) return
    const cloned = cloneNode(node, generateSuffix())
    // Find parent to insert after
    const parentKey = findParentKey(state.payload.component_tree, key)
    if (!parentKey) return
    const parent = findNode(state.payload.component_tree, parentKey)
    if (!parent) return
    const idx = (parent.children ?? []).findIndex(c => c.component_key === key)
    get().insertNode(parentKey, cloned, idx + 1)
  },

  setEvents: (events) => {
    const state = get()
    if (!state.payload) return
    const newPayload = { ...state.payload, events }
    const history = state.history.slice(0, state.historyIndex + 1)
    history.push(newPayload)
    if (history.length > MAX_HISTORY) history.shift()
    set({ payload: newPayload, isDirty: true, history, historyIndex: history.length - 1 })
  },

  setDataSources: (ds) => {
    const state = get()
    if (!state.payload) return
    const newPayload = { ...state.payload, datasources: ds }
    const history = state.history.slice(0, state.historyIndex + 1)
    history.push(newPayload)
    if (history.length > MAX_HISTORY) history.shift()
    set({ payload: newPayload, isDirty: true, history, historyIndex: history.length - 1 })
  },

  undo: () => {
    const { historyIndex, history } = get()
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    set({ payload: history[newIndex], historyIndex: newIndex, isDirty: true })
  },

  redo: () => {
    const { historyIndex, history } = get()
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    set({ payload: history[newIndex], historyIndex: newIndex, isDirty: true })
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  getNode: (key) => {
    const state = get()
    if (!state.payload) return null
    return findNode(state.payload.component_tree, key)
  },

  getPayload: () => get().payload,
}))

// Helper: find parent key of a node
function findParentKey(tree: ComponentNode, childKey: string): string | null {
  for (const child of tree.children ?? []) {
    if (child.component_key === childKey) return tree.component_key
    const found = findParentKey(child, childKey)
    if (found) return found
  }
  return null
}
