package rules

// evaluator_v2.go is the production v2 rule evaluator that supports both
// condition-tree and decision-table rule sets, new action types (REQUIRE_APPROVAL,
// FIELD_BEHAVIOR, INVOKE_SERVICE), conflict resolution via the user-defined matrix,
// and fire-and-forget execution logging.
//
// It wraps the existing ProductionEvaluator for condition-tree evaluation
// and adds the DTEvaluator for decision tables.

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/expression"
)

// EvaluatorV2 is the production v2 rule evaluator.
type EvaluatorV2 struct {
	pool             *db.Pool
	exprEngine       *expression.Engine
	dtEvaluator      *DTEvaluator
	conflictResolver *ConflictResolver
	logger           *ExecutionLogger
	legacyEval       *ProductionEvaluator
}

// NewEvaluatorV2 creates a new v2 evaluator with all dependencies.
func NewEvaluatorV2(
	pool *db.Pool,
	exprEngine *expression.Engine,
	conflictResolver *ConflictResolver,
	logger *ExecutionLogger,
) *EvaluatorV2 {
	return &EvaluatorV2{
		pool:             pool,
		exprEngine:       exprEngine,
		dtEvaluator:      NewDTEvaluator(exprEngine),
		conflictResolver: conflictResolver,
		logger:           logger,
		legacyEval:       NewProductionEvaluator(),
	}
}

// Evaluate runs all enabled rule sets for an entity type against the payload.
// Supports both condition_tree and decision_table content types.
// Applies conflict resolution and logs execution asynchronously.
func (e *EvaluatorV2) Evaluate(ctx context.Context, tenantID, entityType string, payload map[string]any, triggerType string) (*EvalResultV2, error) {
	start := time.Now()

	// Load all rule sets for this entity type
	ruleSets, err := e.loadRuleSets(ctx, tenantID, entityType)
	if err != nil {
		return nil, fmt.Errorf("evaluator_v2: load rule sets: %w", err)
	}

	result := &EvalResultV2{
		Mutations: make(map[string]any),
	}

	var allMutations []fieldAction
	var allBehaviors []fieldAction
	var firedRules []FiredRuleEntry

	for _, rs := range ruleSets {
		if !rs.Enabled {
			continue
		}

		switch rs.ContentType {
		case ContentTypeDecisionTable:
			dtResults, actions, fired := e.evaluateDecisionTable(ctx, &rs, payload)
			if dtResults != nil {
				_ = dtResults // consumed via actions
			}
			firedRules = append(firedRules, fired...)
			e.processActions(actions, rs.Name, result, &allMutations, &allBehaviors)

		default: // condition_tree
			actions, fired := e.evaluateConditionTree(&rs, payload)
			firedRules = append(firedRules, fired...)
			e.processActions(actions, rs.Name, result, &allMutations, &allBehaviors)
		}

		// Short-circuit if blocked
		if result.Blocked {
			break
		}
	}

	// Apply conflict resolution
	if len(allMutations) > 0 || len(allBehaviors) > 0 {
		resolvedMuts, resolvedBehaviors, conflictLog, _ := e.conflictResolver.ResolveAllConflicts(
			ctx, tenantID, entityType, allMutations, allBehaviors)
		result.Mutations = resolvedMuts
		for field, behavior := range resolvedBehaviors {
			result.FieldBehaviors = append(result.FieldBehaviors, FieldBehaviorAction{
				Field:    field,
				Behavior: behavior,
			})
		}
		result.ConflictLog = conflictLog
	}

	result.FiredRules = firedRules
	result.ExecutionMs = int(time.Since(start).Milliseconds())

	// Fire-and-forget execution log
	if e.logger != nil {
		e.logger.Log(RuleExecutionLog{
			TenantID:         tenantID,
			RuleSetKey:       entityType, // grouped by entity type for composite evaluation
			EntityType:       entityType,
			TriggerType:      triggerType,
			FiredRules:       firedRules,
			Mutations:        toMutationEntries(result.Mutations),
			Violations:       toViolationEntries(result.Blocked, result.BlockMessage),
			Warnings:         result.Warnings,
			FieldBehaviors:   toFieldBehaviorLogs(result.FieldBehaviors),
			ApprovalRequests: result.ApprovalRequests,
			ConflictLog:      result.ConflictLog,
			ExecutionMs:      result.ExecutionMs,
			IsSimulation:     false,
		})
	}

	return result, nil
}

