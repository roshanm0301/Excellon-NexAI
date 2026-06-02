# P3 — View Designer

**Milestone:** M4
**Track:** Track 4 — View Designer
**Implementation:** [docs/ui-studio/phases/P3-view-designer.md](../../ui-studio/phases/P3-view-designer.md)

---

## Business Goal

Build the UI Studio designer — the workspace where authorized users create and configure views for business entities.

The designer must allow a non-developer business configurator to create a complete, publishable view without writing code. It must be governed, not freeform — only valid configurations should be possible.

---

## Required Designer Capabilities

The designer must support the following user actions:

```
Create a new view
Select a surface type (standard form, transaction, dashboard, etc.)
Bind a primary entity
Set a ViewCode for process-specific views
Drag and place components onto the canvas
Configure layout sections
Add fields from the Entity Designer
Configure grids and columns
Configure lookup and entity picker filters
Configure action buttons
Save as draft
Preview the view with sample data
Publish the view
Rollback to a previous version
```

---

## Surface-Aware Design

The designer must change its canvas zones based on the selected surface type:

| Surface Type | Canvas Zones |
|---|---|
| standard_crud | Form zone + Grid/List zone |
| header_line | Header zone + Lines zone + Footer/Totals zone |
| dashboard | Widget placement zone |
| wizard | Step zones |
| kanban | Board zone |

Components shown in the Library panel must be filtered to only those valid for the current surface type.

---

## Field Picker Requirement

The designer must allow a user to browse the fields of the bound entity and drag them onto the canvas. When a field is dragged, the correct input component must be automatically suggested based on the field's data type.

---

## Constraint Enforcement

The designer must enforce component placement rules:
- A component can only be placed in a parent it is allowed in
- Container components enforce their allowed child types
- Invalid placements must be blocked with a clear message — not silently ignored

---

## State Management

The designer must maintain unsaved changes reliably:
- Draft state must survive page refresh
- Undo / redo must work for component add, remove, move, and property change
- Auto-save draft must be configurable
- Clear indication of unsaved changes (dirty state)

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Frontend engineering | Build the designer canvas and panels |
| React / UI framework | Component-based designer architecture |
| Drag-and-drop UI | Drag components from library to canvas |
| State management | Reliable undo/redo and dirty state |
| Form builder UX | Inspector panels for configuring each component |
| Metadata editing | Store designer output as valid ViewArtifactPayload |
| UX design for admin tools | Efficient, learnable builder experience |

---

## Business Success Criteria

- A business configurator can create a complete view in under 30 minutes without engineering help
- All component placements are governed by surface and parent constraints
- Draft is preserved across page refreshes
- Undo / redo works reliably
- At least one view can be saved as draft and opened again in the same state

---

## BA Verification Checklist

- [ ] New view wizard works: surface → entity → ViewCode → name → canvas
- [ ] All surface types show correct canvas zones
- [ ] Library panel filtered by current surface type
- [ ] Field picker shows entity fields — drag creates bound component
- [ ] Right inspector shows props and binding for every component type
- [ ] Component placement constraints enforced (wrong parent blocked)
- [ ] Save draft → refresh → state restored
- [ ] Undo / redo works for add, remove, move, change props
- [ ] Implementation matches [ui-studio P3 file](../../ui-studio/phases/P3-view-designer.md)
