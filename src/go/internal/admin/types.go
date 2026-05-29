package admin

import (
	"encoding/json"
	"time"
)

type ArtifactStatus string

const (
	StatusDraft      ArtifactStatus = "draft"
	StatusInReview   ArtifactStatus = "in-review"
	StatusPublished  ArtifactStatus = "published"
	StatusDeprecated ArtifactStatus = "deprecated"
)

type ArtifactVersion struct {
	ID          string          `json:"id"`
	TenantID    string          `json:"tenant_id"`
	EntityType  string          `json:"entity_type"`
	Version     int             `json:"version"`
	Status      ArtifactStatus  `json:"status"`
	Payload     json.RawMessage `json:"payload"`
	ContentHash string          `json:"content_hash,omitempty"`
	CreatedBy   string          `json:"created_by"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

// Methods to satisfy compiler.artifactInput interface
func (a *ArtifactVersion) GetID() string         { return a.ID }
func (a *ArtifactVersion) GetTenantID() string   { return a.TenantID }
func (a *ArtifactVersion) GetEntityType() string { return a.EntityType }
func (a *ArtifactVersion) GetVersion() int       { return a.Version }
func (a *ArtifactVersion) GetPayload() []byte    { return []byte(a.Payload) }

type CreateArtifactRequest struct {
	EntityType string          `json:"entity_type"`
	Payload    json.RawMessage `json:"payload,omitempty"`
}

type SaveArtifactRequest struct {
	Payload json.RawMessage `json:"payload"`
}

type ArtifactListResponse struct {
	Items      []ArtifactVersion `json:"items"`
	Total      int               `json:"total"`
	NextCursor *string           `json:"next_cursor,omitempty"`
}
