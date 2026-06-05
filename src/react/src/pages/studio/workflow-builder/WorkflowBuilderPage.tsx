import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ReactFlowProvider, useReactFlow } from '@xyflow/react'
import type { ReactFlowInstance } from '@xyflow/react'
import { useWorkflowBuilderStore } from './useWorkflowBuilderStore'
import { WorkflowCanvas } from '../../../components/studio/WorkflowBuilder/canvas/WorkflowCanvas'
import { TaskToolbox } from '../../../components/studio/WorkflowBuilder/toolbox/TaskToolbox'
import { EntitySidebar } from '../../../components/studio/WorkflowBuilder/sidebar/EntitySidebar'
import { CanvasToolbar } from '../../../components/studio/WorkflowBuilder/toolbar/CanvasToolbar'
import { StepSettingsPanel } from '../../../components/studio/WorkflowBuilder/panels/StepSettingsPanel'
import { GlobalSettingsPanel } from '../../../components/studio/WorkflowBuilder/panels/GlobalSettingsPanel'
import { VersionHistoryPanel } from '../../../components/studio/WorkflowBuilder/panels/VersionHistoryPanel'
import { ImportExportPanel } from '../../../components/studio/WorkflowBuilder/panels/ImportExportPanel'
import { ValidationPanel } from '../../../components/studio/WorkflowBuilder/validation/ValidationPanel'
import { NodeContextMenu } from '../../../components/studio/WorkflowBuilder/nodes/NodeContextMenu'
import { TemplateGallery } from '../../../components/studio/WorkflowBuilder/templates/TemplateGallery'
import { GlobalWorkflowSearch } from '../../../components/studio/WorkflowBuilder/search/GlobalWorkflowSearch'
import { AIAssistantPanel } from '../../../components/studio/WorkflowBuilder/ai/AIAssistantPanel'
import { useWorkflowArtifact, useSaveWorkflowDraft, usePublishWorkflow } from '../../../hooks/useWorkflowBuilder'
import { useToast, Spinner } from '../../../design-system'
import type { WorkflowStep, WorkflowDefinition } from '../../../types/workflowBuilder'
import { DEFAULT_WORKFLOW_DEFINITION } from '../../../types/workflowBuilder'

// ── Inner component (needs access to ReactFlow instance via useReactFlow hook) ─

interface WorkflowBuilderInnerProps {
  activeTabId: string
  id: string | undefined
}

