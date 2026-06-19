-- Rollback: reset supported_bindings to empty array for all 12 components

BEGIN;

UPDATE ui_component_registry
SET supported_bindings = '[]'
WHERE component_code IN (
  'text_input', 'dropdown_select', 'button', 'label', 'heading',
  'badge', 'data_table', 'metric_comparison', 'number_input',
  'slider_range', 'radio_group', 'checkbox_group', 'checkbox',
  'conditional_container'
);

COMMIT;
