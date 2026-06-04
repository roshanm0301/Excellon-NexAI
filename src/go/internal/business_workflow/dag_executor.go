package business_workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/expression"
	"github.com/excellon/nexai/internal/idgen"
	"github.com/jackc/pgx/v5"
)

// ServiceInvoker is the interface for invoking external/internal services.
// Implemented by service.Registry — defined here at the consumption site.
type ServiceInvoker interface {
	Invoke(ctx context.Context, req *ServiceInvokeRequest) (*ServiceInvokeResponse, error)
}

// ServiceInvokeRequest mirrors service.InvokeRequest without import dependency.
type ServiceInvokeRequest struct {
	ServiceKey string
	Method     string
	TenantID   string
	Caller     string
	Input      map[string]any
}

// ServiceInvokeResponse mirrors service.InvokeResponse without import dependency.
type ServiceInvokeResponse struct {
	Success bool
	Output  map[string]any
	Error   string
}

// RuleEvaluator is implemented by the rule engine used by rule_evaluation nodes.
type RuleEvaluator interface {
	EvaluateRuleSet(ctx context.Context, tenantID, ruleSetKey string, payload map[string]any, triggerType string) (any, error)
}

// DAGExecutor drives execution of DAG-based workflows.
type DAGExecutor struct {
	pool          *db.Pool
	expr          *expression.Engine
	repo          *Repo
	approval      *ApprovalHandler
	parallel      *ParallelRunner
	logger        *ExecutionLogger
	svcInvoker    ServiceInvoker
	ruleEvaluator RuleEvaluator
}

// NewDAGExecutor constructs a DAGExecutor with all dependencies.
func NewDAGExecutor(pool *db.Pool, expr *expression.Engine) *DAGExecutor {
	repo := NewRepo(pool)
	logger := NewExecutionLogger(pool)
	return &DAGExecutor{
		pool:     pool,
		expr:     expr,
		repo:     repo,
		approval: NewApprovalHandler(pool, logger),
		parallel: NewParallelRunner(pool, expr, logger),
		logger:   logger,
	}
}

// SetServiceInvoker injects the service invoker (avoids circular import).
func (e *DAGExecutor) SetServiceInvoker(invoker ServiceInvoker) {
	e.svcInvoker = invoker
}

// SetRuleEvaluator injects the rule evaluator.
func (e *DAGExecutor) SetRuleEvaluator(evaluator RuleEvaluator) {
	e.ruleEvaluator = evaluator
}

