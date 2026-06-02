-- 20260602000001_ui_studio_foundation.down.sql
-- Rollback UI Studio Phase 1: Metadata Foundation

DROP INDEX IF EXISTS idx_ui_component_plugin_tenant;
DROP INDEX IF EXISTS idx_ui_datasource_override_artifact;
DROP INDEX IF EXISTS idx_ui_view_variant_artifact;
DROP INDEX IF EXISTS idx_ui_view_event_artifact;
DROP INDEX IF EXISTS idx_ui_view_publish_log_artifact;
DROP INDEX IF EXISTS idx_artifact_header_primary_entity;
DROP INDEX IF EXISTS idx_artifact_header_view_code;
DROP INDEX IF EXISTS idx_artifact_header_surface_type;

DROP TABLE IF EXISTS ui_view_variant CASCADE;
DROP TABLE IF EXISTS ui_datasource_override CASCADE;
DROP TABLE IF EXISTS ui_view_event_definition CASCADE;
DROP TABLE IF EXISTS ui_view_publish_log CASCADE;
DROP TABLE IF EXISTS ui_component_plugin CASCADE;
DROP TABLE IF EXISTS ui_component_registry CASCADE;

ALTER TABLE artifact_header DROP COLUMN IF EXISTS surface_type;
ALTER TABLE artifact_header DROP COLUMN IF EXISTS primary_entity;
ALTER TABLE artifact_header DROP COLUMN IF EXISTS view_code;
ALTER TABLE artifact_header DROP COLUMN IF EXISTS view_label;
ALTER TABLE artifact_header DROP COLUMN IF EXISTS view_category;
