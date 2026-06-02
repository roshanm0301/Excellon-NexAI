# P6 — Header-Line Transaction Workspace

**Milestone:** M7
**Track:** Track 9 — Header-Line Transaction Workspace
**Implementation:** [docs/ui-studio/phases/P6-header-line-workspace.md](../../ui-studio/phases/P6-header-line-workspace.md)

> **Track order note:** Source document has this as Track 9. Phase ordering follows the implementation sequence — header-line workspace (P6) is built before workflow UX (P7) because workflow rendering depends on a rendered transaction surface.

---

## Business Goal

Build first-class support for transaction documents — Sale Orders, Purchase Orders, Service Jobs, and similar documents — as a configurable, metadata-driven surface.

This is not a generic form builder feature. The header-line transaction workspace is a distinct surface type that mirrors how ERP transaction documents are structured: a header with master data, one or more line item grids, dynamic charge columns, a totals panel, and workflow / attachment areas.

---

## Why This Is a First-Class Surface

In a DMS / ERP context, the majority of high-value transactions follow the header-line pattern:
- Sale Order: Customer (header) + Sale Items (lines) + Tax / Charges + Total
- Purchase Order: Supplier (header) + Purchase Items (lines) + GST + Total
- Service Job: Vehicle (header) + Labour / Parts (lines) + Charges + Total
- Invoice: Party (header) + Invoice Lines + Tax + Total

Without a dedicated header-line surface, these documents would require custom code for every transaction type. With it, any transaction document is configured — not coded.

---

## Required Capabilities

```
Header entity form
  - Bind to a primary entity (e.g. SaleOrder, PurchaseOrder)
  - Configure header sections and field layout
  - Configure action bar (Save, Submit, Approve, Reject, Cancel)

One or more line grids
  - Bind each grid to a line entity (e.g. SaleOrderLine)
  - Configure static columns (Item, Qty, Rate, Amount, etc.)
  - Configure dynamic tax / charge columns (GST, VAT, Discount, etc.)
  - Support inline edit, add row, delete row

Dynamic tax / charge columns
  - Columns fetched from a domain service at runtime
  - Prevents hardcoding tax structures in UI configuration

Totals panel
  - Configurable expression rows (Subtotal, Tax, Grand Total)
  - Expressions evaluated over line data (e.g. sum of line amounts)

Action bar
  - Save Draft, Submit, Approve, Reject, Cancel — configured, not hardcoded
  - Actions trigger workflow transitions via the Workflow Engine

Workflow status strip
  - Current state display
  - Allowed action buttons rendered from workflow engine output

Attachment / notes panel
  - Document uploads and free-text notes for the transaction

Validation summary
  - Collapsible list of all active errors and warnings

ViewCode propagation
  - Every API call from this surface includes the ViewCode
  - Backend uses ViewCode to select the correct rule set and workflow definition
```

---

## Generic — Not Document-Specific

> This surface type must be completely generic. It must not contain any Sale Order, Purchase Order, or any specific document logic.

The Sale Order is used as the reference exit-condition test — but the surface itself must work for any entity that follows the header-line pattern.

---

## Required Skills

| Skill | Why Needed |
|---|---|
| ERP transaction understanding | Know how header-line documents work in business context |
| Header-line data modeling | Design the generic header + lines + totals data model |
| Editable grid design | In-cell editing, add/delete rows, row events |
| Pricing / tax UI understanding | Dynamic charge columns, tax display patterns |
| Stock / quantity UI behaviour | Qty change triggers amount recalculation |
| Workflow-driven transaction UX | Approve/reject actions, status progression |
| Complex form performance | Efficient rendering of large grids and frequent recalculations |

---

## Codex Task Prompt

```
Implement Header-Line Transaction Workspace surface.

Use Sale Order / Vehicle Booking as reference.

Support:
- Header entity binding
- One or more line grids
- Line entity binding
- Header fields
- Grid columns
- Lookup fields
- Dynamic tax / charge columns
- Totals panel
- Action bar
- Workflow status strip
- Attachment / notes panel
- Validation summary
- Save / submit / approve / reject / cancel actions
- ViewCode propagation to backend
```

---

## Business Success Criteria

- A Sale Order can be created, line items added, amounts calculated, and the order submitted for approval — entirely through a configured UI Studio view
- No Sale Order-specific code exists in the surface implementation
- Dynamic tax columns are fetched from the tax service — not configured manually per view
- ViewCode is present in every backend API call

---

## BA Verification Checklist

- [ ] Header form fields bind to primary entity
- [ ] One or more line grids configurable per view
- [ ] Line grid supports: add row, delete row, inline edit
- [ ] Dynamic charge columns fetched from service — not hardcoded
- [ ] Totals panel calculates correctly from configured expressions
- [ ] Action bar: Save, Submit, Approve, Reject, Cancel all work
- [ ] Workflow status strip shows current state and allowed actions
- [ ] Attachment / notes panel present
- [ ] Validation summary shows errors and warnings
- [ ] ViewCode present in all API calls from this surface
- [ ] Sale Order E2E test passes (header + 3 lines + totals + submit → Pending Approval)
- [ ] Implementation matches [ui-studio P6 file](../../ui-studio/phases/P6-header-line-workspace.md)
