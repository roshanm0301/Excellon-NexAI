// Phase 5 T2.3.1 — validate component props against semantic contracts [L32]

import type { Issue } from "@/domain/types/validation"
import type { ComponentNode } from "@/domain/types/nodes"
import { isBinding } from "@/domain/types/nodes"
import type { SemanticContract, PropType } from "@/domain/types/contracts"

function matchesPropType(value: unknown, expectedType: PropType): boolean {
  if (expectedType === "unknown") return true
  if (expectedType === "binding") return isBinding(value)

  switch (expectedType) {
    case "string":
      return typeof value === "string"
    case "number":
      return typeof value === "number"
    case "boolean":
      return typeof value === "boolean"
    case "string[]":
      return Array.isArray(value) && value.every((v) => typeof v === "string")
    case "number[]":
      return Array.isArray(value) && value.every((v) => typeof v === "number")
    case "record":
      return typeof value === "object" && value !== null && !Array.isArray(value)
    default:
      return false
  }
}

export function validateTypeContracts(
  components: ComponentNode[],
  contracts: Record<string, SemanticContract>,
): Issue[] {
  const issues: Issue[] = []

  for (const component of components) {
    const contract = contracts[component.semanticType]

    if (!contract) {
      issues.push({
        type: "contract-violation",
        severity: "error",
        nodeId: component.logicalKey,
        path: "semanticType",
        message: `Unknown semantic type '${component.semanticType}' — not registered in the design system catalogue`,
      })
      continue
    }

    const props = component.props ?? {}

    // Check required props are present
    for (const [propName, propDef] of Object.entries(contract.props)) {
      if (propDef.required && !(propName in props)) {
        issues.push({
          type: "contract-violation",
          severity: "error",
          nodeId: component.logicalKey,
          path: `props.${propName}`,
          message: `Required property '${propName}' is missing for semantic type '${component.semanticType}'`,
        })
      }
    }

    // Check prop value types
    for (const [propName, propValue] of Object.entries(props)) {
      const propDef = contract.props[propName]
      if (!propDef) continue // extra props are allowed

      // Bindings are always valid (runtime resolves them)
      if (isBinding(propValue)) continue

      if (!matchesPropType(propValue, propDef.type)) {
        issues.push({
          type: "contract-violation",
          severity: "error",
          nodeId: component.logicalKey,
          path: `props.${propName}`,
          message: `Property '${propName}' expects type '${propDef.type}' but got '${typeof propValue}'`,
        })
      }
    }
  }

  return issues
}
