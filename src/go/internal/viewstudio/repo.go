package viewstudio

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// ErrRevisionConflict is returned when a SaveDraft update encounters a
// concurrent modification — the caller's revision no longer matches the
// current revision stored in the database.
var ErrRevisionConflict = errors.New("viewstudio: revision conflict")

// Repo handles all database operations for the view studio.
type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

// ─── View CRUD ───────────────────────────────────────────────────────────────

func (r *Repo) CreateView(ctx context.Context, tenantID, userID string, req CreateViewRequest) (*View, error) {
	artifactID := idgen.NewV7()
	versionID := idgen.NewV7()
	now := time.Now().UTC()

	artifactName := generateArtifactName(req.PrimaryEntity, req.ViewCode, req.ViewLabel)

	payload := req.Payload
	if payload == nil {
		payload = json.RawMessage(`{"component_tree":{"component_key":"page_root","component_code":"page_root","children":[]}}`)
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Treat empty view_code as NULL so the partial unique index (WHERE view_code IS NOT NULL)
	// does not conflict across views that have no explicit code.
	var viewCodeParam *string
	if req.ViewCode != "" {
		viewCodeParam = &req.ViewCode
	}

	// Insert artifact_header
	_, err = tx.Exec(ctx, `
		INSERT INTO artifact_header (artifact_id, artifact_name, artifact_type, tenant_id, node_id,
		                             surface_type, primary_entity, view_code, view_label, view_category,
		                             created_at, updated_at, created_by)
		VALUES ($1, $2, 'ui_view', $3, NULL, $4, $5, $6, $7, $8, $9, $9, $10)`,
		artifactID, artifactName, tenantID,
		req.SurfaceType, req.PrimaryEntity, viewCodeParam, req.ViewLabel, req.ViewCategory,
		now, userID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: insert header: %w", err)
	}

	// Insert initial draft version
	_, err = tx.Exec(ctx, `
		INSERT INTO artifact_version (version_id, artifact_id, version_no, payload, is_active, is_draft, created_at, created_by)
		VALUES ($1, $2, 1, $3, false, true, $4, $5)`,
		versionID, artifactID, payload, now, userID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: insert version: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("viewstudio: commit: %w", err)
	}

	return &View{
		ArtifactID:      artifactID,
		ArtifactName:    artifactName,
		ArtifactType:    "ui_view",
		TenantID:        tenantID,
		SurfaceType:     req.SurfaceType,
		PrimaryEntity:   req.PrimaryEntity,
		ViewCode:        req.ViewCode,
		ViewLabel:       req.ViewLabel,
		ViewCategory:    req.ViewCategory,
		CreatedAt:       now,
		UpdatedAt:       now,
		CreatedBy:       userID,
		Revision:        1,
		LatestVersionID: versionID,
		LatestVersionNo: 1,
		IsDraft:         true,
		IsActive:        false,
	}, nil
}

func (r *Repo) ListViews(ctx context.Context, tenantID, surface, entity, status string, limit, offset int) ([]View, int, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	baseWhere := `WHERE h.tenant_id = $1 AND h.artifact_type = 'ui_view'`
	args := []interface{}{tenantID}
	argN := 2

	if surface != "" {
		baseWhere += fmt.Sprintf(` AND h.surface_type = $%d`, argN)
		args = append(args, surface)
		argN++
	}
	if entity != "" {
		baseWhere += fmt.Sprintf(` AND h.primary_entity = $%d`, argN)
		args = append(args, entity)
		argN++
	}
	if status == "published" {
		baseWhere += ` AND EXISTS (SELECT 1 FROM artifact_version v WHERE v.artifact_id = h.artifact_id AND v.is_active = true)`
	} else if status == "draft" {
		baseWhere += ` AND NOT EXISTS (SELECT 1 FROM artifact_version v WHERE v.artifact_id = h.artifact_id AND v.is_active = true)`
	}

	// Count
	var total int
	countQuery := `SELECT COUNT(*) FROM artifact_header h ` + baseWhere
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("viewstudio: count views: %w", err)
	}

	// Fetch with latest version info
	query := fmt.Sprintf(`
		SELECT h.artifact_id, h.artifact_name, h.artifact_type, h.tenant_id, COALESCE(h.node_id,''),
		       COALESCE(h.surface_type,''), COALESCE(h.primary_entity,''), COALESCE(h.view_code,''),
		       COALESCE(h.view_label,''), COALESCE(h.view_category,''),
		       h.created_at, h.updated_at, h.created_by, COALESCE(h.revision, 1),
		       COALESCE(v.version_id::text, ''), COALESCE(v.version_no, 0), COALESCE(v.is_draft, true), COALESCE(v.is_active, false)
		FROM artifact_header h
		LEFT JOIN LATERAL (
			SELECT version_id, version_no, is_draft, is_active 
			FROM artifact_version WHERE artifact_id = h.artifact_id 
			ORDER BY version_no DESC LIMIT 1
		) v ON true
		%s
		ORDER BY h.updated_at DESC
		LIMIT $%d OFFSET $%d`, baseWhere, argN, argN+1)
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("viewstudio: list views: %w", err)
	}
	defer rows.Close()

	var views []View
	for rows.Next() {
		var v View
		if err := rows.Scan(
			&v.ArtifactID, &v.ArtifactName, &v.ArtifactType, &v.TenantID, &v.NodeID,
			&v.SurfaceType, &v.PrimaryEntity, &v.ViewCode,
			&v.ViewLabel, &v.ViewCategory,
			&v.CreatedAt, &v.UpdatedAt, &v.CreatedBy, &v.Revision,
			&v.LatestVersionID, &v.LatestVersionNo, &v.IsDraft, &v.IsActive,
		); err != nil {
			return nil, 0, fmt.Errorf("viewstudio: scan view: %w", err)
		}
		views = append(views, v)
	}
	if views == nil {
		views = []View{}
	}
	return views, total, nil
}

