# DATA-ARCHITECTURE.md â€” PostgreSQL Schema, Tables & Migration Rules

> **Read before writing any SQL, migration file, or database-touching Go code.**

---

## Core Philosophy

The platform uses a **single-table JSONB strategy** for all entity records. There is no per-entity DDL. Business entity data of every type lives in `entity_record` with a `payload JSONB` column. PostgreSQL expression indexes provide query performance on payload fields.


---

## Complete Table Inventory

### Artifact & Schema Storage

| Table | Purpose |
|-------|---------|
| `artifact_version` | One row per save; `is_active=true` = published/live version |
| `compiled_artifact` | Go compiler output â€” what runtime code reads. Never bypassed. |
| `artifact_overlay_delta` | Per-layer delta JSON for the 5-layer overlay system |

### Entity Records

| Table | Purpose |
|-------|---------|
| `entity_record` | ALL entity records of ALL types. Single table. `entity_type` column discriminates. |
| `entity_sequence` | Atomic sequential counters for display IDs (ORD-000001, etc.) |
| `entity_index_queue` | DDL queue for `CREATE INDEX CONCURRENTLY` jobs |


| Table | Purpose |
|-------|---------|

### PII & Compliance

| Table | Purpose |
|-------|---------|
| `pii_vault` | Encrypted vault for `special_category` and `biometric` PII fields |
| `kms_keys` | Encrypted Data Encryption Keys (DEKs) per tenant |
| `pii_access_log` | Every read/write of PII fields (GDPR/DPDP audit requirement) |

### Org Structure

| Table | Purpose |
|-------|---------|
| `studio_node` | Organisational hierarchy (adjacency list: platform â†’ vertical â†’ tenant â†’ branch) |

### Audit & Lifecycle

| Table | Purpose |
|-------|---------|
| `audit_event` | Immutable field-level change history. Partitioned by month. |
| `entity_lifecycle` | Tracks lifecycle stage of soft-deleted records (recycle bin, archived, etc.) |

---

## Key Table Schemas

### artifact_header

```sql
CREATE TABLE artifact_header (
    artifact_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_name VARCHAR(300) NOT NULL,     -- e.g. "entity.sales_order"
    tenant_id     VARCHAR(100) NOT NULL,
    node_id       VARCHAR(200),              -- NULL = tenant-level scope
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200) NOT NULL,
    UNIQUE (artifact_name, artifact_type, tenant_id, node_id)
);
```

### artifact_version

```sql
CREATE TABLE artifact_version (
    version_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id   UUID NOT NULL REFERENCES artifact_header(artifact_id) ON DELETE CASCADE,
    version_no    INT NOT NULL,
    payload       JSONB NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,   -- TRUE = published/live
    is_draft      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200) NOT NULL,
    published_at  TIMESTAMPTZ,
    published_by  VARCHAR(200)
);
CREATE INDEX idx_artifact_version_artifact_latest ON artifact_version (artifact_id, version_no DESC);
CREATE INDEX idx_artifact_version_active ON artifact_version (artifact_id) WHERE is_active = TRUE;
```

### compiled_artifact

```sql
CREATE TABLE compiled_artifact (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_key  VARCHAR(300) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL,
    tenant_id     VARCHAR(100) NOT NULL,
    node_id       VARCHAR(200),
    payload       JSONB NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',  -- 'active' | 'superseded'
    content_hash  VARCHAR(64) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_compiled_artifact_active
    ON compiled_artifact (artifact_key, tenant_id, artifact_type, status)
    WHERE status = 'active';
```

### entity_record

```sql
CREATE TABLE entity_record (
    id               UUID PRIMARY KEY,              -- Application-generated via idgen
    entity_type      VARCHAR(200) NOT NULL,         -- e.g. "entity.sales_order"
    entity_category  VARCHAR(100),
    tenant_id        VARCHAR(100) NOT NULL,
    node_id          VARCHAR(200),
    status           VARCHAR(100) NOT NULL DEFAULT 'DRAFT',
    version_no       INT NOT NULL DEFAULT 1,
    created_by       VARCHAR(200) NOT NULL,
    updated_by       VARCHAR(200) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,                   -- NULL = not deleted
    deleted_by       VARCHAR(200),
    payload          JSONB NOT NULL DEFAULT '{}'
);
-- Always present indexes
CREATE INDEX idx_entity_record_tenant_type ON entity_record (tenant_id, entity_type);
CREATE INDEX idx_entity_record_tenant_type_status ON entity_record (tenant_id, entity_type, status);
-- Additional expression indexes added via index_queue (CREATE INDEX CONCURRENTLY)
```

### entity_sequence

