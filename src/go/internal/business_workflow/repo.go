package business_workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type Repo struct {
	pool *db.Pool
}

func NewRepo(pool *db.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) EnsureTables(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS process_definition (
			id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id   UUID NOT NULL,
			name        TEXT NOT NULL,
			entity_type TEXT NOT NULL,
			definition  JSONB NOT NULL DEFAULT '{}',
			created_by  UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
			created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
			deleted_at  TIMESTAMPTZ
		);
		CREATE TABLE IF NOT EXISTS process_instance (
			id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_id     UUID NOT NULL,
			definition_id UUID NOT NULL,
			entity_type   TEXT NOT NULL,
			entity_id     UUID NOT NULL,
			current_step  TEXT NOT NULL DEFAULT '',
			status        TEXT NOT NULL DEFAULT 'running',
			context       JSONB NOT NULL DEFAULT '{}',
			abort_reason  TEXT NOT NULL DEFAULT '',
			created_by    UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
			created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
		);
	`)
	return err
}

func (r *Repo) CreateDefinition(ctx context.Context, tenantID, createdBy string, pd *ProcessDefinition) (*ProcessDefinition, error) {
	if pd.ID == "" {
		pd.ID = idgen.NewV4()
	}
	def, err := json.Marshal(pd)
	if err != nil {
		return nil, fmt.Errorf("business_workflow: marshal definition: %w", err)
	}
	_, err = r.pool.Exec(ctx, `
		INSERT INTO process_definition (id, tenant_id, name, entity_type, definition, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		pd.ID, tenantID, pd.Name, pd.EntityType, def, createdBy)
	if err != nil {
		return nil, fmt.Errorf("business_workflow: create definition: %w", err)
	}
	return pd, nil
}

func (r *Repo) GetDefinition(ctx context.Context, tenantID, id string) (*ProcessDefinition, error) {
	var raw []byte
	err := r.pool.QueryRow(ctx, `
		SELECT definition FROM process_definition
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
		id, tenantID).Scan(&raw)
	if err != nil {
		return nil, fmt.Errorf("business_workflow: get definition: %w", err)
	}
	var pd ProcessDefinition
	if err := json.Unmarshal(raw, &pd); err != nil {
		return nil, fmt.Errorf("business_workflow: unmarshal definition: %w", err)
	}
	return &pd, nil
}

func (r *Repo) ListDefinitions(ctx context.Context, tenantID, entityType string) ([]ProcessDefinition, error) {
	query := `SELECT definition FROM process_definition WHERE tenant_id = $1 AND deleted_at IS NULL`
	args := []any{tenantID}
	if entityType != "" {
		query += ` AND entity_type = $2`
		args = append(args, entityType)
	}
	query += ` ORDER BY created_at ASC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("business_workflow: list definitions: %w", err)
	}
	defer rows.Close()

	var defs []ProcessDefinition
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return nil, err
		}
		var pd ProcessDefinition
		if err := json.Unmarshal(raw, &pd); err != nil {
			continue
		}
		defs = append(defs, pd)
	}
	return defs, rows.Err()
}

func (r *Repo) CreateInstance(ctx context.Context, inst *ProcessInstance) error {
	if inst.ID == "" {
		inst.ID = idgen.NewV4()
	}
	ctxData := inst.Context
	if ctxData == nil {
		ctxData = json.RawMessage(`{}`)
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO process_instance (id, tenant_id, definition_id, entity_type, entity_id, current_step, status, context, abort_reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		inst.ID, inst.TenantID, inst.DefinitionID, inst.EntityType, inst.EntityID,
		inst.CurrentStep, inst.Status, ctxData, inst.AbortReason)
	if err != nil {
		return fmt.Errorf("business_workflow: create instance: %w", err)
	}
	return nil
}

func (r *Repo) GetInstance(ctx context.Context, tenantID, id string) (*ProcessInstance, error) {
	var inst ProcessInstance
	var ctxRaw []byte
	err := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, definition_id, entity_type, entity_id, current_step, status, context, abort_reason, created_at, updated_at
		FROM process_instance
		WHERE id = $1 AND tenant_id = $2`,
		id, tenantID).Scan(
		&inst.ID, &inst.TenantID, &inst.DefinitionID, &inst.EntityType, &inst.EntityID,
		&inst.CurrentStep, &inst.Status, &ctxRaw, &inst.AbortReason, &inst.CreatedAt, &inst.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("business_workflow: get instance: %w", err)
	}
	inst.Context = json.RawMessage(ctxRaw)
	return &inst, nil
}

func (r *Repo) UpdateInstance(ctx context.Context, inst *ProcessInstance) error {
	ctxData := inst.Context
	if ctxData == nil {
		ctxData = json.RawMessage(`{}`)
	}
	inst.UpdatedAt = time.Now().UTC()
	_, err := r.pool.Exec(ctx, `
		UPDATE process_instance SET
			current_step = $1, status = $2, context = $3, abort_reason = $4, updated_at = now()
		WHERE id = $5 AND tenant_id = $6`,
		inst.CurrentStep, inst.Status, ctxData, inst.AbortReason, inst.ID, inst.TenantID)
	if err != nil {
		return fmt.Errorf("business_workflow: update instance: %w", err)
	}
	return nil
}

func (r *Repo) ListInstances(ctx context.Context, tenantID, entityType, entityID string) ([]ProcessInstance, error) {
	query := `SELECT id, tenant_id, definition_id, entity_type, entity_id, current_step, status, context, abort_reason, created_at, updated_at
		FROM process_instance WHERE tenant_id = $1`
	args := []any{tenantID}
	i := 2
	if entityType != "" {
		query += fmt.Sprintf(" AND entity_type = $%d", i)
		args = append(args, entityType)
		i++
	}
	if entityID != "" {
		query += fmt.Sprintf(" AND entity_id = $%d", i)
		args = append(args, entityID)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("business_workflow: list instances: %w", err)
	}
	defer rows.Close()

	var instances []ProcessInstance
	for rows.Next() {
		var inst ProcessInstance
		var ctxRaw []byte
		if err := rows.Scan(
			&inst.ID, &inst.TenantID, &inst.DefinitionID, &inst.EntityType, &inst.EntityID,
			&inst.CurrentStep, &inst.Status, &ctxRaw, &inst.AbortReason, &inst.CreatedAt, &inst.UpdatedAt,
		); err != nil {
			return nil, err
		}
		inst.Context = json.RawMessage(ctxRaw)
		instances = append(instances, inst)
	}
	return instances, rows.Err()
}
