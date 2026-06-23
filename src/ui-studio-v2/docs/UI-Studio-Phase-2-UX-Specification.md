# UI Studio — Phase 2: UX Specification

**Excellon Enterprise Platform · UI Studio product**
Status: Draft · governed by Constitution v1.0 and the UI Studio PDR
Scope: the **Studio's own UX** — the authoring application experience. Not the apps it produces. Surfaces are the Studio's screens; "components" below means the Studio's chrome (shadcn), except inside the canvas, which embeds an interpreted preview rendering authored content via the runtime vocabulary (Excellon DS / MUI Pro) per PDR-01/PDR-14.

Screen-inventory archetype scope (OI-2): List-Report, Transaction-Entry, Master-Detail, Object-Detail, Dashboard.

---

## 1. Studio UX design principles
1. **Professional, not consumer** (PDR-03): dense, keyboard-first, command-palette-driven; trusts competence over wizards.
2. **Cascade-legible at all times** (PDR-13): the author always knows which level they edit and what they inherit vs. override.
3. **Structured, not freeform** (PDR-06/07): compose into layout regions; no pixel canvas `[L34]`.
4. **Dense but calm:** high information density without clutter; progressive disclosure in panels.
5. **The model is the source of truth:** the UI authors metadata `[L2]`; the canvas is a faithful interpreted preview, not a drawing `[L19]`.
6. **Accessible by construction** (§9): the Studio is keyboard/AT-navigable, and it enforces accessible *output* `[L35]`.

---

## 2. Navigation Architecture

### 2.1 Two orthogonal navigation axes
The Studio's defining navigational idea: the author moves along **two axes at once**.
- **Composition axis** — *where in the app* (Application → Module → Page → View → Section → Component). Driven by the Explorer tree + canvas selection.
- **Cascade axis** — *which level* (Platform → Vertical → OEM). Two distinct controls:
  - **Editing level** — the level the author authors at (write target).
  - **Preview level** — the level/Org the author previews as (read view), independent of editing level.

These never merge. The persistent **Context Bar** always shows both: `Editing: Automotive ▸ Toyota (OEM)` · `Preview as: Toyota / Dealer-X`.

### 2.2 Shell navigation (VS Code-style, PDR-05)
- **Activity Bar** (far left): switch primary modes — Explorer, Search, Problems, Version History, Preview, Settings.
- **Collapsible docked panels:** Explorer (left), Inspector (right), Asset Library (left, tabbed with Explorer), Problems/Preview (bottom).
- **Command Palette** (`Ctrl/Cmd-K`): navigate, run actions, switch editing level, jump to a logicalKey, publish, validate. Primary power-user surface.
- **Routing** (TanStack Router): URL encodes `{env, editingLevel, scope, appId, pageId, selection}` so any authoring state is deep-linkable and shareable.

### 2.3 Navigation invariants
- Switching **editing level** re-badges the whole composition tree/canvas (origin states recompute). Switching **preview level** re-renders the canvas preview only.
- An author may set editing level only to a level they may write `[L13]` (Platform/Vertical/OEM; never Dealer — PDR-15).

---