func (r *Repo) GetView(ctx context.Context, tenantID, artifactID string) (*View, error) {
	var v View
	err := r.pool.QueryRow(ctx, `
		SELECT h.artifact_id, h.artifact_name, h.artifact_type, h.tenant_id, COALESCE(h.node_id,''),
		       COALESCE(h.surface_type,''), COALESCE(h.primary_entity,''), COALESCE(h.view_code,''),
		       COALESCE(h.view_label,''), COALESCE(h.view_category,''),
		       h.created_at, h.updated_at, h.created_by, COALESCE(h.revision, 1)
		FROM artifact_header h
		WHERE h.artifact_id = $1 AND h.tenant_id = $2 AND h.artifact_type = 'ui_view'`,
		artifactID, tenantID,
	).Scan(
		&v.ArtifactID, &v.ArtifactName, &v.ArtifactType, &v.TenantID, &v.NodeID,
		&v.SurfaceType, &v.PrimaryEntity, &v.ViewCode,
		&v.ViewLabel, &v.ViewCategory,
		&v.CreatedAt, &v.UpdatedAt, &v.CreatedBy, &v.Revision,
	)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: get view: %w", err)
	}
	return &v, nil
}

func (r *Repo) GetViewWithPayload(ctx context.Context, tenantID, artifactID string) (*View, *ViewVersion, error) {
	v, err := r.GetView(ctx, tenantID, artifactID)
	if err != nil {
		return nil, nil, err
	}

	// Get latest version
	var ver ViewVersion
	err = r.pool.QueryRow(ctx, `
		SELECT version_id, artifact_id, version_no, payload, is_active, is_draft, created_at, created_by, COALESCE(revision, 1),
		       published_at, COALESCE(published_by, '')
		FROM artifact_version
		WHERE artifact_id = $1
		ORDER BY version_no DESC
		LIMIT 1`, artifactID).Scan(
		&ver.VersionID, &ver.ArtifactID, &ver.VersionNo, &ver.Payload,
		&ver.IsActive, &ver.IsDraft, &ver.CreatedAt, &ver.CreatedBy,
		&ver.Revision,
		&ver.PublishedAt, &ver.PublishedBy,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("viewstudio: get latest version: %w", err)
	}
	return v, &ver, nil
}

