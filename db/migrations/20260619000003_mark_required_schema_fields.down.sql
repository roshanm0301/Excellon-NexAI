-- Rollback: remove required arrays and revert property types to original

BEGIN;

-- Remove required arrays
UPDATE ui_component_registry
SET config_schema = config_schema - 'required'
WHERE component_code IN ('button', 'icon_button', 'heading', 'label', 'tab_panel', 'link');

-- Revert icon properties back to string type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,icon,type}', '"string"'::jsonb)
WHERE component_code IN ('button', 'icon_button', 'tab_panel', 'accordion', 'empty_state');

-- Revert color properties back to string type
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,color,type}', '"string"'::jsonb)
WHERE component_code = 'color_indicator';

-- Revert expression types
UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,expression,type}', '"string"'::jsonb)
WHERE component_code = 'conditional_container';

UPDATE ui_component_registry
SET config_schema = jsonb_set(config_schema, '{properties,current_value_source,type}', '"string"'::jsonb)
WHERE component_code = 'metric_comparison';

COMMIT;
