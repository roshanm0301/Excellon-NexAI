-- 20260601000001_rule_engine_v2.up.sql
-- Extends the rule engine with Decision Tables, conflict matrix, execution logging,
-- and classification support.

-- ─── Rule Execution Log ──────────────────────────────────────────────────────
-- Records every rule evaluation for monitoring, simulation trace, and analytics.
-- Written asynchronously (fire-and-forget) — never blocks entity operations.
CREATE TABLE IF NOT EXISTS rule_execution_log (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         VARCHAR(100) NOT NULL,
    rule_set_key      VARCHAR(300) NOT NULL,
    entity_type       VARCHAR(200) NOT NULL,
    entity_id         VARCHAR(200),
    trigger_type      VARCHAR(50) NOT NULL DEFAULT 'server',
    fired_rules       JSONB NOT NULL DEFAULT '[]',
    mutations         JSONB NOT NULL DEFAULT '[]',
    violations        JSONB NOT NULL DEFAULT '[]',
    warnings          JSONB NOT NULL DEFAULT '[]',
    field_behaviors   JSONB NOT NULL DEFAULT '[]',
    approval_requests JSONB NOT NULL DEFAULT '[]',
    conflict_log      JSONB NOT NULL DEFAULT '[]',
    execution_ms      INT NOT NULL DEFAULT 0,
    is_simulation     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rule_exec_log_tenant_key
    ON rule_execution_log (tenant_id, rule_set_key, created_at DESC);
CREATE INDEX idx_rule_exec_log_entity
    ON rule_execution_log (tenant_id, entity_type, entity_id, created_at DESC)
    WHERE entity_id IS NOT NULL;
CREATE INDEX idx_rule_exec_log_simulation
    ON rule_execution_log (tenant_id, rule_set_key)
    WHERE is_simulation = TRUE;

-- ─── Rule Conflict Matrix ────────────────────────────────────────────────────
-- User-defined conflict resolution strategy per field within a rule set.
-- When multiple rules produce conflicting outputs for the same field,
-- this matrix determines which value wins.
CREATE TABLE IF NOT EXISTS rule_conflict_matrix (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        VARCHAR(100) NOT NULL,
    rule_set_key     VARCHAR(300) NOT NULL,
    field_name       VARCHAR(200) NOT NULL,
    resolution_type  VARCHAR(30) NOT NULL DEFAULT 'last_writer'
        CHECK (resolution_type IN ('last_writer', 'first_writer', 'most_restrictive', 'custom_rule')),
    custom_rule_key  VARCHAR(300),
    priority_override INT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       VARCHAR(200) NOT NULL,
    UNIQUE (tenant_id, rule_set_key, field_name)
);

CREATE INDEX idx_rule_conflict_matrix_lookup
    ON rule_conflict_matrix (tenant_id, rule_set_key);

-- ─── Add classification column to rule_set ───────────────────────────────────
-- Classifications: Validation, Derivation, Approval, FieldControl, Eligibility, Extension
ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS classifications TEXT[] DEFAULT '{}';

-- ─── Add content_type column to rule_set ─────────────────────────────────────
-- Distinguishes condition_tree (default) from decision_table rule sets.
ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS content_type VARCHAR(30) NOT NULL DEFAULT 'condition_tree'
    CHECK (content_type IN ('condition_tree', 'decision_table'));

-- ─── Add priority column to rule_set ─────────────────────────────────────────
-- Used for ordering rule set evaluation within a RuleExecutionPlan.
ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS priority INT NOT NULL DEFAULT 100;

-- ─── Add hit_policy column for decision tables ───────────────────────────────
ALTER TABLE rule_set ADD COLUMN IF NOT EXISTS hit_policy VARCHAR(20) DEFAULT 'First'
    CHECK (hit_policy IN ('First', 'Unique', 'Any', 'Collect', 'Priority', 'RuleOrder'));
