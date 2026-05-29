package admin

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type ArtifactRepo struct {
	pool *db.Pool
}

func NewArtifactRepo(pool *db.Pool) *ArtifactRepo {
	return &ArtifactRepo{pool: pool}
}

func (r *ArtifactRepo) Create(ctx context.Context, tenantID, entityType, createdBy string, payload []byte) (*ArtifactVersion, error) {
	id := idgen.NewV4()
	if payload == nil {
		payload = []byte(`{"fields":[],"sections":[],"relationships":[]}`)
	}
	const q = `
		INSERT INTO artifact_version (id, tenant_id, entity_type, version, status, payload, created_by)
		VALUES ($1, $2, $3, 1, 'draft', $4, $5)
		RETURNING id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at`
	row := r.pool.QueryRow(ctx, q, id, tenantID, entityType, payload, createdBy)
	return scanArtifact(row)
}

func (r *ArtifactRepo) GetByID(ctx context.Context, tenantID, id string) (*ArtifactVersion, error) {
	const q = `
		SELECT id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at
		FROM artifact_version
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
	row := r.pool.QueryRow(ctx, q, id, tenantID)
	a, err := scanArtifact(row)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("artifact %s: not found", id)
	}
	return a, err
}

func (r *ArtifactRepo) List(ctx context.Context, tenantID, entityType, status string, limit, offset int) ([]ArtifactVersion, int, error) {
	args := []any{tenantID}
	where := "tenant_id = $1 AND deleted_at IS NULL"
	n := 2
	if entityType != "" {
		where += fmt.Sprintf(" AND entity_type = $%d", n)
		args = append(args, entityType)
		n++
	}
	if status != "" {
		where += fmt.Sprintf(" AND status = $%d", n)
		args = append(args, status)
		n++
	}

	var total int
	if err := r.pool.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM artifact_version WHERE %s`, where), args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("artifact list count: %w", err)
	}

	args = append(args, limit, offset)
	rows, err := r.pool.Query(ctx, fmt.Sprintf(`
		SELECT id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at
		FROM artifact_version WHERE %s ORDER BY updated_at DESC LIMIT $%d OFFSET $%d`, where, n, n+1), args...)
	if err != nil {
		return nil, 0, fmt.Errorf("artifact list: %w", err)
	}
	defer rows.Close()

	var artifacts []ArtifactVersion
	for rows.Next() {
		a, err := scanArtifact(rows)
		if err != nil {
			return nil, 0, err
		}
		artifacts = append(artifacts, *a)
	}
	return artifacts, total, rows.Err()
}

func (r *ArtifactRepo) Save(ctx context.Context, tenantID, id string, payload []byte) (*ArtifactVersion, error) {
	const q = `
		UPDATE artifact_version SET payload = $3, updated_at = now()
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL AND status IN ('draft','in-review')
		RETURNING id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at`
	row := r.pool.QueryRow(ctx, q, id, tenantID, payload)
	a, err := scanArtifact(row)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("artifact %s: not found or not editable", id)
	}
	return a, err
}

func (r *ArtifactRepo) Fork(ctx context.Context, tenantID, id, createdBy string) (*ArtifactVersion, error) {
	src, err := r.GetByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	newID := idgen.NewV4()
	const q = `
		INSERT INTO artifact_version (id, tenant_id, entity_type, version, status, payload, created_by)
		VALUES ($1, $2, $3, $4, 'draft', $5, $6)
		RETURNING id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at`
	row := r.pool.QueryRow(ctx, q, newID, tenantID, src.EntityType, src.Version+1, src.Payload, createdBy)
	return scanArtifact(row)
}

func (r *ArtifactRepo) SetStatus(ctx context.Context, tenantID, id string, status ArtifactStatus) (*ArtifactVersion, error) {
	const q = `
		UPDATE artifact_version SET status = $3, updated_at = now()
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
		RETURNING id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at`
	row := r.pool.QueryRow(ctx, q, id, tenantID, status)
	a, err := scanArtifact(row)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("artifact %s: not found", id)
	}
	return a, err
}

func (r *ArtifactRepo) SoftDelete(ctx context.Context, tenantID, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE artifact_version SET deleted_at = now() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
		id, tenantID)
	if err != nil {
		return fmt.Errorf("artifact delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("artifact %s: not found", id)
	}
	return nil
}

func (r *ArtifactRepo) SetContentHash(ctx context.Context, id, hash string) error {
	_, err := r.pool.Exec(ctx, `UPDATE artifact_version SET content_hash = $2, updated_at = now() WHERE id = $1`, id, hash)
	return err
}

// rowScanner works for both pgx.Row and pgx.Rows
type rowScanner interface {
	Scan(dest ...any) error
}

func scanArtifact(row rowScanner) (*ArtifactVersion, error) {
	var a ArtifactVersion
	var hash *string
	err := row.Scan(&a.ID, &a.TenantID, &a.EntityType, &a.Version, &a.Status, &a.Payload, &hash, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if hash != nil {
		a.ContentHash = *hash
	}
	return &a, nil
}
