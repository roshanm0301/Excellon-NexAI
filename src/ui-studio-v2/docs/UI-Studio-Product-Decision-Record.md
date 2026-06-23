# UI Studio — Product Decision Record (PDR)

**Excellon Enterprise Platform · UI Studio product**
Status: Approved (discovery complete) · governed by the Platform Constitution v1.0
Purpose: record every product/architecture decision for the UI Studio, with rejected alternatives and rationale, before Phase 2 (UX Spec). No implementation begins until this is reviewed.

A note on scope: the UI Studio is the *authoring application*. The backend engines (Entity Designer, Workflow, Rule, API, Security, Metadata, Runtime Renderer, Deployment, Environment Manager, AI Services, Compiler) are treated as existing services accessed via API and are **not** redesigned here.

---

## Summary of decisions

| # | Decision area | Decision | Source |
|---|---|---|---|
| PDR-01 | Tech stack scope | shadcn/Tailwind for Studio chrome; MUI Pro (Excellon DS) stays the runtime vocabulary | Interview Q1 |
| PDR-02 | Studio scope/identity | Internal capability (Option A) | Interview Q2 |
| PDR-03 | Primary user | Professional / semi-professional authors | Interview Q3 |
| PDR-04 | AI strategy | No AI in v1; AI-ready seams only | Interview Q4 |
| PDR-05 | Navigation paradigm | Hybrid: VS Code-style shell + design canvas | Interview Q5 |
| PDR-06 | Studio complexity | Structured hybrid (Retool-density + cascade-aware), not Figma-freeform | Carried |
| PDR-07 | Responsive model | Flow/auto-layout (stack/flex/grid); no absolute positioning | Carried [L34] |
| PDR-08 | Mobile strategy | Responsive-web/PWA-first; shared target-agnostic screen model; native deferred | Carried |
| PDR-09 | Component strategy | Enterprise DS (Excellon on MUI Pro) for runtime; shadcn headless for chrome | Carried [L32] |
| PDR-10 | Extensibility | Curated custom components; no open marketplace | Carried [L50] |
| PDR-11 | Collaboration | Node-level optimistic locking + presence; not realtime multiplayer | Carried |
| PDR-12 | Theme strategy | Design tokens + Vertical→OEM→Dealer theme cascade | Carried [L33] |
| PDR-13 | Centerpiece UX | Cascade-aware authoring (editing-level vs preview-level, origin states, override-here, impact) | Carried [L13] |
| PDR-14 | Authoring output | Studio writes Meta Model to the registry, never artifacts; publish via Compiler; interpreted preview | Carried [L19] |
| PDR-15 | Authoring scope | Authoring confined to Platform/Vertical/OEM; dealers do not author | Carried |

---

## Detailed records

### PDR-01 — Tech stack scope
**Context.** The brief named shadcn/ui + Tailwind; the platform locked Excellon DS on MUI Pro as the sole runtime vocabulary `[L32]`. Apparent conflict.
**Decision.** Two component systems with a clean boundary: **shadcn/ui + Tailwind builds the Studio's own chrome** (shell, panels, canvas frame, inspector); **MUI Pro (Excellon DS) remains the component vocabulary that authored applications render with at runtime.**
**Rationale.** The studio is an app like any other and benefits from headless, highly-customizable chrome (shadcn). What it *produces* must render through the governed design system `[L32]`. The two never mix: no MUI in the chrome, no shadcn in authored-app output.
**Rejected.** (b) shadcn replaces MUI at runtime — overturns `[L32]` and the design-system strategy. (c) MUI for both — makes bespoke studio chrome harder and heavier.
**Consequences.** The Studio repo carries two styling systems with an enforced lint/boundary rule. The canvas renders authored content via the *runtime* component mapping (Excellon/MUI), even though the surrounding chrome is shadcn — the canvas is a embedded preview surface, not chrome.

