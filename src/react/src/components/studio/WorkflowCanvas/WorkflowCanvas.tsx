import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, Panel,
  useNodesState, useEdgesState, addEdge,
  type Connection, type Node, type Edge,
  type OnConnect, type OnNodesChange, type OnEdgesChange,
  MarkerType, useReactFlow, ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Undo2, Redo2, Layout, Maximize2, AlertCircle, CheckCircle } from 'lucide-react'
import { workflowNodeTypes, type WorkflowNodeData } from './WorkflowNodes'
import { workflowEdgeTypes, type WorkflowEdgeData } from './WorkflowEdge'
import { NodePalette } from './NodePalette'
import { NodeConfigPanel } from './NodeConfigPanel'
import type { DAGDefinition, DAGNode, DAGEdge, DAGGateway, StepType, GatewayType } from '../../../config/studioApi'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowCanvasProps {
  dag: DAGDefinition | null
  onChange: (dag: DAGDefinition) => void
  readOnly?: boolean
  executionState?: Record<string, string> // nodeId → status for instance viewing
}

interface HistoryEntry {
  nodes: Node[]
  edges: Edge[]
}

// ─── Utilities ────────────────────────────────────────────────────────────────

let idCounter = 0
function nextId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++idCounter}`
}

function dagToFlow(dag: DAGDefinition | null): { nodes: Node[]; edges: Edge[] } {
  if (!dag) return { nodes: [], edges: [] }

  const nodes: Node[] = dag.nodes.map(n => ({
    id: n.id,
    type: n.type === 'gateway' ? 'gateway' : (n.id === dag.startNodeId ? 'start' : (n.id === dag.endNodeId ? 'end' : 'task')),
    position: {
      x: parseFloat(n.metadata?.x ?? '0') || Math.random() * 600,
      y: parseFloat(n.metadata?.y ?? '0') || Math.random() * 400,
    },
    data: {
      label: n.name,
      stepType: n.type,
      timeoutMins: n.timeoutMins,
      retryCount: n.retryCount,
      config: n.config,
    } satisfies WorkflowNodeData,
  }))

  // Add gateway nodes
  if (dag.gateways) {
    for (const gw of dag.gateways) {
      const existing = nodes.find(n => n.id === gw.id)
      if (!existing) {
        nodes.push({
          id: gw.id,
          type: 'gateway',
          position: { x: Math.random() * 600, y: Math.random() * 400 },
          data: {
            label: gw.name,
            stepType: 'gateway' as StepType,
            gatewayType: gw.type,
            isJoin: gw.isJoin,
          } satisfies WorkflowNodeData,
        })
      } else {
        existing.data = {
          ...existing.data as WorkflowNodeData,
          gatewayType: gw.type,
          isJoin: gw.isJoin,
        }
      }
    }
  }

  const edges: Edge[] = dag.edges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'workflow',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    data: {
      label: e.label,
      condition: e.condition,
      priority: e.priority,
    } satisfies WorkflowEdgeData,
  }))

  return { nodes, edges }
}

function flowToDAG(nodes: Node[], edges: Edge[]): DAGDefinition {
  const startNode = nodes.find(n => n.type === 'start')
  const endNode = nodes.find(n => n.type === 'end')

  const dagNodes: DAGNode[] = nodes
    .filter(n => n.type !== 'gateway')
    .map(n => {
      const data = n.data as WorkflowNodeData
      return {
        id: n.id,
        name: data.label,
        type: data.stepType,
        config: data.config,
        timeoutMins: data.timeoutMins,
        retryCount: data.retryCount,
        metadata: { x: String(Math.round(n.position.x)), y: String(Math.round(n.position.y)) },
      }
    })

  // Gateway nodes get added to both nodes array (for positioning) and gateways array
  const gateways: DAGGateway[] = nodes
    .filter(n => n.type === 'gateway')
    .map(n => {
      const data = n.data as WorkflowNodeData
      // Also add to dagNodes for metadata positioning
      dagNodes.push({
        id: n.id,
        name: data.label,
        type: 'gateway',
        metadata: { x: String(Math.round(n.position.x)), y: String(Math.round(n.position.y)) },
      })
      return {
        id: n.id,
        name: data.label,
        type: (data.gatewayType ?? 'parallel') as GatewayType,
        isJoin: data.isJoin ?? false,
        joinPolicy: data.isJoin ? 'all' : undefined,
      }
    })

  const dagEdges: DAGEdge[] = edges.map(e => {
    const data = e.data as WorkflowEdgeData | undefined
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      condition: data?.condition,
      label: data?.label,
      priority: data?.priority,
    }
  })

  return {
    startNodeId: startNode?.id ?? '',
    endNodeId: endNode?.id,
    nodes: dagNodes,
    edges: dagEdges,
    gateways: gateways.length > 0 ? gateways : undefined,
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
}

function validateDAG(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const startNodes = nodes.filter(n => n.type === 'start')
  const endNodes = nodes.filter(n => n.type === 'end')

  if (startNodes.length === 0) issues.push({ level: 'error', message: 'Missing Start node' })
  if (startNodes.length > 1) issues.push({ level: 'error', message: 'Multiple Start nodes' })
  if (endNodes.length === 0) issues.push({ level: 'warning', message: 'Missing End node (implicit end)' })
  if (endNodes.length > 1) issues.push({ level: 'error', message: 'Multiple End nodes' })

  // Check connectivity — all nodes should be reachable from start
  if (startNodes.length === 1) {
    const reachable = new Set<string>()
    const queue = [startNodes[0].id]
    while (queue.length > 0) {
      const current = queue.shift()!
      if (reachable.has(current)) continue
      reachable.add(current)
      const outEdges = edges.filter(e => e.source === current)
      for (const edge of outEdges) {
        if (!reachable.has(edge.target)) queue.push(edge.target)
      }
    }
    const unreachable = nodes.filter(n => !reachable.has(n.id))
    if (unreachable.length > 0) {
      issues.push({ level: 'warning', message: `${unreachable.length} node(s) unreachable from Start` })
    }
  }

  // Check for nodes without outgoing edges (except End)
  for (const node of nodes) {
    if (node.type === 'end') continue
    const hasOut = edges.some(e => e.source === node.id)
    if (!hasOut) {
      issues.push({ level: 'warning', message: `"${(node.data as WorkflowNodeData).label}" has no outgoing edge` })
    }
  }

  // Check for nodes without incoming edges (except Start)
  for (const node of nodes) {
    if (node.type === 'start') continue
    const hasIn = edges.some(e => e.target === node.id)
    if (!hasIn) {
      issues.push({ level: 'warning', message: `"${(node.data as WorkflowNodeData).label}" has no incoming edge` })
    }
  }

  // Cycle detection via DFS
  const visited = new Set<string>()
  const stack = new Set<string>()
  function hasCycle(nodeId: string): boolean {
    if (stack.has(nodeId)) return true
    if (visited.has(nodeId)) return false
    visited.add(nodeId)
    stack.add(nodeId)
    for (const edge of edges.filter(e => e.source === nodeId)) {
      if (hasCycle(edge.target)) return true
    }
    stack.delete(nodeId)
    return false
  }
  for (const node of nodes) {
    if (hasCycle(node.id)) {
      issues.push({ level: 'error', message: 'Cycle detected — DAG workflows must be acyclic' })
      break
    }
  }

  return issues
}

// ─── Auto-Layout (Dagre-like topological) ────────────────────────────────────

function autoLayout(nodes: Node[], edges: Edge[]): Node[] {
  // Simple topological sort + layered positioning
  const adjList = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  for (const n of nodes) {
    adjList.set(n.id, [])
    inDegree.set(n.id, 0)
  }
  for (const e of edges) {
    adjList.get(e.source)?.push(e.target)
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
  }

  // BFS topological layers
  const layers: string[][] = []
  const queue = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id)
  const placed = new Set<string>()

  while (queue.length > 0) {
    const layer = [...queue]
    layers.push(layer)
    queue.length = 0
    for (const id of layer) {
      placed.add(id)
      for (const target of adjList.get(id) ?? []) {
        inDegree.set(target, (inDegree.get(target) ?? 0) - 1)
        if (inDegree.get(target) === 0 && !placed.has(target)) {
          queue.push(target)
        }
      }
    }
  }

  // Place unplaced nodes in final layer
  const unplaced = nodes.filter(n => !placed.has(n.id))
  if (unplaced.length > 0) layers.push(unplaced.map(n => n.id))

  const LAYER_GAP = 140
  const NODE_GAP = 200

  const positions = new Map<string, { x: number; y: number }>()
  for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
    const layer = layers[layerIdx]
    const layerWidth = layer.length * NODE_GAP
    const startX = -layerWidth / 2 + NODE_GAP / 2
    for (let nodeIdx = 0; nodeIdx < layer.length; nodeIdx++) {
      positions.set(layer[nodeIdx], { x: startX + nodeIdx * NODE_GAP, y: layerIdx * LAYER_GAP })
    }
  }

  return nodes.map(n => ({
    ...n,
    position: positions.get(n.id) ?? n.position,
  }))
}

// ─── Inner Canvas (needs ReactFlowProvider above) ─────────────────────────────

function WorkflowCanvasInner({ dag, onChange, readOnly, executionState }: WorkflowCanvasProps) {
  const reactFlow = useReactFlow()
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => dagToFlow(dag), [])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<(WorkflowNodeData & { id: string }) | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  // History for undo/redo
  const historyRef = useRef<HistoryEntry[]>([{ nodes: initialNodes, edges: initialEdges }])
  const historyIndexRef = useRef(0)
  const skipHistoryRef = useRef(false)

  // Push to history on meaningful changes
  const pushHistory = useCallback(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      return
    }
    const current = historyRef.current
    const idx = historyIndexRef.current
    // Trim forward history
    historyRef.current = current.slice(0, idx + 1)
    historyRef.current.push({ nodes, edges })
    historyIndexRef.current = historyRef.current.length - 1
    // Keep max 50 entries
    if (historyRef.current.length > 50) {
      historyRef.current.shift()
      historyIndexRef.current--
    }
  }, [nodes, edges])

  // Notify parent of changes
  useEffect(() => {
    const dagResult = flowToDAG(nodes, edges)
    onChange(dagResult)
  }, [nodes, edges])

  // Apply execution state overlay
  useEffect(() => {
    if (!executionState) return
    setNodes(prev => prev.map(n => ({
      ...n,
      data: { ...n.data as WorkflowNodeData, status: executionState[n.id] as WorkflowNodeData['status'] },
    })))
  }, [executionState])

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    const newEdge = {
      ...connection,
      id: nextId('edge'),
      type: 'workflow',
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      data: {} satisfies WorkflowEdgeData,
    }
    setEdges(eds => addEdge(newEdge as Edge, eds))
    setTimeout(pushHistory, 0)
  }, [pushHistory])

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    // Push history on drag end
    const hasDragStop = changes.some((c: any) => c.type === 'position' && c.dragging === false)
    if (hasDragStop) setTimeout(pushHistory, 0)
  }, [onNodesChange, pushHistory])

  const handleEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChange(changes)
    const hasRemove = changes.some((c: any) => c.type === 'remove')
    if (hasRemove) setTimeout(pushHistory, 0)
  }, [onEdgesChange, pushHistory])

  // Node selection
  const onNodeClick = useCallback((_: any, node: Node) => {
    if (readOnly) return
    const data = node.data as WorkflowNodeData
    setSelectedNode({ ...data, id: node.id })
  }, [readOnly])

  const onPaneClick = useCallback(() => setSelectedNode(null), [])

  // Drag-and-drop from palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const raw = event.dataTransfer.getData('application/workflow-node')
    if (!raw) return

    const payload = JSON.parse(raw)
    const position = reactFlow.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    const id = nextId(payload.type)

    const newNode: Node = {
      id,
      type: payload.type,
      position,
      data: {
        label: payload.label,
        stepType: payload.stepType ?? payload.type,
        gatewayType: payload.gatewayType,
        isJoin: payload.isJoin,
      } satisfies WorkflowNodeData,
    }

    setNodes(nds => [...nds, newNode])
    setTimeout(pushHistory, 0)
  }, [reactFlow, pushHistory])

  // Update node config from panel
  const updateNodeData = useCallback((nodeId: string, data: Partial<WorkflowNodeData>) => {
    setNodes(nds => nds.map(n => {
      if (n.id !== nodeId) return n
      return { ...n, data: { ...n.data as WorkflowNodeData, ...data } }
    }))
    setSelectedNode(prev => prev && prev.id === nodeId ? { ...prev, ...data } : prev)
    setTimeout(pushHistory, 0)
  }, [pushHistory])

  // Delete node
  const deleteNode = useCallback((nodeId: string) => {
    setNodes(nds => nds.filter(n => n.id !== nodeId))
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
    setTimeout(pushHistory, 0)
  }, [pushHistory])

  // Undo / Redo
  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current--
    const entry = historyRef.current[historyIndexRef.current]
    skipHistoryRef.current = true
    setNodes(entry.nodes)
    setEdges(entry.edges)
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current++
    const entry = historyRef.current[historyIndexRef.current]
    skipHistoryRef.current = true
    setNodes(entry.nodes)
    setEdges(entry.edges)
  }, [])

  // Auto-layout
  const doAutoLayout = useCallback(() => {
    const laid = autoLayout(nodes, edges)
    setNodes(laid)
    setTimeout(() => {
      reactFlow.fitView({ padding: 0.2 })
      pushHistory()
    }, 50)
  }, [nodes, edges, reactFlow, pushHistory])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (readOnly) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) { deleteNode(selectedNode.id) }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [readOnly, undo, redo, selectedNode, deleteNode])

  // Validation
  const issues = useMemo(() => validateDAG(nodes, edges), [nodes, edges])
  const hasErrors = issues.some(i => i.level === 'error')

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {!readOnly && <NodePalette />}
      <div style={{ flex: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={readOnly ? undefined : onDragOver}
          onDrop={readOnly ? undefined : onDrop}
          nodeTypes={workflowNodeTypes}
          edgeTypes={workflowEdgeTypes}
          defaultEdgeOptions={{ type: 'workflow', markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 } }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
          selectionOnDrag={!readOnly}
          panOnScroll
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          style={{ background: 'var(--bg-secondary)' }}
        >
          <Background gap={20} size={1} color="var(--border-secondary)" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            pannable
            zoomable
            style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)' }}
          />

          {/* Toolbar panel */}
          {!readOnly && (
            <Panel position="top-right">
              <div style={{
                display: 'flex', gap: 4, padding: 6,
                background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <ToolButton icon={<Undo2 size={14} />} onClick={undo} title="Undo (Ctrl+Z)" disabled={historyIndexRef.current <= 0} />
                <ToolButton icon={<Redo2 size={14} />} onClick={redo} title="Redo (Ctrl+Y)" disabled={historyIndexRef.current >= historyRef.current.length - 1} />
                <div style={{ width: 1, background: 'var(--border-secondary)', margin: '2px 4px' }} />
                <ToolButton icon={<Layout size={14} />} onClick={doAutoLayout} title="Auto-Layout" />
                <ToolButton icon={<Maximize2 size={14} />} onClick={() => reactFlow.fitView({ padding: 0.2 })} title="Fit View" />
                <div style={{ width: 1, background: 'var(--border-secondary)', margin: '2px 4px' }} />
                <ToolButton
                  icon={hasErrors ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                  onClick={() => setShowValidation(!showValidation)}
                  title="Validate"
                  active={showValidation}
                  color={hasErrors ? 'var(--error-500)' : 'var(--success-500)'}
                />
              </div>
            </Panel>
          )}

          {/* Validation panel */}
          {showValidation && issues.length > 0 && (
            <Panel position="bottom-right">
              <div style={{
                maxWidth: 320, maxHeight: 200, overflow: 'auto',
                padding: 12, background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                fontSize: 'var(--text-xs)',
              }}>
                <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--fg-secondary)' }}>
                  Validation ({issues.length} issue{issues.length !== 1 ? 's' : ''})
                </div>
                {issues.map((issue, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 6, alignItems: 'flex-start',
                    padding: '3px 0', color: issue.level === 'error' ? 'var(--error-600)' : 'var(--warning-600)',
                  }}>
                    <span>{issue.level === 'error' ? '●' : '◐'}</span>
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {showValidation && issues.length === 0 && (
            <Panel position="bottom-right">
              <div style={{
                padding: '8px 14px', background: 'var(--success-50)',
                border: '1px solid var(--success-200)', borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-xs)', color: 'var(--success-700)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <CheckCircle size={14} /> DAG is valid
              </div>
            </Panel>
          )}

          {/* Node count badge */}
          <Panel position="bottom-left">
            <div style={{
              padding: '4px 10px', background: 'var(--bg-primary)',
              border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)', color: 'var(--fg-tertiary)',
            }}>
              {nodes.length} nodes · {edges.length} edges
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Config panel */}
      {!readOnly && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => setSelectedNode(null)}
          onDelete={deleteNode}
        />
      )}
    </div>
  )
}

// ─── Tool Button ──────────────────────────────────────────────────────────────

function ToolButton({ icon, onClick, title, disabled, active, color }: {
  icon: React.ReactNode; onClick: () => void; title: string; disabled?: boolean; active?: boolean; color?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: 'none', borderRadius: 'var(--radius-md)', cursor: disabled ? 'not-allowed' : 'pointer',
        background: active ? 'var(--brand-50)' : 'transparent',
        color: color ?? (disabled ? 'var(--fg-tertiary)' : 'var(--fg-secondary)'),
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.1s',
      }}
    >
      {icon}
    </button>
  )
}

// ─── Exported Wrapper (provides ReactFlowProvider) ────────────────────────────

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
