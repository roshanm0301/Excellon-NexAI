package rules

// execution_logger.go provides fire-and-forget async logging of rule evaluations.
// Follows the platform audit pattern: never blocks entity operations.

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
)

// ExecutionLogger writes rule evaluation results to the rule_execution_log table.
// All writes are asynchronous — the caller never waits.
type ExecutionLogger struct {
	pool *db.Pool
}

// NewExecutionLogger creates a new ExecutionLogger.
func NewExecutionLogger(pool *db.Pool) *ExecutionLogger {
	return &ExecutionLogger{pool: pool}
}

// Log writes a rule execution log entry asynchronously.
// This never blocks the calling goroutine. Errors are logged but not returned.
func (l *ExecutionLogger) Log(entry RuleExecutionLog) {
	go l.writeEntry(entry)
}

// LogSync writes a rule execution log entry synchronously (used in simulation mode).
func (l *ExecutionLogger) LogSync(ctx context.Context, entry RuleExecutionLog) error {
	return l.insert(ctx, entry)
}

func (l *ExecutionLogger) writeEntry(entry RuleExecutionLog) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := l.insert(ctx, entry); err != nil {
		slog.Error("rule_execution_log: write failed",
			"rule_set_key", entry.RuleSetKey,
			"entity_type", entry.EntityType,
			"error", err)
	}
}

func (l *ExecutionLogger) insert(ctx context.Context, entry RuleExecutionLog) error {
	firedRules, _ := json.Marshal(entry.FiredRules)
	mutations, _ := json.Marshal(entry.Mutations)
	violations, _ := json.Marshal(entry.Violations)
	warnings, _ := json.Marshal(entry.Warnings)
	fieldBehaviors, _ := json.Marshal(entry.FieldBehaviors)
	approvalRequests, _ := json.Marshal(entry.ApprovalRequests)
	conflictLog, _ := json.Marshal(entry.ConflictLog)

	_, err := l.pool.Exec(ctx, `
		INSERT INTO rule_execution_log
			(tenant_id, rule_set_key, entity_type, entity_id, trigger_type,
			 fired_rules, mutations, violations, warnings,
			 field_behaviors, approval_requests, conflict_log,
			 execution_ms, is_simulation)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
		entry.TenantID, entry.RuleSetKey, entry.EntityType, entry.EntityID,
		entry.TriggerType,
		firedRules, mutations, violations, warnings,
		fieldBehaviors, approvalRequests, conflictLog,
		entry.ExecutionMs, entry.IsSimulation)
	return err
}
