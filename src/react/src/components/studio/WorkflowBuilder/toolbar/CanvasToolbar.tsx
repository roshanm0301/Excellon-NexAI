import { useRef, useState, useEffect } from 'react'
import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, LayoutGrid, Save, Send, Wrench, Map, History, LayoutTemplate, FolderOpen, Search, Sparkles, MoreHorizontal } from 'lucide-react'
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
  onOpenTemplates?: () => void
  onOpenImportExport?: () => void
  onOpenGlobalSearch?: () => void
  onOpenAI?: () => void
  aiPanelOpen?: boolean
  isSaving?: boolean
  isPublishing?: boolean
}

export function CanvasToolbar({ tabId, onSave, onPublish, onOpenHistory, onOpenTemplates, onOpenImportExport, onOpenGlobalSearch, onOpenAI, aiPanelOpen, isSaving, isPublishing }: CanvasToolbarProps) {
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

  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!overflowOpen) return
    function handleOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [overflowOpen])

  const stepCount = tab ? countSteps(tab.definition.sequence) : 0
  const decisionCount = tab ? countSteps(tab.definition.sequence, true) : 0

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
    const posMap: Record<string, { x: number; y: number }> = {}
    for (const n of laid) posMap[n.id] = n.position
    syncNodePositions(tabId, posMap)
    requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }))
    setOverflowOpen(false)
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

  const overflowItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '7px 12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  }

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
      }}
    >
      {/* Tasks (toolbox toggle) */}
      <button
        style={iconBtn(toolboxOpen)}
        onClick={toggleToolbox}
        title="Toggle task library"
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

      {/* Templates */}
      {onOpenTemplates && (
        <button style={btnStyle()} onClick={onOpenTemplates} title="Browse workflow templates">
          <LayoutTemplate size={13} />
          <span>Templates</span>
        </button>
      )}

      {/* AI Assistant */}
      {onOpenAI && (
        <button
          style={iconBtn(aiPanelOpen)}
          onClick={onOpenAI}
          title="AI Assistant"
          aria-pressed={aiPanelOpen}
        >
          <Sparkles size={13} />
          <span>AI</span>
        </button>
      )}

      <div style={{ width: 1, height: 20, background: 'var(--color-border)', margin: '0 4px' }} />

      {/* Step counter */}
      <span
        style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', padding: '0 4px' }}
        title="Step and decision point counts"
      >
        {stepCount} step{stepCount !== 1 ? 's' : ''}
        {decisionCount > 0 && ` · ${decisionCount} decision point${decisionCount !== 1 ? 's' : ''}`}
      </span>

      {/* Overflow — secondary actions */}
      <div ref={overflowRef} style={{ position: 'relative' }}>
        <button
          style={iconBtn(overflowOpen)}
          onClick={() => setOverflowOpen(v => !v)}
          title="More options"
          aria-expanded={overflowOpen}
        >
          <MoreHorizontal size={14} />
          <span>More</span>
        </button>

        {overflowOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              zIndex: 50,
              minWidth: 180,
              overflow: 'hidden',
            }}
          >
            <button style={overflowItemStyle} onClick={() => { zoomIn(); setOverflowOpen(false) }}>
              <ZoomIn size={13} /> Zoom in
            </button>
            <button style={overflowItemStyle} onClick={() => { zoomOut(); setOverflowOpen(false) }}>
              <ZoomOut size={13} /> Zoom out
            </button>
            <button style={overflowItemStyle} onClick={() => { fitView({ padding: 0.2 }); setOverflowOpen(false) }}>
              <Maximize2 size={13} /> Fit view
            </button>
            <button style={overflowItemStyle} onClick={handleAutoLayout}>
              <LayoutGrid size={13} /> Auto-arrange
            </button>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />
            <button
              style={{ ...overflowItemStyle, color: showMinimap ? 'var(--brand-600)' : 'var(--color-text-primary)' }}
              onClick={() => { toggleMinimap(); setOverflowOpen(false) }}
            >
              <Map size={13} /> {showMinimap ? 'Hide minimap' : 'Show minimap'}
            </button>
            {onOpenHistory && (
              <button style={overflowItemStyle} onClick={() => { onOpenHistory(); setOverflowOpen(false) }}>
                <History size={13} /> Version history
              </button>
            )}
            {onOpenImportExport && (
              <button style={overflowItemStyle} onClick={() => { onOpenImportExport(); setOverflowOpen(false) }}>
                <FolderOpen size={13} /> Import / Export
              </button>
            )}
            {onOpenGlobalSearch && (
              <button style={overflowItemStyle} onClick={() => { onOpenGlobalSearch(); setOverflowOpen(false) }}>
                <Search size={13} /> Search all workflows
              </button>
            )}
          </div>
        )}
      </div>

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
