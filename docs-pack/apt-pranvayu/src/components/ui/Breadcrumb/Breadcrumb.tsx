// ============================================================================
// BREADCRUMB NAVIGATION
// Shows current page context in deep page hierarchies
// ============================================================================

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import './Breadcrumb.scss';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  schema: 'Schema',
  application: 'Application',
  role: 'Roles',
  'user-management': 'User Management',
  approval: 'Approvals',
  provider: 'Providers',
  request: 'Requests',
  template: 'Templates',
  'workflow-studio': 'Workflow Studio',
  'gold-schema': 'Gold Schema',
  'silver-schema': 'Silver Schema',
  subscription: 'Subscription',
  profile: 'Profile',
  'change-password': 'Change Password',
  'manage-error-log': 'Error Logs',
  'manage-message-log': 'Message Logs',
};

function formatSegment(segment: string): string {
  return routeLabels[segment] || segment
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const location = useLocation();

  const breadcrumbs: BreadcrumbItem[] = items || (() => {
    const segments = location.pathname.split('/').filter(Boolean);
    return segments.map((seg, idx) => ({
      label: formatSegment(seg),
      path: idx < segments.length - 1 ? '/' + segments.slice(0, idx + 1).join('/') : undefined,
    }));
  })();

  if (breadcrumbs.length <= 0) return null;

  return (
    <nav className={`saas-breadcrumb ${className}`} aria-label="Breadcrumb">
      <ol className="saas-breadcrumb__list">
        <li className="saas-breadcrumb__item">
          <Link to="/dashboard" className="saas-breadcrumb__link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>
        </li>
        {breadcrumbs.map((crumb, idx) => (
          <li key={idx} className="saas-breadcrumb__item">
            <svg className="saas-breadcrumb__separator" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            {crumb.path ? (
              <Link to={crumb.path} className="saas-breadcrumb__link">{crumb.label}</Link>
            ) : (
              <span className="saas-breadcrumb__current">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
