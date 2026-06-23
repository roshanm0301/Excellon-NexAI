-- Button component: comprehensive config_schema with property groups, showWhen conditions,
-- and proper separation from Events (action removed — on_click behaviour lives in EventEditor).
-- Also updates supported_bindings so label/disabled/loading/tooltip appear in the Bindings tab.

-- 1. Replace config_schema
UPDATE ui_component_registry
SET config_schema = '{
  "groups": [
    { "id": "content",    "label": "Content",    "icon": "Type",      "keys": ["label", "tooltip", "aria_label"] },
    { "id": "appearance", "label": "Appearance", "icon": "Palette",   "keys": ["variant", "size", "icon", "icon_position", "full_width"] },
    { "id": "state",      "label": "State",      "icon": "ToggleLeft","keys": ["disabled", "loading"] },
    { "id": "advanced",   "label": "Advanced",   "icon": "Settings",  "keys": ["type"] }
  ],
  "properties": {
    "label": {
      "type": "string",
      "title": "Label",
      "description": "Text displayed on the button",
      "required": true
    },
    "tooltip": {
      "type": "string",
      "title": "Tooltip",
      "description": "Help text shown when the user hovers over the button"
    },
    "aria_label": {
      "type": "string",
      "title": "ARIA Label",
      "description": "Screen-reader label — required when the button shows only an icon with no visible text"
    },
    "variant": {
      "type": "string",
      "title": "Variant",
      "enum": ["primary", "secondary", "ghost", "danger", "outline-brand"],
      "description": "Visual style of the button"
    },
    "size": {
      "type": "string",
      "title": "Size",
      "enum": ["sm", "md", "lg"],
      "description": "Physical dimensions of the button"
    },
    "icon": {
      "type": "icon",
      "title": "Icon",
      "description": "Lucide icon displayed alongside the label (leave blank for text-only)"
    },
    "icon_position": {
      "type": "string",
      "title": "Icon Position",
      "enum": ["left", "right"],
      "description": "Whether the icon appears before or after the label text",
      "showWhen": { "prop": "icon", "not": null }
    },
    "full_width": {
      "type": "boolean",
      "title": "Full Width",
      "description": "Stretch the button to fill its parent container"
    },
    "disabled": {
      "type": "boolean",
      "title": "Initially Disabled",
      "description": "Button is disabled on load — toggle at runtime via Events (enable_field / disable_field)"
    },
    "loading": {
      "type": "boolean",
      "title": "Show Loading Spinner",
      "description": "Replaces the icon with a spinner — set at runtime via Events (set_loading)"
    },
    "type": {
      "type": "string",
      "title": "HTML Button Type",
      "enum": ["button", "submit", "reset"],
      "description": "Native HTML type — use submit inside a form to trigger form submission"
    }
  },
  "required": ["label"]
}'::jsonb
WHERE component_code = 'button';

-- 2. Update default_props
UPDATE ui_component_registry
SET default_props = '{
  "label": "Button",
  "variant": "primary",
  "size": "md",
  "icon_position": "left",
  "full_width": false,
  "disabled": false,
  "loading": false,
  "type": "button"
}'::jsonb
WHERE component_code = 'button';

-- 3. Update supported_bindings so label/disabled/loading/tooltip appear in the Bindings tab
UPDATE ui_component_registry
SET supported_bindings = '["label", "disabled", "loading", "tooltip"]'::jsonb
WHERE component_code = 'button';