// ─── Draft save ──────────────────────────────────────────────────────────────

// SaveDraft persists a draft payload. clientRevision is the revision the caller
// last observed; if the stored revision has advanced (concurrent edit), it
// returns ErrRevisionConflict instead of overwriting.
// Pass clientRevision = 0 to skip the optimistic-concurrency check (e.g. first save).
func (r *Repo) SaveDraft(ctx context.Context, tenantID, artifactID, userID string, payload json.RawMessage, clientRevision int64) (*ViewVersion, error) {
	// Check ownership
	var ownerTenant string
	err := r.pool.QueryRow(ctx, `SELECT tenant_id FROM artifact_header WHERE artifact_id = $1 AND artifact_type = 'ui_view'`, artifactID).Scan(&ownerTenant)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: view not found: %w", err)
	}
	if ownerTenant != tenantID {
		return nil, fmt.Errorf("viewstudio: tenant mismatch")
	}

	// Get latest version_no
	var latestNo int
	_ = r.pool.QueryRow(ctx, `SELECT COALESCE(MAX(version_no), 0) FROM artifact_version WHERE artifact_id = $1`, artifactID).Scan(&latestNo)

	// Check if latest is a draft — if so, update in place. If not, create new draft.
	var existingDraftID string
	err = r.pool.QueryRow(ctx, `
		SELECT version_id FROM artifact_version
		WHERE artifact_id = $1 AND version_no = $2 AND is_draft = true AND is_active = false`,
		artifactID, latestNo).Scan(&existingDraftID)

	now := time.Now().UTC()

	if err == nil && existingDraftID != "" {
		// Optimistic concurrency: only update if revision matches (or caller passes 0 to bypass).
		var revision int64
		if clientRevision > 0 {
			err = r.pool.QueryRow(ctx, `
				UPDATE artifact_version
				SET payload = $1, created_at = $2, created_by = $3, revision = COALESCE(revision, 1) + 1
				WHERE version_id = $4 AND COALESCE(revision, 1) = $5
				RETURNING revision`,
				payload, now, userID, existingDraftID, clientRevision).Scan(&revision)
		} else {
			err = r.pool.QueryRow(ctx, `
				UPDATE artifact_version
				SET payload = $1, created_at = $2, created_by = $3, revision = COALESCE(revision, 1) + 1
				WHERE version_id = $4
				RETURNING revision`,
				payload, now, userID, existingDraftID).Scan(&revision)
		}
		if err != nil {
			// pgx returns pgx.ErrNoRows when WHERE matches zero rows (revision mismatch)
			return nil, ErrRevisionConflict
		}
		// Update header timestamp
		_, _ = r.pool.Exec(ctx, `UPDATE artifact_header SET updated_at = $1, revision = COALESCE(revision, 1) + 1 WHERE artifact_id = $2`, now, artifactID)

		return &ViewVersion{
			VersionID:  existingDraftID,
			ArtifactID: artifactID,
			VersionNo:  latestNo,
			Payload:    payload,
			IsActive:   false,
			IsDraft:    true,
			CreatedAt:  now,
			CreatedBy:  userID,
			Revision:   revision,
		}, nil
	}

	// Create new draft version
	newVersionNo := latestNo + 1
	versionID := idgen.NewV7()
	_, err = r.pool.Exec(ctx, `
		INSERT INTO artifact_version (version_id, artifact_id, version_no, payload, is_active, is_draft, created_at, created_by, revision)
		VALUES ($1, $2, $3, $4, false, true, $5, $6, 1)`,
		versionID, artifactID, newVersionNo, payload, now, userID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: create draft: %w", err)
	}
	_, _ = r.pool.Exec(ctx, `UPDATE artifact_header SET updated_at = $1, revision = COALESCE(revision, 1) + 1 WHERE artifact_id = $2`, now, artifactID)

	return &ViewVersion{
		VersionID:  versionID,
		ArtifactID: artifactID,
		VersionNo:  newVersionNo,
		Payload:    payload,
		IsActive:   false,
		IsDraft:    true,
		CreatedAt:  now,
		CreatedBy:  userID,
		Revision:   1,
	}, nil
}

