CREATE TABLE IF NOT EXISTS rule_set (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_type TEXT NOT NULL,
    name        TEXT NOT NULL,
    definition  JSONB NOT NULL DEFAULT '{}',
    enabled     BOOLEAN NOT NULL DEFAULT true,
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_rule_set_tenant_type ON rule_set (tenant_id, entity_type) WHERE deleted_at IS NULL AND enabled = true;
