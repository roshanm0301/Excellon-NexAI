# UI Guidelines & Project Principles — UI Studio

> **Purpose:** Defines the product vision, design principles, ownership boundaries, milestone sequence, and key risks for UI Studio. Cross-reference with [docs/ui-studio/reference/ui-guidelines.md](../../ui-studio/reference/ui-guidelines.md) for the implementation-level application of these principles.

---

## Product Vision

UI Studio is the **governed, metadata-driven view and transaction experience builder** for IDMS v3 AI-DMS.

It allows authorized business configurators to create, configure, and publish fully functional business views — including complex ERP transaction documents — without writing code. Every view is configuration, not code. Every configuration choice is governed by the system — not left open-ended.

**What it is:**
- A designer where non-developers configure business views
- A runtime that faithfully renders those configurations with real data
- A governance layer that ensures only valid, reviewed configurations reach end users

**What it is not:**
- A generic form builder with no constraints
- A replacement for the Entity Designer, Rule Engine, Workflow Engine, or Permission Engine
- A tool that allows arbitrary JavaScript in view configurations

---

## Ownership Boundaries

These boundaries must never be violated. Any implementation that crosses a boundary is a defect.

| Domain | Owner | UI Studio Role |
|---|---|---|
| Presentation config and layout | **UI Studio** | Full ownership |
| Component placement and binding | **UI Studio** | Full ownership |
| Field behavior and events | **UI Studio** | Full ownership |
| Publish lifecycle and versioning | **UI Studio** | Full ownership |
| Entity schema and field definitions | **Entity Designer** | UI Studio reads — never writes |
| Business validation truth | **Rule Engine** | UI Studio displays results — never computes |
| Workflow transitions and routing | **Workflow Engine** | UI Studio calls and displays — never implements |
| Security and RBAC decisions | **Permission Engine** | UI Studio applies decisions — never makes them |
| Print / document templates | **Print Service** | Outside UI Studio scope |

---

## 10 UI Design Principles

These principles apply to every screen in UI Studio — both the designer and the runtime renderer.

| # | Principle | Practical Meaning |
|---|---|---|
| 1 | Enterprise density | Use compact layouts. `text-sm`, tight tables. Avoid decorative whitespace. |
| 2 | Monospace for code | All codes, expressions, JSON, and attribute names use `font-mono`. |
| 3 | Color-coded status | Green = Published, Orange = Draft, Red = Error / Archived, Blue = Processing |
| 4 | Progressive disclosure | Basic config visible by default. Advanced options in collapsible "Advanced" section. |
| 5 | No modal overload | Use inline panels and sheet side-panels for config. Reserve modals for critical confirmations only. |
| 6 | Keyboard-first | Tab navigation through all forms. Ctrl+S = save. Escape = cancel. Delete = remove selected component. |
| 7 | Optimistic UI | Show save in progress immediately. Roll back with a toast on error. |
| 8 | Graceful degradation | A broken component shows a placeholder card with its component_code and error type. The page never crashes. |
| 9 | Consistent iconography | TransactionForm = FileText icon. Entity = Database. Component = Layout. Publish = Upload. Draft = Edit. |
| 10 | Performance | Lazy-load heavy components (Map, Timeline, Gantt) via React.lazy. Never load all 56 components on initial render. |

---

## Priority Framework

Features are classified into three tiers. Development follows this priority order.

| Priority | Label | Description |
|---|---|---|
| P0 | Core | Must be delivered. System not useful without these 20 features. |
| P1 | Enhanced | Enterprise production readiness. 23 features. Required before broad rollout. |
| P2 | Productivity | Productivity, AI, and analytics features. 20 features. Deliver after P0/P1 are stable. |

---

## Milestone Sequence

