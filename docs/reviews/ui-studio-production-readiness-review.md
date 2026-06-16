# Excellon NexAI UI Studio Production Readiness Review

Review date: 2026-06-16  
Reviewer role: Senior UI Architect, production readiness and enterprise studio architecture  
Repository root: `d:/excellongit/Excellon-NexAI`

## Executive Verdict

UI Studio is not production ready. It is a promising typed prototype with a working happy-path View Studio API, a substantial React designer shell, seeded component metadata, and passing compile/test/build gates. It is still materially behind production-grade enterprise studios because server-side governance, authenticated tenant security, runtime rendering, real data binding, rule execution, component parity, publish validation, and View Studio-specific tests are incomplete.

Overall quality rating: 2/5 - incomplete, usable for internal prototyping, not safe for production.

| Area | Rating | Verdict |
|---|---:|---|
| Backend API and persistence | 2/5 | Basic create/list/get/save/publish/rollback/archive exists, but server validation, DB constraints, concurrency, structured errors, variant/event/data-source APIs, plugin trust, and View Studio tests are weak or absent. |
| Frontend designer | 2/5 | Useful canvas, palette, tree, panels, autosave, import/export, and history shell, but many controls are config-only and not backed by runtime or server validation. |
| Runtime renderer and preview | 1/5 | Preview fallback exists, but published runtime is only metadata retrieval; rules, data binding, permissions, and full component render parity are not production-grade. |
| Security, tenancy, governance | 1/5 | Current middleware trusts dev headers and frontend sends default admin identity headers. This is a stop-ship issue. |
| Test and operability readiness | 2/5 | General React and Go tests pass, but View Studio has no backend test files and no targeted designer/runtime tests. Docker works for smoke checks. |
| Benchmark competitiveness | 2/5 | Well behind Retool, Appsmith, Power Apps, Mendix, OutSystems, and ServiceNow App Engine Studio on data/runtime/governance depth. |

Score definitions used: 1 = prototype, 2 = incomplete, 3 = usable but risky, 4 = production-ready, 5 = world-class / benchmark-leading.

## Evidence Baseline

### Commands Run

| Command | Result | Evidence |
|---|---|---|
| `git status --short` | Clean before report creation. | No output. |
| `npm.cmd run lint` in `src/react` | Passed. | `tsc --noEmit` completed. |
| `npm.cmd test -- --run` in `src/react` | Passed. | 6 test files, 17 tests passed. Vite warned that esbuild/oxc options need cleanup. |
| `npm.cmd run build` in `src/react` | Passed. | 1967 modules transformed. Largest chunks: `browser-Ck3WCwi6.js` 467.91 kB, `index-FpXrxXQn.js` 297.98 kB, `ViewDesignerPage-XAuH1gA9.js` 100.36 kB. |
| `go version` | Failed locally. | Go is not on PATH. |
| `docker --version` / `docker compose version` | Passed. | Docker 29.2.1, Compose v5.1.0. |
| `docker compose run --rm --no-deps api go test ./...` | Passed. | All Go packages passed or had no tests; `internal/viewstudio` has no test files. |
| Docker API smoke: `/health` | Passed. | Returned `{"status":"ok","db":"ok"}`. |
| Docker API smoke: `/api/v1/studio/component-registry` | Passed. | Returned 76 registry components. |
| Docker API smoke: create/save/publish/runtime/archive | Passed for a basic view. | Created `codex_smoke_0616113041`, saved version 1, published active, fetched runtime version 1 by code, then archived. |
| Docker route smoke: `/api/v1/nlp/chat`, `/api/v1/overlays`, `/api/v1/nodes` | Failed as frontend paths. | Returned HTTP 404, matching static route mismatch findings. |

### Primary Files Reviewed

- Backend: `src/go/internal/viewstudio/handler.go`, `repo.go`, `types.go`, `validation.go`.
- API wiring and middleware: `src/go/cmd/server/main.go`, `src/go/internal/middleware/devctx.go`.
- Migrations: `db/migrations/20260529000001_correct_artifact_tables.up.sql`, `20260602000001_ui_studio_foundation.up.sql`, `20260602000002_seed_component_registry.up.sql`.
- Frontend API and hooks: `src/react/src/config/studioApi.ts`, `src/react/src/hooks/useViewStudio.ts`.
- Frontend designer: `src/react/src/pages/admin/ViewDesignerListPage.tsx`, `src/react/src/pages/studio/view-designer/*`.
- Frontend runtime helpers: `src/react/src/lib/viewTreeValidator.ts`, `src/react/src/lib/viewEventEngine.ts`.
- Types and mocks: `src/react/src/types/viewStudio.ts`, `src/react/src/mocks/handlers/views.ts`.
- Requirements baseline: `docs-pack/UI-Studio-Requirements/ui-studio/reference/feature-matrix.md`.

