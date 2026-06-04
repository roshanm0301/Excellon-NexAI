import { useState } from 'react'
import { Search, ChevronRight, ChevronDown, Database, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { listArtifacts } from '../../../../config/studioApi'
import type { Artifact } from '../../../../config/studioApi'

interface EntityOperation {
  label: string
  taskType: string
  preset: { entityType: string; operation: string }
}

function getEntityOperations(artifact: Artifact): EntityOperation[] {
  const name = artifact.artifact_name
  const ops: EntityOperation[] = [
    { label: 'Get by ID', taskType: 'Document', preset: { entityType: name, operation: 'FindOne' } },
    { label: 'Create', taskType: 'Document', preset: { entityType: name, operation: 'Create' } },
    { label: 'Update', taskType: 'Document', preset: { entityType: name, operation: 'Update' } },
    { label: 'Delete', taskType: 'Document', preset: { entityType: name, operation: 'Delete' } },
    { label: 'List (Paging)', taskType: 'Query', preset: { entityType: name, operation: 'FindPaging' } },
    { label: 'Count', taskType: 'Query', preset: { entityType: name, operation: 'Count' } },
  ]

  // Add transitions from compiled payload if available
  const payload = artifact.payload as Record<string, unknown>
  const compiled = payload?.compiled as Record<string, unknown> | undefined
  const statuses = compiled?.statuses as Array<{ status: string; transitions?: Array<{ command?: string; label?: string; to?: string }> }> | undefined

  if (statuses) {
    for (const status of statuses) {
      for (const transition of status.transitions ?? []) {
        const label = transition.label ?? transition.command ?? transition.to
        if (label) {
          ops.push({
            label: `→ ${label}`,
            taskType: 'Document',
            preset: { entityType: name, operation: transition.command ?? String(label) },
          })
        }
      }
    }
  }

  return ops
}

interface EntityGroupProps {
  artifact: Artifact
}

function EntityGroup({ artifact }: EntityGroupProps) {
  const [open, setOpen] = useState(false)
  const ops = getEntityOperations(artifact)

  const onDragStart = (e: React.DragEvent, op: EntityOperation) => {
    e.dataTransfer.setData(
      'application/workflow-step',
      JSON.stringify({ type: op.taskType, preset: op.preset })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 6,
          color: 'var(--color-text-primary)',
          fontSize: '0.8rem',
          fontWeight: 600,
          transition: 'background 0.1s',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
        aria-expanded={open}
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        <Database size={13} color="var(--brand-500)" />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {artifact.artifact_name}
        </span>
        <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>
          {ops.length}
        </span>
      </button>

      {open && (
        <div style={{ paddingLeft: 22 }}>
          {ops.map(op => (
            <div
              key={op.label}
              draggable
              onDragStart={e => onDragStart(e, op)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                borderRadius: 5,
                cursor: 'grab',
                fontSize: '0.75rem',
                color: 'var(--color-text-secondary)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'none')}
              title={`Drag to canvas: ${op.label} ${artifact.artifact_name}`}
            >
              <span style={{ width: 12, fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>·</span>
              {op.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function EntitySidebar() {
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['artifacts', 'entity_schema', 'active'],
    queryFn: () => listArtifacts({ entity_type: 'entity_schema', status: 'active' }),
  })

  const entities = (data?.items ?? []).filter(a =>
    a.artifact_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      style={{
        width: 220,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 10px 8px',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6 }}>
          Entities
        </div>
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
          <Search size={11} color="var(--color-text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entities..."
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '0.75rem',
              color: 'var(--color-text-primary)',
              flex: 1,
            }}
            aria-label="Search entities"
          />
        </div>
      </div>

      {/* Entity list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 4px' }}>
        {isLoading ? (
          <div style={{ padding: 12, color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
            Loading entities…
          </div>
        ) : entities.length === 0 ? (
          <div style={{ padding: 12, color: 'var(--color-text-muted)', fontSize: '0.75rem', textAlign: 'center' }}>
            {search ? `No entities match "${search}"` : 'No published entities'}
          </div>
        ) : (
          entities.map(a => <EntityGroup key={a.artifact_id} artifact={a} />)
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--color-border)', flexShrink: 0 }}>
        <a
          href="/admin/entities/new"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.75rem',
            color: 'var(--brand-500)',
            textDecoration: 'none',
          }}
        >
          <Plus size={11} /> Create new entity
        </a>
      </div>
    </div>
  )
}
