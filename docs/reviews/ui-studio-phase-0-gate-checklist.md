# UI Studio Phase 0 Gate Checklist

Phase: Phase 0 - Gate Infrastructure  
Purpose: establish the repeatable implementation, Gatekeeper, and Google Chrome evidence process before feature hardening begins.

## Dirty Worktree Inventory

Baseline before Phase 0 implementation:

```text
 M src/react/public/design-system/app.css
 M src/react/src/design-system/components/VirtualGrid.tsx
 M src/react/src/index.css
 M src/react/src/pages/admin/ViewDesignerListPage.tsx
?? docs/reviews/
```

These pre-existing source edits must not be reverted or overwritten by Phase 0.

## Milestones

| Milestone | Requirement | Evidence | Status |
|---|---|---|---|
| M0.1 | Dirty worktree inventory captured | This checklist records baseline dirty files | PASS |
| M0.2 | Playwright Chrome setup added | `src/react/playwright.config.ts`, `@playwright/test`, `npm.cmd run e2e:chrome` | PASS |
| M0.3 | Gate checklist template added | `docs/reviews/ui-studio-phase-gate-template.md` | PASS |
| M0.4 | Baseline UI Studio smoke test added | `src/react/e2e/ui-studio.phase0.spec.ts` | PASS |

## Critical Findings Coverage

| Finding | Phase 0 Coverage | Status |
|---|---|---|
| F18 | Adds the test foundation for later backend/frontend/contract/Chrome gates | PASS |

## Feature Scorecard Coverage

Phase 0 does not close user-facing feature scorecard items. It creates the test and evidence harness required to verify all later phases.

## Gatekeeper Review Requirements

The Gatekeeper must confirm:

- Phase 0 does not touch the pre-existing modified UI source files.
- Playwright is configured with a `chrome` project using Google Chrome channel.
- Baseline smoke test opens UI Studio list route and captures a screenshot.
- Mandatory backend, frontend, build, and Chrome commands either pass or have a documented environment blocker.
- Phase 1 has not started.

## Phase 0 Completion Evidence

Gatekeeper approval and Chrome verification completed.

| Evidence | Result |
|---|---|
| `git status --short` | Phase 0 files plus pre-existing UI source changes present; Playwright generated folders ignored. |
| `git diff --stat` | Phase 0 touched `.gitignore`, package files, `vite.config.ts`, Playwright config/spec, and review docs; pre-existing UI file diffs remain visible but unchanged from baseline. |
| Go tests | PASS - `docker compose run --rm --no-deps api go test ./...`. |
| React lint | PASS - `npm.cmd run lint`. |
| React tests | PASS - `npm.cmd test -- --run` with 6 files and 17 tests. |
| React build | PASS - `npm.cmd run build`. |
| Chrome Playwright | PASS - `npm.cmd run e2e:chrome -- --trace on` with 1 Chrome test passing. |
| Screenshot path | `src/react/test-results/e2e/ui-studio.phase0-Phase-0-U-bfa46-gle-Chrome-with-mocked-data-chrome/phase-0-ui-studio-list.png`. |
| Trace path | `src/react/test-results/e2e/ui-studio.phase0-Phase-0-U-bfa46-gle-Chrome-with-mocked-data-chrome/trace.zip`. |
