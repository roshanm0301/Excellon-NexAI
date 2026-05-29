package overlay

import (
	"encoding/json"
	"time"
)

type OverlayLayer string

const (
	LayerPlatform OverlayLayer = "platform"
	LayerVertical OverlayLayer = "vertical"
	LayerTenant   OverlayLayer = "tenant"
	LayerNode     OverlayLayer = "node"
	LayerRole     OverlayLayer = "role"
)

// OverlayDefinition maps to artifact_overlay_delta.
type OverlayDefinition struct {
	ID           string          `json:"id"`
	TenantID     string          `json:"tenant_id"`
	ArtifactType string          `json:"artifact_type"`
	ArtifactKey  string          `json:"artifact_key"`
	Layer        OverlayLayer    `json:"layer"`
	ScopeRef     string          `json:"scope_ref"`
	DeltaJSON    json.RawMessage `json:"delta_json"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	CreatedBy    string          `json:"created_by,omitempty"`
}
