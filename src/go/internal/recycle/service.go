package recycle

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
)

// EntityRecord is the recycle bin view of an entity_record row.
type EntityRecord struct {
	ID             string          `json:"id"`
	EntityType     string          `json:"entity_type"`
	EntityCategory string          `json:"entity_category,omitempty"`
	TenantID       string          `json:"tenant_id"`
	NodeID         string          `json:"node_id,omitempty"`
	Status         string          `json:"status"`
	DeletedAt      *time.Time      `json:"deleted_at"`
	DeletedBy      string          `json:"deleted_by,omitempty"`
	Payload        json.RawMessage `json:"payload"`
}

// Service manages the recycle bin (soft-deleted entity records).
type Service struct {
	pool *db.Pool
}

func NewService(pool *db.Pool) *Service {
	return &Service{pool: pool}
}

// List returns soft-deleted records for a tenant/entity type.
func (s *Service) List(ctx context.Context, tenantID, entityType string, limit, offset int) ([]EntityRecord, error) {
	args := []any{tenantID}
	where := "tenant_id = $1 AND deleted_at IS NOT NULL"
	n := 2
	if entityType != "" {
		where += fmt.Sprintf(" AND entity_type = $%d", n)
		args = append(args, entityType)
		n++
	}
	args = append(args, limit, offset)

	rows, err := s.pool.Query(ctx, fmt.Sprintf(`
		SELECT id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		       status, deleted_at, COALESCE(deleted_by,''), payload
		FROM entity_record
		WHERE %s ORDER BY deleted_at DESC LIMIT $%d OFFSET $%d`, where, n, n+1), args...)
	if err != nil {
		return nil, fmt.Errorf("recycle list: %w", err)
	}
	defer rows.Close()

	var records []EntityRecord
	for rows.Next() {
		var rec EntityRecord
		if err := rows.Scan(&rec.ID, &rec.EntityType, &rec.EntityCategory, &rec.TenantID,
			&rec.NodeID, &rec.Status, &rec.DeletedAt, &rec.DeletedBy, &rec.Payload); err != nil {
			return nil, fmt.Errorf("recycle list scan: %w", err)
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}

// Restore undeletes a record.
func (s *Service) Restore(ctx context.Context, tenantID, id string) error {
	tag, err := s.pool.Exec(ctx,
		`UPDATE entity_record SET deleted_at = NULL, deleted_by = NULL, updated_at = NOW()
		 WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL`,
		id, tenantID)
	if err != nil {
		return fmt.Errorf("recycle restore: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("recycle: record %s not found in bin", id)
	}
	return nil
}

// PurgeRecord hard-deletes a soft-deleted record.
func (s *Service) PurgeRecord(ctx context.Context, tenantID, id string) error {
	tag, err := s.pool.Exec(ctx,
		`DELETE FROM entity_record WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NOT NULL`,
		id, tenantID)
	if err != nil {
		return fmt.Errorf("recycle purge: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("recycle: record %s not found or not deleted", id)
	}
	return nil
}
