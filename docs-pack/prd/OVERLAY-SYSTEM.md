# PRD: OVERLAY-SYSTEM.md — 5-Layer Overlay System

> **Source document:** 08-overlay-system.md
> **Read also:** DATA-ARCHITECTURE.md, ENTITY-DESIGNER.md

---

## What It Is

The Overlay System enables multi-tenant schema customisation without forking base definitions. A platform-level entity schema defines the universal structure. Each layer in the hierarchy can add, modify, or remove fields, sections, and properties — without touching the base schema. The merged result is what the Go compiler receives as input.

---

## 5-Layer Hierarchy

```
Layer 1: Platform   (scope_ref = "excellon_platform")       ← lowest priority
Layer 2: Vertical   (scope_ref = vertical_id, e.g. "automotive")
Layer 3: Tenant     (scope_ref = tenant_id)
Layer 4: Node       (scope_ref = node_id from org tree)
Layer 5: Role       (scope_ref = role_code)                  ← highest priority
```

Later layers override earlier layers on conflict. Role has the highest precedence. Empty layers are skipped.

---

## Delta Operations

Each delta is a JSON object where keys map to op-tagged entries:

| `op` | Behaviour |
|------|-----------|
| `ADD` | Merges sub-keys into existing map for that key |
| `MODIFY` | Same as ADD |
| `REMOVE` | Marks key as `{ "_removed": true }` — compiler skips `_removed` fields |
| `REPLACE` | Overwrites the key entirely |

```json
// Example delta (vertical layer)
{
  "fields": {
    "customer_type": { "op": "ADD", "type": "enum", "label": "Customer Type", "required": true },
    "legacy_code":   { "op": "REMOVE" },
    "credit_limit":  { "op": "MODIFY", "required": true }
  },
  "sections": {
    "automotive_section": { "op": "ADD", "title": "Automotive Details", "fields": ["customer_type"] }
  }
}
```

---

## Go Resolver

```go
// src/go/internal/overlay/resolver.go
type Resolver struct {
    db    *pgxpool.Pool
    cache *cache.Cache
}

type Scope struct {
    TenantID   string
    VerticalID string  // defaults to "automotive" if empty
    NodeID     string  // empty = skip node layer
    RoleCode   string  // empty = skip role layer
}

func (r *Resolver) Resolve(ctx context.Context, scope Scope, artifactType, artifactKey string) (*MergedArtifact, error)
```

### Resolution Steps

1. Check Redis cache: key = `"overlay:{tenantID}:{verticalID}:{nodeID}:{roleCode}:{artifactType}:{artifactKey}"`
2. Build layers list in order (platform → vertical → tenant → node → role)
3. For each layer: SELECT `delta_json` from `artifact_overlay_delta` WHERE layer + scope_ref + artifact_type + artifact_key
4. Call `deepMerge(merged, delta)` for each non-nil delta
5. Compute `contentHash = SHA-256(json.Marshal(merged))`
6. Store in Redis (6h TTL)
7. Return `MergedArtifact{ ArtifactType, ArtifactKey, Data: merged, ContentHash }`

---

## deepMerge Algorithm

```
For each key k in delta:
  if delta[k] is a map WITH an "op" key:
    case ADD, MODIFY:
      sub = delta[k] without "op"
      if base[k] is a map: out[k] = deepMerge(base[k], sub)
      else: out[k] = sub
    case REMOVE:
      out[k] = { "_removed": true }
    case REPLACE:
      out[k] = delta[k] without "op"
  else if delta[k] is a map WITHOUT "op":
    recurse: out[k] = deepMerge(base[k], delta[k])
  else (scalar):
    out[k] = delta[k]  // delta scalar wins
```

Key properties:
- Base map is never mutated (copy-on-write)
- `_removed: true` markers propagate through subsequent layer merges
- Compiler Step 2 filters out `_removed` fields from compiled output
- Scalar values: delta always wins over base

---

## Database

```sql
CREATE TABLE artifact_overlay_delta (
    id            UUID PRIMARY KEY,
    tenant_id     VARCHAR(100) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL,
    artifact_key  VARCHAR(300) NOT NULL,
    layer         VARCHAR(20)  NOT NULL,   -- platform|vertical|tenant|node|role
    scope_ref     VARCHAR(200) NOT NULL,
    delta_json    JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200),
    UNIQUE (artifact_type, artifact_key, layer, scope_ref, tenant_id)
);
CREATE INDEX idx_overlay_delta_lookup ON artifact_overlay_delta (artifact_type, artifact_key, tenant_id);
```

---

## REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/overlay-deltas` | List — filter by `artifact_type`, `artifact_key` |
| `POST` | `/api/v1/admin/overlay-deltas` | Create delta |
| `GET` | `/api/v1/admin/overlay-deltas/{id}` | Get delta |
| `PUT` | `/api/v1/admin/overlay-deltas/{id}` | Update delta JSON |
| `DELETE` | `/api/v1/admin/overlay-deltas/{id}` | Delete delta |
| `POST` | `/api/v1/admin/overlay-deltas/resolve` | Resolve: return merged artifact for given scope |

```json
// POST /api/v1/admin/overlay-deltas/resolve
// Request
{ "artifact_type": "entity_schema", "artifact_key": "entity.sales_order",
  "scope": { "tenant_id": "t1", "vertical_id": "automotive", "node_id": "n1", "role_code": "AGENT" } }
// Response
{ "artifact_type": "entity_schema", "artifact_key": "entity.sales_order", "content_hash": "sha256...", "data": { ... } }
```

---

## Caching

- **Backend:** Redis (optional — graceful fallback to DB on unavailability)
- **TTL:** 6 hours
- **Invalidation:** TTL-based only — no active invalidation
- **Deduplication:** Compiler checks `content_hash` before writing new `compiled_artifact` — prevents redundant recompile

---

## Overlay Studio UI

- **Routes:** `/admin/overlays`, `/admin/overlays/{artifactType}/{artifactKey}/{layer}`
- Three tabs: Entity Fields, List View, Form View
- Layer selector: Platform / Vertical / Tenant / Node / Role with scope ref
- Preview panel: shows resolved schema for current scope

---

## Practical Examples

**Tenant adds a field:**
```json
// Delta (layer=tenant, scope_ref=automotive-dealer)
{ "fields": { "gst_number": { "op": "ADD", "type": "string", "label": "GST Number", "required": true } } }
```
Other tenants do not see `gst_number`.

**Role removes a sensitive field:**
```json
// Delta (layer=role, scope_ref=AGENT)
{ "fields": { "credit_score": { "op": "REMOVE" } } }
```
ADMIN role sees `credit_score`; AGENT role does not.
