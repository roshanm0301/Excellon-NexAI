# UI Studio — Phase 5: Claude Code Implementation Blueprint

**Excellon Enterprise Platform · UI Studio product**
Status: Draft · governed by Constitution v1.0, PDR, Phase 2–4
Scope: implementation-ready work breakdown (Epic → Feature → Story → Task). Backend mocked (Phase 4 §6). Task fields: **Objective · Create · Modify · Acceptance · Deps.** File paths use the Phase 4 §1 structure.

## Build order & dependency graph
```
E1 Foundation → E2 Domain → E3 Services+Mocks → E4 State+Routing → E5 Shell
   → E6 Explorer ┐
   → E7 Asset Lib ├→ E8 Canvas → E9 Inspector → E10 Binding&Behavior → E11 Quality&Ship
                 ┘                                           → E12 Cross-cutting (continuous)
```
Each epic is shippable-incrementally and demoable against mocks. E12 (a11y, testing, perf, collaboration) runs continuously but is gated per epic.

---

## E1 — Project Foundation
**F1.1 Scaffolding & tooling**
- **T1.1.1 Scaffold Vite + React 19 + TS.** *Obj:* base app boots. *Create:* `vite.config.ts`, `tsconfig.json`, `index.html`, `src/app/App.tsx`, `src/main.tsx`. *Modify:* —. *Acceptance:* `pnpm dev` serves a blank App; strict TS on; path alias `@/`. *Deps:* none.
- **T1.1.2 Tailwind + shadcn init.** *Obj:* chrome styling ready. *Create:* `tailwind.config.ts`, `postcss.config.js`, `src/shared/ui/` (shadcn CLI), `components.json`. *Modify:* `App.tsx` (import styles). *Acceptance:* a shadcn `Button` renders themed. *Deps:* T1.1.1.
- **T1.1.3 Install & configure libraries.** *Obj:* stack available. *Create:* `src/shared/query/client.ts` (QueryClient), `src/app/providers.tsx` (Query, Router, DnD providers). *Modify:* `App.tsx`. *Acceptance:* providers mount; app boots with QueryClientProvider + DndProvider. *Deps:* T1.1.1.
- **T1.1.4 Tooling & guardrails.** *Obj:* enforce standards. *Create:* `.eslintrc` (incl. **import-boundary rule: `runtime-preview` ≠ `shared/ui`**, no deep feature imports), `.prettierrc`, `vitest.config.ts`, `playwright.config.ts`, CI script. *Modify:* `package.json` scripts. *Acceptance:* lint fails on a cross-boundary import; `pnpm test`/`test:e2e` run. *Deps:* T1.1.1.

**F1.2 Folder structure**
- **T1.2.1 Create feature-sliced skeleton + barrels.** *Obj:* structure per Phase 4 §1. *Create:* all `src/**` folders with `index.ts` barrels and placeholder modules. *Modify:* `tsconfig` paths. *Acceptance:* every documented path exists; barrels export nothing-yet without errors. *Deps:* T1.1.1.

## E2 — Domain Layer (pure, UI-free)
**F2.1 Meta Model types** — **T2.1.1** *Obj:* typed Meta Model. *Create:* `src/domain/types/*` (NodeBase, ComponentNode, Page, View, Layout, Action, Event, State, WorkflowBinding, DataSource, Binding, OriginState, CascadeLevel, OverrideOp). *Acceptance:* discriminated unions compile; exhaustive `switch` type-checks. *Deps:* T1.2.1.
**F2.2 Cascade logic** — **T2.2.1** *Obj:* origin + resolution. *Create:* `src/domain/cascade/{deriveOrigin,resolveCascade,applyOverrideOps}.ts` + `__tests__`. *Acceptance:* unit tests cover set/merge/insert/remove/replace, most-specific-wins, orphan detection; 100% branch on these pure fns. *Deps:* T2.1.1.
**F2.3 Validation** — **T2.3.1** *Obj:* client checks. *Create:* `src/domain/validation/{brokenBinding,orphan,typeContract}.ts` + tests. *Acceptance:* returns typed `Issue[]`; tested against fixtures. *Deps:* T2.1.1.

