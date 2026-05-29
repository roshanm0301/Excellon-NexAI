# Excellon DMS — UI kit

A hi-fi recreation of the Excellon Dealer Management System shell, themed in the default Excellon orange. Uses tokens from `../../colors_and_type.css` for **all** colors, type, spacing, radii and shadow.

## What's mocked
- **Top bar** — workshop switcher, global search, notifications, profile.
- **Sidebar** — collapsible, four primary modules (Service / Vehicle / Spare Parts / Finance) plus secondary nav.
- **Page header** — breadcrumb, title, action group, KPI strip.
- **Data table** — sortable, filterable, with row actions and status badges; uses the components defined in the design system.
- **Detail slide-over** — opened from the table; right-side panel with tabs.
- **Tweaks** — Excellon ↔ Bajaj theme toggle, sidebar density, table density.

The screen recreated is the **Job Cards list** under Service. The grid, components, type and color all match the figma spec sheet.

## Files
- `index.html` — entry, mounts the React shell
- `app.jsx` — top-level shell composition
- `Sidebar.jsx`, `Topbar.jsx`, `PageHeader.jsx`, `DataTable.jsx` — component pieces
- `data.js` — mock job-card data
