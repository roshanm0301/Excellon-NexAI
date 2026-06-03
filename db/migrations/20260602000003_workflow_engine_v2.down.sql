-- Rollback M3: Business Workflow Engine v2

DROP INDEX IF EXISTS idx_workflow_approval_instance;
DROP INDEX IF EXISTS idx_workflow_approval_pending;
DROP TABLE IF EXISTS workflow_approval;

DROP INDEX IF EXISTS idx_workflow_execution_log_instance;
DROP TABLE IF EXISTS workflow_execution_log;

DROP INDEX IF EXISTS idx_workflow_binding_lookup;
DROP TABLE IF EXISTS workflow_binding;

ALTER TABLE process_instance DROP COLUMN IF EXISTS error_message;
ALTER TABLE process_instance DROP COLUMN IF EXISTS completed_at;
ALTER TABLE process_instance DROP COLUMN IF EXISTS started_at;
ALTER TABLE process_instance DROP COLUMN IF EXISTS dag_state;

ALTER TABLE process_definition DROP COLUMN IF EXISTS dag_definition;
ALTER TABLE process_definition DROP COLUMN IF EXISTS trigger_event;
ALTER TABLE process_definition DROP COLUMN IF EXISTS version;
