package rules

// types_v2.go defines types for the v2 rule engine: Decision Tables, hit policies,
// classifications, conflict resolution, execution plans, and field behaviors.

import "encoding/json"

// ─── Hit Policy ──────────────────────────────────────────────────────────────

// HitPolicy determines how matching rows in a Decision Table are aggregated.
type HitPolicy string

const (
	HitPolicyFirst     HitPolicy = "First"     // Return first matching row (stops evaluation)
	HitPolicyUnique    HitPolicy = "Unique"    // Exactly one row must match (error on 0 or 2+)
	HitPolicyAny       HitPolicy = "Any"       // All matches must produce identical outputs
	HitPolicyCollect   HitPolicy = "Collect"   // Return all matching rows as array
	HitPolicyPriority  HitPolicy = "Priority"  // Return highest-priority matching row
	HitPolicyRuleOrder HitPolicy = "RuleOrder" // Return all matches in definition order
)

// ─── Rule Classification ─────────────────────────────────────────────────────

// RuleClassification groups rules by business domain for UI filtering.
type RuleClassification string

const (
	ClassificationValidation   RuleClassification = "Validation"
	ClassificationDerivation   RuleClassification = "Derivation"
	ClassificationApproval     RuleClassification = "Approval"
	ClassificationFieldControl RuleClassification = "FieldControl"
	ClassificationEligibility  RuleClassification = "Eligibility"
	ClassificationExtension    RuleClassification = "Extension"
)

// ─── Decision Table Types ────────────────────────────────────────────────────

// ContentType distinguishes condition-tree rule sets from decision-table rule sets.
type ContentType string

const (
	ContentTypeConditionTree  ContentType = "condition_tree"
	ContentTypeDecisionTable  ContentType = "decision_table"
)

// DTColumnType indicates whether a column is an input (condition) or output (action).
type DTColumnType string

const (
	DTColumnInput  DTColumnType = "input"
	DTColumnOutput DTColumnType = "output"
)

// DTColumn defines a single column in a Decision Table.
type DTColumn struct {
	Key        string       `json:"key"`
	Label      string       `json:"label"`
	ColumnType DTColumnType `json:"column_type"`
	FieldPath  string       `json:"field_path,omitempty"`  // fact path for input columns (e.g. "entity.discount_pct")
	ActionType ActionType   `json:"action_type,omitempty"` // for output columns: SET_FIELD, FIELD_BEHAVIOR, etc.
	FieldName  string       `json:"field_name,omitempty"`  // target field for output actions
}

// DTCell holds a single cell's expression in a Decision Table row.
// For input columns: a JSONata expression that evaluates to boolean (match check).
// For output columns: a JSONata expression or literal value that produces the output.
type DTCell struct {
	ColumnKey  string `json:"column_key"`
	Expression string `json:"expression"` // JSONata expression; empty means "any" (always matches for input)
}

// DTRow is a single row in a Decision Table.
type DTRow struct {
	ID         string `json:"id"`
	Cells      []DTCell `json:"cells"`
	Priority   int      `json:"priority,omitempty"`   // used by Priority hit policy
	Annotation string   `json:"annotation,omitempty"` // human-readable note
	Enabled    bool     `json:"enabled"`
}

// DecisionTable is the complete definition of a decision table rule set.
type DecisionTable struct {
	Columns   []DTColumn `json:"columns"`
	Rows      []DTRow    `json:"rows"`
	HitPolicy HitPolicy  `json:"hit_policy"`
}

// DTResult is the output of evaluating a single matching row.
type DTResult struct {
	RowID        string         `json:"row_id"`
	RowIndex     int            `json:"row_index"`
	OutputValues map[string]any `json:"output_values"` // column_key → evaluated value
}

// ─── Field Behavior ──────────────────────────────────────────────────────────

// FieldBehaviorType controls how a field appears in the UI.
type FieldBehaviorType string

const (
	FieldBehaviorHidden    FieldBehaviorType = "hidden"
	FieldBehaviorReadonly  FieldBehaviorType = "readonly"
	FieldBehaviorMandatory FieldBehaviorType = "mandatory"
	FieldBehaviorEditable  FieldBehaviorType = "editable"
)

// fieldBehaviorPrecedence maps behavior types to numeric precedence.
// Higher number = more restrictive. Used by most_restrictive conflict resolution.
var fieldBehaviorPrecedence = map[FieldBehaviorType]int{
	FieldBehaviorEditable:  0,
	FieldBehaviorMandatory: 1,
	FieldBehaviorReadonly:  2,
	FieldBehaviorHidden:    3,
}

// MoreRestrictive returns true if a is more restrictive than b.
func (a FieldBehaviorType) MoreRestrictive(b FieldBehaviorType) bool {
	return fieldBehaviorPrecedence[a] > fieldBehaviorPrecedence[b]
}

// ─── Conflict Resolution ─────────────────────────────────────────────────────

// ResolutionType determines how conflicts between multiple rules writing the same field are resolved.
type ResolutionType string

const (
	ResolutionLastWriter      ResolutionType = "last_writer"
	ResolutionFirstWriter     ResolutionType = "first_writer"
	ResolutionMostRestrictive ResolutionType = "most_restrictive"
	ResolutionCustomRule      ResolutionType = "custom_rule"
)

