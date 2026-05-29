package workflow

import (
	"encoding/json"
	"time"
)

type WorkflowDefinition struct {
	EntityType  string       `json:"entity_type"`
	StatusField string       `json:"status_field"` // which field in payload holds status
	Transitions []Transition `json:"transitions"`
	SLARules    []SLARule    `json:"sla_rules"`
}

type Transition struct {
	From   string   `json:"from"`             // "*" means any status
	To     string   `json:"to"`
	Label  string   `json:"label"`
	Roles  []string `json:"roles,omitempty"`  // empty = any role
	Guards []string `json:"guards,omitempty"` // rule set IDs that must pass
}

type SLARule struct {
	Key           string `json:"key"`
	TriggerStatus string `json:"trigger_status"` // SLA starts when entering this status
	DueHours      int    `json:"due_hours"`
}

type StatusHistoryRecord struct {
	ID             string    `json:"id"`
	TenantID       string    `json:"tenant_id"`
	EntityType     string    `json:"entity_type"`
	EntityID       string    `json:"entity_id"`
	FromStatus     string    `json:"from_status"`
	ToStatus       string    `json:"to_status"`
	TransitionedBy string    `json:"transitioned_by"`
	Note           string    `json:"note,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

type TransitionRequest struct {
	ToStatus string `json:"to_status"`
	Note     string `json:"note,omitempty"`
}

type WorkflowArtifactPayload struct {
	WorkflowDefinition json.RawMessage `json:"workflow_definition"`
}
