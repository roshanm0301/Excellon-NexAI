import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  BackgroundVariant,
  useReactFlow,
  SelectionMode,
} from '@xyflow/react'
import type { Connection, NodeMouseHandler, Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from '../nodes/nodeTypes'
import { edgeTypes } from '../edges/edgeTypes'
import { createDefaultStep } from './canvasHelpers'
import { useWorkflowBuilderStore } from '../../../../pages/studio/workflow-builder/useWorkflowBuilderStore'
import type { WorkflowDefinition } from '../../../../types/workflowBuilder'

interface WorkflowCanvasProps {
  tabId: string
  onNodeContextMenu?: (event: React.MouseEvent, nodeId: string) => void
}

export function WorkflowCanvas({ tabId, onNodeContextMenu }: WorkflowCanvasProps) {
  const { screenToFlowPosition } = useReactFlow()
  const tab = useWorkflowBuilderStore(s => s.tabs.find(t => t.id === tabId))
  const setNodes = useWorkflowBuilderStore(s => s.setNodes)
  const setEdges = useWorkflowBuilderStore(s => s.setEdges)
  const selectNode = useWorkflowBuilderStore(s => s.selectNode)
  const updateDefinition = useWorkflowBuilderStore(s => s.updateDefinition)
  const syncNodePositions = useWorkflowBuilderStore(s => s.syncNodePositions)
  const showMinimap = useWorkflowBuilderStore(s => s.showMinimap)

  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      if (!tab) return false
      const { source, target } = connection
      if (!source || !target) return false
      if (source === target) return false

      const sourceNode = tab.nodes.find(n => n.id === source)
      const targetNode = tab.nodes.find(n => n.id === target)
      if (!sourceNode || !targetNode) return false

      // Don't allow connecting FROM an end node or TO a start node
      if (String(sourceNode.data.taskType) === 'end') return false
      if (String(targetNode.data.taskType) === 'start') return false

      // Prevent cycles: check if target is already reachable from source via BFS
      const reachable = new Set<string>()
      const queue = [target]
      while (queue.length > 0) {
        const current = queue.shift()!
        if (current === source) return false
        if (reachable.has(current)) continue
        reachable.add(current)
        for (const edge of tab.edges) {
          if (edge.source === current && !reachable.has(edge.target)) {
            queue.push(edge.target)
          }
        }
      }

      return true
    },
    [tab],
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (!tab) return
      const newEdges = addEdge({ ...params, type: 'workflow' }, tab.edges)
      setEdges(tabId, newEdges)
    },
    [tab, tabId, setEdges],
  )

  const onNodeClick: NodeMouseHandler = useCallback(
    (_evt, node) => {
      selectNode(tabId, node.id)
    },
    [tabId, selectNode],
  )

  const onPaneClick = useCallback(() => {
    selectNode(tabId, null)
  }, [tabId, selectNode])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!tab) return

      const raw = e.dataTransfer.getData('application/workflow-step')
      if (!raw) return

      let dropped: { type: string } | null = null
      try { dropped = JSON.parse(raw) } catch { return }
      if (!dropped?.type) return

      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const existingIds = tab.nodes.map(n => n.id)
      const newStep = createDefaultStep(dropped.type, position, existingIds)

      const newDef: WorkflowDefinition = {
        ...tab.definition,
        sequence: [...tab.definition.sequence, newStep],
      }
      updateDefinition(tabId, newDef)
    },
    [tab, tabId, screenToFlowPosition, updateDefinition],
  )

  const handleNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault()
      if (onNodeContextMenu) {
        onNodeContextMenu(event as unknown as React.MouseEvent, node.id)
      }
    },
    [onNodeContextMenu],
  )

  if (!tab) return null

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={tab.nodes}
        edges={tab.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeContextMenu={handleNodeContextMenu}
        onNodesChange={(changes) => {
          if (!tab) return
          // Apply position changes to the visual nodes array
          const updatedNodes = tab.nodes.map(node => {
            const change = changes.find(c => 'id' in c && c.id === node.id)
            if (change && change.type === 'position' && change.position) {
              return { ...node, position: change.position }
            }
            return node
          })
          setNodes(tabId, updatedNodes)

          // When drag completes (dragging===false), write final positions into definition.sequence
          // so they are persisted on save. Skips history to avoid polluting undo stack.
          const dragEndChanges = changes.filter(
            c => c.type === 'position' && 'dragging' in c && c.dragging === false && c.position
          )
          if (dragEndChanges.length > 0) {
            const posMap: Record<string, { x: number; y: number }> = {}
            for (const c of dragEndChanges) {
              if (c.type === 'position' && c.position) posMap[c.id] = c.position
            }
            syncNodePositions(tabId, posMap)
          }
        }}
        onEdgesChange={(changes) => {
          if (!tab) return
          const removed = new Set(
            changes.filter(c => c.type === 'remove').map(c => ('id' in c ? c.id : ''))
          )
          setEdges(tabId, tab.edges.filter(e => !removed.has(e.id)))
        }}
        defaultEdgeOptions={{ type: 'workflow', animated: false }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'var(--color-surface-2, #f9fafb)' }}
        selectionOnDrag={true}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="var(--color-border, #e5e7eb)"
        />
        <Controls
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
          }}
        />
        {showMinimap && (
          <MiniMap
            nodeColor={() => 'var(--brand-200, #bfdbfe)'}
            position="bottom-left"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          />
        )}
      </ReactFlow>
    </div>
  )
}
