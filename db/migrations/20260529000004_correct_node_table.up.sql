-- 20260529000004_correct_node_table.up.sql
DROP TABLE IF EXISTS node_tree CASCADE;

CREATE TABLE IF NOT EXISTS studio_node (
    node_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id  VARCHAR(100) NOT NULL,
    name       VARCHAR(200) NOT NULL,
    node_type  VARCHAR(50) NOT NULL,
    parent_id  UUID REFERENCES studio_node(node_id),
    metadata   JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(200)
);
CREATE INDEX idx_studio_node_tenant_parent ON studio_node (tenant_id, parent_id);
