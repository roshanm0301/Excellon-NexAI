-- 20260529000008_audit_event_partitioned.up.sql
DROP TABLE IF EXISTS audit_event CASCADE;

CREATE TABLE IF NOT EXISTS audit_event (
    id          UUID NOT NULL,
    tenant_id   VARCHAR(100) NOT NULL,
    event_type  VARCHAR(100) NOT NULL,
    entity_type VARCHAR(200) NOT NULL,
    entity_id   UUID NOT NULL,
    actor_id    VARCHAR(200) NOT NULL,
    before_data JSONB,
    after_data  JSONB,
    diff        JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE audit_event_2024 PARTITION OF audit_event
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
CREATE TABLE audit_event_2025 PARTITION OF audit_event
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
CREATE TABLE audit_event_2026 PARTITION OF audit_event
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
CREATE TABLE audit_event_default PARTITION OF audit_event DEFAULT;
