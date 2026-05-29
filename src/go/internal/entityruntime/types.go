package entityruntime

import (
	"encoding/json"
	"time"
)

type EntityRecord struct {
	ID         string          `json:"id"`
	TenantID   string          `json:"tenant_id"`
	EntityType string          `json:"entity_type"`
	Payload    json.RawMessage `json:"payload"`
	Status     string          `json:"status"`
	CreatedBy  string          `json:"created_by"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type CreateEntityRequest struct {
	Payload json.RawMessage `json:"payload"`
}

type UpdateEntityRequest struct {
	Payload json.RawMessage `json:"payload"`
}

type EntityListResponse struct {
	Items      []EntityRecord `json:"items"`
	Total      int            `json:"total"`
	NextCursor *string        `json:"next_cursor,omitempty"`
}

type AuditEventRecord struct {
	ID            string          `json:"id"`
	TenantID      string          `json:"tenant_id"`
	EntityType    string          `json:"entity_type"`
	EntityID      string          `json:"entity_id"`
	Action        string          `json:"action"`
	ActorID       string          `json:"actor_id"`
	ActorRole     string          `json:"actor_role,omitempty"`
	BeforePayload json.RawMessage `json:"before_payload,omitempty"`
	AfterPayload  json.RawMessage `json:"after_payload,omitempty"`
	CreatedAt     time.Time       `json:"created_at"`
}