## 3. Studio Information Architecture

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ CONTEXT BAR  Editing: Automotive ▸ Toyota(OEM)   Preview as: Dealer-X   ⌘K  Publish │
├──┬───────────────────┬───────────────────────────────────────┬──────────────────┤
│A │ EXPLORER          │              CANVAS                    │ INSPECTOR        │
│C │  (cascade switch  │   resolved page · live sample data ·   │  Props·Bindings· │
│T │   + composition   │   origin-badged nodes · flow layout ·  │  Events·Validn·  │
│I │   tree, badged)    │   breakpoint switcher                  │  A11y·Resp·Sec·  │
│V │ ──────────────    │                                        │  Mobile · origin │
│I │ ASSET LIBRARY     │                                        │  per property    │
│T │  (archetypes +    │                                        │                  │
│Y │   semantic comps) │                                        │                  │
├──┴───────────────────┴───────────────────────────────────────┴──────────────────┤
│ PROBLEMS / PREVIEW dock  (broken bindings · orphaned overrides · a11y · responsive)│
└───────────────────────────────────────────────────────────────────────────────┘
```

**Global state (Zustand):** current `{env, editingLevel, previewScope, selection}`; everything in the workspace derives from it. **Server state (TanStack Query):** registry definitions, resolved-preview model, validation results, presence/locks.

---

## 4. User Journeys (key flows)

**J1 — Vertical architect builds the baseline DMS.** Sets editing level = Vertical(Automotive) → creates Application "DMS" → adds Modules (Sales, Service, Parts) → on the Sales Order page, drops a Transaction-Entry archetype → binds header View to `entity.SalesOrder`, lines View to `entity.OrderLine` → wires a Submit action to the `orderApproval` workflow `submit` transition → previews with sample data → validates → publishes to staging.

**J2 — OEM admin creates an overlay (brand + hide field + add section).** Sets editing level = OEM(Toyota) → opens the inherited Sales Order page (all nodes badged "inherited") → applies Toyota theme tokens (brand) → selects the discount field → "Override here" → remove → inserts a Toyota-specific "Trade-In" Section → previews as Dealer-X → publishes Toyota overlay (baseline untouched `[L7]`).

**J3 — Bind a grid (the differentiator in action).** Select the lines DataTable → Inspector ▸ Bindings → "Bind data" opens the registry browser → pick `entity.OrderLine` → Studio suggests columns from attributes with types → confirm; binding is type-validated, no free text `[L6]`.

**J4 — Wire behavior.** Select Submit button → Inspector ▸ Events → trigger `onClick` → add Action `trigger-workflow-transition` (target picked from the workflow's valid transitions) → add precondition rule from the Rule Engine browser → set confirmation. No code `[L4]`.

**J5 — Ship.** Editing Vertical baseline → run Validate (Problems dock clean) → Publish → **Cascade Impact view** shows "3 OEMs, 41 dealers affected; 0 orphaned overrides" → promote dev→staging→prod; data does not promote `[L48]`. Rollback available (re-pin prior version).

---

## 5. Screen / Surface Inventory

Per surface: **Purpose · Components · Actions · Layout · Navigation.**

### A. Entry & context

**A1 — Sign-in.** *Purpose:* authenticate via OIDC/OEM IdP (Spec Doc 12). *Components:* SSO button(s), env notice. *Actions:* sign in. *Layout:* centered card. *Nav:* → Workspace Home.

**A2 — Workspace Home.** *Purpose:* pick what to work on. *Components:* environment selector (dev/staging/prod), editing-level/scope selector, Applications list (cards: name, vertical, last edited, lock/presence), Recents, "New Application." *Actions:* open app, create app, switch env/level. *Layout:* top bar (env/level) + content grid. *Nav:* → Editor workspace.

**A3 — Context selector (Context Bar control).** *Purpose:* set editing level and preview scope. *Components:* editing-level dropdown (Platform/Vertical/OEM — gated by role `[L13]`), preview-scope picker (Org). *Actions:* set editing level (re-badges tree), set preview scope (re-renders canvas). *Layout:* inline in Context Bar. *Nav:* persists across the workspace.

### B. The Editor workspace (shell + regions)

**B1 — Activity Bar.** *Purpose:* switch primary modes. *Components:* icon buttons (Explorer, Search, Problems, History, Preview, Settings), presence avatars. *Actions:* switch mode. *Layout:* far-left vertical strip. *Nav:* toggles left/bottom panels.

**B2 — Explorer.** *Purpose:* navigate composition + see cascade origin. *Components:* cascade context (top), composition tree (App→Module→Page→View→Section→Component) with **origin badges** (inherited/overridden/own/suppressed/orphaned), filters (my-overrides/orphaned/inherited), search. *Actions:* select node, create/rename/delete (own-level only), "override here" on inherited, reveal-in-canvas. *Layout:* left docked, tree. *Nav:* selection drives Canvas + Inspector.

**B3 — Asset Library.** *Purpose:* supply archetypes + components. *Components:* tabs — Archetypes (List-Report, Transaction-Entry, Master-Detail, Object-Detail, Dashboard), Components by category (Foundation/Data Entry/Data Display/Workflow/Enterprise) from the semantic catalogue (Spec Doc 06), search; curated custom components appear when approved `[L50]`. *Actions:* drag to canvas, drop archetype onto a page. *Layout:* left docked (tabbed with Explorer). *Nav:* drag → Canvas insertion points.

**B4 — Canvas.** *Purpose:* compose and see the resolved page with live sample data. *Components:* interpreted preview surface rendering authored content via the runtime vocabulary; **origin-badged** node outlines; layout-region drop targets; selection handles; breakpoint switcher; zoom/fit. *Actions:* select, drag into regions (flow/auto-layout, no pixels `[L34]`), reorder, inline-edit text, "override here" on inherited nodes, multi-select. *Layout:* center, dominant. *Nav:* selection ↔ Explorer/Inspector; double-click container to enter.

**B5 — Inspector.** *Purpose:* edit the selected node. *Components:* tabbed — Properties · Bindings · Events · Validation · Accessibility · Responsive · Security · Mobile; **per-property origin + revert**; static↔bound toggle. *Actions:* set props, open binding picker, wire events, add validations, edit a11y/responsive/security/mobile, override/revert. *Layout:* right docked. *Nav:* opens pickers/builders (C-series).

**B6 — Command Palette.** *Purpose:* keyboard-first everything. *Components:* fuzzy input, grouped results (navigate / actions / level-switch / publish / validate / go-to-logicalKey). *Actions:* run command. *Layout:* centered overlay. *Nav:* jumps anywhere.

### C. Authoring sub-flows

**C1 — Registry binding picker.** *Purpose:* bind data without free text `[L6]`. *Components:* registry browser (entities/relationships/queries/aggregations), type-aware filters, suggested component mapping, preview of resolved shape. *Actions:* select target, map path, confirm (validated). *Layout:* modal/right-panel. *Nav:* returns to Inspector ▸ Bindings.

**C2 — Event/Action builder.** *Purpose:* wire declarative behavior. *Components:* trigger selector, ordered Action list (kind + target via engine browser), condition (Rule browser), confirmation/security. *Actions:* add/reorder/remove actions, pick workflow transition (validated), set precondition. *Layout:* panel/modal. *Nav:* returns to Inspector ▸ Events.

**C3 — Archetype setup.** *Purpose:* instantiate a page archetype. *Components:* archetype chooser, primary Data Source picker (C1), generated default structure preview. *Actions:* choose archetype, bind primary source, create. *Layout:* guided modal. *Nav:* creates Page → opens in Canvas.

**C4 — Override-here flow.** *Purpose:* fork an inherited node deliberately `[L13]`. *Components:* confirm sheet ("Override at Toyota level?"), shows inherited value. *Actions:* confirm override, later revert-to-inherited. *Layout:* inline sheet/popover. *Nav:* node becomes "overridden," editable.

### D. Quality & ship

**D1 — Preview mode.** *Purpose:* see what a tenant gets. *Components:* preview-as-Org, preview-as-role, breakpoint/profile switcher, sample/real-ish data toggle. *Actions:* switch scope/role/breakpoint. *Layout:* canvas full-bleed or bottom dock. *Nav:* from Activity Bar; interpreted path (Spec Doc 07 §7.6).

**D2 — Problems / Validation.** *Purpose:* surface build-blocking issues before publish `[L21][L22]`. *Components:* list of broken bindings, orphaned overrides, a11y/responsive/type issues — each cascade-aware (which level, who affected). *Actions:* jump-to-node, fix, re-validate. *Layout:* bottom dock. *Nav:* item → Canvas/Inspector.

**D3 — Version history & diff.** *Purpose:* review change over time per cascade level. *Components:* version timeline per level, node-level metadata diff (human-readable), author/audit `[L43]`. *Actions:* compare, restore, annotate. *Layout:* full view. *Nav:* from Activity Bar.

**D4 — Cascade Impact view.** *Purpose:* show downstream blast radius before publishing a higher level `[L45]`. *Components:* affected OEMs/dealers count, overrides at risk, orphans that would result. *Actions:* proceed / cancel / export impact. *Layout:* modal gate before publish. *Nav:* from Publish (D5).

**D5 — Publish / Promote.** *Purpose:* compile + move definitions/artifacts dev→staging→prod `[L48]`. *Components:* target-env selector, validation summary, impact summary (D4), publish button. *Actions:* validate, publish, promote, rollback (re-pin) `[L25]`. *Layout:* guided panel/modal. *Nav:* calls Compiler API (PDR-14).

### E. Settings

**E1 — Settings.** *Purpose:* studio/account/theme-authoring config. *Components:* account, environment connections, theme-token authoring (tied to theme cascade `[L33]`), keybindings. *Actions:* edit, save. *Layout:* sectioned settings. *Nav:* from Activity Bar.

---

## 6. Interaction Models
- **Selection model:** single/multi-select across Canvas ↔ Explorer; selection is the spine driving Inspector.
- **Drag-and-drop:** from Asset Library into **named layout regions** with explicit insertion points; reordering within flow; never free coordinates `[L34]`. Keyboard alternative for every drag (a11y, §9).
- **Override-here gesture:** editing an inherited node prompts explicit override (C4); accidental divergence is impossible.
- **Per-property origin & revert:** CSS-devtools-style; hover shows inherited value.
- **Inline edit:** text/labels editable in-canvas; structural/data via Inspector.
- **Keyboard-first:** command palette + comprehensive shortcuts; every mouse action has a keyboard path.
- **Guided binding:** type-aware, registry-backed; invalid bindings unrepresentable.

## 7. Responsive Authoring Model
- **Breakpoint switcher** in the Canvas (desktop/tablet/mobile-web) previews reflow live.
- Authors declare **Responsive metadata** per Section/Layout: reflow (grid→stack), collapse/hide, column priority for dense tables `[L36]`.
- Flow/auto-layout makes most responsiveness automatic; authors adjust only where needed.
- **Mobile metadata** hints (native projection) are authored in the Inspector ▸ Mobile tab, contract-only until the native renderer exists (PDR-08).
- Authors design **one screen model**, not per-device screens.

## 8. AI Interaction Model (seams only — PDR-04)
No AI features ship in v1. The UX reserves, but does not build, these **seams** (Spec Doc 11) so they can attach later without rework:
- A reserved **suggestion affordance** slot in the Inspector (e.g., a future "suggest binding/component") — absent in v1.
- A reserved **generation entry point** in Archetype setup (future "describe this page") — absent in v1.
- Any future AI output flows through the same validation + cascade + review gates as human authoring `[L21][L49]`.
This section exists to prevent UX debt, not to imply features.

## 9. Accessibility Model
Two obligations:
1. **The Studio is accessible:** full keyboard operability (incl. drag alternatives), visible focus, ARIA roles on panels/trees/canvas, screen-reader labels on origin badges and controls, respects reduced-motion and contrast. Target: WCAG 2.2 AA for the Studio itself.
2. **The Studio enforces accessible output** `[L35]`: archetypes carry a11y defaults; the Inspector ▸ Accessibility tab makes intent explicit; the Problems dock flags a11y issues in authored screens before publish.

## 10. Collaboration Model (PDR-11)
- **Presence:** avatars in the Context Bar / Explorer show who is in which app/module.
- **Node-level optimistic locking:** editing a node locks it; others see it locked. No silent concurrent edits.
- **Cascade-bounded editing:** authors act only at their level and below-by-inheritance `[L13]`; an OEM admin cannot touch the Vertical baseline or another OEM.
- **Review on publish:** metadata diffs (D3) are reviewed before promotion; not live multiplayer co-editing.

---

## 11. Phase 2 summary & open items
**Covered:** navigation (two-axis), IA (shell + regions), journeys, full Studio screen inventory with per-screen detail, interaction models, responsive authoring, AI seams (not features), accessibility (studio + enforced output), collaboration.

**Open items into Phase 3:**
- OI-P2-1: Validate the cascade-legibility interaction (origin states, override-here, impact) with a clickable prototype before UI Design hardens it (Investment review U1; PDR OI-1). Highest UX risk.
- OI-P2-2: Canvas selection/drag affordance fidelity for deeply nested flow layouts — detailed in Phase 3 wireframes.
- OI-P2-3: Command-palette command set scope (OI-3) — finalize in Phase 3.

*Next: Phase 3 — UI Design Specification: per-screen wireframes (ASCII), layout structure, component hierarchy, and all states (empty/error/loading) for the surfaces inventoried above.*