// ─── Publish ─────────────────────────────────────────────────────────────────

func (r *Repo) Publish(ctx context.Context, tenantID, artifactID, userID, changelog string) (*ViewVersion, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Verify ownership
	var ownerTenant string
	err = tx.QueryRow(ctx, `SELECT tenant_id FROM artifact_header WHERE artifact_id = $1 AND artifact_type = 'ui_view'`, artifactID).Scan(&ownerTenant)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: view not found: %w", err)
	}
	if ownerTenant != tenantID {
		return nil, fmt.Errorf("viewstudio: tenant mismatch")
	}

	// Get latest draft
	var ver ViewVersion
	err = tx.QueryRow(ctx, `
		SELECT version_id, artifact_id, version_no, payload, is_draft, COALESCE(revision, 1)
		FROM artifact_version
		WHERE artifact_id = $1
		ORDER BY version_no DESC
		LIMIT 1`, artifactID).Scan(&ver.VersionID, &ver.ArtifactID, &ver.VersionNo, &ver.Payload, &ver.IsDraft, &ver.Revision)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: no version found: %w", err)
	}
	if !ver.IsDraft {
		return nil, fmt.Errorf("viewstudio: latest version is already published, save a new draft first")
	}

	now := time.Now().UTC()

	// Deactivate any currently active version
	_, err = tx.Exec(ctx, `
		UPDATE artifact_version SET is_active = false 
		WHERE artifact_id = $1 AND is_active = true`, artifactID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: deactivate previous: %w", err)
	}

	// Activate the draft
	_, err = tx.Exec(ctx, `
		UPDATE artifact_version 
		SET is_active = true, is_draft = false, published_at = $1, published_by = $2
		WHERE version_id = $3`,
		now, userID, ver.VersionID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: activate version: %w", err)
	}

	// Write publish log
	logID := idgen.NewV4()
	_, err = tx.Exec(ctx, `
		INSERT INTO ui_view_publish_log (log_id, artifact_id, version_id, action, performed_by, performed_at, changelog, tenant_id)
		VALUES ($1, $2, $3, 'published', $4, $5, $6, $7)`,
		logID, artifactID, ver.VersionID, userID, now, changelog, tenantID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: write publish log: %w", err)
	}

	// Update header timestamp
	_, _ = tx.Exec(ctx, `UPDATE artifact_header SET updated_at = $1, revision = COALESCE(revision, 1) + 1 WHERE artifact_id = $2`, now, artifactID)

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("viewstudio: commit publish: %w", err)
	}

	ver.IsActive = true
	ver.IsDraft = false
	ver.PublishedAt = &now
	ver.PublishedBy = userID
	return &ver, nil
}

// ─── Rollback ────────────────────────────────────────────────────────────────

