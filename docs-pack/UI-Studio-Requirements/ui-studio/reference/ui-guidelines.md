# UI Guidelines, Architecture & Testing Strategy

---

## 10 UI Design Principles (Apply to Every Phase)

These apply to every component, page, and panel built in UI Studio.

| # | Principle | Detail |
|---|---|---|
| 1 | **Enterprise density** | Tailwind `text-sm`, compact tables and forms; avoid excessive whitespace. Users manage hundreds of records â€” screen real estate matters. |
| 2 | **Monospace for code** | All codes, expressions, JSON, attribute names, component keys rendered in `font-mono`. Makes identifiers scannable at a glance. |
| 3 | **Color-coded status** | Published = green Â· Draft = orange Â· Error/Archived = red Â· Processing = blue. Consistent across all panels. |
| 4 | **Progressive disclosure** | Basic config visible immediately. Advanced config behind collapsible "Advanced â–¸" section. Default closed. |
| 5 | **No modal overload** | Prefer inline panels and sheet side-panels for configuration. Reserve modals for critical confirmations (delete, publish, rollback) only. |
| 6 | **Keyboard-first** | Tab navigation through all form fields. `Ctrl+S` save. `Escape` cancel/close. `Delete` remove selected canvas component. `Ctrl+Z` undo. `Ctrl+D` duplicate. |
| 7 | **Optimistic UI** | Show save-in-progress immediately (spinner on button). On success: toast confirmation. On error: rollback UI state + toast with reason. |
| 8 | **Graceful degradation** | Broken component shows a placeholder card with `component_code` + error type. NEVER shows raw stack trace or metadata to users. Rest of the page continues rendering. |
| 9 | **Consistent iconography** | `FileText` = TransactionForm Â· `Database` = Entity Â· `Layout` = Component Â· `Upload` = Publish Â· `Edit` = Draft Â· `History` = Version History Â· `Eye` = Preview. Use lucide-react icons. |
| 10 | **Performance** | Lazy-load heavy components (`MapGeolocation`, `TimelineGantt`, `CalendarView`) via `React.lazy`. Never load all 56 components on initial render. |

---

## Navigation Map (After All Phases Complete)

```
Left Sidebar â†’ "UI Studio" group
â”‚
â”œâ”€â”€ View Designer                    /admin/ui-studio
â”‚   â”œâ”€â”€ [New View] button
â”‚   â”œâ”€â”€ View list (filter: surface Â· entity Â· status)
â”‚   â””â”€â”€ [Open Designer]             /admin/ui-studio/:viewKey/edit
â”‚        â”œâ”€â”€ Toolbar
â”‚        â”‚     [ViewCode] [Surface] [Status: Draft v2]
â”‚        â”‚     [Undo] [Redo]  [Save Draft]  [Preview]  [Publish]  [History]
â”‚        â”œâ”€â”€ Left Rail
â”‚        â”‚     Tabs: Outline | Library | Entity Fields | Smart CRUD | Data Sources | Events
â”‚        â”œâ”€â”€ Canvas
â”‚        â”‚     Surface-aware zones:
â”‚        â”‚       standard_crud  â†’ Form zone + Grid zone
â”‚        â”‚       header_line    â†’ Header zone + Lines zone + Footer zone
â”‚        â””â”€â”€ Right Inspector
â”‚              Tabs: Props | Binding | Style | Events (per selected component)
â”‚
â”œâ”€â”€ Component Registry               /admin/ui-studio/components
â”‚   â””â”€â”€ Browse 56 platform components + installed plugins
â”‚       Filter by: category Â· surface type
â”‚       Row expand: config_schema JSON
â”‚       Plugin install/remove
â”‚
â””â”€â”€ Template Gallery                 /admin/ui-studio/templates   (Phase 10)
    â””â”€â”€ 10 template presets â†’ clone as draft

Left Sidebar â†’ "Behavior" group (existing â€” unchanged)
â””â”€â”€ Rule Designer                   /admin/behavior/rules

Left Sidebar â†’ "Configuration" group (existing â€” unchanged)
â”œâ”€â”€ Entity Designer                  /admin/entities
â”œâ”€â”€ Menu Designer                    /admin/menu
â””â”€â”€ Permissions                      /admin/permissions
```

---

## Testing Strategy by Milestone

