package admin

import (
	"encoding/json"
	"time"
)

// ArtifactHeader is the identity row for a metadata artifact.
type ArtifactHeader struct {
	ArtifactID   string    `json:"artifact_id"`
	ArtifactName string    `json:"artifact_name"`
	ArtifactType string    `json:"artifact_type"`
	TenantID     string    `json:"tenant_id"`
	NodeID       string    `json:"node_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	CreatedBy    string    `json:"created_by"`
}

// ArtifactVersion is one save-point under an artifact_header.
type ArtifactVersion struct {
	VersionID   string          `json:"version_id"`
	ArtifactID  string          `json:"artifact_id"`
	VersionNo   int             `json:"version_no"`
	Payload     json.RawMessage `json:"payload"`
	IsActive    bool            `json:"is_active"`
	IsDraft     bool            `json:"is_draft"`
	CreatedAt   time.Time       `json:"created_at"`
	CreatedBy   string          `json:"created_by"`
	PublishedAt *time.Time      `json:"published_at,omitempty"`
	PublishedBy string          `json:"published_by,omitempty"`

	// Denormalised from artifact_header (for API convenience)
	ArtifactName string `json:"artifact_name,omitempty"`
	ArtifactType string `json:"artifact_type,omitempty"`
	TenantID     string `json:"tenant_id,omitempty"`
	NodeID       string `json:"node_id,omitempty"`
}

// Compiler interface shims — kept for backwards-compat with compiler.Service.Compile().
func (a *ArtifactVersion) GetID() string         { return a.VersionID }
func (a *ArtifactVersion) GetTenantID() string   { return a.TenantID }
func (a *ArtifactVersion) GetEntityType() string { return a.ArtifactName }
func (a *ArtifactVersion) GetVersion() int       { return a.VersionNo }
func (a *ArtifactVersion) GetPayload() []byte    { return []byte(a.Payload) }

type CreateArtifactRequest struct {
	ArtifactName string          `json:"artifact_name"`
	ArtifactType string          `json:"artifact_type"`
	NodeID       string          `json:"node_id,omitempty"`
	Payload      json.RawMessage `json:"payload,omitempty"`
}

type SaveArtifactRequest struct {
	Payload json.RawMessage `json:"payload"`
}

type ArtifactListResponse struct {
	Items      []ArtifactVersion `json:"items"`
	Total      int               `json:"total"`
	NextCursor *string           `json:"next_cursor,omitempty"`
}