func (r *Repo) Rollback(ctx context.Context, tenantID, artifactID, targetVersionID, userID, changelog string) (*ViewVersion, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Verify ownership and target version belongs to this artifact
	var ownerTenant string
	err = tx.QueryRow(ctx, `SELECT tenant_id FROM artifact_header WHERE artifact_id = $1 AND artifact_type = 'ui_view'`, artifactID).Scan(&ownerTenant)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: view not found: %w", err)
	}
	if ownerTenant != tenantID {
		return nil, fmt.Errorf("viewstudio: tenant mismatch")
	}

	var ver ViewVersion
	err = tx.QueryRow(ctx, `
		SELECT version_id, artifact_id, version_no, payload, COALESCE(revision, 1)
		FROM artifact_version
		WHERE version_id = $1 AND artifact_id = $2`, targetVersionID, artifactID).Scan(
		&ver.VersionID, &ver.ArtifactID, &ver.VersionNo, &ver.Payload, &ver.Revision)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: target version not found: %w", err)
	}

	now := time.Now().UTC()

	// Deactivate current active
	_, err = tx.Exec(ctx, `
		UPDATE artifact_version SET is_active = false 
		WHERE artifact_id = $1 AND is_active = true`, artifactID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: deactivate current: %w", err)
	}

	// Re-activate target
	_, err = tx.Exec(ctx, `
		UPDATE artifact_version 
		SET is_active = true, is_draft = false, published_at = $1, published_by = $2
		WHERE version_id = $3`,
		now, userID, targetVersionID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: re-activate target: %w", err)
	}

	// Write rollback log
	logID := idgen.NewV4()
	_, err = tx.Exec(ctx, `
		INSERT INTO ui_view_publish_log (log_id, artifact_id, version_id, action, performed_by, performed_at, changelog, tenant_id)
		VALUES ($1, $2, $3, 'rolled_back', $4, $5, $6, $7)`,
		logID, artifactID, targetVersionID, userID, now, changelog, tenantID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: write rollback log: %w", err)
	}

	_, _ = tx.Exec(ctx, `UPDATE artifact_header SET updated_at = $1, revision = COALESCE(revision, 1) + 1 WHERE artifact_id = $2`, now, artifactID)

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("viewstudio: commit rollback: %w", err)
	}

	ver.IsActive = true
	ver.IsDraft = false
	ver.PublishedAt = &now
	ver.PublishedBy = userID
	return &ver, nil
}

// ─── Runtime: Load Published View ────────────────────────────────────────────

func (r *Repo) GetPublishedView(ctx context.Context, tenantID, artifactID string) (*ViewVersion, error) {
	var ver ViewVersion
	err := r.pool.QueryRow(ctx, `
		SELECT v.version_id, v.artifact_id, v.version_no, v.payload, v.is_active, v.is_draft,
		       v.created_at, v.created_by, COALESCE(v.revision, 1), v.published_at, COALESCE(v.published_by, '')
		FROM artifact_version v
		JOIN artifact_header h ON h.artifact_id = v.artifact_id
		WHERE v.artifact_id = $1 AND h.tenant_id = $2 AND v.is_active = true AND h.artifact_type = 'ui_view'`,
		artifactID, tenantID).Scan(
		&ver.VersionID, &ver.ArtifactID, &ver.VersionNo, &ver.Payload,
		&ver.IsActive, &ver.IsDraft, &ver.CreatedAt, &ver.CreatedBy,
		&ver.Revision,
		&ver.PublishedAt, &ver.PublishedBy,
	)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: no published version: %w", err)
	}
	return &ver, nil
}

func (r *Repo) GetPublishedViewByCode(ctx context.Context, tenantID, viewCode, primaryEntity, surface string) (*ViewVersion, error) {
	var ver ViewVersion
	err := r.pool.QueryRow(ctx, `
		SELECT v.version_id, v.artifact_id, v.version_no, v.payload, v.is_active, v.is_draft,
		       v.created_at, v.created_by, COALESCE(v.revision, 1), v.published_at, COALESCE(v.published_by, '')
		FROM artifact_version v
		JOIN artifact_header h ON h.artifact_id = v.artifact_id
		WHERE h.view_code = $1 AND h.tenant_id = $2 AND h.primary_entity = $3 AND h.surface_type = $4
		  AND v.is_active = true AND h.artifact_type = 'ui_view'`,
		viewCode, tenantID, primaryEntity, surface).Scan(
		&ver.VersionID, &ver.ArtifactID, &ver.VersionNo, &ver.Payload,
		&ver.IsActive, &ver.IsDraft, &ver.CreatedAt, &ver.CreatedBy,
		&ver.Revision,
		&ver.PublishedAt, &ver.PublishedBy,
	)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: no published version for view_code %q: %w", viewCode, err)
	}
	return &ver, nil
}

// ─── Versions ────────────────────────────────────────────────────────────────