// EvaluateWithTrace runs evaluation with full tracing (used by simulator).
func (e *EvaluatorV2) EvaluateWithTrace(ctx context.Context, tenantID, ruleSetKey string, payload map[string]any, triggerType string) (*SimulationResult, error) {
	start := time.Now()

	ruleSets, err := e.loadRuleSetsForKey(ctx, tenantID, ruleSetKey)
	if err != nil {
		return nil, fmt.Errorf("evaluator_v2: load rule set %s: %w", ruleSetKey, err)
	}

	result := &SimulationResult{
		Mutations: make(map[string]any),
		Trace:     []SimulationTrace{},
	}

	var allMutations []fieldAction
	var allBehaviors []fieldAction

	for _, rs := range ruleSets {
		if !rs.Enabled {
			continue
		}

		switch rs.ContentType {
		case ContentTypeDecisionTable:
			e.evaluateDTWithTrace(ctx, &rs, payload, result, &allMutations, &allBehaviors)
		default:
			e.evaluateConditionTreeWithTrace(&rs, payload, result, &allMutations, &allBehaviors)
		}
	}

	// Apply conflict resolution
	if len(allMutations) > 0 || len(allBehaviors) > 0 {
		resolvedMuts, resolvedBehaviors, conflictLog, _ := e.conflictResolver.ResolveAllConflicts(
			ctx, tenantID, ruleSetKey, allMutations, allBehaviors)
		result.Mutations = resolvedMuts
		for field, behavior := range resolvedBehaviors {
			result.FieldBehaviors = append(result.FieldBehaviors, FieldBehaviorAction{
				Field:    field,
				Behavior: behavior,
			})
		}
		result.ConflictLog = conflictLog
	}

	result.ExecutionMs = int(time.Since(start).Milliseconds())
	return result, nil
}

// ─── Internal Methods ────────────────────────────────────────────────────────

func (e *EvaluatorV2) evaluateDecisionTable(ctx context.Context, rs *RuleSetV2, payload map[string]any) ([]DTResult, []ActionV2, []FiredRuleEntry) {
	if rs.DecisionTable == nil {
		return nil, nil, nil
	}

	results, err := e.dtEvaluator.Evaluate(ctx, rs.DecisionTable, payload)
	if err != nil {
		return nil, nil, nil
	}

	actions := DTResultsToActions(results, rs.DecisionTable.Columns, rs.Name)
	var fired []FiredRuleEntry
	for _, r := range results {
		fired = append(fired, FiredRuleEntry{
			RuleKey:  rs.Name,
			RowID:    r.RowID,
			Priority: rs.Priority,
		})
	}
	return results, actions, fired
}

func (e *EvaluatorV2) evaluateConditionTree(rs *RuleSetV2, payload map[string]any) ([]ActionV2, []FiredRuleEntry) {
	if rs.Conditions == nil {
		return nil, nil
	}

	matched := e.legacyEval.evaluateCondition(*rs.Conditions, payload)
	if !matched {
		return nil, nil
	}

	fired := []FiredRuleEntry{{RuleKey: rs.Name, Priority: rs.Priority}}
	var actions []ActionV2
	for _, a := range rs.Actions {
		action := ActionV2{
			Type:    a.Type,
			Message: a.Message,
			Field:   a.Field,
		}
		if a.Value != nil {
			var v any
			_ = json.Unmarshal(a.Value, &v)
			action.Value = v
		}
		actions = append(actions, action)
	}
	return actions, fired
}

