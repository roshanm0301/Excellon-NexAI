package admin

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// ArtifactRepo handles CRUD for artifact_header + artifact_version.
type ArtifactRepo struct {
	pool *db.Pool
}

func NewArtifactRepo(pool *db.Pool) *ArtifactRepo {
	return &ArtifactRepo{pool: pool}
}

// Create inserts an artifact_header (upsert) and a new artifact_version draft.
func (r *ArtifactRepo) Create(ctx context.Context, tenantID, artifactName, artifactType, nodeID, createdBy string, payload []byte) (*ArtifactVersion, error) {
	if payload == nil {
		payload = []byte(`{"fields":[],"sections":[],"relationships":[]}`)
	}

	headerID := idgen.NewV4()

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("artifact create tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Upsert header
	var actualHeaderID string
	err = tx.QueryRow(ctx, `
		INSERT INTO artifact_header (artifact_id, artifact_name, artifact_type, tenant_id, node_id, created_by)
		VALUES ($1, $2, $3, $4, NULLIF($5,''), $6)
		ON CONFLICT (artifact_name, artifact_type, tenant_id, node_id)
		DO UPDATE SET updated_at = NOW()
		RETURNING artifact_id`,
		headerID, artifactName, artifactType, tenantID, nodeID, createdBy,
	).Scan(&actualHeaderID)
	if err != nil {
		return nil, fmt.Errorf("artifact header upsert: %w", err)
	}

	// Get next version_no
	var nextVersionNo int
	err = tx.QueryRow(ctx,
		`SELECT COALESCE(MAX(version_no), 0) + 1 FROM artifact_version WHERE artifact_id = $1`,
		actualHeaderID,
	).Scan(&nextVersionNo)
	if err != nil {
		return nil, fmt.Errorf("artifact version_no: %w", err)
	}

	// Insert version
	av := &ArtifactVersion{
		ArtifactID:   actualHeaderID,
		ArtifactName: artifactName,
		ArtifactType: artifactType,
		TenantID:     tenantID,
		NodeID:       nodeID,
	}
	err = tx.QueryRow(ctx, `
		INSERT INTO artifact_version (artifact_id, version_no, payload, is_active, is_draft, created_by)
		VALUES ($1, $2, $3, FALSE, TRUE, $4)
		RETURNING version_id, artifact_id, version_no, payload, is_active, is_draft, created_by, created_at`,
		actualHeaderID, nextVersionNo, payload, createdBy,
	).Scan(&av.VersionID, &av.ArtifactID, &av.VersionNo, &av.Payload, &av.IsActive, &av.IsDraft, &av.CreatedBy, &av.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("artifact version insert: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("artifact create commit: %w", err)
	}
	return av, nil
}

// GetByID loads an artifact_version joined with its header.
func (r *ArtifactRepo) GetByID(ctx context.Context, tenantID, versionID string) (*ArtifactVersion, error) {
	const q = `
		SELECT av.version_id, av.artifact_id, av.version_no, av.payload, av.is_active, av.is_draft,
		       av.created_by, av.created_at, av.published_at, av.published_by,
		       ah.artifact_name, ah.artifact_type, ah.tenant_id, COALESCE(ah.node_id,'')
		FROM artifact_version av
		JOIN artifact_header ah ON ah.artifact_id = av.artifact_id
		WHERE av.version_id = $1 AND ah.tenant_id = $2`
	av := &ArtifactVersion{}
	err := r.pool.QueryRow(ctx, q, versionID, tenantID).Scan(
		&av.VersionID, &av.ArtifactID, &av.VersionNo, &av.Payload, &av.IsActive, &av.IsDraft,
		&av.CreatedBy, &av.CreatedAt, &av.PublishedAt, &av.PublishedBy,
		&av.ArtifactName, &av.ArtifactType, &av.TenantID, &av.NodeID,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("artifact %s: not found", versionID)
	}
	return av, err
}

// List returns active (published) versions per artifact matching the filter.
func (r *ArtifactRepo) List(ctx context.Context, tenantID, artifactType string, limit, offset int) ([]ArtifactVersion, int, error) {
	args := []any{tenantID}
	where := "ah.tenant_id = $1"
	n := 2
	if artifactType != "" {
		where += fmt.Sprintf(" AND ah.artifact_type = $%d", n)
		args = append(args, artifactType)
		n++
	}

	var total int
	if err := r.pool.QueryRow(ctx, fmt.Sprintf(
		`SELECT COUNT(*) FROM artifact_version av JOIN artifact_header ah ON ah.artifact_id = av.artifact_id WHERE %s AND av.is_active = TRUE`,
		where), args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("artifact list count: %w", err)
	}

	args = append(args, limit, offset)
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`
		SELECT av.version_id, av.artifact_id, av.version_no, av.payload, av.is_active, av.is_draft,
		       av.created_by, av.created_at, av.published_at, av.published_by,
		       ah.artifact_name, ah.artifact_type, ah.tenant_id, COALESCE(ah.node_id,'')
		FROM artifact_version av
		JOIN artifact_header ah ON ah.artifact_id = av.artifact_id
		WHERE %s AND av.is_active = TRUE
		ORDER BY av.created_at DESC LIMIT $%d OFFSET $%d`, where, n, n+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("artifact list: %w", err)
	}
	defer rows.Close()

	var artifacts []ArtifactVersion
	for rows.Next() {
		av := ArtifactVersion{}
		if err := rows.Scan(
			&av.VersionID, &av.ArtifactID, &av.VersionNo, &av.Payload, &av.IsActive, &av.IsDraft,
			&av.CreatedBy, &av.CreatedAt, &av.PublishedAt, &av.PublishedBy,
			&av.ArtifactName, &av.ArtifactType, &av.TenantID, &av.NodeID,
		); err != nil {
			return nil, 0, err
		}
		artifacts = append(artifacts, av)
	}
	return artifacts, total, rows.Err()
}

// Save updates the payload of a draft version.
func (r *ArtifactRepo) Save(ctx context.Context, tenantID, versionID string, payload []byte) (*ArtifactVersion, error) {
	const q = `
		UPDATE artifact_version av SET payload = $3
		FROM artifact_header ah
		WHERE av.version_id = $1 AND ah.artifact_id = av.artifact_id AND ah.tenant_id = $2
		  AND av.is_draft = TRUE
		RETURNING av.version_id, av.artifact_id, av.version_no, av.payload, av.is_active, av.is_draft,
		          av.created_by, av.created_at, av.published_at, av.published_by`
	av := &ArtifactVersion{}
	err := r.pool.QueryRow(ctx, q, versionID, tenantID, payload).Scan(
		&av.VersionID, &av.ArtifactID, &av.VersionNo, &av.Payload, &av.IsActive, &av.IsDraft,
		&av.CreatedBy, &av.CreatedAt, &av.PublishedAt, &av.PublishedBy,
	)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("artifact %s: not found or not a draft", versionID)
	}
	return av, err
}