## E3 — Services & Mocks
**F3.1 Interfaces + schemas** — **T3.1.1** *Obj:* engine contracts. *Create:* `src/services/interfaces/*` (Metadata, Compiler, Preview, Registry, Presence), `src/services/schemas/*` (Zod). *Acceptance:* every method typed; Zod schemas mirror types. *Deps:* E2.
**F3.2 HTTP clients** — **T3.2.1** *Obj:* real clients w/ boundary parsing. *Create:* `src/services/http/*` (fetch wrapper attaching auth + verified tenant claim `[L16][L17]`; `schema.parse` on responses). *Acceptance:* a contract-violating response throws before UI. *Deps:* T3.1.1.
**F3.3 Mocks (MSW)** — **T3.3.1** *Obj:* fixtures + in-memory store. *Create:* `src/mocks/fixtures/{dms-app,registry}.ts` (Vertical baseline + Toyota overlay + Dealer-X; entities SalesOrder/OrderLine; orderApproval workflow), `src/mocks/store.ts` (mutable). *Acceptance:* seed loads; mutations persist in-session. *Deps:* T3.1.1, E2. — **T3.3.2** *Obj:* handlers simulating real behavior. *Create:* `src/mocks/handlers/{metadata,compiler,preview,registry,presence}.ts`, `browser.ts`, `server.ts`. *Acceptance:* `preview.resolve` runs the **real** `resolveCascade`; `compiler.validate` runs real validation; latency/error toggles work. *Deps:* T3.3.1, F2.2/F2.3.
**F3.4 DI** — **T3.4.1** *Obj:* swap real/mock via MSW. *Create:* `src/services/index.ts`. *Modify:* `providers.tsx` (start MSW in dev). *Acceptance:* app runs fully against mocks; same http clients used. *Deps:* T3.2.1, T3.3.2.

## E4 — State & Routing
**F4.1 Zustand** — **T4.1.1** *Obj:* client state. *Create:* `src/stores/{workspace,selection,panels}.store.ts`. *Acceptance:* editingLevel/previewScope/selection/panel state typed + persisted to URL via E4.3. *Deps:* E1. 
**F4.2 Query layer** — **T4.2.1** *Obj:* keys + hooks. *Create:* `src/shared/query/keys.ts` (factory), `features/*/api/*` query/mutation hooks. *Acceptance:* changing editingLevel re-keys `tree`; override mutation optimistically updates + invalidates `tree`/`node`/`validate`. *Deps:* E3.
**F4.3 Router** — **T4.3.1** *Obj:* type-safe routes + context in search. *Create:* `src/routes/*` (`__root`, `home`, `signin`, `editor.$appId`, `editor.$appId.$pageId`, `settings`), Zod `validateSearch` (env/editingLevel/scopeId/previewScopeId/selection), loaders prefetching `tree`. *Modify:* `router.tsx`, `providers.tsx`. *Acceptance:* deep-link restores full context; loaders prevent flicker; Zustand mirrors router on load. *Deps:* T4.1.1, T4.2.1.

## E5 — App Shell
**F5.1 Mount** — **T5.1.1** providers + shell layout grid. *Create:* `src/app/ShellLayout.tsx`, `ResizablePanelGroup` regions. *Acceptance:* four regions resize/persist. *Deps:* E4.
**F5.2 Context Bar** — **T5.2.1** editing-level `Select` (role-gated `[L13]`), preview-scope `Select`, Validate/Publish buttons, presence avatars. *Create:* `features/cascade-context/components/ContextBar.tsx`. *Acceptance:* level change re-badges (drives E6); preview change re-renders Canvas; level options gated by role. *Deps:* T5.1.1, E4.
**F5.3 Activity Bar + docks** — **T5.3.1** activity icons toggle panels; bottom dock (Problems/Preview tabs). *Create:* `app/ActivityBar.tsx`, `app/BottomDock.tsx`. *Acceptance:* mode switching shows correct panels. *Deps:* T5.1.1.
**F5.4 Command Palette** — **T5.4.1** `⌘K` `Command` overlay (navigate/actions/level-switch/go-to-logicalKey). *Create:* `features/command-palette/*`. *Acceptance:* fuzzy search runs commands incl. switch-editing-level and jump-to-node. *Deps:* T5.1.1, E4.

