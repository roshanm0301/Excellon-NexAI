package compiler

import (
	"encoding/json"
	"time"
)

type CompiledArtifact struct {
	ID             string          `json:"id"`
	ArtifactKey    string          `json:"artifact_key"`
	ArtifactType   string          `json:"artifact_type"`
	TenantID       string          `json:"tenant_id"`
	NodeID         string          `json:"node_id,omitempty"`
	CompiledSchema json.RawMessage `json:"payload"`
	ContentHash    string          `json:"content_hash"`
	CreatedAt      time.Time       `json:"created_at"`

	// Legacy aliases kept for internal compatibility
	ArtifactVersionID string    `json:"artifact_version_id,omitempty"`
	EntityType        string    `json:"entity_type,omitempty"`
	CompilerVersion   string    `json:"compiler_version,omitempty"`
	UpdatedAt         time.Time `json:"updated_at,omitempty"`
}

type RawEntitySchema struct {
	Fields        []RawField        `json:"fields"`
	Sections      []RawSection      `json:"sections"`
	Relationships []RawRelationship `json:"relationships"`
	Capabilities  *RawCapabilities  `json:"capabilities,omitempty"`
	Settings      *RawSettings      `json:"settings,omitempty"`
	Indexes       []RawIndexRule    `json:"indexes,omitempty"`
	Retention     *RawRetention     `json:"retention,omitempty"`
}

type RawField struct {
	Key          string           `json:"key"`
	Name         string           `json:"name,omitempty"`
	Label        string           `json:"label"`
	Type         string           `json:"type"`
	Required     bool             `json:"required"`
	Unique       bool             `json:"unique"`
	Indexed      bool             `json:"indexed"`
	PII          bool             `json:"pii"`
	DefaultValue json.RawMessage  `json:"default_value,omitempty"`
	Options      []SelectOption   `json:"options,omitempty"`
	Expression   string           `json:"expression,omitempty"`
	Validation   *FieldValidation `json:"validation,omitempty"`
}

type SelectOption struct {
	Value string `json:"value"`
	Label string `json:"label"`
}

type FieldValidation struct {
	MinLength *int     `json:"min_length,omitempty"`
	MaxLength *int     `json:"max_length,omitempty"`
	Min       *float64 `json:"min,omitempty"`
	Max       *float64 `json:"max,omitempty"`
	Pattern   string   `json:"pattern,omitempty"`
}

type RawSection struct {
	Key    string   `json:"key"`
	Label  string   `json:"label"`
	Fields []string `json:"fields"`
	Order  int      `json:"order"`
}

type RawRelationship struct {
	Key        string `json:"key"`
	Type       string `json:"type"`
	TargetType string `json:"target_type"`
	ForeignKey string `json:"foreign_key"`
	Label      string `json:"label"`
}

type RawCapabilities struct {
	SoftDelete  bool `json:"soft_delete"`
	PII         bool `json:"pii"`
	Audit       bool `json:"audit"`
	Expressions bool `json:"expressions"`
}

type RawSettings struct {
	DisplayName string `json:"display_name"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
	Color       string `json:"color"`
}

type RawIndexRule struct {
	Name   string   `json:"name"`
	Fields []string `json:"fields"`
	Unique bool     `json:"unique"`
}

type RawRetention struct {
	RetentionDays    int    `json:"retention_days"`
	ArchiveThreshold int    `json:"archive_threshold_days"`
	PurgePolicy      string `json:"purge_policy"`
}

type CompiledSchema struct {
	EntityType     string            `json:"entity_type"`
	Version        int               `json:"version"`
	Fields         []CompiledField   `json:"fields"`
	FieldIndex     map[string]int    `json:"field_index"`
	Sections       []RawSection      `json:"sections"`
	Relationships  []RawRelationship `json:"relationships"`
	Capabilities   RawCapabilities   `json:"capabilities"`
	Settings       RawSettings       `json:"settings"`
	IndexPlan      []CompiledIndex   `json:"index_plan"`
	Retention      *RawRetention     `json:"retention,omitempty"`
	HasPII         bool              `json:"has_pii"`
	ComputedFields []string          `json:"computed_fields"`
}

type CompiledField struct {
	RawField
	CompiledType string `json:"compiled_type"`
}

type CompiledIndex struct {
	Name    string   `json:"name"`
	Table   string   `json:"table"`
	Columns []string `json:"columns"`
	Unique  bool     `json:"unique"`
	DDL     string   `json:"ddl"`
}
