-- Mark required fields in key component config_schemas and add icon/color property types.
-- This enables:
--   1. PropertyPanel to show red asterisks on required properties
--   2. Color picker for color-type properties
--   3. Icon picker dropdown for icon-type properties

BEGIN;

-- ── button: label is required for accessibility ────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{required}', '["label"]'::jsonb)
WHERE component_code = 'button';

-- ── icon_button: icon is required ─────────────────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{required}', '["icon"]'::jsonb)
WHERE component_code = 'icon_button';

-- ── heading: text is required ─────────────────────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{required}', '["text"]'::jsonb)
WHERE component_code = 'heading';

-- ── label: text is required ───────────────────────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{required}', '["text"]'::jsonb)
WHERE component_code = 'label';

-- ── tab_panel: label is required ──────────────────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{required}', '["label"]'::jsonb)
WHERE component_code = 'tab_panel';

-- ── link: text and href are required ──────────────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{required}', '["text","href"]'::jsonb)
WHERE component_code = 'link';

-- ── Set icon type on icon properties (enables icon picker UI) ─────────────
-- button.icon → 'icon' type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,icon,type}', '"icon"'::jsonb)
WHERE component_code = 'button'
  AND config_schema->'properties'->>'icon' IS NOT NULL
  OR config_schema->'properties'->'icon' IS NOT NULL;

-- icon_button.icon → 'icon' type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,icon,type}', '"icon"'::jsonb)
WHERE component_code = 'icon_button';

-- tab_panel.icon → 'icon' type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,icon,type}', '"icon"'::jsonb)
WHERE component_code = 'tab_panel';

-- accordion.icon → 'icon' type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,icon,type}', '"icon"'::jsonb)
WHERE component_code = 'accordion';

-- empty_state.icon → 'icon' type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,icon,type}', '"icon"'::jsonb)
WHERE component_code = 'empty_state';

-- ── Set color type on color properties (enables color picker UI) ───────────
-- color_indicator.color → 'color' type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,color,type}', '"color"'::jsonb)
WHERE component_code = 'color_indicator';

-- color_picker.default_color → 'color' type (if exists)
UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(config_schema, '{properties,default_color}', '{"type":"color","description":"Default selected color"}'::jsonb),
  '{properties,default_color,type}', '"color"'::jsonb
)
WHERE component_code = 'color_picker';

-- ── Add description hints to key text_input properties ────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(
  jsonb_set(
    config_schema,
    '{properties,label,description}',
    '"Accessible label displayed above the field"'::jsonb
  ),
  '{properties,placeholder,description}',
  '"Placeholder text shown when the field is empty"'::jsonb
)
WHERE component_code = 'text_input';

-- ── Add description to button.action ──────────────────────────────────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(
  config_schema,
  '{properties,action,description}',
  '"What happens when this button is clicked"'::jsonb
)
WHERE component_code = 'button';

-- ── Mark data_table columns as required ───────────────────────────────────
-- columns is not truly required (table can have zero columns) but page_size is meaningful
UPDATE ui_component_registry
SET config_schema = jsonb_set(
  config_schema,
  '{properties,page_size,description}',
  '"Number of rows shown per page (default: 25)"'::jsonb
)
WHERE component_code = 'data_table';

-- ── Add expression type to conditional_container expression property ───────
UPDATE ui_component_registry
SET config_schema = jsonb_set(
  config_schema,
  '{properties,expression,type}',
  '"expression"'::jsonb
)
WHERE component_code = 'conditional_container';

-- ── Add expression type to metric_comparison comparison expressions ────────
UPDATE ui_component_registry
SET config_schema = jsonb_set(
  config_schema,
  '{properties,current_value_source,type}',
  '"expression"'::jsonb
)
WHERE component_code = 'metric_comparison';

COMMIT;
