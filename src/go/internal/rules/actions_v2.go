package rules

// actions_v2.go defines new action types for the v2 rule engine:
// REQUIRE_APPROVAL, FIELD_BEHAVIOR, INVOKE_SERVICE.
// These extend the existing BLOCK/WARN/SET_FIELD actions.

// Extended action type constants (supplement the existing ActionBlock/ActionWarn/ActionSetField).
const (
	ActionRequireApproval ActionType = "REQUIRE_APPROVAL"
	ActionFieldBehavior   ActionType = "FIELD_BEHAVIOR"
	ActionInvokeService   ActionType = "INVOKE_SERVICE"
	ActionRequireField    ActionType = "REQUIRE_FIELD"
	ActionNotify          ActionType = "NOTIFY"
	ActionEscalate        ActionType = "ESCALATE"
)

// ApprovalRequest is produced by REQUIRE_APPROVAL actions.
// The workflow layer collects all approval requests and routes them to the approval process.
type ApprovalRequest struct {
	Category     string `json:"category"`      // e.g. "DISCOUNT_EXCEPTION", "PRICE_OVERRIDE"
	Reason       string `json:"reason"`        // human-readable reason
	ApproverRole string `json:"approver_role"` // role that must approve
	Priority     string `json:"priority"`      // normal, high, critical
	RuleKey      string `json:"rule_key"`      // which rule triggered this
}

// FieldBehaviorAction is produced by FIELD_BEHAVIOR actions.
// The entity runtime returns these to the UI for dynamic field rendering.
type FieldBehaviorAction struct {
	Field    string            `json:"field"`
	Behavior FieldBehaviorType `json:"behavior"` // hidden, readonly, mandatory, editable
	RuleKey  string            `json:"rule_key"`
	Reason   string            `json:"reason,omitempty"`
}

// ServiceInvocation is produced by INVOKE_SERVICE actions.
// These are NOT executed inside the rule evaluator — they are collected and
// returned to the caller (entity runtime or workflow) for execution via the service registry.
type ServiceInvocation struct {
	ServiceKey string         `json:"service_key"`
	Params     map[string]any `json:"params,omitempty"`
	RuleKey    string         `json:"rule_key"`
}

// ─── Extended Evaluation Result ──────────────────────────────────────────────

// EvalResultV2 extends EvaluationResult with v2 action outputs.
// Maintains backward compatibility: Blocked, Warnings, Mutations remain the same.
type EvalResultV2 struct {
	// Backward-compatible fields
	Blocked      bool           `json:"blocked"`
	BlockMessage string         `json:"block_message,omitempty"`
	Warnings     []string       `json:"warnings,omitempty"`
	Mutations    map[string]any `json:"mutations,omitempty"`

	// V2 fields
	FieldBehaviors     []FieldBehaviorAction `json:"field_behaviors,omitempty"`
	ApprovalRequests   []ApprovalRequest     `json:"approval_requests,omitempty"`
	ServiceInvocations []ServiceInvocation   `json:"service_invocations,omitempty"`
	RequiredFields     []string              `json:"required_fields,omitempty"`
	ConflictLog        []ConflictLogEntry    `json:"conflict_log,omitempty"`

	// Trace (populated during simulation)
	FiredRules []FiredRuleEntry `json:"fired_rules,omitempty"`
	ExecutionMs int             `json:"execution_ms,omitempty"`
}

// ActionV2 extends Action with fields needed by v2 action types.
type ActionV2 struct {
	Type         ActionType        `json:"type"`
	Message      string            `json:"message,omitempty"`
	Field        string            `json:"field,omitempty"`
	Value        any               `json:"value,omitempty"`
	Behavior     FieldBehaviorType `json:"behavior,omitempty"`      // for FIELD_BEHAVIOR
	Category     string            `json:"category,omitempty"`      // for REQUIRE_APPROVAL
	ApproverRole string            `json:"approver_role,omitempty"` // for REQUIRE_APPROVAL
	Priority     string            `json:"priority,omitempty"`      // for REQUIRE_APPROVAL
	ServiceKey   string            `json:"service_key,omitempty"`   // for INVOKE_SERVICE
	Params       map[string]any    `json:"params,omitempty"`        // for INVOKE_SERVICE
}
