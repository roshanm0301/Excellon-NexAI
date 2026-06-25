import type { CascadeLevel, NodeBase, MetaNode, Issue } from "../domain/types"
import { deriveOrigin, resolveCascade } from "../domain/cascade"
import { validateBrokenBindings, validateOrphans, validateTypeContracts } from "../domain/validation"
import { SEMANTIC_CONTRACTS } from "../domain/types"
import type { ResolvedNode, TreeNode } from "../services/interfaces"
import { allRegistryKeys } from "./reference/registry"
import { SCOPE_MAP } from "./reference/studio-seed"

const LEVEL_ORDER: CascadeLevel[] = ["platform", "vertical", "tenant", "org"]

export function buildTreeNodes(
  nodes: NodeBase[],
  editingLevel: CascadeLevel,
): TreeNode[] {
  const allNodesMap = new Map<string, NodeBase>()
  for (const node of nodes) {
    allNodesMap.set(node.logicalKey, node)
  }

  const treeNodes: TreeNode[] = []
  for (const node of nodes) {
    if (!("kind" in node)) continue
    const metaNode = node as MetaNode
    const origin = deriveOrigin(node, editingLevel, allNodesMap)

    treeNodes.push({
      id: node.id,
      logicalKey: node.logicalKey,
      kind: metaNode.kind,
      label: "name" in metaNode ? (metaNode as Record<string, unknown>).name as string : node.logicalKey,
      cascadeLevel: node.cascadeLevel,
      originState: origin,
      parentKey: null,
      children: [],
    })
  }

  return buildHierarchy(treeNodes)
}

function buildHierarchy(flat: TreeNode[]): TreeNode[] {
  const byKey = new Map<string, TreeNode>()
  for (const node of flat) {
    byKey.set(node.logicalKey, node)
  }

  const roots: TreeNode[] = []
  for (const node of flat) {
    const parts = node.logicalKey.split(".")
    if (parts.length <= 1) {
      roots.push(node)
      continue
    }

    let placed = false
    for (let index = parts.length - 1; index > 0; index -= 1) {
      const parentKey = parts.slice(0, index).join(".")
      const parent = byKey.get(parentKey)
      if (parent) {
        node.parentKey = parentKey
        parent.children.push(node)
        placed = true
        break
      }
    }

    if (!placed) {
      roots.push(node)
    }
  }

  return roots
}

export function buildResolvedModel(
  resolved: NodeBase[],
  pageId: string,
  scopeId: string,
  editingLevel: CascadeLevel,
): { pageId: string; scopeId: string; nodes: ResolvedNode[] } {
  const allMap = new Map<string, NodeBase>()
  for (const node of resolved) {
    allMap.set(node.logicalKey, node)
  }

  const allNodes: ResolvedNode[] = resolved
    .filter((node): node is MetaNode => "kind" in node)
    .map((node) => ({
      logicalKey: node.logicalKey,
      kind: node.kind,
      cascadeLevel: node.cascadeLevel,
      originState: deriveOrigin(node, editingLevel, allMap),
      data: { ...node } as Record<string, unknown>,
    }))

  let nodes = allNodes
  if (pageId) {
    const nodesByKey = new Map(allNodes.map((node) => [node.logicalKey, node]))
    const included = collectPageDescendants(pageId, nodesByKey)
    nodes = allNodes.filter((node) => included.has(node.logicalKey))
  }

  return {
    pageId,
    scopeId,
    nodes,
  }
}

function collectPageDescendants(
  pageKey: string,
  nodesByKey: Map<string, ResolvedNode>,
): Set<string> {
  const included = new Set<string>()
  const refFields = ["views", "sections", "components", "children"]

  function visit(key: string): void {
    if (included.has(key)) return
    const node = nodesByKey.get(key)
    if (!node) return

    included.add(key)
    const data = node.data as Record<string, unknown>

    for (const field of refFields) {
      const value = data[field]
      if (!Array.isArray(value)) continue
      for (const ref of value) {
        if (typeof ref === "string") {
          visit(ref)
        }
      }
    }

    const layoutRef = data.layoutRef
    if (typeof layoutRef === "string") {
      visit(layoutRef)
    }
  }

  visit(pageKey)
  return included
}

export function runValidationForNodes(
  layeredNodes: Map<CascadeLevel, NodeBase[]>,
): Issue[] {
  const { resolved, orphans } = resolveCascade(layeredNodes)
  const metaNodes = resolved.filter((node): node is MetaNode => "kind" in node)
  const components = metaNodes.filter((node) => node.kind === "component")
  const brokenBindings = validateBrokenBindings(metaNodes, allRegistryKeys)
  const orphanIssues = validateOrphans(resolved)
  const contractIssues = validateTypeContracts(components, SEMANTIC_CONTRACTS)

  return [...orphans, ...brokenBindings, ...orphanIssues, ...contractIssues]
}

export function buildLayeredNodes(nodes: NodeBase[], scopeId: string): Map<CascadeLevel, NodeBase[]> {
  const result = new Map<CascadeLevel, NodeBase[]>()
  const entry = SCOPE_MAP[scopeId]
  if (!entry) {
    return result
  }

  const relevantScopes = [...entry.parentScopes, scopeId]
  const allowedLevels = new Set<CascadeLevel>()
  for (const scope of relevantScopes) {
    const scopeEntry = SCOPE_MAP[scope]
    if (scopeEntry) {
      allowedLevels.add(scopeEntry.level)
    }
  }

  for (const level of LEVEL_ORDER) {
    const scopedNodes = nodes.filter((node) => node.cascadeLevel === level && allowedLevels.has(level))
    if (scopedNodes.length > 0) {
      result.set(level, scopedNodes)
    }
  }

  return result
}

export function diffSnapshots(
  first: NodeBase[],
  second: NodeBase[],
): Array<{
  logicalKey: string
  kind: string
  changeType: "added" | "removed" | "modified"
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
}> {
  const firstMap = new Map(first.map((node) => [node.logicalKey, node]))
  const secondMap = new Map(second.map((node) => [node.logicalKey, node]))
  const keys = new Set<string>([...firstMap.keys(), ...secondMap.keys()])
  const entries: Array<{
    logicalKey: string
    kind: string
    changeType: "added" | "removed" | "modified"
    before: Record<string, unknown> | null
    after: Record<string, unknown> | null
  }> = []

  for (const key of keys) {
    const beforeNode = firstMap.get(key)
    const afterNode = secondMap.get(key)

    if (!beforeNode && afterNode) {
      entries.push({
        logicalKey: key,
        kind: "kind" in afterNode ? afterNode.kind : "override",
        changeType: "added",
        before: null,
        after: afterNode as Record<string, unknown>,
      })
      continue
    }

    if (beforeNode && !afterNode) {
      entries.push({
        logicalKey: key,
        kind: "kind" in beforeNode ? beforeNode.kind : "override",
        changeType: "removed",
        before: beforeNode as Record<string, unknown>,
        after: null,
      })
      continue
    }

    if (beforeNode && afterNode && JSON.stringify(beforeNode) !== JSON.stringify(afterNode)) {
      entries.push({
        logicalKey: key,
        kind: "kind" in afterNode ? afterNode.kind : "override",
        changeType: "modified",
        before: beforeNode as Record<string, unknown>,
        after: afterNode as Record<string, unknown>,
      })
    }
  }

  return entries.sort((left, right) => left.logicalKey.localeCompare(right.logicalKey))
}