// StartDAGInstance creates and begins executing a DAG workflow instance.
func (e *DAGExecutor) StartDAGInstance(ctx context.Context, tenantID string, def *ProcessDefinitionV2, entityType, entityID string, initialContext map[string]any) (*ProcessInstanceV2, error) {
	if !def.IsDAGWorkflow() {
		return nil, fmt.Errorf("dag_executor: definition %s has no DAG", def.ID)
	}

	ctxBytes, err := json.Marshal(initialContext)
	if err != nil {
		ctxBytes = []byte(`{}`)
	}

	now := time.Now().UTC()
	dagState := NewDAGState(def.DAG)

	inst := &ProcessInstanceV2{
		ID:           idgen.NewV7(),
		TenantID:     tenantID,
		DefinitionID: def.ID,
		EntityType:   entityType,
		EntityID:     entityID,
		Status:       "running",
		DAGState:     dagState,
		Context:      json.RawMessage(ctxBytes),
		StartedAt:    &now,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := e.repo.CreateInstanceV2(ctx, inst); err != nil {
		return nil, fmt.Errorf("dag_executor: create instance: %w", err)
	}

	// Begin execution from start node
	if err := e.executeReadyNodes(ctx, tenantID, def, inst); err != nil {
		return nil, fmt.Errorf("dag_executor: initial execution: %w", err)
	}

	return inst, nil
}

// ResumeInstance continues execution after an external event (approval, callback, etc.).
func (e *DAGExecutor) ResumeInstance(ctx context.Context, tenantID, instanceID, nodeID string, output map[string]any) error {
	inst, err := e.repo.GetInstanceV2(ctx, tenantID, instanceID)
	if err != nil {
		return fmt.Errorf("dag_executor: load instance: %w", err)
	}
	if inst.Status != "running" && inst.Status != "waiting" {
		return fmt.Errorf("dag_executor: instance not resumable (status=%s)", inst.Status)
	}

	def, err := e.repo.GetDefinitionV2(ctx, tenantID, inst.DefinitionID)
	if err != nil {
		return fmt.Errorf("dag_executor: load definition: %w", err)
	}

	// Mark the node as completed
	ns, ok := inst.DAGState.NodeStates[nodeID]
	if !ok {
		return fmt.Errorf("dag_executor: node %s not found in state", nodeID)
	}
	nowMs := time.Now().UnixMilli()
	ns.Status = NodeCompleted
	ns.CompletedAt = &nowMs
	ns.Output = output

	// Merge output into workflow variables
	for k, v := range output {
		inst.DAGState.Variables[k] = v
	}

	// Mark completed
	inst.DAGState.CompletedNodes = append(inst.DAGState.CompletedNodes, nodeID)
	inst.DAGState.ActiveNodes = removeFromSlice(inst.DAGState.ActiveNodes, nodeID)

	// Propagate — find newly ready nodes
	e.propagateReadiness(def.DAG, inst.DAGState)

	// Execute ready nodes
	if err := e.executeReadyNodes(ctx, tenantID, def, inst); err != nil {
		return fmt.Errorf("dag_executor: resume execution: %w", err)
	}

	return nil
}

// executeReadyNodes finds all nodes in "ready" status and executes them.
func (e *DAGExecutor) executeReadyNodes(ctx context.Context, tenantID string, def *ProcessDefinitionV2, inst *ProcessInstanceV2) error {
	for {
		readyNodes := e.findReadyNodes(inst.DAGState)
		if len(readyNodes) == 0 {
			break
		}

		for _, nodeID := range readyNodes {
			node := e.findNode(def.DAG, nodeID)
			if node == nil {
				// Check if it's a gateway
				gw := e.findGateway(def.DAG, nodeID)
				if gw != nil {
					if err := e.executeGateway(ctx, tenantID, def, inst, gw); err != nil {
						return err
					}
					continue
				}
				return fmt.Errorf("dag_executor: node %s not found in definition", nodeID)
			}

			if err := e.executeNode(ctx, tenantID, def, inst, node); err != nil {
				return err
			}
		}

		// Re-propagate after synchronous completions
		e.propagateReadiness(def.DAG, inst.DAGState)

		// If any node failed, mark the instance failed and stop executing.
		if failedNode := firstFailedNode(inst.DAGState); failedNode != nil {
			inst.Status = "failed"
			inst.ErrorMessage = failedNode.Error
			break
		}

		// If DAG is terminal, mark instance complete
		if inst.DAGState.IsTerminal() {
			now := time.Now().UTC()
			inst.Status = "completed"
			inst.CompletedAt = &now
			break
		}
	}

	// Check if any nodes are waiting (approval, human task)
	hasWaiting := false
	for _, ns := range inst.DAGState.NodeStates {
		if ns.Status == NodeWaiting {
			hasWaiting = true
			break
		}
	}
	if hasWaiting && inst.Status == "running" {
		inst.Status = "waiting"
	}

	// Persist state
	inst.UpdatedAt = time.Now().UTC()
	return e.repo.UpdateInstanceV2(ctx, inst)
}

// executeNode dispatches a single node based on its type.
func (e *DAGExecutor) executeNode(ctx context.Context, tenantID string, def *ProcessDefinitionV2, inst *ProcessInstanceV2, node *DAGNode) error {
	ns := inst.DAGState.NodeStates[node.ID]
	nowMs := time.Now().UnixMilli()
	ns.Status = NodeRunning
	ns.StartedAt = &nowMs
	inst.DAGState.ActiveNodes = append(inst.DAGState.ActiveNodes, node.ID)

	switch node.Type {
	case StepAutomatedAction, StepScript:
		return e.executeScript(ctx, tenantID, inst, node)

	case StepApproval:
		return e.executeApproval(ctx, tenantID, inst, node)

	case StepHumanTask:
		return e.executeHumanTask(ctx, tenantID, inst, node)
		// Human tasks go to "waiting" — external resume triggers completion

	case StepNotification:
		return e.executeNotification(ctx, tenantID, inst, node)

	case StepServiceCall:
		return e.executeServiceCall(ctx, tenantID, inst, node)

	case StepRuleEval:
		return e.executeRuleEval(ctx, tenantID, inst, node)

	case StepWait:
		ns.Status = NodeWaiting
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "waiting", nil, nil)
		return nil

	case StepSubWorkflow:
		return e.executeSubWorkflow(ctx, tenantID, inst, node)

	default:
		// Unknown step type — mark completed (pass-through)
		slog.Warn("dag_executor: unknown step type, passing through", "type", node.Type, "node", node.ID)
		e.completeNode(inst.DAGState, node.ID, nil)
		return nil
	}
}

