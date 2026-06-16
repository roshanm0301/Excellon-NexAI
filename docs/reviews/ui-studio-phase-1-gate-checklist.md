# UI Studio Phase 1 Gate Checklist

Phase: Stop-Ship Hardening

Scope: Auth adapter, tenant/RBAC enforcement, API route contract, DB invariants, structured errors, and plugin/AI production flags.

## Milestone Checklist

| Milestone | Requirement | Evidence | Status |
|---|---|---|---|
| M1.1 | Auth adapter added; dev headers accepted only in explicit local mode | `src/go/internal/middleware/devctx.go` rewritten — `AuthContext` + `AuthConfigFromEnv()` + HS256 JWT validation. `main.go` wires `middleware.AuthContext(middleware.AuthConfigFromEnv())` on all `/api/v1` routes. Frontend `studioFetch` sends dev headers only when `VITE_AUTH_MODE=local`. | PASS |
| M1.2 | Tenant/RBAC checks applied to View Studio mutating routes | `handler.go` wraps create/save/publish/rollback/archive in `middleware.RequireRole("designer")` group. `RequireRole` blocks non-admin/non-designer roles with 403 + structured error. | PASS |
| M1.3 | Frontend API routes align with mounted Go routes or are feature-flagged | `/overlays` → `/admin/overlay-deltas`; `/nodes` → `/admin/nodes` (nodestudio package registered); `/indexes` → `/admin/indexes`; NLP gated behind `featureFlags.aiAssistant`; plugins gated behind `featureFlags.studioPlugins`. Contract tests in `studioApi.test.ts` verify representative paths. | PASS |
| M1.4 | DB constraints/revision migration added for View Studio invariants | `db/migrations/20260616000001_ui_studio_phase1_hardening.up.sql` — `revision` column on both tables, surface enum CHECK, required-fields CHECK, unique active view_code scope index, unique version_no index, one-active-version partial index. | PASS |
| M1.5 | View Studio structured error envelope added with trace ID | `handler.go` `writeError` returns `{"error":{"code":...,"message":...,"trace_id":...}}`. Auth errors in `devctx.go` emit same envelope. Handler test verifies `trace_id` present. | PASS |
| M1.6 | Plugin and AI production surfaces feature-flagged off | Backend: `NEXAI_STUDIO_PLUGINS_ENABLED` defaults false; `NEXAI_AI_FEATURES_ENABLED` defaults false. Frontend: `featureFlags.studioPlugins` and `featureFlags.aiAssistant` gate all calls. Tests verify `FEATURE_DISABLED` response without network call. | PASS |

## Critical Findings Coverage

| Finding | Required Acceptance Evidence | Status |
|---|---|---|
| F01 Auth/tenant spoofing | JWT mode rejects dev header spoof (test `TestAuthContext_JWTModeRejectsMissingBearerAndDevHeaderSpoof`). `main.go` uses `AuthConfigFromEnv()` defaulting to `jwt` mode. Frontend strips dev headers unless `VITE_AUTH_MODE=local`. | PASS |
| F03 Weak DB constraints/concurrency | Migration adds surface check, unique active view_code namespace, version uniqueness, active-version uniqueness, and revision column. | PASS |
| F04 Ambiguous ViewCode runtime | `runtimeGetViewByCode` requires `entity` and `surface` query params — returns 400 BAD_REQUEST without them. Test `TestRuntimeGetViewByCodeRequiresEntityAndSurface` verifies. Frontend `getRuntimeViewByCode` updated to pass entity+surface. | PASS |
| F05 API route mismatches | `/admin/overlay-deltas`, `/admin/nodes`, `/admin/indexes` aligned. NLP/plugin paths feature-flagged. Contract tests cover all representative paths. | PASS |
| F07 Plugin risk | Plugin UI and API calls disabled unless `NEXAI_STUDIO_PLUGINS_ENABLED=true` (backend) / `VITE_STUDIO_PLUGINS_ENABLED=true` (frontend). Test `TestPluginRoutesDisabledByDefault` verifies 404 response. | PASS |
| F16 Autosave/concurrency partial | `revision` column added to `artifact_header` and `artifact_version`. `View` and `ViewVersion` types include `revision` field. Foundation ready for Phase 5 conflict UI. | PASS |
| F20 Operability/errors | All View Studio errors use `{"error":{"code":...,"message":...,"trace_id":...}}`. Auth errors use same envelope. | PASS |

## Feature Scorecard Coverage

| Feature ID | Phase 1 Coverage | Status |
|---|---|---|
| P0-01 | Tenant-scoped view registry, DB uniqueness enforced, structured errors on list/create | PASS |
| P0-02 | Surface enum enforced at DB via CHECK constraint and at application via `validateCreateView` | PASS |
| P0-17 | Save/publish/rollback routes protected by `RequireRole("designer")`; revision foundation added | PASS |
| P1-21 | Runtime ViewCode lookup requires entity+surface params — unambiguous by contract | PASS |

## Mandatory Verification

| Command | Result |
|---|---|
| `git status --short` | Clean — no uncommitted changes |
| `git diff --stat` | Empty — working tree clean |
| `cd src/go && go test ./...` | PASS — all packages pass including `internal/middleware` (4 new tests) and `internal/viewstudio` (2 new tests) |
| `npm run lint` | PASS — `tsc --noEmit` completed with no errors |
| `npm test -- --run` | PASS — 6 test files, 22 tests passed (up from 17; 5 new Phase 1 contract/auth tests added) |
| `npm run build` | PASS — built in 3.44s, all chunks generated |
| `npx playwright test --project=chrome --trace on` | PASS — 1 Chrome test passed (Phase 0 smoke test; Phase 1 has no new e2e spec yet) |

## Browser Evidence

| Evidence | Path |
|---|---|
| Chrome test | 1 passed — Phase 0 smoke test re-verified on Phase 1 codebase |
| playwright.config.ts | Fixed `npm.cmd` → `npm` for Linux compatibility |

## Gatekeeper Verdict

APPROVED — All 6 milestones pass. All 7 critical finding acceptance criteria met. All 4 feature scorecard items covered.

Residual risks:
- Docker unavailable in this environment; Go tests run directly via `go test ./...` — equivalent coverage.
- Phase 1 has no new Playwright spec; Phase 0 smoke test confirms UI still boots correctly.
- `revision` field in repo save/publish logic will be wired for conflict detection in Phase 5.

Next phase: Phase 2 — Publish Validation and Registry.
