package business_workflow

import "testing"

func TestWorkflowServiceParamsStripsControlKeys(t *testing.T) {
	params := map[string]any{
		"method":         "validate",
		"failure_policy": "continue",
		"service_key":    "data_transform",
		"data":           map[string]any{"amount": 100},
	}

	input := workflowServiceParams(params)
	for _, key := range []string{"method", "failure_policy", "service_key"} {
		if _, ok := input[key]; ok {
			t.Fatalf("workflowServiceParams leaked control key %q", key)
		}
	}
	if _, ok := input["data"]; !ok {
		t.Fatal("workflowServiceParams should preserve business input")
	}
}

func TestWorkflowFailurePolicy(t *testing.T) {
	invocation := map[string]any{"failure_policy": "continue"}
	params := map[string]any{"failure_policy": "block"}

	if got := workflowFailurePolicy(invocation, params, "block"); got != "continue" {
		t.Fatalf("workflowFailurePolicy = %q, want continue", got)
	}
	if workflowShouldBlock("continue") {
		t.Fatal("continue failure policy should not block")
	}
	if !workflowShouldBlock("block") {
		t.Fatal("block failure policy should block")
	}
}
