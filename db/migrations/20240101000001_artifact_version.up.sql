CREATE TABLE IF NOT EXISTS artifact_version (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entity_type     TEXT NOT NULL,
    version         INTEGER NOT NULL DEFAULT 1,
    status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'in-review', 'published', 'deprecated')),
    payload         JSONB NOT NULL DEFAULT '{}',
    content_hash    TEXT,
    created_by      UUID NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_artifact_version_tenant_type ON artifact_version (tenant_id, entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_artifact_version_status ON artifact_version (status) WHERE deleted_at IS NULL;
