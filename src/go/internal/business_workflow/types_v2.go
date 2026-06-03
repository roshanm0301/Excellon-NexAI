package business_workflow

import (
	"encoding/json"
	"time"
)

// Extended step types for DAG workflows
const (
	StepGateway       StepType = "gateway"
	StepServiceCall   StepType = "service_call"
	StepRuleEval      StepType = "rule_evaluation"
	StepWait          StepType = "wait"
	StepSubWorkflow   StepType = "sub_workflow"
	StepScript        StepType = "script"
)

// TriggerEvent constants for workflow bindings
const (
	TriggerOnCreate       = "on_create"
	TriggerOnUpdate       = "on_update"
	TriggerOnStatusChange = "on_status_change"
	TriggerOnFieldChange  = "on_field_change"
	TriggerManual         = "manual"
)

// ApprovalMode defines how multiple approvers interact.
type ApprovalMode string

const (
	ApprovalSequential ApprovalMode = "sequential" // One after another in order
	ApprovalParallel   ApprovalMode = "parallel"   // All at once, policy decides outcome
)

// ApprovalPolicy determines when parallel approval is considered complete.
type ApprovalPolicy string

const (
	PolicyUnanimous ApprovalPolicy = "unanimous" // All must approve
	PolicyMajority  ApprovalPolicy = "majority"  // >50% must approve
	PolicyAny       ApprovalPolicy = "any"       // First approval is sufficient
)

// ApproverDef identifies who can approve.
type ApproverDef struct {
	Type  string `json:"type"`            // "role", "user", "expression"
	Value string `json:"value"`           // Role name, user ID, or JSONata expression resolving to user/role
	Order int    `json:"order,omitempty"` // For sequential mode
}

// ApprovalConfig is stored in DAGNode.Config for approval-type steps.
type ApprovalConfig struct {
	Mode      ApprovalMode   `json:"mode"`
	Policy    ApprovalPolicy `json:"policy"`
	Approvers []ApproverDef  `json:"approvers"`
	Escalation *EscalationConfig `json:"escalation,omitempty"`
}

// EscalationConfig defines what happens when approval times out.
type EscalationConfig struct {
	TimeoutMins  int    `json:"timeoutMins"`
	EscalateTo   string `json:"escalateTo"`            // Role or user to escalate to
	AutoDecision string `json:"autoDecision,omitempty"` // "approve" or "reject" on final timeout
}

// ServiceCallConfig is stored in DAGNode.Config for service_call steps.
type ServiceCallConfig struct {
	ServiceKey string         `json:"serviceKey"`          // Registry key of the service
	Method     string         `json:"method"`              // Method/action to invoke
	Input      map[string]any `json:"input,omitempty"`     // Static input params
	InputExpr  string         `json:"inputExpr,omitempty"` // JSONata expression for dynamic input
	OutputMap  map[string]string `json:"outputMap,omitempty"` // Maps service output fields to workflow variables
}

// RuleEvalConfig is stored in DAGNode.Config for rule_evaluation steps.
type RuleEvalConfig struct {
	EntityType  string `json:"entityType"`
	TriggerType string `json:"triggerType,omitempty"`
}

// ScriptConfig is stored in DAGNode.Config for script steps.
type ScriptConfig struct {
	Expression string `json:"expression"` // JSONata expression to evaluate
	OutputVar  string `json:"outputVar"`  // Variable name to store result
}

// WaitConfig is stored in DAGNode.Config for wait steps.
type WaitConfig struct {
	DurationMins int    `json:"durationMins,omitempty"` // Wait for duration
	UntilEvent   string `json:"untilEvent,omitempty"`   // Wait for specific event
	UntilExpr    string `json:"untilExpr,omitempty"`    // JSONata condition to resume
}

// SubWorkflowConfig is stored in DAGNode.Config for sub_workflow steps.
type SubWorkflowConfig struct {
	DefinitionID string         `json:"definitionId"`
	InputMap     map[string]any `json:"inputMap,omitempty"`
}