function WorkflowBuilderInner({ activeTabId, id }: WorkflowBuilderInnerProps) {
  const rfInstance = useReactFlow()
  // Cast to the public type expected by ValidationPanel
  const rfRef = useRef<ReactFlowInstance | null>(rfInstance as unknown as ReactFlowInstance)
  rfRef.current = rfInstance as unknown as ReactFlowInstance

  const { success, error } = useToast()

  const openTab = useWorkflowBuilderStore(s => s.openTab)
  const updateDefinition = useWorkflowBuilderStore(s => s.updateDefinition)
  const updateStep = useWorkflowBuilderStore(s => s.updateStep)
  const toggleToolbox = useWorkflowBuilderStore(s => s.toggleToolbox)
  const toolboxOpen = useWorkflowBuilderStore(s => s.toolboxOpen)
  const getActiveTab = useWorkflowBuilderStore(s => s.getActiveTab)
  const duplicateStep = useWorkflowBuilderStore(s => s.duplicateStep)
  const deleteStep = useWorkflowBuilderStore(s => s.deleteStep)
  const copyStep = useWorkflowBuilderStore(s => s.copyStep)
  const pasteStep = useWorkflowBuilderStore(s => s.pasteStep)
  const selectNode = useWorkflowBuilderStore(s => s.selectNode)

  const tab = getActiveTab()
  const selectedStep = tab?.nodes.find(n => n.id === tab?.selectedNodeId)?.data.step as WorkflowStep | undefined

  const { data: artifact, isLoading } = useWorkflowArtifact(id)
  const saveMut = useSaveWorkflowDraft()
  const publishMut = usePublishWorkflow()

  // Version history panel state
  const [historyOpen, setHistoryOpen] = useState(false)

  // Template gallery state
  const [showTemplateGallery, setShowTemplateGallery] = useState(false)

  // Import/Export panel state
  const [showImportExport, setShowImportExport] = useState(false)

  // Global search state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)

  // AI Assistant panel state
  const [showAIPanel, setShowAIPanel] = useState(false)

  // Context menu state (local — not in global store per spec)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null)

  // Canvas-level search state (Ctrl+F inline search)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchIndex, setSearchIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Open/reuse tab when artifact loads
  useEffect(() => {
    if (!artifact || !id) return
    const def = (artifact.payload as WorkflowDefinition) ?? DEFAULT_WORKFLOW_DEFINITION
    openTab({
      id: artifact.artifact_id,
      artifactVersionId: artifact.version_id,
      name: artifact.artifact_name,
      definition: def,
    })
  }, [artifact, id, openTab])

  // New workflow tab (no id)
  useEffect(() => {
    if (id) return
    const tempId = 'new-workflow'
    openTab({
      id: tempId,
      artifactVersionId: '',
      name: 'New Workflow',
      definition: DEFAULT_WORKFLOW_DEFINITION,
    })
  }, [id, openTab])

  const handleSave = useCallback(() => {
    if (!tab || !id) return
    saveMut.mutate(
      { id: tab.artifactVersionId || id, definition: tab.definition },
      {
        onSuccess: () => success('Saved', 'Draft saved successfully'),
        onError: () => error('Save failed', 'Could not save the workflow'),
      }
    )
  }, [tab, id, saveMut, success, error])

  const handlePublish = useCallback(() => {
    if (!id) return
    publishMut.mutate(id, {
      onSuccess: () => success('Published', 'Workflow is now live'),
      onError: () => error('Publish failed', 'Could not publish the workflow'),
    })
  }, [id, publishMut, success, error])

  // Computed search matches
  const matchingNodeIds: string[] = tab && searchQuery.trim()
    ? tab.nodes
        .filter(n => {
          const q = searchQuery.toLowerCase()
          return (
            String(n.data.label ?? '').toLowerCase().includes(q) ||
            String(n.id).toLowerCase().includes(q)
          )
        })
        .map(n => n.id)
    : []

  // Jump to current search match
  useEffect(() => {
    if (!searchOpen || matchingNodeIds.length === 0 || !rfRef.current) return
    const nodeId = matchingNodeIds[searchIndex % matchingNodeIds.length]
    const node = tab?.nodes.find(n => n.id === nodeId)
    if (node) {
      rfRef.current.fitView({ nodes: [node], duration: 300, padding: 0.5 })
    }
  // only re-run when index or match count changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchIndex, matchingNodeIds.length, searchOpen])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [searchOpen])

  // Keyboard shortcuts
  const tabRef = useRef(activeTabId)
  tabRef.current = activeTabId

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Ctrl+S — save
      if (meta && e.key === 's') {
        e.preventDefault()
        handleSave()
        return
      }

      // Ctrl+Z — undo
      if (meta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useWorkflowBuilderStore.getState().undo(tabRef.current)
        return
      }

      // Ctrl+Y / Ctrl+Shift+Z — redo
      if (meta && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        useWorkflowBuilderStore.getState().redo(tabRef.current)
        return
      }

      // Ctrl+F — toggle canvas search
      if (meta && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(v => !v)
        return
      }

      // Escape — close search → close AI panel → deselect
      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false)
          setSearchQuery('')
          return
        }
        if (showAIPanel) {
          setShowAIPanel(false)
          return
        }
        setContextMenu(null)
        useWorkflowBuilderStore.getState().selectNode(tabRef.current, null)
        return
      }

      // Search navigation when overlay is open
      if (searchOpen && matchingNodeIds.length > 0) {
        if (e.key === 'ArrowDown' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault()
          setSearchIndex(i => (i + 1) % matchingNodeIds.length)
          return
        }
        if (e.key === 'ArrowUp' || (e.key === 'Enter' && e.shiftKey)) {
          e.preventDefault()
          setSearchIndex(i => (i - 1 + matchingNodeIds.length) % matchingNodeIds.length)
          return
        }
      }

      // Ctrl+D — duplicate selected node (skip when in input)
      if (meta && e.key === 'd' && !isInput) {
        e.preventDefault()
        const state = useWorkflowBuilderStore.getState()
        const currentTab = state.getTab(tabRef.current)
        if (currentTab?.selectedNodeId) {
          state.duplicateStep(tabRef.current, currentTab.selectedNodeId)
        }
        return
      }

      // Ctrl+C — copy selected node to clipboard (skip when in input)
      if (meta && e.key === 'c' && !isInput) {
        e.preventDefault()
        const state = useWorkflowBuilderStore.getState()
        const currentTab = state.getTab(tabRef.current)
        if (currentTab?.selectedNodeId) {
          state.copyStep(tabRef.current, currentTab.selectedNodeId)
        }
        return
      }

      // Ctrl+V — paste from clipboard (skip when in input)
      if (meta && e.key === 'v' && !isInput) {
        e.preventDefault()
        useWorkflowBuilderStore.getState().pasteStep(tabRef.current)
        return
      }

      // Delete / Backspace — delete selected node (skip when in input)
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInput) {
        e.preventDefault()
        const state = useWorkflowBuilderStore.getState()
        const currentTab = state.getTab(tabRef.current)
        if (currentTab?.selectedNodeId) {
          state.deleteStep(tabRef.current, currentTab.selectedNodeId)
        }
        return
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleSave, searchOpen, showAIPanel, matchingNodeIds.length])

  // Context menu handler
  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      event.preventDefault()
      setContextMenu({ x: event.clientX, y: event.clientY, nodeId })
      selectNode(activeTabId, nodeId)
    },
    [activeTabId, selectNode],
  )

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-surface)',
      }}
    >
      {/* Toolbar */}
      <CanvasToolbar
        tabId={activeTabId}
        onSave={handleSave}
        onPublish={handlePublish}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenTemplates={() => setShowTemplateGallery(true)}
        onOpenImportExport={() => setShowImportExport(true)}
        onOpenGlobalSearch={() => setShowGlobalSearch(true)}
        onOpenAI={() => setShowAIPanel(v => !v)}
        aiPanelOpen={showAIPanel}
        isSaving={saveMut.isPending}
        isPublishing={publishMut.isPending}
      />

      {/* Three-panel body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Left: Entity sidebar */}
        <EntitySidebar />

        {/* Centre: canvas + overlays */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {tab && (
            <WorkflowCanvas
              tabId={activeTabId}
              onNodeContextMenu={handleNodeContextMenu}
            />
          )}

          {/* Floating toolbox */}
          {toolboxOpen && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                zIndex: 10,
              }}
            >
              <TaskToolbox onClose={toggleToolbox} />
            </div>
          )}

          {/* Canvas search overlay (Ctrl+F) */}
          {searchOpen && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 20,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                minWidth: 280,
              }}
            >
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSearchIndex(0)
                }}
                placeholder="Search steps…"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.875rem',
                  background: 'transparent',
                  color: 'var(--color-text-primary)',
                  fontFamily: 'inherit',
                }}
              />
              {searchQuery && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {matchingNodeIds.length > 0
                    ? `${(searchIndex % matchingNodeIds.length) + 1} / ${matchingNodeIds.length}`
                    : 'No matches'}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  padding: '2px 4px',
                  fontFamily: 'inherit',
                }}
                title="Close search (Escape)"
              >
                ✕
              </button>
            </div>
          )}

          {/* Validation panel — sits at the bottom edge of the canvas area */}
          {tab && (
            <ValidationPanel
              definition={tab.definition}
              nodes={tab.nodes}
              edges={tab.edges}
              reactFlowInstance={rfRef.current}
            />
          )}
        </div>

        {/* Right: AI panel takes priority; falls back to step/global settings */}
        {showAIPanel && tab ? (
          <AIAssistantPanel
            definition={tab.definition}
            onApply={def => updateDefinition(activeTabId, def)}
            onClose={() => setShowAIPanel(false)}
          />
        ) : tab && selectedStep ? (
          <StepSettingsPanel
            step={selectedStep}
            onChange={(patch) => updateStep(activeTabId, selectedStep.id, patch)}
            onClose={() => useWorkflowBuilderStore.getState().selectNode(activeTabId, null)}
          />
        ) : tab ? (
          <GlobalSettingsPanel
            definition={tab.definition}
            onChange={(def: WorkflowDefinition) => updateDefinition(activeTabId, def)}
          />
        ) : null}
      </div>

      {/* Context menu (portal-style, fixed position) */}
      {contextMenu && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          onDuplicate={(nodeId) => duplicateStep(activeTabId, nodeId)}
          onCopy={(nodeId) => copyStep(activeTabId, nodeId)}
          onDelete={(nodeId) => deleteStep(activeTabId, nodeId)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Version History Drawer */}
      <VersionHistoryPanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        artifactId={id ?? ''}
      />

      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onClose={() => setShowTemplateGallery(false)}
          onApply={(definition) => {
            if (tab?.isDirty) {
              if (!window.confirm('Applying a template will replace the current workflow and discard unsaved changes.\n\nContinue?')) return
            }
            updateDefinition(activeTabId, definition)
            setShowTemplateGallery(false)
          }}
        />
      )}

      {/* Import / Export Panel */}
      {tab && (
        <ImportExportPanel
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          tabId={activeTabId}
          definition={tab.definition}
          onImport={(def) => {
            updateDefinition(activeTabId, def)
            setShowImportExport(false)
          }}
        />
      )}

      {/* Global Workflow Search */}
      {showGlobalSearch && (
        <GlobalWorkflowSearch
          onClose={() => setShowGlobalSearch(false)}
        />
      )}

    </div>
  )
}

// ── Outer shell (provides ReactFlow context) ──────────────────────────────────

export function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const activeTabId = id ?? 'new-workflow'

  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner activeTabId={activeTabId} id={id} />
    </ReactFlowProvider>
  )
}

export default WorkflowBuilderPage
