# UI Studio â€” Business Process & Requirements Index

> **For BA Team:** This folder defines WHAT UI Studio must do and WHY.
> Compare every phase here against the matching phase in `docs/ui-studio/` to confirm apple-to-apple coverage.
>
> **For Engineering:** Each phase file here is the business requirement.
> The corresponding phase in `docs/ui-studio/phases/` is the technical implementation.
> Every requirement listed here must have a matching implementation and test in that file.

---

## How to Use This Document

| Role | Action |
|---|---|
| BA | Open a phase file here â†’ confirm all capabilities are stated clearly â†’ compare with `docs/ui-studio/phases/` same phase |
| Engineering | Open a phase file here â†’ read the business intent â†’ implement per `docs/ui-studio/phases/` same phase |
| QA | Cross-check: every capability in business_process phase = test case in ui-studio phase |
| Product | Review feature matrix â†’ confirm P0/P1/P2 scope is complete |

---

## Apple-to-Apple Phase Map

| Status | Phase | Business Process File | Implementation File | Milestone |
|---|---|---|---|---|
| [ ] | P0 | [Gap Analysis](phases/P0-gap-analysis.md) | [ui-studio/P0](../ui-studio/phases/P0-gap-analysis.md) | M1 |
| [ ] | P1 | [Metadata Foundation](phases/P1-metadata-foundation.md) | [ui-studio/P1](../ui-studio/phases/P1-metadata-foundation.md) | M2 |
| [ ] | P2 | [Component Registry](phases/P2-component-registry.md) | [ui-studio/P2](../ui-studio/phases/P2-component-registry.md) | M3 |
| [ ] | P3 | [View Designer](phases/P3-view-designer.md) | [ui-studio/P3](../ui-studio/phases/P3-view-designer.md) | M4 |
| [ ] | P4 | [Runtime Renderer](phases/P4-runtime-renderer.md) | [ui-studio/P4](../ui-studio/phases/P4-runtime-renderer.md) | M5 |
| [ ] | P5 | [Event Engine](phases/P5-event-engine.md) | [ui-studio/P5](../ui-studio/phases/P5-event-engine.md) | M6 |
| [ ] | P6 | [Header-Line Workspace](phases/P6-header-line-workspace.md) | [ui-studio/P6](../ui-studio/phases/P6-header-line-workspace.md) | M7 |
| [ ] | P8 | [Publish & Governance](phases/P8-publish-governance.md) | [ui-studio/P8](../ui-studio/phases/P8-publish-governance.md) | M9 |
| [ ] | P9 | [Role Variants & Permissions](phases/P9-role-variants.md) | [ui-studio/P9](../ui-studio/phases/P9-role-variants.md) | M10 |
| [ ] | P10 | [AI & Templates](phases/P10-ai-templates.md) | [ui-studio/P10](../ui-studio/phases/P10-ai-templates.md) | M11 |

> Update `[ ]` to `[~]` (BA review in progress) or `[x]` (BA confirmed coverage) per phase.

---

## Reference Documents

| Business Process | Implementation | Purpose |
|---|---|---|
| [Feature Matrix](reference/feature-matrix.md) | [ui-studio/feature-matrix](../ui-studio/reference/feature-matrix.md) | All 63 features â€” P0/P1/P2 â€” BA source of truth |
| [Agent Specifications](reference/agent-specifications.md) | [ui-studio/agent-specifications](../ui-studio/reference/agent-specifications.md) | 15 agent responsibilities â€” process intent |
| [Skills Specification](reference/skills-specification.md) | [ui-studio/skills-specification](../ui-studio/reference/skills-specification.md) | Human skills + Codex task prompts |
| [UI Guidelines](reference/ui-guidelines.md) | [ui-studio/ui-guidelines](../ui-studio/reference/ui-guidelines.md) | Product vision + boundaries + engineering principles |

---

## Ownership Boundary â€” Quick Reference

```
UI Studio OWNS                          UI Studio DOES NOT OWN
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
View creation and management            Entity schema definition
Typed view surfaces                     Business validation truth
Field and grid presentation             Approval routing truth
Header-line transaction workspace       Permission and security truth
Data binding configuration              Print template ownership
Field change events                     Navigation/menu hierarchy
Grid cell change events                 Reporting semantic model
Preview, publish, rollback              Integration connectors
Runtime rendering contract
```

---

## Source Document

Original planning document: `ui_studio_development_plan_skills_agents.md` (root of repo)

*Created: 2026-05-27 Â· Codebase: `E:\AiDMS\AI-DMS`*
