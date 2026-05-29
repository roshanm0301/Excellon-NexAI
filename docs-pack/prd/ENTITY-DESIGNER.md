# PRD: ENTITY-DESIGNER.md — Entity Designer & Backend Compiler

> **Source documents:** 03-entity-designer-frontend.md, 04-entity-backend-compiler-runtime.md, 02-artifact-versioning.md, 12-appendices.md
> **Read also:** BACKEND-STANDARDS.md, DATA-ARCHITECTURE.md, FRONTEND-STANDARDS.md

---

## What It Is

The Entity Designer is the central authoring tool of the platform. It is a React application that allows platform administrators to define entity schemas — data models with fields, statuses, relationships, indexes, and lifecycle settings. Every other subsystem (Rules, Workflow, Overlay, NLP) ultimately operates on an entity schema.

Entity schemas are stored as versioned artifacts (`artifact_type = 'entity_schema'`), compiled server-side into a `compiled_artifact`, and served to the entity runtime.

---

## Frontend — Pages

### EntityDesignerPage (List)

- **Route:** `/admin/entities`
- **File:** `src/react/src/pages/admin/EntityDesignerPage.tsx`
- **Data:** `GET /api/v1/artifacts?artifact_type=entity_schema` via `listEntityArtifacts()`
- **Grid columns:** Entity Type (strips `entity.` prefix), Category, Status (Active/Draft badge), Layer, Node, Last Updated
- **Row actions:** Edit → `/admin/entities/{id}/edit`, Delete (confirm dialog), Duplicate (copies payload, opens new editor)
- **Header actions:** New Entity, Bulk Delete, View Map (`/admin/entities/map`)
- **State:** TanStack Query — invalidate on delete or publish

### EntityEditorPage (Editor)

- **Routes:** `/admin/entities/new` | `/admin/entities/:id/edit`
- **File:** `src/react/src/pages/studio/EntityEditorPage.tsx`
- **State:** All local `useState` hooks — no global store
- **Load (edit mode):** `GET /api/v1/artifacts/{id}/latest` → parse payload into tab state variables
- **Save Draft:** `POST /api/v1/artifacts` (new) or `POST /api/v1/artifacts/{id}/versions` with `is_draft: true`
- **Save & Publish:** Same POST + `POST /api/v1/artifacts/{id}/versions/{versionNo}/publish`
- **Entity type name:** Stored as `entity.{entityType}` in `artifact_name`. UI always strips `entity.` prefix. snake_case only.
- **Dirty state:** `isDirty` flag + `beforeunload` warning

#### State Variables (EntityEditorPage)

```typescript
const [fields, setFields]             = useState<FieldDef[]>([])
const [sections, setSections]         = useState<Section[]>([])
const [relationships, setRelationships] = useState<Relationship[]>([])
const [statuses, setStatuses]         = useState<StatusDef[]>([])
const [transitions, setTransitions]   = useState<Transition[]>([])
const [indexes, setIndexes]           = useState<IndexDef[]>([])
const [capabilityFlags, setCapabilityFlags] = useState<CapabilityFlags>({})
const [idConfig, setIdConfig]         = useState<IDConfig>({ strategy: 'uuid_v4' })
const [retention, setRetention]       = useState<RetentionConfig>({})
const [isDirty, setIsDirty]           = useState(false)
```

### EntityMapPage (ER Diagram)

- **Route:** `/admin/entities/map`
- **File:** `src/react/src/pages/studio/EntityMapPage.tsx`
- **Library:** `@xyflow/react` v12
- **Fetches:** All entity schema artifacts → creates nodes + edges from `reference` fields and `has_many`/`belongs_to` relationships
- **Node component:** Entity card with field list, type chips, PII/computed/required highlights
- **Edge:** Arrowhead direction = cardinality; label = field name or relationship type
- **Interactions:** Click node → detail panel; Double-click → editor; New Entity modal; PNG export

---

## Frontend — 8 Tabs

### Tab 1 — Schema (FieldBuilder)

- **File:** `src/react/src/components/studio/EntityDesigner/FieldBuilder.tsx`
- System fields section (locked): `id` (gear → IDConfigPanel), `created_at`, `updated_at`, `created_by`, `updated_by`
- User fields: accordion rows, each with sections:
  - **Core:** name (snake_case), label, type (FieldTypeSelector), required toggle
  - **Storage:** `physical` | `computed` — when computed, ExpressionEditor replaces value input
  - **Display:** Null Text, Display Mask, Character Casing, Read Only
  - **Lookup** (type=`enum`): Lookup Type (none/picklist/datasource), Picklist Key, Datasource Key, Value/Display fields
  - **Reference** (type=`reference`): Reference Entity, Display Field, Value Field
  - **Compliance & Privacy:** PII Category (5 tiers), Masking Rule, Visible Roles, Legal Basis, Retention Days
  - **Index Hints:** Grid Summary Type

