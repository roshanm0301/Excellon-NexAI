# P2 — Component Registry

**Milestone:** M3
**Track:** Track 3 — Component Registry + §8 Additional Components + §9 Registry Requirements
**Implementation:** [docs/ui-studio/phases/P2-component-registry.md](../../ui-studio/phases/P2-component-registry.md)

---

## Business Goal

Create a typed, governed registry of all UI components available in UI Studio. Every component must be defined through this registry — no hardcoded components in individual forms or views.

The registry is the single source of truth for what components exist, what surfaces they support, what bindings they accept, and how they behave at runtime and in the designer.

---

## Why a Registry Matters

Without a registry:
- Components get hardcoded into individual forms
- No governance over what can be placed where
- No way to extend the system with new components safely
- Runtime cannot dynamically load the correct renderer

With a registry:
- Every component is defined once and reused everywhere
- Surface constraints enforced at design time (e.g. editor_grid only on header_line)
- New components added by registering — not by modifying core code
- Plugin components follow the same contract as platform components

---

## Required Component Definition

Each component in the registry must define:

| Field | Purpose |
|---|---|
| Component code | Unique identifier (e.g. `text_input`, `editor_grid`) |
| Component name | Human-readable label |
| Component category | Grouping (Input / Transaction / Visualization / Workflow / etc.) |
| Supported surfaces | Which surface types this component can be placed on |
| Supported bindings | What data types this component can bind to |
| Configuration schema | JSON Schema for all configurable properties |
| Event support | What events this component emits or handles |
| Permission behavior | How hidden / disabled / masked states affect this component |
| Runtime renderer mapping | Which React component renders this at runtime |
| Designer configuration panel | Which panel shows in the Right Inspector |
| Preview support | Whether component can be shown in preview mode |
| Validation rules | Rules checked at publish time for this component |

---

## Component Categories

| Category | Examples |
|---|---|
| Core Input | Text input, number, date, dropdown, toggle, entity picker |
| Transaction | Totals panel, tax column, action bar, validation summary |
| Visualization | Bar chart, KPI card, calendar, kanban board, Gantt |
| Navigation / Structural | Page root, section, tab container, column layout, card |
| Media / Document | File upload, image gallery, rich text editor |
| Location | Map / geolocation |
| Workflow | Status strip, approval panel, audit timeline |
| Governance | Validation summary, record highlights |

---

## Additional Required Components

These 12 components must be registered as standard configurable components — not hardcoded in specific forms:

| Component | Business Use Case |
|---|---|
| Conditional Row Formatting | Highlight overdue, approved, exception, or high-value rows |
| Tree / Hierarchy View | Org chart, category tree, bill of materials, approval hierarchy |
| Calendar / Schedule View | Service jobs, delivery schedules, booking slots, task timelines |
| Timeline / Gantt View | Project milestones, repair stages, order tracking |
| Map / Geolocation | Dealer location, delivery route, service area visualization |
| Signature Capture | Customer sign-off for delivery, service, inspection, finance agreements |
| Rich Text | Notes, remarks, formatted customer-facing descriptions |
| Image / Document Gallery | Vehicle images, inspection photos, document attachments |
| Rating / Scoring | Customer satisfaction, inspection score, quality rating |
| Progress Bar / Gauge | SLA usage, budget utilization, completion percentage |
| Sparkline / Mini Chart | Row-level trend indicator in grids |
| QR / Barcode Display | VIN, item barcode, GRN receipt code |

---

## Plugin Contract Requirement

The registry must support external plugin components using the same contract as platform components. A plugin component must be able to:
- Register itself with a component code
- Define its supported surfaces and bindings
- Provide its own runtime renderer bundle
- Provide its own designer panel bundle
- Be installed and removed without modifying platform code

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Component architecture | Design stable, extensible component contract |
| Schema-driven UI design | Drive designer panels from JSON Schema |
| React component design | Build runtime renderers per component |
| Configuration schema design | Define per-component JSON Schema for props |
| Runtime rendering design | Dynamic import map for all components |
| Component validation | Enforce constraints at publish time |
| Design system understanding | Consistent look and behavior across components |

---

## Codex Task Prompt

```
Implement typed component registry.

Each component must define:
- Component code
- Name
- Category
- Supported surfaces
- Supported bindings
- Config schema
- Event support
- Runtime renderer mapping
- Designer panel mapping
- Validation rules

Register core components, transaction components, visualization components,
structural components, media/document components, and location components.

Include the additional components from the UI Studio add-on list.
```

---

## Business Success Criteria

- All platform components are queryable from the registry API
- Surface filtering works — only valid components shown for selected surface
- Admin screen allows browsing and filtering of all components
- Plugin registration and removal works without modifying platform code
- No component is hardcoded in a form — all sourced from registry

---

## BA Verification Checklist

- [ ] All 56 platform components registered (8 layout + 14 form + 10 display + 8 data + 6 transaction + 4 visualization + 4 workflow + 2 media)
- [ ] All 12 additional components registered
- [ ] Each component has: code, category, supported surfaces, supported bindings, config schema, runtime renderer, designer panel
- [ ] Surface filter returns correct subset
- [ ] Plugin install / remove works
- [ ] Admin screen visible and functional
- [ ] Implementation matches [ui-studio P2 file](../../ui-studio/phases/P2-component-registry.md)
