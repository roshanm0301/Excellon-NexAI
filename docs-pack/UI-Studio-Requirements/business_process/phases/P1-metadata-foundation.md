# P1 — Metadata Foundation

**Milestone:** M2
**Track:** Track 2 — Metadata Foundation
**Implementation:** [docs/ui-studio/phases/P1-metadata-foundation.md](../../ui-studio/phases/P1-metadata-foundation.md)

---

## Business Goal

Create a stable, governed metadata model that is the single source of truth for all UI Studio view configurations.

Every view, layout, component placement, field binding, event, and action must be stored as metadata — not as hardcoded UI. The metadata must support versioning so published views are never broken by a new draft.

---

## Key Metadata Objects Required

| Object | Business Purpose |
|---|---|
| View | Represents one configured experience for an entity |
| ViewVersion | Immutable snapshot of a view at publish time |
| SurfaceType | Defines the interaction pattern (form, list, transaction, dashboard, etc.) |
| LayoutRegion | Defines the structural zones within a surface |
| Section | Groups of fields within a layout region |
| ComponentInstance | A placed UI component within a view |
| ComponentProperty | Configuration values for a component instance |
| FieldBinding | Links a component to an entity field or data source |
| GridBinding | Links a grid component to a line entity or relationship |
| GridColumn | Defines a column in a list or line grid |
| DataSourceOverride | View-specific data source or filter configuration |
| FieldEvent | A configured event on a field (change, blur, etc.) |
| GridCellEvent | A configured event on a grid cell |
| ActionDefinition | A configured button or action in the view |
| PublishLog | Audit record of every publish, rollback, or deprecation |
| ValidationResult | Result of publish validation checks |

---

## Required Capabilities

```
View registry — create, list, search views
View versioning — draft / published / archived lifecycle
Surface type model — typed surface categories
Primary entity binding per view
ViewCode support — process discriminator per view
Layout regions and sections
Component instance storage
Component property storage
Field bindings and grid bindings
Data source overrides
Field and grid cell event storage
Action definitions
Publish log and audit trail
Validation result storage
```

---

## Business Rules

- Runtime must only ever load a published (active) version — never a draft
- A published version is immutable — changes create a new draft
- Only one version can be active at a time per view
- All metadata must be tenant-isolated
- Reuse existing artifact tables where available — do not rebuild versioning from scratch

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Database design | Design stable, extensible tables |
| Metadata modeling | Model views, versions, components as first-class objects |
| Versioning design | Ensure safe draft → publish → rollback lifecycle |
| API design | Define clean contracts for designer and runtime |
| Entity relationship modeling | Correct relationships between metadata objects |
| Migration management | Safe schema changes without data loss |
| Governance thinking | Ensure metadata supports audit, rollback, and compliance |

---

## Codex Task Prompt

```
Implement UI Studio metadata foundation.

Support:
- View registry
- View versions
- Draft / published lifecycle
- Surface type
- Primary entity binding
- ViewCode
- Layout regions
- Sections
- Component instances
- Component properties
- Field bindings
- Grid bindings
- Grid columns
- Data source overrides
- Field events
- Grid cell events
- Actions
- Publish logs
- Validation results

Reuse existing metadata where available.
Add migrations safely.
Runtime must load only active published versions.
```

---

## Business Success Criteria

- A view can be created, saved as draft, published, and loaded at runtime
- Published version is never overwritten by a draft save
- Tenant A cannot see Tenant B's views
- All metadata objects from the key objects list are stored and retrievable

---

## BA Verification Checklist

- [ ] All 16 metadata objects are present in the implementation
- [ ] Draft / published lifecycle enforced — runtime never loads draft
- [ ] ViewCode supported per view
- [ ] Tenant isolation confirmed
- [ ] Publish log records every action
- [ ] Implementation matches [ui-studio P1 file](../../ui-studio/phases/P1-metadata-foundation.md) API routes and schema
