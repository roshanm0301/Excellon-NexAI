-- Rollback: restore original config_schemas

BEGIN;

UPDATE ui_component_registry
SET config_schema = jsonb_set(
  config_schema #- '{properties,title}' #- '{properties,empty_message}',
  '{properties,columns}',
  '{"type":"array"}'::jsonb
)
WHERE component_code = 'data_table';

UPDATE ui_component_registry
SET config_schema = config_schema #- '{properties,role}' #- '{properties,search_fields}'
WHERE component_code = 'text_input';

UPDATE ui_component_registry
SET config_schema = config_schema #- '{properties,action}'
WHERE component_code = 'button';

UPDATE ui_component_registry
SET config_schema = config_schema #- '{properties,field_key}' #- '{properties,entity}'
WHERE component_code = 'dropdown_select';

UPDATE ui_component_registry
SET config_schema = config_schema #- '{properties,title}' #- '{properties,role}'
WHERE component_code = 'drawer_panel';

UPDATE ui_component_registry
SET config_schema = config_schema #- '{properties,align}' #- '{properties,position}'
WHERE component_code = 'toolbar';

COMMIT;
