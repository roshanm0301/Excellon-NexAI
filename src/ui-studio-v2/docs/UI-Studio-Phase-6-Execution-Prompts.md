# UI Studio — Phase 6: Claude Code Execution Prompts

**Excellon Enterprise Platform · UI Studio V2**
Status: Draft · governed by Constitution v1.0, PDR, Phase 2–5
Purpose: sequential, self-contained prompts to build **UI Studio V2** in **strict isolation** inside the existing `Excellon NexAI` repo, with zero coupling to the broken V1 code, strong anti-hallucination guardrails, and a mandatory verification gate between every prompt.

---

## A. How to use these prompts
1. Run **one prompt at a time**, in order (00 → 12). Do not batch.
2. After each prompt, Claude Code must pass the **Verification Gate** (§F of the contract) and output a **Self-Review Report**.
3. **You (human) review** the report + diff before running the next prompt. One prompt = one commit/PR.
4. Every prompt **inherits the Global Prompt Contract (§B–§H)** below. Paste the contract once at the top of the session, then paste each prompt in turn. (Or include a one-line "Obey the Global Prompt Contract" header in each.)

---

## B. GLOBAL PROMPT CONTRACT (inherited by every prompt)

> You are implementing **UI Studio V2**, a greenfield, fully isolated module inside the existing `Excellon NexAI` repository. You must obey every rule below in every prompt. These rules override any habit or convenience.

### §B.1 — Isolation firewall (V1 must not leak in)
- All V2 code lives **only** inside the V2 root directory (established in Prompt 00; default `ui-studio-v2/`).
- **Do NOT** read, import, reference, copy patterns from, or depend on **any** file outside the V2 root — including the existing Entity Designer, UI Studio (V1), Overlay, backend, or dockers.
- **Do NOT** modify **any** file outside the V2 root. If a task seems to require it, **STOP and ask**.
- **Do NOT** call or depend on the existing backend. The backend is **mocked via MSW** inside V2. There are no real API calls in this build.
- The V2-scoped `CLAUDE.md` (Prompt 00) is authoritative for this work; the repo's root `CLAUDE.md` does **not** apply to V2 and must not be edited.

### §B.2 — Anti-hallucination rules (non-negotiable)
- **Spec-only:** implement **exactly** what the prompt and the referenced specification (Phase 2–5) state — no more, no less. Do **not** invent files, components, props, endpoints, types, routes, or behaviors that are not specified.
- **Stop-and-ask:** if anything is ambiguous, missing, contradictory, or under-specified, **HALT and ask a precise question.** Never guess, never fabricate, never "fill in" with assumptions.
- **No invented dependencies:** use **only** the Approved Dependency Allowlist (§C). Adding/upgrading any package requires stopping and asking.
- **Single source of types:** all domain types come from `domain/types` (the Meta Model contract). Never redefine or duplicate them.
- **No silent deviation:** if you must deviate from the spec for a real technical reason, stop, state the reason, and ask — do not deviate silently.
- **Cite the source:** where a non-obvious decision is implemented, add a comment citing the spec doc/section (e.g. `// Phase 4 §7.2 overlay system`).

### §C — Approved Dependency Allowlist (frozen)
React 19, TypeScript, Vite, @tanstack/react-router, @tanstack/react-query, zustand, tailwindcss, shadcn/ui (+ Radix), react-dnd (+ html5/touch backends), react-hook-form, zod, msw, vitest, @testing-library/react, @playwright/test, @axe-core/playwright. **The runtime-preview canvas renders authored content via the runtime component vocabulary (Excellon DS / MUI Pro) — keep it isolated in `runtime-preview/` and never mix it with shadcn chrome.** Anything not listed → STOP and ask.

### §D — Coding standards
- TypeScript **strict**; **no `any`** (use `unknown` + narrowing); no non-null assertions without justification.
- Functional components + hooks; named exports; one component per file.
- **Feature-sliced** (Phase 4 §1); **no deep cross-feature imports** — go through `domain`, `services`, `shared`, or a feature `index.ts`.
- **No business logic in components** `[L4]`; logic lives in `domain/` or is dispatched via Actions/engines.
- **Zod-validate at every service boundary** `[L6]`; types flow from schemas.
- Accessibility: keyboard-operable, ARIA via Radix/shadcn, labeled origin badges; no color-only signals.
- No `localStorage`/`sessionStorage` misuse; client state in Zustand, server state in TanStack Query, form state in RHF.
- Conventional commits; one prompt = one commit/PR.

