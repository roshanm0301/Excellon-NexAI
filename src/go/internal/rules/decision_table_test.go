package rules

import (
	"context"
	"testing"

	"github.com/excellon/nexai/internal/expression"
)

// newTestDTEvaluator creates a DTEvaluator with a passthrough expression engine.
// The expression engine uses direct JS eval (no jsonata bundle) for testing.
func newTestDTEvaluator() *DTEvaluator {
	eng := expression.NewEngine("") // passthrough mode — uses goja direct eval
	return NewDTEvaluator(eng)
}

func TestDecisionTable_HitPolicyFirst(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyFirst,
		Columns: []DTColumn{
			{Key: "c1", Label: "Discount %", ColumnType: DTColumnInput, FieldPath: "discount_pct"},
			{Key: "o1", Label: "Approval Required", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "needs_approval"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 20"},
				{ColumnKey: "o1", Expression: "true"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 10"},
				{ColumnKey: "o1", Expression: "'manager_only'"},
			}},
			{ID: "r3", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field <= 10"},
				{ColumnKey: "o1", Expression: "false"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	// Test: discount 25% → matches r1 first, stops
	results, err := eval.Evaluate(ctx, dt, map[string]any{"discount_pct": 25.0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].RowID != "r1" {
		t.Errorf("expected row r1, got %s", results[0].RowID)
	}

	// Test: discount 5% → matches r3
	results, err = eval.Evaluate(ctx, dt, map[string]any{"discount_pct": 5.0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].RowID != "r3" {
		t.Errorf("expected row r3, got %s", results[0].RowID)
	}
}

func TestDecisionTable_HitPolicyUnique_Success(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyUnique,
		Columns: []DTColumn{
			{Key: "c1", Label: "Status", ColumnType: DTColumnInput, FieldPath: "status"},
			{Key: "o1", Label: "Action", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "action"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field == 'draft'"},
				{ColumnKey: "o1", Expression: "'submit'"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field == 'open'"},
				{ColumnKey: "o1", Expression: "'close'"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	results, err := eval.Evaluate(ctx, dt, map[string]any{"status": "draft"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}
	if results[0].RowID != "r1" {
		t.Errorf("expected row r1, got %s", results[0].RowID)
	}
}

func TestDecisionTable_HitPolicyUnique_MultipleMatches(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyUnique,
		Columns: []DTColumn{
			{Key: "c1", Label: "Amount", ColumnType: DTColumnInput, FieldPath: "amount"},
			{Key: "o1", Label: "Result", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "result"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 10"},
				{ColumnKey: "o1", Expression: "'high'"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 5"},
				{ColumnKey: "o1", Expression: "'medium'"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	// amount=20 matches both r1 and r2 → Unique should error
	_, err := eval.Evaluate(ctx, dt, map[string]any{"amount": 20.0})
	if err == nil {
		t.Fatal("expected error for Unique policy with multiple matches")
	}
}

func TestDecisionTable_HitPolicyUnique_NoMatch(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyUnique,
		Columns: []DTColumn{
			{Key: "c1", Label: "Status", ColumnType: DTColumnInput, FieldPath: "status"},
			{Key: "o1", Label: "Result", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "result"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field == 'draft'"},
				{ColumnKey: "o1", Expression: "'go'"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	_, err := eval.Evaluate(ctx, dt, map[string]any{"status": "open"})
	if err == nil {
		t.Fatal("expected error for Unique policy with no matches")
	}
}

func TestDecisionTable_HitPolicyAny_IdenticalOutputs(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyAny,
		Columns: []DTColumn{
			{Key: "c1", Label: "Amount", ColumnType: DTColumnInput, FieldPath: "amount"},
			{Key: "o1", Label: "Tax Rate", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "tax_rate"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 100"},
				{ColumnKey: "o1", Expression: "0.18"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 50"},
				{ColumnKey: "o1", Expression: "0.18"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	// amount=200 matches both, but outputs are identical → OK
	results, err := eval.Evaluate(ctx, dt, map[string]any{"amount": 200.0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result (Any returns single), got %d", len(results))
	}
}

func TestDecisionTable_HitPolicyAny_DifferentOutputs(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyAny,
		Columns: []DTColumn{
			{Key: "c1", Label: "Amount", ColumnType: DTColumnInput, FieldPath: "amount"},
			{Key: "o1", Label: "Tax Rate", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "tax_rate"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 100"},
				{ColumnKey: "o1", Expression: "0.18"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 50"},
				{ColumnKey: "o1", Expression: "0.12"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	// amount=200 matches both, outputs differ → error
	_, err := eval.Evaluate(ctx, dt, map[string]any{"amount": 200.0})
	if err == nil {
		t.Fatal("expected error for Any policy with different outputs")
	}
}

func TestDecisionTable_HitPolicyCollect(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyCollect,
		Columns: []DTColumn{
			{Key: "c1", Label: "Role", ColumnType: DTColumnInput, FieldPath: "role"},
			{Key: "o1", Label: "Permission", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "permission"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: ""}, // wildcard — matches any
				{ColumnKey: "o1", Expression: "'read'"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field == 'manager' || $field == 'admin'"},
				{ColumnKey: "o1", Expression: "'write'"},
			}},
			{ID: "r3", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field == 'admin'"},
				{ColumnKey: "o1", Expression: "'delete'"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	// admin matches all 3 rows
	results, err := eval.Evaluate(ctx, dt, map[string]any{"role": "admin"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 3 {
		t.Fatalf("expected 3 results (Collect), got %d", len(results))
	}

	// viewer matches only r1 (wildcard)
	results, err = eval.Evaluate(ctx, dt, map[string]any{"role": "viewer"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result for viewer, got %d", len(results))
	}
}

func TestDecisionTable_HitPolicyPriority(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyPriority,
		Columns: []DTColumn{
			{Key: "c1", Label: "Amount", ColumnType: DTColumnInput, FieldPath: "amount"},
			{Key: "o1", Label: "Discount", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "discount"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Priority: 3, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 100"},
				{ColumnKey: "o1", Expression: "5"},
			}},
			{ID: "r2", Enabled: true, Priority: 1, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 100"},
				{ColumnKey: "o1", Expression: "15"},
			}},
			{ID: "r3", Enabled: true, Priority: 2, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 100"},
				{ColumnKey: "o1", Expression: "10"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	// All 3 match, but Priority(1) = r2 wins
	results, err := eval.Evaluate(ctx, dt, map[string]any{"amount": 500.0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result (Priority), got %d", len(results))
	}
	if results[0].RowID != "r2" {
		t.Errorf("expected r2 (priority 1), got %s", results[0].RowID)
	}
}

func TestDecisionTable_HitPolicyRuleOrder(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyRuleOrder,
		Columns: []DTColumn{
			{Key: "c1", Label: "Amount", ColumnType: DTColumnInput, FieldPath: "amount"},
			{Key: "o1", Label: "Tag", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "tag"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 50"},
				{ColumnKey: "o1", Expression: "'high_value'"},
			}},
			{ID: "r2", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field > 100"},
				{ColumnKey: "o1", Expression: "'premium'"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	results, err := eval.Evaluate(ctx, dt, map[string]any{"amount": 200.0})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 2 {
		t.Fatalf("expected 2 results (RuleOrder), got %d", len(results))
	}
	// Order must be r1 then r2 (definition order)
	if results[0].RowID != "r1" || results[1].RowID != "r2" {
		t.Errorf("expected [r1, r2], got [%s, %s]", results[0].RowID, results[1].RowID)
	}
}

func TestDecisionTable_DisabledRows(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyCollect,
		Columns: []DTColumn{
			{Key: "c1", ColumnType: DTColumnInput, FieldPath: "x"},
			{Key: "o1", ColumnType: DTColumnOutput, FieldName: "result"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: ""},
				{ColumnKey: "o1", Expression: "1"},
			}},
			{ID: "r2", Enabled: false, Cells: []DTCell{
				{ColumnKey: "c1", Expression: ""},
				{ColumnKey: "o1", Expression: "2"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	results, err := eval.Evaluate(ctx, dt, map[string]any{"x": 1})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 {
		t.Fatalf("expected 1 result (disabled row skipped), got %d", len(results))
	}
	if results[0].RowID != "r1" {
		t.Errorf("expected r1, got %s", results[0].RowID)
	}
}

func TestDecisionTable_EmptyTable(t *testing.T) {
	eval := newTestDTEvaluator()
	ctx := context.Background()

	// nil table
	results, err := eval.Evaluate(ctx, nil, map[string]any{})
	if err != nil {
		t.Fatalf("unexpected error for nil table: %v", err)
	}
	if results != nil {
		t.Errorf("expected nil results for nil table, got %v", results)
	}

	// empty rows
	dt := &DecisionTable{HitPolicy: HitPolicyFirst, Columns: []DTColumn{}, Rows: []DTRow{}}
	results, err = eval.Evaluate(ctx, dt, map[string]any{})
	if err != nil {
		t.Fatalf("unexpected error for empty table: %v", err)
	}
	if results != nil {
		t.Errorf("expected nil results for empty table, got %v", results)
	}
}

func TestDecisionTable_WildcardCell(t *testing.T) {
	dt := &DecisionTable{
		HitPolicy: HitPolicyFirst,
		Columns: []DTColumn{
			{Key: "c1", ColumnType: DTColumnInput, FieldPath: "x"},
			{Key: "c2", ColumnType: DTColumnInput, FieldPath: "y"},
			{Key: "o1", ColumnType: DTColumnOutput, FieldName: "result"},
		},
		Rows: []DTRow{
			{ID: "r1", Enabled: true, Cells: []DTCell{
				{ColumnKey: "c1", Expression: "$field == 'a'"},
				{ColumnKey: "c2", Expression: "-"}, // wildcard
				{ColumnKey: "o1", Expression: "'matched_a'"},
			}},
		},
	}

	eval := newTestDTEvaluator()
	ctx := context.Background()

	results, err := eval.Evaluate(ctx, dt, map[string]any{"x": "a", "y": "anything"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(results) != 1 || results[0].RowID != "r1" {
		t.Fatalf("expected match on r1 with wildcard c2")
	}
}

func TestDTResultsToActions(t *testing.T) {
	columns := []DTColumn{
		{Key: "o1", ColumnType: DTColumnOutput, ActionType: ActionSetField, FieldName: "discount"},
		{Key: "o2", ColumnType: DTColumnOutput, ActionType: ActionFieldBehavior, FieldName: "rate"},
	}
	results := []DTResult{
		{RowID: "r1", OutputValues: map[string]any{"discount": 15.0, "rate": "readonly"}},
	}

	actions := DTResultsToActions(results, columns, "test_ruleset")
	if len(actions) != 2 {
		t.Fatalf("expected 2 actions, got %d", len(actions))
	}

	foundSetField := false
	foundBehavior := false
	for _, a := range actions {
		if a.Type == ActionSetField && a.Field == "discount" {
			foundSetField = true
		}
		if a.Type == ActionFieldBehavior && a.Field == "rate" && a.Behavior == FieldBehaviorReadonly {
			foundBehavior = true
		}
	}
	if !foundSetField {
		t.Error("expected SET_FIELD action for discount")
	}
	if !foundBehavior {
		t.Error("expected FIELD_BEHAVIOR action for rate")
	}
}
