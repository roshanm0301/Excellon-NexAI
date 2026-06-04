package entityruntime

import (
	"encoding/json"
	"time"

	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/rules"
)

type EntityRecord struct {
	ID             string              `json:"id"`
	EntityType     string              `json:"entity_type"`
	EntityCategory string              `json:"entity_category,omitempty"`
	TenantID       string              `json:"tenant_id"`
	NodeID         string              `json:"node_id,omitempty"`
	Status         string              `json:"status"`
	VersionNo      int                 `json:"version_no"`
	CreatedBy      string              `json:"created_by"`
	UpdatedBy      string              `json:"updated_by"`
	CreatedAt      time.Time           `json:"created_at"`
	UpdatedAt      time.Time           `json:"updated_at"`
	DeletedAt      *time.Time          `json:"deleted_at,omitempty"`
	DeletedBy      string              `json:"deleted_by,omitempty"`
	Payload        json.RawMessage     `json:"payload"`
	RuleResult     *rules.EvalResultV2 `json:"rule_result,omitempty"`
}

type CreateEntityRequest struct {
	Payload     json.RawMessage `json:"payload"`
	Status      *string         `json:"status,omitempty"`
	TriggerType string          `json:"trigger_type,omitempty"`
}

type UpdateEntityRequest struct {
	Payload     json.RawMessage `json:"payload"`
	Status      *string         `json:"status,omitempty"`
	TriggerType string          `json:"trigger_type,omitempty"`
}

type TransitionRequest struct {
	Command  string          `json:"command,omitempty"`
	ToStatus string          `json:"to_status,omitempty"`
	Note     string          `json:"note,omitempty"`
	Payload  json.RawMessage `json:"payload,omitempty"`
}

type TransitionResponse struct {
	Record        *EntityRecord                  `json:"record"`
	Transition    *compiler.RawTransition        `json:"transition,omitempty"`
	RuleGuards    map[string]*rules.EvalResultV2 `json:"rule_guards,omitempty"`
	ActionResults []TransitionActionResult       `json:"action_results,omitempty"`
}

type WorkflowStateResponse struct {
	EntityID             string                   `json:"entity_id"`
	EntityType           string                   `json:"entity_type"`
	CurrentStatus        string                   `json:"current_status"`
	InitialStatus        string                   `json:"initial_status,omitempty"`
	Statuses             []compiler.RawStatus     `json:"statuses"`
	AvailableTransitions []compiler.RawTransition `json:"available_transitions"`
}

type TransitionActionResult struct {
	Type    string         `json:"type"`
	Status  string         `json:"status"`
	Output  map[string]any `json:"output,omitempty"`
	Error   string         `json:"error,omitempty"`
	Skipped bool           `json:"skipped,omitempty"`
}

type EntityListResponse struct {
	Items      []EntityRecord `json:"items"`
	Total      int            `json:"total"`
	NextCursor *string        `json:"next_cursor,omitempty"`
}

// AuditEventRecord is kept for history API responses.
type AuditEventRecord struct {
	ID         string          `json:"id"`
	TenantID   string          `json:"tenant_id"`
	EventType  string          `json:"event_type"`
	EntityType string          `json:"entity_type"`
	EntityID   string          `json:"entity_id"`
	ActorID    string          `json:"actor_id"`
	BeforeData json.RawMessage `json:"before_data,omitempty"`
	AfterData  json.RawMessage `json:"after_data,omitempty"`
	Diff       json.RawMessage `json:"diff,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}