### §E — Testing requirements (per prompt)
- **Domain** (`domain/`): unit tests, high branch coverage on `cascade/` and `validation/` (target 100% on pure logic).
- **Features:** integration tests with **MSW** (real http clients, intercepted) — assert behavior, not implementation.
- **Journeys:** Playwright e2e for the five user journeys (Phase 2 §4) as they become reachable; `@axe-core/playwright` a11y assertions per surface.
- **Coverage gate:** the build fails below the configured thresholds.
- No test may call the real backend or any V1 code.

### §F — Verification Gate (must pass before the next prompt)
Run and report, in order:
1. `pnpm typecheck` (tsc --noEmit) — **0 errors**.
2. `pnpm lint` — **0 errors**, including the **isolation boundary rule** (no imports escaping V2 root).
3. `pnpm test` (unit + integration) — **all green**, coverage gate met.
4. `pnpm build` — **succeeds**.
5. (where journeys reachable) `pnpm test:e2e` — **green**.
Then output a **Self-Review Report** (§G). If any step fails, **fix within the same prompt**; do not proceed.

### §G — Self-Review Report (output at end of every prompt)
```
PROMPT <n> — SELF REVIEW
Files created:    <list>
Files modified:   <list, must be empty outside V2 root>
Acceptance:       <each criterion → met/not + how>
Tests:            typecheck ✓ lint ✓ unit ✓ integ ✓ build ✓ e2e ✓/n-a, coverage %
Constitution:     no violation of [L4][L6][L16][L19][L32][L34] — confirmed
Deviations/asks:  <none | list with reasons>
Isolation:        no V1 reads/imports/edits — confirmed
```

### §H — Workflow
Implement only the current prompt's scope. Do not start the next epic. Commit, report, and **wait for human review.**

---

## C. THE PROMPTS

> Each prompt below assumes the Global Prompt Contract is in effect. Tasks reference Phase 5 IDs (full task detail — objective/files/acceptance/deps — lives there).

### Prompt 00 — Isolation & Bootstrap
**Context.** Establish the isolated V2 root inside the existing repo without touching V1.
**Do:**
1. **Inspect the repo read-only** (list top-level structure, detect monorepo/workspace tooling). **Do not modify anything.** Report findings and the proposed V2 location.
2. If the repo uses workspaces, create V2 as a new workspace package; otherwise create a self-contained top-level directory `ui-studio-v2/`. **Confirm location with me if ambiguous (stop-and-ask).**
3. Inside the V2 root, create a **V2-scoped `CLAUDE.md`** containing the Isolation firewall (§B.1) and Anti-hallucination rules (§B.2) verbatim, plus: *"This directory is UI Studio V2. It is independent of all other code in this repo. Never read, import, reference, copy, modify, or depend on anything outside this directory. The backend is mocked via MSW. The root CLAUDE.md does not apply here."*
4. Add the **isolation ESLint rule** (`no-restricted-imports`/import boundary) that **fails the build** on any import resolving outside the V2 root.
**Acceptance:** repo inspected read-only; V2 root created in the correct place; V2 `CLAUDE.md` present; isolation lint fails a deliberate test import from outside V2; **no file outside V2 modified.**
**Tests:** add a temporary `__isolation-check__` importing a V1 path → lint must fail → remove it.
**Deps:** none. **Gate:** §F (lint must catch the boundary).

### Prompt 01 — Project Foundation (Epic E1)
**Context.** Scaffold the V2 app and tooling. **Tasks:** T1.1.1–T1.1.4, T1.2.1.
**Do:** Vite + React 19 + TS strict; Tailwind + shadcn init; install **only** §C deps; providers (Query/Router/DnD); ESLint (with isolation + cross-feature boundary), Prettier, Vitest, Playwright, CI scripts; full feature-sliced folder skeleton + barrels + `@/` alias.
**Acceptance:** `dev` boots blank app; shadcn `Button` themes; all Phase 4 §1 folders exist; lint catches a cross-feature deep import.
**Tests:** trivial render test green; lint/boundary tests pass. **Deps:** Prompt 00. **Gate:** §F.

