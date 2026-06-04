package business_workflow

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/expression"
	"github.com/excellon/nexai/internal/middleware"
	"github.com/go-chi/chi/v5"
)

// HandlerV2 provides HTTP endpoints for DAG-based workflow operations.
type HandlerV2 struct {
	executor *DAGExecutor
	resolver *WorkflowResolver
	approval *ApprovalHandler
	logger   *ExecutionLogger
	repo     *Repo
}

// NewHandlerV2 constructs HandlerV2 with all dependencies.
func NewHandlerV2(pool *db.Pool, expr *expression.Engine) *HandlerV2 {
	repo := NewRepo(pool)
	logger := NewExecutionLogger(pool)
	executor := NewDAGExecutor(pool, expr)
	resolver := NewWorkflowResolver(pool, expr)
	approval := NewApprovalHandler(pool, logger)

	return &HandlerV2{
		executor: executor,
		resolver: resolver,
		approval: approval,
		logger:   logger,
		repo:     repo,
	}
}

// SetServiceInvoker wires the workflow executor to the service registry.
func (h *HandlerV2) SetServiceInvoker(invoker ServiceInvoker) {
	h.executor.SetServiceInvoker(invoker)
}

// SetRuleEvaluator wires the workflow executor to the rule engine.
func (h *HandlerV2) SetRuleEvaluator(evaluator RuleEvaluator) {
	h.executor.SetRuleEvaluator(evaluator)
}

// Executor exposes the configured executor for internal integrations such as
// the entity event trigger.
func (h *HandlerV2) Executor() *DAGExecutor {
	return h.executor
}

// Resolver exposes the configured resolver for internal integrations.
func (h *HandlerV2) Resolver() *WorkflowResolver {
	return h.resolver
}

// RegisterRoutesV2 mounts the v2 workflow routes under a chi.Router.
func (h *HandlerV2) RegisterRoutesV2(r chi.Router) {
	// DAG Definitions
	r.Post("/v2/definitions", h.createDefinitionV2)
	r.Get("/v2/definitions", h.listDefinitionsV2)
	r.Get("/v2/definitions/{id}", h.getDefinitionV2)

	// DAG Instances
	r.Post("/v2/instances", h.startDAGInstance)
	r.Get("/v2/instances", h.listInstancesV2)
	r.Get("/v2/instances/{id}", h.getInstanceV2)
	r.Post("/v2/instances/{id}/resume", h.resumeInstance)
	r.Post("/v2/instances/{id}/abort", h.abortInstanceV2)
	r.Get("/v2/instances/{id}/state", h.getDAGState)
	r.Get("/v2/instances/{id}/logs", h.getExecutionLogs)

	// Approvals
	r.Get("/v2/approvals/pending", h.getPendingApprovals)
	r.Post("/v2/approvals/{id}/decide", h.decideApproval)

	// Bindings
	r.Post("/v2/bindings", h.createBinding)
	r.Get("/v2/bindings", h.listBindings)
	r.Put("/v2/bindings/{id}", h.updateBinding)
	r.Delete("/v2/bindings/{id}", h.deleteBinding)

	// Event publish (for testing / external triggers)
	r.Post("/v2/events", h.publishEvent)
}

// --- Definitions ---

func (h *HandlerV2) createDefinitionV2(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var def ProcessDefinitionV2
	if err := json.Unmarshal(body, &def); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	result, err := h.repo.CreateDefinitionV2(r.Context(), tID, userID, &def)
	if err != nil {
		slog.Error("workflow_v2: create definition", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create definition"})
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *HandlerV2) listDefinitionsV2(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")

	defs, err := h.repo.ListDefinitionsV2(r.Context(), tID, entityType)
	if err != nil {
		slog.Error("workflow_v2: list definitions", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list definitions"})
		return
	}
	if defs == nil {
		defs = []*ProcessDefinitionV2{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": defs})
}

func (h *HandlerV2) getDefinitionV2(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	def, err := h.repo.GetDefinitionV2(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "definition not found"})
		return
	}
	writeJSON(w, http.StatusOK, def)
}

// --- Instances ---

func (h *HandlerV2) startDAGInstance(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		DefinitionID string         `json:"definitionId"`
		EntityType   string         `json:"entityType"`
		EntityID     string         `json:"entityId"`
		Context      map[string]any `json:"context"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	// Load definition
	def, err := h.repo.GetDefinitionV2(r.Context(), tID, req.DefinitionID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "definition not found"})
		return
	}

	if !def.IsDAGWorkflow() {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "definition does not contain a DAG workflow"})
		return
	}

	inst, err := h.executor.StartDAGInstance(r.Context(), tID, def, req.EntityType, req.EntityID, req.Context)
	if err != nil {
		slog.Error("workflow_v2: start instance", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to start workflow instance"})
		return
	}
	writeJSON(w, http.StatusCreated, inst)
}

func (h *HandlerV2) listInstancesV2(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")
	entityID := r.URL.Query().Get("entity_id")
	status := r.URL.Query().Get("status")

	instances, err := h.repo.ListInstancesV2(r.Context(), tID, entityType, entityID, status)
	if err != nil {
		slog.Error("workflow_v2: list instances", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list instances"})
		return
	}
	if instances == nil {
		instances = []*ProcessInstanceV2{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": instances})
}

func (h *HandlerV2) getInstanceV2(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	inst, err := h.repo.GetInstanceV2(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "instance not found"})
		return
	}
	writeJSON(w, http.StatusOK, inst)
}

func (h *HandlerV2) resumeInstance(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		NodeID string         `json:"nodeId"`
		Output map[string]any `json:"output"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.NodeID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "nodeId is required"})
		return
	}

	if err := h.executor.ResumeInstance(r.Context(), tID, id, req.NodeID, req.Output); err != nil {
		slog.Error("workflow_v2: resume instance", "error", err, "id", id)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// Return updated instance
	inst, err := h.repo.GetInstanceV2(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]string{"status": "resumed"})
		return
	}
	writeJSON(w, http.StatusOK, inst)
}

