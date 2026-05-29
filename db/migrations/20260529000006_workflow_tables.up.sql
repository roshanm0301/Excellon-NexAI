-- 20260529000006_workflow_tables.up.sql
CREATE TABLE IF NOT EXISTS workflow_instance (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       VARCHAR(100) NOT NULL,
    entity_type     VARCHAR(200) NOT NULL,
    entity_id       UUID NOT NULL,
    workflow_key    VARCHAR(200) NOT NULL,
    current_status  VARCHAR(100) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_transition_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   VARCHAR(100) NOT NULL,
    entity_type VARCHAR(200) NOT NULL,
    entity_id   UUID NOT NULL,
    from_status VARCHAR(100),
    to_status   VARCHAR(100) NOT NULL,
    command     VARCHAR(100),
    actor_id    VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workflow_human_task (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(200) NOT NULL,
    entity_id     UUID NOT NULL,
    task_key      VARCHAR(200) NOT NULL,
    title         TEXT,
    assignee_role VARCHAR(100),
    due_at        TIMESTAMPTZ,
    status        VARCHAR(20) NOT NULL DEFAULT 'pending',
    completed_by  VARCHAR(200),
    completed_at  TIMESTAMPTZ,
    outcome       VARCHAR(100),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