### PDR-02 — Studio scope/identity
**Context.** Brief framed "compete with FlutterFlow/Mendix, B2C"; platform locked Option A. The $100M review flagged this A/B tension as the #1 risk.
**Decision.** **Internal capability (Option A).** The Studio serves Platform/Vertical/OEM authors building on the Excellon platform.
**Rationale.** Building "compete with Power Apps" UX for a 10-OEM reality over-builds everything; focus beats breadth.
**Rejected.** (b) Commercial B2C competitor — far larger, riskier studio; contradicts other locked decisions. (c) Internal-now-commercial-later — kept available as a future amendment, not v1 scope.
**Consequences.** No marketplace UI, no third-party developer onboarding, no public template store in v1. UX optimizes for governed internal authoring.

### PDR-03 — Primary user
**Context.** Authors are Platform/Vertical/OEM analysts/engineers; dealers don't author.
**Decision.** **Professional / semi-professional authors.**
**Rationale.** Lets the Studio assume competence — keyboard-driven, dense, fewer wizards/guardrails than a citizen-dev tool.
**Rejected.** Citizen developers (demands heavy hand-holding UX we don't need); UX designers (pulls toward freeform, fights `[L34]`); mixed (dilutes focus).
**Consequences.** UX sophistication target = professional IDE-grade, not consumer-grade. Onboarding is training-based, not zero-learning.

### PDR-04 — AI strategy
**Context.** Constitution: AI-Ready, not AI-Native; no AI in v1. Brief re-raised it; $100M review noted competitive risk (C1).
**Decision.** **No AI in v1; AI-ready seams only** (per AI-Readiness Interface, Spec Doc 11).
**Rationale.** The model isn't proven, the team is building the hard compiler, and AI-into-an-unproven-model compounds risk. Seams keep it additive later.
**Rejected.** AI assistant (modest value, premature); AI copilot (strongest *eventual* story — generate into a governed model — but premature); autonomous builder (research bet).
**Consequences.** Studio ships with no AI features; designs leave defined hooks (suggestion/generation seams) unbuilt. Re-examine against the competitive clock post-runtime-proof.

### PDR-05 — Navigation paradigm
**Context.** The one IA decision genuinely open. Multi-panel, cascade-context-heavy, professional users.
**Decision.** **Hybrid: VS Code-style shell** (activity bar, collapsible docked panels, command palette, keyboard-first) **wrapping a structured design canvas** in the center.
**Rationale.** Fits professional authors and the dense cascade UX; avoids Figma-minimalism that hides the context the cascade needs.
**Rejected.** Traditional IDE (heavy/dated); Figma-style (hides too much for a metadata tool); pure VS Code (canvas feels secondary).
**Consequences.** Shell = shadcn-built activity bar + panels + command palette; center = the canvas (PDR-13). The shell+canvas balance is the hardest chrome design effort.

### PDR-06 — Studio complexity
**Decision.** **Structured hybrid** — Retool-grade data-density and binding ergonomics + cascade-aware composition; explicitly **not** a Figma freeform canvas.
**Rationale.** Projection-platform thesis `[L34]`; transaction-heavy archetypes; professional users.
**Rejected.** Figma-like (freeform breaks projection); FlutterFlow-like (mobile-codegen focus, off-target); Retool-only (lacks the cascade/composition model).
**Consequences.** Canvas is region/slot-based, not pixel-based.

### PDR-07 — Responsive model
**Decision.** **Flow/auto-layout** (stack, flex, grid, responsive-grid); absolute positioning forbidden `[L34]`.
**Rationale.** Maps to MUI, responsive by construction, and — critically — produces stable node identities that survive cascade overrides; absolute coordinates cannot be cascaded.
**Rejected.** Absolute positioning (uncascadeable, non-responsive); pure constraint-solver (overkill for authoring).
**Consequences.** Authors compose into layout regions; breakpoint behavior is declared metadata `[L36]`.

### PDR-08 — Mobile strategy
**Decision.** **Responsive-web/PWA-first; shared target-agnostic screen model; true-native deferred.**
**Rationale.** Core is transaction-heavy desktop B2B; native (React Native track) is a later decision; artifact stays target-agnostic `[L28]`.
**Rejected.** Native-only; separate mobile screens (forks the model); responsive-only forever (forecloses native).
**Consequences.** Studio authors one screen model with Mobile metadata hints; native renderer is contract-only for now.

### PDR-09 — Component strategy
**Decision.** **Enterprise Design System** — Excellon DS (MUI Pro) as the runtime vocabulary; shadcn (headless) for chrome (per PDR-01).
**Rationale.** `[L32]` single design system for authored apps; best-of-both for the studio itself.
**Rejected.** Material-only, fully-custom-from-scratch, headless-everywhere (each either re-solves solved problems or violates `[L32]`).
**Consequences.** Palette exposes the semantic catalogue (Spec Doc 06); chrome components are separate.

### PDR-10 — Extensibility
**Decision.** **Curated custom components**, reviewed and design-system-based; no open marketplace `[L50][L51]`.
**Rejected.** Open plugin marketplace (⚑ commercial fork); arbitrary components (ungovernable).
**Consequences.** Asset Library shows curated/approved components only.

### PDR-11 — Collaboration
**Decision.** **Node-level optimistic locking + presence + mergeable metadata diffs**; not Figma-style realtime multiplayer.
**Rationale.** Fits governed metadata with review gates; lighter to build; most editing is within-level/within-team.
**Rejected.** Single-user (too limiting); full realtime (heavy, risky for governed metadata).
**Consequences.** Presence indicators + lock/unlock + diff-on-publish, not live co-editing.

### PDR-12 — Theme strategy
**Decision.** **Design tokens + theme cascade** (Vertical→OEM→Dealer); branding via tokens, never component swapping `[L33]`.
**Rejected.** Per-application themes only (misses tenant branding); hard-coded themes (no cascade).
**Consequences.** Theme is a cascade-resolved object; Studio previews per-Org branding.

### PDR-13 — Centerpiece UX: cascade-aware authoring
**Decision.** The Studio's defining UX is **cascade legibility**: explicit editing-level vs preview-level, node origin states (inherited/overridden/own/suppressed/orphaned), "override here" gesture, per-property origin, and downstream impact awareness `[L13][L45]`.
**Rationale.** No competitor has a four-level cascade; this is the differentiator and the riskiest UX. (Investment review U1: prototype/user-test before building.)
**Consequences.** Drives Explorer, Inspector, Canvas, and Preview designs in Phase 2/3. Flagged for early prototype validation.

### PDR-14 — Authoring output
**Decision.** The Studio **writes Meta Model objects to the registry, never runtime artifacts** `[L19]`; publishing routes through the Compiler; in-Studio preview uses the interpreted preview path (Spec Doc 07 §7.6).
**Consequences.** Studio talks to the Metadata/registry API for authoring and the Compiler API for publish/validate; the canvas preview is interpreted, not the production artifact.

### PDR-15 — Authoring scope
**Decision.** Authoring is confined to **Platform/Vertical/OEM**; dealers consume the deployed product and never author `[L13]`.
**Consequences.** No dealer-facing studio surface; editing-level selector spans Platform/Vertical/OEM only.

---

## Open items into Phase 2
- OI-1: Validate the cascade-legibility UX (PDR-13) with a prototype/user test before committing the Studio build (Investment review U1). Highest UX risk.
- OI-2: Confirm the v1 archetype set the Studio must author first (recommend DMS-critical: List-Report, Transaction-Entry, Master-Detail, Object-Detail, Dashboard) — sizes the screen inventory.
- OI-3: Command-palette scope (navigation only vs. actions) for the VS Code-style shell.

---

*PDR complete. No implementation begins until this is reviewed. Next: Phase 2 — UX Specification (navigation architecture, information architecture, user journeys, screen inventory, interaction models, responsive authoring, AI-interaction seams, accessibility, collaboration, and per-screen detail), built on these decisions.*
