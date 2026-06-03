package rules

import (
	"testing"
)

func TestConflictResolver_LastWriter(t *testing.T) {
	cr := &ConflictResolver{cache: make(map[string]*matrixCacheEntry)}
	matrix := map[string]ConflictMatrixEntry{
		"discount": {FieldName: "discount", ResolutionType: ResolutionLastWriter},
	}

	actions := []fieldAction{
		{field: "discount", value: 10.0, ruleKey: "rule_a", priority: 1},
		{field: "discount", value: 15.0, ruleKey: "rule_b", priority: 2},
		{field: "discount", value: 20.0, ruleKey: "rule_c", priority: 3},
	}

	winner, logEntry := cr.ResolveFieldConflicts(matrix, "discount", actions)
	if winner.value != 20.0 {
		t.Errorf("expected last writer value 20, got %v", winner.value)
	}
	if winner.ruleKey != "rule_c" {
		t.Errorf("expected winner rule_c, got %s", winner.ruleKey)
	}
	if logEntry == nil {
		t.Fatal("expected conflict log entry")
	}
	if logEntry.Resolution != "last_writer" {
		t.Errorf("expected resolution last_writer, got %s", logEntry.Resolution)
	}
}

func TestConflictResolver_FirstWriter(t *testing.T) {
	cr := &ConflictResolver{cache: make(map[string]*matrixCacheEntry)}
	matrix := map[string]ConflictMatrixEntry{
		"rate": {FieldName: "rate", ResolutionType: ResolutionFirstWriter},
	}

	actions := []fieldAction{
		{field: "rate", value: 100.0, ruleKey: "rule_a", priority: 1},
		{field: "rate", value: 200.0, ruleKey: "rule_b", priority: 2},
	}

	winner, logEntry := cr.ResolveFieldConflicts(matrix, "rate", actions)
	if winner.value != 100.0 {
		t.Errorf("expected first writer value 100, got %v", winner.value)
	}
	if winner.ruleKey != "rule_a" {
		t.Errorf("expected winner rule_a, got %s", winner.ruleKey)
	}
	if logEntry == nil {
		t.Fatal("expected conflict log entry")
	}
	if logEntry.Resolution != "first_writer" {
		t.Errorf("expected resolution first_writer, got %s", logEntry.Resolution)
	}
}

func TestConflictResolver_MostRestrictive(t *testing.T) {
	cr := &ConflictResolver{cache: make(map[string]*matrixCacheEntry)}
	matrix := map[string]ConflictMatrixEntry{
		"price": {FieldName: "price", ResolutionType: ResolutionMostRestrictive},
	}

	actions := []fieldAction{
		{field: "price", behaviorType: FieldBehaviorEditable, ruleKey: "rule_a", priority: 1},
		{field: "price", behaviorType: FieldBehaviorMandatory, ruleKey: "rule_b", priority: 2},
		{field: "price", behaviorType: FieldBehaviorReadonly, ruleKey: "rule_c", priority: 3},
	}

	winner, logEntry := cr.ResolveFieldConflicts(matrix, "price", actions)
	if winner.behaviorType != FieldBehaviorReadonly {
		t.Errorf("expected most restrictive = readonly, got %s", winner.behaviorType)
	}
	if winner.ruleKey != "rule_c" {
		t.Errorf("expected winner rule_c, got %s", winner.ruleKey)
	}
	if logEntry == nil {
		t.Fatal("expected conflict log entry")
	}
}

func TestConflictResolver_MostRestrictive_HiddenWins(t *testing.T) {
	cr := &ConflictResolver{cache: make(map[string]*matrixCacheEntry)}
	matrix := map[string]ConflictMatrixEntry{
		"secret": {FieldName: "secret", ResolutionType: ResolutionMostRestrictive},
	}

	actions := []fieldAction{
		{field: "secret", behaviorType: FieldBehaviorReadonly, ruleKey: "rule_a"},
		{field: "secret", behaviorType: FieldBehaviorHidden, ruleKey: "rule_b"},
		{field: "secret", behaviorType: FieldBehaviorMandatory, ruleKey: "rule_c"},
	}

	winner, _ := cr.ResolveFieldConflicts(matrix, "secret", actions)
	if winner.behaviorType != FieldBehaviorHidden {
		t.Errorf("expected hidden (most restrictive), got %s", winner.behaviorType)
	}
}

func TestConflictResolver_DefaultResolution(t *testing.T) {
	cr := &ConflictResolver{cache: make(map[string]*matrixCacheEntry)}
	// Empty matrix — no explicit resolution defined → default to last_writer
	matrix := map[string]ConflictMatrixEntry{}

	actions := []fieldAction{
		{field: "tax", value: 0.12, ruleKey: "rule_a"},
		{field: "tax", value: 0.18, ruleKey: "rule_b"},
	}

	winner, logEntry := cr.ResolveFieldConflicts(matrix, "tax", actions)
	if winner.value != 0.18 {
		t.Errorf("expected default (last_writer) value 0.18, got %v", winner.value)
	}
	if logEntry == nil {
		t.Fatal("expected conflict log entry even with default resolution")
	}
	if logEntry.Resolution != "last_writer" {
		t.Errorf("expected resolution last_writer, got %s", logEntry.Resolution)
	}
}

func TestConflictResolver_NoConflict(t *testing.T) {
	cr := &ConflictResolver{cache: make(map[string]*matrixCacheEntry)}
	matrix := map[string]ConflictMatrixEntry{}

	// Single action — no conflict
	actions := []fieldAction{
		{field: "name", value: "test", ruleKey: "rule_a"},
	}

	winner, logEntry := cr.ResolveFieldConflicts(matrix, "name", actions)
	if winner.value != "test" {
		t.Errorf("expected value test, got %v", winner.value)
	}
	if logEntry != nil {
		t.Error("expected no conflict log entry for single action")
	}
}

func TestConflictResolver_GroupByField(t *testing.T) {
	actions := []fieldAction{
		{field: "a", value: 1, ruleKey: "r1"},
		{field: "b", value: 2, ruleKey: "r2"},
		{field: "a", value: 3, ruleKey: "r3"},
		{field: "b", value: 4, ruleKey: "r4"},
		{field: "c", value: 5, ruleKey: "r5"},
	}

	grouped := groupByField(actions)
	if len(grouped["a"]) != 2 {
		t.Errorf("expected 2 actions for field 'a', got %d", len(grouped["a"]))
	}
	if len(grouped["b"]) != 2 {
		t.Errorf("expected 2 actions for field 'b', got %d", len(grouped["b"]))
	}
	if len(grouped["c"]) != 1 {
		t.Errorf("expected 1 action for field 'c', got %d", len(grouped["c"]))
	}
}

func TestFieldBehaviorType_MoreRestrictive(t *testing.T) {
	tests := []struct {
		a, b     FieldBehaviorType
		expected bool
	}{
		{FieldBehaviorHidden, FieldBehaviorReadonly, true},
		{FieldBehaviorReadonly, FieldBehaviorMandatory, true},
		{FieldBehaviorMandatory, FieldBehaviorEditable, true},
		{FieldBehaviorEditable, FieldBehaviorHidden, false},
		{FieldBehaviorReadonly, FieldBehaviorHidden, false},
		{FieldBehaviorEditable, FieldBehaviorEditable, false},
	}

	for _, tt := range tests {
		result := tt.a.MoreRestrictive(tt.b)
		if result != tt.expected {
			t.Errorf("%s.MoreRestrictive(%s) = %v, want %v", tt.a, tt.b, result, tt.expected)
		}
	}
}