// Publish marks a version as active (published) and clears is_draft.
func (r *ArtifactRepo) Publish(ctx context.Context, tenantID, versionID, publishedBy string) (*ArtifactVersion, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("publish tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Find artifact_id for this version
	var artifactID string
	if err := tx.QueryRow(ctx,
		`SELECT av.artifact_id FROM artifact_version av WHERE av.version_id = $1`, versionID,
	).Scan(&artifactID); err != nil {
		return nil, fmt.Errorf("publish: find artifact_id: %w", err)
	}

	// Deactivate previously active versions
	_, err = tx.Exec(ctx,
		`UPDATE artifact_version SET is_active = FALSE WHERE artifact_id = $1 AND is_active = TRUE`,
		artifactID)
	if err != nil {
		return nil, fmt.Errorf("publish: deactivate old: %w", err)
	}

	av := &ArtifactVersion{}
	err = tx.QueryRow(ctx, `
		UPDATE artifact_version SET is_active = TRUE, is_draft = FALSE,
		       published_at = NOW(), published_by = $2
		WHERE version_id = $1
		RETURNING version_id, artifact_id, version_no, payload, is_active, is_draft,
		          created_by, created_at, published_at, published_by`,
		versionID, publishedBy,
	).Scan(
		&av.VersionID, &av.ArtifactID, &av.VersionNo, &av.Payload, &av.IsActive, &av.IsDraft,
		&av.CreatedBy, &av.CreatedAt, &av.PublishedAt, &av.PublishedBy,
	)
	if err != nil {
		return nil, fmt.Errorf("publish update: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("publish commit: %w", err)
	}
	return av, nil
}

// Fork creates a new draft version based on an existing version.
func (r *ArtifactRepo) Fork(ctx context.Context, tenantID, versionID, createdBy string) (*ArtifactVersion, error) {
	src, err := r.GetByID(ctx, tenantID, versionID)
	if err != nil {
		return nil, err
	}

	var nextVersionNo int
	if err := r.pool.QueryRow(ctx,
		`SELECT COALESCE(MAX(version_no), 0) + 1 FROM artifact_version WHERE artifact_id = $1`,
		src.ArtifactID,
	).Scan(&nextVersionNo); err != nil {
		return nil, fmt.Errorf("fork version_no: %w", err)
	}

	av := &ArtifactVersion{
		ArtifactID:   src.ArtifactID,
		ArtifactName: src.ArtifactName,
		ArtifactType: src.ArtifactType,
		TenantID:     src.TenantID,
		NodeID:       src.NodeID,
	}
	err = r.pool.QueryRow(ctx, `
		INSERT INTO artifact_version (artifact_id, version_no, payload, is_active, is_draft, created_by)
		VALUES ($1, $2, $3, FALSE, TRUE, $4)
		RETURNING version_id, artifact_id, version_no, payload, is_active, is_draft, created_by, created_at`,
		src.ArtifactID, nextVersionNo, src.Payload, createdBy,
	).Scan(&av.VersionID, &av.ArtifactID, &av.VersionNo, &av.Payload, &av.IsActive, &av.IsDraft, &av.CreatedBy, &av.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("fork insert: %w", err)
	}
	return av, nil
}
