import { create } from 'zustand'
import type { Node, Edge } from '@xyflow/react'
import type { WorkflowDefinition, WorkflowStep, ActionSettings } from '../../../types/workflowBuilder'
import { stepsToFlow } from '../../../components/studio/WorkflowBuilder/canvas/canvasHelpers'

const MAX_HISTORY = 50

export interface WorkflowTab {
  id: string
  artifactVersionId: string
  name: string
  isDirty: boolean
  definition: WorkflowDefinition
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  history: WorkflowDefinition[]
  historyIndex: number
}

function buildFlow(def: WorkflowDefinition) {
  return stepsToFlow(def.sequence)
}

interface WorkflowBuilderState {
  tabs: WorkflowTab[]
  activeTabId: string | null
  toolboxOpen: boolean

  // Tab management
  openTab: (tab: Omit<WorkflowTab, 'isDirty' | 'history' | 'historyIndex' | 'nodes' | 'edges' | 'selectedNodeId'>) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void

  // Canvas state
  setNodes: (tabId: string, nodes: Node[]) => void
  setEdges: (tabId: string, edges: Edge[]) => void
  selectNode: (tabId: string, nodeId: string | null) => void

  // Definition mutations (all push to history)
  updateDefinition: (tabId: string, def: WorkflowDefinition) => void
  updateGlobalSettings: (tabId: string, settings: Partial<ActionSettings>) => void
  updateStep: (tabId: string, stepId: string, patch: Partial<WorkflowStep>) => void

  // Save
  markSaved: (tabId: string, newVersionId?: string) => void

  // Undo / Redo
  undo: (tabId: string) => void
  redo: (tabId: string) => void
  canUndo: (tabId: string) => boolean
  canRedo: (tabId: string) => boolean

  // Toolbox
  toggleToolbox: () => void

  // Getters
  getActiveTab: () => WorkflowTab | undefined
  getTab: (tabId: string) => WorkflowTab | undefined
}

function patchTabDef(
  tab: WorkflowTab,
  newDef: WorkflowDefinition,
): WorkflowTab {
  const truncated = tab.history.slice(0, tab.historyIndex + 1)
  const history = [...truncated, newDef].slice(-MAX_HISTORY)
  const { nodes, edges } = buildFlow(newDef)
  return {
    ...tab,
    definition: newDef,
    nodes,
    edges,
    isDirty: true,
    history,
    historyIndex: history.length - 1,
  }
}

function patchStep(steps: WorkflowStep[], stepId: string, patch: Partial<WorkflowStep>): WorkflowStep[] {
  return steps.map(s => {
    if (s.id === stepId) return { ...s, ...patch }
    if (s.branches) {
      return {
        ...s,
        branches: Object.fromEntries(
          Object.entries(s.branches).map(([k, v]) => [k, patchStep(v, stepId, patch)])
        ),
      }
    }
    return s
  })
}

export const useWorkflowBuilderStore = create<WorkflowBuilderState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  toolboxOpen: true,

  openTab(tab) {
    const existing = get().tabs.find(t => t.id === tab.id)
    if (existing) {
      set({ activeTabId: tab.id })
      return
    }
    const { nodes, edges } = buildFlow(tab.definition)
    const newTab: WorkflowTab = {
      ...tab,
      nodes,
      edges,
      selectedNodeId: null,
      isDirty: false,
      history: [tab.definition],
      historyIndex: 0,
    }
    set(s => ({ tabs: [...s.tabs, newTab], activeTabId: tab.id }))
  },

  closeTab(tabId) {
    set(s => {
      const remaining = s.tabs.filter(t => t.id !== tabId)
      const nextActive = s.activeTabId === tabId
        ? (remaining[remaining.length - 1]?.id ?? null)
        : s.activeTabId
      return { tabs: remaining, activeTabId: nextActive }
    })
  },

  setActiveTab(tabId) {
    set({ activeTabId: tabId })
  },

  setNodes(tabId, nodes) {
    set(s => ({
      tabs: s.tabs.map(t => t.id === tabId ? { ...t, nodes } : t),
    }))
  },

  setEdges(tabId, edges) {
    set(s => ({
      tabs: s.tabs.map(t => t.id === tabId ? { ...t, edges } : t),
    }))
  },

  selectNode(tabId, nodeId) {
    set(s => ({
      tabs: s.tabs.map(t => t.id === tabId ? { ...t, selectedNodeId: nodeId } : t),
    }))
  },

  updateDefinition(tabId, def) {
    set(s => ({
      tabs: s.tabs.map(t => t.id === tabId ? patchTabDef(t, def) : t),
    }))
  },

  updateGlobalSettings(tabId, settings) {
    const tab = get().tabs.find(t => t.id === tabId)
    if (!tab) return
    const newDef: WorkflowDefinition = {
      ...tab.definition,
      properties: {
        ...tab.definition.properties,
        ...settings,
      },
    }
    get().updateDefinition(tabId, newDef)
  },

  updateStep(tabId, stepId, patch) {
    const tab = get().tabs.find(t => t.id === tabId)
    if (!tab) return
    const newDef: WorkflowDefinition = {
      ...tab.definition,
      sequence: patchStep(tab.definition.sequence, stepId, patch),
    }
    get().updateDefinition(tabId, newDef)
  },

  markSaved(tabId, newVersionId) {
    set(s => ({
      tabs: s.tabs.map(t => {
        if (t.id !== tabId) return t
        return {
          ...t,
          isDirty: false,
          artifactVersionId: newVersionId ?? t.artifactVersionId,
        }
      }),
    }))
  },

  undo(tabId) {
    set(s => ({
      tabs: s.tabs.map(t => {
        if (t.id !== tabId || t.historyIndex <= 0) return t
        const newIdx = t.historyIndex - 1
        const def = t.history[newIdx]
        const { nodes, edges } = buildFlow(def)
        return { ...t, definition: def, nodes, edges, historyIndex: newIdx, isDirty: newIdx > 0 }
      }),
    }))
  },

  redo(tabId) {
    set(s => ({
      tabs: s.tabs.map(t => {
        if (t.id !== tabId || t.historyIndex >= t.history.length - 1) return t
        const newIdx = t.historyIndex + 1
        const def = t.history[newIdx]
        const { nodes, edges } = buildFlow(def)
        return { ...t, definition: def, nodes, edges, historyIndex: newIdx, isDirty: true }
      }),
    }))
  },

  canUndo: (tabId) => {
    const tab = get().tabs.find(t => t.id === tabId)
    return !!tab && tab.historyIndex > 0
  },

  canRedo: (tabId) => {
    const tab = get().tabs.find(t => t.id === tabId)
    return !!tab && tab.historyIndex < tab.history.length - 1
  },

  toggleToolbox() {
    set(s => ({ toolboxOpen: !s.toolboxOpen }))
  },

  getActiveTab: () => {
    const s = get()
    return s.tabs.find(t => t.id === s.activeTabId)
  },

  getTab: (tabId) => get().tabs.find(t => t.id === tabId),
}))
