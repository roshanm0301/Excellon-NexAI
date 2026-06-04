package entityruntime

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/rules"
	"github.com/excellon/nexai/internal/service"
	"github.com/jackc/pgx/v5"
)

type RuntimeRuleEvaluator interface {
	Evaluate(ctx context.Context, tenantID, entityType string, payload map[string]any, triggerType string) (*rules.EvalResultV2, error)
	EvaluateRuleSet(ctx context.Context, tenantID, ruleSetKey string, payload map[string]any, triggerType string) (*rules.EvalResultV2, error)
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

func (p *RuntimePolicy) LoadSchema(ctx context.Context, tenantID, entityType string) (*compiler.CompiledSchema, error) {
	if p == nil || p.pool == nil {
		return nil, nil
	}
	var raw []byte
	err := p.pool.QueryRow(ctx, `
		SELECT payload
		FROM compiled_artifact
		WHERE tenant_id = $1
		  AND artifact_key = $2
		  AND artifact_type = 'entity_schema'
		  AND status = 'active'
		ORDER BY created_at DESC
		LIMIT 1`,
		tenantID, entityType,
	).Scan(&raw)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("entity runtime: load compiled schema: %w", err)
	}
	var schema compiler.CompiledSchema
	if err := json.Unmarshal(raw, &schema); err != nil {
		return nil, fmt.Errorf("entity runtime: invalid compiled schema: %w", err)
	}
	return &schema, nil
}

func ResolveCreateStatus(schema *compiler.CompiledSchema, requested *string) (string, error) {
	if schema == nil || len(schema.Statuses) == 0 {
		if requested != nil && strings.TrimSpace(*requested) != "" {
			return strings.TrimSpace(*requested), nil
		}
		return "DRAFT", nil
	}
	initial := InitialStatus(schema)
	if initial == "" {
		return "", fmt.Errorf("entity lifecycle: no initial status configured")
	}
	if requested == nil || strings.TrimSpace(*requested) == "" {
		return initial, nil
	}
	status := strings.TrimSpace(*requested)
	if status != initial {
		return "", fmt.Errorf("entity lifecycle: records must be created in initial status %q", initial)
	}
	return status, nil
}

func InitialStatus(schema *compiler.CompiledSchema) string {
	if schema == nil {
		return ""
	}
	for _, status := range schema.Statuses {
		if status.Initial || status.IsInitial {
			return StatusKey(status)
		}
	}
	if len(schema.Statuses) > 0 {
		return StatusKey(schema.Statuses[0])
	}
	return ""
}

func StatusKey(status compiler.RawStatus) string {
	if status.Key != "" {
		return status.Key
	}
	return status.Name
}

func FindTransition(schema *compiler.CompiledSchema, fromStatus, command, toStatus string) (*compiler.RawTransition, error) {
	if schema == nil || len(schema.Transitions) == 0 {
		return nil, fmt.Errorf("entity lifecycle: no transitions configured")
	}
	for _, transition := range schema.Transitions {
		fromMatches := transition.From == "*" || transition.From == fromStatus
		commandMatches := command == "" || transition.Command == command || transition.Label == command
		toMatches := toStatus == "" || transition.To == toStatus
		if fromMatches && commandMatches && toMatches {
			matched := transition
			return &matched, nil
		}
	}
	if command != "" {
		return nil, fmt.Errorf("entity lifecycle: command %q is not allowed from status %q", command, fromStatus)
	}
	return nil, fmt.Errorf("entity lifecycle: transition %q -> %q is not allowed", fromStatus, toStatus)
}

func AvailableTransitions(schema *compiler.CompiledSchema, fromStatus, role string) []compiler.RawTransition {
	if schema == nil {
		return nil
	}
	var result []compiler.RawTransition
	for _, transition := range schema.Transitions {
		if transition.From != "*" && transition.From != fromStatus {
			continue
		}
		if !RoleAllowed(transition, role) {
			continue
		}
		result = append(result, transition)
	}
	return result
}

func RoleAllowed(transition compiler.RawTransition, role string) bool {
	guards := append([]string{}, transition.Roles...)
	guards = append(guards, transition.RoleGuards...)
	if len(guards) == 0 {
		return true
	}
	for _, allowed := range guards {
		if allowed == "*" || strings.EqualFold(allowed, role) {
			return true
		}
	}
	return false
}

func RuleGuards(transition compiler.RawTransition) []string {
	guards := append([]string{}, transition.RuleGuards...)
	guards = append(guards, transition.Guards...)
	seen := map[string]bool{}
	var result []string
	for _, guard := range guards {
		guard = strings.TrimSpace(guard)
		if guard == "" || seen[guard] {
			continue
		}
		seen[guard] = true
		result = append(result, guard)
	}
	return result
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

func ApplyRuleMutations(payload map[string]any, result *rules.EvalResultV2) map[string]any {
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

func ValidateRequiredFields(payload map[string]any, result *rules.EvalResultV2) error {
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