func (r *Repo) ListVersions(ctx context.Context, tenantID, artifactID string) ([]ViewVersion, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT v.version_id, v.artifact_id, v.version_no, v.payload, v.is_active, v.is_draft,
		       v.created_at, v.created_by, COALESCE(v.revision, 1), v.published_at, COALESCE(v.published_by, '')
		FROM artifact_version v
		JOIN artifact_header h ON h.artifact_id = v.artifact_id
		WHERE v.artifact_id = $1 AND h.tenant_id = $2 AND h.artifact_type = 'ui_view'
		ORDER BY v.version_no DESC`, artifactID, tenantID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: list versions: %w", err)
	}
	defer rows.Close()

	var versions []ViewVersion
	for rows.Next() {
		var ver ViewVersion
		if err := rows.Scan(
			&ver.VersionID, &ver.ArtifactID, &ver.VersionNo, &ver.Payload,
			&ver.IsActive, &ver.IsDraft, &ver.CreatedAt, &ver.CreatedBy,
			&ver.Revision,
			&ver.PublishedAt, &ver.PublishedBy,
		); err != nil {
			return nil, fmt.Errorf("viewstudio: scan version: %w", err)
		}
		versions = append(versions, ver)
	}
	if versions == nil {
		versions = []ViewVersion{}
	}
	return versions, nil
}

// ─── Component Registry ──────────────────────────────────────────────────────

func (r *Repo) ListComponents(ctx context.Context, surface, category string) ([]ComponentEntry, error) {
	query := `SELECT component_code, component_name, category, version, source, plugin_id,
	                 supported_surfaces, supported_bindings, is_container, allowed_parents, allowed_children,
	                 config_schema, default_props, event_support, permission_behavior,
	                 runtime_renderer, designer_panel, preview_support, validation_rules,
	                 deprecated_at, successor_code, is_active, created_at
	          FROM ui_component_registry WHERE is_active = true`

	var args []interface{}
	argN := 1

	if surface != "" {
		query += fmt.Sprintf(` AND (supported_surfaces @> $%d::jsonb OR supported_surfaces @> '["all"]'::jsonb)`, argN)
		args = append(args, fmt.Sprintf(`["%s"]`, surface))
		argN++
	}
	if category != "" {
		query += fmt.Sprintf(` AND category = $%d`, argN)
		args = append(args, category)
		argN++
	}

	query += ` ORDER BY category, component_name`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: list components: %w", err)
	}
	defer rows.Close()

	var entries []ComponentEntry
	for rows.Next() {
		var e ComponentEntry
		if err := rows.Scan(
			&e.ComponentCode, &e.ComponentName, &e.Category, &e.Version, &e.Source, &e.PluginID,
			&e.SupportedSurfaces, &e.SupportedBindings, &e.IsContainer, &e.AllowedParents, &e.AllowedChildren,
			&e.ConfigSchema, &e.DefaultProps, &e.EventSupport, &e.PermissionBehavior,
			&e.RuntimeRenderer, &e.DesignerPanel, &e.PreviewSupport, &e.ValidationRules,
			&e.DeprecatedAt, &e.SuccessorCode, &e.IsActive, &e.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("viewstudio: scan component: %w", err)
		}
		entries = append(entries, e)
	}
	if entries == nil {
		entries = []ComponentEntry{}
	}
	return entries, nil
}

func (r *Repo) GetComponent(ctx context.Context, code string) (*ComponentEntry, error) {
	var e ComponentEntry
	err := r.pool.QueryRow(ctx, `
		SELECT component_code, component_name, category, version, source, plugin_id,
		       supported_surfaces, supported_bindings, is_container, allowed_parents, allowed_children,
		       config_schema, default_props, event_support, permission_behavior,
		       runtime_renderer, designer_panel, preview_support, validation_rules,
		       deprecated_at, successor_code, is_active, created_at
		FROM ui_component_registry WHERE component_code = $1`, code).Scan(
		&e.ComponentCode, &e.ComponentName, &e.Category, &e.Version, &e.Source, &e.PluginID,
		&e.SupportedSurfaces, &e.SupportedBindings, &e.IsContainer, &e.AllowedParents, &e.AllowedChildren,
		&e.ConfigSchema, &e.DefaultProps, &e.EventSupport, &e.PermissionBehavior,
		&e.RuntimeRenderer, &e.DesignerPanel, &e.PreviewSupport, &e.ValidationRules,
		&e.DeprecatedAt, &e.SuccessorCode, &e.IsActive, &e.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: component %q not found: %w", code, err)
	}
	return &e, nil
}

// ─── Plugins ─────────────────────────────────────────────────────────────────

func (r *Repo) ListPlugins(ctx context.Context, tenantID string) ([]Plugin, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT plugin_id, plugin_name, version, COALESCE(author,''), 
		       COALESCE(runtime_bundle_url,''), COALESCE(designer_bundle_url,''),
		       is_active, tenant_id, installed_at
		FROM ui_component_plugin WHERE tenant_id = $1 AND is_active = true
		ORDER BY installed_at DESC`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: list plugins: %w", err)
	}
	defer rows.Close()

	var plugins []Plugin
	for rows.Next() {
		var p Plugin
		if err := rows.Scan(&p.PluginID, &p.PluginName, &p.Version, &p.Author,
			&p.RuntimeBundleURL, &p.DesignerBundleURL, &p.IsActive, &p.TenantID, &p.InstalledAt); err != nil {
			return nil, fmt.Errorf("viewstudio: scan plugin: %w", err)
		}
		plugins = append(plugins, p)
	}
	if plugins == nil {
		plugins = []Plugin{}
	}
	return plugins, nil
}