func (e *EvaluatorV2) processActions(actions []ActionV2, ruleKey string, result *EvalResultV2, mutations *[]fieldAction, behaviors *[]fieldAction) {
	for _, action := range actions {
		switch action.Type {
		case ActionBlock:
			result.Blocked = true
			msg := action.Message
			if msg == "" {
				msg = fmt.Sprintf("Blocked by rule %q", ruleKey)
			}
			result.BlockMessage = msg

		case ActionWarn:
			msg := action.Message
			if msg == "" {
				msg = fmt.Sprintf("Warning from rule %q", ruleKey)
			}
			result.Warnings = append(result.Warnings, msg)

		case ActionSetField:
			if action.Field != "" {
				*mutations = append(*mutations, fieldAction{
					field:   action.Field,
					value:   action.Value,
					ruleKey: ruleKey,
				})
				// Also apply immediately to mutations for intermediate visibility
				result.Mutations[action.Field] = action.Value
			}

		case ActionFieldBehavior:
			if action.Field != "" {
				*behaviors = append(*behaviors, fieldAction{
					field:        action.Field,
					behaviorType: action.Behavior,
					ruleKey:      ruleKey,
				})
			}

		case ActionRequireApproval:
			result.ApprovalRequests = append(result.ApprovalRequests, ApprovalRequest{
				Category:     action.Category,
				Reason:       action.Message,
				ApproverRole: action.ApproverRole,
				Priority:     action.Priority,
				RuleKey:      ruleKey,
			})

		case ActionInvokeService:
			result.ServiceInvocations = append(result.ServiceInvocations, ServiceInvocation{
				ServiceKey: action.ServiceKey,
				Params:     action.Params,
				RuleKey:    ruleKey,
			})

		case ActionRequireField:
			if action.Field != "" {
				result.RequiredFields = append(result.RequiredFields, action.Field)
			}
		}
	}
}

func (e *EvaluatorV2) evaluateDTWithTrace(ctx context.Context, rs *RuleSetV2, payload map[string]any, result *SimulationResult, mutations *[]fieldAction, behaviors *[]fieldAction) {
	if rs.DecisionTable == nil {
		return
	}

	dtResults, err := e.dtEvaluator.Evaluate(ctx, rs.DecisionTable, payload)
	if err != nil {
		result.Trace = append(result.Trace, SimulationTrace{
			RuleKey: rs.Name,
			Matched: false,
			Error:   err.Error(),
		})
		return
	}

	// Add trace for each row
	matchedRowIDs := make(map[string]bool)
	for _, r := range dtResults {
		matchedRowIDs[r.RowID] = true
	}
	for _, row := range rs.DecisionTable.Rows {
		if !row.Enabled {
			continue
		}
		trace := SimulationTrace{
			RuleKey:     rs.Name,
			RowID:       row.ID,
			Matched:     matchedRowIDs[row.ID],
			ConditionOK: matchedRowIDs[row.ID],
		}
		result.Trace = append(result.Trace, trace)
	}

	// Convert results to actions
	actions := DTResultsToActions(dtResults, rs.DecisionTable.Columns, rs.Name)
	for _, r := range dtResults {
		result.FiredRules = append(result.FiredRules, FiredRuleEntry{
			RuleKey:  rs.Name,
			RowID:    r.RowID,
			Priority: rs.Priority,
		})
	}
	tempResult := &EvalResultV2{Mutations: result.Mutations}
	e.processActions(actions, rs.Name, tempResult, mutations, behaviors)
	result.Blocked = tempResult.Blocked
	result.BlockMessage = tempResult.BlockMessage
	result.Warnings = append(result.Warnings, tempResult.Warnings...)
	result.ApprovalRequests = append(result.ApprovalRequests, tempResult.ApprovalRequests...)
	result.ServiceInvocations = append(result.ServiceInvocations, tempResult.ServiceInvocations...)
}

