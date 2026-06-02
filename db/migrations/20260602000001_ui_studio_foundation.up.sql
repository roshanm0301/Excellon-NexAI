-- 20260602000001_ui_studio_foundation.up.sql
-- UI Studio Phase 1: Metadata Foundation
-- Adds view studio columns to artifact_header and creates supporting tables.

-- ============================================================================
-- 1. Extend artifact_header with UI Studio columns
-- ============================================================================
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS surface_type    VARCHAR(50);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS primary_entity  VARCHAR(100);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS view_code       VARCHAR(100);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS view_label      VARCHAR(255);
ALTER TABLE artifact_header ADD COLUMN IF NOT EXISTS view_category   VARCHAR(50);

-- Surface type values (enforced at application level, not DB enum):
-- standard_crud | advanced_crud | header_line | custom_page |
-- dashboard | wizard | detail_page | split_view | kanban | calendar

-- ============================================================================
-- 2. Component Registry — platform + plugin components
-- ============================================================================
CREATE TABLE IF NOT EXISTS ui_component_registry (
    component_code      VARCHAR(100) PRIMARY KEY,
    component_name      VARCHAR(255) NOT NULL,
    category            VARCHAR(50)  NOT NULL,
    version             VARCHAR(20)  NOT NULL DEFAULT '1.0.0',
    source              VARCHAR(20)  NOT NULL DEFAULT 'platform',
    plugin_id           UUID,
    supported_surfaces  JSONB NOT NULL DEFAULT '[]',
    supported_bindings  JSONB NOT NULL DEFAULT '[]',
    is_container        BOOLEAN NOT NULL DEFAULT false,
    allowed_parents     JSONB NOT NULL DEFAULT '[]',
    allowed_children    JSONB NOT NULL DEFAULT '[]',
    config_schema       JSONB NOT NULL DEFAULT '{}',
    default_props       JSONB NOT NULL DEFAULT '{}',
    event_support       JSONB NOT NULL DEFAULT '{"emits":[],"handles":[]}',
    permission_behavior JSONB NOT NULL DEFAULT '{}',
    runtime_renderer    VARCHAR(255),
    designer_panel      VARCHAR(255),
    preview_support     BOOLEAN NOT NULL DEFAULT true,
    validation_rules    JSONB NOT NULL DEFAULT '[]',
    deprecated_at       TIMESTAMPTZ,
    successor_code      VARCHAR(100),
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. Plugin Registry
-- ============================================================================
CREATE TABLE IF NOT EXISTS ui_component_plugin (
    plugin_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plugin_name         VARCHAR(255) NOT NULL,
    version             VARCHAR(20)  NOT NULL,
    author              VARCHAR(255),
    runtime_bundle_url  TEXT,
    designer_bundle_url TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    tenant_id           VARCHAR(100) NOT NULL,
    installed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. View Publish Log — audit trail for every publish/rollback/archive action
-- ============================================================================
CREATE TABLE IF NOT EXISTS ui_view_publish_log (
    log_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id         UUID NOT NULL REFERENCES artifact_header(artifact_id) ON DELETE CASCADE,
    version_id          UUID NOT NULL REFERENCES artifact_version(version_id) ON DELETE CASCADE,
    action              VARCHAR(30) NOT NULL,
    performed_by        VARCHAR(200),
    performed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    changelog           TEXT,
    validation_result   JSONB,
    tenant_id           VARCHAR(100) NOT NULL
);

-- ============================================================================
-- 5. View Event Definitions — stored separately for query performance
-- ============================================================================
CREATE TABLE IF NOT EXISTS ui_view_event_definition (
    event_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id         UUID NOT NULL REFERENCES artifact_header(artifact_id) ON DELETE CASCADE,
    event_type          VARCHAR(50) NOT NULL,
    source_field        VARCHAR(100),
    conditions          JSONB,
    actions             JSONB NOT NULL DEFAULT '[]',
    priority            INTEGER NOT NULL DEFAULT 100,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    tenant_id           VARCHAR(100) NOT NULL
);

-- ============================================================================
-- 6. Data Source Overrides — per-view data source configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS ui_datasource_override (
    override_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id         UUID NOT NULL REFERENCES artifact_header(artifact_id) ON DELETE CASCADE,
    source_key          VARCHAR(100) NOT NULL,
    base_entity         VARCHAR(100),
    filter_config       JSONB,
    sort_config         JSONB,
    join_config         JSONB,
    tenant_id           VARCHAR(100) NOT NULL
);

-- ============================================================================
-- 7. View Variants — role/context overlays (delta, not clone)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ui_view_variant (
    variant_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id         UUID NOT NULL REFERENCES artifact_header(artifact_id) ON DELETE CASCADE,
    variant_name        VARCHAR(100) NOT NULL,
    conditions          JSONB NOT NULL,
    overrides           JSONB NOT NULL,
    priority            INTEGER NOT NULL DEFAULT 100,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    tenant_id           VARCHAR(100) NOT NULL
);

-- ============================================================================
-- 8. Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_artifact_header_surface_type
    ON artifact_header(surface_type) WHERE surface_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artifact_header_view_code
    ON artifact_header(view_code) WHERE view_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_artifact_header_primary_entity
    ON artifact_header(primary_entity) WHERE primary_entity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ui_view_publish_log_artifact
    ON ui_view_publish_log(artifact_id, performed_at DESC);

CREATE INDEX IF NOT EXISTS idx_ui_view_event_artifact
    ON ui_view_event_definition(artifact_id);

CREATE INDEX IF NOT EXISTS idx_ui_view_variant_artifact
    ON ui_view_variant(artifact_id);

CREATE INDEX IF NOT EXISTS idx_ui_datasource_override_artifact
    ON ui_datasource_override(artifact_id);

CREATE INDEX IF NOT EXISTS idx_ui_component_plugin_tenant
    ON ui_component_plugin(tenant_id) WHERE is_active = true;
