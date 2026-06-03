package rules

import "encoding/json"

// Condition tree node
type Condition struct {
	// Logical combinators — children populated when type is AND/OR/NOT
	Type     string      `json:"type"` // AND, OR, NOT, FIELD
	Children []Condition `json:"children,omitempty"`

	// FIELD condition
	Field    string          `json:"field,omitempty"`
	Operator string          `json:"operator,omitempty"` // eq, neq, gt, gte, lt, lte, contains, startsWith, in, notIn, isNull, isNotNull
	Value    json.RawMessage `json:"value,omitempty"`
}

type ActionType string

const (
	ActionBlock    ActionType = "BLOCK"
	ActionWarn     ActionType = "WARN"
	ActionSetField ActionType = "SET_FIELD"
)

type Action struct {
	Type    ActionType      `json:"type"`
	Message string          `json:"message,omitempty"` // for BLOCK / WARN
	Field   string          `json:"field,omitempty"`   // for SET_FIELD
	Value   json.RawMessage `json:"value,omitempty"`   // for SET_FIELD
}

// RuleDefinition holds the condition tree and actions for a rule set.
// Stored as a nested object so the shape matches the frontend editor payload.
type RuleDefinition struct {
	Conditions Condition `json:"conditions"`
	Actions    []Action  `json:"actions"`
}

type RuleSet struct {
	ID         string         `json:"id"`
	EntityType string         `json:"entity_type"`
	Name       string         `json:"name"`
	Definition RuleDefinition `json:"definition"`
	Enabled    bool           `json:"enabled"`
}

type EvaluationResult struct {
	Blocked      bool           `json:"blocked"`
	Warnings     []string       `json:"warnings,omitempty"`
	Mutations    map[string]any `json:"mutations,omitempty"` // SET_FIELD changes to apply
	BlockMessage string         `json:"block_message,omitempty"`
}
