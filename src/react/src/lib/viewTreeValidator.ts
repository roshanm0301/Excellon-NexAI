/**
 * View Tree Validation Engine — Pure TypeScript, zero React imports
 *
 * Validates a component tree against the component registry rules:
 * - Parent/child hierarchy constraints
 * - Required props presence
 * - Surface compatibility
 * - Duplicate keys
 * - Max depth limits
 */

import type {
  ComponentNode,
  ComponentRegistryEntry,
  SurfaceType,
  ValidationResult,
  ValidationIssue,
} from '../types/viewStudio'

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_TREE_DEPTH = 15
const MAX_CHILDREN = 50

// ─── Registry Lookup ─────────────────────────────────────────────────────────

type RegistryMap = Map<string, ComponentRegistryEntry>

function buildRegistryMap(entries: ComponentRegistryEntry[]): RegistryMap {
  const map = new Map<string, ComponentRegistryEntry>()
  for (const entry of entries) {
    map.set(entry.component_code, entry)
  }
  return map
}

// ─── Validation ──────────────────────────────────────────────────────────────

export function validateTree(
  tree: ComponentNode,
  registry: ComponentRegistryEntry[],
  surfaceType: SurfaceType,
): ValidationResult {
  const errors: ValidationIssue[] = []
  const warnings: ValidationIssue[] = []
  const registryMap = buildRegistryMap(registry)
  const seenKeys = new Set<string>()

  function walk(node: ComponentNode, parentCode: string | null, depth: number): void {
    // Check depth
    if (depth > MAX_TREE_DEPTH) {
      errors.push({
        code: 'MAX_DEPTH_EXCEEDED',
        message: `Component "${node.component_key}" exceeds maximum tree depth of ${MAX_TREE_DEPTH}`,
        field: node.component_key,
      })
      return
    }

    // Duplicate key check
    if (seenKeys.has(node.component_key)) {
      errors.push({
        code: 'DUPLICATE_KEY',
        message: `Duplicate component_key: "${node.component_key}"`,
        field: node.component_key,
      })
    }
    seenKeys.add(node.component_key)

    // Registry entry lookup
    const entry = registryMap.get(node.component_code)
    if (!entry) {
      warnings.push({
        code: 'UNKNOWN_COMPONENT',
        message: `Component "${node.component_code}" not found in registry`,
        field: node.component_key,
      })
      // Can't validate further without registry entry
      for (const child of node.children ?? []) {
        walk(child, node.component_code, depth + 1)
      }
      return
    }

    // Surface compatibility
    const surfaces = entry.supported_surfaces as string[]
    if (!surfaces.includes('all') && !surfaces.includes(surfaceType)) {
      warnings.push({
        code: 'SURFACE_INCOMPATIBLE',
        message: `Component "${node.component_code}" does not support surface "${surfaceType}"`,
        field: node.component_key,
      })
    }

    // Parent constraint
    if (parentCode && entry.allowed_parents.length > 0) {
      if (!entry.allowed_parents.includes('all') && !entry.allowed_parents.includes('any') && !entry.allowed_parents.includes(parentCode)) {
        errors.push({
          code: 'INVALID_PARENT',
          message: `"${node.component_code}" cannot be a child of "${parentCode}". Allowed: ${entry.allowed_parents.join(', ')}`,
          field: node.component_key,
        })
      }
    }

    // Children check: is the component a container?
    const children = node.children ?? []
    if (children.length > 0 && !entry.is_container) {
      errors.push({
        code: 'NOT_A_CONTAINER',
        message: `"${node.component_code}" is not a container but has ${children.length} children`,
        field: node.component_key,
      })
    }

    // Max children
    if (children.length > MAX_CHILDREN) {
      warnings.push({
        code: 'TOO_MANY_CHILDREN',
        message: `"${node.component_key}" has ${children.length} children (max recommended: ${MAX_CHILDREN})`,
        field: node.component_key,
      })
    }

    // Allowed children constraint
    if (entry.allowed_children.length > 0 && !entry.allowed_children.includes('all') && !entry.allowed_children.includes('any')) {
      for (const child of children) {
        if (!entry.allowed_children.includes(child.component_code)) {
          errors.push({
            code: 'INVALID_CHILD',
            message: `"${child.component_code}" is not an allowed child of "${node.component_code}". Allowed: ${entry.allowed_children.join(', ')}`,
            field: child.component_key,
          })
        }
      }
    }

    // Required props validation (from registry config_schema — JSON Schema draft-7)
    // Supports both top-level `required` array and properties with `x-required: true`
    const schema = entry.config_schema as {
      required?: string[]
      properties?: Record<string, { 'x-required'?: boolean }>
    } | undefined
    const requiredFromTopLevel: string[] = schema?.required ?? []
    const requiredFromProperties: string[] = schema?.properties
      ? Object.entries(schema.properties)
          .filter(([, def]) => def['x-required'] === true)
          .map(([key]) => key)
      : []
    const allRequired = [...new Set([...requiredFromTopLevel, ...requiredFromProperties])]
    for (const requiredProp of allRequired) {
      const propVal = node.props?.[requiredProp]
      if (propVal === undefined || propVal === null || propVal === '') {
        warnings.push({
          code: 'MISSING_REQUIRED_PROP',
          message: `"${node.component_code}" is missing required prop "${requiredProp}"`,
          field: node.component_key,
        })
      }
    }

    // Deprecated component check
    if (entry.deprecated_at) {
      warnings.push({
        code: 'DEPRECATED_COMPONENT',
        message: `"${node.component_code}" is deprecated${entry.successor_code ? `. Use "${entry.successor_code}" instead` : ''}`,
        field: node.component_key,
      })
    }

    // Recurse children
    for (const child of children) {
      walk(child, node.component_code, depth + 1)
    }
  }

  // Root must be page_root
  if (tree.component_code !== 'page_root') {
    errors.push({
      code: 'INVALID_ROOT',
      message: `Root component must be "page_root", found "${tree.component_code}"`,
      field: tree.component_key,
    })
  }

  walk(tree, null, 0)

  return { errors, warnings }
}

