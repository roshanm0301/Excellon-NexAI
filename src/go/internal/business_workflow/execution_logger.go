package business_workflow

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// ExecutionLogger records step-level execution events (fire-and-forget).
type ExecutionLogger struct {
	pool *db.Pool
}

// NewExecutionLogger constructs an ExecutionLogger.
func NewExecutionLogger(pool *db.Pool) *ExecutionLogger {
	return &ExecutionLogger{pool: pool}
}

// LogAsync fires a goroutine to persist an execution log entry. Never blocks the caller.
func (l *ExecutionLogger) LogAsync(ctx context.Context, tenantID, instanceID, stepID string, stepType StepType, status string, inputData, outputData any) {
	go func() {
		if err := l.LogSync(context.Background(), tenantID, instanceID, stepID, stepType, status, inputData, outputData); err != nil {
			slog.Error("workflow_execution_logger: write failed", "error", err, "step", stepID)
		}
	}()
}

// LogSync persists an execution log entry synchronously (used in simulation mode).
func (l *ExecutionLogger) LogSync(ctx context.Context, tenantID, instanceID, stepID string, stepType StepType, status string, inputData, outputData any) error {
	var inputJSON, outputJSON []byte
	if inputData != nil {
		inputJSON, _ = json.Marshal(inputData)
	}
	if outputData != nil {
		outputJSON, _ = json.Marshal(outputData)
	}

	_, err := l.pool.Exec(ctx, `
		INSERT INTO workflow_execution_log (id, tenant_id, instance_id, step_id, step_type, status, input_data, output_data, started_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		idgen.NewV4(), tenantID, instanceID, stepID, string(stepType), status, inputJSON, outputJSON, time.Now().UTC())
	return err
}

// LogCompletion updates an existing log entry with completion data.
func (l *ExecutionLogger) LogCompletion(ctx context.Context, tenantID, instanceID, stepID, status string, outputData any, durationMs int) {
	go func() {
		var outputJSON []byte
		if outputData != nil {
			outputJSON, _ = json.Marshal(outputData)
		}
		_, err := l.pool.Exec(context.Background(), `
			UPDATE workflow_execution_log
			SET status = $1, output_data = $2, completed_at = $3, duration_ms = $4
			WHERE tenant_id = $5 AND instance_id = $6 AND step_id = $7 AND completed_at IS NULL
			ORDER BY started_at DESC
			LIMIT 1`,
			status, outputJSON, time.Now().UTC(), durationMs, tenantID, instanceID, stepID)
		if err != nil {
			slog.Error("workflow_execution_logger: update failed", "error", err, "step", stepID)
		}
	}()
}

// GetLogs retrieves execution logs for an instance.
func (l *ExecutionLogger) GetLogs(ctx context.Context, tenantID, instanceID string) ([]WorkflowExecutionLog, error) {
	rows, err := l.pool.Query(ctx, `
		SELECT id, tenant_id, instance_id, step_id, step_type, status, input_data, output_data, error_message, started_at, completed_at, duration_ms
		FROM workflow_execution_log
		WHERE tenant_id = $1 AND instance_id = $2
		ORDER BY started_at ASC`,
		tenantID, instanceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []WorkflowExecutionLog
	for rows.Next() {
		var entry WorkflowExecutionLog
		if err := rows.Scan(&entry.ID, &entry.TenantID, &entry.InstanceID, &entry.StepID, &entry.StepType, &entry.Status, &entry.InputData, &entry.OutputData, &entry.ErrorMessage, &entry.StartedAt, &entry.CompletedAt, &entry.DurationMs); err != nil {
			return nil, err
		}
		logs = append(logs, entry)
	}
	return logs, rows.Err()
}
