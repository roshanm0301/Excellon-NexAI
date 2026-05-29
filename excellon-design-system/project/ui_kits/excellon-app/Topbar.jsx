// Topbar.jsx
function TopIcon({ name }) {
  const props = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  if (name === "search") return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></svg>;
  if (name === "bell") return <svg {...props}><path d="M6 8a6 6 0 1 1 12 0v5l1.5 3H4.5L6 13z"/><path d="M9 19a3 3 0 0 0 6 0"/></svg>;
  if (name === "help") return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/></svg>;
  if (name === "menu") return <svg {...props}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
  return null;
}

function Topbar({ collapsed, setCollapsed }) {
  return (
    <header className="ex-topbar">
      <button className="ex-icon-btn" onClick={() => setCollapsed(c => !c)} title="Toggle sidebar">
        <TopIcon name="menu" />
      </button>

      <div className="ex-breadcrumbs">
        <span className="bc-mute">Service</span>
        <span className="bc-sep">/</span>
        <span>Job cards</span>
      </div>

      <div className="ex-search">
        <TopIcon name="search" />
        <input placeholder="Search VIN, chassis, registration, customer…" />
        <span className="ex-kbd">⌘ K</span>
      </div>

      <div className="ex-top-actions">
        <button className="ex-icon-btn">
          <TopIcon name="help" />
        </button>
        <button className="ex-icon-btn ex-bell">
          <TopIcon name="bell" />
          <span className="ex-bell-dot">7</span>
        </button>
        <div className="ex-divider"></div>
        <div className="ex-profile">
          <span className="ex-avatar">RS</span>
          <div className="ex-prof-meta">
            <div className="ex-prof-name">Riya Sharma</div>
            <div className="ex-prof-role">Service Advisor</div>
          </div>
          <span className="ex-prof-chev">⌄</span>
        </div>
      </div>
    </header>
  );
}

window.Topbar = Topbar;
