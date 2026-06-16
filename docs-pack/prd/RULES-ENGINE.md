# PRD: RULES-ENGINE.md â€” Rules Engine

> **Source document:** 05-rules-engine.md
> **Read also:** BACKEND-STANDARDS.md, ENTITY-DESIGNER.md

---

## What It Is


Rules are stored as versioned `rule_set` artifacts and managed through the Rule Builder UI.

---

## Dual Runtime Architecture

| Runtime | File | When used |
|---------|------|-----------|
| Node.js `evaluator.ts` | `src/node/src/rules/evaluator.ts` | API gateway level validation (Node.js layer only) |

Both implement the same condition DSL and produce identical results. The Go evaluator is authoritative â€” the Node.js evaluator is a mirror.

Client-side rule evaluation uses a compiled bundle served to the React app. Client-side results are optimistic only â€” the server always re-evaluates.

---

## Condition DSL â€” BehaviorNode

```typescript
// Recursive condition tree
type BehaviorNode =
  | { type: 'AND'; children: BehaviorNode[] }
  | { type: 'OR';  children: BehaviorNode[] }
  | { type: 'NOT'; children: [BehaviorNode] }
  | { type: 'compare'; field: string; operator: Operator; value: any }
```

### Operators

| Operator | Meaning | Value type |
|----------|---------|-----------|
| `eq` | Equal | any scalar |
| `ne` | Not equal | any scalar |
| `gt` | Greater than | number or date string |
| `gte` | Greater than or equal | number or date string |
| `lt` | Less than | number or date string |
| `lte` | Less than or equal | number or date string |
| `in` | Value is in array | array |
| `not_in` | Value is not in array | array |
| `between` | Between two values (inclusive) | `[min, max]` |
| `matches` | Regex match | string (regex pattern) |
| `exists` | Field is not undefined | â€” |
| `is_null` | Field is null or undefined | â€” |

### FactBag

```go
type FactBag struct {
    Entity  map[string]interface{}
    Session SessionFacts
}
type SessionFacts struct {
    UserID   string
    Role     string
    TenantID string
    NodeRef  string
}
```

Field references in conditions:
- `entity.{fieldName}` â€” entity payload fields
- `session.role`, `session.tenant_id`, `session.node_ref`

---

## Action Types

| Type | `type` value | Effect |
|------|-------------|--------|
| Block | `BLOCK` | Adds violation; sets `result.Blocked = true`. ALL blocks collected (no early return). HTTP 422. |
| Warn | `WARN` | Adds warning. Operation proceeds; warnings in response. |
| Set Field | `SET_FIELD` | Mutates `fb.Entity[field] = value` immediately. Later rules see the mutation. |
| Require Field | `REQUIRE_FIELD` | Runtime enforces field is non-empty in payload. |
| Notify | `NOTIFY` | Notification service sends in-app or email. |
| Escalate | `ESCALATE` | Routes to escalation handler with escalation flag. |

```json
// Action object shape
{
  "type": "BLOCK",
  "field": "amount",
  "message": "Amount exceeds approval limit.",
  "value": null,
  "role": null
}
// SET_FIELD: field = target, value = value to set
// NOTIFY/ESCALATE: role = recipient role
```

---

## Go â€” ProductionEvaluator

```go
// src/go/internal/rules/production_evaluator.go
type ProductionEvaluator struct {
    pool *pgxpool.Pool
}

func (e *ProductionEvaluator) EvaluateRules(
    ctx context.Context,
    ruleSetKey string,
    fb FactBag,
    trigger TriggerContext,
) (BehaviorEvalResult, error)
```

### Execution Steps

1. `loadRuleSet(ctx, ruleSetKey, tenantID, nodeID)`
   - Try node-scoped rule set first (`node_id = $nodeID`)
   - Fall back to tenant-level (`node_id IS NULL`)
   - `pgx.ErrNoRows` â†’ empty result (not an error)
2. `filterByTrigger(rules, trigger)`
   - `client_side=true`: skip `"server"` and `"server_only"` rules
   - `client_side=false`: skip `"client"` rules
   - `"both"` and empty (defaults to `"server"`) pass through