#### IDConfigPanel

- Opens from gear icon on `id` system field
- ID Strategy: `uuid_v4` (default) | `uuid_v7` (time-ordered, better B-tree)
- Display ID: enabled toggle, prefix, separator, seed, padding
- Example: prefix=`ORD`, separator=`-`, padding=6 → `ORD-000001`

#### FieldTypeSelector

Available field types:
`string`, `text`, `number`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `enum`, `reference`, `email`, `phone`, `uuid`, `computed`, `file` (planned)

Custom types from `field_type_catalog` artifact also appear here.

### Tab 2 — Layout (SectionBuilder)

- **File:** `src/react/src/components/studio/EntityDesigner/SectionBuilder.tsx`
- Drag-and-drop section ordering
- Each section: title + field assignment (drag fields into sections)
- Sections payload section: `[{ id, title, fields: [fieldName, ...] }]`

### Tab 3 — Relationships (RelationshipBuilder)

- **File:** `src/react/src/components/studio/EntityDesigner/RelationshipBuilder.tsx`
- Types: `has_many`, `belongs_to`
- Per relationship: type, target entity, foreign key field, label
- Rendered as edges on EntityMapPage

### Tab 4 — Virtual Entity (CapabilityFlagsPanel)

- **File:** `src/react/src/components/studio/EntityDesigner/CapabilityFlagsPanel.tsx`
- Store type: `master` | `transaction` | `log`
- VirtualEntityConfigurator: config for virtual (non-persisted) entity display

### Tab 5 — Settings

- Inline form (no separate component)
- Category: `MASTER` | `BUSINESS` | `CONFIG`
- Description
- Nav enabled toggle (shows entity in sidebar navigation)

### Tab 6 — Node Scope (NodeScopePicker)

- **File:** `src/react/src/components/studio/NodeTree/NodeScopePicker.tsx`
- Tree-based picker for scoping the artifact to a specific org node
- Features: search (debounced 300ms), breadcrumb path, auto-expand to pre-selected node, clear
- Writes to payload: `_node_id`, `_node_name`, `_node_type`

### Tab 7 — Indexes

**CompositeIndexPanel** (`CompositeIndexPanel.tsx`):
- Add composite indexes: name, columns (field + sort direction), unique flag
- DDL preview: shows the generated `CREATE INDEX` statement
- AI Suggest button: calls `POST /api/nlp/chat` with current schema to suggest useful indexes

**IndexMigrationPanel** (`IndexMigrationPanel.tsx`):
- Shows index queue for this entity: pending / applied / failed entries
- Apply / Discard actions per queue item
- Polls every 5 seconds while tab is active (detects `CREATE INDEX CONCURRENTLY` completion)

### Tab 8 — Data Retention (RetentionPanel)

- **File:** `src/react/src/components/studio/EntityDesigner/RetentionPanel.tsx`
- Pipeline Mode: `SIMPLE` | `ARCHIVE` | `GDPR`
- Retention Days: integer
- Visual pipeline diagram showing stages for selected mode:
  - SIMPLE: Recycle Bin → Pending Purge → Hard Delete
  - ARCHIVE: Recycle Bin → Archived → Pending Purge → Hard Delete
  - GDPR: Recycle Bin → Archived → Anonymised → Pending Purge → Hard Delete (timing multipliers: 1×, 2×, 3×)

---

## Frontend — NLP Assistant Panel

- Opens from sparkles (✨) icon in editor header
- Sends current schema context + user message to `POST /api/nlp/chat`
- Can generate: field definitions, computed expressions, suggested indexes
- Results applied directly to active tab state (no manual copy)
- **AI Import:** Paste plain-text description → `POST /api/nlp/import` → generates initial field list

---

## Frontend — Component Inventory

