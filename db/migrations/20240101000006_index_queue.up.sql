CREATE TYPE index_queue_status AS ENUM ('pending', 'running', 'done', 'failed');

CREATE TABLE IF NOT EXISTS index_queue (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entity_type     TEXT NOT NULL,
    index_name      TEXT NOT NULL,
    index_ddl       TEXT NOT NULL,
    status          index_queue_status NOT NULL DEFAULT 'pending',
    error_message   TEXT,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_index_queue_status ON index_queue (status) WHERE status IN ('pending', 'running');
