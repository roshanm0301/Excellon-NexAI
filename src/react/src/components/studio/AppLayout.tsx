import { useState, type ReactNode } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Shield, GitBranch, Search, Bell, ChevronDown,
  Menu, HelpCircle, Network, Layers, Code2, PanelTop, PlayCircle,
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: ReactNode
  count?: number
}

const STUDIO_NAV: NavItem[] = [
  { path: '/admin/entities', label: 'Entity Designer', icon: <LayoutGrid size={18} /> },
  { path: '/studio/views', label: 'UI Studio', icon: <PanelTop size={18} /> },
  { path: '/admin/expressions', label: 'Expressions', icon: <Code2 size={18} /> },
  { path: '/workflow', label: 'Workflow', icon: <GitBranch size={18} /> },
]

const ADMIN_NAV: NavItem[] = [
  { path: '/admin/rules', label: 'Rule Builder', icon: <Shield size={18} /> },
  { path: '/admin/overlays', label: 'Overlays', icon: <Layers size={18} /> },
  { path: '/admin/nodes', label: 'Nodes', icon: <Network size={18} /> },
  { path: '/admin/setup', label: 'Demo Setup', icon: <PlayCircle size={18} /> },
]

const ALL_NAV = [...STUDIO_NAV, ...ADMIN_NAV]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const active = ALL_NAV.find(n => location.pathname.startsWith(n.path))?.path ?? '/admin/entities'

  function renderNavItem(item: NavItem) {
    const isActive = active === item.path
    return (
      <button
        key={item.path}
        className={`ex-nav-item${isActive ? ' active' : ''}`}
        onClick={() => navigate(item.path)}
        title={collapsed ? item.label : undefined}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span className="lbl">{item.label}</span>
            {item.count != null && item.count > 0 && (
              <span className="ex-count">{item.count}</span>
            )}
          </>
        )}
      </button>
    )
  }

  return (
    <div className="ex-app">
      {/* ── Sidebar ── */}
      <aside className={`ex-sidebar${collapsed ? ' collapsed' : ''}`}>
        {/* Brand */}
        <div className="ex-sidebar-brand">
          <img src="/excellon-emblem.svg" alt="Excellon" width={32} height={32} />
          {!collapsed && (
            <div className="brand-stack">
              <span className="ex-wordmark">
                e<span style={{ color: 'var(--brand-500)' }}>x</span>cellon
              </span>
              <span className="ex-tagline">NexAI Studio</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="ex-nav">
          {!collapsed && <div className="ex-nav-h">Studio</div>}
          {STUDIO_NAV.map(renderNavItem)}

          {!collapsed && <div className="ex-nav-h" style={{ marginTop: 16 }}>Admin</div>}
          {collapsed && <div style={{ height: 8 }} />}
          {ADMIN_NAV.map(renderNavItem)}
        </nav>

        {/* Footer tip */}
        {!collapsed && (
          <div className="ex-sidebar-foot">
            <div className="ex-tip">
              <div className="ex-tip-h">NexAI Studio</div>
              <div className="ex-tip-b">
                Build enterprise apps with <b>zero code</b>. Define entities, rules, and workflows.
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="ex-main">
        {/* Topbar */}
        <header className="ex-topbar">
          <button
            className="ex-icon-btn"
            onClick={() => setCollapsed(v => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>

          <div className="ex-search">
            <Search size={15} />
            <input placeholder="Search entities, rules, workflows…" />
            <span className="ex-kbd">⌘ K</span>
          </div>

          <div className="ex-top-actions">
            <button className="ex-icon-btn" aria-label="Help">
              <HelpCircle size={18} />
            </button>

            <button className="ex-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className="ex-divider" />

            <div className="ex-profile">
              <div className="ex-avatar">AD</div>
              <div className="ex-prof-meta">
                <div className="ex-prof-name">Admin</div>
                <div className="ex-prof-role">Platform admin</div>
              </div>
              <ChevronDown size={14} className="ex-prof-chev" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="ex-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
