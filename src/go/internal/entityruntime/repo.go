package entityruntime

import (
	"context"
	"fmt"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
	"github.com/jackc/pgx/v5"
)

type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) Create(ctx context.Context, tenantID, entityType, nodeID, createdBy string, payload []byte) (*EntityRecord, error) {
	return r.CreateWithStatus(ctx, tenantID, entityType, nodeID, createdBy, payload, "DRAFT")
}

func (r *Repo) CreateWithStatus(ctx context.Context, tenantID, entityType, nodeID, createdBy string, payload []byte, status string) (*EntityRecord, error) {
	id := idgen.NewV7()
	if status == "" {
		status = "DRAFT"
	}
	const q = `
		INSERT INTO entity_record (id, tenant_id, entity_type, node_id, payload, status, version_no, created_by, updated_by)
		VALUES ($1, $2, $3, NULLIF($4,''), $5, $6, 1, $7, $7)
		RETURNING id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		          status, version_no, created_by, updated_by, created_at, updated_at,
		          deleted_at, COALESCE(deleted_by,''), payload`
	return scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType, nodeID, payload, status, createdBy))
}

func (r *Repo) GetByID(ctx context.Context, tenantID, entityType, id string) (*EntityRecord, error) {
	const q = `
		SELECT id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		       status, version_no, created_by, updated_by, created_at, updated_at,
		       deleted_at, COALESCE(deleted_by,''), payload
		FROM entity_record
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL`
	rec, err := scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("entity %s/%s: not found", entityType, id)
	}
	return rec, err
}

func (r *Repo) List(ctx context.Context, tenantID, entityType string, limit, offset int) ([]EntityRecord, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM entity_record WHERE tenant_id = $1 AND entity_type = $2 AND deleted_at IS NULL`,
		tenantID, entityType).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("entity list count: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		       status, version_no, created_by, updated_by, created_at, updated_at,
		       deleted_at, COALESCE(deleted_by,''), payload
		FROM entity_record
		WHERE tenant_id = $1 AND entity_type = $2 AND deleted_at IS NULL
		ORDER BY created_at DESC LIMIT $3 OFFSET $4`,
		tenantID, entityType, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("entity list: %w", err)
	}
	defer rows.Close()

	var records []EntityRecord
	for rows.Next() {
		rec, err := scanRecord(rows)
		if err != nil {
			return nil, 0, err
		}
		records = append(records, *rec)
	}
	return records, total, rows.Err()
}

func (r *Repo) Update(ctx context.Context, tenantID, entityType, id, updatedBy string, payload []byte) (*EntityRecord, error) {
	return r.UpdateWithStatus(ctx, tenantID, entityType, id, updatedBy, payload, "")
}

func (r *Repo) UpdateWithStatus(ctx context.Context, tenantID, entityType, id, updatedBy string, payload []byte, status string) (*EntityRecord, error) {
	if status != "" {
		const q = `
			UPDATE entity_record
			SET payload = $4, status = $5, updated_by = $6, updated_at = now(), version_no = version_no + 1
			WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL
			RETURNING id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
			          status, version_no, created_by, updated_by, created_at, updated_at,
			          deleted_at, COALESCE(deleted_by,''), payload`
		rec, err := scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType, payload, status, updatedBy))
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("entity %s/%s: not found", entityType, id)
		}
		return rec, err
	}

	const q = `
		UPDATE entity_record SET payload = $4, updated_by = $5, updated_at = now(), version_no = version_no + 1
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL
		RETURNING id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		          status, version_no, created_by, updated_by, created_at, updated_at,
		          deleted_at, COALESCE(deleted_by,''), payload`
	rec, err := scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType, payload, updatedBy))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("entity %s/%s: not found", entityType, id)
	}
	return rec, err
}

func (r *Repo) SoftDelete(ctx context.Context, tenantID, entityType, id, deletedBy string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE entity_record SET deleted_at = now(), deleted_by = $4, updated_at = now()
		 WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL`,
		id, tenantID, entityType, deletedBy)
	if err != nil {
		return fmt.Errorf("entity delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("entity %s/%s: not found", entityType, id)
	}
	return nil
}

func (r *Repo) Restore(ctx context.Context, tenantID, entityType, id string) (*EntityRecord, error) {
	const q = `
		UPDATE entity_record SET deleted_at = NULL, deleted_by = NULL, updated_at = now()
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NOT NULL
		RETURNING id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		          status, version_no, created_by, updated_by, created_at, updated_at,
		          deleted_at, COALESCE(deleted_by,''), payload`
	rec, err := scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("entity %s/%s: not found in recycle bin", entityType, id)
	}
	return rec, err
}

func (r *Repo) GetHistory(ctx context.Context, tenantID, entityType, entityID string, limit, offset int) ([]AuditEventRecord, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM audit_event WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
		tenantID, entityType, entityID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("history count: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, event_type, entity_type, entity_id, actor_id, before_data, after_data, diff, created_at
		FROM audit_event
		WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3
		ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
		tenantID, entityType, entityID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("history: %w", err)
	}
	defer rows.Close()

	var events []AuditEventRecord
	for rows.Next() {
		var e AuditEventRecord
		err := rows.Scan(&e.ID, &e.TenantID, &e.EventType, &e.EntityType, &e.EntityID,
			&e.ActorID, &e.BeforeData, &e.AfterData, &e.Diff, &e.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		events = append(events, e)
	}
	return events, total, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanRecord(row rowScanner) (*EntityRecord, error) {
	var e EntityRecord
	err := row.Scan(
		&e.ID, &e.EntityType, &e.EntityCategory, &e.TenantID, &e.NodeID,
		&e.Status, &e.VersionNo, &e.CreatedBy, &e.UpdatedBy,
		&e.CreatedAt, &e.UpdatedAt, &e.DeletedAt, &e.DeletedBy, &e.Payload,
	)
	return &e, err
}
