-- 20260602000002_seed_component_registry.down.sql
-- Remove all platform-seeded components
DELETE FROM ui_component_registry WHERE source = 'platform';
