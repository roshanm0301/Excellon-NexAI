package entityruntime

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) Create(ctx context.Context, tenantID, entityType, createdBy string, payload []byte) (*EntityRecord, error) {
	id := idgen.NewV7()
	const q = `
		INSERT INTO entity_record (id, tenant_id, entity_type, payload, status, created_by)
		VALUES ($1, $2, $3, $4, 'active', $5)
		RETURNING id, tenant_id, entity_type, payload, status, created_by, created_at, updated_at`
	return scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType, payload, createdBy))
}

func (r *Repo) GetByID(ctx context.Context, tenantID, entityType, id string) (*EntityRecord, error) {
	const q = `
		SELECT id, tenant_id, entity_type, payload, status, created_by, created_at, updated_at
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
		SELECT id, tenant_id, entity_type, payload, status, created_by, created_at, updated_at
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

func (r *Repo) Update(ctx context.Context, tenantID, entityType, id string, payload []byte) (*EntityRecord, error) {
	const q = `
		UPDATE entity_record SET payload = $4, updated_at = now()
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL
		RETURNING id, tenant_id, entity_type, payload, status, created_by, created_at, updated_at`
	rec, err := scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType, payload))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("entity %s/%s: not found", entityType, id)
	}
	return rec, err
}

func (r *Repo) SoftDelete(ctx context.Context, tenantID, entityType, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE entity_record SET deleted_at = now(), updated_at = now() WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL`,
		id, tenantID, entityType)
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
		UPDATE entity_record SET deleted_at = NULL, updated_at = now()
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NOT NULL
		RETURNING id, tenant_id, entity_type, payload, status, created_by, created_at, updated_at`
	rec, err := scanRecord(r.pool.QueryRow(ctx, q, id, tenantID, entityType))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("entity %s/%s: not found in recycle bin", entityType, id)
	}
	return rec, err
}

func (r *Repo) RecordAudit(ctx context.Context, tenantID, entityType, entityID, action, actorID, actorRole string, before, after []byte) {
	id := idgen.NewV4()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO audit_event (id, tenant_id, entity_type, entity_id, action, actor_id, actor_role, before_payload, after_payload)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		id, tenantID, entityType, entityID, action, actorID, actorRole, before, after)
	if err != nil {
		fmt.Printf("audit record failed (non-fatal): %v\n", err)
	}
}

func (r *Repo) GetHistory(ctx context.Context, tenantID, entityType, entityID string, limit, offset int) ([]AuditEventRecord, int, error) {
	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM audit_event WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3`,
		tenantID, entityType, entityID).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("history count: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, entity_type, entity_id, action, actor_id, actor_role, before_payload, after_payload, created_at
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
		var role *string
		err := rows.Scan(&e.ID, &e.TenantID, &e.EntityType, &e.EntityID, &e.Action, &e.ActorID, &role, &e.BeforePayload, &e.AfterPayload, &e.CreatedAt)
		if err != nil {
			return nil, 0, err
		}
		if role != nil {
			e.ActorRole = *role
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
	err := row.Scan(&e.ID, &e.TenantID, &e.EntityType, &e.Payload, &e.Status, &e.CreatedBy, &e.CreatedAt, &e.UpdatedAt)
	return &e, err
}