| Component | File | Responsibility |
|-----------|------|---------------|
| `FieldBuilder` | `EntityDesigner/FieldBuilder.tsx` | Main field list accordion |
| `IDConfigPanel` | `EntityDesigner/IDConfigPanel.tsx` | UUID strategy + display ID config |
| `FieldTypeSelector` | `EntityDesigner/FieldTypeSelector.tsx` | Type dropdown + custom types |
| `FieldValidationEditor` | `EntityDesigner/FieldValidationEditor.tsx` | Per-type validation (regex, min/max) |
| `SectionBuilder` | `EntityDesigner/SectionBuilder.tsx` | Form section grouping (drag-drop) |
| `RelationshipBuilder` | `EntityDesigner/RelationshipBuilder.tsx` | has_many / belongs_to definitions |
| `StatusFlowEditor` | `EntityDesigner/StatusFlowEditor.tsx` | Status state machine editor |
| `CapabilityFlagsPanel` | `EntityDesigner/CapabilityFlagsPanel.tsx` | Store type + virtual entity config |
| `CompositeIndexPanel` | `EntityDesigner/CompositeIndexPanel.tsx` | Composite index builder + DDL preview |
| `IndexMigrationPanel` | `EntityDesigner/IndexMigrationPanel.tsx` | Index queue status + apply/discard |
| `RetentionPanel` | `EntityDesigner/RetentionPanel.tsx` | Data lifecycle pipeline config |
| `EntityActionsPanel` | `EntityDesigner/EntityActionsPanel.tsx` | Custom entity toolbar/context actions |
| `EntityPreview` | `EntityDesigner/EntityPreview.tsx` | Live form preview from current schema |
| `ExpressionEditor` | `expression/ExpressionEditor.tsx` | Monaco JSONata editor with field chips |
| `NodeScopePicker` | `NodeTree/NodeScopePicker.tsx` | Tree-based node scope selector |

---

## Backend — Artifact Versioning API

All artifact endpoints are in `src/go/internal/admin/handler.go`.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/artifacts` | List artifacts — filter by `artifact_type`, `tenant_id` |
| `POST` | `/api/v1/artifacts` | Create new artifact + first version |
| `DELETE` | `/api/v1/artifacts/{id}` | Delete artifact and all versions |
| `GET` | `/api/v1/artifacts/{id}/latest` | Get header + latest version payload |
| `GET` | `/api/v1/artifacts/{id}/active` | Get header + published version payload |
| `POST` | `/api/v1/artifacts/{id}/versions` | Save new draft version |
| `GET` | `/api/v1/artifacts/{id}/versions` | List all versions |
| `POST` | `/api/v1/artifacts/{id}/versions/{no}/publish` | Publish + trigger compile |
| `GET` | `/api/view-artifacts/entity-schema/{entityType}` | Runtime: compiled schema for entity type |

---

## Backend — 6-Step Compiler Pipeline

**File:** `src/go/internal/compiler/entity_schema.go`
**Input:** `overlay.MergedArtifact` (after 5-layer overlay merge)
**Output:** `compiled_artifact.payload` — what all runtime code reads

### Step 1 — Load Field Type Defaults
- Queries active `field_type_catalog` artifact
- Builds map: `customTypeName → { display_mask, null_text, validation, grid_hints }`
- Non-fatal if catalog missing — map is empty, step skipped

### Step 2 — Process User Fields
- Skip any field with `_removed: true` (overlay REMOVE operation)
- 2a: Normalise type key — `"field_type"` → `"type"`
- 2b: Reference field defaults — missing `display_field` → `"name"`, missing `value_field` → `"id"`
- 2c: Picklist resolution — if `lookup_type = "picklist"`: load picklist artifact → inline items OR write datasource binding fields
- 2d: Field type defaults — merge custom type defaults for missing properties (never overwrite explicit values)
- 2e: Normalize legacy `compute_mode` — delete `compute_mode: "template"` or `"javascript"`. Only JSONata `compute_expression` is valid.

### Step 3 — Inject System Fields
Always appended after user fields:
- `id` (uuid) — carries `id_strategy` from `id_config`
- `created_at` (datetime) — auto-set on insert
- `updated_at` (datetime) — auto-set on update
- `created_by` (string) — from request context
- `updated_by` (string) — from request context
- `display_id` (string) — only when `display_id.enabled = true`

User fields with same name as system fields are **overwritten** by system fields.

### Step 4 — ID Config, Display ID, Composite Keys
- ID strategy: reads `id_config.strategy` → validates `uuid_v4` | `uuid_v7` → stamps at schema top level and on `id` field
- Display ID: when `enabled = true` → injects field + carries `display_id_config` into compiled output
- Composite keys: validates `name` (snake_case ≤50 chars), fields exist → carries into compiled schema → calls `indexmgmt.QueueIndexes()`

### Step 5 — Pass-through Fields
Carried unchanged into compiled schema:
`status_transitions`, `workflow_key`, `relationships`, `capability_flags`, `entity_actions`, `sections`, `statuses`, `transitions`, `id_config`, `display_id`

### Step 6 — Metadata Stamp
Sets `_compiled_at` to current UTC timestamp.

---

## Backend — Entity Runtime CRUD

**File:** `src/go/internal/entityruntime/handler.go`

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/v1/entities/{entityType}` | Generate ID + display ID; check composite keys; rules eval before write |
| `GET` | `/api/v1/entities/{entityType}` | Paginated; computed fields evaluated; PII masked |
| `GET` | `/api/v1/entities/{entityType}/{id}` | Computed fields evaluated; PII masked |
| `PATCH` | `/api/v1/entities/{entityType}/{id}` | JSONB merge; composite key check |
| `DELETE` | `/api/v1/entities/{entityType}/{id}` | Soft delete: sets `deleted_at = NOW()` |
| `POST` | `/api/v1/entities/{entityType}/{id}/{cmd}` | Workflow status transition |
| `GET` | `/api/v1/entities/{entityType}/options` | Dropdown values for reference fields |

