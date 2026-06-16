package nodestudio

import (
	"encoding/json"
	"time"
)

type Node struct {
	ID        string          `json:"id"`
	TenantID  string          `json:"tenant_id"`
	ParentID  string          `json:"parent_id,omitempty"`
	Name      string          `json:"name"`
	NodeType  string          `json:"node_type"`
	Metadata  json.RawMessage `json:"metadata"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
	CreatedBy string          `json:"created_by,omitempty"`
}

type CreateNodeRequest struct {
	ParentID string          `json:"parent_id,omitempty"`
	Name     string          `json:"name"`
	NodeType string          `json:"node_type"`
	Metadata json.RawMessage `json:"metadata,omitempty"`
}

type NodeListResponse struct {
	Items []Node `json:"items"`
}
