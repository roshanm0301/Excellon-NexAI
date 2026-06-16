# UI Studio Phase 2 Gate Checklist

Phase: Publish Validation And Registry
Date: 2026-06-16

## Milestone Checklist

| Milestone | Requirement | Evidence | Status |
|---|---|---|---|
| M2.1 | Canonical component codes normalized across seed, mocks, validator, renderers | All 46 active component codes verified as snake_case in `validation_test.go:TestRegistryComponentCodesMatchSnakeCase`. `ComponentRenderMap.tsx` header comment lists all 46 codes with renderer vs fallback status. | PASS |
| M2.2 | Wildcard/casing normalization | `viewTreeValidator.ts` accepts `all` wildcard (alongside `any`) in `allowed_parents`, `allowed_children`, `supported_surfaces`. Root validator accepts `page_root` (lowercase). Mock handler `views.ts` rebuilt with 25 canonical snake_case entries. Mock data `views.ts` normalized (committed separately). | PASS |
| M2.3 | JSON schema validation | `viewTreeValidator.ts` required-props check supports both top-level `required` array (JSON Schema draft-7) and `x-required: true` property markers. No new dependencies added. | PASS |
| M2.4 | Server publish validator | `validation.go` `ValidatePublish` implements V001–V005: non-null tree, `page_root` root, non-empty codes, depth ≤ 20, snake_case pattern. `publishView` handler calls validator before `repo.Publish`, returns 422 VALIDATION_ERROR with `{"error":{"code":"VALIDATION_ERROR","errors":[...],"trace_id":...}}`. `POST /views/{viewKey}/validate` dry-run route added. | PASS |
| M2.5 | Registry compatibility tests | `validation_test.go`: `TestRegistryComponentCodesMatchSnakeCase` (46 codes), `TestValidatorAcceptsPageRootWithKnownCodes`, `TestValidatorRejectsNilComponentTree` (V001), `TestValidatorRejectsNonPageRootRoot` (V002), `TestValidatorRejectsPascalCaseComponentCode` (V005), `TestValidatorRejectsEmptyComponentCode` (V003), `TestValidatorDepthLimit` (V004), plus 2 handler tests for validate route. | PASS |

## Critical Findings Coverage

| Finding | Acceptance Evidence | Status |
|---|---|---|
| F02 Missing publish validation | `publishView` returns 422 with machine-readable `errors` array before persisting. `TestValidateViewRoute*` tests cover the endpoint. Invalid trees (V001–V005) are blocked server-side. | PASS |
| F08 Registry/renderer mismatch | 46 active component codes tested against snake_case pattern. `ComponentRenderMap.tsx` annotated with renderer vs fallback status. Invalid (PascalCase) codes blocked by V005. | PASS |
| F09 Validator mismatch | `viewTreeValidator.ts` accepts `all` wildcard and `page_root` root. Mocks rebuilt from canonical seed codes. JSON Schema `properties`-based required check added. | PASS |

## Feature Scorecard Coverage

| Feature ID | Coverage | Status |
|---|---|---|
| P0-06 | Layout Builder — component placement now validated; invalid codes blocked at publish | PASS |
| P0-08 | Form Field Configuration — config_schema required-props validation added | PASS |
| P0-15 | Action Placement Configuration — action component codes normalized and validated | PASS |
| P0-19 | Publish Validation — V001–V005 server rules; V006–V051 foundation ready for Phase 3+ | PASS |
| P1-41 | Builder Guardrails / Linting — client validator fixed; server validator enforces on publish | PASS |

## Mandatory Verification

| Command | Result |
|---|---|
| `git status --short` | Clean |
| `git diff --stat` | Empty |
| `cd src/go && go test ./...` | PASS — 11 tests in `internal/viewstudio`, all 19 packages pass |
| `npm run lint` | PASS — `tsc --noEmit` no errors |
| `npm test -- --run` | PASS — 6 files, 22 tests |
| `npm run build` | PASS — built in 3.34s |
| `npx playwright test --project=chrome` | PASS — Phase 0 smoke test re-verified |

## Gatekeeper Verdict

APPROVED — All 5 milestones pass. F02, F08, F09 closed. P0-06, P0-08, P0-15, P0-19, P1-41 covered.

Residual risks carried to Phase 3:
- V006–V051 publish rules (binding resolution, entity schema checks, event validation) require entity schema endpoint from Phase 3.
- Renderer parity for fallback components deferred to Phase 3 shared runtime model.

Next phase: Phase 3 — Runtime, Binding, Permissions.