## Milestone Review Status

| Milestone | Status | Evidence and conclusion |
|---|---|---|
| M0: Scope, Spec, Evidence Baseline | Complete | Feature matrix claims 63 features, but enumerates 61 rows: `P0-16` and `P1-37` are absent. Review scored 61 explicit rows and flags the 2 missing rows as documentation gaps. |
| M1: Metadata, View Registry, API Contract | Complete | API happy path works. Major issues: dev headers trusted, weak DB uniqueness, ambiguous runtime view-code lookup, no server-side tree validation. |
| M2: Component Registry and Plugins | Complete | 76 components are seeded, but renderer/editor/runtime coverage is partial. Plugin registration stores bundle URLs without trust, manifest, integrity, or component lifecycle. |
| M3: Designer UX and State | Complete | Canvas shell exists with palette/tree/property/bindings/autosave/history. Placement constraints, field picker, complex schema editors, dirty-state lifecycle, and tests need production hardening. |
| M4: Runtime Renderer, Preview, Binding | Complete | Runtime API returns published payloads. Preview renderer is partial and uses placeholders; data binding and rules are not production runtime. |
| M5: Rules, Events, Dynamic Behavior | Complete | Event editor and event engine exist, but engine is incomplete, async handling is unsafe, and it is not wired to runtime preview or publish. |
| M6: Header-Line and Transaction Workspace | Complete | Registry entries exist, but transaction-grade line grids, totals, tax/charge patterns, attachments, notes, and audit surfaces are not complete. |
| M7: Publish Governance, Versioning, Audit | Complete | Save/publish/rollback/archive exist. Semantic diff is client-side only, audit is partial, validation results are not enforced server-side. |
| M8: Security, Reliability, Performance | Complete | Stop-ship auth issue, weak payload trust model, no a11y/l10n/performance pre-publish gates, route mismatches, and limited observability. |
| M9: Benchmark Ratings and Roadmap | Complete | Scorecard and resolution roadmap included below. |

## Critical Finding Register

