-- 20260529000005_correct_index_queue.up.sql
DROP TABLE IF EXISTS index_queue CASCADE;

CREATE TABLE entity_index_queue (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     VARCHAR(100) NOT NULL,
    entity_key    VARCHAR(300) NOT NULL,
    index_name    VARCHAR(200) NOT NULL,
    ddl           TEXT NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','applied','failed','discarded')),
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_at    TIMESTAMPTZ,
    UNIQUE (entity_key, index_name, tenant_id)
);
