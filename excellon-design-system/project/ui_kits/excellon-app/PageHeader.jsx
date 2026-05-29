// PageHeader.jsx
function PageHeader() {
  return (
    <div className="ex-page-header">
      <div className="ex-page-head-row">
        <div>
          <div className="eyebrow">Workshop · Worli</div>
          <h1 className="ex-h1">Job Cards</h1>
          <p className="ex-page-sub">42 open · 18 awaiting parts · 4 ready for delivery</p>
        </div>
        <div className="ex-page-actions">
          <button className="ex-btn secondary">↗ Export CSV</button>
          <button className="ex-btn secondary">⌃ Filters</button>
          <button className="ex-btn primary">＋ New Job Card</button>
        </div>
      </div>

      <div className="ex-kpis">
        <div className="ex-kpi">
          <div className="ex-kpi-l">Open</div>
          <div className="ex-kpi-n">42</div>
          <div className="ex-kpi-d up">↑ 8 vs. yesterday</div>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-l">In workshop</div>
          <div className="ex-kpi-n">21</div>
          <div className="ex-kpi-d up">↑ 3</div>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-l">Awaiting parts</div>
          <div className="ex-kpi-n">18</div>
          <div className="ex-kpi-d down">↑ 6 vs. last Tue</div>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-l">Avg. turnaround</div>
          <div className="ex-kpi-n">1<span className="u">d</span> 4<span className="u">h</span></div>
          <div className="ex-kpi-d down">↑ 6 h slower</div>
        </div>
        <div className="ex-kpi">
          <div className="ex-kpi-l">Receipts (today)</div>
          <div className="ex-kpi-n">₹4.82<span className="u">L</span></div>
          <div className="ex-kpi-d up">↑ 12%</div>
        </div>
      </div>

      <div className="ex-tabs">
        <button className="ex-tab active">All <span className="ex-count gray">42</span></button>
        <button className="ex-tab">In workshop <span className="ex-count gray">21</span></button>
        <button className="ex-tab">Awaiting parts <span className="ex-count gray">18</span></button>
        <button className="ex-tab">PDI pending <span className="ex-count gray">7</span></button>
        <button className="ex-tab">Ready <span className="ex-count gray">4</span></button>
        <button className="ex-tab">Closed today <span className="ex-count gray">12</span></button>
      </div>
    </div>
  );
}

window.PageHeader = PageHeader;
