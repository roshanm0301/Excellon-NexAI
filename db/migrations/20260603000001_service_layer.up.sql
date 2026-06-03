-- M5: Service Layer — service registry and invocation log

CREATE TABLE IF NOT EXISTS service_registration (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    service_key   TEXT NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    transport     TEXT NOT NULL DEFAULT 'internal',
    config        JSONB NOT NULL DEFAULT '{}',
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ,
    CONSTRAINT uq_service_key_tenant UNIQUE (tenant_id, service_key)
);

CREATE INDEX IF NOT EXISTS idx_service_registration_lookup
    ON service_registration (tenant_id, service_key)
    WHERE deleted_at IS NULL AND enabled = TRUE;

CREATE TABLE IF NOT EXISTS service_invocation_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    service_key     TEXT NOT NULL,
    method          TEXT NOT NULL,
    caller          TEXT NOT NULL DEFAULT '',
    input_data      JSONB,
    output_data     JSONB,
    status          TEXT NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    duration_ms     INT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_service_invocation_log_lookup
    ON service_invocation_log (tenant_id, service_key, created_at DESC);
