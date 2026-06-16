# P8 â€” Publish Lifecycle & Governance

**Milestone:** M9
**Track:** Track 10 â€” Publish Lifecycle and Governance
**Implementation:** [docs/ui-studio/phases/P8-publish-governance.md](../../ui-studio/phases/P8-publish-governance.md)

---

## Business Goal

Make publishing a UI Studio view a safe, auditable, and reversible operation. A misconfigured view must never reach end users. Every publish action must be logged. Any version must be restorable. Business configurators must be able to preview exactly how a view looks before it goes live.

---

## Publish Lifecycle

The lifecycle has four stages:

```
Draft â†’ [Validate] â†’ [Preview] â†’ Publish â†’ Active
                                     â†‘
                       Rollback from any prior active version
```

### Lifecycle Rules

| Rule | Business Meaning |
|---|---|
| Only one version active per view | Two active versions of the same view never served simultaneously |
| Published versions are immutable | Once published, a version cannot be edited â€” saving creates a new draft |
| Rollback re-activates a prior version | Any previously active version can be restored instantly |
| Runtime only loads active versions | Draft views are never visible to end users |
| Cache invalidated on publish / rollback | Users see the new version immediately |

---

## Publish Validation

Before a view can be published, 41 validation rules are checked. A view with any error-severity violation cannot be published.

### Validation Rule Categories

| Category | Rules | Examples |
|---|---|---|
| Structural | V001â€“V005 | Page root must have at least one section; component key must be unique |
| Binding | V010â€“V014 | Field binding references non-existent entity field; lookup has no data source |
| Events | V020â€“V024 | Event action targets field not in view; circular event dependency |
| Performance | V040â€“V041 | View has more than 100 components; multiple eager data sources |
| Schema Drift | V050â€“V051 | Bound entity field was deleted; bound field type changed |
| Accessibility | A001â€“A005 | Missing label on input field |
| Localization | L001â€“L004 | Hardcoded text found in user-facing label |

---

## Preview Requirements

Before publishing, a configurator must be able to preview the view exactly as an end user will see it:

- Simulate viewing as different roles: Admin, Clerk, Approver, ReadOnly
- Choose an existing record or use a blank record
- Test on Desktop, Tablet, and Mobile device sizes
- See schema drift warnings if any bindings are broken against the current entity definition

---

## Semantic Diff Requirements

When comparing two published versions, the system must show a human-readable summary of what changed:

- Added components (new)
- Removed components (deleted)
- Changed component properties (before â†’ after)
- Added or removed event definitions
- Changed field bindings
- Changed metadata (view label, surface type, view code)

---

## Schema Drift Detection

If an entity field is renamed or deleted after a view is published, the published view may have broken bindings. The system must:

- Detect broken bindings whenever the designer opens a view
- Show a warning banner: "3 bindings need attention"
- Provide a Sync Panel listing each broken binding with a suggested fix (rebind to new field or remove the component)

---

## Audit Trail Requirements

Every action on a published view must be logged:

| Action | Logged |
|---|---|
| Draft saved | Yes |
| Published | Yes â€” with who and when |
| Rolled back | Yes â€” with which version was restored and who did it |
| Archived | Yes |

The Version History panel must show all versions with their status, published by, and published at.

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Publish lifecycle design | Understand immutable versioning patterns |
| Validation rule design | Define and enforce pre-publish checks |
| Diff and versioning concepts | Compare JSONB payloads semantically |
| Schema change management | Detect entity field changes that break views |
| Audit trail design | Log all config changes for compliance |
| Preview UX | Simulate role + context in a sandboxed preview |

---

## Codex Task Prompt

```
Implement Publish Lifecycle and Governance.

Requirements:
- Publish lifecycle: Draft â†’ Validate â†’ Preview â†’ Publish â†’ Active.
- Only one active version per view at any time.
- Published versions are immutable.
- Rollback: re-activate any prior version.
- Runtime: never loads draft versions.
- Publish validation: implement all 41 validation rules (V001â€“V051 + A001â€“A005 + L001â€“L004).
  Block publish if any error-severity violation found.
- Preview modal: role simulation, record picker, device size toggle.
- Semantic diff view: show added/removed/changed components and bindings between two versions.
- Schema drift detection: detect broken bindings when designer opens a view.
- Audit trail: log every draft_saved, published, rolled_back, archived event.
- Version history panel: list all versions with status, by, and at.
```

---

## Business Success Criteria

- A misconfigured view (broken binding, circular event) cannot be published â€” validation blocks it with a clear error
- A published view can be rolled back to any prior version in one action
- The preview shows exactly what the end user will see, including permission filtering
- Every publish and rollback is in the audit log â€” the compliance team can trace any configuration change
- Schema drift is detected automatically â€” configurator is alerted before it causes a runtime error

---

## BA Verification Checklist

- [ ] Draft save works without triggering validation
- [ ] Validate action runs all 41 rules and returns structured errors
- [ ] View with error-severity violation cannot be published
- [ ] Preview modal shows correct layout for selected role
- [ ] Preview shows correct device layout (Desktop / Tablet / Mobile)
- [ ] Publish creates new immutable version and marks it active
- [ ] Previous active version is marked inactive on new publish
- [ ] Rollback re-activates correct prior version
- [ ] Runtime only serves active version after rollback
- [ ] Semantic diff shows added / removed / changed components
- [ ] Schema drift warning banner shown when bindings broken
- [ ] Sync Panel shows each broken binding with suggested fix
- [ ] Audit trail logs: draft_saved, published, rolled_back, archived
- [ ] Version history panel shows all versions with who and when
- [ ] Implementation matches [ui-studio P8 file](../../ui-studio/phases/P8-publish-governance.md)
