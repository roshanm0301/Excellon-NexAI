import { useCallback, useState } from 'react'
import { Trash2, Copy, GripVertical } from 'lucide-react'
import { useCanvasStore } from './useCanvasStore'
import { TreeContextMenu } from './TreeContextMenu'
import type { ComponentNode } from '../../../types/viewStudio'

// MIME type for tree-internal reorder drags (distinct from palette → tree drags)
const TREE_NODE_MIME = 'application/x-tree-node-key'

interface ComponentTreeProps {
  tree: ComponentNode
}

export function ComponentTree({ tree }: ComponentTreeProps) {
  return (
    <div className="ct-root" data-testid="component-tree">
      <TreeNode node={tree} depth={0} />
    </div>
  )
}

interface TreeNodeProps {
  node: ComponentNode
  depth: number
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const { selectedKey, hoveredKey, select, hover, removeNode, duplicateNode, insertNode, canInsertChild, moveNode } = useCanvasStore()
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const isSelected = selectedKey === node.component_key
  const isHovered = hoveredKey === node.component_key
  const hasChildren = (node.children ?? []).length > 0

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    select(node.component_key)
  }, [node.component_key, select])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    select(node.component_key)
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [node.component_key, select])

  const handleMouseEnter = useCallback(() => {
    hover(node.component_key)
  }, [node.component_key, hover])

  const handleMouseLeave = useCallback(() => {
    hover(null)
  }, [hover])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.component_code === 'page_root') return // Can't delete root
    removeNode(node.component_key)
  }, [node.component_key, node.component_code, removeNode])

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.component_code === 'page_root') return
    duplicateNode(node.component_key)
  }, [node.component_key, node.component_code, duplicateNode])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const code = e.dataTransfer.getData('application/x-component-code')
    const name = e.dataTransfer.getData('application/x-component-name')
    if (!code) return

    if (!canInsertChild(node.component_key, code)) return

    const newKey = `${code}_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`
    insertNode(node.component_key, {
      component_key: newKey,
      component_code: code,
      label: name || code,
      props: {},
      children: [],
    })
  }, [node.component_key, insertNode, canInsertChild])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // Palette → tree: component code drag
    if (e.dataTransfer.types.includes('application/x-component-code')) {
      const code = e.dataTransfer.getData('application/x-component-code')
      e.dataTransfer.dropEffect = (!code || canInsertChild(node.component_key, code)) ? 'copy' : 'none'
      return
    }
    // Tree reorder drag
    if (e.dataTransfer.types.includes(TREE_NODE_MIME)) {
      e.dataTransfer.dropEffect = 'move'
      setIsDragOver(true)
    }
  }, [node.component_key, canInsertChild])

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  // ── Tree-reorder: drag the GripVertical of this node ─────────────────────
  const handleNodeDragStart = useCallback((e: React.DragEvent) => {
    if (node.component_code === 'page_root') { e.preventDefault(); return }
    e.stopPropagation()
    e.dataTransfer.setData(TREE_NODE_MIME, node.component_key)
    e.dataTransfer.effectAllowed = 'move'
  }, [node.component_key, node.component_code])

  const handleNodeDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    // Only handle tree-reorder drops
    const draggedKey = e.dataTransfer.getData(TREE_NODE_MIME)
    if (!draggedKey || draggedKey === node.component_key) return

    // Don't allow dropping on page_root (it has no parent to insert into as sibling)
    if (node.component_code === 'page_root') return

    // Read from the store payload to do lookups
    const state = useCanvasStore.getState()
    if (!state.payload) return

    // ── Cycle detection: prevent dragging a node onto one of its own descendants ──
    function containsKey(tree: ComponentNode, key: string): boolean {
      if (tree.component_key === key) return true
      return (tree.children ?? []).some(c => containsKey(c, key))
    }
    // Find the dragged node and check if drop target is inside it
    function findNode(tree: ComponentNode, key: string): ComponentNode | null {
      if (tree.component_key === key) return tree
      for (const child of tree.children ?? []) {
        const found = findNode(child, key)
        if (found) return found
      }
      return null
    }
    const draggedNode = findNode(state.payload.component_tree, draggedKey)
    if (draggedNode && containsKey(draggedNode, node.component_key)) {
      // Drop target is inside the dragged node — would create a cycle; silently reject
      return
    }

    function findParent(tree: ComponentNode, key: string): ComponentNode | null {
      for (const child of tree.children ?? []) {
        if (child.component_key === key) return tree
        const found = findParent(child, key)
        if (found) return found
      }
      return null
    }

    const parent = findParent(state.payload.component_tree, node.component_key)
    if (!parent) return

    // Validate that the dragged node can be a sibling (same parent) — check parent allows it
    if (draggedNode && !canInsertChild(parent.component_key, draggedNode.component_code)) {
      return
    }

    const targetIdx = (parent.children ?? []).findIndex(c => c.component_key === node.component_key)
    if (targetIdx < 0) return

    // Move dragged node to be a sibling just before the drop target
    moveNode(draggedKey, parent.component_key, targetIdx)
  }, [node.component_key, node.component_code, moveNode, canInsertChild])

  const classNames = [
    'ct-node',
    isSelected && 'ct-node--selected',
    isHovered && !isSelected && 'ct-node--hovered',
    isDragOver && 'ct-node--drag-over',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classNames}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDrop={(e) => {
        // Route to tree-reorder or palette-insert depending on MIME type
        if (e.dataTransfer.types.includes(TREE_NODE_MIME)) {
          handleNodeDrop(e)
        } else {
          handleDrop(e)
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      style={{ marginLeft: depth > 0 ? '0.25rem' : 0 }}
    >
      <div
        className="ct-node__header"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        data-component-key={node.component_key}
      >
        {depth > 0 && (
          <GripVertical
            size={12}
            style={{ opacity: 0.4, cursor: 'grab', flexShrink: 0 }}
            draggable
            onDragStart={handleNodeDragStart}
            // Prevent the click from propagating to the node header select
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <span>{node.label || node.component_code}</span>
        <span className="ct-node__code">{node.component_code}</span>

        {isSelected && node.component_code !== 'page_root' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={handleDuplicate}
              title="Duplicate"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
            >
              <Copy size={12} />
            </button>
            <button
              onClick={handleDelete}
              title="Delete"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-danger, #ef4444)' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {hasChildren && (
        <div className="ct-node__children">
          {(node.children ?? []).map(child => (
            <TreeNode key={child.component_key} node={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {contextMenu && (
        <TreeContextMenu
          nodeKey={node.component_key}
          nodeCode={node.component_code}
          anchorX={contextMenu.x}
          anchorY={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}
