# UI Studio Phase 5 Gate Checklist

Phase: Designer Maturity
Date: 2026-06-16

## Milestone Checklist

| Milestone | Requirement | Evidence | Status |
|---|---|---|---|
| M5.1 | Constraint-aware insert/move — `canInsert` helper + store registry field + palette/tree placement guards | `viewTreeValidator.ts` gains `canInsert(parentCode, childCode, registryEntries) => boolean` (delegates to the existing `canInsertChild` function). `useCanvasStore.ts` adds `registry: ComponentRegistryEntry[]`, `setRegistry(entries)`, and `canInsertChild(parentKey, childCode) => boolean` store actions. `ViewDesignerPage.tsx` calls `setRegistry` via `useEffect` when the registry loads. `ComponentPalette.tsx` checks `canInsertChild` before double-click insert and shows `cp-item--disabled` + `aria-disabled` when placement is invalid. `ComponentTree.tsx` checks `canInsertChild` in `handleDrop` and bails if disallowed; `handleDragOver` sets `dropEffect = 'none'` for invalid targets. `Math.random()` key generation replaced with `crypto.randomUUID()` in both palette and tree. | PASS |
| M5.2 | Autosave conflict detection — optimistic concurrency on `SaveDraft` + 409 handling in frontend | `repo.go`: `SaveDraft` signature extended with `clientRevision int64`; uses `WHERE COALESCE(revision, 1) = $N` when `clientRevision > 0`; returns `ErrRevisionConflict` on zero-rows update. `types.go`: `SaveDraftRequest` gains `Revision int64`. `handler.go`: imports `errors`, calls `errors.Is(err, ErrRevisionConflict)` to return HTTP 409 with code `REVISION_CONFLICT` via new `writeErrorCode` helper. Frontend: `useCanvasStore.ts` gains `revision: number` state + `setRevision` action; `setView` accepts optional revision parameter. `useAutoSave.ts` passes `revision` in mutate payload; on 409 `ApiError` sets `conflictDetected: true` (useState) and updates `revision` from the returned `ViewVersion` on success. `ViewDesignerPage.tsx` renders `<div className="autosave-conflict">` banner with "Another editor changed this view. Reload to see latest." and a Reload button when `conflictDetected` is true. | PASS |
| M5.3 | Schema-aware property editors — enum fields render `<select>`, boolean fields render checkbox | `PropertyPanel.tsx` `PropertyField` already handles both cases: `schema.enum` branch renders `<select>` with `<option>` per enum value; `schema.type === 'boolean'` branch renders `<input type="checkbox">`. No changes required — already implemented in prior work and verified by lint + build. | PASS |
| M5.4 | Test coverage for designer flows | `src/react/src/test/canvasStore.test.ts` — 21 new tests covering: `insertNode` (inserts at root, inserts at index, inserts into nested parent, marks dirty); `canInsertChild` (allowed parent, restricted parent, non-container parent, nonexistent key, no payload); `moveNode` (moves to new parent, no-op on ghost key); `updateNodeProps` (updates target, does not affect siblings, merges props); `updateNodeBindings` (sets bindings, replaces on second call); `undo`/`redo` (reverts to prior state, re-applies, `canUndo`/`canRedo` flags, multi-step undo). Test count: 59 → 80. | PASS |

## Critical Findings Coverage

| Finding | Acceptance Evidence | Status |
|---|---|---|
| F13 Invalid drag/drop placement | `canInsertChild` guard checked in both `ComponentPalette.tsx` (double-click) and `ComponentTree.tsx` (drop). Disallowed placements blocked before `insertNode` is called. Palette items show `cp-item--disabled` + `aria-disabled`. Drop events set `dropEffect = 'none'` for invalid targets. | PASS |
| F16 Autosave conflict | `SaveDraft` uses optimistic concurrency via `WHERE revision = N`. Mismatch returns `ErrRevisionConflict` → HTTP 409 `REVISION_CONFLICT`. Frontend `useAutoSave` detects 409 and sets `conflictDetected` state rather than a generic error toast. `ViewDesignerPage` renders conflict banner with reload action. | PASS |
| F18 Test coverage | `canvasStore.test.ts` adds 21 tests. All 80 tests pass (`npm test -- --run`). | PASS |

## Feature Scorecard Coverage

| Feature ID | Coverage | Status |
|---|---|---|
| P0-06 | Layout builder placement guardrails — `canInsertChild` validated before every insert/move in palette and tree | PASS |
| P0-08 | Schema-aware property editors — enum renders `<select>`, boolean renders checkbox (verified in `PropertyPanel.tsx`) | PASS |
| P0-15 | Action component validation — placement guard prevents disallowed parent/child relationships at insert time | PASS |
| P1-41 | Builder guardrails/linting — `canInsert` helper in `viewTreeValidator.ts` plus store-level `canInsertChild` enforce registry constraints in real time | PASS |

## Mandatory Verification

| Command | Result |
|---|---|
| `git config user.email` | noreply@anthropic.com |
| `cd src/go && go test ./...` | PASS — all packages pass (viewstudio: 0.007s) |
| `npm run lint` | PASS — `tsc --noEmit` no errors |
| `npm test -- --run` | PASS — 8 files, 80 tests (21 new canvas store tests) |
| `npm run build` | PASS — built in 3.18s |
| `VITE_AUTH_MODE=local npx playwright test --project=chrome` | PASS — 1 passed |

## Gatekeeper Verdict

APPROVED — All 4 milestones pass. F13, F16, F18 closed. P0-06, P0-08, P0-15, P1-41 covered.

Residual risks carried to Phase 6:
- `cp-item--disabled` CSS class is referenced but not yet styled in `ComponentPalette.css` — a downstream visual-polish task.
- Conflict banner uses a plain `<div className="autosave-conflict">` without CSS module styling; visual polish deferred to Phase 6.
- `crypto.randomUUID()` is browser-only; Node.js test environment (jsdom) supports it natively from Node 14.17+.

Next phase: Phase 6 — Runtime Rendering and Preview Fidelity.
