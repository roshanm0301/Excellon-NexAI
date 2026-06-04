// ============================================================================
// LOADING SKELETON COMPONENTS
// Content placeholder while loading (no spinners)
// ============================================================================

import React from 'react';
import './Skeleton.scss';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width, height = 14, borderRadius, className = '', style }: SkeletonProps) {
  return (
    <div
      className={`saas-skeleton ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius,
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`saas-skeleton-text ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? '60%' : '100%'}
          style={{ marginBottom: 8 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`saas-skeleton-card ${className}`}>
      <div className="saas-skeleton-card__header">
        <Skeleton width={40} height={40} borderRadius="50%" />
        <div style={{ flex: 1 }}>
          <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="30%" height={12} />
        </div>
      </div>
      <div className="saas-skeleton-card__body">
        <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={12} style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={`saas-skeleton-table ${className}`}>
      <div className="saas-skeleton-table__header">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} height={14} width={`${Math.random() * 30 + 40}%`} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="saas-skeleton-table__row">
          {Array.from({ length: columns }, (_, col) => (
            <Skeleton key={col} height={12} width={`${Math.random() * 40 + 30}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="saas-skeleton-dashboard">
      <div className="saas-skeleton-dashboard__kpis">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="saas-skeleton-dashboard__kpi">
            <Skeleton width="40%" height={12} style={{ marginBottom: 12 }} />
            <Skeleton width="60%" height={28} style={{ marginBottom: 8 }} />
            <Skeleton width="30%" height={10} />
          </div>
        ))}
      </div>
      <div className="saas-skeleton-dashboard__charts">
        <div className="saas-skeleton-dashboard__chart">
          <Skeleton width="30%" height={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={200} borderRadius="var(--radius-lg)" />
        </div>
        <div className="saas-skeleton-dashboard__chart">
          <Skeleton width="30%" height={16} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={200} borderRadius="var(--radius-lg)" />
        </div>
      </div>
    </div>
  );
}
