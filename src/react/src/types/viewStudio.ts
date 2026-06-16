/**
 * UI View Studio — TypeScript Types
 * All types for the View Studio designer and runtime APIs.
 */

// ─── Surface Types ───────────────────────────────────────────────────────────

export type SurfaceType =
  | 'standard_crud'
  | 'advanced_crud'
  | 'header_line'
  | 'custom_page'
  | 'dashboard'
  | 'wizard'
  | 'detail_page'
  | 'split_view'
  | 'kanban'
  | 'calendar';

export const SURFACE_TYPES: readonly SurfaceType[] = [
  'standard_crud',
  'advanced_crud',
  'header_line',
  'custom_page',
  'dashboard',
  'wizard',
  'detail_page',
  'split_view',
  'kanban',
  'calendar',
] as const;

// ─── View (artifact_header extended) ─────────────────────────────────────────

export interface View {
  artifact_id: string;
  artifact_name: string;
  artifact_type: string;
  tenant_id: string;
  node_id?: string;
  surface_type?: SurfaceType;
  primary_entity?: string;
  view_code?: string;
  view_label?: string;
  view_category?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  revision: number;
  latest_version_id?: string;
  latest_version_no?: number;
  is_draft: boolean;
  is_active: boolean;
}

export interface ViewVersion {
  version_id: string;
  artifact_id: string;
  version_no: number;
  payload: ViewPayload;
  is_active: boolean;
  is_draft: boolean;
  created_at: string;
  created_by: string;
  revision: number;
  published_at?: string;
  published_by?: string;
}

export interface ViewWithPayload extends View {
  latest_payload: ViewPayload;
}

// ─── View Payload (component tree + metadata) ────────────────────────────────

export interface ViewPayload {
  component_tree: ComponentNode;
  datasources?: DataSourceConfig[];
  events?: EventDefinition[];
  meta?: ViewMeta;
}

export interface ComponentNode {
  component_key: string;
  component_code: string;
  label?: string;
  props?: Record<string, unknown>;
  bindings?: Record<string, FieldBinding>;
  visibility?: VisibilityRule;
  children?: ComponentNode[];
  slot?: string;
}

export interface FieldBinding {
  source: 'field' | 'computed' | 'static' | 'expression';
  entity?: string;
  field_key?: string;
  expression?: string;
  static_value?: unknown;
}

export interface VisibilityRule {
  condition: 'always' | 'field_equals' | 'expression' | 'role_in';
  field_key?: string;
  value?: unknown;
  expression?: string;
  roles?: string[];
  /** If true, remove from DOM entirely; if false, apply CSS display:none */
  remove_from_dom?: boolean;
}

