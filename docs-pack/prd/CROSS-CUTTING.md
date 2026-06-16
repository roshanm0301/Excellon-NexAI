# PRD: CROSS-CUTTING.md â€” PII, Audit Trail, Data Lifecycle, Index Management, NLP

> **Source document:** 11-cross-cutting-concerns.md
> **These concerns apply to every part of the platform.**

---

## 1. PII & Compliance

Compliance targets: GDPR (EU) Â· DPDP 2023 (India)

### 1.1 PII Classification (5-tier)

| Category | Examples | Storage | Masking |
|----------|---------|---------|---------|
| `none` | Product code, status | Plain text | None |
| `indirect` | IP address, zip code | Encrypted column | Partial |
| `direct` | Name, email, phone | Encrypted column | Email/phone/name rule |
| `special_category` | Health, religion, caste | **Vault** | Full |
| `biometric` | Aadhaar, fingerprint | **Vault** | Full |

**Vault:** `special_category` and `biometric` store encrypted values in `pii_vault`, not in `entity_record.payload`. The entity record stores only `TOK:<uuid>`. Vault entries can be nullified in O(1) â€” this is how Right to Erasure works without deleting the business record.

### 1.2 Encryption Architecture

```
ENCRYPTION_MASTER_KEY (env var, 32-byte hex)  â† KEK, never stored
        â†“ wraps
  DEK (Data Encryption Key) â€” per tenant, stored encrypted in kms_keys
        â†“ encrypts
  Field value
```

Column-encrypted format (in JSONB): `"<keyID>:<base64-nonce>:<base64-ciphertext>"`  
Algorithm: AES-256-GCM (confidentiality + integrity)

### 1.3 Masking Rules

| Rule | Output |
|------|--------|
| `none` | Plain text |
| `email` | `j***@example.com` |
| `phone` | `+91 98** **** **78` |
| `name` | `R**** S*****` |
| `partial_4` | `****5678` |
| `partial_2` | `Aa*********` |
| `full` | `***` |

Masking applied at read time. If `actorRole âˆˆ visible_roles` â†’ plain text. Otherwise masking rule applied.

### 1.4 Database Tables

| Table | Purpose |
|-------|---------|
| `pii_vault` | Encrypted vault values for special_category + biometric fields |
| `kms_keys` | Encrypted DEKs per tenant |
| `pii_access_log` | Every PII field read/write (GDPR/DPDP requirement) |

### 1.5 Go Package

`src/go/internal/pii/` â€” `service.go`, `crypto.go`, `kms.go`, `vault.go`, `masking.go`

```go
// Called by entityruntime on every write
piiSvc.ProcessWrite(payload, schemaFields, actorRole) â†’ encrypted payload

// Called by entityruntime on every read
piiSvc.ProcessRead(payload, schemaFields, actorRole) â†’ decrypted + masked payload
```

**CRITICAL:** Never read or write PII fields outside of `pii.Service`. Never bypass ProcessRead/ProcessWrite.

---

## 2. Audit Trail

### What It Records


```go
// Fired as a goroutine after each entity operation
go func() {
    auditSvc.Record(context.Background(), AuditEvent{
        EventType:   "entity.updated",
        EntityType:  entityType,
        EntityID:    entityID,
        TenantID:    tenantID,
        ActorUserID: userID,
        Before:      previousPayload,
        After:       newPayload,
        Diff:        diff.Compute(previousPayload, newPayload),
    })
}()
```

### Database

```sql
-- Monthly partitioned table
CREATE TABLE audit_event (
    id           UUID NOT NULL,
    tenant_id    VARCHAR(100) NOT NULL,
    entity_type  VARCHAR(200) NOT NULL,
    entity_id    UUID NOT NULL,
    actor_id     VARCHAR(200) NOT NULL,
    before_data  JSONB,
    after_data   JSONB,
    diff         JSONB,                    -- field-level diff
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

Monthly partitions created by `PartitionWorker` background goroutine.

### Go Package

`src/go/internal/audit/` â€” `service.go`, `diff.go`, `partition.go`

---

## 3. Data Lifecycle Management

### Soft Delete â†’ Pipeline

All deletes are soft (set `deleted_at`). Records then move through a lifecycle pipeline based on the entity's configured `pipeline_mode`:

| Mode | Stages |
|------|--------|
| `SIMPLE` | Recycle Bin â†’ Pending Purge â†’ Hard Delete |
| `ARCHIVE` | Recycle Bin â†’ Archived â†’ Pending Purge â†’ Hard Delete |
| `GDPR` | Recycle Bin â†’ Archived â†’ Anonymised â†’ Pending Purge â†’ Hard Delete |

GDPR timing multipliers: 1Ã— â†’ 2Ã— â†’ 3Ã— of configured `retention_days`.

### Retention Policy Hierarchy (4 levels)

1. Field-level `retention_days` (most specific)
2. Entity-level `retention.retention_days`
3. Tenant-level default
4. Platform default

### Go Packages

- `src/go/internal/recycle/service.go` â€” soft delete + recycle bin
- `src/go/internal/retention/service.go` â€” policy resolution
- `src/go/internal/purge/agent.go` â€” background lifecycle pipeline

### REST API (Recycle Bin)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/recycle-bin` | List soft-deleted records |
| `POST` | `/api/v1/admin/recycle-bin/{id}/restore` | Restore a deleted record |
| `POST` | `/api/v1/admin/recycle-bin/{id}/purge` | Immediately purge (admin only) |

