package workflow

import (
	"context"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type Runtime struct {
	pool *db.Pool
}

func NewRuntime(pool *db.Pool) *Runtime {
	return &Runtime{pool: pool}
}

// ValidateTransition checks whether a status transition is allowed by the workflow definition.
func (rt *Runtime) ValidateTransition(def *WorkflowDefinition, role, fromStatus, toStatus string) error {
	for _, t := range def.Transitions {
		fromMatch := t.From == "*" || t.From == fromStatus
		toMatch := t.To == toStatus
		if !fromMatch || !toMatch {
			continue
		}
		// Transition found — check role
		if len(t.Roles) == 0 {
			return nil // any role allowed
		}
		for _, r := range t.Roles {
			if r == role || r == "*" {
				return nil
			}
		}
		return fmt.Errorf("workflow: role %q is not allowed to transition %s -> %s", role, fromStatus, toStatus)
	}
	return fmt.Errorf("workflow: transition %s -> %s is not allowed", fromStatus, toStatus)
}

// RecordTransition inserts a status_history row.
func (rt *Runtime) RecordTransition(ctx context.Context, tenantID, entityType, entityID, fromStatus, toStatus, actorID, note string) error {
	id := idgen.NewV4()
	_, err := rt.pool.Exec(ctx, `
		INSERT INTO status_history (id, tenant_id, entity_type, entity_id, from_status, to_status, transitioned_by, note)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
		id, tenantID, entityType, entityID, fromStatus, toStatus, actorID, note)
	return err
}

// CreateSLARecord creates an SLA record for a triggered status.
func (rt *Runtime) CreateSLARecord(ctx context.Context, tenantID, entityType, entityID, slaKey string, dueHours int) error {
	id := idgen.NewV4()
	dueAt := time.Now().UTC().Add(time.Duration(dueHours) * time.Hour)
	_, err := rt.pool.Exec(ctx, `
		INSERT INTO sla_record (id, tenant_id, entity_type, entity_id, sla_key, due_at)
		VALUES ($1, $2, $3, $4, $5, $6)`,
		id, tenantID, entityType, entityID, slaKey, dueAt)
	return err
}

// TriggerSLAs creates SLA records for all rules that match the new status.
func (rt *Runtime) TriggerSLAs(ctx context.Context, def *WorkflowDefinition, tenantID, entityType, entityID, newStatus string) {
	for _, rule := range def.SLARules {
		if rule.TriggerStatus == newStatus {
			if err := rt.CreateSLARecord(ctx, tenantID, entityType, entityID, rule.Key, rule.DueHours); err != nil {
				// SLA creation failures must not block entity operations
				fmt.Printf("sla record failed (non-fatal): %v\n", err)
			}
		}
	}
}
