package entityruntime

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strconv"
	"strings"
	"time"

	business_workflow "github.com/excellon/nexai/internal/business_workflow"
	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/rules"
	"github.com/excellon/nexai/internal/service"
	"github.com/jackc/pgx/v5"
)

func (h *Handler) executeRuleServiceInvocations(ctx context.Context, tenantID, entityType, entityID string, result *rules.EvalResultV2) error {
	if result == nil || len(result.ServiceInvocations) == 0 {
		return nil
	}
	for _, invocation := range result.ServiceInvocations {
		method := ServiceMethod(invocation.Method, invocation.Params)
		policy := FailurePolicy("block", invocation.Params)
		entry := rules.ServiceInvocationResult{
			ServiceKey: invocation.ServiceKey,
			Method:     method,
			RuleKey:    invocation.RuleKey,
		}

		if strings.TrimSpace(invocation.ServiceKey) == "" {
			entry.Error = "service_key is required"
			result.ServiceResults = append(result.ServiceResults, entry)
			if ShouldBlockOnFailure(policy) {
				return fmt.Errorf("rule service invocation failed: %s", entry.Error)
			}
			continue
		}
		if h.policy == nil || h.policy.serviceInvoker == nil {
			entry.Error = "service registry is not wired"
			result.ServiceResults = append(result.ServiceResults, entry)
			if ShouldBlockOnFailure(policy) {
				return fmt.Errorf("rule service invocation failed: %s", entry.Error)
			}
			continue
		}

		resp, err := h.policy.serviceInvoker.Invoke(ctx, &service.InvokeRequest{
			ServiceKey: invocation.ServiceKey,
			Method:     method,
			TenantID:   tenantID,
			Caller:     fmt.Sprintf("rule:%s:entity:%s/%s", invocation.RuleKey, entityType, entityID),
			Input:      ServiceInput(invocation.Params),
		})
		if err != nil {
			entry.Error = err.Error()
			result.ServiceResults = append(result.ServiceResults, entry)
			if ShouldBlockOnFailure(policy) {
				return fmt.Errorf("rule service invocation failed: %w", err)
			}
			continue
		}
		entry.Success = resp.Success
		entry.Output = resp.Output
		entry.Error = resp.Error
		result.ServiceResults = append(result.ServiceResults, entry)
		if !resp.Success && ShouldBlockOnFailure(policy) {
			if entry.Error == "" {
				entry.Error = "service returned an unsuccessful response"
			}
			return fmt.Errorf("rule service invocation failed: %s", entry.Error)
		}
	}
	return nil
}

func applyTransitionSetFieldActions(transition compiler.RawTransition, payload map[string]any) (map[string]any, []TransitionActionResult, error) {
	if payload == nil {
		payload = map[string]any{}
	}
	next := make(map[string]any, len(payload))
	for k, v := range payload {
		next[k] = v
	}
	var results []TransitionActionResult
	for _, action := range transition.Actions {
		if normalizeActionType(action.Type) != "set_field" {
			continue
		}
		params := actionPayload(action)
		field := stringFromMap(params, "field", "field_name", "fieldName", "key")
		if field == "" {
			result := TransitionActionResult{Type: action.Type, Status: "failed", Error: "set_field action requires field"}
			results = append(results, result)
			if ShouldBlockOnFailure(actionFailurePolicy("block", action)) {
				return next, results, fmt.Errorf("%s", result.Error)
			}
			continue
		}
		value, ok := params["value"]
		if !ok {
			value = params["default_value"]
		}
		next[field] = value
		results = append(results, TransitionActionResult{
			Type:   action.Type,
			Status: "completed",
			Output: map[string]any{"field": field, "value": value},
		})
	}
	return next, results, nil
}

func (h *Handler) updateTransitionWithDBActions(ctx context.Context, tenantID, entityType, entityID, userID, fromStatus string, payload json.RawMessage, schema *compiler.CompiledSchema, transition *compiler.RawTransition, note string) (*EntityRecord, []TransitionActionResult, error) {
	if h.pool == nil {
		rec, err := h.repo.UpdateWithStatus(ctx, tenantID, entityType, entityID, userID, payload, transition.To)
		if err != nil {
			return nil, nil, err
		}
		h.recordTransition(ctx, tenantID, entityType, entityID, fromStatus, transition.To, transition.Command, userID, note)
		return rec, nil, nil
	}

	tx, err := h.pool.Begin(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("begin lifecycle transition: %w", err)
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil && err != pgx.ErrTxClosed {
			slog.Warn("entity runtime: transition rollback failed", "error", err, "entity_type", entityType, "entity_id", entityID)
		}
	}()

	rec, err := updateWithStatusTx(ctx, tx, tenantID, entityType, entityID, userID, payload, transition.To)
	if err != nil {
		return nil, nil, err
	}

	actionResults, err := h.executeTransitionDBActionsTx(ctx, tx, tenantID, entityType, entityID, userID, rec, schema, transition)
	if err != nil {
		return nil, actionResults, err
	}
	if err := recordTransitionTx(ctx, tx, tenantID, entityType, entityID, fromStatus, transition.To, transition.Command, userID, note); err != nil {
		return nil, actionResults, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, actionResults, fmt.Errorf("commit lifecycle transition: %w", err)
	}
	return rec, actionResults, nil
}

