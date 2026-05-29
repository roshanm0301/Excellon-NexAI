package business_workflow

import (
	"encoding/json"
	"time"
)

type StepType string

const (
	StepHumanTask       StepType = "human_task"
	StepAutomatedAction StepType = "automated_action"
	StepApproval        StepType = "approval"
	StepNotification    StepType = "notification"
)

type Branch struct {
	Condition string `json:"condition"`
	NextStep  string `json:"nextStep"`
}

type StepDefinition struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Type         StepType `json:"type"`
	AssigneeRole string   `json:"assigneeRole,omitempty"`
	TimeoutHours int      `json:"timeoutHours,omitempty"`
	AutoAction   string   `json:"autoAction,omitempty"`
	Message      string   `json:"message,omitempty"`
	NextStep     string   `json:"nextStep,omitempty"`
	Branches     []Branch `json:"branches,omitempty"`
}

type ProcessDefinition struct {
	ID          string           `json:"id"`
	Name        string           `json:"name"`
	EntityType  string           `json:"entityType"`
	Steps       []StepDefinition `json:"steps"`
	InitialStep string           `json:"initialStep"`
}

type ProcessInstance struct {
	ID           string          `json:"id"`
	TenantID     string          `json:"tenantId"`
	DefinitionID string          `json:"definitionId"`
	EntityType   string          `json:"entityType"`
	EntityID     string          `json:"entityId"`
	CurrentStep  string          `json:"currentStep"`
	Status       string          `json:"status"`
	Context      json.RawMessage `json:"context"`
	CreatedAt    time.Time       `json:"createdAt"`
	UpdatedAt    time.Time       `json:"updatedAt"`
	AbortReason  string          `json:"abortReason,omitempty"`
}