// ApprovalRecord tracks a single approver's decision.
type ApprovalRecord struct {
	ID           string     `json:"id"`
	TenantID     string     `json:"tenantId"`
	InstanceID   string     `json:"instanceId"`
	StepID       string     `json:"stepId"`
	ApproverID   string     `json:"approverId,omitempty"`
	ApproverRole string     `json:"approverRole"`
	Decision     string     `json:"decision"` // "pending", "approved", "rejected"
	Comment      string     `json:"comment,omitempty"`
	DecidedAt    *time.Time `json:"decidedAt,omitempty"`
	CreatedAt    time.Time  `json:"createdAt"`
}

// WorkflowBinding maps entity events to workflow definitions.
type WorkflowBinding struct {
	ID           string     `json:"id"`
	TenantID     string     `json:"tenantId"`
	EntityType   string     `json:"entityType"`
	TriggerEvent string     `json:"triggerEvent"`
	DefinitionID string     `json:"definitionId"`
	Priority     int        `json:"priority"`
	Condition    string     `json:"condition,omitempty"` // JSONata condition — empty = always
	Enabled      bool       `json:"enabled"`
	CreatedBy    string     `json:"createdBy"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    time.Time  `json:"updatedAt"`
}

// WorkflowExecutionLog records step-level execution details.
type WorkflowExecutionLog struct {
	ID           string          `json:"id"`
	TenantID     string          `json:"tenantId"`
	InstanceID   string          `json:"instanceId"`
	StepID       string          `json:"stepId"`
	StepType     StepType        `json:"stepType"`
	Status       string          `json:"status"`
	InputData    json.RawMessage `json:"inputData,omitempty"`
	OutputData   json.RawMessage `json:"outputData,omitempty"`
	ErrorMessage string          `json:"errorMessage,omitempty"`
	StartedAt    time.Time       `json:"startedAt"`
	CompletedAt  *time.Time      `json:"completedAt,omitempty"`
	DurationMs   int             `json:"durationMs,omitempty"`
}

// ProcessDefinitionV2 extends ProcessDefinition with DAG support.
type ProcessDefinitionV2 struct {
	ID            string         `json:"id"`
	TenantID      string         `json:"tenantId"`
	Name          string         `json:"name"`
	EntityType    string         `json:"entityType"`
	Version       int            `json:"version"`
	TriggerEvent  string         `json:"triggerEvent,omitempty"`
	DAG           *DAGDefinition `json:"dag,omitempty"`
	Steps         []StepDefinition `json:"steps,omitempty"`    // Legacy linear steps (backward compat)
	InitialStep   string         `json:"initialStep,omitempty"` // Legacy
	CreatedBy     string         `json:"createdBy"`
	CreatedAt     time.Time      `json:"createdAt"`
	UpdatedAt     time.Time      `json:"updatedAt"`
}

// IsDAGWorkflow returns true if this definition uses the DAG model.
func (pd *ProcessDefinitionV2) IsDAGWorkflow() bool {
	return pd.DAG != nil && pd.DAG.StartNodeID != ""
}

// ProcessInstanceV2 extends ProcessInstance with DAG execution state.
type ProcessInstanceV2 struct {
	ID           string          `json:"id"`
	TenantID     string          `json:"tenantId"`
	DefinitionID string          `json:"definitionId"`
	EntityType   string          `json:"entityType"`
	EntityID     string          `json:"entityId"`
	CurrentStep  string          `json:"currentStep,omitempty"` // Legacy
	Status       string          `json:"status"`                // running, completed, failed, aborted, waiting
	DAGState     *DAGState       `json:"dagState,omitempty"`
	Context      json.RawMessage `json:"context"`
	ErrorMessage string          `json:"errorMessage,omitempty"`
	AbortReason  string          `json:"abortReason,omitempty"`
	StartedAt    *time.Time      `json:"startedAt,omitempty"`
	CompletedAt  *time.Time      `json:"completedAt,omitempty"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
}