## E6 — Explorer
**F6.1 Cascade switcher** (folded into ContextBar T5.2.1). **F6.2 Tree** — **T6.2.1** composition tree with origin badges + filters + context menu. *Create:* `features/explorer/components/{ExplorerTree,TreeItem,FilterBar}.tsx`, `OriginBadge` (shared primitive in `shared/ui`). *Acceptance:* nodes badged via `deriveOrigin(node, editingLevel)`; filters (all/mine/orphans) work; context actions (override-here/rename/delete/reveal) fire; empty/loading/error states (Phase 3 §3). *Deps:* E5, E2, E4. — **T6.2.2** selection sync with Canvas/Inspector. *Acceptance:* selecting in tree highlights in Canvas and loads Inspector. *Deps:* T6.2.1.

## E7 — Asset Library
**T7.1.1** archetype + component palette from catalogue, draggable cards (React DnD sources), profile-dimming. *Create:* `features/asset-library/*`. *Acceptance:* categories render from catalogue; cards are drag sources; unavailable items dimmed; empty/loading/error states. *Deps:* E5, E3.

## E8 — Canvas (highest-risk epic)
**F8.1 Renderer + node registry** — **T8.1.1** *Obj:* interpret ResolvedModel → runtime components. *Create:* `src/runtime-preview/{Renderer.tsx,componentMap.ts}` (semanticType→Excellon/MUI). *Acceptance:* a seeded page renders with sample data via runtime vocabulary; flow layout only `[L34]`. *Deps:* E3, E2. — **T8.1.2** *Obj:* rect tracking. *Create:* `runtime-preview/nodeRegistry.ts` (Map<logicalKey,rect>, ResizeObserver/IntersectionObserver). *Acceptance:* rects stay correct on scroll/zoom/reflow (OI-P4-1 — prototype-validate). *Deps:* T8.1.1.
**F8.2 Overlays** — **T8.2.1** selection/drop/badge layers positioned from `nodeRegistry`. *Create:* `runtime-preview/overlay/{SelectionLayer,DropTargetLayer,OriginBadgeLayer}.tsx`. *Acceptance:* handles/badges track nodes; absolute positioning here is chrome, not authored layout (no `[L34]` violation); overlays are pure fns of registry+selection. *Deps:* T8.1.2.
**F8.3 DnD** — **T8.3.1** region drop inserts + keyboard DnD. *Acceptance:* dropping a palette card inserts into a layout region (creates Component metadata via mutation); keyboard alternative works (a11y). *Deps:* T8.2.1, E7.
**F8.4 Toolbar & failure render** — **T8.4.1** breakpoint switcher, zoom/fit; **broken-binding red placeholder** consistent with runtime (OI-P3-3). *Acceptance:* breakpoints reflow; broken bindings render red boxes, not blanks. *Deps:* T8.1.1.
**F8.5 States** — **T8.5.1** empty/loading/error per Phase 3 §4. *Deps:* T8.1.1.

## E9 — Inspector
**T9.1.1** tabbed inspector + node header (origin badge). *Create:* `features/inspector/components/{InspectorPanel,NodeHeader}.tsx`. *Deps:* E8.
**T9.2.1** `PropertyRow` (label+control+origin+revert) + static↔bound toggle (`shared/ui`). *Acceptance:* per-property origin shown; revert-to-inherited works. *Deps:* T9.1.1.
**T9.3.1** RHF+Zod property forms from semantic contracts. *Acceptance:* invalid props blocked (Phase 3 §5 error); save → override/update mutation. *Deps:* T9.2.1, E3.

