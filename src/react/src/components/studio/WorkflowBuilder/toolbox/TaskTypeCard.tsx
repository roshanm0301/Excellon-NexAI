import { useState } from 'react'
import { Info } from 'lucide-react'
import type { TaskTypeConfig } from './taskTypeRegistry'
import { TaskIcon } from '../nodes/TaskIcon'

interface TaskTypeCardProps {
  config: TaskTypeConfig
}

export function TaskTypeCard({ config }: TaskTypeCardProps) {
  const [helpOpen, setHelpOpen] = useState(false)

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/workflow-step',
      JSON.stringify({ type: config.type })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div>
      <div
        draggable
        onDragStart={onDragStart}
        title={config.description}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          borderRadius: 6,
          cursor: 'grab',
          userSelect: 'none',
          background: 'transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = config.bgColor)}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            border: `1px solid ${config.color}22`,
          }}
        >
          <TaskIcon iconName={config.iconName} color={config.color} size={13} />
        </div>
        <div style={{ overflow: 'hidden', flex: 1, display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {config.label}
          </div>
          {config.tier === 'advanced' && (
            <span
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                padding: '0 4px',
                fontSize: '0.5625rem',
                color: 'var(--color-text-muted)',
                fontWeight: 500,
                flexShrink: 0,
                lineHeight: '1.4',
              }}
            >
              Advanced
            </span>
          )}
        </div>
        <button
          onClick={e => {
            e.stopPropagation()
            setHelpOpen(prev => !prev)
          }}
          title="When to use this task"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 2,
            color: helpOpen ? 'var(--brand-500, #3b82f6)' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            borderRadius: 3,
            flexShrink: 0,
          }}
          aria-label={`Help for ${config.label}`}
          aria-expanded={helpOpen}
        >
          <Info size={12} />
        </button>
      </div>

      {helpOpen && (
        <div
          style={{
            margin: '0 8px 4px 8px',
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'var(--brand-50, #eff6ff)',
              padding: '6px 8px',
              fontSize: '0.6875rem',
              color: 'var(--brand-700, #1e3a8a)',
              lineHeight: 1.5,
            }}
          >
            {config.whenToUse}
          </div>
          <div
            style={{
              padding: '4px 8px 6px',
              fontSize: '0.625rem',
              color: 'var(--color-text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.5,
              background: 'var(--color-surface-2, #f9fafb)',
            }}
          >
            {config.example}
          </div>
        </div>
      )}
    </div>
  )
}