| ID | Severity | Affected feature | Evidence and affected files/API/schema | User impact and production risk | Benchmark gap | Recommended resolution | Acceptance criteria |
|---|---|---|---|---|---|---|---|
| F01 | Blocker | All production use, tenant isolation, P1-33 | `src/go/internal/middleware/devctx.go:16-29` says headers are trusted as-is. `src/react/src/config/studioApi.ts:3-7` sends default admin tenant/user/role headers. `src/go/cmd/server/main.go:97-103` installs this middleware globally. | Any client can spoof tenant, user, and role. Cross-tenant exposure and unauthorized publish/delete are possible. | Leading enterprise studios enforce authenticated identity, roles, environments, and tenant boundaries. | Replace `DevContext` in production with authenticated middleware, token validation, tenant membership checks, and permission claims. Keep dev headers only behind explicit local/dev build flag. | Requests without valid auth are rejected. Tenant/user/role cannot be supplied by browser headers. Integration tests prove tenant A cannot list/get/publish/archive tenant B views. |
| F02 | Blocker | P0-17, P0-19, P0-20, P1-41 | `src/go/internal/viewstudio/repo.go:287-360` publishes latest draft without validating component tree, bindings, registry compatibility, permissions, a11y, l10n, or validation_result. `handler.go:156-176` accepts publish with decoded body ignored on malformed JSON. | Invalid or unsupported layouts can be published and consumed by runtime. Client-side validation can be bypassed. | Retool/Appsmith/Power Apps/Mendix/OutSystems all gate deployable artifacts with model validation or runtime checks. | Add server-side publish validator using registry, JSON schema, entity schema, binding resolution, event/rule validation, a11y/l10n/performance checks, and structured validation result persistence. | Publish rejects invalid trees with machine-readable errors. API tests cover missing root, unknown component, invalid parent-child, unsupported surface, invalid binding, unresolved action, and unsupported renderer. |
| F03 | Critical | P0-01, P1-21, P0-17 | `db/migrations/20260602000001_ui_studio_foundation.up.sql:8-16` adds view fields but explicitly leaves surface enforcement to application. `idx_artifact_header_view_code` at lines 126-127 is not unique. `artifact_header` unique key in `20260529000001...:13` is artifact_name based only. `repo.go:213-283` saves drafts without transaction/locking. | Duplicate `view_code` and concurrent draft races can produce ambiguous runtime behavior and lost updates. | Enterprise studios usually have stable artifact identity, optimistic concurrency, and environment-safe publishing. | Add DB constraints/checks: surface enum/check, unique `(tenant_id, primary_entity, surface_type, view_code)` for active/non-archived views, version uniqueness, one active version partial unique index, optimistic revision field. | Concurrent save/publish tests are deterministic. Duplicate view_code in same tenant/entity/surface is rejected at DB and API levels. |
| F04 | Critical | P1-21 ViewCode runtime | `repo.go:456-463` gets published view by `view_code`, tenant, active, and type only; it ignores primary entity and surface. | Runtime can return the wrong view if codes collide across entity/surface. | Process-view support in mature studios is resolved through stable app/module/page identity, not a loose string alone. | Make runtime lookup include primary entity and surface, or make view_code globally unique per tenant with DB enforcement and documented namespace. | API contract and DB constraint agree. Runtime lookup tests cover duplicate codes across entities/surfaces. |
| F05 | High | Shared Studio API contract | Frontend calls `/api/v1/nlp/*` at `studioApi.ts:280-299`, but backend mounts `/api/nlp` at `main.go:131-132`. Frontend calls `/api/v1/overlays`, `/api/v1/indexes`, `/api/v1/nodes` at `studioApi.ts:197-242`; backend mounts overlays/indexes under `/api/v1/admin/*` and no `/nodes` route is registered. Docker smoke confirmed 404 for `/api/v1/nlp/chat`, `/api/v1/overlays`, `/api/v1/nodes`. | UI flows break at runtime even though TypeScript compiles. | Production low-code studios maintain versioned, tested API clients. | Generate the TypeScript API client from OpenAPI or contract tests; align routes or add compatibility aliases. | Contract tests fail if frontend calls a route the Go router does not expose. |
| F06 | High | P1-32, P1-39, P1-40, P1-42, P2-61 | `types.go:169-246` defines variants, events, data-source overrides, validation result, version diff, and sync status. Migration creates tables for events/datasources/variants at `20260602000001...:80-118`. `handler.go:22-44` exposes only views, runtime, registry, and plugins. | Features appear designed but are not operational. UI panels persist many settings only inside view payloads. | Leading platforms expose lifecycle APIs for dependencies, versions, diffs, documentation, and environment governance. | Implement service/repo/handler endpoints for variants, event definitions, datasource overrides, validation result, diff, sync status, documentation, and dependency impact. | API coverage exists for every persisted table/type, with integration tests and frontend hooks. |
| F07 | Critical | Plugins and extensibility | `repo.go:610-618` stores plugin name/version/author/runtime/designer bundle URLs. `PluginManagerPanel.tsx:226-240` accepts arbitrary HTTPS URLs. No manifest fetch, component registration, integrity hash, signature, sandbox, permissions, or removal cascade is implemented. | Third-party bundle trust and supply-chain risk are uncontrolled. Removing a plugin does not reconcile dependent views or registry components. | Enterprise plugin systems use signed packages, manifests, permission scopes, compatibility checks, and controlled loading. | Introduce plugin manifest schema, signature/SRI verification, tenant allowlist, sandboxed component loading, dependency analysis before removal, and version/deprecation lifecycle. | Unsigned or incompatible plugin fails install. Removing plugin with dependent views requires explicit migration or blocks. |
| F08 | High | M2, P0-20, all component features | Seed migration says 76 components at `20260602000002...:2-4`. `ComponentRenderMap.tsx:417-493` maps only a subset; fallback renderer at `ComponentRenderMap.tsx:408-412` shows code label. | Many seeded components render as placeholders or not as expected. Designers can build views the runtime cannot faithfully render. | Retool/Appsmith/Power Apps expose usable controls with runtime/editor parity. | Build a registry compatibility test that requires every active component to have renderer, designer panel, schema editor, binding behavior, event support, and preview coverage or be explicitly marked unsupported. | CI fails when an active registry component lacks runtime/designer mapping. Unsupported components cannot be published. |
| F09 | High | P0-19, P1-41 | `viewTreeValidator.ts:96-103` and `125-136` look for wildcard `any`, but seed uses `all` widely, for example `20260602000002...:18`, `32`, `46`, `53`. Root must be `page_root` at `viewTreeValidator.ts:168-172`, while mocks seed `PageRoot` at `mocks/handlers/views.ts:91`. Schema required checks at `viewTreeValidator.ts:139-150` expect top-level `required`, while seed schemas mostly use `properties`. | Valid trees can be flagged invalid and invalid required configurations can pass. Publish validation UX is unreliable. | Mature platforms keep metadata schema, renderer, and validator in one canonical model. | Normalize component code casing and wildcard semantics. Use JSON Schema validation for `config_schema`. Make mocks derive from seed or shared fixture. | Validator tests cover each seed wildcard and a representative schema required case. |
| F10 | High | P0-05, P0-10, bindings | `BindingEditor.tsx:39` reads `(payload as { primaryEntity?: string })?.primaryEntity`, but `ViewPayload` does not contain `primaryEntity`; metadata lives on the View. Query is disabled at line 43 when missing. | Field picker often cannot load entity fields; users manually type field keys and create broken bindings. | Leading platforms make data schema discovery central to the builder. | Pass view metadata into store or editor context; add entity schema endpoint by primary entity; bind fields through typed IDs, not free text. | Field picker loads for a view's primary entity and rejects stale/missing fields in publish validation. |
| F11 | Critical | P0-18, P0-20, P1-25, P1-33 | `PreviewCanvas.tsx:13-18` says rule runtime was removed and returns tree as-is. Visibility at `PreviewCanvas.tsx:59-65` is not actually evaluated beyond placeholder checks. `ComponentRenderMap.tsx:294-343` renders table/sample placeholders rather than real data. | Preview does not match runtime semantics. Users can publish views that behave differently than preview. | Enterprise builders depend on high-fidelity preview and context simulation. | Build a shared runtime renderer package that applies bindings, permissions, visibility, validation, data sources, events, and context consistently in preview and runtime. | Preview and runtime golden tests render the same tree under the same context. |
| F12 | High | P0-12, P0-13, P0-14, P1-25 to P1-28 | `viewEventEngine.ts:31-53` implements only a few action handlers. `types/viewStudio.ts:176+` defines more actions. `viewEventEngine.ts:57-69` only supports flat equality conditions. `viewEventEngine.ts:127-168` does not await handlers and swallows errors. Not wired into `PreviewCanvas`. | Dynamic behavior is unreliable and not debuggable. Side effects can silently fail. | Mature low-code tools expose explicit event/action graphs, validation, async flow handling, and error reporting. | Define event/action runtime contract, async queue, action result/error model, expression evaluator integration, and designer validation. | Event integration tests cover each action type, conditions, async failures, and UI error surfacing. |
| F13 | High | P0-06, P0-08, P0-15 | `ComponentPalette.tsx:62-68` and `ComponentTree.tsx:62-70` insert dropped components without `canInsertChild`. `useCanvasStore.ts:218-240` inserts/moves without container/ancestor checks. Random keys use `Math.random` in `ComponentPalette.tsx:27`, `ComponentTree.tsx:62`, `useCanvasStore.ts:120`. | Designers can create invalid trees, move into invalid parents, or lose nodes in edge cases. Key generation is not deterministic enough for audit/diff. | Enterprise builders prevent invalid composition during authoring. | Apply registry constraints before drag/drop/insert/move, block cycles, use UUID/ULID component keys, and show inline placement reasons. | UI cannot create a tree that server publish rejects for structural reasons. |
| F14 | Medium | P2-44, P2-62, P2-63 | `ImportExportPanel.tsx:63-130` exports/imports JSON client-side. Templates are stored in `localStorage` at lines 158-167 and 280-281. Clone creates a new view but no server `cloned_from_view_key` or delta tracking. | Metadata portability and governance are local-browser only; templates are not tenant/team assets. | Mature studios provide versioned export/import packages, environment promotion, templates, and audit. | Move import/export/template/clone operations to backend APIs with schema validation, dependency resolution, audit, and delta tracking. | Import/export package round-trip is tested and audited. Templates are tenant-scoped and shareable. |
| F15 | High | P1-26, P1-33, validation and permission UX | `PermissionEditor.tsx:42-50` writes `__permissions` into props; runtime resolver function at lines 164-177 is not wired. `ValidationRuleEditor.tsx:320-383` has a standalone client validator but no runtime/publish integration. | Permission and validation settings can be configured without enforcement. | Production platforms enforce permissions and validation at runtime and server boundary. | Enforce permissions in runtime renderer and server API; execute validation rules in form submission lifecycle and publish validation. | Hidden/read-only/required behavior is verified in runtime tests and cannot be bypassed by payload manipulation. |
| F16 | High | Autosave, undo/redo, concurrency | `useAutoSave.ts:30-69` saves dirty payload after debounce but does not deterministically mark clean after success; `useCanvasStore.ts:278-289` marks undo/redo dirty; backend `SaveDraft` at `repo.go:213-283` has no optimistic revision. | Lost update risk and confusing dirty-state behavior under multi-tab/multi-user editing. | Enterprise studios have conflict detection, editor sessions, autosave state, and revision-aware drafts. | Add revision/etag to view payload, save with `If-Match`, debounce status model, conflict resolution UI, and autosave tests. | Two editors modifying same view produce a conflict, not silent overwrite. Autosave status accurately returns clean after server acknowledgment. |
| F17 | Medium | P1-42, P1-43 | `VersionHistoryPanel.tsx:178-268` computes diff on client payload snapshots. `repo.go:342-350`, `415-422`, and `667-681` logs only publish/rollback/archive and ignores some audit update errors. | Auditors cannot trust full change history for every configuration change. Diffs are not canonical. | Enterprise governance requires immutable server-side audit and semantic diff. | Add server diff API and append-only audit log for create/save/publish/rollback/archive/import/plugin changes. Do not ignore audit errors. | Server returns semantic diff between any two versions. Audit log covers all changes with actor, tenant, source, and correlation ID. |
| F18 | High | Test readiness | `src/react/src/pages/studio/view-designer` has no test files. `docker compose run --rm --no-deps api go test ./...` reports `internal/viewstudio` has no test files. Existing React tests are general: 6 files/17 tests. | Regressions in critical Studio flows will pass CI. | Leading product engineering teams gate builders with unit, integration, contract, visual, and e2e tests. | Add View Studio backend integration tests and frontend tests for store, autosave, validator, renderer mapping, bindings, route contracts, and publish flows. | CI blocks if core UI Studio flows fail. Minimum tests cover all P0 features and critical P1 governance paths. |
| F19 | Medium | P2-52, P2-53, P2-54, UX maturity | No evidence of accessibility pre-publish checks, localization checks, large-tree performance budgets, mobile/responsive designer snapshots, or runtime perf telemetry. | UI Studio can generate inaccessible, untranslated, or slow views without warnings. | Power Apps, Mendix, OutSystems, and ServiceNow have stronger governance and app-quality tooling expectations. | Add a11y/l10n/perf lint rules into publish validator and designer warnings; capture browser screenshots and large-tree benchmarks. | Publish fails or warns on missing labels, keyboard traps, untranslated labels, and render budget breaches. |
| F20 | Medium | Operability | `writeError` at `handler.go:374-377` returns only `{error}`. Logs use `slog` for some failures but no structured error code/correlation model. Docker compose uses obsolete `version` key warnings. | Harder to diagnose production issues and support enterprise customers. | Mature platforms expose structured errors, telemetry, request IDs, and admin observability. | Standardize error envelope with code, message, details, trace ID; emit structured audit/metrics around publish/runtime/validation. Clean compose warnings. | API errors are consistent and traceable in logs and client UI. |