func (r *Repo) RegisterPlugin(ctx context.Context, tenantID string, req RegisterPluginRequest) (*Plugin, error) {
	pluginID := idgen.NewV4()
	now := time.Now().UTC()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO ui_component_plugin (plugin_id, plugin_name, version, author, runtime_bundle_url, designer_bundle_url, is_active, tenant_id, installed_at)
		VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)`,
		pluginID, req.PluginName, req.Version, req.Author, req.RuntimeBundleURL, req.DesignerBundleURL, tenantID, now)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: register plugin: %w", err)
	}
	return &Plugin{
		PluginID:          pluginID,
		PluginName:        req.PluginName,
		Version:           req.Version,
		Author:            req.Author,
		RuntimeBundleURL:  req.RuntimeBundleURL,
		DesignerBundleURL: req.DesignerBundleURL,
		IsActive:          true,
		TenantID:          tenantID,
		InstalledAt:       now,
	}, nil
}

func (r *Repo) RemovePlugin(ctx context.Context, tenantID, pluginID string) error {
	tag, err := r.pool.Exec(ctx, `
		UPDATE ui_component_plugin SET is_active = false WHERE plugin_id = $1 AND tenant_id = $2`,
		pluginID, tenantID)
	if err != nil {
		return fmt.Errorf("viewstudio: remove plugin: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("viewstudio: plugin not found")
	}
	return nil
}

// ─── Archive ─────────────────────────────────────────────────────────────────

func (r *Repo) ArchiveView(ctx context.Context, tenantID, artifactID, userID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("viewstudio: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	var ownerTenant string
	err = tx.QueryRow(ctx, `SELECT tenant_id FROM artifact_header WHERE artifact_id = $1 AND artifact_type = 'ui_view'`, artifactID).Scan(&ownerTenant)
	if err != nil {
		return fmt.Errorf("viewstudio: view not found: %w", err)
	}
	if ownerTenant != tenantID {
		return fmt.Errorf("viewstudio: tenant mismatch")
	}

	now := time.Now().UTC()

	// Deactivate all versions
	_, _ = tx.Exec(ctx, `UPDATE artifact_version SET is_active = false WHERE artifact_id = $1`, artifactID)

	// Update header category to archived
	_, _ = tx.Exec(ctx, `UPDATE artifact_header SET view_category = 'archived', updated_at = $1, revision = COALESCE(revision, 1) + 1 WHERE artifact_id = $2`, now, artifactID)

	// Log
	logID := idgen.NewV4()
	// Get any version for the log entry
	var anyVersionID string
	_ = tx.QueryRow(ctx, `SELECT version_id FROM artifact_version WHERE artifact_id = $1 ORDER BY version_no DESC LIMIT 1`, artifactID).Scan(&anyVersionID)
	if anyVersionID != "" {
		_, _ = tx.Exec(ctx, `
			INSERT INTO ui_view_publish_log (log_id, artifact_id, version_id, action, performed_by, performed_at, tenant_id)
			VALUES ($1, $2, $3, 'archived', $4, $5, $6)`,
			logID, artifactID, anyVersionID, userID, now, tenantID)
	}

	return tx.Commit(ctx)
}

// ─── Entity Schema (M3.2) ────────────────────────────────────────────────────

// ListEntityTypes returns distinct entity types from compiled_artifact for the tenant.
func (r *Repo) ListEntityTypes(ctx context.Context, tenantID string) ([]EntityTypeSummary, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT DISTINCT artifact_key,
		       COALESCE(
		           (payload -> 'settings' ->> 'display_name'),
		           artifact_key
		       ) AS display_name
		FROM compiled_artifact
		WHERE tenant_id = $1
		  AND artifact_type = 'entity_schema'
		  AND status = 'active'
		ORDER BY artifact_key`, tenantID)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: list entity types: %w", err)
	}
	defer rows.Close()

	var items []EntityTypeSummary
	for rows.Next() {
		var e EntityTypeSummary
		if err := rows.Scan(&e.EntityType, &e.DisplayName); err != nil {
			return nil, fmt.Errorf("viewstudio: scan entity type: %w", err)
		}
		items = append(items, e)
	}
	if items == nil {
		items = []EntityTypeSummary{}
	}
	return items, nil
}

