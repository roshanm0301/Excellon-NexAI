package rules

// decision_table.go implements the Decision Table evaluator with all 6 DMN hit policies.
// Each input cell is evaluated as a JSONata expression against the entity data.
// Output cells produce actions (SET_FIELD, FIELD_BEHAVIOR, REQUIRE_APPROVAL, etc.).

import (
	"context"
	"fmt"

	"github.com/excellon/nexai/internal/expression"
)

// DTEvaluator evaluates Decision Tables using the JSONata expression engine.
type DTEvaluator struct {
	exprEngine *expression.Engine
}

// NewDTEvaluator creates a new Decision Table evaluator.
func NewDTEvaluator(exprEngine *expression.Engine) *DTEvaluator {
	return &DTEvaluator{exprEngine: exprEngine}
}

// Evaluate runs a Decision Table against the provided data context.
// Returns matching row results according to the table's hit policy.
func (e *DTEvaluator) Evaluate(ctx context.Context, dt *DecisionTable, data map[string]any) ([]DTResult, error) {
	if dt == nil || len(dt.Rows) == 0 {
		return nil, nil
	}

	// Build column lookup maps
	inputCols := make(map[string]DTColumn)
	outputCols := make(map[string]DTColumn)
	for _, col := range dt.Columns {
		switch col.ColumnType {
		case DTColumnInput:
			inputCols[col.Key] = col
		case DTColumnOutput:
			outputCols[col.Key] = col
		}
	}

	// Evaluate each enabled row
	var matches []DTResult
	for rowIdx, row := range dt.Rows {
		if !row.Enabled {
			continue
		}

		matched, err := e.evaluateRow(ctx, row, inputCols, data)
		if err != nil {
			// Skip rows with evaluation errors (log but don't abort)
			continue
		}
		if !matched {
			continue
		}

		// Row matched — evaluate output cells
		outputs, err := e.evaluateOutputs(ctx, row, outputCols, data)
		if err != nil {
			continue
		}

		result := DTResult{
			RowID:        row.ID,
			RowIndex:     rowIdx,
			OutputValues: outputs,
		}
		matches = append(matches, result)

		// For First hit policy, stop at first match
		if dt.HitPolicy == HitPolicyFirst {
			break
		}
	}

	// Apply hit policy to matches
	return e.applyHitPolicy(dt.HitPolicy, matches, dt.Rows)
}

// evaluateRow checks if all input cells in a row match the data.
// An empty expression means "any" (always matches).
func (e *DTEvaluator) evaluateRow(ctx context.Context, row DTRow, inputCols map[string]DTColumn, data map[string]any) (bool, error) {
	for _, cell := range row.Cells {
		col, isInput := inputCols[cell.ColumnKey]
		if !isInput {
			continue // skip output cells during input evaluation
		}

		// Empty expression = wildcard (always matches)
		if cell.Expression == "" || cell.Expression == "-" {
			continue
		}

		// Build expression context: inject the field value as $field for convenience
		exprData := make(map[string]any, len(data)+1)
		for k, v := range data {
			exprData[k] = v
		}
		// Add the specific field value for simple comparisons
		if col.FieldPath != "" {
			fieldVal := resolveFieldPath(data, col.FieldPath)
			exprData["$field"] = fieldVal
		}

		result, err := e.exprEngine.Evaluate(ctx, cell.Expression, exprData)
		if err != nil {
			return false, fmt.Errorf("evaluate input cell [row=%s, col=%s]: %w", row.ID, cell.ColumnKey, err)
		}

		if !isTruthy(result) {
			return false, nil
		}
	}
	return true, nil
}

// evaluateOutputs evaluates all output cells for a matching row.
func (e *DTEvaluator) evaluateOutputs(ctx context.Context, row DTRow, outputCols map[string]DTColumn, data map[string]any) (map[string]any, error) {
	outputs := make(map[string]any)

	for _, cell := range row.Cells {
		col, isOutput := outputCols[cell.ColumnKey]
		if !isOutput {
			continue
		}
		if cell.Expression == "" {
			continue
		}

		result, err := e.exprEngine.Evaluate(ctx, cell.Expression, data)
		if err != nil {
			return nil, fmt.Errorf("evaluate output cell [row=%s, col=%s]: %w", row.ID, cell.ColumnKey, err)
		}

		// Use the column key, but also store the field_name mapping for action generation
		key := col.Key
		if col.FieldName != "" {
			key = col.FieldName
		}
		outputs[key] = result
	}

	return outputs, nil
}

