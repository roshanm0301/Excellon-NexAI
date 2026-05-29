package audit

import (
	"context"
	"fmt"

	"github.com/excellon/nexai/internal/db"
)

// List returns audit events for a given entity, ordered by most recent first.
func List(ctx context.Context, pool *db.Pool, tenantID, entityType, entityID string, limit, offset int) ([]AuditRecord, error) {
	rows, err := pool.Query(ctx, `
		SELECT id, tenant_id, event_type, entity_type, entity_id, actor_id, before_data, after_data, diff, created_at
		FROM audit_event
		WHERE tenant_id = $1 AND entity_type = $2 AND entity_id = $3
		ORDER BY created_at DESC
		LIMIT $4 OFFSET $5`,
		tenantID, entityType, entityID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("audit list: %w", err)
	}
	defer rows.Close()

	var records []AuditRecord
	for rows.Next() {
		var rec AuditRecord
		if err := rows.Scan(
			&rec.ID, &rec.TenantID, &rec.EventType, &rec.EntityType, &rec.EntityID,
			&rec.ActorID, &rec.BeforeData, &rec.AfterData, &rec.Diff, &rec.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("audit list scan: %w", err)
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}