func updateWithStatusTx(ctx context.Context, tx pgx.Tx, tenantID, entityType, id, updatedBy string, payload []byte, status string) (*EntityRecord, error) {
	const q = `
		UPDATE entity_record
		SET payload = $4, status = $5, updated_by = $6, updated_at = now(), version_no = version_no + 1
		WHERE id = $1 AND tenant_id = $2 AND entity_type = $3 AND deleted_at IS NULL
		RETURNING id, entity_type, COALESCE(entity_category,''), tenant_id, COALESCE(node_id,''),
		          status, version_no, created_by, updated_by, created_at, updated_at,
		          deleted_at, COALESCE(deleted_by,''), payload`
	rec, err := scanRecord(tx.QueryRow(ctx, q, id, tenantID, entityType, payload, status, updatedBy))
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("entity %s/%s: not found", entityType, id)
	}
	return rec, err
}

func (h *Handler) executeTransitionDBActionsTx(ctx context.Context, tx pgx.Tx, tenantID, entityType, entityID, userID string, rec *EntityRecord, schema *compiler.CompiledSchema, transition *compiler.RawTransition) ([]TransitionActionResult, error) {
	var results []TransitionActionResult
	for _, action := range transition.Actions {
		actionType := normalizeActionType(action.Type)
		switch actionType {
		case "set_field", "notify", "run_process":
			continue
		case "create_task":
			result, err := createTransitionTaskTx(ctx, tx, tenantID, entityType, entityID, action, transition)
			results = append(results, result)
			if err != nil && ShouldBlockOnFailure(actionFailurePolicy("block", action)) {
				return results, err
			}
		case "sla":
			result, err := createSLARecordTx(ctx, tx, tenantID, entityType, entityID, action, transition.To)
			results = append(results, result)
			if err != nil && ShouldBlockOnFailure(actionFailurePolicy("block", action)) {
				return results, err
			}
		default:
			if actionType == "" {
				continue
			}
			result := TransitionActionResult{Type: action.Type, Status: "failed", Error: fmt.Sprintf("unknown transition action %q", action.Type)}
			results = append(results, result)
			if ShouldBlockOnFailure(actionFailurePolicy("block", action)) {
				return results, fmt.Errorf("%s", result.Error)
			}
		}
	}

	if status := statusByKey(schema, rec.Status); status != nil && status.SLAHours > 0 {
		result, err := createStatusSLARecordTx(ctx, tx, tenantID, entityType, entityID, rec.Status, status.SLAHours)
		results = append(results, result)
		if err != nil {
			return results, err
		}
	}
	_ = userID
	return results, nil
}

func createTransitionTaskTx(ctx context.Context, tx pgx.Tx, tenantID, entityType, entityID string, action compiler.RawTransitionAction, transition *compiler.RawTransition) (TransitionActionResult, error) {
	params := actionPayload(action)
	taskType := stringFromMap(params, "task_type", "taskType", "task_key", "taskKey")
	if taskType == "" {
		taskType = transition.Command
	}
	if taskType == "" {
		taskType = "transition_task"
	}
	title := stringFromMap(params, "title")
	if title == "" {
		title = fmt.Sprintf("Review %s %s", entityType, entityID)
	}
	description := stringFromMap(params, "description")
	assigneeRole := stringFromMap(params, "assignee_role", "assigneeRole", "role")
	dueAt := dueAtFromHours(intFromMap(params, "due_hours", "dueHours", "timeout_hours", "timeoutHours"))

	var taskID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO human_task (tenant_id, entity_type, entity_id, task_type, assigned_role, title, description, due_at, status)
		VALUES ($1, $2, $3, $4, NULLIF($5,''), $6, NULLIF($7,''), $8, 'open')
		RETURNING id`,
		tenantID, entityType, entityID, taskType, assigneeRole, title, description, dueAt,
	).Scan(&taskID); err != nil {
		result := TransitionActionResult{Type: action.Type, Status: "failed", Error: fmt.Sprintf("create_task failed: %v", err)}
		return result, fmt.Errorf("%s", result.Error)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO workflow_human_task (tenant_id, entity_type, entity_id, task_key, title, assignee_role, due_at, status)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6,''), $7, 'pending')`,
		tenantID, entityType, entityID, taskType, title, assigneeRole, dueAt,
	); err != nil {
		result := TransitionActionResult{Type: action.Type, Status: "failed", Error: fmt.Sprintf("workflow task mirror failed: %v", err)}
		return result, fmt.Errorf("%s", result.Error)
	}
	return TransitionActionResult{
		Type:   action.Type,
		Status: "completed",
		Output: map[string]any{"task_id": taskID, "task_type": taskType, "assignee_role": assigneeRole},
	}, nil
}

