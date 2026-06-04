-- Enterprise rule/workflow slice: stable rule keys, enterprise categories,
-- decision graph content, and category-aware conflict defaults.

ALTER TABLE rule_set
  ADD COLUMN IF NOT EXISTS rule_set_key TEXT,
  ADD COLUMN IF NOT EXISTS rule_category TEXT NOT NULL DEFAULT 'Validation',
  ADD COLUMN IF NOT EXISTS version_status TEXT NOT NULL DEFAULT 'Draft';

UPDATE rule_set
SET rule_set_key = COALESCE(rule_set_key, id::text)
WHERE rule_set_key IS NULL OR rule_set_key = '';

ALTER TABLE rule_set
  ALTER COLUMN rule_set_key SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'rule_set'::regclass
      AND conname = 'rule_set_content_type_check'
  ) THEN
    ALTER TABLE rule_set DROP CONSTRAINT rule_set_content_type_check;
  END IF;
END $$;

ALTER TABLE rule_set
  ADD CONSTRAINT rule_set_content_type_check
  CHECK (content_type IN ('condition_tree', 'decision_table', 'decision_graph'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'rule_set'::regclass
      AND conname = 'uq_rule_set_tenant_key'
  ) THEN
    ALTER TABLE rule_set ADD CONSTRAINT uq_rule_set_tenant_key UNIQUE (tenant_id, rule_set_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rule_set_category
  ON rule_set (tenant_id, rule_category, entity_type)
  WHERE deleted_at IS NULL;

