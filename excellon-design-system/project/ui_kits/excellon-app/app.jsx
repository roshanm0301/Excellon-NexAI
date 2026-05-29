// app.jsx - shell
function DetailPanel({ row, onClose }) {
  if (!row) return null;
  return (
    <>
      <div className="ex-scrim" onClick={onClose}></div>
      <aside className="ex-detail">
        <header>
          <div>
            <div className="eyebrow">Job card</div>
            <h3>{row.id}</h3>
          </div>
          <button className="ex-icon-btn" onClick={onClose}>×</button>
        </header>

        <div className="ex-detail-tabs">
          <button className="active">Overview</button>
          <button>Job lines</button>
          <button>Parts</button>
          <button>Payments</button>
          <button>Notes</button>
        </div>

        <div className="ex-detail-body">
          <div className="ex-row-pair">
            <div>
              <div className="ex-l">Customer</div>
              <div className="ex-v">{row.customer}</div>
              <div className="ex-s">{row.phone}</div>
            </div>
            <div>
              <div className="ex-l">Vehicle</div>
              <div className="ex-v">{row.vehicle}</div>
              <div className="ex-s">{row.km} · 2 prior visits</div>
            </div>
          </div>

          <div className="ex-row-pair">
            <div>
              <div className="ex-l">Service Advisor</div>
              <div className="ex-v adv-row">
                <span className={"ex-av-sm " + row.advisorColor}>{row.advisorInit}</span>
                {row.advisor}
              </div>
            </div>
            <div>
              <div className="ex-l">Bay</div>
              <div className="ex-v">{row.bay}</div>
            </div>
          </div>

          <div className="ex-row-pair">
            <div>
              <div className="ex-l">Status</div>
              <div className="ex-v"><StatusBadge status={row.status} label={row.statusLabel} /></div>
            </div>
            <div>
              <div className="ex-l">ETA</div>
              <div className="ex-v">{row.eta}</div>
            </div>
          </div>

          <div className="ex-progress-block">
            <div className="ex-l">Job progress</div>
            <div className="ex-progress"><div style={{ width: row.status === "complete" || row.status === "ready" ? "100%" : row.status === "pdi-pending" ? "78%" : "62%" }}></div></div>
            <div className="ex-progress-steps">
              <span className="done">Intake</span>
              <span className="done">Estimate</span>
              <span className="done">Approval</span>
              <span className={(row.status === "complete" || row.status === "ready") ? "done" : "current"}>Workshop</span>
              <span className={row.status === "complete" || row.status === "ready" ? "done" : ""}>PDI</span>
              <span className={row.status === "complete" ? "done" : ""}>Delivery</span>
            </div>
          </div>

          <div className="ex-money">
            <div className="ex-money-row"><span>Labour</span><span>₹ 2,450.00</span></div>
            <div className="ex-money-row"><span>Parts</span><span>₹ 1,840.00</span></div>
            <div className="ex-money-row"><span>Consumables</span><span>₹ 320.00</span></div>
            <div className="ex-money-row"><span>GST (18%)</span><span>₹ 829.80</span></div>
            <div className="ex-money-row total"><span>Estimate total</span><span>₹ {row.amount}</span></div>
          </div>
        </div>

        <footer>
          <button className="ex-btn secondary">Print spike copy</button>
          <button className="ex-btn primary">Mark ready for delivery</button>
        </footer>
      </aside>
    </>
  );
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "excellon",
  "sidebarCollapsed": false,
  "tableDensity": "default"
}/*EDITMODE-END*/;

function App() {
  const [state, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [selected, setSelected] = React.useState(null);
  const [active, setActive] = React.useState("service");

  // theme-class application
  React.useEffect(() => {
    document.body.dataset.theme = state.theme;
  }, [state.theme]);

  return (
    <div className="ex-app" data-theme={state.theme}>
      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={state.sidebarCollapsed}
        theme={state.theme}
      />
      <div className="ex-main">
        <Topbar
          collapsed={state.sidebarCollapsed}
          setCollapsed={v => setTweak("sidebarCollapsed", typeof v === "function" ? v(state.sidebarCollapsed) : v)}
        />
        <div className="ex-content">
          <PageHeader />
          <DataTable rows={JOB_CARDS} density={state.tableDensity} onSelect={setSelected} />
        </div>
      </div>
      <DetailPanel row={selected} onClose={() => setSelected(null)} />

      <TweaksPanel title="Tweaks">
        <TweakSection title="Theme">
          <TweakRadio
            label="OEM theme"
            value={state.theme}
            onChange={v => setTweak("theme", v)}
            options={[
              { value: "excellon", label: "Excellon" },
              { value: "bajaj", label: "Bajaj blue" },
            ]}
          />
        </TweakSection>
        <TweakSection title="Layout">
          <TweakToggle
            label="Collapse sidebar"
            value={state.sidebarCollapsed}
            onChange={v => setTweak("sidebarCollapsed", v)}
          />
          <TweakRadio
            label="Table density"
            value={state.tableDensity}
            onChange={v => setTweak("tableDensity", v)}
            options={[
              { value: "compact", label: "Compact" },
              { value: "default", label: "Default" },
              { value: "comfortable", label: "Comfy" },
            ]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
