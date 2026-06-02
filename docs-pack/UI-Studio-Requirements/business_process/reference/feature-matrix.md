# Feature Matrix — UI Studio Business Requirements

> **Purpose:** Full list of all 63 UI Studio features with their business priority, phase, and milestone. Use this to cross-reference with [docs/ui-studio/reference/feature-matrix.md](../../ui-studio/reference/feature-matrix.md) to confirm each feature has a corresponding implementation.

---

## P0 — 20 Core Features (Must-Have)

These features define the minimum viable UI Studio. The system is not useful without all of them.

| Code | Feature | Business Purpose | Phase | Milestone |
|---|---|---|---|---|
| P0-01 | View Registry & View Management | Create, list, search, and manage all UI Studio views | P1 + P3 | M2 + M4 |
| P0-02 | Typed View Surface Designer | Choose the right surface type for each business document | P1 + P3 | M2 + M4 |
| P0-03 | Smart CRUD Builder | Configure standard master data forms without code | P3 | M4 |
| P0-04 | Header-Line Transaction Workspace Builder | Configure transaction documents (Sale Order, PO, Service Job) | P6 | M7 |
| P0-05 | Field Picker from Entity Designer | Drag entity fields onto the canvas — no typing field names | P3 | M4 |
| P0-06 | Layout Builder | Arrange fields in sections, columns, and tabs | P3 | M4 |
| P0-07 | List / Grid Configuration | Configure list columns, sorting, and filtering for any entity | P3 | M4 |
| P0-08 | Form Field Configuration | Configure each input field: label, placeholder, help text, required | P3 | M4 |
| P0-09 | Line Grid Configuration | Configure the line items grid for transaction documents | P6 | M7 |
| P0-10 | Lookup / Entity Picker Configuration | Configure which entity a picker looks up and what it displays | P3 + P4 | M4 + M5 |
| P0-11 | Data Source & Filter Override | Override the default data source for any lookup or grid per view | P4 | M5 |
| P0-12 | Basic Dynamic Behavior Builder | Configure what happens when a field value changes | P5 | M6 |
| P0-13 | Field Change Event Configuration | Configure show/hide, enable/disable, recalculate on field change | P5 | M6 |
| P0-14 | Grid Cell Change Event Configuration | Configure auto-populate and recalculate on grid cell change | P5 | M6 |
| P0-15 | Action Placement Configuration | Place Save, Submit, and custom action buttons in the view | P3 | M4 |
| P0-16 | Workflow UX Integration | Display workflow state and allowed actions in any view | P7 | M8 |
| P0-17 | Save / Publish / Rollback | Safely publish and roll back any view version | P8 | M9 |
| P0-18 | Preview with Context Simulation | Preview the view as any role before publishing | P8 | M9 |
| P0-19 | Publish Validation | Block publishing of misconfigured views | P8 | M9 |
| P0-20 | Runtime Renderer Contract | Render any published view with real data | P4 | M5 |

---

## P1 — 23 Enhanced Features (High Priority)

Features that make the platform production-ready for enterprise deployments.

| Code | Feature | Business Purpose | Phase | Milestone |
|---|---|---|---|---|
| P1-21 | ViewCode / Process View Support | Same entity, different view per business process | P1 + P9 | M2 + M10 |
| P1-22 | Transaction Totals Panel | Configurable subtotal, tax, and grand total rows | P6 | M7 |
| P1-23 | Dynamic Tax / Charge Columns | Tax columns fetched from service — not hardcoded | P6 | M7 |
| P1-24 | Relationship Panel Builder | Show related records below the main form | P9 | M10 |
| P1-25 | Rule-Based Visibility & Enablement Engine | Show/hide/enable/disable fields based on rule conditions | P5 | M6 |
| P1-26 | Conditional Validation UX Layer | Display rule engine validation feedback inline | P5 + P7 | M6 + M8 |
| P1-27 | Confirmation / Warning / Popup Configuration | Show confirmation popups before destructive actions | P5 | M6 |
| P1-28 | Action Rule Configuration | Configure when action buttons are shown or enabled | P5 | M6 |
| P1-29 | Bulk Action Configuration | Apply one action to multiple selected records | P9 | M10 |
| P1-30 | Saved View Configuration | Users save their filter and column preferences | P9 | M10 |
| P1-31 | Advanced Filter Builder | Multi-field condition builder for complex filters | P9 | M10 |
| P1-32 | Role / Persona / Context Variants | Different field sets per role on the same view | P9 | M10 |
| P1-33 | Permission-Aware Rendering | Hidden fields absent from DOM — not just CSS hidden | P4 + P9 | M5 + M10 |
| P1-34 | Cascading Lookup Configuration | Child picker refreshes when parent picker changes | P9 | M10 |
| P1-35 | Modal / Drawer / Side Panel Builder | Open related forms without navigating away | P9 | M10 |
| P1-36 | Record Summary / Highlights Panel | KPI bar showing computed values at top of form | P9 | M10 |
| P1-37 | Status Strip / Workflow Timeline | Current state, allowed actions, full state history | P7 | M8 |
| P1-38 | Attachment / Notes / Audit Timeline | File uploads, free-text notes on any transaction | P6 + P7 | M7 + M8 |
| P1-39 | View Dependency / Impact Analysis | Show which views depend on a changed entity | P8 | M9 |
| P1-40 | Schema Change Sync Indicator | Alert when entity field changes break published bindings | P8 | M9 |
| P1-41 | Builder Guardrails / Linting | Warn configurator about suboptimal configurations | P8 | M9 |
| P1-42 | Semantic Diff Between View Versions | Human-readable diff when comparing two versions | P8 | M9 |
| P1-43 | Audit Trail for UI Configuration Changes | Every publish, rollback, and draft save is logged | P8 | M9 |

