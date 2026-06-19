import type { ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

export interface PageLayoutProps {
  title: string
  subtitle?: string
  breadcrumb?: ReactNode
  headerActions?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, subtitle, breadcrumb, headerActions, children }: PageLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div className="ex-page-sticky-header">
        {breadcrumb && (
          <div className="ex-breadcrumbs" style={{ paddingTop: 16, paddingBottom: 4 }}>
            {breadcrumb}
          </div>
        )}
        <div className="ex-page-head-row">
          <div>
            <Typography
              variant="h5"
              className="ex-h1"
              sx={{ fontWeight: 700, color: 'var(--fg-primary)' }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                className="ex-page-sub"
                sx={{ color: 'var(--fg-secondary)' }}
              >
                {subtitle}
              </Typography>
            )}
          </div>
          {headerActions && <div className="ex-page-actions">{headerActions}</div>}
        </div>
      </div>
      <div className="ex-page-body">{children}</div>
    </Box>
  )
}
