package rules

// simulator.go provides dry-run rule evaluation with full execution trace.
// Used by the simulation endpoint and the Rule Builder UI to test rules
// without affecting production data.

import (
	"context"
	"time"
)

// SimulationRequest is the input to a rule simulation.
type SimulationRequest struct {
	RuleSetKey  string         `json:"rule_set_key"`
	EntityType  string         `json:"entity_type"`
	EntityID    string         `json:"entity_id,omitempty"`
	TriggerType string         `json:"trigger_type"`
	Payload     map[string]any `json:"payload"` // mock entity data
}

// SimulationTrace records per-rule evaluation details.
type SimulationTrace struct {
	RuleKey     string `json:"rule_key"`
	RuleID      string `json:"rule_id,omitempty"`
	RowID       string `json:"row_id,omitempty"` // for DT rows
	Matched     bool   `json:"matched"`
	ConditionOK bool   `json:"condition_ok"`
	Actions     []ActionV2 `json:"actions,omitempty"` // actions produced (only if matched)
	Error       string `json:"error,omitempty"`
}

// SimulationResult is the complete output of a rule simulation.
type SimulationResult struct {
	Blocked            bool                  `json:"blocked"`
	BlockMessage       string                `json:"block_message,omitempty"`
	Warnings           []string              `json:"warnings,omitempty"`
	Mutations          map[string]any        `json:"mutations,omitempty"`
	FieldBehaviors     []FieldBehaviorAction `json:"field_behaviors,omitempty"`
	ApprovalRequests   []ApprovalRequest     `json:"approval_requests,omitempty"`
	ServiceInvocations []ServiceInvocation   `json:"service_invocations,omitempty"`
	ConflictLog        []ConflictLogEntry    `json:"conflict_log,omitempty"`
	FiredRules         []FiredRuleEntry      `json:"fired_rules,omitempty"`
	Trace              []SimulationTrace     `json:"trace"`
	ExecutionMs        int                   `json:"execution_ms"`
}

// Simulator runs rule sets in dry-run mode with full tracing.
type Simulator struct {
	evaluator  *EvaluatorV2
	logger     *ExecutionLogger
}

// NewSimulator creates a new Simulator.
func NewSimulator(evaluator *EvaluatorV2, logger *ExecutionLogger) *Simulator {
	return &Simulator{evaluator: evaluator, logger: logger}
}

// Simulate runs a full rule evaluation in simulation mode (no side effects).
func (s *Simulator) Simulate(ctx context.Context, tenantID string, req SimulationRequest) (*SimulationResult, error) {
	start := time.Now()

	result, err := s.evaluator.EvaluateWithTrace(ctx, tenantID, req.RuleSetKey, req.Payload, req.TriggerType)
	if err != nil {
		return nil, err
	}

	result.ExecutionMs = int(time.Since(start).Milliseconds())

	// Log the simulation execution
	if s.logger != nil {
		logEntry := RuleExecutionLog{
			TenantID:         tenantID,
			RuleSetKey:       req.RuleSetKey,
			EntityType:       req.EntityType,
			EntityID:         req.EntityID,
			TriggerType:      req.TriggerType,
			FiredRules:       result.FiredRules,
			Mutations:        toMutationEntries(result.Mutations),
			Violations:       toViolationEntries(result.Blocked, result.BlockMessage),
			Warnings:         result.Warnings,
			FieldBehaviors:   toFieldBehaviorLogs(result.FieldBehaviors),
			ApprovalRequests: result.ApprovalRequests,
			ConflictLog:      result.ConflictLog,
			ExecutionMs:      result.ExecutionMs,
			IsSimulation:     true,
		}
		// Simulation logs are written synchronously so we can confirm write in the response
		_ = s.logger.LogSync(ctx, logEntry)
	}

	return result, nil
}

// ─── Helpers for log entry conversion ────────────────────────────────────────

func toMutationEntries(mutations map[string]any) []MutationEntry {
	if len(mutations) == 0 {
		return nil
	}
	entries := make([]MutationEntry, 0, len(mutations))
	for field, val := range mutations {
		entries = append(entries, MutationEntry{Field: field, Value: val})
	}
	return entries
}

func toViolationEntries(blocked bool, message string) []ViolationEntry {
	if !blocked {
		return nil
	}
	return []ViolationEntry{{Message: message}}
}

func toFieldBehaviorLogs(behaviors []FieldBehaviorAction) []FieldBehaviorLog {
	if len(behaviors) == 0 {
		return nil
	}
	logs := make([]FieldBehaviorLog, len(behaviors))
	for i, b := range behaviors {
		logs[i] = FieldBehaviorLog{
			Field:    b.Field,
			Behavior: b.Behavior,
			RuleKey:  b.RuleKey,
		}
	}
	return logs
}
