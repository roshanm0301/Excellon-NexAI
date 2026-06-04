import type { TaskTypeConfig } from './taskTypeRegistry'
import { TaskIcon } from '../nodes/TaskIcon'

interface TaskTypeCardProps {
  config: TaskTypeConfig
}

export function TaskTypeCard({ config }: TaskTypeCardProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/workflow-step',
      JSON.stringify({ type: config.type })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
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
      <div style={{ overflow: 'hidden' }}>
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
      </div>
    </div>
  )
}
