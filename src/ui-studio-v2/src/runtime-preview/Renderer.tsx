// Phase 4 §7 / Phase 5 T8.1.1 — interpreted Canvas renderer
// Maps ResolvedModel → runtime components (MUI Pro)
// BOUNDARY: this file must NOT import from @/shared/ui — see eslint.config.js [Phase 4 §7.1]

import { memo } from "react"
import Box from "@mui/material/Box"
import Typography from "@mui/material/Typography"
import type { ResolvedModel } from "@/services/interfaces"
import { buildRenderTree } from "./buildRenderTree"
import { getComponentForType } from "./componentMap"
import type { RenderTreeNode, LayoutProps } from "./types"
import { useNodeRef } from "./useNodeRegistryHooks"

// Phase 4 §7.2 — layout CSS from LayoutNode data [L34: flow layout only]
function layoutSx(lp: LayoutProps | undefined): Record<string, unknown> {
  if (!lp) return {}

  switch (lp.layoutType) {
    case "stack":
      return {
        display: "flex",
        flexDirection: lp.direction === "row" ? "row" : "column",
        gap: lp.gap ?? "8px",
        padding: lp.padding,
      }
    case "flex":
      return {
        display: "flex",
        flexDirection: lp.direction === "row" ? "row" : "column",
        gap: lp.gap ?? "8px",
        flexWrap: "wrap",
        padding: lp.padding,
      }
    case "grid":
      return {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: lp.gap ?? "8px",
        padding: lp.padding,
      }
    case "form-grid":
      return {
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: lp.gap ?? "12px",
        padding: lp.padding,
      }
    case "split":
      return {
        display: "flex",
        flexDirection: lp.direction === "row" ? "row" : "column",
        gap: lp.gap ?? "16px",
        padding: lp.padding,
      }
    case "responsive-grid":
      return {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
        gap: lp.gap ?? "16px",
        padding: lp.padding,
      }
    default:
      return {
        display: "flex",
        flexDirection: "column",
        gap: lp.gap ?? "8px",
        padding: lp.padding,
      }
  }
}

interface TreeNodeRendererProps {
  treeNode: RenderTreeNode
}

const TreeNodeRenderer = memo(function TreeNodeRenderer({
  treeNode,
}: TreeNodeRendererProps) {
  const { node, layoutProps, children } = treeNode
  const nodeRef = useNodeRef(node.logicalKey, node.cascadeLevel, node.originState)

  const semanticType = (node.data as Record<string, unknown>).semanticType as
    | string
    | undefined

  if (node.kind === "component" && semanticType) {
    const Component = getComponentForType(semanticType)
    return (
      <Box
        ref={nodeRef}
        data-node-key={node.logicalKey}
        sx={layoutSx(layoutProps)}
      >
        <Component node={node}>
          {children.map((child) => (
            <TreeNodeRenderer key={child.node.logicalKey} treeNode={child} />
          ))}
        </Component>
      </Box>
    )
  }

  const sectionLabel =
    node.kind === "section"
      ? ((node.data as Record<string, unknown>).label as string | undefined)
      : undefined

  return (
    <Box
      ref={nodeRef}
      data-node-key={node.logicalKey}
      sx={{ mb: node.kind === "section" ? 2 : undefined, ...layoutSx(layoutProps) }}
    >
      {sectionLabel ? (
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          {sectionLabel}
        </Typography>
      ) : null}
      {children.map((child) => (
        <TreeNodeRenderer key={child.node.logicalKey} treeNode={child} />
      ))}
    </Box>
  )
})

interface RendererProps {
  model: ResolvedModel
}

export const Renderer = memo(function Renderer({ model }: RendererProps) {
  const tree = buildRenderTree(model.nodes)

  if (tree.length === 0) {
    return null
  }

  return (
    <Box sx={{ p: 2 }}>
      {tree.map((root) => (
        <TreeNodeRenderer key={root.node.logicalKey} treeNode={root} />
      ))}
    </Box>
  )
})
