# UI Studio — Master Plan Index

> **For Claude and Codex:** Read this index first. Then open the phase file for your current milestone.
> Follow phases in strict order. Do not start Phase N+1 before Phase N is committed and tested.
> This folder is the single source of truth for UI Studio implementation.

**Codebase root:** `E:\AiDMS\AI-DMS`
**Tech stack:** Go 1.21+ / Gin / PostgreSQL · React 18 / TypeScript / Vite / Tailwind + shadcn/ui / Zustand / TanStack Query / dnd-kit

---

## Ownership Rule — Never Violate

| UI Studio OWNS | UI Studio DOES NOT OWN |
|---|---|
| Presentation config, layout, component placement | Entity schema, business validation truth |
| Field binding, behavior/events | Workflow transitions, approval routing |
| Publish lifecycle, versioning | Security/RBAC, print templates |

---

## Milestone Overview

| Status | Milestone | Phase | Description | Gate Condition |
|---|---|---|---|---|
| [ ] | **M1** | [Phase 0](phases/P0-gap-analysis.md) | Gap analysis complete — no code changes | Every P0/P1/P2 feature classified |
| [ ] | **M2** | [Phase 1](phases/P1-metadata-foundation.md) | DB schema + API routes | Runtime loads published view from DB |
| [ ] | **M3** | [Phase 2](phases/P2-component-registry.md) | Component registry admin screen | All 56 components queryable via API |
| [ ] | **M4** | [Phase 3](phases/P3-view-designer.md) | View designer shell | Designer produces valid draft payload |
| [ ] | **M5** | [Phase 4](phases/P4-runtime-renderer.md) | Runtime renderer | Published views render with real entity data |
| [ ] | **M6** | [Phase 5](phases/P5-event-engine.md) | Field/grid event engine | Field change fires correct actions at runtime |
| [ ] | **M7** | [Phase 6](phases/P6-header-line-workspace.md) | Header-line transaction workspace | Sale Order E2E test passes |
| [ ] | **M8** | [Phase 7](phases/P7-workflow-rule-ux.md) | Workflow/rule UX integration | Workflow state + rule errors display correctly |
| [ ] | **M9** | [Phase 8](phases/P8-publish-governance.md) | Publish lifecycle + governance | Rollback, diff, audit trail all functional |
| [ ] | **M10** | [Phase 9](phases/P9-role-variants.md) | Role variants + permissions | All P1 features operational |
| [ ] | **M11** | [Phase 10](phases/P10-ai-templates.md) | Template gallery + AI generation | AI generates valid draft from natural language |

> Update `[ ]` to `[~]` (in progress) or `[x]` (done) as milestones complete.

---

## Reference Documents

| Document | Contents |
|---|---|
| [Feature Matrix](reference/feature-matrix.md) | All 63 features — P0 (20), P1 (23), P2 (20) — mapped to phases |
| [Agent Specifications](reference/agent-specifications.md) | All 17 agent prompts with phase assignments |
| [Skills Specification](reference/skills-specification.md) | 5 Claude Code skills for UI Studio development |
| [UI Guidelines & Architecture](reference/ui-guidelines.md) | 10 UX principles · Navigation map · Testing strategy · Key risks |

---

## Quick-Start by Role

### "I am implementing Phase N"
1. Check the milestone Status column above — confirm Phase N-1 is `[x]`
2. Open `phases/PN-*.md`
3. Read the **Phase Card** at the top (milestone, gate, agents, dependencies)
4. Read the **New Files** section — create files before writing code
5. Run the agents listed under **Agents** (parallel lanes can run simultaneously)
6. Run the **Testing** section before marking the milestone done
7. Confirm the **Gate Condition** block at the bottom passes
8. Commit with the exact message shown in the phase file

### "I need to understand the full feature set"
→ [Feature Matrix](reference/feature-matrix.md)

### "I need to run an agent"
→ [Agent Specifications](reference/agent-specifications.md) — find your agent, copy its prompt

### "I need to understand a component"
→ Phase 2 [Component Registry](phases/P2-component-registry.md) — full 56-component SQL seed

### "I need to understand UI design rules"
→ [UI Guidelines & Architecture](reference/ui-guidelines.md)

---

## Architecture Summary

```
Design Time (Builder)          Metadata Store              Runtime (Renderer Engine)
──────────────────────         ──────────────────          ──────────────────────────
StudioV2Canvas.tsx        →    artifact_header             StudioRenderer.tsx
UIStudioV2NewWizard.tsx        artifact_version      →     MetadataLoader.ts
StudioV2LeftRail.tsx           ui_component_registry       LayoutResolver.ts
StudioV2RightInspector.tsx     ui_view_variant             BindingResolver.ts
EventsTab.tsx                  ui_view_event_definition    PermissionFilter.ts
VariantPanel.tsx               ui_datasource_override      EventEngine.ts (pure TS)
PublishPanel.tsx               ui_view_publish_log         ComponentErrorBoundary.tsx
```

**ViewCode:** Process discriminator that flows from UI through ALL backend API calls.
Every entity save, rule evaluation, and workflow transition includes `view_code` in the request body.

---

## Existing Infrastructure — Do Not Rebuild

| Area | Status | Key Path |
|---|---|---|
| Entity Designer | ✅ Full | `pages/admin/EntityDesignerPage.tsx` |
| Dynamic Form/List/Detail | ✅ Full | `components/dynamic/` |
| Rule Engine | ✅ Full | `go/internal/studio/rules/` |
| Workflow Engine | ✅ Full | `go/internal/` + `components/studio/WorkflowCanvas/` |
| Permission Engine | ✅ Full | `go/internal/permission/` |
| ConditionTreeBuilder | ✅ Full | `components/studio/ConditionTree/` |
| VirtualGrid | ✅ Full | `components/ui/VirtualGrid/` |
| Studio V2 canvas shell | ⚠️ 40% | `components/studio-v2/` — extend, do not rebuild |
| Artifact versioning | ✅ Full | `go/internal/artifacts/` |

---

*Created: 2026-05-27 · Codebase: `E:\AiDMS\AI-DMS`*
*Source spec: `docs/superpowers/specs/2026-05-27-ui-studio-phase-implementation-plan-design.md`*
