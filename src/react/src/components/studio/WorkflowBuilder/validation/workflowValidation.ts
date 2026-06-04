import type { Node, Edge } from '@xyflow/react'
import type { WorkflowDefinition, WorkflowStep } from '../../../../types/workflowBuilder'

// ── Types ─────────────────────────────────────────────────────────────────────

export type ValidationErrorType =
  | 'missing-start'
  | 'missing-end'
  | 'unreachable'
  | 'duplicate-id'
  | 'broken-reference'
  | 'missing-required'

export interface ValidationError {
  nodeId?: string
  message: string
  type: ValidationErrorType
}

export interface ValidationWarning {
  nodeId?: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Collect all step IDs recursively from a sequence */
function collectStepIds(steps: WorkflowStep[]): string[] {
  const ids: string[] = []
  for (const step of steps) {
    ids.push(step.id)
    if (step.branches) {
      for (const branch of Object.values(step.branches)) {
        ids.push(...collectStepIds(branch))
      }
    }
  }
  return ids
}

/** Collect all step IDs from a sequence, returning duplicates */
function findDuplicateIds(steps: WorkflowStep[]): string[] {
  const all = collectStepIds(steps)
  const seen = new Set<string>()
  const duplicates: string[] = []
  for (const id of all) {
    if (seen.has(id)) {
      if (!duplicates.includes(id)) duplicates.push(id)
    } else {
      seen.add(id)
    }
  }
  return duplicates
}

/** Extract all {$.stepId.something} reference IDs from a string */
function extractStepReferences(value: string): string[] {
  const refs: string[] = []
  const regex = /\{\$\.([a-zA-Z0-9_]+)\./g
  let match: RegExpExecArray | null
  while ((match = regex.exec(value)) !== null) {
    refs.push(match[1])
  }
  return refs
}

/** Collect broken {$.stepId.data} references from all taskSettings strings */
function findBrokenReferences(
  steps: WorkflowStep[],
  allIds: Set<string>,
): Array<{ nodeId: string; ref: string }> {
  const broken: Array<{ nodeId: string; ref: string }> = []

  function inspect(step: WorkflowStep) {
    const settings = step.properties?.taskSettings ?? {}
    for (const val of Object.values(settings)) {
      if (typeof val === 'string') {
        const refs = extractStepReferences(val)
        for (const ref of refs) {
          if (!allIds.has(ref)) {
            broken.push({ nodeId: step.id, ref })
          }
        }
      }
    }
    if (step.branches) {
      for (const branch of Object.values(step.branches)) {
        for (const s of branch) inspect(s)
      }
    }
  }

  for (const step of steps) inspect(step)
  return broken
}

// ── Main Validator ────────────────────────────────────────────────────────────

export function validateWorkflow(
  definition: WorkflowDefinition,
  nodes: Node[],
  edges: Edge[],
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Build lookup structures
  const nodeIds = new Set(nodes.map(n => n.id))
  const targetIds = new Set(edges.map(e => e.target))
  const sourceIds = new Set(edges.map(e => e.source))

  // Rule a: Must have exactly one 'start' node
  const startNodes = nodes.filter(n => n.data.taskType === 'start')
  if (startNodes.length === 0) {
    errors.push({
      message: 'Workflow must have a Start node.',
      type: 'missing-start',
    })
  } else if (startNodes.length > 1) {
    errors.push({
      message: `Workflow has ${startNodes.length} Start nodes — exactly one is allowed.`,
      type: 'missing-start',
    })
  }

  // Rule b: Must have at least one 'end' node
  const endNodes = nodes.filter(n => n.data.taskType === 'end')
  if (endNodes.length === 0) {
    errors.push({
      message: 'Workflow must have at least one End node.',
      type: 'missing-end',
    })
  }

  // Rule c: No duplicate step IDs
  const duplicates = findDuplicateIds(definition.sequence)
  for (const dup of duplicates) {
    errors.push({
      nodeId: dup,
      message: `Duplicate step ID: "${dup}". Each step must have a unique ID.`,
      type: 'duplicate-id',
    })
  }

  // Rule d: All {$.stepId.data} references resolve to an existing step ID
  const allStepIds = new Set(collectStepIds(definition.sequence))
  const broken = findBrokenReferences(definition.sequence, allStepIds)
  for (const { nodeId, ref } of broken) {
    errors.push({
      nodeId,
      message: `Step "${nodeId}" references "{$.${ref}.…}" but step "${ref}" does not exist.`,
      type: 'broken-reference',
    })
  }

  // Rule e: Every non-end node must be connected to at least one output edge
  for (const node of nodes) {
    if (node.data.taskType === 'end') continue
    if (!sourceIds.has(node.id)) {
      if (node.data.taskType === 'start') {
        warnings.push({
          nodeId: node.id,
          message: 'Start node has no outgoing connections.',
        })
      } else {
        errors.push({
          nodeId: node.id,
          message: `Step "${String(node.data.label ?? node.id)}" has no outgoing connections.`,
          type: 'unreachable',
        })
      }
    }
  }

  // Rule f: Every non-start node must be connected to at least one input edge
  for (const node of nodes) {
    if (node.data.taskType === 'start') continue
    if (!targetIds.has(node.id) && nodeIds.has(node.id)) {
      errors.push({
        nodeId: node.id,
        message: `Step "${String(node.data.label ?? node.id)}" has no incoming connections (unreachable).`,
        type: 'unreachable',
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
