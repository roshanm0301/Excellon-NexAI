import type { ReactNode } from 'react'
import { Button } from './Button'
import { Spinner } from './Spinner'

export interface EditorLayoutProps {
  title: string
  statusBadge?: ReactNode
  isDirty?: boolean
  onSaveDraft?: () => void
  onPublish?: () => void
  saving?: boolean
  publishing?: boolean
  extraActions?: ReactNode
  children: ReactNode
}

export function EditorLayout({
  title,
  statusBadge,
  isDirty,
  onSaveDraft,
  onPublish,
  saving,
  publishing,
  extraActions,
  children,
}: EditorLayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sticky top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-secondary)',
          padding: '0 24px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--fg-primary)',
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </h2>

        {statusBadge && <div>{statusBadge}</div>}

        {extraActions && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{extraActions}</div>}

        {isDirty && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              background: 'var(--warning-50, #fffaeb)',
              border: '1px solid var(--warning-200, #fed7aa)',
              borderRadius: '9999px',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--warning-700, #b45309)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--warning-500, #f59e0b)',
                flexShrink: 0,
              }}
            />
            Unsaved changes
          </div>
        )}

        {onSaveDraft && (
          <Button
            variant="secondary"
            disabled={!isDirty || saving}
            onClick={onSaveDraft}
            icon={saving ? <Spinner size={16} /> : undefined}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
        )}

        {onPublish && (
          <Button
            variant="primary"
            disabled={publishing}
            onClick={onPublish}
            icon={publishing ? <Spinner size={16} /> : undefined}
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        )}
      </div>

      {/* Content area (includes TabGroup passed as children) */}
      <div style={{ flex: 1, background: 'var(--bg-secondary)', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
