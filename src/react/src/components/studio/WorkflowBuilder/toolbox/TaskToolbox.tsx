import { useState } from 'react'
import { X, Search } from 'lucide-react'
import { TASK_TYPE_REGISTRY, TASK_CATEGORIES, type TaskCategory } from './taskTypeRegistry'
import { TaskTypeCard } from './TaskTypeCard'

interface TaskToolboxProps {
  onClose: () => void
}

export function TaskToolbox({ onClose }: TaskToolboxProps) {
  const [query, setQuery] = useState('')
  const [openCategory, setOpenCategory] = useState<TaskCategory | null>('Control Flow')

  const lowerQuery = query.toLowerCase()

  const filtered = query
    ? TASK_TYPE_REGISTRY.filter(
        t =>
          t.label.toLowerCase().includes(lowerQuery) ||
          t.description.toLowerCase().includes(lowerQuery) ||
          t.category.toLowerCase().includes(lowerQuery)
      )
    : null

  return (
    <div
      style={{
        width: 240,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        maxHeight: '70vh',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 8px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
          Task Library
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: 'var(--color-text-muted)',
            display: 'flex',
            borderRadius: 4,
          }}
          aria-label="Close toolbox"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '8px 10px', flexShrink: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--color-surface-2)',
            borderRadius: 6,
            padding: '5px 8px',
            border: '1px solid var(--color-border)',
          }}
        >
          <Search size={12} color="var(--color-text-muted)" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.75rem',
              color: 'var(--color-text-primary)',
              flex: 1,
            }}
            aria-label="Search task types"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              aria-label="Clear search"
            >
              <X size={10} color="var(--color-text-muted)" />
            </button>
          )}
        </div>
      </div>

      {/* Task list */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px 8px' }}>
        {filtered ? (
          /* Search results — flat list */
          filtered.length === 0 ? (
            <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              No tasks match "{query}"
            </div>
          ) : (
            filtered.map(config => <TaskTypeCard key={config.type} config={config} />)
          )
        ) : (
          /* Grouped by category */
          TASK_CATEGORIES.map(category => {
            const items = TASK_TYPE_REGISTRY.filter(t => t.category === category)
            if (items.length === 0) return null
            const isOpen = openCategory === category

            return (
              <div key={category} style={{ marginBottom: 2 }}>
                <button
                  onClick={() => setOpenCategory(isOpen ? null : category)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    color: 'var(--color-text-muted)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderRadius: 6,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
                  aria-expanded={isOpen}
                >
                  {category}
                  <span style={{ fontSize: '0.625rem', fontWeight: 400, opacity: 0.7 }}>
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isOpen && (
                  <div style={{ paddingLeft: 4 }}>
                    {items.map(config => <TaskTypeCard key={config.type} config={config} />)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer hint */}
      <div
        style={{
          padding: '6px 10px',
          borderTop: '1px solid var(--color-border)',
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        Drag a task onto the canvas
      </div>
    </div>
  )
}
