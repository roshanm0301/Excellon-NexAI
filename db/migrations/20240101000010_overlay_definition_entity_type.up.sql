-- Add entity_type column if not already present (safe to run multiple times)
ALTER TABLE overlay_definition ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_overlay_tenant_entity ON overlay_definition (tenant_id, entity_type) WHERE deleted_at IS NULL;
