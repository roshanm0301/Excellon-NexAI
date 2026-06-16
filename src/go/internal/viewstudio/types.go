package viewstudio

import (
	"encoding/json"
	"time"
)

// ─── Surface Types ───────────────────────────────────────────────────────────

type SurfaceType string

const (
	SurfaceStandardCRUD SurfaceType = "standard_crud"
	SurfaceAdvancedCRUD SurfaceType = "advanced_crud"
	SurfaceHeaderLine   SurfaceType = "header_line"
	SurfaceCustomPage   SurfaceType = "custom_page"
	SurfaceDashboard    SurfaceType = "dashboard"
	SurfaceWizard       SurfaceType = "wizard"
	SurfaceDetailPage   SurfaceType = "detail_page"
	SurfaceSplitView    SurfaceType = "split_view"
	SurfaceKanban       SurfaceType = "kanban"
	SurfaceCalendar     SurfaceType = "calendar"
)

func (s SurfaceType) Valid() bool {
	switch s {
	case SurfaceStandardCRUD, SurfaceAdvancedCRUD, SurfaceHeaderLine,
		SurfaceCustomPage, SurfaceDashboard, SurfaceWizard,
		SurfaceDetailPage, SurfaceSplitView, SurfaceKanban, SurfaceCalendar:
		return true
	}
	return false
}

// ─── View (extended artifact_header + artifact_version) ──────────────────────

