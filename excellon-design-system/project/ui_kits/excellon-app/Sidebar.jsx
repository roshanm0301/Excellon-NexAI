// Sidebar.jsx — primary navigation
const SIDEBAR_NAV = [
  { id: "service", label: "Service", icon: "wrench", count: 42, sub: ["Job cards", "Appointments", "Technicians", "Workshop calendar"] },
  { id: "vehicle", label: "Vehicle", icon: "car", count: 8, sub: ["Vehicle master", "Deliveries", "Registration", "PDI"] },
  { id: "spareparts", label: "Spare Parts", icon: "shield", count: 3, sub: ["Inventory", "Indents", "Reorder", "GRN"] },
  { id: "finance", label: "Finance", icon: "ledger", sub: ["Invoices", "Receipts", "GL posting", "Reconciliation"] },
];
const SIDEBAR_SECONDARY = [
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "customers", label: "Customers", icon: "users" },
  { id: "settings", label: "Settings", icon: "gear" },
];

function NavIcon({ name }) {
  const props = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "wrench") return <svg {...props}><path d="M14.7 6.3a4.5 4.5 0 0 1-6.4 6.4L4 17l3 3 4.3-4.3a4.5 4.5 0 0 1 6.4-6.4l-2.5 2.5-2-2 2.5-2.5z"/></svg>;
  if (name === "car") return <svg {...props}><path d="M3 12l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 7l2 5"/><path d="M3 12h18v5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z"/><circle cx="7" cy="15" r="1.2"/><circle cx="17" cy="15" r="1.2"/></svg>;
  if (name === "shield") return <svg {...props}><path d="M12 3l8 4v6.2c0 4.5-3.4 8.4-8 9.6-4.6-1.2-8-5.1-8-9.6V7l8-4z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  if (name === "ledger") return <svg {...props}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><path d="M16 3v3M8 3v3"/></svg>;
  if (name === "chart") return <svg {...props}><path d="M4 19V5"/><path d="M4 19h16"/><rect x="8" y="11" width="3" height="6"/><rect x="13" y="7" width="3" height="10"/></svg>;
  if (name === "users") return <svg {...props}><circle cx="9" cy="8" r="3"/><path d="M3 19c.5-3.5 3-5 6-5s5.5 1.5 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M17 13c2.4 0 3.8 1.4 4 4"/></svg>;
  if (name === "gear") return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
  return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
}

function Sidebar({ active, setActive, collapsed, theme }) {
  return (
    <aside className={"ex-sidebar" + (collapsed ? " collapsed" : "")}>
      <div className="ex-sidebar-brand">
        <img src="../../assets/excellon-emblem.svg" alt="" />
        {!collapsed && (
          <div className="brand-stack">
            <span className="ex-wordmark">e<span style={{color: theme === "bajaj" ? "var(--bajaj-500)" : "var(--brand-500)"}}>x</span>cellon</span>
            <span className="ex-tagline">Dealer Management</span>
          </div>
        )}
      </div>

      <div className="ex-workshop">
        <div className="ws-avatar">{theme === "bajaj" ? "BJ" : "EX"}</div>
        {!collapsed && (
          <div className="ws-meta">
            <div className="ws-name">{theme === "bajaj" ? "Bajaj — Worli" : "Excellon Demo"}</div>
            <div className="ws-loc">Mumbai · West zone</div>
          </div>
        )}
        {!collapsed && <span className="ws-chev">⌄</span>}
      </div>

      <nav className="ex-nav">
        {!collapsed && <div className="ex-nav-h">Modules</div>}
        {SIDEBAR_NAV.map(item => (
          <button
            key={item.id}
            className={"ex-nav-item" + (active === item.id ? " active" : "")}
            onClick={() => setActive(item.id)}
          >
            <NavIcon name={item.icon} />
            {!collapsed && <>
              <span className="lbl">{item.label}</span>
              {item.count != null && <span className="ex-count">{item.count}</span>}
            </>}
          </button>
        ))}

        {!collapsed && <div className="ex-nav-h" style={{marginTop: 24}}>General</div>}
        {SIDEBAR_SECONDARY.map(item => (
          <button key={item.id} className="ex-nav-item">
            <NavIcon name={item.icon} />
            {!collapsed && <span className="lbl">{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="ex-sidebar-foot">
          <div className="ex-tip">
            <div className="ex-tip-h">Need a hand?</div>
            <div className="ex-tip-b">Open the in-app help or call DMS support at <b>1800 209 7700</b>.</div>
            <button className="ex-tip-btn">Open help</button>
          </div>
        </div>
      )}
    </aside>
  );
}

window.Sidebar = Sidebar;