### Prompt 02 — Domain Layer (Epic E2)
**Context.** Pure, UI-free Meta Model + cascade + validation. **Tasks:** T2.1.1, T2.2.1, T2.3.1.
**Do:** `domain/types/*` (Meta Model unions); `domain/cascade/{deriveOrigin,resolveCascade,applyOverrideOps}`; `domain/validation/{brokenBinding,orphan,typeContract}`. Pure functions only — no React, no services.
**Acceptance:** discriminated unions exhaustive; override ops + most-specific-wins + orphan detection correct.
**Tests:** unit tests, **100% branch on `cascade/` and `validation/`**. **Deps:** Prompt 01. **Gate:** §F.

### Prompt 03 — Services & Mocks (Epic E3)
**Context.** Typed engine interfaces + http clients + MSW mocks simulating real cascade/validation. **Tasks:** T3.1.1, T3.2.1, T3.3.1, T3.3.2, T3.4.1.
**Do:** service interfaces + Zod schemas; http clients (Zod-parse responses; attach auth + verified tenant claim, never client-supplied `[L16]`); MSW fixtures (seeded DMS: Vertical baseline + Toyota overlay + Dealer-X; SalesOrder/OrderLine; orderApproval workflow) + in-memory mutable store; handlers where `preview.resolve` runs the **real** `resolveCascade` and `compiler.validate` runs the **real** validation; DI in `services/index.ts`; start MSW in dev.
**Acceptance:** app runs fully on mocks; mutations persist in-session; preview/validation use real domain logic; latency/error toggles work.
**Tests:** integration tests hitting handlers via real clients. **Deps:** Prompt 02. **Gate:** §F.

### Prompt 04 — State & Routing (Epic E4)
**Context.** The cascade-context wiring (Phase 4 §3.4). **Tasks:** T4.1.1, T4.2.1, T4.3.1.
**Do:** Zustand stores (workspace/selection/panels); query-key factory + query/mutation hooks (override mutation optimistic + invalidates tree/node/validate); TanStack Router tree with Zod `validateSearch` (env/editingLevel/scopeId/previewScopeId/selection) and loaders prefetching `tree`; Zustand mirrors router on load.
**Acceptance:** changing editingLevel re-keys `tree`; changing previewScope re-keys `preview` only; deep-link restores full context.
**Tests:** integration: level change → refetch + re-derive; route param round-trip. **Deps:** Prompt 03. **Gate:** §F.

### Prompt 05 — App Shell (Epic E5)
**Context.** VS Code-style shell + canvas frame. **Tasks:** T5.1.1–T5.4.1.
**Do:** ShellLayout (resizable panels); Context Bar (role-gated editing-level `Select` `[L13]`, preview-scope `Select`, Validate/Publish, presence); Activity Bar + bottom dock; Command Palette (`⌘K`, incl. switch-level + jump-to-logicalKey).
**Acceptance:** panels resize/persist; level change re-badges downstream; command palette runs commands.
**Tests:** integration + a11y (axe) on shell. **Deps:** Prompt 04. **Gate:** §F.

### Prompt 06 — Explorer (Epic E6)
**Tasks:** T6.2.1–T6.2.2. **Do:** composition tree + `OriginBadge` (shared primitive, glyph+label, not color-only) via `deriveOrigin`; filters (all/mine/orphans); context actions; selection sync. **Acceptance:** badges correct per editing level; orphans surfaced; empty/loading/error states (Phase 3 §3). **Tests:** integration + a11y. **Deps:** Prompt 05. **Gate:** §F.

### Prompt 07 — Asset Library (Epic E7)
**Tasks:** T7.1.1. **Do:** archetype + component palette from catalogue; React DnD drag sources; profile-dimming. **Acceptance:** categories from catalogue; cards draggable; unavailable dimmed; states. **Tests:** integration. **Deps:** Prompt 05. **Gate:** §F.

