package rules

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

type DecisionGraphClient struct {
	baseURL string
	http    *http.Client
}

func NewDecisionGraphClientFromEnv() *DecisionGraphClient {
	baseURL := strings.TrimRight(os.Getenv("ZEN_DECISION_URL"), "/")
	if baseURL == "" {
		return nil
	}
	return &DecisionGraphClient{
		baseURL: baseURL,
		http: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *DecisionGraphClient) Evaluate(ctx context.Context, graph *GoRulesDecisionGraph, input map[string]any) (map[string]any, error) {
	if c == nil || c.baseURL == "" {
		return nil, fmt.Errorf("decision graph service is not configured")
	}
	if graph == nil {
		return nil, fmt.Errorf("decision graph is empty")
	}

	body, err := json.Marshal(map[string]any{
		"context": input,
		"content": graph,
	})
	if err != nil {
		return nil, fmt.Errorf("decision graph request marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/api/simulate", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("decision graph service call failed: %w", err)
	}
	defer resp.Body.Close()

	var payload map[string]any
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, fmt.Errorf("decision graph response decode: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("decision graph service returned %d: %v", resp.StatusCode, payload)
	}
	return payload, nil
}

func applyDecisionGraphOutput(target *EvalResultV2, output any) {
	target.DecisionOutput = output
	m, ok := unwrapDecisionResult(output).(map[string]any)
	if !ok {
		return
	}

	if blocked, ok := m["blocked"].(bool); ok {
		target.Blocked = blocked
	}
	if msg, ok := firstString(m, "block_message", "blockMessage", "message"); ok {
		target.BlockMessage = msg
	}
	if warnings, ok := stringSlice(m["warnings"]); ok {
		target.Warnings = append(target.Warnings, warnings...)
	}
	if mutations, ok := m["mutations"].(map[string]any); ok {
		if target.Mutations == nil {
			target.Mutations = map[string]any{}
		}
		for k, v := range mutations {
			target.Mutations[k] = v
		}
	}
	if behaviors, ok := m["field_behaviors"].([]any); ok {
		target.FieldBehaviors = append(target.FieldBehaviors, parseFieldBehaviors(behaviors)...)
	} else if behaviors, ok := m["fieldBehaviors"].([]any); ok {
		target.FieldBehaviors = append(target.FieldBehaviors, parseFieldBehaviors(behaviors)...)
	}
	if approvals, ok := m["approval_requests"].([]any); ok {
		target.ApprovalRequests = append(target.ApprovalRequests, parseApprovalRequests(approvals)...)
	} else if approvals, ok := m["approvalRequests"].([]any); ok {
		target.ApprovalRequests = append(target.ApprovalRequests, parseApprovalRequests(approvals)...)
	}
}

func unwrapDecisionResult(output any) any {
	m, ok := output.(map[string]any)
	if !ok {
		return output
	}
	if result, exists := m["result"]; exists {
		return result
	}
	return output
}

func firstString(m map[string]any, keys ...string) (string, bool) {
	for _, key := range keys {
		if value, ok := m[key].(string); ok && value != "" {
			return value, true
		}
	}
	return "", false
}

func stringSlice(value any) ([]string, bool) {
	items, ok := value.([]any)
	if !ok {
		return nil, false
	}
	out := make([]string, 0, len(items))
	for _, item := range items {
		if s, ok := item.(string); ok {
			out = append(out, s)
		}
	}
	return out, true
}

func parseFieldBehaviors(items []any) []FieldBehaviorAction {
	out := make([]FieldBehaviorAction, 0, len(items))
	for _, item := range items {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		field, _ := m["field"].(string)
		behavior, _ := m["behavior"].(string)
		if field == "" || behavior == "" {
			continue
		}
		out = append(out, FieldBehaviorAction{
			Field:    field,
			Behavior: normalizeFieldBehavior(behavior),
		})
	}
	return out
}

func parseApprovalRequests(items []any) []ApprovalRequest {
	out := make([]ApprovalRequest, 0, len(items))
	for _, item := range items {
		m, ok := item.(map[string]any)
		if !ok {
			continue
		}
		req := ApprovalRequest{}
		req.Category, _ = m["category"].(string)
		req.Reason, _ = firstString(m, "reason", "message")
		req.ApproverRole, _ = firstString(m, "approver_role", "approverRole")
		req.Priority, _ = m["priority"].(string)
		out = append(out, req)
	}
	return out
}

func normalizeFieldBehavior(value string) FieldBehaviorType {
	switch strings.ToLower(value) {
	case "hidden":
		return FieldBehaviorHidden
	case "readonly", "read_only", "read-only", "disabled":
		return FieldBehaviorReadonly
	case "required", "mandatory":
		return FieldBehaviorMandatory
	default:
		return FieldBehaviorEditable
	}
}
