import type { WorkflowDefinition } from '../../../../types/workflowBuilder'

interface ExportEnvelope {
  name: string
  definition: WorkflowDefinition
  exportedAt: string
  version: 1
}

/**
 * Export the current workflow as a downloadable JSON file.
 * Triggers a browser file download without using fetch().
 */
export function exportWorkflowAsJson(name: string, definition: WorkflowDefinition): void {
  const envelope: ExportEnvelope = {
    name,
    definition,
    exportedAt: new Date().toISOString(),
    version: 1,
  }
  const json = JSON.stringify(envelope, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${name.replace(/[^a-z0-9_-]/gi, '_')}_workflow.json`
  // Append to DOM so Firefox triggers the download (detached elements are ignored)
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Validate imported JSON before applying it as a workflow definition.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateImportJson(json: unknown): string | null {
  if (json === null || typeof json !== 'object') {
    return 'Invalid JSON: expected an object at the top level.'
  }

  const obj = json as Record<string, unknown>

  if (!('definition' in obj)) {
    return 'Missing required field: "definition".'
  }

  if ('version' in obj && obj['version'] !== 1) {
    return `Unsupported workflow format version: ${String(obj['version'])}.`
  }

  const def = obj['definition']
  if (def === null || typeof def !== 'object') {
    return 'Invalid format: "definition" must be an object.'
  }

  const defObj = def as Record<string, unknown>

  if (!('sequence' in defObj) || !Array.isArray(defObj['sequence'])) {
    return 'Invalid format: "definition.sequence" must be an array.'
  }

  if (!('properties' in defObj) || typeof defObj['properties'] !== 'object' || defObj['properties'] === null) {
    return 'Invalid format: "definition.properties" must be an object.'
  }

  // Validate each step in the sequence
  const seenIds = new Set<string>()
  const sequence = defObj['sequence'] as unknown[]
  for (let i = 0; i < sequence.length; i++) {
    const item = sequence[i]
    if (item === null || typeof item !== 'object') {
      return `Invalid step at index ${i}: must be an object.`
    }
    const s = item as Record<string, unknown>
    if (typeof s['id'] !== 'string' || s['id'].trim() === '') {
      return `Invalid step at index ${i}: "id" must be a non-empty string.`
    }
    if (typeof s['name'] !== 'string' || s['name'].trim() === '') {
      return `Invalid step at index ${i}: "name" must be a non-empty string.`
    }
    if (typeof s['type'] !== 'string' || s['type'].trim() === '') {
      return `Invalid step at index ${i}: "type" must be a non-empty string.`
    }
    if (s['properties'] === null || typeof s['properties'] !== 'object') {
      return `Invalid step at index ${i}: "properties" must be an object.`
    }
    const props = s['properties'] as Record<string, unknown>
    if (props['taskSettings'] === null || typeof props['taskSettings'] !== 'object') {
      return `Invalid step at index ${i}: "properties.taskSettings" must be an object.`
    }
    const id = s['id'] as string
    if (seenIds.has(id)) {
      return `Duplicate step ID "${id}" found in sequence.`
    }
    seenIds.add(id)
  }

  return null
}

/**
 * Parse raw text as JSON and extract the WorkflowDefinition from the envelope.
 * Returns the definition on success, or throws with a descriptive message.
 */
export function parseImportText(text: string): WorkflowDefinition {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Could not parse JSON. Check for syntax errors.')
  }

  const validationError = validateImportJson(parsed)
  if (validationError !== null) {
    throw new Error(validationError)
  }

  const envelope = parsed as { definition: WorkflowDefinition }
  return envelope.definition
}
