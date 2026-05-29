package audit

import (
	"context"
	"fmt"

	"github.com/excellon/nexai/internal/db"
)

// List returns audit events for a given entity, ordered by most recent first.
func List(ctx context.Context, pool *db.Pool, tenantID, entityType, entityID string, limit, offset int) ([]AuditRecord, error) {
	rows, err := pool.Query(ctx, `
		SELECT id, tenant_id, entity_type, entity_id, action, actor_id, actor_role, before_payload, after_payload, created_at
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
		var role *string
		if err := rows.Scan(
			&rec.ID, &rec.TenantID, &rec.EntityType, &rec.EntityID,
			&rec.Action, &rec.ActorID, &role,
			&rec.BeforePayload, &rec.AfterPayload, &rec.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("audit list scan: %w", err)
		}
		if role != nil {
			rec.ActorRole = *role
		}
		records = append(records, rec)
	}
	return records, rows.Err()
}
