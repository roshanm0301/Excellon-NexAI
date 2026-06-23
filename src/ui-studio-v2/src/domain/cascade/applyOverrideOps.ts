// Phase 5 T2.2.1 — apply override operations to a node (pure, immutable)

import type { NodeBase, OverrideOp } from "@/domain/types/base"

function deepClone<T>(obj: T): T {
  return structuredClone(obj)
}

function getAtPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".")
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined
    }
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".")
  let current: Record<string, unknown> = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (current[key] === undefined || current[key] === null || typeof current[key] !== "object") {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }
  current[keys[keys.length - 1]] = value
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target }
  for (const key of Object.keys(source)) {
    const sourceVal = source[key]
    const targetVal = result[key]
    if (
      typeof sourceVal === "object" &&
      sourceVal !== null &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === "object" &&
      targetVal !== null &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>,
      )
    } else {
      result[key] = sourceVal
    }
  }
  return result
}

interface HasLogicalKey {
  logicalKey: string
}

function isChildArray(value: unknown): value is HasLogicalKey[] {
  return (
    Array.isArray(value) &&
    (value.length === 0 ||
      (typeof value[0] === "object" && value[0] !== null && "logicalKey" in value[0]))
  )
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && (value.length === 0 || typeof value[0] === "string")
}

export function applyOverrideOps<T extends NodeBase>(node: T, ops: OverrideOp[]): T {
  if (ops.length === 0) return node

  const result = deepClone(node) as Record<string, unknown>

  for (const op of ops) {
    switch (op.op) {
      case "set": {
        setAtPath(result, op.path, op.value)
        break
      }
      case "merge": {
        const existing = getAtPath(result, op.path)
        if (typeof existing === "object" && existing !== null && !Array.isArray(existing)) {
          setAtPath(
            result,
            op.path,
            deepMerge(existing as Record<string, unknown>, op.value),
          )
        } else {
          setAtPath(result, op.path, op.value)
        }
        break
      }
      case "insert": {
        const collection = getAtPath(result, op.path)
        if (isChildArray(collection)) {
          const newEntry = { logicalKey: op.logicalKey } as HasLogicalKey
          if (op.relativeTo === undefined) {
            collection.push(newEntry)
          } else {
            const idx = collection.findIndex((c) => c.logicalKey === op.relativeTo)
            if (idx === -1) {
              collection.push(newEntry)
            } else if (op.position === "before") {
              collection.splice(idx, 0, newEntry)
            } else {
              collection.splice(idx + 1, 0, newEntry)
            }
          }
          setAtPath(result, op.path, collection)
        } else if (isStringArray(collection)) {
          if (op.relativeTo === undefined) {
            collection.push(op.logicalKey)
          } else {
            const idx = collection.indexOf(op.relativeTo)
            if (idx === -1) {
              collection.push(op.logicalKey)
            } else if (op.position === "before") {
              collection.splice(idx, 0, op.logicalKey)
            } else {
              collection.splice(idx + 1, 0, op.logicalKey)
            }
          }
          setAtPath(result, op.path, collection)
        } else {
          // path doesn't exist yet — create array with the new entry
          setAtPath(result, op.path, [op.logicalKey])
        }
        break
      }
      case "remove": {
        const nodeAsRecord = result as Record<string, unknown>
        // Walk all array properties looking for the child to remove
        for (const key of Object.keys(nodeAsRecord)) {
          const val = nodeAsRecord[key]
          if (isChildArray(val)) {
            nodeAsRecord[key] = val.filter((c) => c.logicalKey !== op.logicalKey)
          } else if (isStringArray(val)) {
            nodeAsRecord[key] = val.filter((s) => s !== op.logicalKey)
          }
        }
        break
      }
      case "replace": {
        const nodeAsRecord = result as Record<string, unknown>
        for (const key of Object.keys(nodeAsRecord)) {
          const val = nodeAsRecord[key]
          if (isChildArray(val)) {
            const idx = val.findIndex((c) => c.logicalKey === op.logicalKey)
            if (idx !== -1) {
              val[idx] = { ...op.value, logicalKey: op.logicalKey } as HasLogicalKey
              nodeAsRecord[key] = val
            }
          }
        }
        break
      }
    }
  }

  return result as T
}