func createSLARecordTx(ctx context.Context, tx pgx.Tx, tenantID, entityType, entityID string, action compiler.RawTransitionAction, status string) (TransitionActionResult, error) {
	params := actionPayload(action)
	slaKey := stringFromMap(params, "sla_key", "slaKey", "key")
	if slaKey == "" {
		slaKey = "transition:" + status
	}
	hours := intFromMap(params, "due_hours", "dueHours", "hours")
	if hours <= 0 {
		hours = 24
	}
	return insertSLARecordTx(ctx, tx, action.Type, tenantID, entityType, entityID, slaKey, hours)
}

func createStatusSLARecordTx(ctx context.Context, tx pgx.Tx, tenantID, entityType, entityID, status string, hours int) (TransitionActionResult, error) {
	return insertSLARecordTx(ctx, tx, "sla", tenantID, entityType, entityID, "status:"+status, hours)
}

func insertSLARecordTx(ctx context.Context, tx pgx.Tx, actionType, tenantID, entityType, entityID, slaKey string, hours int) (TransitionActionResult, error) {
	dueAt := time.Now().UTC().Add(time.Duration(hours) * time.Hour)
	var slaID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO sla_record (tenant_id, entity_type, entity_id, sla_key, due_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id`,
		tenantID, entityType, entityID, slaKey, dueAt,
	).Scan(&slaID); err != nil {
		result := TransitionActionResult{Type: actionType, Status: "failed", Error: fmt.Sprintf("sla action failed: %v", err)}
		return result, fmt.Errorf("%s", result.Error)
	}
	return TransitionActionResult{
		Type:   actionType,
		Status: "completed",
		Output: map[string]any{"sla_id": slaID, "sla_key": slaKey, "due_at": dueAt},
	}, nil
}

func recordTransitionTx(ctx context.Context, tx pgx.Tx, tenantID, entityType, entityID, fromStatus, toStatus, command, actorID, note string) error {
	if note == "" {
		note = command
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO status_history (tenant_id, entity_type, entity_id, from_status, to_status, transitioned_by, note)
		VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7,''))`,
		tenantID, entityType, entityID, fromStatus, toStatus, actorID, note,
	); err != nil {
		return fmt.Errorf("write status history: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO workflow_transition_log (tenant_id, entity_type, entity_id, from_status, to_status, command, actor_id)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6,''), $7)`,
		tenantID, entityType, entityID, fromStatus, toStatus, command, actorID,
	); err != nil {
		return fmt.Errorf("write workflow transition log: %w", err)
	}
	return nil
}

func (h *Handler) executePostCommitTransitionActions(ctx context.Context, tenantID, entityType, entityID, userID string, rec *EntityRecord, transition *compiler.RawTransition, payload map[string]any) ([]TransitionActionResult, error) {
	var results []TransitionActionResult
	for _, action := range transition.Actions {
		switch normalizeActionType(action.Type) {
		case "notify":
			result, err := h.executeNotifyTransitionAction(ctx, tenantID, entityType, entityID, userID, rec, action)
			results = append(results, result)
			if err != nil && ShouldBlockOnFailure(actionFailurePolicy("continue", action)) {
				return results, err
			}
		case "run_process":
			result := publishTransitionProcessAction(ctx, tenantID, entityType, entityID, userID, rec, transition, action, payload)
			results = append(results, result)
		}
	}
	return results, nil
}

func (h *Handler) executeNotifyTransitionAction(ctx context.Context, tenantID, entityType, entityID, userID string, rec *EntityRecord, action compiler.RawTransitionAction) (TransitionActionResult, error) {
	params := actionPayload(action)
	serviceKey := stringFromMap(params, "service_key", "serviceKey")
	if serviceKey == "" {
		serviceKey = "notification"
	}
	method := stringFromMap(params, "method")
	if method == "" && serviceKey == "notification" {
		method = "send"
	}
	if method == "" {
		method = ServiceMethod("", params)
	}
	input := ServiceInput(params)
	if stringFromMap(input, "recipient") == "" {
		input["recipient"] = userID
	}
	if stringFromMap(input, "channel") == "" && serviceKey == "notification" {
		input["channel"] = "in_app"
	}
	if stringFromMap(input, "message") == "" {
		input["message"] = fmt.Sprintf("%s %s moved to %s", entityType, entityID, rec.Status)
	}
	input["entity_type"] = entityType
	input["entity_id"] = entityID
	input["status"] = rec.Status

	if h.policy == nil || h.policy.serviceInvoker == nil {
		result := TransitionActionResult{Type: action.Type, Status: "failed", Error: "service registry is not wired"}
		return result, fmt.Errorf("%s", result.Error)
	}
	resp, err := h.policy.serviceInvoker.Invoke(ctx, &service.InvokeRequest{
		ServiceKey: serviceKey,
		Method:     method,
		TenantID:   tenantID,
		Caller:     fmt.Sprintf("transition:%s/%s:%s", entityType, entityID, rec.Status),
		Input:      input,
	})
	if err != nil {
		result := TransitionActionResult{Type: action.Type, Status: "failed", Error: err.Error()}
		return result, err
	}
	result := TransitionActionResult{
		Type:   action.Type,
		Status: "completed",
		Output: resp.Output,
	}
	if !resp.Success {
		result.Status = "failed"
		result.Error = resp.Error
		if result.Error == "" {
			result.Error = "service returned an unsuccessful response"
		}
		return result, fmt.Errorf("%s", result.Error)
	}
	return result, nil
}

func publishTransitionProcessAction(ctx context.Context, tenantID, entityType, entityID, userID string, rec *EntityRecord, transition *compiler.RawTransition, action compiler.RawTransitionAction, payload map[string]any) TransitionActionResult {
	params := actionPayload(action)
	eventType := stringFromMap(params, "event_type", "eventType", "trigger_type", "triggerType")
	if eventType == "" {
		eventType = business_workflow.TriggerManual
	}
	eventPayload := map[string]any{}
	for k, v := range payload {
		eventPayload[k] = v
	}
	for k, v := range params {
		switch k {
		case "event_type", "eventType", "trigger_type", "triggerType", "failure_policy", "failurePolicy":
			continue
		default:
			eventPayload[k] = v
		}
	}
	eventPayload["entity_type"] = entityType
	eventPayload["entity_id"] = entityID
	eventPayload["status"] = rec.Status
	eventPayload["from_status"] = transition.From
	eventPayload["to_status"] = transition.To
	eventPayload["command"] = transition.Command
	business_workflow.PublishEntityEvent(ctx, tenantID, entityType, entityID, eventType, userID, eventPayload)
	return TransitionActionResult{
		Type:   action.Type,
		Status: "completed",
		Output: map[string]any{"event_type": eventType, "published": true},
	}
}

func statusByKey(schema *compiler.CompiledSchema, key string) *compiler.RawStatus {
	if schema == nil {
		return nil
	}
	for i := range schema.Statuses {
		if StatusKey(schema.Statuses[i]) == key {
			return &schema.Statuses[i]
		}
	}
	return nil
}

func actionPayload(action compiler.RawTransitionAction) map[string]any {
	if action.Payload == nil {
		return map[string]any{}
	}
	return action.Payload
}

func actionFailurePolicy(defaultPolicy string, action compiler.RawTransitionAction) string {
	if strings.TrimSpace(action.FailurePolicy) != "" {
		defaultPolicy = action.FailurePolicy
	}
	return FailurePolicy(defaultPolicy, actionPayload(action))
}

func normalizeActionType(value string) string {
	normalized := strings.ToLower(strings.TrimSpace(value))
	normalized = strings.ReplaceAll(normalized, "-", "_")
	switch normalized {
	case "setfield":
		return "set_field"
	case "createtask":
		return "create_task"
	case "runprocess", "start_workflow", "start_process":
		return "run_process"
	default:
		return normalized
	}
}

func stringFromMap(payload map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case string:
				if strings.TrimSpace(typed) != "" {
					return strings.TrimSpace(typed)
				}
			case fmt.Stringer:
				if strings.TrimSpace(typed.String()) != "" {
					return strings.TrimSpace(typed.String())
				}
			}
		}
	}
	return ""
}

func intFromMap(payload map[string]any, keys ...string) int {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case int:
				return typed
			case int64:
				return int(typed)
			case float64:
				return int(typed)
			case string:
				parsed, _ := strconv.Atoi(strings.TrimSpace(typed))
				if parsed != 0 {
					return parsed
				}
			}
		}
	}
	return 0
}

func dueAtFromHours(hours int) *time.Time {
	if hours <= 0 {
		return nil
	}
	dueAt := time.Now().UTC().Add(time.Duration(hours) * time.Hour)
	return &dueAt
}