// executeScript evaluates a JSONata expression and stores the result.
func (e *DAGExecutor) executeScript(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	cfg := parseScriptConfig(node.Config)
	if cfg.Expression == "" {
		e.completeNode(inst.DAGState, node.ID, nil)
		return nil
	}

	// Build evaluation data from workflow variables + context
	data := e.buildEvalData(inst)

	result, err := e.expr.Evaluate(ctx, cfg.Expression, data)
	if err != nil {
		e.failNode(inst.DAGState, node.ID, fmt.Sprintf("script error: %v", err))
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", data, map[string]any{"error": err.Error()})
		return nil // Don't propagate — node failed but workflow continues (depends on error handling policy)
	}

	output := map[string]any{}
	if cfg.OutputVar != "" {
		output[cfg.OutputVar] = result
		inst.DAGState.Variables[cfg.OutputVar] = result
	}

	e.completeNode(inst.DAGState, node.ID, output)
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "completed", data, output)
	return nil
}

// executeApproval starts the approval flow for a node.
func (e *DAGExecutor) executeApproval(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	cfg := parseApprovalConfig(node.Config)

	// Create approval records
	if err := e.approval.InitiateApproval(ctx, tenantID, inst.ID, node.ID, cfg); err != nil {
		e.failNode(inst.DAGState, node.ID, fmt.Sprintf("approval init error: %v", err))
		return nil
	}

	// Approval nodes go to "waiting" — the ApprovalHandler.ProcessDecision callback will resume
	ns := inst.DAGState.NodeStates[node.ID]
	ns.Status = NodeWaiting
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "waiting", nil, nil)
	return nil
}