## Feature Scorecard

The requirements file says "All 63 Features", but the table explicitly lists 61 rows. `P0-16` and `P1-37` are missing from `docs-pack/UI-Studio-Requirements/ui-studio/reference/feature-matrix.md`, so they are marked `N/A - docs gap`.

| Code | Feature | Rating | Review evidence | Benchmark posture |
|---|---|---:|---|---|
| P0-01 | View Registry & View Management | 2 | API has create/list/get/archive and Docker smoke passed basic flow. Weak auth, uniqueness, validation, and tests. | Behind due governance and identity gaps. |
| P0-02 | Typed View Surface Designer | 2 | Surface types exist in Go/TS; DB lacks checks; designer panels are partial. | Behind mature typed app/page models. |
| P0-03 | Smart CRUD Builder | 1 | No full CRUD scaffolding from entity schema; field picker is broken by payload metadata mismatch. | Far behind Retool/Appsmith/Power Apps CRUD generation. |
| P0-04 | Header-Line Transaction Workspace Builder | 1 | Registry has header_line components, but transaction workspace behavior is not implemented. | Far behind ERP-grade transaction builders. |
| P0-05 | Field Picker from Entity Designer | 1 | Binding editor query disabled because primary entity is not in payload. | Far behind schema-aware builders. |
| P0-06 | Layout Builder | 2 | Palette/tree/canvas exist; invalid placements are allowed and renderer parity is partial. | Prototype compared with visual layout editors. |
| P0-07 | List/Grid Configuration | 2 | Data table renderer/config exists but uses sample data and lacks runtime data pipeline. | Behind data-grid platforms. |
| P0-08 | Form Field Configuration | 2 | Property panel supports primitive props; complex JSON schema arrays/objects are weak. | Behind benchmark component editors. |
| P0-09 | Line Grid Configuration | 1 | No transaction line-grid semantics, totals, validation, or event handling. | Far behind ERP/transaction studios. |
| P0-10 | Lookup / Entity Picker Configuration | 1 | Reference fields/components exist, but data/entity lookup and cascading logic are not implemented. | Far behind production lookup builders. |
| P0-11 | Data Source & Filter Override | 1 | DataSourceEditor is payload-local and free-text; backend table exists but no API. | Far behind query/data-source studios. |
| P0-12 | Basic Dynamic Behavior Builder | 1 | Event editor exists; runtime engine incomplete and unwired. | Far behind event/action systems. |
| P0-13 | Field Change Event Configuration | 1 | Editor can configure events; no robust runtime execution or publish guardrail. | Prototype. |
| P0-14 | Grid Cell Change Event Configuration | 1 | Event type exists in docs/types but no table/grid cell runtime semantics. | Prototype. |
| P0-15 | Action Placement Configuration | 2 | Toolbar/button/action menu components exist, but action semantics and validation are incomplete. | Behind benchmark action workflows. |
| P0-16 | Missing from feature matrix | N/A | Not listed in the requirements table despite 63-feature claim. | Documentation gap. |
| P0-17 | Save / Publish / Rollback | 2 | API exists and smoke passed; lacks validation, concurrency, and audit rigor. | Behind lifecycle governance in mature tools. |
| P0-18 | Preview with Context Simulation | 1 | Preview renders tree but rule/data/context simulation is stubbed. | Far behind high-fidelity previews. |
| P0-19 | Publish Validation (41 rules V001-V051) | 1 | Client validator partial and incompatible with seed; no server enforcement. | Stop-ship gap. |
| P0-20 | Runtime Renderer Contract | 1 | Runtime API returns payload; renderer contract and component parity are incomplete. | Far behind production runtime platforms. |
| P1-21 | ViewCode / Process View Support | 2 | ViewCode validation exists; runtime lookup ambiguous without entity/surface uniqueness. | Risky compared with stable route/process IDs. |
| P1-22 | Transaction Totals Panel | 1 | No implemented totals runtime/editor behavior. | Prototype. |
| P1-23 | Dynamic Tax / Charge Columns | 1 | Not implemented beyond possible metadata placeholders. | Prototype. |
| P1-24 | Relationship Panel Builder | 1 | Related list registry/renderer placeholder exists; relationship builder absent. | Far behind relational builders. |
| P1-25 | Rule-Based Visibility & Enablement Engine | 1 | Visibility builder exists; preview/runtime do not execute robustly. | Prototype. |
| P1-26 | Conditional Validation UX Layer | 1 | ValidationRuleEditor exists; enforcement not integrated. | Prototype. |
| P1-27 | Confirmation / Warning / Popup Configuration | 1 | Action type/config shell exists; modal/popup side effects not wired as runtime. | Prototype. |
| P1-28 | Action Rule Configuration | 1 | Event action editor exists; engine incomplete and not awaited. | Prototype. |
| P1-29 | Bulk Action Configuration | 1 | No production bulk action model found. | Prototype. |
| P1-30 | Saved View Configuration | 1 | No user-scoped saved view/personalization API. | Prototype. |
| P1-31 | Advanced Filter Builder | 1 | Filter/data-source fields are free text, no advanced query builder. | Prototype. |
| P1-32 | Role / Persona / Context Variants | 1 | Types/table exist, no API/service/UI lifecycle. | Prototype. |
| P1-33 | Permission-Aware Rendering (DOM removal) | 1 | Permission editor writes props; runtime resolver is standalone and not enforced. | Stop-ship for secure runtime. |
| P1-34 | Cascading Lookup Configuration | 1 | Not implemented as a runtime data dependency system. | Prototype. |
| P1-35 | Modal / Drawer / Side Panel Builder | 1 | Registry entries and partial renderers exist; no full builder/runtime flow. | Prototype. |
| P1-36 | Record Summary / Highlights Panel | 1 | Not implemented as a distinct runtime/editor feature. | Prototype. |
| P1-37 | Missing from feature matrix | N/A | Not listed in the requirements table despite 63-feature claim. | Documentation gap. |
| P1-38 | Attachment / Notes / Audit Timeline | 1 | Registry mentions activity/notes surfaces; transaction-grade behavior absent. | Prototype. |
| P1-39 | View Dependency / Impact Analysis | 1 | No dependency API; plugin removal/view change impact absent. | Prototype. |
| P1-40 | Schema Change Sync Indicator | 1 | `SyncStatus` type exists; no route/service/UI lifecycle found. | Prototype. |
| P1-41 | Builder Guardrails / Linting | 2 | Client validator exists but has wildcard/schema mismatches and no server enforcement. | Incomplete. |
| P1-42 | Semantic Diff Between View Versions | 2 | Client-side diff exists; no canonical server diff or semantic domain model. | Incomplete. |
| P1-43 | Audit Trail for UI Configuration Changes | 1 | Publish/rollback/archive logs only; save/create/import/plugin audit incomplete. | Incomplete for compliance. |
| P2-44 | Template Gallery (10 presets) | 1 | Local browser templates only, no curated gallery or tenant sharing. | Prototype. |
| P2-45 | Component Presets | 1 | No component instance preset lifecycle found. | Prototype. |
| P2-46 | Dashboard Builder (`dashboard` surface) | 1 | DashboardLayoutEditor config exists; no runtime data/grid engine. | Prototype. |
| P2-47 | Kanban View (`kanban` surface) | 1 | Surface and registry placeholders; no Kanban runtime. | Prototype. |
| P2-48 | Wizard Builder (`wizard` surface) | 1 | WizardStepEditor config exists; no runtime navigation/validation engine. | Prototype. |
| P2-49 | Console/Split View (`split_view` surface) | 1 | Surface exists; split/console runtime incomplete. | Prototype. |
| P2-50 | Personalization | 1 | No per-user layout/filter/column personalization API. | Prototype. |
| P2-51 | Runtime Usage Analytics | 1 | No telemetry events or analytics pipeline found. | Prototype. |
| P2-52 | Performance Budgeting | 1 | No render budget measurement or pre-publish budget gate. | Prototype. |
| P2-53 | Accessibility Checks | 1 | No A001-A005 pre-publish checks found. | Prototype. |
| P2-54 | Localization Checks | 1 | No L001-L004 checks or i18n key model found. | Prototype. |
| P2-55 | Advanced Expression Mode | 1 | Expression API exists elsewhere; Studio expression editing is textarea-level and not integrated with rule validation. | Prototype. |
| P2-56 | No-Code Rule Builder Wizard | 1 | No wizard-level rule builder found. | Prototype. |
| P2-57 | AI-Assisted View Generation | 1 | NLP client path mismatches backend; no end-to-end view generation flow. | Prototype. |
| P2-58 | AI Layout Refactoring | 1 | Not implemented. | Prototype. |
| P2-59 | AI Broken Binding Explanation | 1 | Not implemented. | Prototype. |
| P2-60 | Guided Builder Walkthroughs | 1 | Not implemented. | Prototype. |
| P2-61 | View Documentation Generator | 1 | Type/doc intent exists in requirements only; no `GET /documentation` route. | Prototype. |
| P2-62 | Export / Import Metadata | 2 | Client JSON import/export works; lacks server validation, dependency packaging, and audit. | Incomplete. |
| P2-63 | View Clone with Delta Tracking | 1 | Client clone creates a new view; no `cloned_from_view_key` or delta tracking. | Prototype. |

