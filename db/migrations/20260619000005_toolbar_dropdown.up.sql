-- Allow dropdown_select inside toolbar containers
-- Enables quick-filter dropdown chips in list view toolbars

UPDATE ui_component_registry
SET allowed_children = allowed_children || '["dropdown_select"]'::jsonb
WHERE component_code = 'toolbar';
