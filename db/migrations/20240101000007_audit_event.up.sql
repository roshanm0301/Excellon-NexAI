CREATE TABLE IF NOT EXISTS audit_event (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    action          TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'restore', 'publish', 'status_change')),
    actor_id        UUID NOT NULL,
    actor_role      TEXT,
    before_payload  JSONB,
    after_payload   JSONB,
    purpose         TEXT,
    lawful_basis    TEXT,
    data_category   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_event_entity ON audit_event (tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_event_actor ON audit_event (actor_id, created_at DESC);
