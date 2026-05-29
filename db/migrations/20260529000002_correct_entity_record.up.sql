-- 20260529000002_correct_entity_record.up.sql
DROP TABLE IF EXISTS entity_record CASCADE;

CREATE TABLE entity_record (
    id               UUID PRIMARY KEY,
    entity_type      VARCHAR(200) NOT NULL,
    entity_category  VARCHAR(100),
    tenant_id        VARCHAR(100) NOT NULL,
    node_id          VARCHAR(200),
    status           VARCHAR(100) NOT NULL DEFAULT 'DRAFT',
    version_no       INT NOT NULL DEFAULT 1,
    created_by       VARCHAR(200) NOT NULL,
    updated_by       VARCHAR(200) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ,
    deleted_by       VARCHAR(200),
    payload          JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_entity_record_tenant_type ON entity_record (tenant_id, entity_type);
CREATE INDEX idx_entity_record_tenant_type_status ON entity_record (tenant_id, entity_type, status);

CREATE TABLE IF NOT EXISTS entity_sequence (
    tenant_id   VARCHAR(100) NOT NULL,
    entity_key  VARCHAR(100) NOT NULL,
    next_val    BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (tenant_id, entity_key)
);
