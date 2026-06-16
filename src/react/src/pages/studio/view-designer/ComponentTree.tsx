import { useCallback } from 'react'
import { Trash2, Copy, GripVertical } from 'lucide-react'
import { useCanvasStore } from './useCanvasStore'
import type { ComponentNode } from '../../../types/viewStudio'

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
  const { selectedKey, hoveredKey, select, hover, removeNode, duplicateNode, insertNode, canInsertChild } = useCanvasStore()

  const isSelected = selectedKey === node.component_key
  const isHovered = hoveredKey === node.component_key
  const hasChildren = (node.children ?? []).length > 0

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    select(node.component_key)
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
    const code = e.dataTransfer.types.includes('application/x-component-code')
      ? e.dataTransfer.getData('application/x-component-code')
      : ''
    e.dataTransfer.dropEffect = (!code || canInsertChild(node.component_key, code)) ? 'copy' : 'none'
  }, [node.component_key, canInsertChild])

  const classNames = [
    'ct-node',
    isSelected && 'ct-node--selected',
    isHovered && !isSelected && 'ct-node--hovered',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={classNames}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      style={{ marginLeft: depth > 0 ? '0.25rem' : 0 }}
    >
      <div
        className="ct-node__header"
        onClick={handleClick}
        data-component-key={node.component_key}
      >
        {depth > 0 && <GripVertical size={12} style={{ opacity: 0.4, cursor: 'grab' }} />}
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
    </div>
  )
}
