import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutGrid, Settings, Shield, GitBranch, Search, Bell, ChevronDown,
  PanelLeftClose, PanelLeftOpen, Network, Layers, Code2,
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ReactNode
  count?: number
}

const NAV_ITEMS: NavItem[] = [
  { path: '/admin/entities', label: 'Entity Designer', icon: <LayoutGrid size={20} />, count: 0 },
  { path: '/admin/rules', label: 'Rule Builder', icon: <Shield size={20} /> },
  { path: '/admin/nodes', label: 'Nodes', icon: <Network size={20} /> },
  { path: '/admin/overlays', label: 'Overlays', icon: <Layers size={20} /> },
  { path: '/admin/expressions', label: 'Expressions', icon: <Code2 size={20} /> },
  { path: '/workflow', label: 'Workflow', icon: <GitBranch size={20} /> },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const active = NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.path ?? '/admin/entities'

  return (
    <div className="ex-app">
      <aside className={`ex-sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="ex-sidebar-brand">
          <img src="/design-system/assets/excellon-emblem.svg" alt="Excellon" width={32} height={32} />
          {!collapsed && (
            <div className="brand-stack">
              <span className="ex-wordmark">e<span style={{ color: 'var(--brand-500)' }}>x</span>cellon</span>
              <span className="ex-tagline">NexAI Studio</span>
            </div>
          )}
        </div>

        <nav className="ex-nav">
          {!collapsed && <div className="ex-nav-h">Studio</div>}
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`ex-nav-item${active === item.path ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
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
          ))}
        </nav>
      </aside>

      <div className="ex-main">
        <header className="ex-topbar">
          <button className="ex-icon-btn" onClick={() => setCollapsed(v => !v)} aria-label="Toggle sidebar">
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>

          <div className="ex-search" style={{ maxWidth: 400 }}>
            <Search size={15} />
            <input placeholder="Search entities, rules, workflows..." />
            <span className="ex-kbd">K</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
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

        <div className="ex-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
