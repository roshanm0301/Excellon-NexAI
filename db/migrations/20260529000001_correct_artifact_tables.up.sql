-- 20260529000001_correct_artifact_tables.up.sql
-- Creates artifact_header, drops and recreates artifact_version, compiled_artifact

CREATE TABLE IF NOT EXISTS artifact_header (
    artifact_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_name VARCHAR(300) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL,
    tenant_id     VARCHAR(100) NOT NULL,
    node_id       VARCHAR(200),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200) NOT NULL,
    UNIQUE (artifact_name, artifact_type, tenant_id, node_id)
);

DROP TABLE IF EXISTS compiled_artifact CASCADE;
DROP TABLE IF EXISTS artifact_version CASCADE;

CREATE TABLE artifact_version (
    version_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_id   UUID NOT NULL REFERENCES artifact_header(artifact_id) ON DELETE CASCADE,
    version_no    INT NOT NULL,
    payload       JSONB NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT FALSE,
    is_draft      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by    VARCHAR(200) NOT NULL,
    published_at  TIMESTAMPTZ,
    published_by  VARCHAR(200)
);
CREATE INDEX idx_artifact_version_artifact_latest ON artifact_version (artifact_id, version_no DESC);
CREATE INDEX idx_artifact_version_active ON artifact_version (artifact_id) WHERE is_active = TRUE;

CREATE TABLE compiled_artifact (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artifact_key  VARCHAR(300) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL,
    tenant_id     VARCHAR(100) NOT NULL,
    node_id       VARCHAR(200),
    payload       JSONB NOT NULL,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',
    content_hash  VARCHAR(64) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_compiled_artifact_active
    ON compiled_artifact (artifact_key, tenant_id, artifact_type, status)
    WHERE status = 'active';
