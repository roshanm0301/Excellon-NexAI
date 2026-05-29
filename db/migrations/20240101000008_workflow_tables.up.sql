CREATE TABLE IF NOT EXISTS status_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    from_status     TEXT,
    to_status       TEXT NOT NULL,
    transitioned_by UUID NOT NULL,
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_status_history_entity ON status_history (tenant_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS sla_record (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    sla_key         TEXT NOT NULL,
    due_at          TIMESTAMPTZ NOT NULL,
    breached_at     TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sla_record_due ON sla_record (due_at) WHERE resolved_at IS NULL;
CREATE INDEX idx_sla_record_entity ON sla_record (tenant_id, entity_type, entity_id);

CREATE TABLE IF NOT EXISTS human_task (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    entity_type     TEXT NOT NULL,
    entity_id       UUID NOT NULL,
    task_type       TEXT NOT NULL,
    assigned_to     UUID,
    assigned_role   TEXT,
    title           TEXT NOT NULL,
    description     TEXT,
    due_at          TIMESTAMPTZ,
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'done', 'cancelled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_human_task_entity ON human_task (tenant_id, entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_human_task_assigned ON human_task (assigned_to, status) WHERE deleted_at IS NULL;
