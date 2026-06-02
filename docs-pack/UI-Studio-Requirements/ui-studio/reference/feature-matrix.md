# Feature Matrix — All 63 Features

> Complete list of all UI Studio features across P0 (must-have), P1 (important), and P2 (nice-to-have).
> Each feature links to its implementation phase.

---

## P0 — 20 Core Features (Phases 1–8)

> P0 features define the minimum viable UI Studio. All must be complete before M9.

| Code | Feature | Phase | Milestone | Status |
|---|---|---|---|---|
| P0-01 | View Registry & View Management | Phase 1 + 3 | M2 + M4 | [ ] |
| P0-02 | Typed View Surface Designer | Phase 1 + 3 | M2 + M4 | [ ] |
| P0-03 | Smart CRUD Builder | Phase 3 | M4 | [ ] |
| P0-04 | Header-Line Transaction Workspace Builder | Phase 6 | M7 | [ ] |
| P0-05 | Field Picker from Entity Designer | Phase 3 | M4 | [ ] |
| P0-06 | Layout Builder | Phase 3 | M4 | [ ] |
| P0-07 | List/Grid Configuration | Phase 3 | M4 | [ ] |
| P0-08 | Form Field Configuration | Phase 3 | M4 | [ ] |
| P0-09 | Line Grid Configuration | Phase 6 | M7 | [ ] |
| P0-10 | Lookup / Entity Picker Configuration | Phase 3 + 4 | M4 + M5 | [ ] |
| P0-11 | Data Source & Filter Override | Phase 4 | M5 | [ ] |
| P0-12 | Basic Dynamic Behavior Builder | Phase 5 | M6 | [ ] |
| P0-13 | Field Change Event Configuration | Phase 5 | M6 | [ ] |
| P0-14 | Grid Cell Change Event Configuration | Phase 5 | M6 | [ ] |
| P0-15 | Action Placement Configuration | Phase 3 | M4 | [ ] |
| P0-16 | Workflow UX Integration | Phase 7 | M8 | [ ] |
| P0-17 | Save / Publish / Rollback | Phase 8 | M9 | [ ] |
| P0-18 | Preview with Context Simulation | Phase 8 | M9 | [ ] |
| P0-19 | Publish Validation (41 rules V001–V051) | Phase 8 | M9 | [ ] |
| P0-20 | Runtime Renderer Contract | Phase 4 | M5 | [ ] |

---

## P1 — 23 Important Features (Phases 5–9)

> P1 features make the Studio production-grade. All must be complete before M10.

| Code | Feature | Phase | Milestone | Status |
|---|---|---|---|---|
| P1-21 | ViewCode / Process View Support | Phase 1 + 9 | M2 + M10 | [ ] |
| P1-22 | Transaction Totals Panel | Phase 6 | M7 | [ ] |
| P1-23 | Dynamic Tax / Charge Columns | Phase 6 | M7 | [ ] |
| P1-24 | Relationship Panel Builder | Phase 9 | M10 | [ ] |
| P1-25 | Rule-Based Visibility & Enablement Engine | Phase 5 | M6 | [ ] |
| P1-26 | Conditional Validation UX Layer | Phase 5 + 7 | M6 + M8 | [ ] |
| P1-27 | Confirmation / Warning / Popup Configuration | Phase 5 | M6 | [ ] |
| P1-28 | Action Rule Configuration | Phase 5 | M6 | [ ] |
| P1-29 | Bulk Action Configuration | Phase 9 | M10 | [ ] |
| P1-30 | Saved View Configuration | Phase 9 | M10 | [ ] |
| P1-31 | Advanced Filter Builder | Phase 9 | M10 | [ ] |
| P1-32 | Role / Persona / Context Variants | Phase 9 | M10 | [ ] |
| P1-33 | Permission-Aware Rendering (DOM removal) | Phase 4 + 9 | M5 + M10 | [ ] |
| P1-34 | Cascading Lookup Configuration | Phase 9 | M10 | [ ] |
| P1-35 | Modal / Drawer / Side Panel Builder | Phase 9 | M10 | [ ] |
| P1-36 | Record Summary / Highlights Panel | Phase 9 | M10 | [ ] |
| P1-37 | Status Strip / Workflow Timeline | Phase 7 | M8 | [ ] |
| P1-38 | Attachment / Notes / Audit Timeline | Phase 6 + 7 | M7 + M8 | [ ] |
| P1-39 | View Dependency / Impact Analysis | Phase 8 | M9 | [ ] |
| P1-40 | Schema Change Sync Indicator | Phase 8 | M9 | [ ] |
| P1-41 | Builder Guardrails / Linting | Phase 8 | M9 | [ ] |
| P1-42 | Semantic Diff Between View Versions | Phase 8 | M9 | [ ] |
| P1-43 | Audit Trail for UI Configuration Changes | Phase 8 | M9 | [ ] |

