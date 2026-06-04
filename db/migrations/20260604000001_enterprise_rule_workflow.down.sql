ALTER TABLE rule_set DROP CONSTRAINT IF EXISTS uq_rule_set_tenant_key;
ALTER TABLE rule_set DROP CONSTRAINT IF EXISTS rule_set_content_type_check;

ALTER TABLE rule_set
  ADD CONSTRAINT rule_set_content_type_check
  CHECK (content_type IN ('condition_tree', 'decision_table'));

DROP INDEX IF EXISTS idx_rule_set_category;

ALTER TABLE rule_set
  DROP COLUMN IF EXISTS version_status,
  DROP COLUMN IF EXISTS rule_category,
  DROP COLUMN IF EXISTS rule_set_key;

