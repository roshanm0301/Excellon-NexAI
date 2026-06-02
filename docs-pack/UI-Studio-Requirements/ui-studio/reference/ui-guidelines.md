# UI Guidelines, Architecture & Testing Strategy

---

## 10 UI Design Principles (Apply to Every Phase)

These apply to every component, page, and panel built in UI Studio.

| # | Principle | Detail |
|---|---|---|
| 1 | **Enterprise density** | Tailwind `text-sm`, compact tables and forms; avoid excessive whitespace. Users manage hundreds of records — screen real estate matters. |
| 2 | **Monospace for code** | All codes, expressions, JSON, attribute names, component keys rendered in `font-mono`. Makes identifiers scannable at a glance. |
| 3 | **Color-coded status** | Published = green · Draft = orange · Error/Archived = red · Processing = blue. Consistent across all panels. |
| 4 | **Progressive disclosure** | Basic config visible immediately. Advanced config behind collapsible "Advanced ▸" section. Default closed. |
| 5 | **No modal overload** | Prefer inline panels and sheet side-panels for configuration. Reserve modals for critical confirmations (delete, publish, rollback) only. |
| 6 | **Keyboard-first** | Tab navigation through all form fields. `Ctrl+S` save. `Escape` cancel/close. `Delete` remove selected canvas component. `Ctrl+Z` undo. `Ctrl+D` duplicate. |
| 7 | **Optimistic UI** | Show save-in-progress immediately (spinner on button). On success: toast confirmation. On error: rollback UI state + toast with reason. |
| 8 | **Graceful degradation** | Broken component shows a placeholder card with `component_code` + error type. NEVER shows raw stack trace or metadata to users. Rest of the page continues rendering. |
| 9 | **Consistent iconography** | `FileText` = TransactionForm · `Database` = Entity · `Layout` = Component · `Upload` = Publish · `Edit` = Draft · `History` = Version History · `Eye` = Preview. Use lucide-react icons. |
| 10 | **Performance** | Lazy-load heavy components (`MapGeolocation`, `TimelineGantt`, `CalendarView`) via `React.lazy`. Never load all 56 components on initial render. |

---

## Navigation Map (After All Phases Complete)

```
Left Sidebar → "UI Studio" group
│
├── View Designer                    /admin/ui-studio
│   ├── [New View] button
│   ├── View list (filter: surface · entity · status)
│   └── [Open Designer]             /admin/ui-studio/:viewKey/edit
│        ├── Toolbar
│        │     [ViewCode] [Surface] [Status: Draft v2]
│        │     [Undo] [Redo]  [Save Draft]  [Preview]  [Publish]  [History]
│        ├── Left Rail
│        │     Tabs: Outline | Library | Entity Fields | Smart CRUD | Data Sources | Events
│        ├── Canvas
│        │     Surface-aware zones:
│        │       standard_crud  → Form zone + Grid zone
│        │       header_line    → Header zone + Lines zone + Footer zone
│        └── Right Inspector
│              Tabs: Props | Binding | Style | Events (per selected component)
│
├── Component Registry               /admin/ui-studio/components
│   └── Browse 56 platform components + installed plugins
│       Filter by: category · surface type
│       Row expand: config_schema JSON
│       Plugin install/remove
│
└── Template Gallery                 /admin/ui-studio/templates   (Phase 10)
    └── 10 template presets → clone as draft

Left Sidebar → "Behavior" group (existing — unchanged)
├── Workflow Designer                /admin/behavior/workflows
└── Rule Designer                   /admin/behavior/rules

Left Sidebar → "Configuration" group (existing — unchanged)
├── Entity Designer                  /admin/entities
├── Menu Designer                    /admin/menu
└── Permissions                      /admin/permissions
```

---

## Testing Strategy by Milestone

