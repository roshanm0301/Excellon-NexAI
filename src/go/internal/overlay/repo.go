package overlay

import (
	"context"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// Repo handles CRUD for overlay_definition.
type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) Create(ctx context.Context, def *OverlayDefinition) error {
	if def.ID == "" {
		def.ID = idgen.NewV4()
	}
	def.CreatedAt = time.Now().UTC()
	_, err := r.pool.Exec(ctx, `
		INSERT INTO overlay_definition (id, tenant_id, entity_type, layer, scope_key, delta, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $2)`,
		def.ID, def.TenantID, def.EntityType, def.Layer, def.ScopeKey, []byte(def.Delta))
	if err != nil {
		return fmt.Errorf("overlay create: %w", err)
	}
	return nil
}

func (r *Repo) List(ctx context.Context, tenantID, entityType string) ([]OverlayDefinition, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, entity_type, layer, scope_key, delta, created_at
		FROM overlay_definition
		WHERE tenant_id = $1 AND entity_type = $2 AND deleted_at IS NULL
		ORDER BY CASE layer
			WHEN 'platform' THEN 1
			WHEN 'vertical' THEN 2
			WHEN 'tenant'   THEN 3
			WHEN 'node'     THEN 4
			WHEN 'role'     THEN 5
		END`,
		tenantID, entityType)
	if err != nil {
		return nil, fmt.Errorf("overlay list: %w", err)
	}
	defer rows.Close()

	var defs []OverlayDefinition
	for rows.Next() {
		var d OverlayDefinition
		if err := rows.Scan(&d.ID, &d.TenantID, &d.EntityType, &d.Layer, &d.ScopeKey, &d.Delta, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("overlay list scan: %w", err)
		}
		defs = append(defs, d)
	}
	return defs, rows.Err()
}

func (r *Repo) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE overlay_definition SET deleted_at = now(), updated_at = now() WHERE id = $1 AND deleted_at IS NULL`,
		id)
	if err != nil {
		return fmt.Errorf("overlay delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("overlay %s: not found", id)
	}
	return nil
}
