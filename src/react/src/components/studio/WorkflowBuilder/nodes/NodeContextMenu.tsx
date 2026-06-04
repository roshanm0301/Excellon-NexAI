import { useEffect, useRef } from 'react'
import { Copy, Trash2 } from 'lucide-react'

interface NodeContextMenuProps {
  x: number
  y: number
  nodeId: string
  onDuplicate: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

export function NodeContextMenu({
  x,
  y,
  nodeId,
  onDuplicate,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 14px',
    fontSize: '0.8125rem',
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    background: 'none',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    borderRadius: 0,
    transition: 'background 0.1s',
  }

  const destructiveItemStyle: React.CSSProperties = {
    ...itemStyle,
    color: 'var(--error-600, #dc2626)',
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 1000,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
        minWidth: 160,
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onContextMenu={e => e.preventDefault()}
    >
      <button
        style={itemStyle}
        onClick={() => { onDuplicate(nodeId); onClose() }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2, #f9fafb)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        <Copy size={14} />
        <span>Duplicate</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
          Ctrl+D
        </span>
      </button>

      <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />

      <button
        style={destructiveItemStyle}
        onClick={() => { onDelete(nodeId); onClose() }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--error-50, #fef2f2)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
      >
        <Trash2 size={14} />
        <span>Delete</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
          Del
        </span>
      </button>
    </div>
  )
}
