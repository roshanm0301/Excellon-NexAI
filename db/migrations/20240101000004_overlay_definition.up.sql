CREATE TYPE overlay_layer AS ENUM ('platform', 'vertical', 'tenant', 'node', 'role');

CREATE TABLE IF NOT EXISTS overlay_definition (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    entity_type TEXT NOT NULL,
    layer       overlay_layer NOT NULL,
    scope_key   TEXT NOT NULL,
    delta       JSONB NOT NULL DEFAULT '{}',
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_overlay_tenant_type ON overlay_definition (tenant_id, entity_type, layer) WHERE deleted_at IS NULL;
CREATE INDEX idx_overlay_scope ON overlay_definition (scope_key) WHERE deleted_at IS NULL;
