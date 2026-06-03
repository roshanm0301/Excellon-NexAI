-- Rollback M5: Service Layer

DROP INDEX IF EXISTS idx_service_invocation_log_lookup;
DROP TABLE IF EXISTS service_invocation_log;

DROP INDEX IF EXISTS idx_service_registration_lookup;
DROP TABLE IF EXISTS service_registration;
