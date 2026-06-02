# Phase 1 — Metadata Foundation

---

## Phase Card

| Field | Value |
|---|---|
| **Milestone** | M2 |
| **Gate Condition** | Runtime endpoint returns published view payload from DB |
| **Depends On** | [Phase 0](P0-gap-analysis.md) gap analysis complete |
| **Agents** | Agent 3 (Metadata Arch) → Agent 4 (Backend API) → Agent 14 (QA) + Agent 17 (Contract) + Agent 16 (Coordinator) |
| **Code Changes** | ✅ Migration SQL · Go models/service/handler · TypeScript types |
| **Commit** | `feat: ui-studio Phase 1 — metadata foundation, DB schema, component registry table, all API routes` |

---

## New Files to Create

```
app/db/migrations/025_ui_studio_foundation.up.sql      NEW
app/db/migrations/025_ui_studio_foundation.down.sql    NEW
app/src/go/internal/studio/views/handler.go            ← extend existing
app/src/go/internal/studio/views/service.go            ← extend existing
app/src/go/internal/studio/views/model.go              ← extend existing
app/src/react/src/config/studioViewsApi.ts             ← extend existing
app/src/react/src/types/studio.ts                      ← extend existing
```

---

## 1.1 Migration: `025_ui_studio_foundation.up.sql`

```sql
-- Extend artifact_header with UI Studio fields
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS surface_type    VARCHAR(50);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS primary_entity  VARCHAR(100);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS view_code       VARCHAR(100);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS view_label      VARCHAR(255);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS view_category   VARCHAR(50);

-- Surface type values (enum — no separate table):
-- standard_crud | advanced_crud | header_line | custom_page |
-- dashboard | wizard | detail_page | split_view | kanban | calendar

-- View publish log
CREATE TABLE IF NOT EXISTS ui_view_publish_log (
  log_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id  UUID NOT NULL REFERENCES artifact_header(artifact_id),
  version_id   UUID NOT NULL REFERENCES artifact_version(version_id),
  action       VARCHAR(30) NOT NULL, -- 'published' | 'rolled_back' | 'deprecated' | 'archived' | 'ai_generated'
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changelog    TEXT,
  validation_result JSONB,
  tenant_id    UUID NOT NULL
);

-- View event definitions (stored separately for query performance)
CREATE TABLE IF NOT EXISTS ui_view_event_definition (
  event_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id  UUID NOT NULL REFERENCES artifact_header(artifact_id),
  event_type   VARCHAR(50) NOT NULL,
  -- 'field_change'|'grid_cell_change'|'action_click'|'row_select'|'form_load'|'before_save'|'after_save'
  source_field VARCHAR(100),
  conditions   JSONB,
  actions      JSONB NOT NULL DEFAULT '[]',
  priority     INTEGER NOT NULL DEFAULT 100,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  tenant_id    UUID NOT NULL
);

-- Data source overrides
CREATE TABLE IF NOT EXISTS ui_datasource_override (
  override_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id   UUID NOT NULL REFERENCES artifact_header(artifact_id),
  source_key    VARCHAR(100) NOT NULL,
  base_entity   VARCHAR(100),
  filter_config JSONB,
  sort_config   JSONB,
  join_config   JSONB,
  tenant_id     UUID NOT NULL
);

-- Role / context variants (overlay over base — not clones)
CREATE TABLE IF NOT EXISTS ui_view_variant (
  variant_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id  UUID NOT NULL REFERENCES artifact_header(artifact_id),
  variant_name VARCHAR(100) NOT NULL,
  conditions   JSONB NOT NULL,  -- [{type:'role',operator:'equals',value:'Clerk'}]
  overrides    JSONB NOT NULL,  -- delta from base: {field_overrides, action_overrides, ...}
  priority     INTEGER NOT NULL DEFAULT 100,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  tenant_id    UUID NOT NULL
);

-- Component registry table
CREATE TABLE IF NOT EXISTS ui_component_registry (
  component_code     VARCHAR(100) PRIMARY KEY,
  component_name     VARCHAR(255) NOT NULL,
  category           VARCHAR(50)  NOT NULL,
  version            VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
  source             VARCHAR(20)  NOT NULL DEFAULT 'platform', -- 'platform'|'plugin'
  plugin_id          VARCHAR(100),
  supported_surfaces JSONB NOT NULL DEFAULT '[]',
  supported_bindings JSONB NOT NULL DEFAULT '[]',
  is_container       BOOLEAN NOT NULL DEFAULT false,
  allowed_parents    JSONB NOT NULL DEFAULT '[]',
  allowed_children   JSONB NOT NULL DEFAULT '[]',
  config_schema      JSONB NOT NULL DEFAULT '{}',
  default_props      JSONB NOT NULL DEFAULT '{}',
  event_support      JSONB NOT NULL DEFAULT '{"emits":[],"handles":[]}',
  permission_behavior JSONB NOT NULL DEFAULT '{}',
  runtime_renderer   VARCHAR(255),
  designer_panel     VARCHAR(255),
  preview_support    BOOLEAN NOT NULL DEFAULT true,
  validation_rules   JSONB NOT NULL DEFAULT '[]',
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Plugin registry
CREATE TABLE IF NOT EXISTS ui_component_plugin (
  plugin_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_name         VARCHAR(255) NOT NULL,
  version             VARCHAR(20)  NOT NULL,
  author              VARCHAR(255),
  runtime_bundle_url  TEXT,
  designer_bundle_url TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  tenant_id           UUID NOT NULL,
  installed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artifact_header_surface_type   ON artifact_header(surface_type);
CREATE INDEX IF NOT EXISTS idx_artifact_header_view_code      ON artifact_header(view_code);
CREATE INDEX IF NOT EXISTS idx_artifact_header_primary_entity ON artifact_header(primary_entity);
CREATE INDEX IF NOT EXISTS idx_ui_view_event_artifact         ON ui_view_event_definition(artifact_id);
CREATE INDEX IF NOT EXISTS idx_ui_view_variant_artifact       ON ui_view_variant(artifact_id);
```

