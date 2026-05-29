CREATE TABLE IF NOT EXISTS entity_record (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_type TEXT NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'active',
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_entity_record_tenant_type ON entity_record (tenant_id, entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_entity_record_created_at ON entity_record (entity_type, created_at DESC) WHERE deleted_at IS NULL;
