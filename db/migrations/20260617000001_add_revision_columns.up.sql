-- Add optimistic-concurrency revision columns that were accidentally dropped.
ALTER TABLE artifact_header
    ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;

ALTER TABLE artifact_version
    ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;
