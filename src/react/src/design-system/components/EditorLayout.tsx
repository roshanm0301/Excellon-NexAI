import type { ReactNode } from 'react'
import { Button } from './Button'

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
      {/* Sticky editor bar */}
      <div className="ex-editor-bar">
        <h2 className="ex-editor-bar-title">{title}</h2>

        {statusBadge && <div>{statusBadge}</div>}

        {extraActions && (
          <div className="ex-editor-bar-actions">{extraActions}</div>
        )}

        {isDirty && (
          <span className="ex-unsaved-pill">
            <span className="dot" />
            Unsaved changes
          </span>
        )}

        {onSaveDraft && (
          <Button
            variant="secondary"
            size="sm"
            disabled={!isDirty || saving}
            onClick={onSaveDraft}
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
        )}

        {onPublish && (
          <Button
            variant="primary"
            size="sm"
            disabled={publishing}
            onClick={onPublish}
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        )}
      </div>

      {/* Content area */}
      <div style={{ flex: 1, background: 'var(--bg-secondary)', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}