---

## 1.2 API Routes — extend `go/internal/studio/views/handler.go`

```
-- Designer routes
GET    /api/v1/studio/views                                   List views (filter: surface, entity, status)
POST   /api/v1/studio/views                                   Create view
GET    /api/v1/studio/views/:viewKey                          Get view + active payload
GET    /api/v1/studio/views/:viewKey/versions                 List all versions
GET    /api/v1/studio/views/:viewKey/versions/:versionId      Get specific version
PUT    /api/v1/studio/views/:viewKey/draft                    Save draft
POST   /api/v1/studio/views/:viewKey/validate                 Pre-publish validation
POST   /api/v1/studio/views/:viewKey/publish                  Publish
POST   /api/v1/studio/views/:viewKey/rollback/:versionId      Rollback to version
DELETE /api/v1/studio/views/:viewKey                          Archive
GET    /api/v1/studio/views/:viewKey/diff/:v1/:v2             Semantic diff
GET    /api/v1/studio/views/:viewKey/impact                   Impact analysis
GET    /api/v1/studio/views/:viewKey/sync-status              Schema drift check

-- Runtime routes (used by StudioRenderer — not by designer)
GET    /api/v1/studio/runtime/views/:viewKey                  Load active published view
GET    /api/v1/studio/runtime/views/by-code/:viewCode         Load by ViewCode

-- Entity metadata (used by designer field picker)
GET    /api/v1/studio/entities                                List entity types
GET    /api/v1/studio/entities/:entityType/fields             Get field definitions
GET    /api/v1/studio/entities/:entityType/relationships      Get relationships

-- Component registry
GET    /api/v1/studio/component-registry                      List all components (filter: surface, category)
GET    /api/v1/studio/component-registry/:componentCode       Get component entry
POST   /api/v1/studio/component-registry/validate             Validate config against schema
POST   /api/v1/studio/plugins                                 Register plugin
GET    /api/v1/studio/plugins                                 List plugins
DELETE /api/v1/studio/plugins/:pluginId                       Remove plugin
```

> ⚠️ **CRITICAL:** Runtime route (`/runtime/views/`) must NEVER return a draft version.
> Only return rows where `artifact_version.is_active = true`.

---

## 1.3 TypeScript Types — extend `types/studio.ts`