export interface DataSourceConfig {
  source_key: string;
  base_entity: string;
  filters?: FilterConfig[];
  sort?: SortConfig[];
  joins?: JoinConfig[];
  pagination?: PaginationConfig;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'starts_with';
  value: unknown;
  is_dynamic?: boolean;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface JoinConfig {
  entity: string;
  local_field: string;
  foreign_field: string;
  type: 'inner' | 'left';
}

export interface PaginationConfig {
  page_size: number;
  infinite_scroll?: boolean;
}

export interface EventDefinition {
  event_id?: string;
  event_type: EventType;
  source_field?: string;
  conditions?: Record<string, unknown>;
  actions: EventAction[];
  priority?: number;
  is_active?: boolean;
}

export type EventType =
  | 'on_load'
  | 'on_change'
  | 'on_click'
  | 'on_submit'
  | 'on_focus'
  | 'on_blur'
  | 'on_validate'
  | 'on_row_select'
  | 'on_status_change'
  | 'on_field_change'
  | 'on_save_success'
  | 'on_save_error'
  | 'on_delete'
  | 'on_modal_open'
  | 'on_modal_close';

export interface EventAction {
  action_type: ActionType;
  target?: string;
  payload?: Record<string, unknown>;
}

export type ActionType =
  | 'set_field'
  | 'show_field'
  | 'hide_field'
  | 'enable_field'
  | 'disable_field'
  | 'set_required'
  | 'clear_required'
  | 'navigate'
  | 'open_modal'
  | 'close_modal'
  | 'refresh_datasource'
  | 'show_toast'
  | 'trigger_validation'
  | 'call_api'
  | 'set_filter'
  | 'reset_form';

export interface ViewMeta {
  description?: string;
  tags?: string[];
  icon?: string;
  default_mode?: 'view' | 'edit' | 'create';
  runtime_rule_state?: {
    blocked?: boolean;
    block_message?: string;
    warnings?: string[];
    required_fields?: string[];
    field_behaviors?: Array<{
      field: string;
      behavior: 'hidden' | 'readonly' | 'mandatory' | 'editable';
      rule_key?: string;
      reason?: string;
    }>;
  };
}

// ─── Requests ────────────────────────────────────────────────────────────────

export interface CreateViewRequest {
  view_label: string;
  surface_type: SurfaceType;
  primary_entity: string;
  view_code?: string;
  view_category?: string;
  payload?: ViewPayload;
}

export interface SaveDraftRequest {
  payload: ViewPayload;
}

export interface PublishViewRequest {
  changelog?: string;
}

export interface RollbackViewRequest {
  changelog?: string;
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface ViewListResponse {
  items: View[];
  total: number;
}

export interface VersionListResponse {
  items: ViewVersion[];
}

// ─── Component Registry ──────────────────────────────────────────────────────

export interface ComponentRegistryEntry {
  component_code: string;
  component_name: string;
  category: ComponentCategory;
  version: string;
  source: 'platform' | 'plugin';
  plugin_id?: string;
  supported_surfaces: SurfaceType[] | ['all'];
  supported_bindings: string[];
  is_container: boolean;
  allowed_parents: string[];
  allowed_children: string[];
  config_schema: Record<string, unknown>;
  default_props: Record<string, unknown>;
  event_support: {
    emits: string[];
    handles: string[];
  };
  permission_behavior: Record<string, unknown>;
  runtime_renderer: string;
  designer_panel: string;
  preview_support: boolean;
  validation_rules: ValidationRule[];
  deprecated_at?: string;
  successor_code?: string;
  is_active: boolean;
  created_at: string;
}

export type ComponentCategory =
  | 'layout'
  | 'input'
  | 'display'
  | 'action'
  | 'navigation'
  | 'data'
  | 'feedback'
  | 'container'
  | 'media'
  | 'chart'
  | 'composite';

export interface ValidationRule {
  rule: string;
  message: string;
  params?: Record<string, unknown>;
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export interface Plugin {
  plugin_id: string;
  plugin_name: string;
  version: string;
  author?: string;
  runtime_bundle_url?: string;
  designer_bundle_url?: string;
  is_active: boolean;
  tenant_id: string;
  installed_at: string;
}

export interface RegisterPluginRequest {
  plugin_name: string;
  version: string;
  author?: string;
  runtime_bundle_url?: string;
  designer_bundle_url?: string;
}

// ─── Validation Result ───────────────────────────────────────────────────────

export interface ValidationResult {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  field?: string;
}

// ─── View Variant ────────────────────────────────────────────────────────────

export interface ViewVariant {
  variant_id: string;
  artifact_id: string;
  variant_name: string;
  conditions: Record<string, unknown>;
  overrides: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  tenant_id: string;
}

// ─── List Query Params ───────────────────────────────────────────────────────

export interface ViewListParams {
  surface?: SurfaceType;
  entity?: string;
  status?: 'draft' | 'published' | 'all';
  limit?: number;
  offset?: number;
}

export interface ComponentListParams {
  surface?: SurfaceType;
  category?: ComponentCategory;
}

// ─── Entity Schema (M3.2) ────────────────────────────────────────────────────

export interface EntityTypeSummary {
  entity_type: string;
  display_name: string;
}

export interface EntityFieldDef {
  field_key: string;
  label: string;
  field_type: string;
  required: boolean;
  read_only: boolean;
  is_relation: boolean;
  related_entity?: string;
}

// ─── Runtime Context (M3.1) ──────────────────────────────────────────────────

export interface RuntimeContext {
  role?: string;
  fieldValues?: Record<string, unknown>;
}
