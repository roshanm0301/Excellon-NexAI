package business_workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/expression"
	"github.com/excellon/nexai/internal/idgen"
)

// WorkflowResolver looks up which workflow definitions should be triggered for a given entity event.
type WorkflowResolver struct {
	pool *db.Pool
	expr *expression.Engine
}

// NewWorkflowResolver constructs a WorkflowResolver.
func NewWorkflowResolver(pool *db.Pool, expr *expression.Engine) *WorkflowResolver {
	return &WorkflowResolver{pool: pool, expr: expr}
}

// ResolvedBinding pairs a binding with its definition.
type ResolvedBinding struct {
	Binding    *WorkflowBinding
	Definition *ProcessDefinitionV2
}

// Resolve finds all enabled workflow bindings that match the given entity event,
// evaluates any conditions, and returns the matched definitions ordered by priority.
func (wr *WorkflowResolver) Resolve(ctx context.Context, tenantID, entityType, triggerEvent string, entityData map[string]any) ([]ResolvedBinding, error) {
	bindings, err := wr.loadBindings(ctx, tenantID, entityType, triggerEvent)
	if err != nil {
		return nil, fmt.Errorf("workflow_resolver: load bindings: %w", err)
	}

	if len(bindings) == 0 {
		return nil, nil
	}

	var resolved []ResolvedBinding
	for _, b := range bindings {
		// Evaluate condition if present
		if b.Condition != "" {
			matched, err := wr.evalCondition(ctx, b.Condition, entityData)
			if err != nil {
				slog.Warn("workflow_resolver: condition eval error", "binding", b.ID, "error", err)
				continue
			}
			if !matched {
				continue
			}
		}

		// Load the definition
		def, err := wr.loadDefinition(ctx, tenantID, b.DefinitionID)
		if err != nil {
			slog.Warn("workflow_resolver: load definition failed", "binding", b.ID, "definition", b.DefinitionID, "error", err)
			continue
		}

		resolved = append(resolved, ResolvedBinding{Binding: b, Definition: def})
	}

	return resolved, nil
}

