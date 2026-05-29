// DataTable.jsx
const STATUS_TO_BADGE = {
  "in-workshop": "info",
  "ready": "success",
  "complete": "success",
  "pdi-pending": "warn",
  "awaiting-parts": "brand",
  "estimate-sent": "purple",
  "payment-failed": "error",
};

function StatusBadge({ status, label }) {
  const cls = STATUS_TO_BADGE[status] || "gray";
  return <span className={"ex-badge " + cls}><span className="dot"></span>{label}</span>;
}

function DataTable({ rows, density, onSelect }) {
  const [sort, setSort] = React.useState({ key: "id", dir: "desc" });
  const sorted = React.useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      if (av < bv) return sort.dir === "asc" ? -1 : 1;
      if (av > bv) return sort.dir === "asc" ? 1 : -1;
      return 0;
    });
    return out;
  }, [rows, sort]);

  const head = (key, label, w) => (
    <th
      style={{ width: w }}
      onClick={() => setSort(s => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))}
    >
      <span>{label}</span>
      {sort.key === key && <span className="sort">{sort.dir === "asc" ? "↑" : "↓"}</span>}
    </th>
  );

  return (
    <div className="ex-table-wrap">
      <div className="ex-table-bar">
        <div className="ex-table-bar-l">
          <label className="ex-check"><input type="checkbox" /><span></span></label>
          <span className="ex-table-bar-l-meta">{rows.length} job cards · sorted by <b>{sort.key}</b></span>
        </div>
        <div className="ex-table-bar-r">
          <span className="ex-tag">Today<span className="x">×</span></span>
          <span className="ex-tag">Worli WS<span className="x">×</span></span>
          <span className="ex-tag">Two-wheeler<span className="x">×</span></span>
          <button className="ex-link">Clear all</button>
        </div>
      </div>

      <table className={"ex-table" + (density === "comfortable" ? " comfy" : density === "compact" ? " compact" : "")}>
        <thead>
          <tr>
            <th style={{ width: 36 }}><label className="ex-check"><input type="checkbox" /><span></span></label></th>
            {head("id", "Job Card #", 150)}
            {head("date", "Date", 110)}
            <th>Customer · Vehicle</th>
            {head("km", "Reading", 100)}
            <th>Advisor</th>
            <th>Status</th>
            {head("eta", "ETA / closed", 170)}
            <th style={{ textAlign: "right" }}>Estimate</th>
            <th style={{ width: 36 }}></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} onClick={() => onSelect(r)}>
              <td><label className="ex-check" onClick={e => e.stopPropagation()}><input type="checkbox" /><span></span></label></td>
              <td className="ex-td-id">{r.id}</td>
              <td className="ex-td-date">{r.date}</td>
              <td>
                <div className="ex-td-cust">{r.customer}</div>
                <div className="ex-td-veh">{r.vehicle}</div>
              </td>
              <td className="ex-td-num">{r.km}</td>
              <td>
                <span className={"ex-av-sm " + r.advisorColor}>{r.advisorInit}</span>
                <span className="ex-td-adv">{r.advisor}</span>
                <div className="ex-td-bay">{r.bay}</div>
              </td>
              <td><StatusBadge status={r.status} label={r.statusLabel} /></td>
              <td className="ex-td-eta">{r.eta}</td>
              <td className="ex-td-amt">₹ {r.amount}</td>
              <td><button className="ex-icon-btn sm">⋯</button></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ex-table-foot">
        <span>Showing 1–{rows.length} of 42</span>
        <div className="ex-pager">
          <button className="ex-pager-btn">‹</button>
          <button className="ex-pager-btn active">1</button>
          <button className="ex-pager-btn">2</button>
          <button className="ex-pager-btn">3</button>
          <button className="ex-pager-btn">4</button>
          <button className="ex-pager-btn">5</button>
          <button className="ex-pager-btn">›</button>
        </div>
      </div>
    </div>
  );
}

window.DataTable = DataTable;