type View struct {
	ArtifactID    string    `json:"artifact_id"`
	ArtifactName  string    `json:"artifact_name"`
	ArtifactType  string    `json:"artifact_type"`
	TenantID      string    `json:"tenant_id"`
	NodeID        string    `json:"node_id,omitempty"`
	SurfaceType   string    `json:"surface_type,omitempty"`
	PrimaryEntity string    `json:"primary_entity,omitempty"`
	ViewCode      string    `json:"view_code,omitempty"`
	ViewLabel     string    `json:"view_label,omitempty"`
	ViewCategory  string    `json:"view_category,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	CreatedBy     string    `json:"created_by"`
	Revision      int64     `json:"revision"`
	// Latest version info (denormalised for convenience)
	LatestVersionID string `json:"latest_version_id,omitempty"`
	LatestVersionNo int    `json:"latest_version_no,omitempty"`
	IsDraft         bool   `json:"is_draft"`
	IsActive        bool   `json:"is_active"`
}

type ViewVersion struct {
	VersionID   string          `json:"version_id"`
	ArtifactID  string          `json:"artifact_id"`
	VersionNo   int             `json:"version_no"`
	Payload     json.RawMessage `json:"payload"`
	IsActive    bool            `json:"is_active"`
	IsDraft     bool            `json:"is_draft"`
	CreatedAt   time.Time       `json:"created_at"`
	CreatedBy   string          `json:"created_by"`
	Revision    int64           `json:"revision"`
	PublishedAt *time.Time      `json:"published_at,omitempty"`
	PublishedBy string          `json:"published_by,omitempty"`
}

// ─── Request/Response Types ──────────────────────────────────────────────────

type CreateViewRequest struct {
	ViewLabel     string          `json:"view_label"`
	SurfaceType   string          `json:"surface_type"`
	PrimaryEntity string          `json:"primary_entity"`
	ViewCode      string          `json:"view_code,omitempty"`
	ViewCategory  string          `json:"view_category,omitempty"`
	Payload       json.RawMessage `json:"payload,omitempty"`
}

type SaveDraftRequest struct {
	Payload  json.RawMessage `json:"payload"`
	Revision int64           `json:"revision,omitempty"`
}

type PublishRequest struct {
	Changelog string `json:"changelog,omitempty"`
}

type RollbackRequest struct {
	Changelog string `json:"changelog,omitempty"`
}

type ViewListResponse struct {
	Items []View `json:"items"`
	Total int    `json:"total"`
}

type VersionListResponse struct {
	Items []ViewVersion `json:"items"`
}

// ─── Publish Log ─────────────────────────────────────────────────────────────

type PublishLogEntry struct {
	LogID            string          `json:"log_id"`
	ArtifactID       string          `json:"artifact_id"`
	VersionID        string          `json:"version_id"`
	Action           string          `json:"action"`
	PerformedBy      string          `json:"performed_by,omitempty"`
	PerformedAt      time.Time       `json:"performed_at"`
	Changelog        string          `json:"changelog,omitempty"`
	ValidationResult json.RawMessage `json:"validation_result,omitempty"`
	TenantID         string          `json:"tenant_id"`
}

// ─── Component Registry ──────────────────────────────────────────────────────

type ComponentEntry struct {
	ComponentCode      string          `json:"component_code"`
	ComponentName      string          `json:"component_name"`
	Category           string          `json:"category"`
	Version            string          `json:"version"`
	Source             string          `json:"source"`
	PluginID           *string         `json:"plugin_id,omitempty"`
	SupportedSurfaces  json.RawMessage `json:"supported_surfaces"`
	SupportedBindings  json.RawMessage `json:"supported_bindings"`
	IsContainer        bool            `json:"is_container"`
	AllowedParents     json.RawMessage `json:"allowed_parents"`
	AllowedChildren    json.RawMessage `json:"allowed_children"`
	ConfigSchema       json.RawMessage `json:"config_schema"`
	DefaultProps       json.RawMessage `json:"default_props"`
	EventSupport       json.RawMessage `json:"event_support"`
	PermissionBehavior json.RawMessage `json:"permission_behavior"`
	RuntimeRenderer    string          `json:"runtime_renderer"`
	DesignerPanel      string          `json:"designer_panel"`
	PreviewSupport     bool            `json:"preview_support"`
	ValidationRules    json.RawMessage `json:"validation_rules"`
	DeprecatedAt       *time.Time      `json:"deprecated_at,omitempty"`
	SuccessorCode      *string         `json:"successor_code,omitempty"`
	IsActive           bool            `json:"is_active"`
	CreatedAt          time.Time       `json:"created_at"`
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

type Plugin struct {
	PluginID          string    `json:"plugin_id"`
	PluginName        string    `json:"plugin_name"`
	Version           string    `json:"version"`
	Author            string    `json:"author,omitempty"`
	RuntimeBundleURL  string    `json:"runtime_bundle_url,omitempty"`
	DesignerBundleURL string    `json:"designer_bundle_url,omitempty"`
	IsActive          bool      `json:"is_active"`
	TenantID          string    `json:"tenant_id"`
	InstalledAt       time.Time `json:"installed_at"`
}

type RegisterPluginRequest struct {
	PluginName        string `json:"plugin_name"`
	Version           string `json:"version"`
	Author            string `json:"author,omitempty"`
	RuntimeBundleURL  string `json:"runtime_bundle_url,omitempty"`
	DesignerBundleURL string `json:"designer_bundle_url,omitempty"`
}

// ─── View Variant ────────────────────────────────────────────────────────────

type ViewVariant struct {
	VariantID   string          `json:"variant_id"`
	ArtifactID  string          `json:"artifact_id"`
	VariantName string          `json:"variant_name"`
	Conditions  json.RawMessage `json:"conditions"`
	Overrides   json.RawMessage `json:"overrides"`
	Priority    int             `json:"priority"`
	IsActive    bool            `json:"is_active"`
	TenantID    string          `json:"tenant_id"`
}

// ─── Event Definition ────────────────────────────────────────────────────────

type EventDefinition struct {
	EventID     string          `json:"event_id"`
	ArtifactID  string          `json:"artifact_id"`
	EventType   string          `json:"event_type"`
	SourceField string          `json:"source_field,omitempty"`
	Conditions  json.RawMessage `json:"conditions,omitempty"`
	Actions     json.RawMessage `json:"actions"`
	Priority    int             `json:"priority"`
	IsActive    bool            `json:"is_active"`
	TenantID    string          `json:"tenant_id"`
}

// ─── Data Source Override ────────────────────────────────────────────────────

type DataSourceOverride struct {
	OverrideID   string          `json:"override_id"`
	ArtifactID   string          `json:"artifact_id"`
	SourceKey    string          `json:"source_key"`
	BaseEntity   string          `json:"base_entity,omitempty"`
	FilterConfig json.RawMessage `json:"filter_config,omitempty"`
	SortConfig   json.RawMessage `json:"sort_config,omitempty"`
	JoinConfig   json.RawMessage `json:"join_config,omitempty"`
	TenantID     string          `json:"tenant_id"`
}

// ─── Validation ──────────────────────────────────────────────────────────────

type ValidationResult struct {
	Errors   []ValidationIssue `json:"errors"`
	Warnings []ValidationIssue `json:"warnings"`
}

type ValidationIssue struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Field   string `json:"field,omitempty"`
}

// ─── Diff ────────────────────────────────────────────────────────────────────

type VersionDiff struct {
	Added   []DiffEntry `json:"added"`
	Removed []DiffEntry `json:"removed"`
	Changed []DiffEntry `json:"changed"`
}

type DiffEntry struct {
	ComponentKey  string      `json:"component_key,omitempty"`
	ComponentCode string      `json:"component_code,omitempty"`
	Field         string      `json:"field,omitempty"`
	Before        interface{} `json:"before,omitempty"`
	After         interface{} `json:"after,omitempty"`
}

// ─── Sync Status (schema drift) ─────────────────────────────────────────────

type SyncStatus struct {
	BrokenBindings []BrokenBinding `json:"broken_bindings"`
}

type BrokenBinding struct {
	ComponentKey string `json:"component_key"`
	FieldKey     string `json:"field_key"`
	Reason       string `json:"reason"`
}

// ─── Entity Schema (M3.2) ────────────────────────────────────────────────────

// EntityTypeSummary is returned by GET /studio/entities
type EntityTypeSummary struct {
	EntityType  string `json:"entity_type"`
	DisplayName string `json:"display_name"`
}

// EntityFieldDef is returned by GET /studio/entities/:entityType/fields
type EntityFieldDef struct {
	FieldKey      string `json:"field_key"`
	Label         string `json:"label"`
	FieldType     string `json:"field_type"`
	Required      bool   `json:"required"`
	ReadOnly      bool   `json:"read_only"`
	IsRelation    bool   `json:"is_relation"`
	RelatedEntity string `json:"related_entity,omitempty"`
}

type EntityTypeListResponse struct {
	Items []EntityTypeSummary `json:"items"`
}

type EntityFieldListResponse struct {
	Items []EntityFieldDef `json:"items"`
}
