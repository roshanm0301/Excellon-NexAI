package overlay

import (
	"context"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// Repo handles CRUD for artifact_overlay_delta.
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
		INSERT INTO artifact_overlay_delta (id, tenant_id, artifact_type, artifact_key, layer, scope_ref, delta_json, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (artifact_type, artifact_key, layer, scope_ref, tenant_id)
		DO UPDATE SET delta_json = EXCLUDED.delta_json, updated_at = NOW()`,
		def.ID, def.TenantID, def.ArtifactType, def.ArtifactKey, def.Layer, def.ScopeRef, []byte(def.DeltaJSON), def.CreatedBy)
	if err != nil {
		return fmt.Errorf("overlay create: %w", err)
	}
	return nil
}

func (r *Repo) List(ctx context.Context, tenantID, artifactType, artifactKey string) ([]OverlayDefinition, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tenant_id, artifact_type, artifact_key, layer, scope_ref, delta_json, created_at, updated_at, COALESCE(created_by,'')
		FROM artifact_overlay_delta
		WHERE tenant_id = $1 AND artifact_type = $2 AND artifact_key = $3
		ORDER BY CASE layer
			WHEN 'platform' THEN 1
			WHEN 'vertical' THEN 2
			WHEN 'tenant'   THEN 3
			WHEN 'node'     THEN 4
			WHEN 'role'     THEN 5
		END`,
		tenantID, artifactType, artifactKey)
	if err != nil {
		return nil, fmt.Errorf("overlay list: %w", err)
	}
	defer rows.Close()

	var defs []OverlayDefinition
	for rows.Next() {
		var d OverlayDefinition
		if err := rows.Scan(&d.ID, &d.TenantID, &d.ArtifactType, &d.ArtifactKey, &d.Layer, &d.ScopeRef, &d.DeltaJSON, &d.CreatedAt, &d.UpdatedAt, &d.CreatedBy); err != nil {
			return nil, fmt.Errorf("overlay list scan: %w", err)
		}
		defs = append(defs, d)
	}
	return defs, rows.Err()
}

func (r *Repo) Delete(ctx context.Context, id string) error {
	tag, err := r.pool.Exec(ctx,
		`DELETE FROM artifact_overlay_delta WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("overlay delete: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("overlay %s: not found", id)
	}
	return nil
}
