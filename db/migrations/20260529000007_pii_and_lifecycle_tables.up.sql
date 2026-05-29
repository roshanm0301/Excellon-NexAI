-- 20260529000007_pii_and_lifecycle_tables.up.sql
CREATE TABLE IF NOT EXISTS entity_lifecycle (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  VARCHAR(100) NOT NULL,
    entity_type VARCHAR(200) NOT NULL,
    entity_id  UUID NOT NULL,
    stage      VARCHAR(50) NOT NULL DEFAULT 'recycle_bin',
    moved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    moved_by   VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pii_vault (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        VARCHAR(100) NOT NULL,
    entity_id        UUID NOT NULL,
    field_name       VARCHAR(200) NOT NULL,
    encrypted_value  TEXT NOT NULL,
    key_id           UUID,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kms_keys (
    key_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     VARCHAR(100) NOT NULL,
    encrypted_dek TEXT NOT NULL,
    algorithm     VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rotated_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS pii_access_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(100) NOT NULL,
    entity_type VARCHAR(200) NOT NULL,
    entity_id   UUID NOT NULL,
    field_name  VARCHAR(200) NOT NULL,
    access_type VARCHAR(20) NOT NULL,
    actor_id    VARCHAR(200) NOT NULL,
    actor_role  VARCHAR(100),
    purpose     VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