---

## 4. Index Management

### Why It's Needed

All entity records share one table with a JSONB payload. To query on payload fields efficiently, PostgreSQL expression indexes are required. These are added asynchronously â€” never inline in migrations â€” to avoid table locks.

### Auto-Index Rules

The index manager auto-generates indexes for:
- Every `required` field in an entity schema
- Every field that appears in a composite key
- Every field that is a `reference` type (foreign key lookup)
- Every field with `grid_hints.summary_type` set (aggregation fields)

### DDL Queue Pattern

```sql
-- All generated DDL follows this pattern:
CREATE INDEX CONCURRENTLY idx_er_{tenant}_{entityType}_{field}
    ON entity_record ((payload->>'{fieldName}'))
    WHERE entity_type = '{entityType}' AND tenant_id = '{tenantId}' AND deleted_at IS NULL;
```

### Go Package

`src/go/internal/indexmgmt/service.go`

```go
// Called after every entity schema publish
func QueueIndexes(ctx context.Context, entityType string, compiledPayload map[string]any) error

// Background worker applies pending indexes
func ApplyPendingIndexes(ctx context.Context) error
```

### REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/indexes` | List queue items (filter by entity_key) |
| `POST` | `/api/v1/admin/indexes/{id}/apply` | Apply a specific index |
| `POST` | `/api/v1/admin/indexes/{id}/discard` | Discard (skip) a queued index |
| `GET` | `/api/v1/admin/indexes/stats` | Index statistics |

---

## 5. NLP / AI Layer

### What It Does

The NLP layer provides AI-assisted authoring capabilities within the Entity Designer and Expression Studio.

**Capabilities:**
- **Field generation:** Admin describes an entity in plain text â†’ AI generates a field list with types, labels, validation
- **Expression generation:** Admin describes a computation â†’ AI generates JSONata expression
- **Index suggestion:** AI reviews current schema â†’ suggests useful indexes
- **Chat assistant:** General schema questions, improvement suggestions

### Go Package

`src/go/internal/nlp/handler.go`

### REST API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/nlp/chat` | Chat with context (current schema, messages) |
| `POST` | `/api/nlp/import` | Plain-text description â†’ field list |

```json
// POST /api/nlp/chat
{
  "messages": [{ "role": "user", "content": "Suggest a computed field for order total" }],
  "context": {
    "entity_type": "sales_order",
    "fields": ["unit_price", "qty", "discount"]
  }
}
// Response
{
  "response": "...",
  "suggestions": {
    "expression": "unit_price * qty * (1 - discount)",
    "field_name": "total",
    "label": "Order Total"
  }
}
```

### Frontend Integration

- **NLP Assistant Panel:** Opens from âœ¨ icon in EntityEditorPage header
- **AI Import:** Paste description â†’ `POST /api/nlp/import` â†’ populates FieldBuilder
- **Expression Studio AI panel:** "Describe what to compute" â†’ generates JSONata
- **Index suggestions:** CompositeIndexPanel "AI Suggest" button
- Results apply directly to active tab state â€” no manual copy step

---

## 6. Node Tree

### What It Is

The Node Tree is the organisational hierarchy â€” regions, branches, warehouses, teams. It scopes artifacts, overlay deltas, entity records, and permissions.

### Node Types

| `node_type` | Description |
|-------------|-------------|
| `platform` | Root (one per installation) |
| `vertical` | Industry vertical (Automotive, BFSI) |
| `tenant` | A business customer |
| `branch` | Geographic branch |
| `warehouse` | Storage/fulfilment location |
| `role` | Role scoping node |

### Integration

- **Artifact scoping:** `artifact_header.node_id` scopes an artifact to a specific node
- **Overlay layer:** Provides `node_id` / `scope_ref` for the `node` overlay layer
- **Entity records:** `entity_record.node_id` scopes records to an org unit

### Database

```sql
CREATE TABLE studio_node (
    node_id   UUID PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    name      VARCHAR(200) NOT NULL,
    node_type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES studio_node(node_id),
    metadata  JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(200)
);
CREATE INDEX idx_studio_node_tenant_parent ON studio_node (tenant_id, parent_id);

-- Recursive CTE for full tree assembly
WITH RECURSIVE node_tree AS (
  SELECT * FROM studio_node WHERE parent_id IS NULL AND tenant_id = $1
  UNION ALL
  SELECT n.* FROM studio_node n
  INNER JOIN node_tree nt ON n.parent_id = nt.node_id
)
SELECT * FROM node_tree;
```

### REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/nodes/tree` | Full recursive tree |
| `GET` | `/api/v1/admin/nodes` | Flat list (paginated) |
| `POST` | `/api/v1/admin/nodes` | Create node |
| `PUT` | `/api/v1/admin/nodes/{id}` | Update node |
| `DELETE` | `/api/v1/admin/nodes/{id}` | Delete (fails if has children or scoped artifacts) |

### Frontend Components

- `NodeTreePage` (`/admin/nodes`) â€” admin management page
- `NodeTreeView` â€” recursive tree rendering with expand/collapse
- `NodeScopePicker` â€” used in EntityEditorPage Tab 6; search + breadcrumb + auto-expand
- `NodeEditor` â€” modal for create/edit a single node
