# Skills Specification — UI Studio

> **Purpose:** Defines the human expertise required to build UI Studio and the 5 Claude Code skills that accelerate development. Cross-reference with [docs/ui-studio/reference/skills-specification.md](../../ui-studio/reference/skills-specification.md) for implementation details.

---

## Human Skills Required

These are the business and technical competencies that must be present in the team to successfully deliver UI Studio. Gaps in these skills are risks.

| Skill | Why Needed | Phases Where Critical |
|---|---|---|
| ERP/DMS domain knowledge | Understand transaction documents, approval flows, and business rules in context | P0, P6, P7 |
| Metadata-driven architecture | Design systems driven by configuration rather than code | P1, P2, P4 |
| Governed form builder UX | Design intuitive admin tools with appropriate constraints | P2, P3 |
| Drag-and-drop UI engineering | Build reliable drag-and-drop canvas with undo/redo | P3 |
| React component architecture | Build extensible, testable component system | P2, P4, P6 |
| Reactive UI / event-driven design | Cascading field changes, auto-populate, recalculation | P5 |
| Editable grid / inline editing | Line item grid with cell editing, add/delete rows | P6 |
| Pricing and tax UI patterns | Dynamic charge columns, tax display in transaction documents | P6 |
| Workflow UX | Approval panels, status strips, action routing | P7 |
| Permission-aware rendering | DOM removal (not CSS) for security, role variants | P4, P9 |
| Publish lifecycle design | Immutable versioning, rollback, cache invalidation | P8 |
| Validation rule design | Pre-publish checks, schema drift detection | P8 |
| Prompt engineering | Build system prompts that produce valid ViewArtifactPayload | P10 |
| AI product governance | Ensure AI output always lands as draft, never auto-published | P10 |
| TypeScript type design | Stable types shared across frontend and backend | P1, P9 |
| Go backend engineering | REST API, PostgreSQL, multi-tenant queries | P1, P4–P10 |
| SQL migration design | Safe up/down migrations, impact on existing rows | P1, P8 |
| Test automation | Unit (Vitest), integration (testcontainers), E2E (Playwright) | All phases |
| Performance engineering | Lazy loading, React Query caching, large grid rendering | P4, P6 |

---

## 5 Claude Code Skills

These skills are Claude Code tools that accelerate repetitive development tasks. Each skill is invokable from the Claude Code CLI.

---

### Skill 1: `ui-studio-component-builder`

**Purpose:** Scaffold a new UI Studio component in one command.

**What it produces:**
- `ComponentRegistryEntry` TypeScript definition with all required fields
- Runtime renderer stub (`ComponentNameRuntime.tsx`)
- Designer panel stub (`ComponentNamePanel.tsx`)
- `config_schema` JSON Schema
- Unit test file
- SQL seed entry for `ui_component_registry`

**When to use:** Any time a new component needs to be added to the platform component set or as a plugin component.

---

### Skill 2: `ui-studio-view-generator`

**Purpose:** Generate a valid `ViewArtifactPayload` JSON from a specification.

**Input:** surface_type + primary_entity + field list

**What it produces:** A fully structured `ViewArtifactPayload` ready for:
- Import via the Import API
- Direct database insertion for test data
- Runtime renderer testing

**When to use:** Creating test fixtures, seeding demo data, or verifying the runtime renderer works with a specific configuration.

---

### Skill 3: `ui-studio-event-builder`

**Purpose:** Generate `EventDefinition` JSON from plain English.

**Example input:**
> "When qty changes and qty > 0, recalculate amount as qty × rate"

**What it produces:** A complete `EventDefinition` JSON object, validated against the event schema.

**When to use:** Designing or testing event configurations during development or QA.

---

### Skill 4: `ui-studio-migration-builder`

**Purpose:** Generate safe SQL migrations for UI Studio schema changes.

**What it produces:**
- UP migration SQL
- DOWN (rollback) migration SQL
- Impact check: lists existing artifact rows that may be affected
- Migration test

**When to use:** Any time a new column or table is added to the UI Studio schema.

---

### Skill 5: `ui-studio-test-generator`

**Purpose:** Generate full test coverage for a UI Studio feature.

**Input:** Feature spec section (from this document) + implemented file paths

**What it produces:**
- Unit tests (Vitest)
- Integration tests (Go testcontainers)
- E2E tests (Playwright)

**When to use:** After implementing a feature to quickly generate a test suite that verifies the spec requirements.

---

## Codex Master Prompt

The Codex master prompt is the top-level instruction given to any code-generating agent working on UI Studio. It establishes constraints that apply across all phases.

```
You are implementing IDMS v3 UI Studio — a governed, metadata-driven view
and transaction experience builder.

Before writing any code:
1. Read the current phase specification completely
2. Inspect the existing codebase — do not rebuild what exists
3. Follow the phase's New Files list exactly — do not create extra files

Ownership rules (never violate):
- UI Studio OWNS: presentation config, layout, binding, behavior, publish lifecycle
- UI Studio DOES NOT OWN: entity schema, business validation, workflow transitions,
  approval routing, security/RBAC decisions, print templates

Always:
- Filter all DB queries by tenant_id
- Return structured errors — never 500 from bad metadata
- Hidden fields: remove from DOM — not CSS hidden
- AI output: always DRAFT — never auto-publish
- Runtime: only load is_active=true versions

Commit after every phase. Do not start Phase N+1 before Phase N gate passes.
```

---

## Phase-Specific Codex Task Prompts

Each phase has a specific task prompt. See the corresponding phase file for the full prompt.

| Phase | File | Task Focus |
|---|---|---|
| P0 | [P0-gap-analysis.md](../phases/P0-gap-analysis.md) | Gap analysis — no code changes |
| P1 | [P1-metadata-foundation.md](../phases/P1-metadata-foundation.md) | DB schema, API routes, TypeScript types |
| P2 | [P2-component-registry.md](../phases/P2-component-registry.md) | Typed component registry, 56 + 12 components |
| P3 | [P3-view-designer.md](../phases/P3-view-designer.md) | Designer canvas, drag-and-drop, inspector |
| P4 | [P4-runtime-renderer.md](../phases/P4-runtime-renderer.md) | Runtime renderer, binding resolver, permission filter |
| P5 | [P5-event-engine.md](../phases/P5-event-engine.md) | EventEngine (pure TS), field change, grid cell change |
| P6 | [P6-header-line-workspace.md](../phases/P6-header-line-workspace.md) | Header-line surface, line grids, totals, action bar |
| P7 | [P7-workflow-rule-ux.md](../phases/P7-workflow-rule-ux.md) | WorkflowStatusStrip, ApprovalPanel, ValidationSummary |
| P8 | [P8-publish-governance.md](../phases/P8-publish-governance.md) | Publish lifecycle, 41 validation rules, rollback, diff |
| P9 | [P9-role-variants.md](../phases/P9-role-variants.md) | Role variants, DOM removal, cascading, P1 features |
| P10 | [P10-ai-templates.md](../phases/P10-ai-templates.md) | AI generation, template gallery, P2 features |