| Milestone | Unit | Integration | E2E | Performance | Security |
|---|---|---|---|---|---|
| M1 Gap Analysis | — | — | — | — | — |
| M2 Metadata | ✅ | ✅ | — | — | ✅ Tenant isolation |
| M3 Component Registry | ✅ | ✅ | ✅ Admin screen | — | — |
| M4 Designer Shell | ✅ Zustand store | ✅ | ✅ Wizard + canvas | — | — |
| M5 Runtime Renderer | ✅ Binding + Permission | ✅ | ✅ Render + fallback | ✅ <2s load | ✅ DOM removal |
| M6 Event Engine | ✅ Pure TS (no browser) | ✅ | ✅ Designer + runtime | — | — |
| M7 Transaction WS | ✅ Totals expressions | ✅ Row CRUD | ✅ Sale Order E2E | ✅ | ✅ ViewCode propagation |
| M8 Workflow/Rule | ✅ Component | ✅ | ✅ Approve + rule errors | — | — |
| M9 Governance | ✅ 41 validation rules | ✅ Publish/rollback | ✅ Preview + diff | — | ✅ Immutability |
| M10 Enterprise | ✅ Variant overlay | ✅ | ✅ Clerk DOM removal | ✅ | ✅ DOM removal + tenant |
| M11 AI/P2 | ✅ AI generator (Go) | ✅ | ✅ Full regression | ✅ AI perf | ✅ AI governance |

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
| AI output breaks governance rules | AI output always DRAFT; runs through V001–V051 before returning to frontend |
| Breaking change to payload schema | Version the schema (`_schema_version: 1`); migration on load for old payloads |
| Too many cloned views causing sprawl | ViewCode uniqueness enforced per entity+surface; use variants instead of clones |
| Frontend/backend type drift | Agent 17 runs at every milestone; TypeScript and Go types compared explicitly |
| Hidden field visible via CSS | Agent 12 security test: DOM removal only — no CSS hide allowed |
| Plugin crashes runtime | ComponentErrorBoundary per-component isolation — broken plugin shows error card only |
| Schema drift breaks published views | `sync-status` endpoint checks bindings on every designer open; shows drift banner |
| Tenant data leakage | All DB queries filter by `tenant_id`; Agent 12 security tests verify isolation |
| Slow AI generation blocks user | AI call is async with loading state; generated draft returned in <30s or timeout error shown |

---

## Ownership Boundaries — Reference

These are the hard rules that must never be violated in any phase:

| UI Studio OWNS | UI Studio DOES NOT OWN |
|---|---|
| Presentation config (layout, placement, spacing) | Entity schema (fields, types, validation truth) |
| Component binding to entity fields | Business rule logic and outcomes |
| Field-level behavior/events (show/hide/require) | Workflow transition logic and routing |
| View publish lifecycle and versioning | Approval routing and escalation |
| Role variant overlays and display-layer permissions | Security/RBAC policy decisions |
| Design-time linting and schema drift detection | Print templates and reporting |
| AI generation of view layouts | Data sovereignty and encryption |

---

## ViewCode — How It Flows

```
View Design Time:
  Designer sets ViewArtifactPayload.view_code = 'SO_VEHICLE_BOOKING'

Runtime (every API call from StudioRenderer):
  GET  /api/v1/entities/SaleOrder/123?viewCode=SO_VEHICLE_BOOKING
  POST /api/v1/entities/SaleOrder        body: { viewCode: 'SO_VEHICLE_BOOKING', ... }
  PUT  /api/v1/entities/SaleOrder/123    body: { viewCode: 'SO_VEHICLE_BOOKING', ... }
  POST /api/v1/rules/SaleOrder/evaluate  body: { record: {...}, view_code: 'SO_VEHICLE_BOOKING' }
  POST /api/v1/workflow/SaleOrder/123/transition  body: { action_key: 'approve', view_code: '...' }

Backend:
  WorkflowResolver uses view_code to select correct workflow definition
  RuleEngine uses view_code to select correct rule set
  This enables the same entity (SaleOrder) to have different rules/flows per ViewCode
```
