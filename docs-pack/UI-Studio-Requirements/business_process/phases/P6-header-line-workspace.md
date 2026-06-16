# P6 â€” Header-Line Transaction Workspace

**Milestone:** M7
**Track:** Track 9 â€” Header-Line Transaction Workspace
**Implementation:** [docs/ui-studio/phases/P6-header-line-workspace.md](../../ui-studio/phases/P6-header-line-workspace.md)


---

## Business Goal

Build first-class support for transaction documents â€” Sale Orders, Purchase Orders, Service Jobs, and similar documents â€” as a configurable, metadata-driven surface.


---

## Why This Is a First-Class Surface

In a DMS / ERP context, the majority of high-value transactions follow the header-line pattern:
- Sale Order: Customer (header) + Sale Items (lines) + Tax / Charges + Total
- Purchase Order: Supplier (header) + Purchase Items (lines) + GST + Total
- Service Job: Vehicle (header) + Labour / Parts (lines) + Charges + Total
- Invoice: Party (header) + Invoice Lines + Tax + Total

Without a dedicated header-line surface, these documents would require custom code for every transaction type. With it, any transaction document is configured â€” not coded.

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
  - Save Draft, Submit, Approve, Reject, Cancel â€” configured, not hardcoded

  - Current state display

Attachment / notes panel
  - Document uploads and free-text notes for the transaction

Validation summary
  - Collapsible list of all active errors and warnings

ViewCode propagation
  - Every API call from this surface includes the ViewCode
```

---

## Generic â€” Not Document-Specific

> This surface type must be completely generic. It must not contain any Sale Order, Purchase Order, or any specific document logic.

The Sale Order is used as the reference exit-condition test â€” but the surface itself must work for any entity that follows the header-line pattern.

---

## Required Skills

| Skill | Why Needed |
|---|---|
| ERP transaction understanding | Know how header-line documents work in business context |
| Header-line data modeling | Design the generic header + lines + totals data model |
| Editable grid design | In-cell editing, add/delete rows, row events |
| Pricing / tax UI understanding | Dynamic charge columns, tax display patterns |
| Stock / quantity UI behaviour | Qty change triggers amount recalculation |
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
- Attachment / notes panel
- Validation summary
- Save / submit / approve / reject / cancel actions
- ViewCode propagation to backend
```

---

## Business Success Criteria

- A Sale Order can be created, line items added, amounts calculated, and the order submitted for approval â€” entirely through a configured UI Studio view
- No Sale Order-specific code exists in the surface implementation
- Dynamic tax columns are fetched from the tax service â€” not configured manually per view
- ViewCode is present in every backend API call

---

## BA Verification Checklist

- [ ] Header form fields bind to primary entity
- [ ] One or more line grids configurable per view
- [ ] Line grid supports: add row, delete row, inline edit
- [ ] Dynamic charge columns fetched from service â€” not hardcoded
- [ ] Totals panel calculates correctly from configured expressions
- [ ] Action bar: Save, Submit, Approve, Reject, Cancel all work
- [ ] Attachment / notes panel present
- [ ] Validation summary shows errors and warnings
- [ ] ViewCode present in all API calls from this surface
- [ ] Sale Order E2E test passes (header + 3 lines + totals + submit â†’ Pending Approval)
- [ ] Implementation matches [ui-studio P6 file](../../ui-studio/phases/P6-header-line-workspace.md)