### Prompt 08 — Canvas (Epic E8 — highest risk; spike first)
**Context.** Per OI-P5-1, **first implement T8.1.2 (node-registry rect tracking) as a small spike and STOP for review** before the rest. **Tasks:** T8.1.1–T8.5.1.
**Do:** interpreted renderer (`runtime-preview/`, componentMap → Excellon/MUI, flow layout only `[L34]`); node registry (ResizeObserver/IntersectionObserver); overlay layers (selection/drop/badge — absolute positioning is **chrome, not authored layout**, no `[L34]` violation); React DnD region inserts + keyboard alternative; breakpoint switcher + zoom/fit; **broken-binding red placeholder consistent with runtime** (OI-P3-3); empty/loading/error states.
**Acceptance:** seeded page renders with sample data; overlays track nodes under scroll/zoom; drop inserts create Component metadata; broken bindings render red boxes.
**Tests:** integration (registry/overlay), a11y (keyboard DnD). **Deps:** Prompts 06–07. **Gate:** §F + **mandatory human review after the spike.**

### Prompt 09 — Inspector (Epic E9)
**Tasks:** T9.1.1–T9.3.1. **Do:** tabbed inspector + node header; `PropertyRow` (origin + revert) + static↔bound toggle; RHF+Zod property forms from semantic contracts (invalid props blocked; save → mutation). **Acceptance:** per-property origin + revert work; invalid blocked; persists. **Tests:** integration + form validation. **Deps:** Prompt 08. **Gate:** §F.

### Prompt 10 — Binding & Behavior (Epic E10)
**Tasks:** T10.1.1–T10.3.1. **Do:** Registry Binding Picker (registry-only, no free text `[L6]`, type-validated); Event/Action Builder (engine browsers, **valid-transition-only** `[L39]`, rule condition, security); Override-here flow + revert. **Acceptance:** invalid binding/transition blocked; wiring persists; override forks correctly `[L13]`. **Tests:** integration. **Deps:** Prompt 09. **Gate:** §F.

### Prompt 11 — Quality & Ship (Epic E11)
**Tasks:** T11.1.1–T11.5.1. **Do:** Preview mode (as-Org/role/breakpoint); Problems dock (cascade-aware issues, jump-to-node); Cascade Impact gate (fail-safe block if uncomputable `[L45]`); Publish/Promote + rollback (Compiler API; dev→staging→prod `[L48]`; re-pin `[L25]`; build-fail surfaces in Problems `[L21]`); Version history & diff. **Acceptance:** faithful per-Org preview; problems block publish; rollback works. **Tests:** integration + e2e journeys J1–J5. **Deps:** Prompt 10. **Gate:** §F (incl. e2e).

### Prompt 12 — Cross-cutting Hardening (Epic E12)
**Tasks:** T12.1.1–T12.4.1. **Do:** collaboration (presence + node-level optimistic locks, poll transport); full a11y pass (WCAG 2.2 AA, keyboard DnD, focus, labels); complete test suite (unit/integration/e2e) + coverage gates; performance (virtualize tree + grids, code-split, memoize origin derivation). **Acceptance:** locks prevent concurrent edits; axe passes per surface; J1–J5 green; large-fixture performance within budget. **Tests:** full suite. **Deps:** Prompt 11. **Gate:** §F (full).

---

## D. Phase 6 summary & open items
**Covered:** a Global Prompt Contract enforcing isolation, anti-hallucination, standards, testing, and a hard verification gate; Prompt 00 establishing the V1 firewall; and Prompts 01–12 mapped 1:1 onto the Phase 5 epics, each self-contained with context, acceptance, tests, and gate.

**Open items / asks:**
- OI-P6-1: **Repo layout** — paste your top-level structure + whether it uses workspaces (pnpm/yarn/nx) and where the frontend lives; I'll harden Prompt 00's exact V2 location and the isolation lint paths. Until then Prompt 00 inspects read-only and asks.
- OI-P6-2: Confirm the V2 root directory name (`ui-studio-v2/` default) and whether a separate dev port/Docker service is wanted to avoid colliding with V1.
- OI-P6-3: The Canvas spike (Prompt 08) is the one place I've inserted a mandatory mid-prompt human checkpoint; keep it.

*This completes the UI Studio design series (Discovery → PDR → Phase 2 UX → Phase 3 UI → Phase 4 Architecture → Phase 5 Blueprint → Phase 6 Prompts). The prompts are ready to execute once OI-P6-1/02 are confirmed.*
