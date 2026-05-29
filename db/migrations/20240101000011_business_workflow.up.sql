CREATE TABLE IF NOT EXISTS process_definition (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    name        TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    definition  JSONB NOT NULL DEFAULT '{}',
    created_by  UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS process_instance (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    definition_id UUID NOT NULL,
    entity_type   TEXT NOT NULL,
    entity_id     UUID NOT NULL,
    current_step  TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'running',
    context       JSONB NOT NULL DEFAULT '{}',
    abort_reason  TEXT NOT NULL DEFAULT '',
    created_by    UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
