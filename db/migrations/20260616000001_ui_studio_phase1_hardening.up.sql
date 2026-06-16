-- 20260616000001_ui_studio_phase1_hardening.up.sql
-- UI Studio Phase 1: stop-ship production hardening constraints.

ALTER TABLE artifact_header
    ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;

ALTER TABLE artifact_version
    ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_artifact_header_ui_view_surface_type'
    ) THEN
        ALTER TABLE artifact_header
            ADD CONSTRAINT chk_artifact_header_ui_view_surface_type
            CHECK (
                artifact_type <> 'ui_view'
                OR surface_type IN (
                    'standard_crud',
                    'advanced_crud',
                    'header_line',
                    'custom_page',
                    'dashboard',
                    'wizard',
                    'detail_page',
                    'split_view',
                    'kanban',
                    'calendar'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_artifact_header_ui_view_required_fields'
    ) THEN
        ALTER TABLE artifact_header
            ADD CONSTRAINT chk_artifact_header_ui_view_required_fields
            CHECK (
                artifact_type <> 'ui_view'
                OR (
                    surface_type IS NOT NULL
                    AND primary_entity IS NOT NULL
                    AND view_label IS NOT NULL
                )
            );
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_ui_view_code_scope_active
    ON artifact_header (tenant_id, primary_entity, surface_type, view_code)
    WHERE artifact_type = 'ui_view'
      AND view_code IS NOT NULL
      AND COALESCE(view_category, '') <> 'archived';

CREATE UNIQUE INDEX IF NOT EXISTS ux_artifact_version_artifact_version_no
    ON artifact_version (artifact_id, version_no);

CREATE UNIQUE INDEX IF NOT EXISTS ux_artifact_version_one_active
    ON artifact_version (artifact_id)
    WHERE is_active = true;