---

## P2 — 20 Enhancement Features (Phase 10)

> P2 features complete the enterprise experience. All delivered in M11.

| Code | Feature | Status |
|---|---|---|
| P2-44 | Template Gallery (10 presets) | [ ] |
| P2-45 | Component Presets (save configured instance) | [ ] |
| P2-46 | Dashboard Builder (`dashboard` surface) | [ ] |
| P2-47 | Kanban View (`kanban` surface) | [ ] |
| P2-48 | Wizard Builder (`wizard` surface) | [ ] |
| P2-49 | Console/Split View (`split_view` surface) | [ ] |
| P2-50 | Personalization (column widths, filter presets per user) | [ ] |
| P2-51 | Runtime Usage Analytics (telemetry events) | [ ] |
| P2-52 | Performance Budgeting (alert when render > 3000ms) | [ ] |
| P2-53 | Accessibility Checks (A001–A005 pre-publish rules) | [ ] |
| P2-54 | Localization Checks (L001–L004 pre-publish rules) | [ ] |
| P2-55 | Advanced Expression Mode (full JSONata editor) | [ ] |
| P2-56 | No-Code Rule Builder Wizard | [ ] |
| P2-57 | AI-Assisted View Generation (NlpPanel + Claude API) | [ ] |
| P2-58 | AI Layout Refactoring ("Suggest improvements") | [ ] |
| P2-59 | AI Broken Binding Explanation (V050/V051 plain-text) | [ ] |
| P2-60 | Guided Builder Walkthroughs (in-app tutorials) | [ ] |
| P2-61 | View Documentation Generator (GET /documentation) | [ ] |
| P2-62 | Export / Import Metadata (JSON bundle) | [ ] |
| P2-63 | View Clone with Delta Tracking (`cloned_from_view_key`) | [ ] |

---

## Additional Components — 12 (registered Phase 2, runtime Phase 4)

These are registered in the component registry seed but their runtime renderers are built in Phase 4+:

| Component | Category | Primary Surface |
|---|---|---|
| `conditional_row_format` | Data | `standard_crud`, `header_line` |
| `tree_view` | Data | All |
| `calendar_view` | Visualization | All |
| `timeline_gantt` | Visualization | All |
| `map_geolocation` | Visualization | All |
| `signature_capture` | Form | `standard_crud`, `header_line` |
| `rich_text_editor` | Form | All |
| `image_document_gallery` | Media | All |
| `rating_scoring` | Form | All |
| `progress_bar` | Display | All |
| `sparkline` | Display | `dashboard`, `standard_crud` |
| `qr_barcode` | Display | All |

---

## Surface Type Summary

| Surface Code | Description | Primary Features |
|---|---|---|
| `standard_crud` | Standard list + form | P0-01 through P0-20 |
| `advanced_crud` | Master + related records | P1-24, P1-29 |
| `header_line` | Transaction workspace | P0-04, P0-09, P1-22, P1-23 |
| `custom_page` | Free-form layout | All layout components |
| `dashboard` | KPI + charts | P2-46, `kpi_card`, chart components |
| `wizard` | Multi-step entry | P2-48 |
| `detail_page` | Read-only record view | P2-49 |
| `split_view` | Split list + detail | P2-49 |
| `kanban` | Status-based board | P2-47, `kanban_board` |
| `calendar` | Time-based scheduling | `calendar_view` |
