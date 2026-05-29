CREATE TABLE IF NOT EXISTS compiled_artifact (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_version_id UUID NOT NULL REFERENCES artifact_version(id),
    tenant_id           UUID NOT NULL,
    entity_type         TEXT NOT NULL,
    compiled_schema     JSONB NOT NULL DEFAULT '{}',
    content_hash        TEXT NOT NULL,
    compiler_version    TEXT NOT NULL DEFAULT '1',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_compiled_artifact_version ON compiled_artifact (artifact_version_id);
CREATE INDEX idx_compiled_artifact_tenant_type ON compiled_artifact (tenant_id, entity_type);
