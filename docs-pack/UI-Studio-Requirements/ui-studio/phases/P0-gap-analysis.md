# Phase 0 — Gap Analysis

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M1 |
| **Gate Condition** | Every P0/P1/P2 feature classified with status and gap description |
| **Depends On** | Nothing — first phase |
| **Agents** | Agent 1 (Product Understanding) · Agent 2 (Gap Analysis) |
| **Code Changes** | ❌ None — analysis only |
| **Commit** | `docs: ui-studio Phase 0 — gap analysis complete` |

---

## Current State (from codebase scan)

| Area | Status | Key Files |
|---|---|---|
| Entity Designer | ✅ Full | `pages/admin/EntityDesignerPage.tsx` |
| Dynamic Form/List/Detail | ✅ Full | `components/dynamic/` |
| Rule Engine | ✅ Full | `go/internal/studio/rules/` |
| Workflow Engine | ✅ Full | `go/internal/` + `components/studio/WorkflowCanvas/` |
| Permission Engine | ✅ Full | `go/internal/permission/` |
| Studio V2 Canvas/Editor | ⚠️ 40% | `components/studio-v2/` — right inspector incomplete, no behavior tab |
| Component Registry (types only) | ⚠️ 90% | `types/studio.ts`, `types/studio-v2.ts` — no DB table yet |
| View CRUD API | ⚠️ 50% | `go/internal/studio/views/handler.go` |
| Behavior/Event Engine | ❌ 0% | Missing entirely |
| Header-Line Transaction WS | ❌ 0% | Missing entirely |
| AI View Generation | ❌ 0% | `UiStudioNlpPanel.tsx` stub only |
| Publish/Governance UI | ⚠️ 30% | DB exists, no diff/rollback/audit UI |

---

## P0 Feature Gap Matrix

| # | Feature | Status | Gap |
|---|---|---|---|
| P0-01 | View Registry & Management | Partial | `artifact_header` exists; no `surface_type`, no `view_code` column |
| P0-02 | Typed View Surface Designer | Missing | No surface type model |
| P0-03 | Smart CRUD Builder | Full | `SmartCrudPanel.tsx` — needs canvas sync |
| P0-04 | Header-Line Transaction Workspace | Missing | No `header_line` surface |
| P0-05 | Field Picker from Entity Designer | Partial | No drag-to-canvas picker |
| P0-06 | Layout Builder | Partial | Canvas exists, layout regions incomplete |
| P0-07 | List/Grid Configuration | Partial | No column picker UI |
| P0-08 | Form Field Configuration | Partial | Right inspector incomplete |
| P0-09 | Line Grid Configuration | Missing | No line grid zone in canvas |
| P0-10 | Lookup / Entity Picker Config | Partial | LookupField works; no per-view config |
| P0-11 | Data Source & Filter Override | Partial | Schema exists; no UI in inspector |
| P0-12 | Basic Dynamic Behavior Builder | Missing | No event/behavior config |
| P0-13 | Field Change Event Config | Missing | — |
| P0-14 | Grid Cell Change Event Config | Missing | — |
| P0-15 | Action Placement Config | Partial | No action bar config panel |
| P0-16 | Workflow UX Integration | Partial | Engine full; not wired to Studio |
| P0-17 | Save / Publish / Rollback | Partial | Endpoints exist; no rollback UI |
| P0-18 | Preview with Context Simulation | Missing | — |
| P0-19 | Publish Validation | Partial | `validation.ts` exists; incomplete |
| P0-20 | Runtime Renderer Contract | Partial | `ComponentTreeRenderer` works; binding resolver incomplete |

---

## Agents — Phase 0

> 🔀 **PARALLEL** — Both agents run simultaneously, no dependency between them.

| Lane | Agent | Task |
|---|---|---|
| A | **[Agent 1: Product Understanding](../reference/agent-specifications.md#agent-1-product-understanding-agent)** | Read plan doc, clarify P0/P1/P2 boundaries, identify risks, produce feature understanding summary |
| B | **[Agent 2: Gap Analysis](../reference/agent-specifications.md#agent-2-codebase-gap-analysis-agent)** | Inspect codebase, produce full gap matrix for all 63 features with file paths and risk levels |

---

## ✅ Gate Condition — M1

```
All 63 features (P0-01 through P2-63) classified as:
  - Existing (path to file)
  - Partial (what exists + what's missing)
  - Missing (what needs to be built)

Output: gap-analysis.md document committed to docs/ui-studio/
Agent 16 reviews gap matrix before Phase 1 begins.
```

> **Next phase:** [Phase 1 — Metadata Foundation](P1-metadata-foundation.md)