| Milestone | Phase | Deliverable | Gate Condition |
|---|---|---|---|
| M1 | P0 | Gap analysis — no code changes | Every P0/P1/P2 feature classified |
| M2 | P1 | DB schema + API routes for foundation | Runtime can load published view from DB |
| M3 | P2 | Component registry admin screen | All 56 components queryable via API |
| M4 | P3 | View designer shell — create, drag, save draft | Designer produces valid draft payload |
| M5 | P4 | Runtime renderer — views render with real data | Published view renders with real entity data |
| M6 | P5 | Field/grid event engine | Field change fires correct actions at runtime |
| M7 | P6 | Header-line transaction workspace | Sale Order E2E test passes |
| M8 | P7 | Workflow/rule UX integration | Workflow state + rule errors display correctly |
| M9 | P8 | Publish lifecycle, rollback, preview, governance | Rollback, diff, audit trail all functional |
| M10 | P9 | Role variants, permissions, enterprise depth | All P1 features operational |
| M11 | P10 | Template gallery, AI generation, analytics | AI generates valid draft view from natural language |

**Rule:** Do not start Milestone N+1 until Milestone N gate condition is verified by Agent 16 (Phase Coordinator).

---

## Engineering Sequence Rationale

The phase order is not arbitrary. Each phase depends on the one before it.

1. **P1 (Metadata Foundation)** first — the DB schema is the contract all other phases build on
2. **P2 (Component Registry)** before P3 — the designer can only place components that are registered
3. **P3 (Designer)** before P4 — the runtime renders what the designer produces
4. **P4 (Runtime Renderer)** before P5 — events need a rendered form to operate on
5. **P5 (Event Engine)** before P6 — transaction workspace uses the event engine for recalculation
6. **P6 (Header-Line Workspace)** before P7 — workflow UX needs a rendered transaction surface
7. **P8 (Governance)** after P6/P7 — publish/rollback needs working surfaces to govern
8. **P9 (Role Variants)** before P10 — AI generation should produce variant-aware views
9. **P10 (AI + Templates)** last — builds on all previous surfaces and features

---

## ViewCode Flow

ViewCode is the mechanism that allows multiple different views for the same entity type.

```
User navigates to a transaction screen
  → UI resolves ViewCode for this route (e.g., SO_VEHICLE_BOOKING)
  → ViewCode included in every API call to backend
  → Backend Rule Engine selects rule set for this ViewCode
  → Backend Workflow Engine selects workflow definition for this ViewCode
  → UI Studio loads the published view for this ViewCode
```

Every API call from any UI Studio surface must include the ViewCode. This is a non-negotiable propagation requirement.

---

## Key Risks and Controls

| Risk | Business Impact | Control |
|---|---|---|
| Designer becomes unconstrained JSON editor | Misconfigured views reach end users | Typed surface regions; components only placed in valid zones |
| Published view bypassed in development | Draft views visible to end users | Runtime checks `is_active=true`; draft never loaded |
| Event engine creates infinite recalculation loops | Form becomes unusable | Circular dependency detection at publish time (V021 rule) |
| AI output contains invalid configuration | Broken view auto-published | AI output always DRAFT; runs through all 41 validation rules before returning |
| Entity field renamed after views are published | Runtime binding errors | Schema drift detection; broken binding banner in designer |
| Hidden field found in page source | Security exposure | Permission filter removes from DOM — not CSS hidden |
| Two active versions served simultaneously | Inconsistent user experience | DB constraint: only one `is_active=true` version per view |

---

## BA Verification Protocol

The BA team uses both folders together to verify that every business requirement has a corresponding implementation.

**For each phase:**
1. Open `docs/business_process/phases/P{N}-*.md` — this is the business requirement
2. Open `docs/ui-studio/phases/P{N}-*.md` — this is the implementation specification
3. Verify every item in the BA Verification Checklist (business file) maps to a test or implementation note in the ui-studio file
4. Mark the checklist item complete when both sides agree

**For each feature in the feature matrix:**
1. Open `docs/business_process/reference/feature-matrix.md` — lists all 63 features
2. Open `docs/ui-studio/reference/feature-matrix.md` — lists implementation status
3. Confirm feature is classified and has a corresponding phase and milestone

**Definition of complete:** A feature is complete when:
- The BA Verification Checklist item is checked
- The implementation file documents the feature
- Tests for the feature are written and passing
- Agent 16 (Phase Coordinator) has opened the next gate