## Backend Review

Strengths:

- `viewstudio` has a clear package boundary and a practical CRUD-ish API shape.
- Go/TS surface type alignment exists for the main surface codes.
- Docker-backed `go test ./...` passes, and the basic View Studio API smoke flow works.
- Migrations provide foundational tables for component registry, plugins, publish log, event definitions, datasource overrides, and variants.

Production gaps:

- Auth and tenant isolation are not production-safe.
- Publish is a state flip, not a compile/validate/govern operation.
- Database constraints are too loose for a runtime registry: no enforced surface enum/check, no strong view-code uniqueness, no one-active-version invariant, no optimistic concurrency.
- Several important errors are ignored in repo methods.
- Error responses lack codes/details/correlation IDs.
- Types and tables exist for advanced governance features, but routes/services do not.
- Plugin registration is only metadata storage and is unsafe for real bundle loading.
- `internal/viewstudio` has no backend tests despite being a production-critical subsystem.

## Frontend Review

Strengths:

- The designer has a recognizable studio shell: list page, canvas, palette, component tree, property panel, binding panel, data source panel, event panel, version history, import/export, permissions, validation, plugins, dashboard, and wizard panels.
- React Query hooks are organized around Studio API resources and invalidate major view queries after mutations.
- TypeScript build passes and code is reasonably modular.
- The preview fallback avoids a blank canvas when a renderer is missing.

