# P10 â€” Template Gallery, AI Generation & Analytics

**Milestone:** M11
**Track:** Track 11 â€” AI-Assisted View Generation + Â§7 P2 Features
**Implementation:** [docs/ui-studio/phases/P10-ai-templates.md](../../ui-studio/phases/P10-ai-templates.md)

---

## Business Goal

Allow business configurators to start from a template or describe a view in plain language, and get a fully structured draft view in seconds. Reduce the time to create a new view from hours to minutes. All AI output must land as a draft â€” never auto-published â€” so a human always reviews before it goes live.

---

## Template Gallery

A library of 10 pre-built starter templates. Each template is a full draft layout scaffold. The configurator selects a template, clones it, binds their entity, and publishes.

| # | Template | Surface | When to Use |
|---|---|---|---|
| 1 | Standard CRUD â€” Master Data | standard_crud | Any entity that needs a basic form + list |
| 2 | Master with Related Records | advanced_crud | Entity with one or more related entity grids |
| 3 | Transaction â€” Header + Lines | header_line | Purchase Order, Sale Order, Service Job |
| 5 | Dashboard â€” KPI + Chart | dashboard | Operational overview for a domain |
| 6 | Kanban Board | kanban | Any entity with a status field |
| 7 | Wizard â€” Multi-Step Entry | wizard | Complex data entry split into steps |
| 8 | Inspection / Checklist | standard_crud | Quality inspection, service checklist |
| 9 | Report View â€” Read Only | detail_page | Printable record summary |
| 10 | Split Console View | split_view | List on left, form detail on right |

---

## AI-Assisted View Generation

A configurator types a plain language description of the view they want. The system generates a complete draft `ViewArtifactPayload`.

**Example input:**
> "Create a customer complaint form with fields for customer name, complaint type, description, priority, and assigned agent"

### AI Generation Rules

| Rule | Business Purpose |
|---|---|
| Output always DRAFT | Human must review before publishing â€” AI cannot publish directly |
| Run through all 41 validation rules | AI output with errors is auto-fixed where possible, then returned to user |
| Log every generation | Audit trail shows AI-generated views separately from human-designed views |
| Invalid entity â†’ clear error | If AI references an entity that does not exist, return a clear error message |
| AI badge on draft | AI-generated drafts are visually marked so the configurator knows to review carefully |

---

## P2 Features Delivered in This Phase

| Feature | Business Purpose |
|---|---|
| P2-44 Template Gallery | 10 starter templates for the most common view patterns |
| P2-45 Component Presets | Save a configured component instance as a reusable preset |
| P2-46 Dashboard Builder | dashboard surface type fully operational |
| P2-47 Kanban Board | kanban surface type with card rendering |
| P2-48 Wizard Builder | wizard surface type with step navigation |
| P2-49 Console/Split View | split_view surface type |
| P2-50 Personalization | User saves their own column widths and filter preferences |
| P2-51 Runtime Usage Analytics | Track which views are used most and how fast they load |
| P2-52 Performance Budgeting | Alert configurator when a view takes more than 3 seconds to load |
| P2-53 Accessibility Checks | Pre-publish linter ensures inputs have labels (A001â€“A005 rules) |
| P2-54 Localization Checks | Pre-publish linter flags hardcoded text that should be translatable (L001â€“L004) |
| P2-55 Advanced Expression Mode | Full JSONata editor for complex expression fields |
| P2-56 No-Code Rule Builder Wizard | Guided wizard for creating event conditions without writing expressions |
| P2-57 AI View Generation | Describe a view in natural language â†’ get a draft |
| P2-58 AI Layout Refactoring | "Suggest improvements" button analyses current draft and recommends changes |
| P2-59 AI Broken Binding Explanation | Natural language explanation of V050/V051 schema drift errors |
| P2-60 Guided Builder Walkthroughs | In-app step-by-step tutorials for first-time configurators |
| P2-61 View Documentation Generator | Auto-generate a human-readable specification from a published view |
| P2-62 Export / Import Metadata | Export a view as a JSON bundle; import on another environment |
| P2-63 View Clone with Delta Tracking | Cloned view records which original it was based on |

---

## Required Skills

| Skill | Why Needed |
|---|---|
| AI product design | Design the AI generation flow so output is trustworthy |
| Prompt engineering | Build the system prompt that produces valid ViewArtifactPayload output |
| Template library design | Create reusable, customizable starter templates |
| Analytics product thinking | Decide what usage data matters and how to present it |
| Accessibility standards | WCAG 2.1 AA requirements for form inputs |
| Localization patterns | i18n-ready design for all user-facing labels |

---

## Codex Task Prompt

```
Implement Template Gallery, AI-Assisted View Generation, and all P2 features.

Template Gallery:
- 10 starter templates (see list above).
- Clone template â†’ creates draft with full layout scaffold.
- Clone records cloned_from_view_key.

AI View Generation:
- NlpPanel: text input for natural language description.
- Backend: call Claude API (claude-sonnet-4-6), parse response as ViewArtifactPayload.
- Run through publish validation â€” auto-fix duplicate keys and invalid component codes.
- Return as DRAFT â€” never auto-publish.
- Log action='ai_generated' to audit log.
- Show "AI Generated" badge on draft in designer.

P2 features: dashboard builder, kanban, wizard, split view, personalization,
analytics telemetry, performance alerts, accessibility linter (A001â€“A005),
localization linter (L001â€“L004), advanced expression editor, no-code rule wizard,
export/import, view documentation generator, guided walkthroughs.
```

---

## Business Success Criteria

- A configurator can describe a view in plain language and get a working draft within 30 seconds
- AI-generated view passes all 41 validation rules after auto-fix
- AI output is always draft â€” configurator must review and manually publish
- All 10 templates clone correctly and produce a publishable draft after entity binding
- Export/import allows moving a view from development to production environment without rebuilding it

---

## BA Verification Checklist

- [ ] Template gallery displays all 10 templates with name, surface, and description
- [ ] Clone template creates draft correctly and records cloned_from_view_key
- [ ] Cloned template passes publish validation after entity binding is set
- [ ] AI generation: valid description â†’ draft ViewArtifactPayload created
- [ ] AI output returned with DRAFT status â€” cannot be published directly from NlpPanel
- [ ] AI generation logged with action='ai_generated' in audit trail
- [ ] AI draft shows "AI Generated" badge in designer
- [ ] Invalid entity type in prompt â†’ clear 422 error message
- [ ] Dashboard surface type renders KPI and chart components
- [ ] Kanban surface renders card columns with status grouping
- [ ] Wizard surface renders step navigation
- [ ] Export view â†’ valid JSON bundle downloadable
- [ ] Import JSON bundle â†’ view appears as DRAFT
- [ ] Import with missing plugin component â†’ warning shown, import continues
- [ ] Accessibility linter: missing input label â†’ A001 error shown at publish
- [ ] Localization linter: hardcoded text â†’ L001 warning shown at publish
- [ ] Usage analytics: view render event logged with view_key and render_time_ms
- [ ] Performance alert triggered when render time > 3000ms
- [ ] Implementation matches [ui-studio P10 file](../../ui-studio/phases/P10-ai-templates.md)
