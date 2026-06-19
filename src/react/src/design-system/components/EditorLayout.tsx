import type { ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
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
  title, statusBadge, isDirty, onSaveDraft, onPublish, saving, publishing, extraActions, children,
}: EditorLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="ex-editor-bar">
        <Typography
          variant="subtitle1"
          className="ex-editor-bar-title"
          sx={{ fontWeight: 600, color: 'var(--fg-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {title}
        </Typography>

        {statusBadge && <div>{statusBadge}</div>}
        {extraActions && <div className="ex-editor-bar-actions">{extraActions}</div>}

        {isDirty && (
          <span className="ex-unsaved-pill">
            <span className="dot" />
            Unsaved changes
          </span>
        )}

        {onSaveDraft && (
          <Button variant="secondary" size="sm" disabled={!isDirty || saving} onClick={onSaveDraft}>
            {saving ? 'Saving…' : 'Save Draft'}
          </Button>
        )}

        {onPublish && (
          <Button variant="primary" size="sm" disabled={publishing} onClick={onPublish}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        )}
      </div>

      <Box sx={{ flex: 1, bgcolor: 'var(--bg-secondary)', minHeight: 0 }}>
        {children}
      </Box>
    </Box>
  )
}
