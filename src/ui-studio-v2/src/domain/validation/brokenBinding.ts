// Phase 5 T2.3.1 — detect unresolved bindings [L6][L22]

import type { Issue } from "@/domain/types/validation"
import type { MetaNode, ComponentNode } from "@/domain/types/nodes"
import type { Binding, PropValue } from "@/domain/types/base"
import { isBinding } from "@/domain/types/nodes"

function checkBinding(
  binding: Binding,
  registryKeys: ReadonlySet<string>,
  nodeId: string,
  path: string,
  issues: Issue[],
): void {
  if (!registryKeys.has(binding.bind.ref)) {
    issues.push({
      type: "broken-binding",
      severity: "error",
      nodeId,
      path,
      message: `Binding ref='${binding.bind.ref}' (kind: ${binding.bind.kind}) not found in registry`,
    })
  }
}

function checkPropBindings(
  props: Record<string, PropValue>,
  registryKeys: ReadonlySet<string>,
  nodeId: string,
  issues: Issue[],
): void {
  for (const [propName, value] of Object.entries(props)) {
    if (isBinding(value)) {
      checkBinding(value, registryKeys, nodeId, `props.${propName}`, issues)
    }
  }
}

function checkComponentBindings(
  node: ComponentNode,
  registryKeys: ReadonlySet<string>,
  issues: Issue[],
): void {
  if (node.dataBindingRef) {
    checkBinding(node.dataBindingRef, registryKeys, node.logicalKey, "dataBindingRef", issues)
  }

  if (node.stateBindings) {
    for (let i = 0; i < node.stateBindings.length; i++) {
      checkBinding(
        node.stateBindings[i],
        registryKeys,
        node.logicalKey,
        `stateBindings[${i}]`,
        issues,
      )
    }
  }

  if (node.props) {
    checkPropBindings(node.props, registryKeys, node.logicalKey, issues)
  }
}

export function validateBrokenBindings(
  nodes: MetaNode[],
  registryKeys: ReadonlySet<string>,
): Issue[] {
  const issues: Issue[] = []

  for (const node of nodes) {
    switch (node.kind) {
      case "component":
        checkComponentBindings(node, registryKeys, issues)
        break
      case "page":
        if (node.primaryDataSourceRef && !registryKeys.has(node.primaryDataSourceRef)) {
          issues.push({
            type: "broken-binding",
            severity: "error",
            nodeId: node.logicalKey,
            path: "primaryDataSourceRef",
            message: `Binding ref='${node.primaryDataSourceRef}' not found in registry`,
          })
        }
        break
      case "view":
        if (node.dataSourceRef && !registryKeys.has(node.dataSourceRef)) {
          issues.push({
            type: "broken-binding",
            severity: "error",
            nodeId: node.logicalKey,
            path: "dataSourceRef",
            message: `Binding ref='${node.dataSourceRef}' not found in registry`,
          })
        }
        break
      case "workflowBinding":
        if (!registryKeys.has(node.workflowRef)) {
          issues.push({
            type: "broken-binding",
            severity: "error",
            nodeId: node.logicalKey,
            path: "workflowRef",
            message: `Binding ref='${node.workflowRef}' not found in registry`,
          })
        }
        break
    }
  }

  return issues
}
