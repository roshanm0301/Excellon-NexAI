# P4 â€” Runtime Renderer & Data Binding

**Milestone:** M5
**Track:** Track 5 â€” Runtime Renderer + Track 6 â€” Data Binding & Data Source Override
**Implementation:** [docs/ui-studio/phases/P4-runtime-renderer.md](../../ui-studio/phases/P4-runtime-renderer.md)

> **Note:** Track 6 (Data Binding) is merged into this phase. Data binding is a core capability of the runtime renderer â€” fields cannot render without it.

---

## Business Goal

Render published views from metadata at runtime with real entity data. The runtime must faithfully execute the designer's configuration â€” layout, components, bindings, permissions, and behavior â€” without any hardcoded form logic.

---

## Runtime Requirements

```
Load the active published view for a given entity and route
Resolve the layout and surface zones
Render all components from the component registry
Resolve entity field bindings to actual record values
Render lookup / entity picker fields with their data sources
Render grids bound to related entity data
Apply data source overrides and filter configurations
Apply permission-aware rendering (hide / disable / mask)
Apply configured behavior rules
Display validation errors and warnings from the rule engine
Handle broken or missing metadata safely â€” no page crash
```

---

## Data Binding Requirements

### Binding Types Supported

| Binding Type | Business Meaning |
|---|---|
| Entity field | Component displays / edits a specific field of the primary entity |
| Relationship | Component displays related entity data |
| Lookup / data source | Component draws its options from a configured query |
| Computed | Component value derived from an expression over form state |
| Context | Component draws from session context (user, tenant, role, date) |

### Cascading Lookup Requirement

When a parent entity picker changes its value, any dependent child entity pickers must:
1. Clear their current value
2. Re-query their options using the new parent value as a filter

Example: Branch changes â†’ Warehouse picker clears and re-fetches warehouses for the new branch.

### Data Source Override

A view can override the default data source for a lookup or grid with:
- A different entity type
- Additional filter conditions
- Custom sort order
- Join configuration

This allows the same component type to behave differently per view without modifying the component.

---

## Permission-Aware Rendering

> **Boundary:** UI Studio applies permission decisions received from the Permission Service. UI Studio does NOT make permission decisions itself.

The runtime must apply the following permission outcomes:

| Permission Outcome | Runtime Behaviour |
|---|---|
| Field not in visible fields | Field is completely absent from the DOM â€” not CSS hidden |
| Field not in editable fields | Field is rendered as disabled / read-only |
| Field in masked fields | Field value shown as `***` |
| Action not in allowed actions | Action button is absent from the DOM |

---

## Error Handling Requirement

The runtime must handle broken metadata safely:
- A broken component (invalid code, missing props, renderer error) must show an error placeholder
- The error placeholder must NOT show raw metadata or stack traces to end users
- The rest of the view must continue to render normally
- Only the broken component is affected

---

## Backward Compatibility Requirement

Existing form pages that do not yet have a published UI Studio view must continue to work. When a UI Studio view is published for an entity, the system should automatically use it. When no published view exists, the system falls back to the existing dynamic renderer.

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Runtime architecture | Build a clean, layered rendering pipeline |
| Frontend rendering engine | Dynamic component loading and rendering |
| Metadata interpretation | Resolve payload into live UI |
| Data binding | Resolve entity fields, data sources, computed values |
| Permission-aware rendering | Apply backend permission decisions correctly |
| Error boundary design | Isolate broken components without crashing the page |
| Performance optimization | Fast initial render and efficient re-rendering |

---

## Codex Task Prompt

```
Implement runtime renderer for published UI Studio views.

Requirements:
- Load published view by route or ViewCode.
- Render layout regions and components.
- Resolve entity field bindings.
- Render lookups and data-source overrides.
- Render line grids bound to line entities.
- Apply behavior rules.
- Apply permission-aware rendering.
- Display validation errors and warnings.
- Handle broken metadata gracefully.
```

---

## Business Success Criteria

- A published view renders the correct entity record data without any code changes
- Permission rules are respected â€” hidden fields genuinely absent from the page
- Broken component shows placeholder â€” page does not crash
- Cascading lookup refreshes correctly when parent changes
- Existing views continue to work when no Studio view is published

---

## BA Verification Checklist

- [ ] Published view renders with real entity record data
- [ ] Entity field bindings resolve correctly
- [ ] Lookup / entity picker loads correct options
- [ ] Cascading lookup: parent change clears and refreshes child picker
- [ ] Data source override applies configured filter
- [ ] Hidden field is absent from DOM (not CSS hidden) â€” confirmed by inspection
- [ ] Masked field shows `***`
- [ ] Broken component shows error placeholder â€” rest of view renders
- [ ] Existing dynamic form pages still work when no Studio view published
- [ ] Implementation matches [ui-studio P4 file](../../ui-studio/phases/P4-runtime-renderer.md)