func (h *HandlerV2) abortInstanceV2(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		Reason string `json:"reason"`
	}
	json.Unmarshal(body, &req) //nolint

	inst, err := h.repo.GetInstanceV2(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "instance not found"})
		return
	}

	inst.Status = "aborted"
	inst.AbortReason = req.Reason
	if err := h.repo.UpdateInstanceV2(r.Context(), inst); err != nil {
		slog.Error("workflow_v2: abort instance", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to abort"})
		return
	}
	writeJSON(w, http.StatusOK, inst)
}

func (h *HandlerV2) getDAGState(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	inst, err := h.repo.GetInstanceV2(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "instance not found"})
		return
	}
	writeJSON(w, http.StatusOK, inst.DAGState)
}

func (h *HandlerV2) getExecutionLogs(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	logs, err := h.logger.GetLogs(r.Context(), tID, id)
	if err != nil {
		slog.Error("workflow_v2: get execution logs", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get logs"})
		return
	}
	if logs == nil {
		logs = []WorkflowExecutionLog{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": logs})
}

// --- Approvals ---

func (h *HandlerV2) getPendingApprovals(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	role := r.URL.Query().Get("role")
	if role == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "role query param required"})
		return
	}

	records, err := h.approval.GetPendingApprovals(r.Context(), tID, role)
	if err != nil {
		slog.Error("workflow_v2: get pending approvals", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get approvals"})
		return
	}
	if records == nil {
		records = []*ApprovalRecord{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": records})
}

func (h *HandlerV2) decideApproval(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		InstanceID string `json:"instanceId"`
		StepID     string `json:"stepId"`
		Decision   string `json:"decision"`
		Comment    string `json:"comment"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	resolved, approved, err := h.approval.ProcessDecision(r.Context(), tID, req.InstanceID, req.StepID, userID, req.Decision, req.Comment)
	if err != nil {
		slog.Error("workflow_v2: decide approval", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	// If resolved, resume the workflow
	if resolved {
		output := map[string]any{"approved": approved, "decidedBy": userID}
		if err := h.executor.ResumeInstance(r.Context(), tID, req.InstanceID, req.StepID, output); err != nil {
			slog.Error("workflow_v2: resume after approval", "error", err)
		}
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"resolved": resolved,
		"approved": approved,
	})
}

// --- Bindings ---

func (h *HandlerV2) createBinding(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var binding WorkflowBinding
	if err := json.Unmarshal(body, &binding); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	result, err := h.resolver.CreateBinding(r.Context(), tID, userID, &binding)
	if err != nil {
		slog.Error("workflow_v2: create binding", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create binding"})
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *HandlerV2) listBindings(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")

	bindings, err := h.resolver.ListBindings(r.Context(), tID, entityType)
	if err != nil {
		slog.Error("workflow_v2: list bindings", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list bindings"})
		return
	}
	if bindings == nil {
		bindings = []*WorkflowBinding{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": bindings})
}

func (h *HandlerV2) updateBinding(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var binding WorkflowBinding
	if err := json.Unmarshal(body, &binding); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	binding.ID = id

	if err := h.resolver.UpdateBinding(r.Context(), tID, &binding); err != nil {
		slog.Error("workflow_v2: update binding", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update binding"})
		return
	}
	writeJSON(w, http.StatusOK, binding)
}

func (h *HandlerV2) deleteBinding(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	if err := h.resolver.DeleteBinding(r.Context(), tID, id); err != nil {
		slog.Error("workflow_v2: delete binding", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete binding"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// --- Events ---

func (h *HandlerV2) publishEvent(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var event Event
	if err := json.Unmarshal(body, &event); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	event.TenantID = tID
	event.UserID = userID

	GlobalBus.Publish(r.Context(), event)
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "published"})
}