```sql
CREATE TABLE entity_sequence (
    tenant_id   VARCHAR(100) NOT NULL,
    entity_key  VARCHAR(100) NOT NULL,
    next_val    BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (tenant_id, entity_key)
);
```

### artifact_overlay_delta

```sql
CREATE TABLE artifact_overlay_delta (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     VARCHAR(100) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL,
    artifact_key  VARCHAR(300) NOT NULL,
    layer         VARCHAR(20) NOT NULL,   -- 'platform'|'vertical'|'tenant'|'node'|'role'
    scope_ref     VARCHAR(200) NOT NULL,  -- tenant_id, node_id, role_code, etc.
    delta_json    JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200),
    UNIQUE (artifact_type, artifact_key, layer, scope_ref, tenant_id)
);
CREATE INDEX idx_overlay_delta_lookup ON artifact_overlay_delta (artifact_type, artifact_key, tenant_id);
```

### studio_node

```sql
CREATE TABLE studio_node (
    node_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  VARCHAR(100) NOT NULL,
    name       VARCHAR(200) NOT NULL,
    node_type  VARCHAR(50) NOT NULL,    -- 'platform'|'vertical'|'tenant'|'branch'|'warehouse'|'role'
    parent_id  UUID REFERENCES studio_node(node_id),
    metadata   JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(200)
);
CREATE INDEX idx_studio_node_tenant_parent ON studio_node (tenant_id, parent_id);
```

### entity_index_queue

```sql
CREATE TABLE entity_index_queue (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     VARCHAR(100) NOT NULL,
    entity_key    VARCHAR(300) NOT NULL,
    index_name    VARCHAR(200) NOT NULL,
    ddl           TEXT NOT NULL,         -- Full CREATE INDEX CONCURRENTLY statement
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending|applied|failed|discarded
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at    TIMESTAMPTZ,
    UNIQUE (entity_key, index_name, tenant_id)
);
```

---

## Artifact Type Values

| `artifact_type` | Used by |
|----------------|---------|
| `entity_schema` | Entity Designer, Entity Runtime |
| `rule_set` | Rules Engine |
| `picklist` | Field compiler (picklist resolution) |
| `field_type_catalog` | Entity Compiler step 1 |
| `overlay_delta` | Overlay System |
| `datasource` | Runtime field renderer |

---

## Migration Rules

1. **File naming:** `{unix_timestamp}_{snake_case_description}.up.sql` and `.down.sql`
2. **Always reversible:** Every `.up.sql` must have a `.down.sql` that undoes it
3. **Backward compatible:** No breaking changes to existing columns in production
4. **Column removal:** Two-step process â€” first rename to `{col}_deprecated` and deploy, then drop in a follow-up migration
5. **Startup execution:** `golang-migrate up` runs on service startup in dev; separate job before deployment in production
6. **No inline production indexes:** Use the index queue for expression indexes on `entity_record`
7. **Standard indexes:** Structural indexes (PKs, FKs, basic lookups) can be inline in migrations

### Migration File Template

```sql
-- {timestamp}_add_foo_column_to_entity_record.up.sql
ALTER TABLE entity_record ADD COLUMN foo VARCHAR(100);
COMMENT ON COLUMN entity_record.foo IS 'Added for: brief reason';
```

```sql
-- {timestamp}_add_foo_column_to_entity_record.down.sql
ALTER TABLE entity_record DROP COLUMN IF EXISTS foo;
```

---

## The Single-Table Strategy â€” Why and Consequences

**Why:** Eliminates per-entity DDL migrations. A new entity type is defined in the Entity Designer and published â€” no migration needed. The `entity_record` table holds all business data.

**Consequences:**
- Type validation is application-level (compiled schema enforces types, not PostgreSQL)
- Query performance on payload fields requires expression indexes (managed by `entity_index_queue`)
- Reporting across entity types uses JSONB operators
- No foreign key constraints between entity types at DB level â€” referential integrity enforced by the entity runtime

**Expression index pattern (added via queue, not inline):**
```sql
-- Auto-generated for each indexed field
CREATE INDEX CONCURRENTLY idx_er_tenant_sales_order_status
    ON entity_record ((payload->>'status'))
    WHERE entity_type = 'entity.sales_order' AND tenant_id = 'tenant-123' AND deleted_at IS NULL;
```

---

## Soft Delete â€” Universal Rule

**Never hard-delete business records.** All deletes set `deleted_at = NOW()`.

Runtime queries always filter:
```sql
WHERE deleted_at IS NULL
```

The recycle bin API queries without this filter (intentional â€” it shows deleted records).

The data lifecycle pipeline (Recycle Bin â†’ Archive â†’ Anonymise â†’ Purge) handles eventual hard deletion after the configured retention period.
