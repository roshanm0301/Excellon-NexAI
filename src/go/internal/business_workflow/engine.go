package business_workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

type Engine struct {
	pool *db.Pool
	repo *Repo
}

func NewEngine(pool *db.Pool) *Engine {
	repo := NewRepo(pool)
	return &Engine{pool: pool, repo: repo}
}

func (e *Engine) StartProcess(ctx context.Context, tenantID, definitionID, entityType, entityID string, initialContext map[string]any) (*ProcessInstance, error) {
	def, err := e.repo.GetDefinition(ctx, tenantID, definitionID)
	if err != nil {
		return nil, fmt.Errorf("engine: load definition: %w", err)
	}

	ctxBytes, err := json.Marshal(initialContext)
	if err != nil {
		ctxBytes = []byte(`{}`)
	}

	now := time.Now().UTC()
	inst := &ProcessInstance{
		ID:           idgen.NewV4(),
		TenantID:     tenantID,
		DefinitionID: definitionID,
		EntityType:   entityType,
		EntityID:     entityID,
		CurrentStep:  def.InitialStep,
		Status:       "running",
		Context:      json.RawMessage(ctxBytes),
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := e.repo.CreateInstance(ctx, inst); err != nil {
		return nil, fmt.Errorf("engine: create instance: %w", err)
	}
	return inst, nil
}

func (e *Engine) AdvanceStep(ctx context.Context, tenantID, instanceID string, data map[string]any) (*ProcessInstance, error) {
	inst, err := e.repo.GetInstance(ctx, tenantID, instanceID)
	if err != nil {
		return nil, fmt.Errorf("engine: load instance: %w", err)
	}
	if inst.Status != "running" {
		return nil, fmt.Errorf("engine: instance is not running (status=%s)", inst.Status)
	}

	def, err := e.repo.GetDefinition(ctx, tenantID, inst.DefinitionID)
	if err != nil {
		return nil, fmt.Errorf("engine: load definition: %w", err)
	}

	// Find current step
	var currentStep *StepDefinition
	for i := range def.Steps {
		if def.Steps[i].ID == inst.CurrentStep {
			currentStep = &def.Steps[i]
			break
		}
	}
	if currentStep == nil {
		return nil, fmt.Errorf("engine: current step %q not found in definition", inst.CurrentStep)
	}

	// Merge incoming data into context
	if len(data) > 0 {
		var existing map[string]any
		if err := json.Unmarshal(inst.Context, &existing); err != nil {
			existing = map[string]any{}
		}
		for k, v := range data {
			existing[k] = v
		}
		merged, _ := json.Marshal(existing)
		inst.Context = json.RawMessage(merged)
	}

	// Determine next step
	nextStep := currentStep.NextStep
	// For automated_action steps, the auto action is a stub — just advance
	// Branching: branches take precedence if conditions were to be evaluated (stub: skip evaluation)
	// Move to next step or complete
	if nextStep == "" {
		inst.Status = "completed"
		inst.CurrentStep = ""
	} else {
		inst.CurrentStep = nextStep
	}

	if err := e.repo.UpdateInstance(ctx, inst); err != nil {
		return nil, fmt.Errorf("engine: update instance: %w", err)
	}
	return inst, nil
}

func (e *Engine) AbortProcess(ctx context.Context, tenantID, instanceID, reason string) (*ProcessInstance, error) {
	inst, err := e.repo.GetInstance(ctx, tenantID, instanceID)
	if err != nil {
		return nil, fmt.Errorf("engine: load instance: %w", err)
	}

	inst.Status = "aborted"
	inst.AbortReason = reason
	inst.UpdatedAt = time.Now().UTC()

	if err := e.repo.UpdateInstance(ctx, inst); err != nil {
		return nil, fmt.Errorf("engine: abort instance: %w", err)
	}
	return inst, nil
}
