-- Rollback: restore empty validation_rules for all input components

BEGIN;

UPDATE ui_component_registry
SET validation_rules = '[]'::jsonb
WHERE component_code IN (
  'text_input', 'textarea', 'rich_text_editor',
  'number_input', 'currency_input', 'slider_range',
  'date_picker', 'time_picker', 'datetime_picker',
  'dropdown_select', 'multi_select',
  'checkbox', 'checkbox_group', 'radio_group',
  'toggle_switch', 'phone_input', 'file_upload',
  'tag_input', 'address_block', 'code_editor',
  'color_picker', 'stepper_input'
);

COMMIT;