```typescript
export type SurfaceType =
  | 'standard_crud'
  | 'advanced_crud'
  | 'header_line'
  | 'custom_page'
  | 'dashboard'
  | 'wizard'
  | 'detail_page'
  | 'split_view'
  | 'kanban'
  | 'calendar'

export interface ViewArtifactPayload {
  view_key:           string
  view_label:         string
  surface_type:       SurfaceType
  view_code?:         string           // process discriminator — propagated to all backend calls
  primary_entity?:    string
  data_sources:       DataSource[]
  component_tree:     ComponentNode
  event_definitions:  EventDefinition[]
  behavior_rules:     BehaviorRule[]
  action_definitions: ActionDefinition[]
  permission_config:  PermissionConfig
  header_line_config?: HeaderLineConfig  // Phase 6
  meta:               PageMeta
  nav_attachment?:    NavAttachment
  crud_config?:       CrudConfig
  _schema_version:    number            // increment on breaking schema changes
}

export interface EventDefinition {
  event_id:      string
  event_type:    'field_change' | 'grid_cell_change' | 'action_click' | 'row_select' | 'form_load' | 'before_save' | 'after_save'
  source_field?: string
  conditions:    ConditionGroup
  actions:       EventAction[]
  priority:      number
}

export interface EventAction {
  action_type:        EventActionType
  target_field?:      string
  target_section?:    string
  value_expression?:  string
  service_call?:      ServiceCallConfig
  popup_config?:      PopupConfig
}

export type EventActionType =
  | 'show' | 'hide' | 'enable' | 'disable' | 'required' | 'optional'
  | 'clear' | 'set_value' | 'refresh_lookup' | 'recalculate'
  | 'show_warning' | 'show_popup' | 'auto_populate'
  | 'recalculate_row_amount' | 'refresh_row_lookup'
  | 'show_row_warning' | 'call_domain_service'
```

---

## Testing Phase 1

```bash
# 1. Verify migration applied
GET http://localhost:8080/api/v1/studio/views
Expected: 200, empty array

# 2. Create a view
POST http://localhost:8080/api/v1/studio/views
Body: {"view_key":"test_view","view_label":"Test","surface_type":"standard_crud","primary_entity":"customer"}
Expected: 201 with view_key

# 3. Save a draft
PUT http://localhost:8080/api/v1/studio/views/test_view/draft
Body: {ViewArtifactPayload with minimal component_tree}
Expected: 200

# 4. Publish
POST http://localhost:8080/api/v1/studio/views/test_view/publish
Body: {"changelog":"initial publish"}
Expected: 200

# 5. Load from runtime endpoint (must return published, not draft)
GET http://localhost:8080/api/v1/studio/runtime/views/test_view
Expected: 200 with published payload

# 6. Tenant isolation — token for different tenant
GET http://localhost:8080/api/v1/studio/views  (with tenant B token)
Expected: 200, empty array (tenant A's view not visible)
```

---

## Agents — Phase 1

> ➡️ **SEQUENTIAL** — Agent 3 defines schema first. Agent 4 implements after Agent 3's migration is committed.

| Lane | Agent | Responsibility | Primary Files |
|---|---|---|---|
| A | **[Agent 3: Metadata Architecture](../reference/agent-specifications.md#agent-3-metadata-architecture-agent)** | Write migration SQL, define Go structs, define TypeScript types | `025_ui_studio_foundation.up.sql`, `types/studio.ts` |
| B | **[Agent 4: Backend API](../reference/agent-specifications.md#agent-4-backend-api-agent)** | Implement all Go routes on top of Agent 3's schema | `handler.go`, `service.go`, `model.go` |

After A and B complete:

| Agent | Task |
|---|---|
| **Agent 14: QA** | Migration tests, API contract tests, tenant isolation tests |
| **Agent 17: API Contract Alignment** | Validate Go response structs match TypeScript types |
| **Agent 16: Phase Coordinator** | Confirm runtime loader returns only published version — **gate M3** |

---

## ✅ Gate Condition — M2

```
GET http://localhost:8080/api/v1/studio/runtime/views/test_view
Expected: 200 with published ViewArtifactPayload

GET http://localhost:8080/api/v1/studio/runtime/views/test_view  (draft only — not published)
Expected: 404 or {"error":"no active version"}

Tenant isolation: tenant B cannot see tenant A views.
```

> **Previous phase:** [Phase 0](P0-gap-analysis.md)
> **Next phase:** [Phase 2 — Component Registry](P2-component-registry.md)
