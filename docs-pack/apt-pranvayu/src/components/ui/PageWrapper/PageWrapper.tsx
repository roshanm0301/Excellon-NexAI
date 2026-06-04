import React from 'react';
import './PageWrapper.scss';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Standardized page wrapper with consistent heading, subtitle, and action area.
 * Use this as the top-level container for every page view.
 */
export function PageWrapper({
  title,
  subtitle,
  actions,
  children,
  className = '',
  fullWidth = false,
}: PageWrapperProps) {
  return (
    <div className={`saas-page ${fullWidth ? 'saas-page--full' : ''} ${className}`}>
      <div className="saas-page__header">
        <div className="saas-page__header-text">
          <h1 className="saas-page__title">{title}</h1>
          {subtitle && <p className="saas-page__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="saas-page__actions">{actions}</div>}
      </div>
      <div className="saas-page__body">{children}</div>
    </div>
  );
}

export default PageWrapper;
