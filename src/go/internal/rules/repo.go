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
		);
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS classifications TEXT[] DEFAULT '{}';
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS content_type VARCHAR(30) NOT NULL DEFAULT 'condition_tree';
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100;
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS hit_policy VARCHAR(20) DEFAULT 'First';
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS rule_set_key TEXT;
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS rule_category TEXT NOT NULL DEFAULT 'Validation';
		ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS version_status TEXT NOT NULL DEFAULT 'Draft';
		UPDATE rule_set SET rule_set_key = COALESCE(NULLIF(rule_set_key, ''), id::text) WHERE rule_set_key IS NULL OR rule_set_key = '';
		ALTER TABLE rule_set ALTER COLUMN rule_set_key SET NOT NULL;
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1 FROM pg_constraint
				WHERE conrelid = 'rule_set'::regclass
				  AND conname = 'rule_set_content_type_check'
			) THEN
				ALTER TABLE rule_set DROP CONSTRAINT rule_set_content_type_check;
			END IF;
		END $$;
		ALTER TABLE rule_set ADD CONSTRAINT rule_set_content_type_check
			CHECK (content_type IN ('condition_tree', 'decision_table', 'decision_graph'));
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint
				WHERE conrelid = 'rule_set'::regclass
				  AND conname = 'uq_rule_set_tenant_key'
			) THEN
				ALTER TABLE rule_set ADD CONSTRAINT uq_rule_set_tenant_key UNIQUE (tenant_id, rule_set_key);
			END IF;
		END $$;`)
	return err
}

func (r *Repo) ListForEntity(ctx context.Context, tenantID, entityType string) ([]RuleSet, error) {
	q := `SELECT id, entity_type, name, definition, enabled FROM rule_set
		WHERE tenant_id = $1 AND ($2 = '' OR entity_type = $2) AND deleted_at IS NULL
		ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, q, tenantID, entityType)
	if err != nil {
		return nil, fmt.Errorf("rules list: %w", err)
	}
	defer rows.Close()

	var sets []RuleSet
	for rows.Next() {
		var id, et, name string
		var def []byte
		var enabled bool
		if err := rows.Scan(&id, &et, &name, &def, &enabled); err != nil {
			return nil, err
		}
		var rs RuleSet
		if err := json.Unmarshal(def, &rs); err != nil {
			rs = RuleSet{}
		}
		rs.ID = id
		rs.EntityType = et
		rs.Name = name
		rs.Enabled = enabled
		sets = append(sets, rs)
	}
	return sets, rows.Err()
}

func (r *Repo) GetByID(ctx context.Context, tenantID, id string) (*RuleSet, error) {
	var etCol, name string
	var def []byte
	var enabled bool
	err := r.pool.QueryRow(ctx, `
		SELECT entity_type, name, definition, enabled FROM rule_set
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
		id, tenantID,
	).Scan(&etCol, &name, &def, &enabled)
	if err != nil {
		return nil, fmt.Errorf("rules get: %w", err)
	}
	var rs RuleSet
	if err := json.Unmarshal(def, &rs); err != nil {
		rs = RuleSet{}
	}
	rs.ID = id
	rs.EntityType = etCol
	rs.Name = name
	rs.Enabled = enabled
	return &rs, nil
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
