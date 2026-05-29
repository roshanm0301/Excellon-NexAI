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

type OverlayDefinition struct {
	ID         string          `json:"id"`
	TenantID   string          `json:"tenant_id"`
	Layer      OverlayLayer    `json:"layer"`
	ScopeKey   string          `json:"scope_key"`
	EntityType string          `json:"entity_type"`
	Delta      json.RawMessage `json:"delta"`
	CreatedAt  time.Time       `json:"created_at"`
}
