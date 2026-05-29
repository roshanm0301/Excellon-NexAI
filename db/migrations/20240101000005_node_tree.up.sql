CREATE TABLE IF NOT EXISTS node_tree (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    parent_id   UUID REFERENCES node_tree(id),
    name        TEXT NOT NULL,
    node_type   TEXT NOT NULL DEFAULT 'location',
    metadata    JSONB NOT NULL DEFAULT '{}',
    created_by  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_node_tree_tenant ON node_tree (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_node_tree_parent ON node_tree (parent_id) WHERE deleted_at IS NULL;
