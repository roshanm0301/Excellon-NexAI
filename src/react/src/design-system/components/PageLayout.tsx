import type { ReactNode } from 'react'

export interface PageLayoutProps {
  title: string
  breadcrumb?: ReactNode
  headerActions?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, breadcrumb, headerActions, children }: PageLayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div
        className="ex-page-header"
        style={{
          position: 'sticky',
          top: 0,
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-secondary)',
          padding: '0 40px',
          zIndex: 10,
        }}
      >
        <div className="ex-page-head-row" style={{ marginBottom: breadcrumb ? 8 : 0 }}>
          <h1 className="ex-h1">{title}</h1>
          {headerActions && (
            <div className="ex-page-actions">{headerActions}</div>
          )}
        </div>
        {breadcrumb && (
          <div
            className="ex-breadcrumbs"
            style={{ paddingBottom: 12 }}
          >
            {breadcrumb}
          </div>
        )}
      </div>
      <div
        className="ex-content"
        style={{ flex: 1, background: 'var(--bg-secondary)' }}
      >
        {children}
      </div>
    </div>
  )
}
