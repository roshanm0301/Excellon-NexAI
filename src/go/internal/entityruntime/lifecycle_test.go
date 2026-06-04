package entityruntime

import (
	"testing"

	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/rules"
)

func TestResolveCreateStatusUsesInitialLifecycleStatus(t *testing.T) {
	schema := &compiler.CompiledSchema{
		Statuses: []compiler.RawStatus{
			{Key: "DRAFT", Initial: true},
			{Key: "APPROVED"},
		},
	}

	status, err := ResolveCreateStatus(schema, nil)
	if err != nil {
		t.Fatalf("ResolveCreateStatus error: %v", err)
	}
	if status != "DRAFT" {
		t.Fatalf("status = %q, want DRAFT", status)
	}
}

func TestResolveCreateStatusRejectsNonInitialLifecycleStatus(t *testing.T) {
	requested := "APPROVED"
	schema := &compiler.CompiledSchema{
		Statuses: []compiler.RawStatus{
			{Key: "DRAFT", Initial: true},
			{Key: "APPROVED"},
		},
	}

	if _, err := ResolveCreateStatus(schema, &requested); err == nil {
		t.Fatal("expected non-initial create status to be rejected")
	}
}

func TestFindTransitionMatchesCommandAndStatus(t *testing.T) {
	schema := &compiler.CompiledSchema{
		Transitions: []compiler.RawTransition{
			{From: "DRAFT", To: "SUBMITTED", Command: "submit"},
			{From: "SUBMITTED", To: "APPROVED", Command: "approve"},
		},
	}

	transition, err := FindTransition(schema, "DRAFT", "submit", "")
	if err != nil {
		t.Fatalf("FindTransition error: %v", err)
	}
	if transition.To != "SUBMITTED" {
		t.Fatalf("transition.To = %q, want SUBMITTED", transition.To)
	}
}

func TestRoleAllowedHonorsRoleGuards(t *testing.T) {
	transition := compiler.RawTransition{From: "DRAFT", To: "APPROVED", RoleGuards: []string{"FINANCE"}}

	if RoleAllowed(transition, "SALES") {
		t.Fatal("SALES should not be allowed")
	}
	if !RoleAllowed(transition, "finance") {
		t.Fatal("finance should be allowed case-insensitively")
	}
}

func TestApplyRuleMutationsAndRequiredFields(t *testing.T) {
	payload := map[string]any{"amount": 100}
	result := &rules.EvalResultV2{
		Mutations:      map[string]any{"tax": 18},
		RequiredFields: []string{"amount", "tax"},
	}

	next := ApplyRuleMutations(payload, result)
	if next["tax"] != 18 {
		t.Fatalf("tax mutation = %v, want 18", next["tax"])
	}
	if err := ValidateRequiredFields(next, result); err != nil {
		t.Fatalf("ValidateRequiredFields error: %v", err)
	}
}

func TestServiceInvocationHelpers(t *testing.T) {
	params := map[string]any{
		"method":         "validate",
		"failure_policy": "continue",
		"async":          true,
		"service_key":    "data_transform",
		"data":           map[string]any{"amount": 100},
	}

	if got := ServiceMethod("", params); got != "validate" {
		t.Fatalf("ServiceMethod = %q, want validate", got)
	}
	if got := FailurePolicy("block", params); got != "continue" {
		t.Fatalf("FailurePolicy = %q, want continue", got)
	}
	if ShouldBlockOnFailure("continue") {
		t.Fatal("continue failure policy should not block")
	}
	input := ServiceInput(params)
	for _, key := range []string{"method", "failure_policy", "async", "service_key"} {
		if _, ok := input[key]; ok {
			t.Fatalf("ServiceInput leaked control key %q", key)
		}
	}
	if _, ok := input["data"]; !ok {
		t.Fatal("ServiceInput should keep business input")
	}
}

func TestApplyTransitionSetFieldActions(t *testing.T) {
	transition := compiler.RawTransition{
		From: "DRAFT",
		To:   "SUBMITTED",
		Actions: []compiler.RawTransitionAction{
			{Type: "set_field", Payload: map[string]any{"field": "submitted_by", "value": "system"}},
		},
	}

	payload, results, err := applyTransitionSetFieldActions(transition, map[string]any{"amount": 100})
	if err != nil {
		t.Fatalf("applyTransitionSetFieldActions error: %v", err)
	}
	if payload["submitted_by"] != "system" {
		t.Fatalf("submitted_by = %v, want system", payload["submitted_by"])
	}
	if len(results) != 1 || results[0].Status != "completed" {
		t.Fatalf("results = %+v, want one completed result", results)
	}
}
