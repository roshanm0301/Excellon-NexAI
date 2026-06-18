import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Trash2, ArrowUp, ArrowDown, SquareStack } from 'lucide-react'
import { useCanvasStore } from './useCanvasStore'

interface TreeContextMenuProps {
  nodeKey: string
  nodeCode: string
  anchorX: number
  anchorY: number
  onClose: () => void
}

export function TreeContextMenu({ nodeKey, nodeCode, anchorX, anchorY, onClose }: TreeContextMenuProps) {
  const { duplicateNode, removeNode, moveNodeUp, moveNodeDown, wrapInSection, payload } = useCanvasStore()
  const menuRef = useRef<HTMLDivElement>(null)

  const isRoot = nodeCode === 'page_root'
  const isSection = nodeCode === 'section'

  // Determine if node is first/last among siblings (for Move Up/Down disabled state)
  const { isFirst, isLast } = (() => {
    if (!payload) return { isFirst: true, isLast: true }
    function findParent(tree: typeof payload.component_tree, key: string): typeof payload.component_tree | null {
      for (const child of tree.children ?? []) {
        if (child.component_key === key) return tree
        const found = findParent(child, key)
        if (found) return found
      }
      return null
    }
    const parent = findParent(payload.component_tree, nodeKey)
    if (!parent) return { isFirst: true, isLast: true }
    const siblings = parent.children ?? []
    const idx = siblings.findIndex(c => c.component_key === nodeKey)
    return { isFirst: idx <= 0, isLast: idx >= siblings.length - 1 }
  })()

  // Adjust position to stay inside viewport
  const vw = window.innerWidth
  const vh = window.innerHeight
  const menuW = 180
  const menuH = 200
  const left = anchorX + menuW > vw ? vw - menuW - 8 : anchorX
  const top  = anchorY + menuH > vh ? vh - menuH - 8 : anchorY

  // Close on Escape or click outside
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClick)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  function action(fn: () => void) {
    return () => { fn(); onClose() }
  }

  return createPortal(
    <div
      ref={menuRef}
      className="tree-ctx-menu"
      style={{ top, left }}
      data-testid="tree-context-menu"
      role="menu"
    >
      <div
        className={`tree-ctx-item${isRoot ? ' tree-ctx-item--disabled' : ''}`}
        role="menuitem"
        onClick={isRoot ? undefined : action(() => duplicateNode(nodeKey))}
        aria-disabled={isRoot}
      >
        <Copy size={13} /> Duplicate
      </div>
      <div
        className={`tree-ctx-item tree-ctx-item--danger${isRoot ? ' tree-ctx-item--disabled' : ''}`}
        role="menuitem"
        onClick={isRoot ? undefined : action(() => removeNode(nodeKey))}
        aria-disabled={isRoot}
      >
        <Trash2 size={13} /> Delete
      </div>

      <div className="tree-ctx-divider" />

      <div
        className={`tree-ctx-item${isFirst || isRoot ? ' tree-ctx-item--disabled' : ''}`}
        role="menuitem"
        onClick={isFirst || isRoot ? undefined : action(() => moveNodeUp(nodeKey))}
        aria-disabled={isFirst || isRoot}
      >
        <ArrowUp size={13} /> Move Up
      </div>
      <div
        className={`tree-ctx-item${isLast || isRoot ? ' tree-ctx-item--disabled' : ''}`}
        role="menuitem"
        onClick={isLast || isRoot ? undefined : action(() => moveNodeDown(nodeKey))}
        aria-disabled={isLast || isRoot}
      >
        <ArrowDown size={13} /> Move Down
      </div>

      <div className="tree-ctx-divider" />

      <div
        className={`tree-ctx-item${isRoot || isSection ? ' tree-ctx-item--disabled' : ''}`}
        role="menuitem"
        onClick={isRoot || isSection ? undefined : action(() => wrapInSection(nodeKey))}
        aria-disabled={isRoot || isSection}
      >
        <SquareStack size={13} /> Wrap in Section
      </div>
    </div>,
    document.body,
  )
}
