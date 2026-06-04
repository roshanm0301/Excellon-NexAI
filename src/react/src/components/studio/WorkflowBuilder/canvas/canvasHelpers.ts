import type { Node, Edge } from '@xyflow/react'
import type { WorkflowStep, TaskType } from '../../../../types/workflowBuilder'
import { BRANCHING_TASK_TYPES } from '../../../../types/workflowBuilder'

const STEP_WIDTH = 220
const STEP_HEIGHT = 72
const V_GAP = 60   // vertical gap between steps
const H_GAP = 100  // horizontal gap between branches

// ── ID generation ─────────────────────────────────────────────────────────────

export function generateNodeId(): string {
  return `node-${Math.random().toString(36).slice(2, 9)}`
}

export function generateStepId(name: string, existingIds: string[]): string {
  const base = name
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)))
    .join('')
    || 'step'

  if (!existingIds.includes(base)) return base

  let i = 2
  while (existingIds.includes(`${base}${i}`)) i++
  return `${base}${i}`
}

// ── Default step name ─────────────────────────────────────────────────────────

const DEFAULT_NAMES: Partial<Record<string, string>> = {
  start: 'Start',
  end: 'End',
  Document: 'Get Record',
  Query: 'Query Records',
  HTTP: 'HTTP Request',
  Condition: 'Check Condition',
  Switch: 'Route By Value',
  Loop: 'For Each',
  Iterator: 'Iterate Items',
  Transaction: 'Transaction',
  Parallel: 'Run in Parallel',
  Promise: 'Concurrent Steps',
  Rule: 'Evaluate Rule',
  Resolver: 'Compute Value',
  Validator: 'Validate Input',
  Response: 'Send Response',
  Request: 'Read Request',
  SMTP: 'Send Email',
  SMS: 'Send SMS',
  Cache: 'Cache',
  Variable: 'Set Variable',
  AI: 'AI Call',
}

export function getDefaultStepName(type: TaskType | string): string {
  return DEFAULT_NAMES[type] ?? String(type)
}

// ── Default step factory ──────────────────────────────────────────────────────

export function createDefaultStep(
  type: TaskType | string,
  position: { x: number; y: number },
  existingIds: string[] = [],
): WorkflowStep {
  const name = getDefaultStepName(type)
  const id = generateStepId(name, existingIds)
  const isBranching = BRANCHING_TASK_TYPES.has(type as TaskType)

  const step: WorkflowStep = {
    id,
    type: type as TaskType,
    name,
    componentType: isBranching ? (type === 'Condition' ? 'switch' : 'container') : 'task',
    position,
    properties: { taskSettings: {} },
  }

  if (isBranching) {
    step.branches = {}
    if (type === 'Condition') {
      step.branches = { onSuccess: [], onFailure: [] }
    } else if (type === 'Transaction') {
      step.branches = { tasks: [], rollback: [] }
    } else if (type === 'Switch' || type === 'Parallel') {
      step.branches = { case1: [], default: [] }
    } else {
      step.branches = { tasks: [] }
    }
  }

  return step
}

// ── Steps → ReactFlow nodes + edges ──────────────────────────────────────────

interface FlowResult {
  nodes: Node[]
  edges: Edge[]
}