Production gaps:

- The field picker does not receive primary entity metadata correctly.
- The designer allows invalid component placement instead of making illegal states hard to create.
- Many panels write configuration into payload props but have no corresponding runtime/server execution.
- Preview does not simulate real context, permissions, data, visibility, validation, or events.
- Component registry, mocks, validator, and render map use inconsistent naming and wildcard conventions.
- Import/export/templates are local and unaudited.
- No tests cover View Designer state, autosave, binding behavior, validator compatibility, renderer mapping, or designer interaction flows.

## Benchmark Comparison

Reference platforms used:

- Retool docs: https://docs.retool.com/
- Appsmith docs: https://docs.appsmith.com/
- Microsoft Power Apps canvas apps docs: https://learn.microsoft.com/en-us/power-apps/maker/canvas-apps/
- Mendix Studio Pro docs: https://docs.mendix.com/refguide/studio-pro-overview/
- OutSystems Service Studio docs: https://success.outsystems.com/documentation/11/getting_started/service_studio_overview/
- ServiceNow App Engine Studio docs: https://www.servicenow.com/docs/r/application-development/app-engine-studio/aes-overview.html

| Benchmark dimension | Excellon NexAI UI Studio today | Leading platform expectation |
|---|---|---|
| Auth and governance | Dev headers trusted; no production RBAC in reviewed path. | Authenticated identities, role/permission enforcement, environments, governance. |
| Data binding | Payload-level bindings with broken entity field discovery. | First-class data source/schema binding, queries, records, validation, and runtime state. |
| Component ecosystem | 76 components seeded, partial renderer/editor coverage. | Component editor/runtime parity and clear unsupported/deprecated lifecycle. |
| Runtime fidelity | Runtime API returns payload; preview is partial. | Preview and deployed runtime behave consistently with context and data. |
| Rules and events | Editor and partial engine exist, not production-wired. | Deterministic event/action graph, async handling, validations, debugging. |
| Deployment/publish | Basic publish/rollback works; validation missing. | Compile/validate/deploy pipeline with dependency and environment checks. |
| Audit/diff/compliance | Partial publish log and client diff. | Server-side immutable audit, semantic diff, dependency impact, rollback integrity. |
| AI assistance | NLP route mismatch; view generation not complete. | Optional accelerator, but not substitute for core runtime/governance. |

