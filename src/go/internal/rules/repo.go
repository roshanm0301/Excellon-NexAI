package rules

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type RuleSetRecord struct {
	ID         string    `json:"id"`
	TenantID   string    `json:"tenant_id"`
	EntityType string    `json:"entity_type"`
	Name       string    `json:"name"`
	Definition []byte    `json:"definition"` // JSON of RuleSet
	Enabled    bool      `json:"enabled"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) EnsureTable(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS rule_set (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id   UUID NOT NULL,
			entity_type TEXT NOT NULL,
			name        TEXT NOT NULL,
			definition  JSONB NOT NULL DEFAULT '{}',
			enabled     BOOLEAN NOT NULL DEFAULT true,
			created_by  UUID NOT NULL,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
			deleted_at  TIMESTAMPTZ
		)`)
	return err
}

func (r *Repo) ListForEntity(ctx context.Context, tenantID, entityType string) ([]RuleSet, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT definition FROM rule_set
		WHERE tenant_id = $1 AND entity_type = $2 AND enabled = true AND deleted_at IS NULL
		ORDER BY created_at ASC`,
		tenantID, entityType)
	if err != nil {
		return nil, fmt.Errorf("rules list: %w", err)
	}
	defer rows.Close()

	var sets []RuleSet
	for rows.Next() {
		var def []byte
		if err := rows.Scan(&def); err != nil {
			return nil, err
		}
		var rs RuleSet
		if err := json.Unmarshal(def, &rs); err != nil {
			continue
		}
		rs.Enabled = true
		sets = append(sets, rs)
	}
	return sets, rows.Err()
}

func (r *Repo) Save(ctx context.Context, tenantID, createdBy string, rs RuleSet) (*RuleSetRecord, error) {
	def, err := json.Marshal(rs)
	if err != nil {
		return nil, fmt.Errorf("rules save marshal: %w", err)
	}
	if rs.ID == "" {
		rs.ID = idgen.NewV4()
	}
	var rec RuleSetRecord
	err = r.pool.QueryRow(ctx, `
		INSERT INTO rule_set (id, tenant_id, entity_type, name, definition, enabled, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO UPDATE SET
			name = EXCLUDED.name,
			definition = EXCLUDED.definition,
			enabled = EXCLUDED.enabled,
			updated_at = now()
		RETURNING id, tenant_id, entity_type, name, definition, enabled, created_at, updated_at`,
		rs.ID, tenantID, rs.EntityType, rs.Name, def, rs.Enabled, createdBy,
	).Scan(&rec.ID, &rec.TenantID, &rec.EntityType, &rec.Name, &rec.Definition, &rec.Enabled, &rec.CreatedAt, &rec.UpdatedAt)
	return &rec, err
}

func (r *Repo) Delete(ctx context.Context, tenantID, id string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE rule_set SET deleted_at = now() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
		id, tenantID)
	if err != nil {
		return fmt.Errorf("rules delete: %w", err)
	}
	return nil
}
