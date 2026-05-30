import type { ReactNode } from 'react'

export interface PageLayoutProps {
  title: string
  subtitle?: string
  breadcrumb?: ReactNode
  headerActions?: ReactNode
  children: ReactNode
}

export function PageLayout({ title, subtitle, breadcrumb, headerActions, children }: PageLayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* Sticky page header */}
      <div className="ex-page-sticky-header">
        {breadcrumb && (
          <div className="ex-breadcrumbs" style={{ paddingTop: 16, paddingBottom: 4 }}>
            {breadcrumb}
          </div>
        )}
        <div className="ex-page-head-row">
          <div>
            <h1 className="ex-h1">{title}</h1>
            {subtitle && <p className="ex-page-sub">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="ex-page-actions">{headerActions}</div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="ex-page-body">
        {children}
      </div>
    </div>
  )
}