## Resolution Roadmap

### Phase 0 - Stop-Ship Foundations

1. Replace trusted dev headers with authenticated middleware and tenant membership checks.
2. Add server-side publish validation and structured error envelope.
3. Add DB constraints for surface, view code, active versions, version uniqueness, and optimistic concurrency.
4. Align frontend API routes with backend or generate a client from an OpenAPI contract.
5. Add View Studio backend integration tests for create/list/get/save/publish/rollback/archive/runtime/registry/plugin flows.

Acceptance gate: no unauthenticated request can mutate or read tenant data; invalid views cannot publish; duplicate view codes cannot create ambiguous runtime state; CI covers all P0 backend routes.

### Phase 1 - Registry and Runtime Parity

1. Normalize component codes and wildcard semantics across seed, mocks, validator, and renderers.
2. Require every active component to have runtime renderer, preview renderer, designer editor, schema validation, binding support, and event declaration.
3. Build a shared runtime renderer used by preview and production runtime.
4. Block publish for unsupported or fallback-rendered components.

Acceptance gate: registry compatibility test covers all 76 seeded components; preview/runtime golden tests pass for representative P0 surfaces.

### Phase 2 - Data, Binding, and Rules

1. Fix entity field picker by passing view metadata or fetching schema by primary entity.
2. Implement datasource override APIs and typed query/filter builder.
3. Wire event engine into preview/runtime with async action result/error model.
4. Enforce validation and permission rules both client-side and server/runtime-side.

