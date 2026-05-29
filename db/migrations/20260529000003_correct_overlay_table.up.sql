-- 20260529000003_correct_overlay_table.up.sql
DROP TABLE IF EXISTS overlay_definition CASCADE;

CREATE TABLE artifact_overlay_delta (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     VARCHAR(100) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL,
    artifact_key  VARCHAR(300) NOT NULL,
    layer         VARCHAR(20) NOT NULL,
    scope_ref     VARCHAR(200) NOT NULL,
    delta_json    JSONB NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200),
    UNIQUE (artifact_type, artifact_key, layer, scope_ref, tenant_id)
);
CREATE INDEX idx_overlay_delta_lookup ON artifact_overlay_delta (artifact_type, artifact_key, tenant_id);
