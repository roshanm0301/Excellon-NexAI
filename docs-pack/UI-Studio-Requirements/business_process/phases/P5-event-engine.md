# P5 — Behavior & Event Engine

**Milestone:** M6
**Track:** Track 7 — Behavior and Event Engine
**Implementation:** [docs/ui-studio/phases/P5-event-engine.md](../../ui-studio/phases/P5-event-engine.md)

---

## Business Goal

Allow business configurators to define reactive UI behavior without writing code. When a user changes a field or a grid cell, the system must respond intelligently based on configured rules — showing or hiding fields, refreshing lookups, recalculating values, and triggering warnings.

---

## Supported Event Triggers

| Event | When It Fires |
|---|---|
| Header field change | User changes the value of a field in the header form |
| Grid cell change | User changes the value of a cell in a line grid |
| Action click | User clicks a configured action button |
| Row selection | User selects a row in a list or grid |
| Form load | View loads for a given record |
| Before save | Immediately before the record is saved |
| After save | Immediately after a successful save |

---

## Field Change Behaviours Supported

| Behaviour | Business Example |
|---|---|
| Show field | Show "Approval Comment" field when status is Pending |
| Hide field | Hide "Export Details" section when Sale Type is Domestic |
| Enable field | Enable "Discount" field when customer is a VIP |
| Disable field | Disable "Rate" field when item is a fixed-price product |
| Required | Make "Reference Number" required when payment mode is Cheque |
| Optional | Make "Serial Number" optional when item is a service |
| Clear dependent field | Clear "Warehouse" when "Branch" changes |
| Refresh lookup | Refresh "Item Code" lookup when "Product Type" changes |
| Recalculate value | Recalculate "Amount" when Qty or Rate changes |
| Show warning | Show "High Discount" warning when discount > 20% |
| Show popup | Show confirmation popup before applying bulk discount |
| Auto-populate | Fill "Rate" and "Tax Code" when an item is selected |

---

## Grid Cell Change Behaviours Supported

| Behaviour | Business Example |
|---|---|
| Recalculate row amount | Qty × Rate = Amount, updated on any change to Qty or Rate |
| Auto-populate related columns | Selecting Item fills Rate, Tax Code, HSN code |
| Refresh row lookup | Item lookup refreshed when product category changes in that row |
| Show row warning | Warn if row quantity exceeds stock level |
| Call domain service | Trigger pricing / tax / stock check service for the row |
| Apply row-level validation | Show validation feedback inline in the grid cell |

---

## Important Constraints

- No product-specific logic must be hardcoded inside the event engine
- All event configurations are metadata-driven
- The event engine is purely a behaviour executor — it does not own business rules
- Circular event dependencies (Field A → Field B → Field A) must be detected and blocked at publish time
- Expression evaluation must be safe — no arbitrary code execution

---

## Required Skills

| Skill | Why Needed |
|---|---|
| Event-driven UI design | Understand reactive form patterns |
| State management | Apply effects to form state correctly |
| Rule integration | Understand boundary with the Rules Engine |
| Data dependency modeling | Detect and prevent circular event chains |
| Reactive form behaviour | Cascading refresh, recalculation, conditional visibility |
| UX consistency | Behaviour feels natural and predictable to end users |
| Testing dynamic screens | Verify all event chains behave correctly |

---

## Codex Task Prompt

```
Implement configurable field change and grid cell change events.

Field change should support:
- Clear dependent field
- Refresh dependent lookup
- Apply data-source filter
- Recalculate value
- Show / hide field
- Enable / disable field
- Show warning or popup

Grid cell change should support:
- Auto-populate related columns
- Recalculate amount
- Refresh row lookup
- Show row warning
- Trigger stock / pricing / tax service output
- Apply row-level validation feedback

Do not hardcode product-specific logic inside UI Studio.
```

---

## Business Success Criteria

- A configurator can define field change events without writing code
- Configured events fire correctly at runtime and produce the expected UI behaviour
- Circular event dependencies are caught before publish — user sees a clear error
- Grid cell changes trigger recalculation and auto-population correctly

---

## BA Verification Checklist

- [ ] All field change behaviour types are configurable in the designer
- [ ] All grid cell change behaviour types are configurable
- [ ] Events fire correctly at runtime for each configured trigger
- [ ] Circular dependency detected at publish — V021 error shown
- [ ] No hardcoded product logic in event engine
- [ ] Expression evaluation is safe (no eval / no new Function)
- [ ] Behaviour tested: show/hide, refresh lookup, recalculate, auto-populate
- [ ] Implementation matches [ui-studio P5 file](../../ui-studio/phases/P5-event-engine.md)
