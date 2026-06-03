package business_workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/idgen"
)

// --- V2 repository methods (DAG-aware) ---

// CreateDefinitionV2 persists a v2 process definition with optional DAG.
func (r *Repo) CreateDefinitionV2(ctx context.Context, tenantID, createdBy string, def *ProcessDefinitionV2) (*ProcessDefinitionV2, error) {
	if def.ID == "" {
		def.ID = idgen.NewV7()
	}
	now := time.Now().UTC()
	def.TenantID = tenantID
	def.CreatedBy = createdBy
	def.CreatedAt = now
	def.UpdatedAt = now
	if def.Version == 0 {
		def.Version = 1
	}

	// Marshal legacy steps into definition JSONB
	legacyDef, _ := json.Marshal(struct {
		Steps       []StepDefinition `json:"steps"`
		InitialStep string           `json:"initialStep"`
	}{Steps: def.Steps, InitialStep: def.InitialStep})

	// Marshal DAG
	var dagJSON []byte
	if def.DAG != nil {
		dagJSON, _ = json.Marshal(def.DAG)
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO process_definition (id, tenant_id, name, entity_type, definition, created_by, version, trigger_event, dag_definition)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		def.ID, tenantID, def.Name, def.EntityType, legacyDef, createdBy, def.Version, def.TriggerEvent, dagJSON)
	if err != nil {
		return nil, fmt.Errorf("repo: create definition v2: %w", err)
	}
	return def, nil
}

