# PRD: EXPRESSION-ENGINE.md — Expression Engine

> **Source document:** 10-expression-engine.md

---

## What It Is

The Expression Engine evaluates JSONata expressions — a query/transformation language for JSON. Used for:
- **Computed fields** — field values derived at read time from other fields
- **Expression Studio** — authoring workbench for crafting and testing expressions
- **NLP-generated expressions** — the NLP layer generates JSONata for computed fields

JSONata is evaluated **server-side only** in Go using a `goja` JavaScript VM with an embedded JSONata 1.8.7 bundle.

---

## Go Engine Architecture

**File:** `src/go/internal/expression/engine.go`

```go
type Engine struct {
    pool sync.Pool  // pool of pre-initialized *goja.Runtime
}

func NewEngine() (*Engine, error)

func (e *Engine) Evaluate(ctx context.Context, expression string, data map[string]any) (Result, error)
func (e *Engine) Validate(expression string) error

type Result struct {
    Value interface{}
    Error string
}
```

**VM Pool:** Each VM has `jsonata-bundle.js` pre-loaded. `pool.Get()` = acquire; `pool.Put()` = release. Panicking VMs are discarded. Context cancellation → `vm.Interrupt()` for timeout. Typical evaluation overhead: <1ms for a 10-field entity.

---

## JSONata Patterns

```
unit_price * qty                              → arithmetic
$uppercase(first_name) & " " & last_name      → string concat
status = "active" ? "Yes" : "No"             → conditional
$sum(line_items.amount)                       → array sum
customer.address.city                         → nested field
discount != null ? discount : 0              → default value
$fromMillis($toMillis(order_date), "[D01]/[M01]/[Y0001]")  → date format
```

---

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/expressions/evaluate` | Evaluate expression against data |
| `POST` | `/api/v1/expressions/validate` | Validate syntax only |

```json
// POST /evaluate
{ "expression": "unit_price * qty", "data": { "unit_price": 100, "qty": 3 } }
→ { "value": 300 }

// POST /validate
{ "expression": "unit_price *" }
→ { "error": "Expected expression after operator" }
```

---

## Computed Field Evaluation Flow

Evaluated at **read time** — never stored.

```go
// src/go/internal/entityruntime/computed.go
func evaluateComputedFields(ctx, eng, schema, record)
```

1. Iterate `schema.fields` where `storage_type = "computed"` and `compute_expression` non-empty
2. `eng.Evaluate(ctx, expr, record)` → on success: `record[fieldName] = result.Value`
3. On failure: `record[fieldName] = null` — error logged, never propagated
4. Evaluated in definition order (chained computed fields: base field must be defined first)

---

## ExpressionEditor Component

**File:** `src/react/src/components/expression/ExpressionEditor.tsx`

```typescript
interface ExpressionEditorProps {
  value: string
  onChange: (expr: string) => void
  fields: FieldDef[]   // field chips for click-to-insert
  readOnly?: boolean
}
```

- Monaco Editor with custom JSONata language definition
- Field picker chips above editor — click inserts field name at cursor
- Validate on blur → `POST /api/v1/expressions/validate` → inline error banner
- Used in FieldBuilder Tab 1 when `storage_type = "computed"`

---

## Expression Studio Page

**Route:** `/admin/expressions`  
**File:** `src/react/src/pages/studio/ExpressionStudioPage.tsx`

```
┌───────────────────────┬───────────────────────┐
│  Expression Editor    │  Sample Data           │
│  Monaco editor        │  JSON textarea          │
│  [Run Test]           │                         │
├───────────────────────┴───────────────────────┤
│  Result Panel (green=success, red=error)       │
├────────────────────────────────────────────────┤
│  AI Panel (collapsible)                        │
│  "Describe what to compute" → [Generate]       │
└────────────────────────────────────────────────┘
```

AI Generate calls `POST /api/nlp/chat` to generate JSONata from natural language description.

---

## Security

- Context cancellation: `ctx.Done()` → `vm.Interrupt()`
- Request timeout: default 30s
- Expressions authored by platform admins only (not end users)
- JSONata has no I/O operations — expressions can only transform input data
- No SSRF or file inclusion risk from expression evaluation path