// GetEntityFields reads field definitions from the compiled_artifact payload for the given entity type.
func (r *Repo) GetEntityFields(ctx context.Context, tenantID, entityType string) ([]EntityFieldDef, error) {
	var payloadJSON []byte
	err := r.pool.QueryRow(ctx, `
		SELECT payload
		FROM compiled_artifact
		WHERE tenant_id = $1
		  AND artifact_key = $2
		  AND artifact_type = 'entity_schema'
		  AND status = 'active'
		ORDER BY created_at DESC
		LIMIT 1`, tenantID, entityType).Scan(&payloadJSON)
	if err != nil {
		return nil, fmt.Errorf("viewstudio: entity type %q not found: %w", entityType, err)
	}

	// Decode the compiled schema payload
	var schema struct {
		Fields        []compiledFieldRaw `json:"fields"`
		Relationships []struct {
			Key        string `json:"key"`
			Label      string `json:"label"`
			TargetType string `json:"target_type"`
		} `json:"relationships"`
	}
	if err := json.Unmarshal(payloadJSON, &schema); err != nil {
		return nil, fmt.Errorf("viewstudio: parse compiled schema: %w", err)
	}

	var items []EntityFieldDef
	for _, f := range schema.Fields {
		label := f.Label
		if label == "" {
			label = f.Key
		}
		items = append(items, EntityFieldDef{
			FieldKey:  f.Key,
			Label:     label,
			FieldType: f.CompiledType,
			Required:  f.Required,
			ReadOnly:  f.Expression != "",
		})
	}
	for _, rel := range schema.Relationships {
		label := rel.Label
		if label == "" {
			label = rel.Key
		}
		items = append(items, EntityFieldDef{
			FieldKey:      rel.Key,
			Label:         label,
			FieldType:     "relation",
			IsRelation:    true,
			RelatedEntity: rel.TargetType,
		})
	}
	if items == nil {
		items = []EntityFieldDef{}
	}
	return items, nil
}

// compiledFieldRaw is the minimal shape of a compiled field we need here.
type compiledFieldRaw struct {
	Key          string `json:"key"`
	Label        string `json:"label"`
	CompiledType string `json:"compiled_type"`
	Required     bool   `json:"required"`
	Expression   string `json:"expression,omitempty"`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func generateArtifactName(entity, viewCode, label string) string {
	if viewCode != "" {
		return fmt.Sprintf("ui_view.%s.%s", entity, viewCode)
	}
	if label != "" {
		return fmt.Sprintf("ui_view.%s.%s", entity, label)
	}
	return fmt.Sprintf("ui_view.%s", entity)
}
