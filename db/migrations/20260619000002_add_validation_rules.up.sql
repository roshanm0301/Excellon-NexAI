-- Populate validation_rules for all 22 input components in the registry.
-- These rules are used by the ValidationRuleEditor to show relevant options
-- and by the runtime validator to enforce field-level constraints.
--
-- Rule structure: { "rule": string, "param"?: string, "message": string }
-- param is the name of a config_schema property that drives the rule threshold.

BEGIN;

-- ── text_input: full text validation suite ────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This field is required"},
  {"rule":"min_length","param":"min_length","message":"Minimum {min_length} characters required"},
  {"rule":"max_length","param":"max_length","message":"Cannot exceed {max_length} characters"},
  {"rule":"pattern","param":"pattern","message":"Value does not match the required format"},
  {"rule":"email","message":"Must be a valid email address"},
  {"rule":"url","message":"Must be a valid URL"}
]'::jsonb
WHERE component_code = 'text_input';

-- ── textarea: text length validation ─────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This field is required"},
  {"rule":"min_length","param":"min_length","message":"Minimum {min_length} characters required"},
  {"rule":"max_length","param":"max_length","message":"Cannot exceed {max_length} characters"}
]'::jsonb
WHERE component_code = 'textarea';

-- ── rich_text_editor: length validation ───────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This field is required"},
  {"rule":"max_length","param":"max_length","message":"Content is too long"}
]'::jsonb
WHERE component_code = 'rich_text_editor';

-- ── number_input, currency_input: numeric range ───────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This field is required"},
  {"rule":"min_value","param":"min","message":"Must be at least {min}"},
  {"rule":"max_value","param":"max","message":"Must be at most {max}"},
  {"rule":"numeric","message":"Must be a valid number"}
]'::jsonb
WHERE component_code IN ('number_input', 'currency_input');

-- ── slider_range: range validation ───────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"A value is required"},
  {"rule":"min_value","param":"min","message":"Must be at least {min}"},
  {"rule":"max_value","param":"max","message":"Must be at most {max}"}
]'::jsonb
WHERE component_code = 'slider_range';

-- ── date_picker: date presence and range ─────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Date is required"},
  {"rule":"date_range","param":"min_date","message":"Date cannot be before {min_date}"},
  {"rule":"date_range","param":"max_date","message":"Date cannot be after {max_date}"}
]'::jsonb
WHERE component_code = 'date_picker';

-- ── time_picker, datetime_picker ──────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Time is required"},
  {"rule":"date_range","message":"Time must be within the allowed range"}
]'::jsonb
WHERE component_code IN ('time_picker', 'datetime_picker');

-- ── dropdown_select: selection required ───────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Please select an option"}
]'::jsonb
WHERE component_code = 'dropdown_select';

-- ── multi_select: selection count validation ──────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Please select at least one option"},
  {"rule":"min_items","param":"min_items","message":"Select at least {min_items} options"},
  {"rule":"max_items","param":"max_items","message":"Select at most {max_items} options"}
]'::jsonb
WHERE component_code = 'multi_select';

-- ── checkbox: required if bound ───────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This must be checked to proceed"}
]'::jsonb
WHERE component_code = 'checkbox';

-- ── checkbox_group, radio_group: at least one selection ───────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Please make a selection"}
]'::jsonb
WHERE component_code IN ('checkbox_group', 'radio_group');

-- ── toggle_switch: required state ─────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This toggle must be enabled to proceed"}
]'::jsonb
WHERE component_code = 'toggle_switch';

-- ── phone_input: phone format ─────────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Phone number is required"},
  {"rule":"phone","message":"Must be a valid phone number"}
]'::jsonb
WHERE component_code = 'phone_input';

-- ── file_upload: file presence and size ──────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Please upload a file"},
  {"rule":"file_size","param":"max_file_size_mb","message":"File size cannot exceed {max_file_size_mb} MB"},
  {"rule":"file_type","param":"accept","message":"File type not allowed"}
]'::jsonb
WHERE component_code = 'file_upload';

-- ── tag_input: tag count ─────────────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"At least one tag is required"},
  {"rule":"max_items","param":"max_tags","message":"Cannot add more than {max_tags} tags"}
]'::jsonb
WHERE component_code = 'tag_input';

-- ── address_block: completeness ───────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Address is required"}
]'::jsonb
WHERE component_code = 'address_block';

-- ── code_editor: content presence ────────────────────────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"Expression cannot be empty"},
  {"rule":"expression","message":"Expression contains a syntax error"}
]'::jsonb
WHERE component_code = 'code_editor';

-- ── color_picker, stepper_input: required if bound ───────────────────────────
UPDATE ui_component_registry
SET validation_rules = '[
  {"rule":"required","message":"This field is required"}
]'::jsonb
WHERE component_code IN ('color_picker', 'stepper_input');

COMMIT;