// applyHitPolicy applies the hit policy to the collected matching rows.
func (e *DTEvaluator) applyHitPolicy(policy HitPolicy, matches []DTResult, allRows []DTRow) ([]DTResult, error) {
	switch policy {
	case HitPolicyFirst:
		// Already handled during evaluation (stops at first match)
		if len(matches) > 1 {
			return matches[:1], nil
		}
		return matches, nil

	case HitPolicyUnique:
		if len(matches) == 0 {
			return nil, fmt.Errorf("decision table: Unique hit policy requires exactly one match, got 0")
		}
		if len(matches) > 1 {
			return nil, fmt.Errorf("decision table: Unique hit policy requires exactly one match, got %d", len(matches))
		}
		return matches, nil

	case HitPolicyAny:
		if len(matches) == 0 {
			return nil, nil
		}
		// All matches must produce identical output values
		ref := matches[0].OutputValues
		for i := 1; i < len(matches); i++ {
			if !outputsEqual(ref, matches[i].OutputValues) {
				return nil, fmt.Errorf("decision table: Any hit policy requires all matches to produce identical outputs, rows %s and %s differ",
					matches[0].RowID, matches[i].RowID)
			}
		}
		return matches[:1], nil

	case HitPolicyCollect:
		return matches, nil

	case HitPolicyPriority:
		if len(matches) == 0 {
			return nil, nil
		}
		// Find the row with lowest priority number (highest priority)
		best := 0
		bestPriority := rowPriority(matches[0].RowIndex, allRows)
		for i := 1; i < len(matches); i++ {
			p := rowPriority(matches[i].RowIndex, allRows)
			if p < bestPriority {
				best = i
				bestPriority = p
			}
		}
		return []DTResult{matches[best]}, nil

	case HitPolicyRuleOrder:
		// Already in definition order (we iterate rows sequentially)
		return matches, nil

	default:
		// Fallback: treat as Collect
		return matches, nil
	}
}

// DTResultsToActions converts Decision Table results into rule actions.
func DTResultsToActions(results []DTResult, columns []DTColumn, ruleSetKey string) []ActionV2 {
	outputCols := make(map[string]DTColumn)
	for _, col := range columns {
		if col.ColumnType == DTColumnOutput {
			outputCols[col.Key] = col
		}
	}

	var actions []ActionV2
	for _, result := range results {
		for colKey, value := range result.OutputValues {
			col, ok := outputCols[colKey]
			if !ok {
				// Try matching by field_name
				for _, c := range columns {
					if c.FieldName == colKey && c.ColumnType == DTColumnOutput {
						col = c
						ok = true
						break
					}
				}
			}
			if !ok {
				continue
			}

			action := ActionV2{
				Field: col.FieldName,
				Value: value,
			}

			switch col.ActionType {
			case ActionSetField:
				action.Type = ActionSetField
			case ActionFieldBehavior:
				action.Type = ActionFieldBehavior
				if s, ok := value.(string); ok {
					action.Behavior = FieldBehaviorType(s)
				}
			case ActionRequireApproval:
				action.Type = ActionRequireApproval
				if s, ok := value.(string); ok {
					action.Category = s
				}
			case ActionBlock:
				action.Type = ActionBlock
				if s, ok := value.(string); ok {
					action.Message = s
				}
			case ActionWarn:
				action.Type = ActionWarn
				if s, ok := value.(string); ok {
					action.Message = s
				}
			default:
				action.Type = ActionSetField
			}

			actions = append(actions, action)
		}
	}
	return actions
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// resolveFieldPath resolves a dot-notation path in a map.
// Supports: "entity.field", "entity.nested.field"
func resolveFieldPath(data map[string]any, path string) any {
	parts := splitDotPath(path)
	var current any = data
	for _, part := range parts {
		m, ok := current.(map[string]any)
		if !ok {
			return nil
		}
		current = m[part]
	}
	return current
}

// splitDotPath splits a path like "entity.field.sub" into ["entity","field","sub"].
func splitDotPath(path string) []string {
	var parts []string
	start := 0
	for i := 0; i < len(path); i++ {
		if path[i] == '.' {
			if i > start {
				parts = append(parts, path[start:i])
			}
			start = i + 1
		}
	}
	if start < len(path) {
		parts = append(parts, path[start:])
	}
	return parts
}

// isTruthy checks if a JSONata expression result is truthy.
func isTruthy(val any) bool {
	if val == nil {
		return false
	}
	switch v := val.(type) {
	case bool:
		return v
	case float64:
		return v != 0
	case int64:
		return v != 0
	case string:
		return v != "" && v != "false"
	default:
		return true
	}
}

// outputsEqual compares two output value maps for equality.
func outputsEqual(a, b map[string]any) bool {
	if len(a) != len(b) {
		return false
	}
	for k, va := range a {
		vb, ok := b[k]
		if !ok {
			return false
		}
		if fmt.Sprintf("%v", va) != fmt.Sprintf("%v", vb) {
			return false
		}
	}
	return true
}

// rowPriority returns the priority value of a row by its index.
func rowPriority(rowIndex int, allRows []DTRow) int {
	if rowIndex < 0 || rowIndex >= len(allRows) {
		return 9999
	}
	p := allRows[rowIndex].Priority
	if p == 0 {
		return 9999 // no priority set = lowest
	}
	return p
}
