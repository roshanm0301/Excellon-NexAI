-- 20260601000001_rule_engine_v2.down.sql
-- Rollback: remove rule engine v2 tables and columns.

DROP TABLE IF EXISTS rule_execution_log;
DROP TABLE IF EXISTS rule_conflict_matrix;

ALTER TABLE rule_set DROP COLUMN IF EXISTS classifications;
ALTER TABLE rule_set DROP COLUMN IF EXISTS content_type;
ALTER TABLE rule_set DROP COLUMN IF EXISTS priority;
ALTER TABLE rule_set DROP COLUMN IF EXISTS hit_policy;