func (e *EvaluatorV2) evaluateConditionTreeWithTrace(rs *RuleSetV2, payload map[string]any, result *SimulationResult, mutations *[]fieldAction, behaviors *[]fieldAction) {
	if rs.Conditions == nil {
		return
	}

	matched := e.legacyEval.evaluateCondition(*rs.Conditions, payload)
	trace := SimulationTrace{
		RuleKey:     rs.Name,
		Matched:     matched,
		ConditionOK: matched,
	}

	if matched {
		result.FiredRules = append(result.FiredRules, FiredRuleEntry{
			RuleKey:  rs.Name,
			Priority: rs.Priority,
		})

		var actions []ActionV2
		for _, a := range rs.Actions {
			action := ActionV2{
				Type:    a.Type,
				Message: a.Message,
				Field:   a.Field,
			}
			if a.Value != nil {
				var v any
				_ = json.Unmarshal(a.Value, &v)
				action.Value = v
			}
			actions = append(actions, action)
		}
		trace.Actions = actions

		tempResult := &EvalResultV2{Mutations: result.Mutations}
		e.processActions(actions, rs.Name, tempResult, mutations, behaviors)
		result.Blocked = tempResult.Blocked
		result.BlockMessage = tempResult.BlockMessage
		result.Warnings = append(result.Warnings, tempResult.Warnings...)
		result.ApprovalRequests = append(result.ApprovalRequests, tempResult.ApprovalRequests...)
		result.ServiceInvocations = append(result.ServiceInvocations, tempResult.ServiceInvocations...)
	}

	result.Trace = append(result.Trace, trace)
}

// ─── Data Loading ────────────────────────────────────────────────────────────

func (e *EvaluatorV2) loadRuleSets(ctx context.Context, tenantID, entityType string) ([]RuleSetV2, error) {
	rows, err := e.pool.Query(ctx, `
		SELECT definition, content_type, classifications, priority, hit_policy, enabled, name
		FROM rule_set
		WHERE tenant_id = $1 AND entity_type = $2 AND enabled = true AND deleted_at IS NULL
		ORDER BY priority ASC, created_at ASC`,
		tenantID, entityType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return e.scanRuleSets(rows)
}

func (e *EvaluatorV2) loadRuleSetsForKey(ctx context.Context, tenantID, ruleSetKey string) ([]RuleSetV2, error) {
	// Try loading by name first (specific rule set for simulation)
	rows, err := e.pool.Query(ctx, `
		SELECT definition, content_type, classifications, priority, hit_policy, enabled, name
		FROM rule_set
		WHERE tenant_id = $1 AND (name = $2 OR entity_type = $2) AND deleted_at IS NULL
		ORDER BY priority ASC, created_at ASC`,
		tenantID, ruleSetKey)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return e.scanRuleSets(rows)
}

func (e *EvaluatorV2) scanRuleSets(rows interface{ Next() bool; Scan(...any) error; Err() error }) ([]RuleSetV2, error) {
	var sets []RuleSetV2
	for rows.Next() {
		var (
			definition      []byte
			contentType     string
			classifications []string
			priority        int
			hitPolicy       *string
			enabled         bool
			name            string
		)
		if err := rows.Scan(&definition, &contentType, &classifications, &priority, &hitPolicy, &enabled, &name); err != nil {
			continue
		}

		rs := RuleSetV2{
			Name:            name,
			ContentType:     ContentType(contentType),
			Classifications: toClassifications(classifications),
			Priority:        priority,
			Enabled:         enabled,
		}
		if rs.ContentType == "" {
			rs.ContentType = ContentTypeConditionTree
		}
		if hitPolicy != nil {
			rs.HitPolicy = HitPolicy(*hitPolicy)
		}

		// Unmarshal the definition based on content type
		switch rs.ContentType {
		case ContentTypeDecisionTable:
			var dt DecisionTable
			if err := json.Unmarshal(definition, &dt); err == nil {
				rs.DecisionTable = &dt
				if rs.HitPolicy != "" {
					rs.DecisionTable.HitPolicy = rs.HitPolicy
				}
			}
		default:
			var legacy RuleSet
			if err := json.Unmarshal(definition, &legacy); err == nil {
				rs.Conditions = &legacy.Definition.Conditions
				rs.Actions = legacy.Definition.Actions
			}
		}

		sets = append(sets, rs)
	}
	return sets, rows.Err()
}

func toClassifications(strs []string) []RuleClassification {
	if len(strs) == 0 {
		return nil
	}
	result := make([]RuleClassification, len(strs))
	for i, s := range strs {
		result[i] = RuleClassification(s)
	}
	return result
}