// ─── Quick Checks (for real-time feedback) ───────────────────────────────────

/** Check if a component can be inserted as a child of the given parent */
export function canInsertChild(
  parentCode: string,
  childCode: string,
  registry: ComponentRegistryEntry[],
): { allowed: boolean; reason?: string } {
  const registryMap = buildRegistryMap(registry)
  const parentEntry = registryMap.get(parentCode)
  const childEntry = registryMap.get(childCode)

  if (!parentEntry) return { allowed: false, reason: `Unknown parent: ${parentCode}` }
  if (!childEntry) return { allowed: false, reason: `Unknown child: ${childCode}` }

  if (!parentEntry.is_container) {
    return { allowed: false, reason: `"${parentCode}" is not a container` }
  }

  if (parentEntry.allowed_children.length > 0 && !parentEntry.allowed_children.includes('all') && !parentEntry.allowed_children.includes('any')) {
    if (!parentEntry.allowed_children.includes(childCode)) {
      return { allowed: false, reason: `"${childCode}" is not allowed inside "${parentCode}"` }
    }
  }

  // Empty allowed_parents means root-only — cannot be placed inside anything
  if (childEntry.allowed_parents.length === 0) {
    return { allowed: false, reason: `"${childCode}" is the root component and cannot be placed inside any other component` }
  }

  if (childEntry.allowed_parents.length > 0 && !childEntry.allowed_parents.includes('all') && !childEntry.allowed_parents.includes('any')) {
    if (!childEntry.allowed_parents.includes(parentCode)) {
      return { allowed: false, reason: `"${childCode}" cannot be placed inside "${parentCode}"` }
    }
  }

  return { allowed: true }
}

/**
 * Simple boolean helper — returns true if childCode can be inserted as a
 * direct child of parentCode according to the registry rules.
 * Used by the canvas store and palette/tree components for real-time guards.
 */
export function canInsert(
  parentCode: string,
  childCode: string,
  registryEntries: ComponentRegistryEntry[],
): boolean {
  return canInsertChild(parentCode, childCode, registryEntries).allowed
}

/** Get validation summary as counts */
export function getValidationSummary(result: ValidationResult): {
  errorCount: number
  warningCount: number
  isValid: boolean
} {
  return {
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
    isValid: result.errors.length === 0,
  }
}