## E10 — Binding & Behavior
**T10.1.1** Registry Binding Picker (`Dialog`+`RegistryBrowser`+shape preview; no free text `[L6]`). *Acceptance:* only registry picks; type-incompatible disabled; bind → mutation. *Deps:* E9, E3.
**T10.2.1** Event/Action Builder (trigger, ordered actions, engine browsers, **valid-transition-only** picker `[L39]`, rule condition, security). *Acceptance:* invalid transition blocks save; wiring persists. *Deps:* E9, E3.
**T10.3.1** Override-here flow + revert (`AlertDialog`/`Popover`). *Acceptance:* editing inherited prompts override; node flips to overridden; revert restores inheritance. *Deps:* E6/E8/E9.

## E11 — Quality & Ship
**T11.1.1** Preview mode (as-Org/role/breakpoint, sample/real-ish data) using interpreted resolve. *Acceptance:* faithful per-Org render; no edit overlays. *Deps:* E8, E3.
**T11.2.1** Problems dock (validation issues, jump-to-node, re-validate). *Acceptance:* broken bindings + orphans listed cascade-aware. *Deps:* E3, E6.
**T11.3.1** Cascade Impact gate (affected OEMs/dealers/orphans before publish `[L45]`). *Acceptance:* publish blocked if impact can't compute (fail-safe). *Deps:* E3.
**T11.4.1** Publish/Promote + rollback (Compiler API; dev→staging→prod `[L48]`; re-pin rollback `[L25]`). *Acceptance:* build-fail surfaces in Problems (fail loud `[L21]`); success pins version. *Deps:* T11.2.1, T11.3.1.
**T11.5.1** Version history & diff (timeline per level, node diff, restore). *Acceptance:* node-level diffs render; restore recompiles. *Deps:* E3.

## E12 — Cross-cutting (continuous, gated per epic)
**T12.1.1** Collaboration: presence + node-level optimistic locks (poll transport). *Acceptance:* presence avatars; locked nodes block concurrent edit. *Deps:* E3.
**T12.2.1** Accessibility pass: keyboard operability (incl. DnD alt), focus mgmt, ARIA on tree/canvas/panels, labeled origin badges; WCAG 2.2 AA audit. *Acceptance:* axe/keyboard tests pass per surface. *Deps:* each epic.
**T12.3.1** Testing: unit (domain), integration (MSW-backed features), e2e (Playwright journeys J1–J5). *Acceptance:* coverage gates; J1–J5 green. *Deps:* each epic.
**T12.4.1** Performance: virtualize Explorer tree + Canvas grids; route/feature code-split; memoize origin derivation. *Acceptance:* large-fixture tree/grid stay within budget. *Deps:* E6, E8.

---

## Definition of Done (every task)
TypeScript strict passes · lint/import-boundaries pass · unit/integration tests for the task · a11y not regressed · works against MSW mocks · acceptance criteria demonstrably met · no constitution law violated (esp. `[L4][L6][L16][L19][L32][L34]`).

## Phase 5 summary & open items
**Covered:** complete Epic→Feature→Story→Task breakdown in dependency order, with the four required fields and a global Definition of Done.
**Open items into Phase 6:**
- OI-P5-1: E8 (Canvas, esp. T8.1.2 node registry) is the schedule risk; sequence a prototype spike before full E8 (carries OI-P4-1).
- OI-P5-2: Phase 6 prompts map 1:1 onto E1–E12 in this order; each prompt = one epic (or a large feature) with its tasks inlined.

*Next: Phase 6 — Claude Code Execution Prompts: self-contained, sequential prompts (Prompt 01 Setup → … ) each carrying context, acceptance criteria, coding standards, and testing requirements, derived from these epics.*
