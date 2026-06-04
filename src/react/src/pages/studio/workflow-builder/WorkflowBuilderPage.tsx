import { useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { useWorkflowBuilderStore } from './useWorkflowBuilderStore'
import { WorkflowCanvas } from '../../../components/studio/WorkflowBuilder/canvas/WorkflowCanvas'
import { TaskToolbox } from '../../../components/studio/WorkflowBuilder/toolbox/TaskToolbox'
import { EntitySidebar } from '../../../components/studio/WorkflowBuilder/sidebar/EntitySidebar'
import { CanvasToolbar } from '../../../components/studio/WorkflowBuilder/toolbar/CanvasToolbar'
import { StepSettingsPanel } from '../../../components/studio/WorkflowBuilder/panels/StepSettingsPanel'
import { GlobalSettingsPanel } from '../../../components/studio/WorkflowBuilder/panels/GlobalSettingsPanel'
import { useWorkflowArtifact, useSaveWorkflowDraft, usePublishWorkflow } from '../../../hooks/useWorkflowBuilder'
import { useToast } from '../../../design-system'
import { Spinner } from '../../../design-system'
import type { WorkflowStep, WorkflowDefinition } from '../../../types/workflowBuilder'
import { DEFAULT_WORKFLOW_DEFINITION } from '../../../types/workflowBuilder'

export function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const { success, error } = useToast()

  const openTab = useWorkflowBuilderStore(s => s.openTab)
  const updateDefinition = useWorkflowBuilderStore(s => s.updateDefinition)
  const updateStep = useWorkflowBuilderStore(s => s.updateStep)
  const toggleToolbox = useWorkflowBuilderStore(s => s.toggleToolbox)
  const toolboxOpen = useWorkflowBuilderStore(s => s.toolboxOpen)
  const getActiveTab = useWorkflowBuilderStore(s => s.getActiveTab)

  const tab = getActiveTab()
  const selectedStep = tab?.nodes.find(n => n.id === tab?.selectedNodeId)?.data.step as WorkflowStep | undefined

  const { data: artifact, isLoading } = useWorkflowArtifact(id)
  const saveMut = useSaveWorkflowDraft()
  const publishMut = usePublishWorkflow()

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

  const activeTabId = id ?? 'new-workflow'

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

  // Keyboard shortcuts
  const tabRef = useRef(activeTabId)
  tabRef.current = activeTabId
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        useWorkflowBuilderStore.getState().undo(tabRef.current)
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault()
        useWorkflowBuilderStore.getState().redo(tabRef.current)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [handleSave])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner />
      </div>
    )
  }

  return (
    <ReactFlowProvider>
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
          isSaving={saveMut.isPending}
          isPublishing={publishMut.isPending}
        />

        {/* Three-panel body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Left: Entity sidebar */}
          <EntitySidebar />

          {/* Centre: canvas + floating toolbox */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {tab && <WorkflowCanvas tabId={activeTabId} />}

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
          </div>

          {/* Right: settings panel */}
          {tab && selectedStep ? (
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
      </div>
    </ReactFlowProvider>
  )
}

export default WorkflowBuilderPage
