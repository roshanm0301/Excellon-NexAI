# P7 — Workflow & Rule UX Integration

**Milestone:** M8
**Track:** Track 8 — Workflow and Rule UX Integration
**Implementation:** [docs/ui-studio/phases/P7-workflow-rule-ux.md](../../ui-studio/phases/P7-workflow-rule-ux.md)

> **Track order note:** Source document has this as Track 8. Phase ordering follows the implementation sequence — workflow UX (P7) is built after the header-line workspace (P6) because workflow rendering depends on a rendered transaction surface.

---

## Business Goal

Surface the existing workflow engine and rule engine outputs inside every published UI Studio view. Business users must be able to see the current workflow state, take approved actions, view approval history, and receive field-level validation feedback — all driven by backend engine outputs, not hardcoded UI logic.

---

## What UI Studio Must Display

UI Studio **displays** workflow state and rule feedback. It does **not** own or compute transitions, approvals, or validation truth.

| Display Area | What It Shows |
|---|---|
| Workflow Status Strip | Current workflow state, allowed action buttons, disabled actions with reason |
| Approval Panel | Previous approval decisions (who, when, comment), current approver textarea |
| Workflow Timeline | Full state transition history with timestamps |
| Rule Validation Display | Field-level errors (red), field-level warnings (yellow) |
| Validation Summary | Collapsible list of all active errors and warnings across the whole record |

---

## Workflow Status Strip Requirements

The status strip must:
- Show all workflow steps as a step indicator (breadcrumb), current step highlighted
- Render allowed action buttons from the backend engine response — not from a hardcoded list
- Render disabled actions as greyed-out buttons with a tooltip showing the reason why the action is disabled
- Show time elapsed in the current step

---

## Approval Panel Requirements

The approval panel is shown when the backend response includes an action with `requires_comment: true`:
- Display list of previous approval decisions: approver name, decision, comment, timestamp
- Provide a textarea for the current approver's comment
- Provide Approve and Reject buttons
- Approval action calls the workflow transition API
- UI Studio does NOT implement the transition logic — it only calls the API

---

## Rule Validation Display Requirements

Rule feedback is fetched from the backend rule engine:
- Field with an error: red border + error message displayed below the field
- Field with a warning: yellow border + warning message displayed below the field
- ValidationSummary panel: collapsible list of all active errors and warnings
- If errors are present, the Save / Submit action must be blocked
- Validation fires on: field change (debounced) and immediately before save or submit

---

## Important Constraints

- UI Studio **displays** workflow state — it does not own transitions or approval routing
- Allowed action buttons are rendered from the backend response — never hardcoded in the view configuration
- Rule errors and warnings come from the rule engine — UI Studio does not compute them

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Workflow UX patterns | Understand how approval flows are surfaced to end users |
| Rule-driven form feedback | Apply inline validation feedback from backend |
| State-aware component design | Disable components based on workflow state |
| API contract understanding | Map backend response shapes to UI rendering decisions |
| ERP transaction UX | Know what approvers and submitters need to see |

---

## Codex Task Prompt

```
Implement Workflow and Rule UX Integration.

Requirements:
- WorkflowStatusStrip: fetch workflow state from backend, render step indicator,
  allowed action buttons (from engine output), disabled actions with tooltip.
- ApprovalPanel: show approval history, comment textarea, Approve/Reject buttons.
  Call workflow transition API on action.
- WorkflowTimeline: render state transition history.
- ValidationSummary: collapsible list of all errors and warnings.
- Rule validation: red border + message for errors, yellow for warnings.
- Block submit if errors present.
- All workflow action buttons sourced from backend response — none hardcoded.
- UI Studio does NOT own workflow transitions.
```

---

## Business Success Criteria

- Business user sees the current workflow state of any record without opening a separate workflow screen
- Allowed action buttons are shown only when permitted by the workflow engine
- Approval comment and decision is recorded against the correct workflow step
- Field-level validation errors are shown inline — the user knows exactly which field has a problem
- A record with active errors cannot be submitted

---

## BA Verification Checklist

- [ ] Status strip shows correct state badge for record in each workflow state
- [ ] Allowed action buttons rendered from backend engine response — not hardcoded
- [ ] Disabled actions rendered greyed with tooltip showing reason
- [ ] Approval panel shows previous decisions with comment and timestamp
- [ ] Approve and Reject buttons call workflow transition API
- [ ] Timeline shows full state transition history
- [ ] Field-level error shown as red border + message
- [ ] Field-level warning shown as yellow border + message
- [ ] ValidationSummary lists all active errors and warnings
- [ ] Save / Submit blocked when active errors present
- [ ] Fixing error removes it from ValidationSummary
- [ ] Implementation matches [ui-studio P7 file](../../ui-studio/phases/P7-workflow-rule-ux.md)
