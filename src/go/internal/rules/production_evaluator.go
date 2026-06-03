package rules

import (
	"encoding/json"
	"fmt"
	"strings"
)

// ProductionEvaluator evaluates rule sets against an entity payload.
type ProductionEvaluator struct{}

func NewProductionEvaluator() *ProductionEvaluator {
	return &ProductionEvaluator{}
}

// EvaluateAll evaluates all enabled rule sets for an entity type against the given payload.
// Returns an aggregated EvaluationResult. A single BLOCK action causes blocked=true.
func (e *ProductionEvaluator) EvaluateAll(ruleSets []RuleSet, payload map[string]any) EvaluationResult {
	result := EvaluationResult{
		Mutations: map[string]any{},
	}

	for _, rs := range ruleSets {
		if !rs.Enabled {
			continue
		}
		if !e.evaluateCondition(rs.Definition.Conditions, payload) {
			continue
		}
		// Condition matched — apply actions
		for _, action := range rs.Definition.Actions {
			switch action.Type {
			case ActionBlock:
				result.Blocked = true
				msg := action.Message
				if msg == "" {
					msg = fmt.Sprintf("Rule %q blocked this operation", rs.Name)
				}
				result.BlockMessage = msg
				return result // short-circuit on first BLOCK

			case ActionWarn:
				msg := action.Message
				if msg == "" {
					msg = fmt.Sprintf("Warning from rule %q", rs.Name)
				}
				result.Warnings = append(result.Warnings, msg)

			case ActionSetField:
				if action.Field != "" && action.Value != nil {
					var v any
					if err := json.Unmarshal(action.Value, &v); err == nil {
						result.Mutations[action.Field] = v
					}
				}
			}
		}
	}

	return result
}

// evaluateCondition recursively evaluates a condition tree node.
func (e *ProductionEvaluator) evaluateCondition(cond Condition, payload map[string]any) bool {
	switch strings.ToUpper(cond.Type) {
	case "AND":
		for _, child := range cond.Children {
			if !e.evaluateCondition(child, payload) {
				return false
			}
		}
		return true

	case "OR":
		for _, child := range cond.Children {
			if e.evaluateCondition(child, payload) {
				return true
			}
		}
		return false

	case "NOT":
		if len(cond.Children) == 0 {
			return true
		}
		return !e.evaluateCondition(cond.Children[0], payload)

	case "FIELD", "":
		return e.evaluateFieldCondition(cond, payload)

	default:
		return false
	}
}

func (e *ProductionEvaluator) evaluateFieldCondition(cond Condition, payload map[string]any) bool {
	fieldVal := payload[cond.Field]

	// Decode the expected value
	var expected any
	if cond.Value != nil {
		_ = json.Unmarshal(cond.Value, &expected)
	}

	switch cond.Operator {
	case "isNull":
		return fieldVal == nil

	case "isNotNull":
		return fieldVal != nil

	case "eq":
		return compare(fieldVal, expected) == 0

	case "neq":
		return compare(fieldVal, expected) != 0

	case "gt":
		return compare(fieldVal, expected) > 0

	case "gte":
		return compare(fieldVal, expected) >= 0

	case "lt":
		return compare(fieldVal, expected) < 0

	case "lte":
		return compare(fieldVal, expected) <= 0

	case "contains":
		s, ok := fieldVal.(string)
		sub, ok2 := expected.(string)
		if !ok || !ok2 {
			return false
		}
		return strings.Contains(s, sub)

	case "startsWith":
		s, ok := fieldVal.(string)
		prefix, ok2 := expected.(string)
		if !ok || !ok2 {
			return false
		}
		return strings.HasPrefix(s, prefix)

	case "in":
		arr, ok := expected.([]any)
		if !ok {
			return false
		}
		for _, v := range arr {
			if compare(fieldVal, v) == 0 {
				return true
			}
		}
		return false

	case "notIn":
		arr, ok := expected.([]any)
		if !ok {
			return true
		}
		for _, v := range arr {
			if compare(fieldVal, v) == 0 {
				return false
			}
		}
		return true
	}

	return false
}

// compare returns -1, 0, or 1. Works for strings, numbers, and booleans.
func compare(a, b any) int {
	switch av := a.(type) {
	case string:
		bv, ok := b.(string)
		if !ok {
			return -1
		}
		if av < bv {
			return -1
		}
		if av > bv {
			return 1
		}
		return 0

	case float64:
		var bv float64
		switch bRaw := b.(type) {
		case float64:
			bv = bRaw
		case int:
			bv = float64(bRaw)
		case int64:
			bv = float64(bRaw)
		default:
			return -1
		}
		if av < bv {
			return -1
		}
		if av > bv {
			return 1
		}
		return 0

	case bool:
		bv, ok := b.(bool)
		if !ok {
			return -1
		}
		if av == bv {
			return 0
		}
		if av {
			return 1
		}
		return -1
	}
	// Fallback: string comparison
	as := fmt.Sprintf("%v", a)
	bs := fmt.Sprintf("%v", b)
	if as < bs {
		return -1
	}
	if as > bs {
		return 1
	}
	return 0
}
