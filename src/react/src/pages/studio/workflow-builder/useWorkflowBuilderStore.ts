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
  showMinimap: boolean

  // Tab management
  openTab: (tab: Omit<WorkflowTab, 'isDirty' | 'history' | 'historyIndex' | 'nodes' | 'edges' | 'selectedNodeId'>) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void

  // Canvas state
  setNodes: (tabId: string, nodes: Node[]) => void
  setEdges: (tabId: string, edges: Edge[]) => void
  selectNode: (tabId: string, nodeId: string | null) => void
  // Syncs node drag positions back into definition.sequence without creating a history entry
  syncNodePositions: (tabId: string, positions: Record<string, { x: number; y: number }>) => void

  // Definition mutations (all push to history)
  updateDefinition: (tabId: string, def: WorkflowDefinition) => void
  updateGlobalSettings: (tabId: string, settings: Partial<ActionSettings>) => void
  updateStep: (tabId: string, stepId: string, patch: Partial<WorkflowStep>) => void

  // Step actions
  duplicateStep: (tabId: string, stepId: string) => void
  deleteStep: (tabId: string, stepId: string) => void

  // Save
  markSaved: (tabId: string, newVersionId?: string) => void

  // Undo / Redo
  undo: (tabId: string) => void
  redo: (tabId: string) => void
  canUndo: (tabId: string) => boolean
  canRedo: (tabId: string) => boolean

  // Toolbox
  toggleToolbox: () => void

  // Minimap
  toggleMinimap: () => void

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

function removeStep(steps: WorkflowStep[], stepId: string): WorkflowStep[] {
  return steps
    .filter(s => s.id !== stepId)
    .map(s => {
      if (s.branches) {
        return {
          ...s,
          branches: Object.fromEntries(
            Object.entries(s.branches).map(([k, v]) => [k, removeStep(v, stepId)])
          ),
        }
      }
      return s
    })
}

/** Deep clone a step and assign it a new unique ID with _copy suffix */
function cloneStep(step: WorkflowStep, existingIds: Set<string>): WorkflowStep {
  let candidateId = `${step.id}_copy`
  let suffix = 2
  while (existingIds.has(candidateId)) {
    candidateId = `${step.id}_copy${suffix}`
    suffix++
  }
  existingIds.add(candidateId)

  const cloned: WorkflowStep = {
    ...step,
    id: candidateId,
    name: `${step.name} (copy)`,
    properties: {
      ...step.properties,
      taskSettings: { ...step.properties.taskSettings },
    },
  }

  if (step.branches) {
    cloned.branches = Object.fromEntries(
      Object.entries(step.branches).map(([k, v]) => [
        k,
        v.map(s => cloneStep(s, existingIds)),
      ])
    )
  }

  return cloned
}

function applyPositions(
  steps: WorkflowStep[],
  positions: Record<string, { x: number; y: number }>,
): WorkflowStep[] {
  return steps.map(s => {
    const pos = positions[s.id]
    const patched = pos ? { ...s, position: pos } : s
    if (patched.branches) {
      return {
        ...patched,
        branches: Object.fromEntries(
          Object.entries(patched.branches).map(([k, v]) => [k, applyPositions(v, positions)])
        ),
      }
    }
    return patched
  })
}

function collectAllIds(steps: WorkflowStep[]): Set<string> {
  const ids = new Set<string>()
  function walk(seq: WorkflowStep[]) {
    for (const s of seq) {
      ids.add(s.id)
      if (s.branches) {
        for (const branch of Object.values(s.branches)) walk(branch)
      }
    }
  }
  walk(steps)
  return ids
}

export const useWorkflowBuilderStore = create<WorkflowBuilderState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  toolboxOpen: true,
  showMinimap: false,

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

  syncNodePositions(tabId, positions) {
    set(s => ({
      tabs: s.tabs.map(t => {
        if (t.id !== tabId) return t
        const newSequence = applyPositions(t.definition.sequence, positions)
        return {
          ...t,
          isDirty: true,
          definition: { ...t.definition, sequence: newSequence },
        }
      }),
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

  duplicateStep(tabId, stepId) {
    const tab = get().tabs.find(t => t.id === tabId)
    if (!tab) return

    // Find the step in the flat sequence (top-level only for now)
    const original = tab.definition.sequence.find(s => s.id === stepId)
    if (!original) return

    const existingIds = collectAllIds(tab.definition.sequence)
    const cloned = cloneStep(original, existingIds)

    // Offset position by +50, +50 if the step has a position
    const pos = (original as WorkflowStep & { position?: { x: number; y: number } }).position
    if (pos) {
      (cloned as WorkflowStep & { position?: { x: number; y: number } }).position = {
        x: pos.x + 50,
        y: pos.y + 50,
      }
    }

    // Insert the clone right after the original in the sequence
    const idx = tab.definition.sequence.findIndex(s => s.id === stepId)
    const newSequence = [
      ...tab.definition.sequence.slice(0, idx + 1),
      cloned,
      ...tab.definition.sequence.slice(idx + 1),
    ]

    get().updateDefinition(tabId, { ...tab.definition, sequence: newSequence })
  },

  deleteStep(tabId, stepId) {
    const tab = get().tabs.find(t => t.id === tabId)
    if (!tab) return
    const newSequence = removeStep(tab.definition.sequence, stepId)
    get().updateDefinition(tabId, { ...tab.definition, sequence: newSequence })
    // Deselect if deleted node was selected
    if (tab.selectedNodeId === stepId) {
      get().selectNode(tabId, null)
    }
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

  toggleMinimap() {
    set(s => ({ showMinimap: !s.showMinimap }))
  },

  getActiveTab: () => {
    const s = get()
    return s.tabs.find(t => t.id === s.activeTabId)
  },

  getTab: (tabId) => get().tabs.find(t => t.id === tabId),
}))
