-- Update component config_schemas to support PropertyPanel array editors
-- and add missing action/role/field_key properties for key components.
--
-- Uses JSON merge to PRESERVE existing properties and ADD new ones.
-- "columns_array" and "string_array" are PropertyPanel virtual types that
-- trigger the ColumnArrayEditor and StringArrayEditor sub-components.

BEGIN;

-- ── data_table ────────────────────────────────────────────────────────────────
-- Change columns from generic "array" to "columns_array" so ColumnArrayEditor renders.
-- Add title and empty_message for display config.

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(
    jsonb_set(
      config_schema,
      '{properties,columns}',
      '{"type":"columns_array","description":"Table column definitions"}'::jsonb
    ),
    '{properties,title}',
    '{"type":"string","description":"Optional table heading"}'::jsonb
  ),
  '{properties,empty_message}',
  '{"type":"string","description":"Text shown when no rows"}'::jsonb
)
WHERE component_code = 'data_table';

-- ── text_input ────────────────────────────────────────────────────────────────
-- Add role (default/search) and search_fields (string_array).
-- "search" role tells the runtime to add debounce + search icon.

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(
    config_schema,
    '{properties,role}',
    '{"type":"string","enum":["default","search"],"description":"search adds debounce and search icon"}'::jsonb
  ),
  '{properties,search_fields}',
  '{"type":"string_array","description":"Entity field keys this input searches (when role=search)"}'::jsonb
)
WHERE component_code = 'text_input';

-- ── button ────────────────────────────────────────────────────────────────────
-- Add action property so designers can configure what clicking does.

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  config_schema,
  '{properties,action}',
  '{"type":"string","enum":["create_modal","open_filter_drawer","navigate","submit","reset"],"description":"What happens when button is clicked"}'::jsonb
)
WHERE component_code = 'button';

-- ── dropdown_select ───────────────────────────────────────────────────────────
-- Add field_key, entity, and "distinct" option to options_source.
-- "distinct" fetches unique values from the real entity records.

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(
    jsonb_set(
      config_schema,
      '{properties,field_key}',
      '{"type":"string","description":"Entity field key this dropdown is bound to"}'::jsonb
    ),
    '{properties,entity}',
    '{"type":"string","description":"Entity type for distinct/entity options_source"}'::jsonb
  ),
  '{properties,options_source}',
  '{"type":"string","enum":["static","entity","expression","distinct"],"description":"distinct = unique values from entity records"}'::jsonb
)
WHERE component_code = 'dropdown_select';

-- ── drawer_container ──────────────────────────────────────────────────────────
-- Add title and role. role=filter_drawer tells the runtime to wire up filter state.

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(
    config_schema,
    '{properties,title}',
    '{"type":"string","description":"Drawer heading"}'::jsonb
  ),
  '{properties,role}',
  '{"type":"string","enum":["default","filter_drawer"],"description":"filter_drawer wires runtime filter state"}'::jsonb
)
WHERE component_code = 'drawer_panel';

-- ── toolbar ───────────────────────────────────────────────────────────────────
-- Add align property (already has basic schema; extend it).

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(
    COALESCE(config_schema, '{}'::jsonb),
    '{properties,align}',
    '{"type":"string","enum":["start","end","space-between","center"]}'::jsonb
  ),
  '{properties,position}',
  '{"type":"string","enum":["top","bottom"]}'::jsonb
)
WHERE component_code = 'toolbar';

-- ── data_table, text_input, dropdown_select — add page_root to allowed_parents ──
-- These components are valid at the top-level of a view (directly under page_root).

UPDATE ui_component_registry
SET allowed_parents = (
  SELECT jsonb_agg(DISTINCT val)
  FROM (
    SELECT jsonb_array_elements_text(allowed_parents) AS val
    UNION ALL SELECT 'page_root'
  ) t
)
WHERE component_code IN ('data_table', 'text_input', 'dropdown_select', 'filter_panel');

-- ── text_input in toolbar (search bars), dropdown_select in drawer_panel ─────

-- text_input can be inside toolbar (for inline search)
UPDATE ui_component_registry
SET allowed_children = (
  SELECT jsonb_agg(DISTINCT val) FROM (
    SELECT jsonb_array_elements_text(allowed_children) AS val
    UNION ALL SELECT 'text_input'
  ) t
)
WHERE component_code = 'toolbar';

UPDATE ui_component_registry
SET allowed_parents = (
  SELECT jsonb_agg(DISTINCT val) FROM (
    SELECT jsonb_array_elements_text(allowed_parents) AS val
    UNION ALL SELECT 'toolbar'
  ) t
)
WHERE component_code = 'text_input';

-- dropdown_select can be inside drawer_panel (for filter fields) and toolbar
UPDATE ui_component_registry
SET allowed_parents = (
  SELECT jsonb_agg(DISTINCT val) FROM (
    SELECT jsonb_array_elements_text(allowed_parents) AS val
    UNION ALL SELECT 'drawer_panel'
    UNION ALL SELECT 'toolbar'
  ) t
)
WHERE component_code = 'dropdown_select';

-- ── page_root ─────────────────────────────────────────────────────────────────
-- Add top-level layout components that standard_crud views need at page_root level.
-- (toolbar, data_table, filter_panel, etc. are valid direct children of page_root)

UPDATE ui_component_registry
SET allowed_children = (
  SELECT jsonb_agg(DISTINCT val)
  FROM (
    SELECT jsonb_array_elements_text(allowed_children) AS val
    UNION ALL
    SELECT unnest(ARRAY['toolbar', 'data_table', 'filter_panel', 'detail_panel', 'data_card_grid', 'related_list', 'dropdown_select', 'text_input', 'button', 'icon_button']) AS val
  ) t
)
WHERE component_code = 'page_root';

COMMIT;