// GetDefinitionV2 loads a v2 process definition by ID.
func (r *Repo) GetDefinitionV2(ctx context.Context, tenantID, id string) (*ProcessDefinitionV2, error) {
	var raw, dagRaw []byte
	var name, entityType, triggerEvent, createdBy string
	var version int
	var createdAt, updatedAt time.Time

	err := r.pool.QueryRow(ctx, `
		SELECT definition, name, entity_type, COALESCE(trigger_event, ''), COALESCE(version, 1), dag_definition, created_by, created_at, updated_at
		FROM process_definition
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
		id, tenantID).Scan(&raw, &name, &entityType, &triggerEvent, &version, &dagRaw, &createdBy, &createdAt, &updatedAt)
	if err != nil {
		return nil, fmt.Errorf("repo: get definition v2: %w", err)
	}

	def := &ProcessDefinitionV2{
		ID:           id,
		TenantID:     tenantID,
		Name:         name,
		EntityType:   entityType,
		Version:      version,
		TriggerEvent: triggerEvent,
		CreatedBy:    createdBy,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}

	if dagRaw != nil {
		var dag DAGDefinition
		if err := json.Unmarshal(dagRaw, &dag); err == nil && dag.StartNodeID != "" {
			def.DAG = &dag
		}
	}

	if raw != nil {
		var legacy struct {
			Steps       []StepDefinition `json:"steps"`
			InitialStep string           `json:"initialStep"`
		}
		if err := json.Unmarshal(raw, &legacy); err == nil {
			def.Steps = legacy.Steps
			def.InitialStep = legacy.InitialStep
		}
	}

	return def, nil
}

// ListDefinitionsV2 returns all v2 definitions for a tenant.
func (r *Repo) ListDefinitionsV2(ctx context.Context, tenantID, entityType string) ([]*ProcessDefinitionV2, error) {
	query := `
		SELECT id, name, entity_type, COALESCE(trigger_event, ''), COALESCE(version, 1), dag_definition, created_by, created_at, updated_at
		FROM process_definition
		WHERE tenant_id = $1 AND deleted_at IS NULL`
	args := []any{tenantID}
	if entityType != "" {
		query += ` AND entity_type = $2`
		args = append(args, entityType)
	}
	query += ` ORDER BY created_at DESC`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("repo: list definitions v2: %w", err)
	}
	defer rows.Close()

	var defs []*ProcessDefinitionV2
	for rows.Next() {
		def := &ProcessDefinitionV2{TenantID: tenantID}
		var dagRaw []byte
		if err := rows.Scan(&def.ID, &def.Name, &def.EntityType, &def.TriggerEvent, &def.Version, &dagRaw, &def.CreatedBy, &def.CreatedAt, &def.UpdatedAt); err != nil {
			return nil, err
		}
		if dagRaw != nil {
			var dag DAGDefinition
			if err := json.Unmarshal(dagRaw, &dag); err == nil && dag.StartNodeID != "" {
				def.DAG = &dag
			}
		}
		defs = append(defs, def)
	}
	return defs, rows.Err()
}

// CreateInstanceV2 persists a v2 process instance with DAG state.
func (r *Repo) CreateInstanceV2(ctx context.Context, inst *ProcessInstanceV2) error {
	if inst.ID == "" {
		inst.ID = idgen.NewV7()
	}

	dagStateJSON, _ := json.Marshal(inst.DAGState)
	ctxData := inst.Context
	if ctxData == nil {
		ctxData = json.RawMessage(`{}`)
	}

	_, err := r.pool.Exec(ctx, `
		INSERT INTO process_instance (id, tenant_id, definition_id, entity_type, entity_id, current_step, status, context, dag_state, started_at, abort_reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		inst.ID, inst.TenantID, inst.DefinitionID, inst.EntityType, inst.EntityID,
		inst.CurrentStep, inst.Status, ctxData, dagStateJSON, inst.StartedAt, inst.ErrorMessage)
	if err != nil {
		return fmt.Errorf("repo: create instance v2: %w", err)
	}
	return nil
}

// GetInstanceV2 loads a v2 process instance with DAG state.
func (r *Repo) GetInstanceV2(ctx context.Context, tenantID, id string) (*ProcessInstanceV2, error) {
	inst := &ProcessInstanceV2{}
	var ctxRaw, dagStateRaw []byte

	err := r.pool.QueryRow(ctx, `
		SELECT id, tenant_id, definition_id, entity_type, entity_id, current_step, status, context, 
			COALESCE(dag_state, '{}'), error_message, abort_reason, started_at, completed_at, created_at, updated_at
		FROM process_instance
		WHERE id = $1 AND tenant_id = $2`,
		id, tenantID).Scan(
		&inst.ID, &inst.TenantID, &inst.DefinitionID, &inst.EntityType, &inst.EntityID,
		&inst.CurrentStep, &inst.Status, &ctxRaw, &dagStateRaw,
		&inst.ErrorMessage, &inst.AbortReason, &inst.StartedAt, &inst.CompletedAt,
		&inst.CreatedAt, &inst.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("repo: get instance v2: %w", err)
	}

	inst.Context = json.RawMessage(ctxRaw)
	if dagStateRaw != nil {
		var ds DAGState
		if err := json.Unmarshal(dagStateRaw, &ds); err == nil {
			inst.DAGState = &ds
		}
	}

	return inst, nil
}

// UpdateInstanceV2 persists the current state of a v2 instance.
func (r *Repo) UpdateInstanceV2(ctx context.Context, inst *ProcessInstanceV2) error {
	dagStateJSON, _ := json.Marshal(inst.DAGState)
	ctxData := inst.Context
	if ctxData == nil {
		ctxData = json.RawMessage(`{}`)
	}
	inst.UpdatedAt = time.Now().UTC()

	_, err := r.pool.Exec(ctx, `
		UPDATE process_instance SET
			current_step = $1, status = $2, context = $3, dag_state = $4,
			error_message = $5, abort_reason = $6, completed_at = $7, updated_at = now()
		WHERE id = $8 AND tenant_id = $9`,
		inst.CurrentStep, inst.Status, ctxData, dagStateJSON,
		inst.ErrorMessage, inst.AbortReason, inst.CompletedAt,
		inst.ID, inst.TenantID)
	if err != nil {
		return fmt.Errorf("repo: update instance v2: %w", err)
	}
	return nil
}

// ListInstancesV2 returns instances filtered by entity.
func (r *Repo) ListInstancesV2(ctx context.Context, tenantID, entityType, entityID, status string) ([]*ProcessInstanceV2, error) {
	query := `
		SELECT id, tenant_id, definition_id, entity_type, entity_id, current_step, status,
			context, COALESCE(dag_state, '{}'), error_message, abort_reason, started_at, completed_at, created_at, updated_at
		FROM process_instance
		WHERE tenant_id = $1`
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
		i++
	}
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", i)
		args = append(args, status)
	}
	query += ` ORDER BY created_at DESC LIMIT 100`

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("repo: list instances v2: %w", err)
	}
	defer rows.Close()

	var instances []*ProcessInstanceV2
	for rows.Next() {
		inst := &ProcessInstanceV2{}
		var ctxRaw, dagStateRaw []byte
		if err := rows.Scan(
			&inst.ID, &inst.TenantID, &inst.DefinitionID, &inst.EntityType, &inst.EntityID,
			&inst.CurrentStep, &inst.Status, &ctxRaw, &dagStateRaw,
			&inst.ErrorMessage, &inst.AbortReason, &inst.StartedAt, &inst.CompletedAt,
			&inst.CreatedAt, &inst.UpdatedAt,
		); err != nil {
			return nil, err
		}
		inst.Context = json.RawMessage(ctxRaw)
		if dagStateRaw != nil {
			var ds DAGState
			if err := json.Unmarshal(dagStateRaw, &ds); err == nil {
				inst.DAGState = &ds
			}
		}
		instances = append(instances, inst)
	}
	return instances, rows.Err()
}