---

## P2 — 20 Productivity & AI Features

Features that accelerate adoption and configurator productivity.

| Code | Feature | Business Purpose | Phase | Milestone |
|---|---|---|---|---|
| P2-44 | Template Gallery | Start from 10 pre-built view templates | P10 | M11 |
| P2-45 | Component Presets | Save a configured component instance for reuse | P10 | M11 |
| P2-46 | Dashboard Builder | Build KPI and chart dashboards | P10 | M11 |
| P2-47 | Kanban Board | View any entity with a status field as a kanban board | P10 | M11 |
| P2-48 | Wizard Builder | Multi-step guided data entry | P10 | M11 |
| P2-49 | Console / Split View | List on left, form detail on right | P10 | M11 |
| P2-50 | Personalization | User saves their own column and filter preferences | P10 | M11 |
| P2-51 | Runtime Usage Analytics | Track view usage and load times | P10 | M11 |
| P2-52 | Performance Budgeting | Alert when a view exceeds load time threshold | P10 | M11 |
| P2-53 | Accessibility Checks | Pre-publish linter: WCAG 2.1 AA for form inputs | P10 | M11 |
| P2-54 | Localization Checks | Pre-publish linter: flag hardcoded user-facing text | P10 | M11 |
| P2-55 | Advanced Expression Mode | Full JSONata editor for complex expressions | P10 | M11 |
| P2-56 | No-Code Rule Builder Wizard | Guided wizard for creating event conditions | P10 | M11 |
| P2-57 | AI View Generation | Describe a view in natural language → draft created | P10 | M11 |
| P2-58 | AI Layout Refactoring | "Suggest improvements" analyses and recommends changes | P10 | M11 |
| P2-59 | AI Broken Binding Explanation | Natural language explanation of schema drift errors | P10 | M11 |
| P2-60 | Guided Builder Walkthroughs | In-app tutorials for first-time configurators | P10 | M11 |
| P2-61 | View Documentation Generator | Auto-generate a spec from a published view | P10 | M11 |
| P2-62 | Export / Import Metadata | Move views between environments as JSON bundles | P10 | M11 |
| P2-63 | View Clone with Delta Tracking | Clone records which original it was based on | P10 | M11 |

---

## Additional Components — 12

These 12 components are registered in Phase 2 (M3) and rendered from Phase 4 (M5) onwards. They extend the core 56 platform components.

| Component | Business Use Case |
|---|---|
| Conditional Row Formatting | Highlight overdue, approved, exception, or high-value rows |
| Tree / Hierarchy View | Org chart, category tree, bill of materials, approval hierarchy |
| Calendar / Schedule View | Service jobs, delivery schedules, booking slots, task timelines |
| Timeline / Gantt View | Project milestones, repair stages, order tracking |
| Map / Geolocation | Dealer location, delivery route, service area visualization |
| Signature Capture | Customer sign-off for delivery, service, inspection, finance |
| Rich Text | Notes, remarks, formatted customer-facing descriptions |
| Image / Document Gallery | Vehicle images, inspection photos, document attachments |
| Rating / Scoring | Customer satisfaction, inspection score, quality rating |
| Progress Bar / Gauge | SLA usage, budget utilization, completion percentage |
| Sparkline / Mini Chart | Row-level trend indicator in grids |
| QR / Barcode Display | VIN, item barcode, GRN receipt code |