// executeHumanTask creates a durable work item and pauses until an external resume.
func (e *DAGExecutor) executeHumanTask(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	if e.pool == nil {
		errMsg := "workflow database is not wired"
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", node.Config, map[string]any{"error": errMsg})
		return nil
	}
	cfg := node.Config
	taskType := workflowString(cfg, "taskType", "task_type", "taskKey", "task_key")
	if taskType == "" {
		taskType = node.ID
	}
	title := workflowString(cfg, "title")
	if title == "" {
		title = node.Name
	}
	if title == "" {
		title = fmt.Sprintf("Workflow task %s", node.ID)
	}
	description := workflowString(cfg, "description")
	assigneeRole := workflowString(cfg, "assigneeRole", "assignee_role", "role")
	dueAt := workflowDueAt(workflowInt(cfg, "dueHours", "due_hours", "timeoutHours", "timeout_hours"))
	if dueAt == nil && node.TimeoutMins > 0 {
		due := time.Now().UTC().Add(time.Duration(node.TimeoutMins) * time.Minute)
		dueAt = &due
	}

	tx, err := e.pool.Begin(ctx)
	if err != nil {
		errMsg := fmt.Sprintf("human task transaction error: %v", err)
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", cfg, map[string]any{"error": errMsg})
		return nil
	}
	defer func() {
		if err := tx.Rollback(ctx); err != nil && err != pgx.ErrTxClosed {
			slog.Warn("dag_executor: human task rollback failed", "error", err, "node", node.ID, "instance", inst.ID)
		}
	}()

	var taskID string
	if err := tx.QueryRow(ctx, `
		INSERT INTO human_task (tenant_id, entity_type, entity_id, task_type, assigned_role, title, description, due_at, status)
		VALUES ($1, $2, $3, $4, NULLIF($5,''), $6, NULLIF($7,''), $8, 'open')
		RETURNING id`,
		tenantID, inst.EntityType, inst.EntityID, taskType, assigneeRole, title, description, dueAt,
	).Scan(&taskID); err != nil {
		errMsg := fmt.Sprintf("human task create error: %v", err)
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", cfg, map[string]any{"error": errMsg})
		return nil
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO workflow_human_task (tenant_id, entity_type, entity_id, task_key, title, assignee_role, due_at, status)
		VALUES ($1, $2, $3, $4, $5, NULLIF($6,''), $7, 'pending')`,
		tenantID, inst.EntityType, inst.EntityID, taskType, title, assigneeRole, dueAt,
	); err != nil {
		errMsg := fmt.Sprintf("workflow human task mirror error: %v", err)
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", cfg, map[string]any{"error": errMsg, "taskId": taskID})
		return nil
	}
	if err := tx.Commit(ctx); err != nil {
		errMsg := fmt.Sprintf("human task commit error: %v", err)
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", cfg, map[string]any{"error": errMsg, "taskId": taskID})
		return nil
	}

	output := map[string]any{"taskId": taskID, "taskType": taskType, "assigneeRole": assigneeRole}
	ns := inst.DAGState.NodeStates[node.ID]
	ns.Status = NodeWaiting
	ns.Output = output
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "waiting", cfg, output)
	return nil
}

// executeNotification sends a notification through the service registry.
func (e *DAGExecutor) executeNotification(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	cfg := node.Config
	serviceKey := workflowString(cfg, "serviceKey", "service_key")
	if serviceKey == "" {
		serviceKey = "notification"
	}
	method := workflowString(cfg, "method")
	if method == "" {
		method = "send"
	}
	input, err := e.workflowServiceInput(ctx, inst, cfg)
	if err != nil {
		errMsg := fmt.Sprintf("notification input error: %v", err)
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", cfg, map[string]any{"error": errMsg})
		return nil
	}
	evalData := e.buildEvalData(inst)
	if workflowString(input, "recipient") == "" {
		input["recipient"] = workflowString(evalData, "$userId")
	}
	if workflowString(input, "recipient") == "" {
		input["recipient"] = "workflow"
	}
	if workflowString(input, "channel") == "" && serviceKey == "notification" {
		input["channel"] = "in_app"
	}
	if workflowString(input, "message") == "" {
		label := node.Name
		if label == "" {
			label = node.ID
		}
		input["message"] = fmt.Sprintf("Workflow %s reached %s", inst.ID, label)
	}

	if e.svcInvoker == nil {
		errMsg := "service registry is not wired"
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", input, map[string]any{"error": errMsg})
		return nil
	}
	resp, err := e.svcInvoker.Invoke(ctx, &ServiceInvokeRequest{
		ServiceKey: serviceKey,
		Method:     method,
		TenantID:   tenantID,
		Caller:     fmt.Sprintf("workflow:%s:step:%s", inst.ID, node.ID),
		Input:      input,
	})
	if err != nil {
		e.failNode(inst.DAGState, node.ID, fmt.Sprintf("notification error: %v", err))
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", input, map[string]any{"error": err.Error()})
		return nil
	}
	output := resp.Output
	if output == nil {
		output = map[string]any{}
	}
	if !resp.Success {
		errMsg := resp.Error
		if errMsg == "" {
			errMsg = "notification service returned an unsuccessful response"
		}
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", input, output)
		return nil
	}
	e.completeNode(inst.DAGState, node.ID, output)
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "completed", input, output)
	return nil
}

// executeServiceCall invokes an external service.
func (e *DAGExecutor) executeServiceCall(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	cfg := parseServiceCallConfig(node.Config)
	if cfg.ServiceKey == "" || cfg.Method == "" {
		errMsg := "service call requires serviceKey and method"
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", node.Config, map[string]any{"error": errMsg})
		return nil
	}

	// Build input from config or expression
	var input map[string]any
	if cfg.InputExpr != "" {
		data := e.buildEvalData(inst)
		result, err := e.expr.Evaluate(ctx, cfg.InputExpr, data)
		if err != nil {
			e.failNode(inst.DAGState, node.ID, fmt.Sprintf("input expression error: %v", err))
			return nil
		}
		if m, ok := result.(map[string]any); ok {
			input = m
		}
	} else {
		input = cfg.Input
	}

	// Dispatch via service invoker if available
	if e.svcInvoker != nil {
		resp, err := e.svcInvoker.Invoke(ctx, &ServiceInvokeRequest{
			ServiceKey: cfg.ServiceKey,
			Method:     cfg.Method,
			TenantID:   tenantID,
			Caller:     fmt.Sprintf("workflow:%s:step:%s", inst.ID, node.ID),
			Input:      input,
		})
		if err != nil {
			e.failNode(inst.DAGState, node.ID, fmt.Sprintf("service call error: %v", err))
			e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", input, map[string]any{"error": err.Error()})
			return nil
		}
		output := resp.Output
		if output == nil {
			output = map[string]any{}
		}
		if !resp.Success {
			e.failNode(inst.DAGState, node.ID, resp.Error)
			e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", input, output)
			return nil
		}
		// Map outputs to workflow variables if configured
		for svcField, wfVar := range cfg.OutputMap {
			if v, ok := output[svcField]; ok {
				inst.DAGState.Variables[wfVar] = v
			}
		}
		e.completeNode(inst.DAGState, node.ID, output)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "completed", input, output)
		return nil
	}

	errMsg := "service registry is not wired"
	e.failNode(inst.DAGState, node.ID, errMsg)
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", input, map[string]any{"error": errMsg})
	return nil
}

// executeRuleEval invokes the rule engine for the entity.
func (e *DAGExecutor) executeRuleEval(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	cfg := parseRuleEvalConfig(node.Config)
	if cfg.RuleSetKey == "" {
		errMsg := "rule evaluation requires ruleSetKey"
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", node.Config, map[string]any{"error": errMsg})
		return nil
	}
	if e.ruleEvaluator == nil {
		errMsg := "rule evaluator is not wired"
		e.failNode(inst.DAGState, node.ID, errMsg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", node.Config, map[string]any{"error": errMsg})
		return nil
	}

	data := e.buildEvalData(inst)
	triggerType := cfg.TriggerType
	if triggerType == "" {
		triggerType = "workflow"
	}
	result, err := e.ruleEvaluator.EvaluateRuleSet(ctx, tenantID, cfg.RuleSetKey, data, triggerType)
	if err != nil {
		e.failNode(inst.DAGState, node.ID, fmt.Sprintf("rule evaluation error: %v", err))
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", data, map[string]any{"error": err.Error()})
		return nil
	}
	resultMap := workflowAnyMap(result)
	if workflowBool(resultMap, "blocked") {
		msg := workflowString(resultMap, "block_message", "blockMessage")
		if msg == "" {
			msg = "workflow rule evaluation blocked the instance"
		}
		e.failNode(inst.DAGState, node.ID, msg)
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", data, map[string]any{"error": msg, "result": resultMap})
		return nil
	}
	serviceResults, err := e.executeRuleServiceInvocations(ctx, tenantID, inst, node, resultMap)
	if err != nil {
		resultMap["service_results"] = serviceResults
		e.failNode(inst.DAGState, node.ID, err.Error())
		e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "failed", data, map[string]any{"error": err.Error(), "result": resultMap})
		return nil
	}
	if len(serviceResults) > 0 {
		resultMap["service_results"] = serviceResults
		result = resultMap
	}

	output := map[string]any{
		"ruleSetKey":  cfg.RuleSetKey,
		"entityType":  cfg.EntityType,
		"triggerType": triggerType,
		"result":      result,
	}
	e.completeNode(inst.DAGState, node.ID, output)
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "completed", data, output)
	return nil
}

// executeSubWorkflow starts a child workflow instance.
func (e *DAGExecutor) executeSubWorkflow(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode) error {
	cfg := parseSubWorkflowConfig(node.Config)

	// For now, mark as waiting — actual sub-workflow orchestration will be wired when needed.
	ns := inst.DAGState.NodeStates[node.ID]
	ns.Status = NodeWaiting
	slog.Info("dag_executor: sub-workflow step (stub)", "definition", cfg.DefinitionID, "node", node.ID)
	e.logger.LogAsync(ctx, tenantID, inst.ID, node.ID, node.Type, "waiting", nil, map[string]any{"subDefinitionId": cfg.DefinitionID})
	return nil
}

// executeGateway processes a gateway (split or join).
func (e *DAGExecutor) executeGateway(ctx context.Context, tenantID string, def *ProcessDefinitionV2, inst *ProcessInstanceV2, gw *DAGGateway) error {
	ns := inst.DAGState.NodeStates[gw.ID]

	if gw.IsJoin {
		// Join gateway: check if all/any incoming edges' source nodes are complete
		incomingNodes := e.getIncomingNodes(def.DAG, gw.ID)
		allDone := inst.DAGState.AllNodesInStatus(incomingNodes, NodeCompleted, NodeSkipped)
		if !allDone && gw.JoinPolicy != "any" {
			// Not ready yet — leave as ready, will be re-checked
			return nil
		}
	}

	// Mark gateway as completed
	nowMs := time.Now().UnixMilli()
	ns.Status = NodeCompleted
	ns.StartedAt = &nowMs
	ns.CompletedAt = &nowMs
	inst.DAGState.CompletedNodes = append(inst.DAGState.CompletedNodes, gw.ID)
	inst.DAGState.ActiveNodes = removeFromSlice(inst.DAGState.ActiveNodes, gw.ID)

	if !gw.IsJoin {
		// Split gateway: evaluate outgoing edges and activate targets
		outEdges := e.getOutgoingEdges(def.DAG, gw.ID)
		e.activateGatewayTargets(ctx, gw, outEdges, inst)
	}

	return nil
}

// activateGatewayTargets decides which outgoing edges to follow.
func (e *DAGExecutor) activateGatewayTargets(ctx context.Context, gw *DAGGateway, edges []DAGEdge, inst *ProcessInstanceV2) {
	data := e.buildEvalData(inst)

	switch gw.Type {
	case GatewayExclusive:
		// First matching condition wins (ordered by priority)
		sortEdgesByPriority(edges)
		for _, edge := range edges {
			if edge.Condition == "" || e.evalCondition(ctx, edge.Condition, data) {
				e.markNodeReady(inst.DAGState, edge.Target)
				break
			}
		}
		// Skip non-activated targets
		for _, edge := range edges {
			ns := inst.DAGState.NodeStates[edge.Target]
			if ns != nil && ns.Status == NodePending {
				ns.Status = NodeSkipped
			}
		}

	case GatewayParallel:
		// All branches activate unconditionally
		for _, edge := range edges {
			e.markNodeReady(inst.DAGState, edge.Target)
		}

	case GatewayInclusive:
		// All matching conditions activate
		activated := false
		for _, edge := range edges {
			if edge.Condition == "" || e.evalCondition(ctx, edge.Condition, data) {
				e.markNodeReady(inst.DAGState, edge.Target)
				activated = true
			}
		}
		if !activated && len(edges) > 0 {
			// Default: activate first edge
			e.markNodeReady(inst.DAGState, edges[0].Target)
		}
	}
}

// propagateReadiness checks all pending nodes and marks them ready if predecessors are done.
func (e *DAGExecutor) propagateReadiness(dag *DAGDefinition, state *DAGState) {
	for nodeID, ns := range state.NodeStates {
		if ns.Status != NodePending {
			continue
		}
		predecessors := e.getPredecessors(dag, nodeID)
		if len(predecessors) == 0 {
			continue // Start node is handled separately
		}
		if state.AllNodesInStatus(predecessors, NodeCompleted, NodeSkipped) {
			ns.Status = NodeReady
		}
	}
}

// findReadyNodes returns all node IDs currently in "ready" status.
func (e *DAGExecutor) findReadyNodes(state *DAGState) []string {
	var ready []string
	for id, ns := range state.NodeStates {
		if ns.Status == NodeReady {
			ready = append(ready, id)
		}
	}
	return ready
}

// completeNode marks a node as completed and stores its output.
func (e *DAGExecutor) completeNode(state *DAGState, nodeID string, output map[string]any) {
	ns := state.NodeStates[nodeID]
	if ns == nil {
		return
	}
	nowMs := time.Now().UnixMilli()
	ns.Status = NodeCompleted
	ns.CompletedAt = &nowMs
	ns.Output = output
	state.CompletedNodes = append(state.CompletedNodes, nodeID)
	state.ActiveNodes = removeFromSlice(state.ActiveNodes, nodeID)

	// Merge output into workflow variables
	for k, v := range output {
		state.Variables[k] = v
	}
}

// failNode marks a node as failed.
func (e *DAGExecutor) failNode(state *DAGState, nodeID string, errMsg string) {
	ns := state.NodeStates[nodeID]
	if ns == nil {
		return
	}
	nowMs := time.Now().UnixMilli()
	ns.Status = NodeFailed
	ns.CompletedAt = &nowMs
	ns.Error = errMsg
	state.ActiveNodes = removeFromSlice(state.ActiveNodes, nodeID)
}

// markNodeReady sets a node to ready status.
func (e *DAGExecutor) markNodeReady(state *DAGState, nodeID string) {
	ns := state.NodeStates[nodeID]
	if ns != nil && ns.Status == NodePending {
		ns.Status = NodeReady
	}
}

// buildEvalData constructs evaluation context from instance variables and context.
func (e *DAGExecutor) buildEvalData(inst *ProcessInstanceV2) map[string]any {
	data := map[string]any{}
	// Parse instance context
	var ctxData map[string]any
	if err := json.Unmarshal(inst.Context, &ctxData); err == nil {
		for k, v := range ctxData {
			data[k] = v
		}
	}
	// Overlay workflow variables (higher priority)
	if inst.DAGState != nil {
		for k, v := range inst.DAGState.Variables {
			data[k] = v
		}
	}
	// Add metadata
	data["$instanceId"] = inst.ID
	data["$entityType"] = inst.EntityType
	data["$entityId"] = inst.EntityID
	return data
}

// evalCondition evaluates a JSONata condition expression.
func (e *DAGExecutor) evalCondition(ctx context.Context, expr string, data map[string]any) bool {
	if expr == "" {
		return true
	}
	result, err := e.expr.Evaluate(ctx, expr, data)
	if err != nil {
		slog.Warn("dag_executor: condition eval error", "expr", expr, "error", err)
		return false
	}
	return isTruthyValue(result)
}

// --- Graph traversal helpers ---

func (e *DAGExecutor) findNode(dag *DAGDefinition, id string) *DAGNode {
	for i := range dag.Nodes {
		if dag.Nodes[i].ID == id {
			return &dag.Nodes[i]
		}
	}
	return nil
}

func (e *DAGExecutor) findGateway(dag *DAGDefinition, id string) *DAGGateway {
	for i := range dag.Gateways {
		if dag.Gateways[i].ID == id {
			return &dag.Gateways[i]
		}
	}
	return nil
}

func (e *DAGExecutor) getPredecessors(dag *DAGDefinition, nodeID string) []string {
	var preds []string
	for _, edge := range dag.Edges {
		if edge.Target == nodeID {
			preds = append(preds, edge.Source)
		}
	}
	return preds
}

func (e *DAGExecutor) getIncomingNodes(dag *DAGDefinition, nodeID string) []string {
	return e.getPredecessors(dag, nodeID)
}

func (e *DAGExecutor) getOutgoingEdges(dag *DAGDefinition, nodeID string) []DAGEdge {
	var edges []DAGEdge
	for _, edge := range dag.Edges {
		if edge.Source == nodeID {
			edges = append(edges, edge)
		}
	}
	return edges
}

// --- Config parsers ---

func parseScriptConfig(cfg map[string]any) ScriptConfig {
	var sc ScriptConfig
	if cfg == nil {
		return sc
	}
	if v, ok := cfg["expression"].(string); ok {
		sc.Expression = v
	}
	if v, ok := cfg["outputVar"].(string); ok {
		sc.OutputVar = v
	}
	return sc
}

func parseApprovalConfig(cfg map[string]any) *ApprovalConfig {
	if cfg == nil {
		return &ApprovalConfig{Mode: ApprovalSequential, Policy: PolicyUnanimous}
	}
	raw, err := json.Marshal(cfg)
	if err != nil {
		return &ApprovalConfig{Mode: ApprovalSequential, Policy: PolicyUnanimous}
	}
	var ac ApprovalConfig
	if err := json.Unmarshal(raw, &ac); err != nil {
		return &ApprovalConfig{Mode: ApprovalSequential, Policy: PolicyUnanimous}
	}
	if ac.Mode == "" {
		ac.Mode = ApprovalSequential
	}
	if ac.Policy == "" {
		ac.Policy = PolicyUnanimous
	}
	return &ac
}

func parseServiceCallConfig(cfg map[string]any) ServiceCallConfig {
	var sc ServiceCallConfig
	if cfg == nil {
		return sc
	}
	raw, _ := json.Marshal(cfg)
	json.Unmarshal(raw, &sc) //nolint
	return sc
}

func parseRuleEvalConfig(cfg map[string]any) RuleEvalConfig {
	var rc RuleEvalConfig
	if cfg == nil {
		return rc
	}
	raw, _ := json.Marshal(cfg)
	json.Unmarshal(raw, &rc) //nolint
	return rc
}

func parseSubWorkflowConfig(cfg map[string]any) SubWorkflowConfig {
	var sc SubWorkflowConfig
	if cfg == nil {
		return sc
	}
	raw, _ := json.Marshal(cfg)
	json.Unmarshal(raw, &sc) //nolint
	return sc
}

func (e *DAGExecutor) workflowServiceInput(ctx context.Context, inst *ProcessInstanceV2, cfg map[string]any) (map[string]any, error) {
	if cfg == nil {
		return map[string]any{}, nil
	}
	if expr := workflowString(cfg, "inputExpr", "input_expr"); expr != "" {
		result, err := e.expr.Evaluate(ctx, expr, e.buildEvalData(inst))
		if err != nil {
			return nil, err
		}
		if input, ok := result.(map[string]any); ok {
			return input, nil
		}
		return nil, fmt.Errorf("input expression must return an object")
	}
	if input, ok := workflowMap(cfg["input"]); ok {
		return input, nil
	}
	input := map[string]any{}
	for k, v := range cfg {
		switch k {
		case "serviceKey", "service_key", "method", "input", "inputExpr", "input_expr", "outputMap", "output_map":
			continue
		default:
			input[k] = v
		}
	}
	return input, nil
}

func (e *DAGExecutor) executeRuleServiceInvocations(ctx context.Context, tenantID string, inst *ProcessInstanceV2, node *DAGNode, result map[string]any) ([]map[string]any, error) {
	rawInvocations, ok := result["service_invocations"].([]any)
	if !ok || len(rawInvocations) == 0 {
		return nil, nil
	}
	if e.svcInvoker == nil {
		return []map[string]any{{"success": false, "error": "service registry is not wired"}}, fmt.Errorf("service registry is not wired")
	}
	var serviceResults []map[string]any
	for _, raw := range rawInvocations {
		invocation, ok := workflowMap(raw)
		if !ok {
			continue
		}
		serviceKey := workflowString(invocation, "service_key", "serviceKey")
		params, _ := workflowMap(invocation["params"])
		method := workflowString(invocation, "method")
		if method == "" {
			method = workflowString(params, "method")
		}
		if method == "" {
			method = "execute"
		}
		ruleKey := workflowString(invocation, "rule_key", "ruleKey")
		policy := workflowFailurePolicy(invocation, params, "block")
		entry := map[string]any{
			"service_key": serviceKey,
			"method":      method,
			"rule_key":    ruleKey,
			"success":     false,
		}
		if serviceKey == "" {
			entry["error"] = "service_key is required"
			serviceResults = append(serviceResults, entry)
			if workflowShouldBlock(policy) {
				return serviceResults, fmt.Errorf("rule service invocation failed: service_key is required")
			}
			continue
		}
		resp, err := e.svcInvoker.Invoke(ctx, &ServiceInvokeRequest{
			ServiceKey: serviceKey,
			Method:     method,
			TenantID:   tenantID,
			Caller:     fmt.Sprintf("workflow:%s:step:%s:rule:%s", inst.ID, node.ID, ruleKey),
			Input:      workflowServiceParams(params),
		})
		if err != nil {
			entry["error"] = err.Error()
			serviceResults = append(serviceResults, entry)
			if workflowShouldBlock(policy) {
				return serviceResults, fmt.Errorf("rule service invocation failed: %w", err)
			}
			continue
		}
		entry["success"] = resp.Success
		if resp.Output != nil {
			entry["output"] = resp.Output
		}
		if resp.Error != "" {
			entry["error"] = resp.Error
		}
		serviceResults = append(serviceResults, entry)
		if !resp.Success && workflowShouldBlock(policy) {
			errMsg := resp.Error
			if errMsg == "" {
				errMsg = "service returned an unsuccessful response"
			}
			return serviceResults, fmt.Errorf("rule service invocation failed: %s", errMsg)
		}
	}
	return serviceResults, nil
}

// --- Utilities ---

func removeFromSlice(slice []string, item string) []string {
	result := make([]string, 0, len(slice))
	for _, s := range slice {
		if s != item {
			result = append(result, s)
		}
	}
	return result
}

func workflowString(payload map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := payload[key]; ok {
			switch typed := value.(type) {
			case string:
				if typed != "" {
					return typed
				}
			case fmt.Stringer:
				if typed.String() != "" {
					return typed.String()
				}
			}
		}
	}
	return ""
}

func workflowInt(payload map[string]any, keys ...string) int {
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
				var parsed int
				if _, err := fmt.Sscanf(typed, "%d", &parsed); err == nil {
					return parsed
				}
			}
		}
	}
	return 0
}

func workflowDueAt(hours int) *time.Time {
	if hours <= 0 {
		return nil
	}
	due := time.Now().UTC().Add(time.Duration(hours) * time.Hour)
	return &due
}

func workflowAnyMap(value any) map[string]any {
	if mapped, ok := workflowMap(value); ok {
		return mapped
	}
	raw, err := json.Marshal(value)
	if err != nil {
		return map[string]any{}
	}
	var mapped map[string]any
	if err := json.Unmarshal(raw, &mapped); err != nil || mapped == nil {
		return map[string]any{}
	}
	return mapped
}

func workflowMap(value any) (map[string]any, bool) {
	switch typed := value.(type) {
	case map[string]any:
		return typed, true
	default:
		return nil, false
	}
}

func workflowBool(payload map[string]any, key string) bool {
	value, ok := payload[key]
	if !ok {
		return false
	}
	switch typed := value.(type) {
	case bool:
		return typed
	case string:
		return typed == "true"
	default:
		return false
	}
}

func workflowServiceParams(params map[string]any) map[string]any {
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

func workflowFailurePolicy(invocation, params map[string]any, fallback string) string {
	for _, source := range []map[string]any{invocation, params} {
		if policy := workflowString(source, "failure_policy", "failurePolicy"); policy != "" {
			return policy
		}
	}
	if fallback == "" {
		return "block"
	}
	return fallback
}

func workflowShouldBlock(policy string) bool {
	switch strings.ToLower(strings.TrimSpace(policy)) {
	case "continue", "ignore", "non_blocking", "non-blocking":
		return false
	default:
		return true
	}
}

func firstFailedNode(state *DAGState) *NodeState {
	if state == nil {
		return nil
	}
	for _, ns := range state.NodeStates {
		if ns.Status == NodeFailed {
			return ns
		}
	}
	return nil
}

func sortEdgesByPriority(edges []DAGEdge) {
	// Simple insertion sort — edge count is small
	for i := 1; i < len(edges); i++ {
		for j := i; j > 0 && edges[j].Priority < edges[j-1].Priority; j-- {
			edges[j], edges[j-1] = edges[j-1], edges[j]
		}
	}
}

func isTruthyValue(v any) bool {
	if v == nil {
		return false
	}
	switch val := v.(type) {
	case bool:
		return val
	case float64:
		return val != 0
	case int64:
		return val != 0
	case string:
		return val != "" && val != "false"
	default:
		return true
	}
}

// Ensure idgen is used (compile check)
var _ = idgen.NewV7