Acceptance gate: a CRUD view can bind to real entity fields, render real records, execute field change rules, validate submission, and enforce permissions under automated tests.

### Phase 3 - Enterprise Governance

1. Implement variants, data-source overrides, event definitions, validation results, sync status, dependency impact, documentation, and semantic diff APIs.
2. Add immutable audit for every Studio change.
3. Add import/export package validation, clone lineage, and environment promotion semantics.
4. Harden plugin model with manifest, SRI/signature, sandbox, compatibility, and dependency checks.

Acceptance gate: auditors can reconstruct who changed what, when, why, and which runtime views were affected.

### Phase 4 - Designer Maturity

1. Make invalid component placement impossible in drag/drop and move operations.
2. Build schema-aware property editors for arrays, objects, enums, conditions, expressions, and collections.
3. Improve autosave with revision/etag conflict handling and clear dirty/saving/saved/conflict states.
4. Add keyboard, accessibility, responsive, and large-tree designer tests.

Acceptance gate: a business user can build a valid P0 CRUD/header-line view without manual JSON or unsupported free-text keys.

### Phase 5 - Benchmark Uplift

1. Add curated templates and component presets as tenant/team assets.
2. Add performance, accessibility, and localization pre-publish checks.
3. Add usage analytics and operational dashboards.
4. Build AI view generation/refactoring only after core runtime contracts are trustworthy.

Acceptance gate: UI Studio can be compared with benchmark platforms on production governance, not just builder appearance.

## Cannot Review / Limited Assurance Annex

- Production auth/RBAC, tenant membership, and real SSO integration cannot be fully verified because the reviewed build uses `DevContext` and trusted headers.
- Production observability, audit compliance, and incident workflows cannot be fully verified without deployment configuration, log aggregation, metrics, and compliance requirements.
- Plugin bundle safety cannot be fully verified because no real signed plugin packages, manifests, integrity metadata, or sandbox loader are present.
- Load testing, browser/device matrix, accessibility audits, and stakeholder UX acceptance were not performed. This review includes static analysis, local tests, Docker API smoke checks, and source evidence.
- The requirements feature matrix itself has a count mismatch: it claims 63 features but lists 61 explicit feature rows. Missing rows are `P0-16` and `P1-37`.

## Final Recommendation

Do not ship UI Studio to production yet. Treat the current implementation as an internal alpha/prototype foundation. The first production-readiness target should be a secure, validated P0 slice: authenticated tenant-safe CRUD view creation, schema-aware field binding, complete renderer parity for the P0 component set, server-side publish validation, deterministic save/publish concurrency, and focused automated tests. Once that slice is solid, expand into transaction workspaces, variants, plugins, advanced rules, and AI-assisted authoring.
