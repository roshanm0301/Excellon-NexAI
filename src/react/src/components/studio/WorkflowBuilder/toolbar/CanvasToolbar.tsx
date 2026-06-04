import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, LayoutGrid, Save, Send, Wrench, Map, History } from 'lucide-react'
import { useReactFlow } from '@xyflow/react'
import { useWorkflowBuilderStore } from '../../../../pages/studio/workflow-builder/useWorkflowBuilderStore'
import { applyAutoLayout } from '../utils/layoutUtils'
import type { WorkflowStep } from '../../../../types/workflowBuilder'
import { BRANCHING_TASK_TYPES } from '../../../../types/workflowBuilder'

// Count steps recursively — optionally only branching types
function countSteps(steps: WorkflowStep[], branchingOnly = false): number {
  let count = 0
  for (const step of steps) {
    if (step.type !== 'start' && step.type !== 'end') {
      if (!branchingOnly || BRANCHING_TASK_TYPES.has(step.type)) {
        count++
      }
    }
    if (step.branches) {
      for (const branch of Object.values(step.branches)) {
        count += countSteps(branch, branchingOnly)
      }
    }
  }
  return count
}

interface CanvasToolbarProps {
  tabId: string
  onSave: () => void
  onPublish: () => void
  onOpenHistory?: () => void
  isSaving?: boolean
  isPublishing?: boolean
}

export function CanvasToolbar({ tabId, onSave, onPublish, onOpenHistory, isSaving, isPublishing }: CanvasToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const undo = useWorkflowBuilderStore(s => s.undo)
  const redo = useWorkflowBuilderStore(s => s.redo)
  const canUndo = useWorkflowBuilderStore(s => s.canUndo(tabId))
  const canRedo = useWorkflowBuilderStore(s => s.canRedo(tabId))
  const isDirty = useWorkflowBuilderStore(s => s.tabs.find(t => t.id === tabId)?.isDirty ?? false)
  const toggleToolbox = useWorkflowBuilderStore(s => s.toggleToolbox)
  const toolboxOpen = useWorkflowBuilderStore(s => s.toolboxOpen)
  const showMinimap = useWorkflowBuilderStore(s => s.showMinimap)
  const toggleMinimap = useWorkflowBuilderStore(s => s.toggleMinimap)
  const setNodes = useWorkflowBuilderStore(s => s.setNodes)
  const syncNodePositions = useWorkflowBuilderStore(s => s.syncNodePositions)
  const tab = useWorkflowBuilderStore(s => s.tabs.find(t => t.id === tabId))

  const stepCount = tab ? countSteps(tab.definition.sequence) : 0
  const branchCount = tab ? countSteps(tab.definition.sequence, true) : 0

  const handleAutoLayout = () => {
    if (!tab) return
    if (tab.nodes.length > 2) {
      const ok = window.confirm(
        'Auto-arrange will reposition all nodes. Any manual layout will be replaced.\n\nYou can undo this with Ctrl+Z.'
      )
      if (!ok) return
    }
    const laid = applyAutoLayout(tab.nodes, tab.edges)
    setNodes(tabId, laid)
    // Persist new positions to definition.sequence so they are saved
    const posMap: Record<string, { x: number; y: number }> = {}
    for (const n of laid) posMap[n.id] = n.position
    syncNodePositions(tabId, posMap)
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }))
  }

  const btnStyle = (disabled = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    background: 'none',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.75rem',
    color: disabled ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
    fontFamily: 'inherit',
    opacity: disabled ? 0.45 : 1,
    transition: 'background 0.1s',
    whiteSpace: 'nowrap',
  })

  const iconBtn = (active = false): React.CSSProperties => ({
    ...btnStyle(),
    padding: '5px 8px',
    background: active ? 'var(--brand-50)' : 'none',
    borderColor: active ? 'var(--brand-300)' : 'var(--color-border)',
    color: active ? 'var(--brand-600)' : 'var(--color-text-primary)',
  })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      {/* Toolbox toggle */}
      <button
        style={iconBtn(toolboxOpen)}
        onClick={toggleToolbox}
        title="Toggle task toolbox"
        aria-pressed={toolboxOpen}
      >
        <Wrench size={14} />
        <span>Tasks</span>
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

      {/* Undo / Redo */}
      <button style={btnStyle(!canUndo)} onClick={() => undo(tabId)} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 size={13} />
      </button>
      <button style={btnStyle(!canRedo)} onClick={() => redo(tabId)} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Redo2 size={13} />
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

      {/* Zoom controls */}
      <button style={btnStyle()} onClick={() => zoomIn()} title="Zoom in">
        <ZoomIn size={13} />
      </button>
      <button style={btnStyle()} onClick={() => zoomOut()} title="Zoom out">
        <ZoomOut size={13} />
      </button>
      <button style={btnStyle()} onClick={() => fitView({ padding: 0.2 })} title="Fit view">
        <Maximize2 size={13} />
      </button>

      {/* Auto-layout */}
      <button style={btnStyle()} title="Auto-arrange nodes (BFS layout)" onClick={handleAutoLayout}>
        <LayoutGrid size={13} />
        <span>Auto-arrange</span>
      </button>

      <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

      {/* Minimap toggle */}
      <button
        style={iconBtn(showMinimap)}
        onClick={toggleMinimap}
        title="Toggle minimap"
        aria-pressed={showMinimap}
      >
        <Map size={13} />
        <span>Map</span>
      </button>

      {/* History button */}
      {onOpenHistory && (
        <button
          style={btnStyle()}
          onClick={onOpenHistory}
          title="View version history"
        >
          <History size={13} />
          <span>History</span>
        </button>
      )}

      <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

      {/* Step counter */}
      <span
        style={{
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
          whiteSpace: 'nowrap',
          padding: '0 4px',
        }}
        title="Step and branch counts"
      >
        {stepCount} step{stepCount !== 1 ? 's' : ''}
        {branchCount > 0 && ` · ${branchCount} branch${branchCount !== 1 ? 'es' : ''}`}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save / Publish */}
      <button
        style={{
          ...btnStyle(isSaving),
          color: isDirty ? 'var(--brand-600)' : 'var(--color-text-muted)',
          borderColor: isDirty ? 'var(--brand-300)' : 'var(--color-border)',
          background: isDirty ? 'var(--brand-50)' : 'none',
        }}
        onClick={onSave}
        disabled={isSaving}
        title="Save draft (Ctrl+S)"
      >
        <Save size={13} />
        <span>{isSaving ? 'Saving…' : isDirty ? 'Save *' : 'Saved'}</span>
      </button>

      <button
        style={{
          ...btnStyle(isPublishing),
          background: 'var(--brand-600)',
          color: 'white',
          border: 'none',
          padding: '5px 14px',
        }}
        onClick={onPublish}
        disabled={isPublishing}
        title="Publish workflow"
        onMouseEnter={e => !isPublishing && ((e.currentTarget as HTMLElement).style.background = 'var(--brand-700)')}
        onMouseLeave={e => !isPublishing && ((e.currentTarget as HTMLElement).style.background = 'var(--brand-600)')}
      >
        <Send size={13} />
        <span>{isPublishing ? 'Publishing…' : 'Publish'}</span>
      </button>
    </div>
  )
}