// ConflictMatrixEntry defines the resolution strategy for a specific field in a rule set.
type ConflictMatrixEntry struct {
	ID               string         `json:"id"`
	TenantID         string         `json:"tenant_id"`
	RuleSetKey       string         `json:"rule_set_key"`
	FieldName        string         `json:"field_name"`
	ResolutionType   ResolutionType `json:"resolution_type"`
	CustomRuleKey    string         `json:"custom_rule_key,omitempty"`
	PriorityOverride *int           `json:"priority_override,omitempty"`
}

// ConflictLogEntry records a conflict that occurred during rule evaluation.
type ConflictLogEntry struct {
	Field      string `json:"field"`
	RuleKeyA   string `json:"rule_key_a"`
	RuleKeyB   string `json:"rule_key_b"`
	ActionA    any    `json:"action_a"`
	ActionB    any    `json:"action_b"`
	Resolution string `json:"resolution"` // which resolution strategy was applied
	Winner     string `json:"winner"`     // which rule's value was used
}

// ─── Rule Execution Plan ─────────────────────────────────────────────────────

// ExecutionStep represents one step in a composite RuleExecutionPlan.
type ExecutionStep struct {
	RuleSetKey  string `json:"rule_set_key"`
	ServiceCall string `json:"service_call,omitempty"` // optional service to invoke between rule evaluations
	Order       int    `json:"order"`
}

// RuleExecutionPlan defines the ordered evaluation sequence for complex rule flows.
// Example: PreValidation → DerivationService → PostValidation → ApprovalTrigger
type RuleExecutionPlan struct {
	ID         string          `json:"id"`
	Name       string          `json:"name"`
	EntityType string          `json:"entity_type"`
	Steps      []ExecutionStep `json:"steps"`
}

// ─── Execution Log Record ────────────────────────────────────────────────────

// RuleExecutionLog is written to the rule_execution_log table after each evaluation.
type RuleExecutionLog struct {
	TenantID         string             `json:"tenant_id"`
	RuleSetKey       string             `json:"rule_set_key"`
	EntityType       string             `json:"entity_type"`
	EntityID         string             `json:"entity_id,omitempty"`
	TriggerType      string             `json:"trigger_type"`
	FiredRules       []FiredRuleEntry   `json:"fired_rules"`
	Mutations        []MutationEntry    `json:"mutations"`
	Violations       []ViolationEntry   `json:"violations"`
	Warnings         []string           `json:"warnings"`
	FieldBehaviors   []FieldBehaviorLog `json:"field_behaviors"`
	ApprovalRequests []ApprovalRequest  `json:"approval_requests"`
	ConflictLog      []ConflictLogEntry `json:"conflict_log"`
	ExecutionMs      int                `json:"execution_ms"`
	IsSimulation     bool               `json:"is_simulation"`
}

// FiredRuleEntry records which rule fired during evaluation.
type FiredRuleEntry struct {
	RuleKey  string `json:"rule_key"`
	RuleID   string `json:"rule_id,omitempty"`
	RowID    string `json:"row_id,omitempty"` // for decision table rows
	Priority int    `json:"priority"`
}

// MutationEntry records a SET_FIELD mutation.
type MutationEntry struct {
	Field   string `json:"field"`
	Value   any    `json:"value"`
	RuleKey string `json:"rule_key"`
}

// ViolationEntry records a BLOCK action.
type ViolationEntry struct {
	Field   string `json:"field,omitempty"`
	Message string `json:"message"`
	RuleKey string `json:"rule_key"`
}

// FieldBehaviorLog records a FIELD_BEHAVIOR action.
type FieldBehaviorLog struct {
	Field    string            `json:"field"`
	Behavior FieldBehaviorType `json:"behavior"`
	RuleKey  string            `json:"rule_key"`
}

// ─── Extended Rule Set (v2) ──────────────────────────────────────────────────

// RuleSetV2 extends RuleSet with classification, content type, and decision table support.
type RuleSetV2 struct {
	ID              string               `json:"id"`
	EntityType      string               `json:"entity_type"`
	Name            string               `json:"name"`
	ContentType     ContentType          `json:"content_type"`
	Classifications []RuleClassification `json:"classifications"`
	Priority        int                  `json:"priority"`
	Enabled         bool                 `json:"enabled"`

	// For condition_tree content type (backward compatible)
	Conditions *Condition `json:"conditions,omitempty"`
	Actions    []Action   `json:"actions,omitempty"`

	// For decision_table content type
	DecisionTable *DecisionTable `json:"decision_table,omitempty"`
	HitPolicy     HitPolicy      `json:"hit_policy,omitempty"`
}

// UnmarshalRuleSetV2 deserializes a rule set definition supporting both v1 and v2 formats.
func UnmarshalRuleSetV2(data []byte) (*RuleSetV2, error) {
	var rs RuleSetV2
	if err := json.Unmarshal(data, &rs); err != nil {
		return nil, err
	}
	// Default content type for backward compatibility
	if rs.ContentType == "" {
		rs.ContentType = ContentTypeConditionTree
	}
	if rs.Priority == 0 {
		rs.Priority = 100
	}
	return &rs, nil
}
