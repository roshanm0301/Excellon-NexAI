-- 20260616000001_ui_studio_phase1_hardening.down.sql

DROP INDEX IF EXISTS ux_artifact_version_one_active;
DROP INDEX IF EXISTS ux_artifact_version_artifact_version_no;
DROP INDEX IF EXISTS ux_ui_view_code_scope_active;

ALTER TABLE artifact_header
    DROP CONSTRAINT IF EXISTS chk_artifact_header_ui_view_required_fields,
    DROP CONSTRAINT IF EXISTS chk_artifact_header_ui_view_surface_type;

ALTER TABLE artifact_version
    DROP COLUMN IF EXISTS revision;

ALTER TABLE artifact_header
    DROP COLUMN IF EXISTS revision;

