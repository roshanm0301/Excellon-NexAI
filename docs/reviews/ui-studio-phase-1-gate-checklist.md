# UI Studio Phase 1 Gate Checklist

Phase: Stop-Ship Hardening

Scope: Auth adapter, tenant/RBAC enforcement, API route contract, DB invariants, structured errors, and plugin/AI production flags.

## Milestone Checklist

| Milestone | Requirement | Evidence | Status |
|---|---|---|---|
| M1.1 | Auth adapter added; dev headers accepted only in explicit local mode | Pending | TODO |
| M1.2 | Tenant/RBAC checks applied to View Studio mutating routes | Pending | TODO |
| M1.3 | Frontend API routes align with mounted Go routes or are feature-flagged | Pending | TODO |
| M1.4 | DB constraints/revision migration added for View Studio invariants | Pending | TODO |
| M1.5 | View Studio structured error envelope added with trace ID | Pending | TODO |
| M1.6 | Plugin and AI production surfaces feature-flagged off | Pending | TODO |

## Critical Findings Coverage

| Finding | Required Acceptance Evidence | Status |
|---|---|---|
| F01 Auth/tenant spoofing | Unauthenticated requests fail outside local mode; dev identity headers ignored outside local mode; tenant-scoped repo calls remain enforced. | TODO |
| F03 Weak DB constraints/concurrency | Migration adds surface check, unique active view-code namespace, version uniqueness, active-version uniqueness, and revision column. | TODO |
| F04 Ambiguous ViewCode runtime | Runtime by-code lookup requires entity and surface query params. | TODO |
| F05 API route mismatches | Frontend paths align with backend route mounts; route contract test covers representative paths. | TODO |
| F07 Plugin risk | Plugin UI and API calls are disabled unless feature flag is explicitly enabled. | TODO |
| F16 Autosave/concurrency partial | Revision field exists in DB/API types and save response, ready for Phase 5 conflict UI. | TODO |
| F20 Operability/errors | View Studio errors use `{error:{code,message,details,trace_id}}`. | TODO |

## Feature Scorecard Coverage

| Feature ID | Phase 1 Coverage | Status |
|---|---|---|
| P0-01 | Tenant-scoped view registry, DB uniqueness, structured list/create errors | TODO |
| P0-02 | Surface enum DB/application enforcement | TODO |
| P0-17 | Save/publish/rollback routes protected and revision-aware foundation added | TODO |
| P1-21 | Runtime ViewCode contract made unambiguous through entity/surface lookup | TODO |

## Mandatory Verification

| Command | Result |
|---|---|
| `git status --short` | Pending |
| `git diff --stat` | Pending |
| `docker compose run --rm --no-deps api go test ./...` | Pending |
| `npm.cmd run lint` | Pending |
| `npm.cmd test -- --run` | Pending |
| `npm.cmd run build` | Pending |
| `npm.cmd run e2e:chrome -- --trace on` | Pending after gatekeeper approval |

## Browser Evidence

| Evidence | Path |
|---|---|
| Chrome screenshot | Pending |
| Chrome trace | Pending |

## Gatekeeper Verdict

Pending.

