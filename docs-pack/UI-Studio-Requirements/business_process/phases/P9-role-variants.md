# P9 â€” Role Variants, Permissions & Enterprise Depth

**Milestone:** M10
**Track:** P1 Features (P1-24, P1-29 through P1-36) â€” no direct source track
**Implementation:** [docs/ui-studio/phases/P9-role-variants.md](../../ui-studio/phases/P9-role-variants.md)

---

## Business Goal

Different users looking at the same transaction document must see different views of it. A salesperson sees their own fields; a manager sees additional approval controls; a read-only auditor sees masked sensitive data. These are not different forms â€” they are the same published view with role-specific overlays applied at runtime.

This phase also delivers the remaining P1 enterprise features: relationship panels, bulk actions, advanced filtering, cascading lookups, modal/drawer builders, and record summary highlights.

---

## Role / Context Variants

A variant is a delta overlay applied on top of the base published view payload for a specific role or context. It is **not** a clone or a separate view.

### Variant Condition Types

| Condition Type | Example |
|---|---|
| Role | Show "Discount" field only for Salesperson role |
| Record field value | Show "Export Details" section only when Sale Type is Export |

### Variant Priority

When multiple variants match (e.g., user is both Salesperson and a VIP customer), the variant with the highest priority setting takes effect.

### Variant Scope

A variant can override:
- Which fields are visible
- Which fields are editable
- Which action buttons are shown
- Which sections are visible

---

## Permission-Aware Rendering

> **Boundary:** UI Studio applies permission decisions received from the Permission Service. UI Studio does NOT make permission decisions itself.

| Permission Decision | How UI Studio Renders It |
|---|---|
| Field not in visible fields | Component is **completely absent from the DOM** â€” not CSS hidden |
| Field not in editable fields | Component rendered as disabled (read-only) |
| Field in masked fields | Value shown as `***` |
| Action not in allowed actions | Action button is **completely absent from the DOM** |

The security requirement is: a user who is not permitted to see a field must not be able to find it by inspecting the page source.

---

## P1 Features Delivered in This Phase

| Feature | Business Purpose |
|---|---|
| P1-24 Relationship Panel | Show related records (e.g., all invoices for a customer) below the main form |
| P1-29 Bulk Actions | Select multiple rows in a list and apply one action to all selected records |
| P1-30 Saved View Configuration | User saves their preferred filter presets and column arrangement per view |
| P1-31 Advanced Filter Builder | Visual condition builder for complex multi-field filter combinations |
| P1-32 Role / Persona / Context Variants | Configure view overlays per role or record state |
| P1-33 Permission-Aware Rendering | Full DOM removal for fields and actions the user is not permitted to see |
| P1-34 Cascading Lookup Configuration | Child lookup clears and re-fetches when parent field changes |
| P1-35 Modal / Drawer / Side Panel | Open related record forms in a modal or drawer without navigating away |
| P1-36 Record Summary / Highlights | KPI-style summary bar at the top of a form showing computed values |

---

## Cascading Lookup Business Rules

When a user changes the value of a parent field (e.g., Branch), all child lookups that depend on it (e.g., Warehouse) must:
1. Clear their current selected value
2. Re-query their option list filtered to the new parent value

This must work at runtime without any custom code â€” it is configured in the view designer.

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Role-based UX design | Design overlays that feel natural, not bolted-on |
| Security-aware rendering | Understand DOM removal vs CSS hiding distinction |
| Conditional display logic | Apply variant conditions at runtime |
| Data dependency modeling | Cascading lookup parent-child relationships |
| Permission service integration | Correctly apply backend permission decisions |
| Enterprise UX patterns | Bulk actions, saved presets, relationship panels |

---

## Codex Task Prompt

```
Implement Role Variants, Full Permission-Aware Rendering, and P1 Enterprise Features.

Role variants:
- VariantPanel in designer: define conditions and field/action overrides per variant.
- variantResolver at runtime: load base payload + apply matching variant delta.
- Multiple matching variants: highest priority wins.

Permission-aware rendering:
- Fields NOT in visible_fields â†’ ABSENT from DOM (not CSS hidden).
- Fields NOT in editable_fields â†’ rendered disabled.
- Fields IN masked_fields â†’ value shown as ***.
- Actions NOT in allowed_actions â†’ ABSENT from DOM.

Cascading lookups:
- Configure parent field in inspector Binding tab.
- At runtime: parent change â†’ clear child value, re-fetch child options with parent value as filter.

P1 features:
- RelationshipPanelRuntime: show related records below main form.
- Bulk action bar: appears when rows checked in list_grid.
- Saved filter presets: stored per view per user.
- ConditionTreeBuilder in filter mode on list_grid.
- ModalDrawerRuntime: triggered by button click, configurable panel width.
- RecordHighlights: computed KPI bar at top of form.
```

---

## Business Success Criteria

- A salesperson opening a Sale Order sees a different field set than a manager opening the same record â€” without any code change
- A field excluded by permissions is truly invisible to the user â€” cannot be found in the page source
- Changing Branch clears Warehouse and fetches only warehouses for the new branch
- Bulk approve of 10 records fires in a single action
- Role variant configuration is done in the UI Studio designer â€” no developer involvement required

---

## BA Verification Checklist

- [ ] Variant overlay applies correctly at runtime for matching role
- [ ] Two variants matching: highest priority variant takes effect
- [ ] Field NOT in visible_fields: DOM inspection confirms element is absent (not just hidden)
- [ ] Field in masked_fields: value rendered as `***`
- [ ] Action NOT in allowed_actions: button absent from DOM
- [ ] Cascading lookup: changing parent field clears child and re-queries with new parent
- [ ] Relationship panel shows related records below main form
- [ ] Bulk action bar appears when rows selected; action fires for all selected records
- [ ] Saved filter presets persist and restore on next visit
- [ ] Advanced filter builder supports multi-field condition combinations
- [ ] Modal/drawer opens on button click; closes correctly
- [ ] Record summary/highlights panel shows computed values
- [ ] Implementation matches [ui-studio P9 file](../../ui-studio/phases/P9-role-variants.md)
