// Phase 4 §7 / Phase 5 T8.1.1 — flat ResolvedNode[] → nested RenderTreeNode[]

import type { ResolvedNode } from "@/services/interfaces"
import type { RenderTreeNode, LayoutProps } from "./types"

type NodeKind = ResolvedNode["kind"]

const VISUAL_KINDS: ReadonlySet<NodeKind> = new Set([
  "page",
  "view",
  "section",
  "component",
])

const CHILD_REF_FIELDS: Record<string, string[]> = {
  page: ["views"],
  view: ["sections"],
  section: ["components"],
  component: ["children"],
}

function getChildRefs(data: Record<string, unknown>, kind: string): string[] {
  const fields = CHILD_REF_FIELDS[kind]
  if (!fields) return []

  const refs: string[] = []
  for (const field of fields) {
    const value = data[field]
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") refs.push(item)
      }
    }
  }
  return refs
}

function getLayoutRef(data: Record<string, unknown>): string | undefined {
  const ref = data.layoutRef
  return typeof ref === "string" ? ref : undefined
}

function extractLayoutProps(data: Record<string, unknown>): LayoutProps {
  return {
    layoutType: typeof data.layoutType === "string" ? data.layoutType : "stack",
    direction: typeof data.direction === "string" ? data.direction : undefined,
    gap: typeof data.gap === "string" ? data.gap : undefined,
    padding: typeof data.padding === "string" ? data.padding : undefined,
  }
}

export function buildRenderTree(nodes: ResolvedNode[]): RenderTreeNode[] {
  const byKey = new Map<string, ResolvedNode>()
  for (const node of nodes) {
    byKey.set(node.logicalKey, node)
  }

  const referenced = new Set<string>()

  function buildChildren(parentNode: ResolvedNode): RenderTreeNode[] {
    const childRefs = getChildRefs(parentNode.data, parentNode.kind)
    const children: RenderTreeNode[] = []

    for (const ref of childRefs) {
      const childNode = byKey.get(ref)
      if (!childNode || !VISUAL_KINDS.has(childNode.kind)) continue
      referenced.add(ref)

      const layoutRef = getLayoutRef(childNode.data)
      const layoutNode = layoutRef ? byKey.get(layoutRef) : undefined
      const layoutProps =
        layoutNode?.kind === "layout"
          ? extractLayoutProps(layoutNode.data)
          : undefined

      children.push({
        node: childNode,
        layoutProps,
        children: buildChildren(childNode),
      })
    }

    return children
  }

  // Find page-level roots (pages are top-level visual nodes)
  const roots: RenderTreeNode[] = []
  for (const node of nodes) {
    if (node.kind !== "page") continue

    const layoutRef = getLayoutRef(node.data)
    const layoutNode = layoutRef ? byKey.get(layoutRef) : undefined
    const layoutProps =
      layoutNode?.kind === "layout"
        ? extractLayoutProps(layoutNode.data)
        : undefined

    roots.push({
      node,
      layoutProps,
      children: buildChildren(node),
    })
  }

  return roots
}