| Milestone | Unit | Integration | E2E | Performance | Security |
|---|---|---|---|---|---|
| M1 Gap Analysis | â€” | â€” | â€” | â€” | â€” |
| M2 Metadata | âœ… | âœ… | â€” | â€” | âœ… Tenant isolation |
| M3 Component Registry | âœ… | âœ… | âœ… Admin screen | â€” | â€” |
| M4 Designer Shell | âœ… Zustand store | âœ… | âœ… Wizard + canvas | â€” | â€” |
| M5 Runtime Renderer | âœ… Binding + Permission | âœ… | âœ… Render + fallback | âœ… <2s load | âœ… DOM removal |
| M6 Event Engine | âœ… Pure TS (no browser) | âœ… | âœ… Designer + runtime | â€” | â€” |
| M7 Transaction WS | âœ… Totals expressions | âœ… Row CRUD | âœ… Sale Order E2E | âœ… | âœ… ViewCode propagation |
| M9 Governance | âœ… 41 validation rules | âœ… Publish/rollback | âœ… Preview + diff | â€” | âœ… Immutability |
| M10 Enterprise | âœ… Variant overlay | âœ… | âœ… Clerk DOM removal | âœ… | âœ… DOM removal + tenant |
| M11 AI/P2 | âœ… AI generator (Go) | âœ… | âœ… Full regression | âœ… AI perf | âœ… AI governance |

**Regression gate:** Before every milestone closes, ALL previous phase tests must pass.
Agent 16 (Phase Coordinator) verifies this gate.

**Test tooling:**
- Frontend unit: **Vitest** + React Testing Library + MSW (mock service worker)
- Backend unit + integration: **Go testing** + **testcontainers-go** (real PostgreSQL)
- E2E: **Playwright** (headless Chrome)

---

## Key Risks and Controls

| Risk | Control |
|---|---|
| Canvas becomes a generic JSON editor | Typed surface regions; components only drop into valid zones per `allowed_parents` |
| Publish lifecycle bypassed in development | Runtime MUST check `is_active=true`; the check is in `MetadataLoader`, not in component code |
| Event engine creates infinite loops | Circular dependency detection at publish validation (V021) |
| AI output breaks governance rules | AI output always DRAFT; runs through V001â€“V051 before returning to frontend |
| Breaking change to payload schema | Version the schema (`_schema_version: 1`); migration on load for old payloads |
| Too many cloned views causing sprawl | ViewCode uniqueness enforced per entity+surface; use variants instead of clones |
| Frontend/backend type drift | Agent 17 runs at every milestone; TypeScript and Go types compared explicitly |
| Hidden field visible via CSS | Agent 12 security test: DOM removal only â€” no CSS hide allowed |
| Plugin crashes runtime | ComponentErrorBoundary per-component isolation â€” broken plugin shows error card only |
| Schema drift breaks published views | `sync-status` endpoint checks bindings on every designer open; shows drift banner |
| Tenant data leakage | All DB queries filter by `tenant_id`; Agent 12 security tests verify isolation |
| Slow AI generation blocks user | AI call is async with loading state; generated draft returned in <30s or timeout error shown |

---

## Ownership Boundaries â€” Reference

These are the hard rules that must never be violated in any phase:

| UI Studio OWNS | UI Studio DOES NOT OWN |
|---|---|
| Presentation config (layout, placement, spacing) | Entity schema (fields, types, validation truth) |
| Component binding to entity fields | Business rule logic and outcomes |
| View publish lifecycle and versioning | Approval routing and escalation |
| Role variant overlays and display-layer permissions | Security/RBAC policy decisions |
| Design-time linting and schema drift detection | Print templates and reporting |
| AI generation of view layouts | Data sovereignty and encryption |

---

## ViewCode â€” How It Flows

```
View Design Time:
  Designer sets ViewArtifactPayload.view_code = 'SO_VEHICLE_BOOKING'

Runtime (every API call from StudioRenderer):
  GET  /api/v1/entities/SaleOrder/123?viewCode=SO_VEHICLE_BOOKING
  POST /api/v1/entities/SaleOrder        body: { viewCode: 'SO_VEHICLE_BOOKING', ... }
  PUT  /api/v1/entities/SaleOrder/123    body: { viewCode: 'SO_VEHICLE_BOOKING', ... }
  POST /api/v1/rules/SaleOrder/evaluate  body: { record: {...}, view_code: 'SO_VEHICLE_BOOKING' }

Backend:
  RuleEngine uses view_code to select correct rule set
  This enables the same entity (SaleOrder) to have different rules/flows per ViewCode
```
