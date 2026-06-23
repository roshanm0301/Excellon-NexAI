-- Rollback: restore previous button config_schema (7 properties, no groups, with action enum)
UPDATE ui_component_registry
SET config_schema = '{
  "properties": {
    "label": { "type": "string" },
    "variant": { "type": "string", "enum": ["primary", "secondary", "ghost", "danger", "link"] },
    "size": { "type": "string", "enum": ["xs", "sm", "md", "lg"] },
    "icon": { "type": "string" },
    "icon_position": { "type": "string", "enum": ["left", "right"] },
    "loading": { "type": "boolean" },
    "full_width": { "type": "boolean" },
    "action": {
      "type": "string",
      "enum": ["create_modal", "open_filter_drawer", "navigate", "submit", "reset"],
      "description": "What happens when button is clicked"
    }
  }
}'::jsonb,
default_props = '{
  "variant": "primary",
  "size": "md",
  "icon_position": "left",
  "loading": false,
  "full_width": false
}'::jsonb,
supported_bindings = '[]'::jsonb
WHERE component_code = 'button';