### Create Flow (in order)
1. Load compiled schema from `compiled_artifact`
2. Composite key check (pre-insert): reject HTTP 409 on violation
3. Rules evaluation: `rulesEval.EvaluateRules()` → if blocked → HTTP 422 with violations
4. ID generation: `idgen.Generate(idStrategy)` — uuid_v7 or uuid_v4
5. Display ID: atomic upsert into `entity_sequence` → format as `{prefix}{sep}{zero-padded}`
6. Insert into `entity_record`
7. Fire-and-forget: audit event, workflow initial state, outbox

### Read Flow (GetByID)
1. SELECT from `entity_record` WHERE `deleted_at IS NULL`
2. Evaluate computed fields (JSONata via expression engine)
3. PII masking: decrypt + apply masking rules based on actor role vs `visible_roles`
4. Return enriched, masked record

### Update Flow
1. Composite key check on post-merge payload (excluding self by ID)
2. JSONB merge: `payload = payload || $new_values::jsonb`
3. Increment `version_no`
4. Fire-and-forget: audit event

---

## Artifact Payload Schema (entity_schema)

```json
{
  "entity_type": "sales_order",
  "category": "BUSINESS",
  "id_config": { "strategy": "uuid_v7" },
  "display_id": { "enabled": true, "prefix": "ORD", "separator": "-", "seed": 1, "padding": 6 },
  "fields": {
    "customer_name": {
      "name": "customer_name", "label": "Customer Name", "type": "string",
      "required": true, "storage_type": "physical",
      "pii_category": "direct", "masking_rule": "name", "visible_roles": ["OEM_ADMIN"]
    },
    "total": {
      "name": "total", "label": "Total", "type": "number",
      "storage_type": "computed", "compute_expression": "unit_price * qty"
    }
  },
  "composite_keys": [{ "name": "uk_order_code", "label": "Order code unique", "fields": ["order_code"] }],
  "sections": [{ "id": "s1", "title": "Order Details", "fields": ["customer_name", "order_date"] }],
  "statuses": [
    { "key": "DRAFT", "label": "Draft", "initial": true, "terminal": false },
    { "key": "APPROVED", "label": "Approved", "initial": false, "terminal": false }
  ],
  "transitions": [{ "from": "DRAFT", "to": "APPROVED", "command": "approve" }],
  "relationships": [{ "type": "has_many", "entity": "order_line_item", "foreign_key": "order_id", "label": "Line Items" }],
  "capability_flags": { "db_store_type": "transaction" },
  "indexes": [{ "name": "idx_order_status", "type": "btree", "columns": [{ "field": "status", "sort": "asc" }] }],
  "retention": { "pipeline_mode": "GDPR", "retention_days": 730 }
}
```

---

## Field Type Reference

| Type | Validation keys | Widget |
|------|----------------|--------|
| `string` | `pattern`, `minLength`, `maxLength` | Text input |
| `text` | `maxLength` | Textarea |
| `number` | `min`, `max`, `precision`, `scale` | Number input |
| `integer` | `min`, `max` | Number input (integer) |
| `decimal` | `min`, `max`, `precision` | Number input |
| `boolean` | — | Toggle |
| `date` | `minDate`, `maxDate` | Date picker |
| `datetime` | `minDate`, `maxDate` | Date-time picker |
| `enum` | `options`, `picklist_key`, `datasource_key` | Dropdown |
| `reference` | `reference_entity`, `display_field`, `value_field` | Search picker |
| `email` | Built-in email regex | Email input |
| `phone` | `pattern` | Phone input |
| `uuid` | — | Read-only |
| `computed` | `compute_expression` (JSONata) | Read-only display |

---

## Error Codes

| Code | HTTP | When |
|------|------|------|
| `entity.not_found` | 404 | Record not found or deleted |
| `entity.composite_key_violation` | 409 | Duplicate unique key |
| `entity.schema_not_found` | 500 | Compiled schema missing |
| `entity.rule_violation` | 422 | Rules Engine BLOCK action |
| `entity.workflow_guard_failed` | 403 | Role guard blocked transition |
| `entity.invalid_transition` | 400 | No valid transition for command |
| `expression.invalid` | 422 | Compute expression evaluation failed |
