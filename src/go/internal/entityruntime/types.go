package entityruntime

import (
	"encoding/json"
	"time"
)

type EntityRecord struct {
	ID             string          `json:"id"`
	EntityType     string          `json:"entity_type"`
	EntityCategory string          `json:"entity_category,omitempty"`
	TenantID       string          `json:"tenant_id"`
	NodeID         string          `json:"node_id,omitempty"`
	Status         string          `json:"status"`
	VersionNo      int             `json:"version_no"`
	CreatedBy      string          `json:"created_by"`
	UpdatedBy      string          `json:"updated_by"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
	DeletedAt      *time.Time      `json:"deleted_at,omitempty"`
	DeletedBy      string          `json:"deleted_by,omitempty"`
	Payload        json.RawMessage `json:"payload"`
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
