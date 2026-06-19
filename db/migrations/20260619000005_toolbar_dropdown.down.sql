-- Rollback: remove dropdown_select from toolbar allowed_children

UPDATE ui_component_registry
SET allowed_children = (
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements_text(allowed_children) AS elem
  WHERE elem != 'dropdown_select'
)
WHERE component_code = 'toolbar';
