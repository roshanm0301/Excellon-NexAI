import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, BookOpen,
  List, FileEdit, FileText, TableProperties, Columns2,
  GitMerge, LayoutDashboard, CalendarDays, Layout, Kanban,
  CheckCircle2, XCircle, Lightbulb, Building2,
} from 'lucide-react'
import type { SurfaceType } from '../../../types/viewStudio'
import { SURFACE_GUIDE, SURFACE_GUIDE_ORDER, type SurfaceGuideEntry } from './SurfaceGuideData'
import './SurfaceGuidePanel.css'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const SURFACE_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  List:            List,
  FileEdit:        FileEdit,
  FileText:        FileText,
  TableProperties: TableProperties,
  Columns2:        Columns2,
  GitMerge:        GitMerge,
  LayoutDashboard: LayoutDashboard,
  CalendarDays:    CalendarDays,
  Layout:          Layout,
  Kanban:          Kanban,
}

function SurfaceIcon({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  const Icon = SURFACE_ICONS[name] ?? Layout
  return <Icon size={size} color={color} />
}

const CAT_CLASS: Record<string, string> = {
  'Master Data':  'sgp-example__cat--master',
  'Transaction':  'sgp-example__cat--transaction',
  'Dashboard':    'sgp-example__cat--dashboard',
  'Process':      'sgp-example__cat--process',
  'Report':       'sgp-example__cat--report',
  'Utility':      'sgp-example__cat--utility',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SurfaceGuidePanelProps {
  initialSurface: SurfaceType
  onClose: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SurfaceGuidePanel({ initialSurface, onClose }: SurfaceGuidePanelProps) {
  const [active, setActive] = useState<SurfaceType>(initialSurface)
  const entry: SurfaceGuideEntry = SURFACE_GUIDE[active]

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Reset scroll when surface changes
  useEffect(() => {
    const body = document.querySelector('.sgp-body')
    if (body) body.scrollTop = 0
  }, [active])

  return createPortal(
    <div
      className="sgp-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Surface Type Guide"
    >
      <div
        className="sgp-panel"
        style={{ '--sgp-accent': entry.color } as React.CSSProperties}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="sgp-header">
          <span className="sgp-header__title">
            <BookOpen size={14} />
            Surface Type Guide
          </span>
          <button className="sgp-header__close" onClick={onClose} aria-label="Close guide">
            <X size={16} />
          </button>
        </div>

        {/* ── Tab strip ──────────────────────────────────────────────────── */}
        <div className="sgp-tabs" role="tablist">
          {SURFACE_GUIDE_ORDER.map(s => {
            const g = SURFACE_GUIDE[s]
            return (
              <button
                key={s}
                role="tab"
                aria-selected={active === s}
                className={`sgp-tab${active === s ? ' sgp-tab--active' : ''}`}
                style={{ '--sgp-accent': g.color } as React.CSSProperties}
                onClick={() => setActive(s)}
                title={g.label}
              >
                <SurfaceIcon name={g.icon} size={14} color={active === s ? g.color : undefined} />
                {g.label.split(' ')[0]}
              </button>
            )
          })}
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="sgp-body">

          {/* Hero */}
          <div className="sgp-hero">
            <div className="sgp-hero__top">
              <div
                className="sgp-hero__icon"
                style={{ background: entry.color }}
              >
                <SurfaceIcon name={entry.icon} size={20} color="#fff" />
              </div>
              <span className="sgp-hero__label">{entry.label}</span>
            </div>
            <p className="sgp-hero__tagline">{entry.tagline}</p>
          </div>

          {/* Overview */}
          <div className="sgp-section">
            <div className="sgp-section__heading">
              <span className="sgp-section__heading-dot" style={{ background: entry.color }} />
              Overview
            </div>
            <p className="sgp-overview">{entry.overview}</p>
          </div>

          {/* When to use */}
          <div className="sgp-section">
            <div className="sgp-section__heading">
              <span className="sgp-section__heading-dot" style={{ background: entry.color }} />
              When to use
            </div>
            <ul className="sgp-bullets">
              {entry.whenToUse.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>

          {/* What you can build / cannot */}
          {(entry.whatYouCanBuild.length > 0 || entry.whatYouCannot.length > 0) && (
            <div className="sgp-section">
              <div className="sgp-section__heading">
                <span className="sgp-section__heading-dot" style={{ background: entry.color }} />
                Capabilities & Limitations
              </div>
              <div className="sgp-two-col">
                <div className="sgp-col-card">
                  <div className="sgp-col-card__title">
                    <CheckCircle2 size={11} style={{ display: 'inline', marginRight: 3 }} />
                    You can build
                  </div>
                  <ul className="sgp-col-list">
                    {entry.whatYouCanBuild.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
                <div className="sgp-col-card sgp-col-card--cannot">
                  <div className="sgp-col-card__title">
                    <XCircle size={11} style={{ display: 'inline', marginRight: 3 }} />
                    Not suitable for
                  </div>
                  <ul className="sgp-col-list">
                    {entry.whatYouCannot.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {entry.recommendations.length > 0 && (
            <div className="sgp-section">
              <div className="sgp-section__heading">
                <span className="sgp-section__heading-dot" style={{ background: entry.color }} />
                Recommendations
              </div>
              <ul className="sgp-bullets">
                {entry.recommendations.map((item, i) => (
                  <li key={i}>
                    <Lightbulb size={12} style={{ flexShrink: 0, color: '#f59e0b', marginTop: 2 }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Do's and Don'ts */}
          {(entry.dos.length > 0 || entry.donts.length > 0) && (
            <div className="sgp-section">
              <div className="sgp-section__heading">
                <span className="sgp-section__heading-dot" style={{ background: entry.color }} />
                Do's & Don'ts
              </div>
              <ul className="sgp-dnd-list">
                {entry.dos.map((item, i) => (
                  <li key={`do-${i}`} className="sgp-dnd-item">
                    <span className="sgp-dnd-item__badge sgp-dnd-item__badge--do">DO</span>
                    {item}
                  </li>
                ))}
                {entry.donts.map((item, i) => (
                  <li key={`dont-${i}`} className="sgp-dnd-item">
                    <span className="sgp-dnd-item__badge sgp-dnd-item__badge--dont">DON'T</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* DMS Examples */}
          {entry.dmsExamples.length > 0 && (
            <div className="sgp-section">
              <div className="sgp-section__heading">
                <span className="sgp-section__heading-dot" style={{ background: entry.color }} />
                <Building2 size={11} />
                Automotive DMS Examples
              </div>
              <div className="sgp-examples">
                {entry.dmsExamples.map((ex, i) => (
                  <div key={i} className="sgp-example">
                    <div className="sgp-example__top">
                      <span className={`sgp-example__cat ${CAT_CLASS[ex.category] ?? 'sgp-example__cat--utility'}`}>
                        {ex.category}
                      </span>
                      <span className="sgp-example__name">{ex.name}</span>
                    </div>
                    <p className="sgp-example__desc">{ex.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body,
  )
}
