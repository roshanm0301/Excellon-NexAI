package entityruntime

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/service"
)

type RuntimeRuleEvaluator interface {
	Evaluate(ctx context.Context, tenantID, entityType string, payload map[string]any, triggerType string) (*EvalResultV2, error)
}

type RuntimePolicy struct {
	pool           *db.Pool
	ruleEvaluator  RuntimeRuleEvaluator
	serviceInvoker RuntimeServiceInvoker
}

type RuntimeServiceInvoker interface {
	Invoke(ctx context.Context, req *service.InvokeRequest) (*service.InvokeResponse, error)
}

func NewRuntimePolicy(pool *db.Pool, ruleEvaluator RuntimeRuleEvaluator) *RuntimePolicy {
	return &RuntimePolicy{pool: pool, ruleEvaluator: ruleEvaluator}
}

func (p *RuntimePolicy) SetServiceInvoker(invoker RuntimeServiceInvoker) {
	p.serviceInvoker = invoker
}

func PayloadMap(raw json.RawMessage) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil || payload == nil {
		return map[string]any{}
	}
	return payload
}

func PayloadBytes(payload map[string]any) json.RawMessage {
	if payload == nil {
		return json.RawMessage(`{}`)
	}
	raw, err := json.Marshal(payload)
	if err != nil {
		return json.RawMessage(`{}`)
	}
	return raw
}

func ApplyRuleMutations(payload map[string]any, result *EvalResultV2) map[string]any {
	if payload == nil {
		payload = map[string]any{}
	}
	if result == nil || len(result.Mutations) == 0 {
		return payload
	}
	next := make(map[string]any, len(payload)+len(result.Mutations))
	for k, v := range payload {
		next[k] = v
	}
	for field, value := range result.Mutations {
		if strings.TrimSpace(field) == "" {
			continue
		}
		next[field] = value
	}
	return next
}

func ValidateRequiredFields(payload map[string]any, result *EvalResultV2) error {
	if result == nil {
		return nil
	}
	for _, field := range result.RequiredFields {
		value, ok := payload[field]
		if !ok || value == nil {
			return fmt.Errorf("field %q is required by rule", field)
		}
		if s, ok := value.(string); ok && strings.TrimSpace(s) == "" {
			return fmt.Errorf("field %q is required by rule", field)
		}
	}
	return nil
}

func RuleFacts(entityType, entityID, status string, payload map[string]any) map[string]any {
	facts := make(map[string]any, len(payload)+4)
	for k, v := range payload {
		facts[k] = v
	}
	facts["entity_type"] = entityType
	facts["entity_id"] = entityID
	facts["status"] = status
	facts["entity"] = payload
	return facts
}

func ServiceMethod(method string, params map[string]any) string {
	if strings.TrimSpace(method) != "" {
		return strings.TrimSpace(method)
	}
	if params != nil {
		if value, ok := params["method"].(string); ok && strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return "execute"
}

func ServiceInput(params map[string]any) map[string]any {
	input := map[string]any{}
	for k, v := range params {
		switch k {
		case "method", "failure_policy", "failurePolicy", "async", "service_key", "serviceKey":
			continue
		default:
			input[k] = v
		}
	}
	return input
}

func FailurePolicy(defaultPolicy string, payload map[string]any) string {
	for _, key := range []string{"failure_policy", "failurePolicy"} {
		if value, ok := payload[key].(string); ok && strings.TrimSpace(value) != "" {
			return strings.ToLower(strings.TrimSpace(value))
		}
	}
	if strings.TrimSpace(defaultPolicy) != "" {
		return strings.ToLower(strings.TrimSpace(defaultPolicy))
	}
	return "block"
}

func ShouldBlockOnFailure(policy string) bool {
	switch strings.ToLower(strings.TrimSpace(policy)) {
	case "continue", "ignore", "non_blocking", "non-blocking":
		return false
	default:
		return true
	}
}
