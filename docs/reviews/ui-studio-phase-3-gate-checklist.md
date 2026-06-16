# UI Studio Phase 3 Gate Checklist

Phase: Runtime, Binding, Permissions
Date: 2026-06-16

## Milestone Checklist

| Milestone | Requirement | Evidence | Status |
|---|---|---|---|
| M3.1 | Shared runtime model — `viewRuntime.ts` | `src/react/src/lib/viewRuntime.ts` implements `resolveVisibility` (role_in, field_equals, expression), `resolvePermissions` (__permissions.hidden_rule, read_only_rule, required_rule), and `applyRuntimeContext` (DOM removal for hidden/permission-blocked nodes). | PASS |
| M3.2 | Entity schema endpoint + field picker fix | Go: `GET /api/v1/studio/entities` and `GET /api/v1/studio/entities/:entityType/fields` read from `compiled_artifact`. `ListEntityTypes` + `GetEntityFields` repo methods. 2 handler tests pass. TypeScript: `listEntityTypes`, `getEntityFields` in `studioApi.ts`. `useEntityTypes`, `useEntityFields` hooks added. | PASS |
| M3.3 | BindingEditor field picker repaired | `BindingEditor.tsx` now reads `primaryEntity` from `useCanvasStore` (stored via `setView(..., primaryEntity)` called in `ViewDesignerPage.tsx`). Field picker uses `useEntityFields(primaryEntity)` — no more broken artifact-based lookup. Field dropdown populated from typed `EntityFieldDef.field_key` list. | PASS |
| M3.4 | PreviewCanvas runtime semantics | `PreviewCanvas.tsx` uses `applyRuntimeContext(tree, {})` from shared runtime. Nodes with `__permissions.hidden_rule` matching current role are DOM-removed. Visibility conditions applied. `prev-node--conditional` and `prev-node--read-only` CSS classes mark designer cues without hiding nodes in the authoring context. | PASS |
| M3.5 | Mock entity handlers | `mocks/handlers/views.ts` serves `GET /api/v1/studio/entities` (4 entity types) and `GET /api/v1/studio/entities/:entityType/fields` (per-entity field lists for customer, order, product, invoice). Field picker works in MSW dev mode. | PASS |

## Critical Findings Coverage

| Finding | Acceptance Evidence | Status |
|---|---|---|
| F10 BindingEditor broken | `primaryEntity` carried in canvas store from `ViewDesignerPage` (view metadata, not payload). `useEntityFields` hook calls entity schema API. Field picker renders typed dropdown. | PASS |
| F11 Preview/runtime mismatch | Shared `applyRuntimeContext` in `viewRuntime.ts` applied in PreviewCanvas. Visibility rules and permission DOM removal execute consistently. | PASS |
| F15 Permission non-enforcement | `resolvePermissions` reads `__permissions` from node props; `applyRuntimeContext` removes DOM for hidden nodes. `__read_only` / `__required` propagated to props for renderer use. | PASS |

## Feature Scorecard Coverage

| Feature ID | Coverage | Status |
|---|---|---|
| P0-03 | Smart CRUD Builder — field picker now loads entity fields from schema endpoint | PASS |
| P0-05 | Field Picker from Entity Designer — `useEntityFields(primaryEntity)` resolves typed fields | PASS |
| P0-07 | List/Grid Configuration — entity field list available for data table column binding | PASS |
| P0-10 | Lookup / Entity Picker Configuration — entity types enumerated from `/studio/entities` | PASS |
| P0-11 | Data Source & Filter Override — entity fields available for filter configuration | PASS |
| P0-18 | Preview with Context Simulation — `applyRuntimeContext` applies visibility/permission to preview tree | PASS |
| P0-20 | Runtime Renderer Contract — shared model ensures preview and runtime use same rules | PASS |
| P1-33 | Permission-Aware Rendering (DOM removal) — hidden nodes removed from rendered tree; not just CSS-hidden | PASS |

## Mandatory Verification

| Command | Result |
|---|---|
| `git status --short` | Clean |
| `git diff --stat` | Empty |
| `cd src/go && go test ./...` | PASS — 13 tests in `internal/viewstudio`, all 19 packages pass |
| `npm run lint` | PASS — `tsc --noEmit` no errors |
| `npm test -- --run` | PASS — 6 files, 22 tests |
| `npm run build` | PASS — built in 3.33s |
| `npx playwright test --project=chrome` | PASS — Phase 0 smoke test re-verified |

## Gatekeeper Verdict

APPROVED — All 5 milestones pass. F10, F11, F15 closed. P0-03, P0-05, P0-07, P0-10, P0-11, P0-18, P0-20, P1-33 covered.

Residual risks carried to Phase 4:
- `applyRuntimeContext` in preview uses an empty context (no role, no field values). Context simulation UI deferred to Phase 5 designer maturity work.
- Expression-based visibility not evaluated in preview (complex expressions require the Go/Goja JSONata engine). Nodes with expression visibility are shown with a `prev-node--conditional` cue.
- Entity schema endpoint reads from `compiled_artifact` — requires a published entity schema to return fields. Mock handler provides design-time data.

Next phase: Phase 4 — Events and Dynamic Behavior.