3. `sort.Slice` by priority (ascending â€” lower number fires first)
4. For each applicable rule: unmarshal `condition_json` â†’ evaluate â†’ if matched, fire all actions
5. `SET_FIELD` mutates fb immediately â€” subsequent rules see updated value
6. Collect ALL BLOCKs before returning (no early exit)

```go
type BehaviorEvalResult struct {
    Blocked        bool
    Violations     []ActionResult  // BLOCK actions
    Warnings       []ActionResult  // WARN actions
    Mutations      []ActionResult  // SET_FIELD actions
    RequiredFields []ActionResult  // REQUIRE_FIELD actions
    Notifications  []ActionResult  // NOTIFY + ESCALATE
}
```

---

## Integration with Entity Runtime

Rules are evaluated before the database write:

```
Handler.create() / Handler.update()
  â†’ build FactBag from (entityPayload, actorSession)
  â†’ rulesEval.EvaluateRules(ctx, "entity."+entityType, fb, TriggerContext{})
  â†’ if result.Blocked â†’ return HTTP 422 with violations list
  â†’ apply result.Mutations (SET_FIELD) to payload
  â†’ check result.RequiredFields against payload
  â†’ proceed to repo.Create() / repo.Update()
```

Rule set key convention: `"entity." + entityType` (matches artifact name).

---



---

## Database

### `rule_definition` (legacy studio CRUD)

| Column | Type | Notes |
|--------|------|-------|
| `rule_id` | UUID PK | |
| `tenant_id` | varchar(100) | |
| `rule_key` | varchar(200) | e.g. `order.amount_limit` |
| `entity_type` | varchar(200) | Entity this rule applies to |
| `trigger` | varchar(50) | `on_create` / `on_update` / `on_delete` / `on_transition` |
| `fire_on` | varchar(20) | `server` / `client` / `both` / `server_only` |
| `priority` | int | Lower = fires first |
| `condition_json` | jsonb | Recursive BehaviorNode tree |
| `actions` | jsonb | Array of action objects |
| `is_active` | boolean | Inactive rules skipped |
| `created_at`, `updated_at` | timestamptz | |

**Note:** `ProductionEvaluator` reads from `artifact_header + artifact_version` (`artifact_type = 'rule_set'`). `rule_definition` is for the legacy studio CRUD. Studio allows publishing `rule_definition` entries as `rule_set` artifacts.

---

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/rules` | List â€” filter by `entity_type`, `is_active` |
| `POST` | `/api/v1/admin/rules` | Create |
| `GET` | `/api/v1/admin/rules/{id}` | Get |
| `PUT` | `/api/v1/admin/rules/{id}` | Update |
| `DELETE` | `/api/v1/admin/rules/{id}` | Delete |
| `PATCH` | `/api/v1/admin/rules/{id}/toggle` | Toggle `is_active` |
| `POST` | `/api/v1/admin/rules/{id}/test` | Test against sample data |

**Test endpoint:**
```json
// Request
{ "entity_data": { "amount": 15000, "status": "DRAFT" }, "session": { "role": "AGENT", "tenant_id": "t1" } }
// Response
{ "matched": true, "result": { "blocked": true, "violations": [{ "rule_key": "order.amount_limit", "type": "BLOCK", "field": "amount", "message": "..." }] } }
```

---

## Rule Builder UI

### RuleBuilderPage (List)

- **Route:** `/admin/rules`
- Lists all rule definitions in VirtualGrid
- Columns: Rule Key, Entity Type, Trigger, Priority, Active/Inactive badge
- Row actions: Edit, Delete, Toggle Active/Inactive

### RuleEditor (Editor)

- **Routes:** `/admin/rules/new` | `/admin/rules/:id/edit`
- Three-panel layout:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Rule List   â”‚  Condition Tree          â”‚  Actions Panel    â”‚
â”‚  (sidebar)   â”‚  (recursive builder)     â”‚  (action list)    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Header fields:** Rule Key, Entity Type, Trigger, Priority, Fire On (server/client/both/server_only)

### ConditionTreeBuilder

- **File:** `src/react/src/pages/admin/behavior/rules/ConditionTreeBuilder.tsx`
- Recursive React component â€” renders AND/OR/NOT containers + compare leaves
- Field picker, operator dropdown, value input per leaf
- Depth-based visual styling; maximum depth: 5 levels
- Add Child / Delete per node