export function stepsToFlow(steps: WorkflowStep[]): FlowResult {
  const nodes: Node[] = []
  const edges: Edge[] = []

  function processSequence(
    seq: WorkflowStep[],
    startX: number,
    startY: number,
    parentEdgeTarget?: string,
    parentEdgeHandle?: string,
  ): { bottomY: number; bottomId: string | undefined } {
    let currentY = startY
    let prevId: string | undefined = parentEdgeTarget

    for (const step of seq) {
      const nodeId = step.id

      nodes.push({
        id: nodeId,
        type: getNodeType(step.type),
        position: { x: startX, y: currentY },
        data: {
          step,
          label: step.name,
          taskType: step.type,
        },
      })

      if (prevId) {
        edges.push({
          id: `e-${prevId}-${nodeId}${parentEdgeHandle ? `-${parentEdgeHandle}` : ''}`,
          source: prevId,
          target: nodeId,
          sourceHandle: parentEdgeHandle,
          animated: false,
          style: getEdgeStyle(parentEdgeHandle),
          type: 'workflow',
        })
        parentEdgeHandle = undefined
      }

      if (step.branches && Object.keys(step.branches).length > 0) {
        const branchKeys = Object.keys(step.branches)
        const totalWidth = branchKeys.length * (STEP_WIDTH + H_GAP) - H_GAP
        const branchStartX = startX - totalWidth / 2 + STEP_WIDTH / 2

        let maxBranchBottom = currentY + STEP_HEIGHT + V_GAP

        branchKeys.forEach((branchKey, idx) => {
          const branchX = branchStartX + idx * (STEP_WIDTH + H_GAP)
          const branchY = currentY + STEP_HEIGHT + V_GAP
          const branchSteps = step.branches![branchKey] ?? []

          const result = processSequence(branchSteps, branchX, branchY, nodeId, branchKey)
          if (result.bottomY > maxBranchBottom) maxBranchBottom = result.bottomY
        })

        currentY = maxBranchBottom + V_GAP
        prevId = undefined
      } else {
        currentY += STEP_HEIGHT + V_GAP
        prevId = nodeId
      }
    }

    return { bottomY: currentY, bottomId: prevId }
  }

  processSequence(steps, 300, 50)
  return { nodes, edges }
}

// ── ReactFlow nodes + edges → Steps ──────────────────────────────────────────

export function flowToSteps(nodes: Node[], edges: Edge[]): WorkflowStep[] {
  const nodeMap = new Map<string, Node>(nodes.map(n => [n.id, n]))
  const edgesBySource = new Map<string, Edge[]>()

  for (const edge of edges) {
    const list = edgesBySource.get(edge.source) ?? []
    list.push(edge)
    edgesBySource.set(edge.source, list)
  }

  const targetIds = new Set(edges.map(e => e.target))
  const roots = nodes.filter(n => !targetIds.has(n.id))

  function walkSequence(startId: string | undefined): WorkflowStep[] {
    if (!startId) return []
    const result: WorkflowStep[] = []
    let currentId: string | undefined = startId

    while (currentId) {
      const node = nodeMap.get(currentId)
      if (!node) break

      const step: WorkflowStep = {
        ...(node.data.step as WorkflowStep),
        position: node.position,
      }

      const outEdges = edgesBySource.get(currentId) ?? []
      const branchEdges = outEdges.filter(e => e.sourceHandle)
      const nextEdge = outEdges.find(e => !e.sourceHandle)

      if (branchEdges.length > 0) {
        step.branches = {}
        const branchHandles = [...new Set(branchEdges.map(e => e.sourceHandle!))]
        for (const handle of branchHandles) {
          const branchStart = branchEdges.find(e => e.sourceHandle === handle)
          step.branches[handle] = branchStart ? walkSequence(branchStart.target) : []
        }
      }

      result.push(step)
      currentId = nextEdge?.target
    }

    return result
  }

  if (roots.length === 0) return []
  const startNode = roots.find(n => n.data.taskType === 'start') ?? roots[0]
  return walkSequence(startNode.id)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNodeType(type: TaskType | string): string {
  if (type === 'start') return 'startNode'
  if (type === 'end') return 'endNode'
  if (type === 'Condition') return 'conditionNode'
  if (type === 'Switch') return 'switchNode'
  if (BRANCHING_TASK_TYPES.has(type as TaskType)) return 'containerNode'
  return 'taskNode'
}

function getEdgeStyle(handle?: string): React.CSSProperties {
  if (handle === 'onSuccess') return { stroke: 'var(--success-500, #22c55e)', strokeWidth: 2 }
  if (handle === 'onFailure') return { stroke: 'var(--error-500, #ef4444)', strokeWidth: 2 }
  if (handle === 'rollback') return { stroke: 'var(--warning-500, #f59e0b)', strokeWidth: 2, strokeDasharray: '5,3' }
  return { stroke: 'var(--color-border, #e5e7eb)', strokeWidth: 2 }
}

// React import needed for CSSProperties
import type React from 'react'
