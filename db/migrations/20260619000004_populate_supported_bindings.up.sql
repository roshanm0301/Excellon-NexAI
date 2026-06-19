-- Populate supported_bindings for 12 key components.
-- This enables the BindingEditor's "Add Binding" dropdown to show
-- meaningful property options instead of being empty.

BEGIN;

UPDATE ui_component_registry
SET supported_bindings = '["value","placeholder","disabled","required"]'
WHERE component_code = 'text_input';

UPDATE ui_component_registry
SET supported_bindings = '["value","options","disabled","placeholder"]'
WHERE component_code = 'dropdown_select';

UPDATE ui_component_registry
SET supported_bindings = '["label","disabled"]'
WHERE component_code = 'button';

UPDATE ui_component_registry
SET supported_bindings = '["text"]'
WHERE component_code IN ('label', 'heading');

UPDATE ui_component_registry
SET supported_bindings = '["text","variant"]'
WHERE component_code = 'badge';

UPDATE ui_component_registry
SET supported_bindings = '["datasource","page_size"]'
WHERE component_code = 'data_table';

UPDATE ui_component_registry
SET supported_bindings = '["current_value","previous_value","label","unit"]'
WHERE component_code = 'metric_comparison';

UPDATE ui_component_registry
SET supported_bindings = '["value","min","max"]'
WHERE component_code IN ('number_input', 'slider_range');

UPDATE ui_component_registry
SET supported_bindings = '["value","options"]'
WHERE component_code IN ('radio_group', 'checkbox_group');

UPDATE ui_component_registry
SET supported_bindings = '["value","disabled"]'
WHERE component_code = 'checkbox';

UPDATE ui_component_registry
SET supported_bindings = '["expression"]'
WHERE component_code = 'conditional_container';

COMMIT;