// CreateBinding creates a new workflow binding.
func (wr *WorkflowResolver) CreateBinding(ctx context.Context, tenantID, createdBy string, binding *WorkflowBinding) (*WorkflowBinding, error) {
	if binding.ID == "" {
		binding.ID = idgen.NewV4()
	}
	binding.TenantID = tenantID
	binding.CreatedBy = createdBy
	binding.Enabled = true
	now := time.Now().UTC()
	binding.CreatedAt = now
	binding.UpdatedAt = now

	_, err := wr.pool.Exec(ctx, `
		INSERT INTO workflow_binding (id, tenant_id, entity_type, trigger_event, definition_id, priority, condition, enabled, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
		binding.ID, binding.TenantID, binding.EntityType, binding.TriggerEvent,
		binding.DefinitionID, binding.Priority, binding.Condition, binding.Enabled,
		binding.CreatedBy, binding.CreatedAt, binding.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("workflow_resolver: create binding: %w", err)
	}
	return binding, nil
}

// ListBindings returns all bindings for a tenant, optionally filtered by entity type.
func (wr *WorkflowResolver) ListBindings(ctx context.Context, tenantID, entityType string) ([]*WorkflowBinding, error) {
	query := `
		SELECT id, tenant_id, entity_type, trigger_event, definition_id, priority, condition, enabled, created_by, created_at, updated_at
		FROM workflow_binding
		WHERE tenant_id = $1 AND deleted_at IS NULL`
	args := []any{tenantID}
	if entityType != "" {
		query += ` AND entity_type = $2`
		args = append(args, entityType)
	}
	query += ` ORDER BY priority ASC, created_at ASC`

	rows, err := wr.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("workflow_resolver: list bindings: %w", err)
	}
	defer rows.Close()

	var bindings []*WorkflowBinding
	for rows.Next() {
		b := &WorkflowBinding{}
		if err := rows.Scan(&b.ID, &b.TenantID, &b.EntityType, &b.TriggerEvent, &b.DefinitionID, &b.Priority, &b.Condition, &b.Enabled, &b.CreatedBy, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		bindings = append(bindings, b)
	}
	return bindings, rows.Err()
}

// UpdateBinding updates an existing binding.
func (wr *WorkflowResolver) UpdateBinding(ctx context.Context, tenantID string, binding *WorkflowBinding) error {
	binding.UpdatedAt = time.Now().UTC()
	_, err := wr.pool.Exec(ctx, `
		UPDATE workflow_binding
		SET entity_type = $1, trigger_event = $2, definition_id = $3, priority = $4, condition = $5, enabled = $6, updated_at = $7
		WHERE id = $8 AND tenant_id = $9 AND deleted_at IS NULL`,
		binding.EntityType, binding.TriggerEvent, binding.DefinitionID, binding.Priority,
		binding.Condition, binding.Enabled, binding.UpdatedAt, binding.ID, tenantID)
	return err
}

// DeleteBinding soft-deletes a binding.
func (wr *WorkflowResolver) DeleteBinding(ctx context.Context, tenantID, bindingID string) error {
	_, err := wr.pool.Exec(ctx, `
		UPDATE workflow_binding SET deleted_at = now() WHERE id = $1 AND tenant_id = $2`,
		bindingID, tenantID)
	return err
}

// --- Internal helpers ---

func (wr *WorkflowResolver) loadBindings(ctx context.Context, tenantID, entityType, triggerEvent string) ([]*WorkflowBinding, error) {
	rows, err := wr.pool.Query(ctx, `
		SELECT id, tenant_id, entity_type, trigger_event, definition_id, priority, condition, enabled, created_by, created_at, updated_at
		FROM workflow_binding
		WHERE tenant_id = $1 AND entity_type = $2 AND trigger_event = $3 AND enabled = TRUE AND deleted_at IS NULL
		ORDER BY priority ASC`,
		tenantID, entityType, triggerEvent)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bindings []*WorkflowBinding
	for rows.Next() {
		b := &WorkflowBinding{}
		if err := rows.Scan(&b.ID, &b.TenantID, &b.EntityType, &b.TriggerEvent, &b.DefinitionID, &b.Priority, &b.Condition, &b.Enabled, &b.CreatedBy, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		bindings = append(bindings, b)
	}
	return bindings, rows.Err()
}

func (wr *WorkflowResolver) loadDefinition(ctx context.Context, tenantID, definitionID string) (*ProcessDefinitionV2, error) {
	var raw []byte
	var name, entityType, triggerEvent string
	var version int
	var dagDef []byte
	var createdAt, updatedAt time.Time

	err := wr.pool.QueryRow(ctx, `
		SELECT definition, name, entity_type, COALESCE(trigger_event, ''), COALESCE(version, 1), dag_definition, created_at, updated_at
		FROM process_definition
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
		definitionID, tenantID).Scan(&raw, &name, &entityType, &triggerEvent, &version, &dagDef, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}

	def := &ProcessDefinitionV2{
		ID:           definitionID,
		TenantID:     tenantID,
		Name:         name,
		EntityType:   entityType,
		Version:      version,
		TriggerEvent: triggerEvent,
		CreatedAt:    createdAt,
		UpdatedAt:    updatedAt,
	}

	// Parse DAG definition if present
	if dagDef != nil {
		var dag DAGDefinition
		if err := json.Unmarshal(dagDef, &dag); err == nil && dag.StartNodeID != "" {
			def.DAG = &dag
		}
	}

	// Parse legacy steps from definition JSONB
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

func (wr *WorkflowResolver) evalCondition(ctx context.Context, expr string, data map[string]any) (bool, error) {
	result, err := wr.expr.Evaluate(ctx, expr, data)
	if err != nil {
		return false, err
	}
	return isTruthyValue(result), nil
}
