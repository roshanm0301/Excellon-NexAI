-- M3: Business Workflow Engine v2 — DAG model, bindings, execution log

-- Add DAG-related columns to process_definition
ALTER TABLE process_definition ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1;
ALTER TABLE process_definition ADD COLUMN IF NOT EXISTS trigger_event TEXT NOT NULL DEFAULT '';
ALTER TABLE process_definition ADD COLUMN IF NOT EXISTS dag_definition JSONB;

-- Add DAG state tracking to process_instance
ALTER TABLE process_instance ADD COLUMN IF NOT EXISTS dag_state JSONB NOT NULL DEFAULT '{}';
ALTER TABLE process_instance ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE process_instance ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE process_instance ADD COLUMN IF NOT EXISTS error_message TEXT NOT NULL DEFAULT '';

-- Workflow binding: maps entity events to workflow definitions
CREATE TABLE IF NOT EXISTS workflow_binding (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    entity_type   TEXT NOT NULL,
    trigger_event TEXT NOT NULL,
    definition_id UUID NOT NULL REFERENCES process_definition(id),
    priority      INT NOT NULL DEFAULT 0,
    condition     TEXT NOT NULL DEFAULT '',
    enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    created_by    UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_workflow_binding_lookup
    ON workflow_binding (tenant_id, entity_type, trigger_event)
    WHERE deleted_at IS NULL AND enabled = TRUE;

-- Workflow execution log: audit trail for step executions
CREATE TABLE IF NOT EXISTS workflow_execution_log (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    instance_id   UUID NOT NULL,
    step_id       TEXT NOT NULL,
    step_type     TEXT NOT NULL,
    status        TEXT NOT NULL,
    input_data    JSONB,
    output_data   JSONB,
    error_message TEXT,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at  TIMESTAMPTZ,
    duration_ms   INT
);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_log_instance
    ON workflow_execution_log (tenant_id, instance_id, started_at DESC);

-- Approval records: tracks individual approval decisions
CREATE TABLE IF NOT EXISTS workflow_approval (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     UUID NOT NULL,
    instance_id   UUID NOT NULL,
    step_id       TEXT NOT NULL,
    approver_id   UUID,
    approver_role TEXT NOT NULL DEFAULT '',
    decision      TEXT NOT NULL DEFAULT 'pending',
    comment       TEXT NOT NULL DEFAULT '',
    decided_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_approval_pending
    ON workflow_approval (tenant_id, approver_role, decision)
    WHERE decision = 'pending';

CREATE INDEX IF NOT EXISTS idx_workflow_approval_instance
    ON workflow_approval (tenant_id, instance_id);
