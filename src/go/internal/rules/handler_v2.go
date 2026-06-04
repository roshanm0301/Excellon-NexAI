package rules

// handler_v2.go provides HTTP endpoints for the v2 rule engine:
// - Rule simulation (dry-run evaluation with trace)
// - Conflict matrix CRUD
// - Execution log queries
// - Classification-filtered rule listing

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/excellon/nexai/internal/middleware"
	"github.com/go-chi/chi/v5"
)

// HandlerV2 provides HTTP endpoints for the v2 rule engine features.
type HandlerV2 struct {
	simulator        *Simulator
	conflictResolver *ConflictResolver
	logger           *ExecutionLogger
	repo             *Repo
}

// NewHandlerV2 creates a new v2 rule handler.
func NewHandlerV2(
	simulator *Simulator,
	conflictResolver *ConflictResolver,
	logger *ExecutionLogger,
	repo *Repo,
) *HandlerV2 {
	return &HandlerV2{
		simulator:        simulator,
		conflictResolver: conflictResolver,
		logger:           logger,
		repo:             repo,
	}
}

// RegisterRoutes mounts v2 rule engine routes.
func (h *HandlerV2) RegisterRoutes(r chi.Router) {
	// Enterprise category metadata
	r.Get("/categories", h.listCategories)

	// Enterprise rule-set CRUD
	r.Post("/sets", h.createRuleSet)
	r.Get("/sets", h.listRuleSets)
	r.Get("/sets/{id}", h.getRuleSet)
	r.Put("/sets/{id}", h.updateRuleSet)
	r.Delete("/sets/{id}", h.deleteRuleSet)

	// Simulation
	r.Post("/simulate", h.simulate)

	// Conflict matrix
	r.Get("/{ruleSetKey}/conflict-matrix", h.listConflictMatrix)
	r.Put("/{ruleSetKey}/conflict-matrix/{field}", h.upsertConflictEntry)
	r.Delete("/{ruleSetKey}/conflict-matrix/{field}", h.deleteConflictEntry)

	// Execution log
	r.Get("/execution-log", h.queryExecutionLog)

	// Classification-filtered listing
	r.Get("/classified", h.listByClassification)
}

func (h *HandlerV2) listCategories(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{"items": EnterpriseRuleCategories()})
}

func (h *HandlerV2) createRuleSet(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var rs RuleSetV2
	if err := json.Unmarshal(body, &rs); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	result, err := h.repo.SaveV2(r.Context(), tID, userID, rs)
	if err != nil {
		slog.Error("create rule set v2", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create rule set"})
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *HandlerV2) listRuleSets(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")
	category := r.URL.Query().Get("category")
	items, err := h.repo.ListV2(r.Context(), tID, entityType, category)
	if err != nil {
		slog.Error("list rule sets v2", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list rule sets"})
		return
	}
	if items == nil {
		items = []RuleSetV2{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

func (h *HandlerV2) getRuleSet(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")
	rs, err := h.repo.GetV2(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "rule set not found"})
		return
	}
	writeJSON(w, http.StatusOK, rs)
}

func (h *HandlerV2) updateRuleSet(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var rs RuleSetV2
	if err := json.Unmarshal(body, &rs); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	rs.ID = chi.URLParam(r, "id")
	result, err := h.repo.SaveV2(r.Context(), tID, userID, rs)
	if err != nil {
		slog.Error("update rule set v2", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update rule set"})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *HandlerV2) deleteRuleSet(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")
	if err := h.repo.Delete(r.Context(), tID, id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete rule set"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Simulation ──────────────────────────────────────────────────────────────

func (h *HandlerV2) simulate(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req SimulationRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.RuleSetKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "rule_set_key is required"})
		return
	}
	if req.Payload == nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "payload is required"})
		return
	}
	if req.TriggerType == "" {
		req.TriggerType = "server"
	}

	result, err := h.simulator.Simulate(r.Context(), tID, req)
	if err != nil {
		slog.Error("rule simulation failed", "rule_set_key", req.RuleSetKey, "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "simulation failed: " + err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// ─── Conflict Matrix ─────────────────────────────────────────────────────────

func (h *HandlerV2) listConflictMatrix(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	ruleSetKey := chi.URLParam(r, "ruleSetKey")

	matrix, err := h.conflictResolver.LoadMatrix(r.Context(), tID, ruleSetKey)
	if err != nil {
		slog.Error("load conflict matrix", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to load conflict matrix"})
		return
	}

	// Convert map to slice for JSON response
	entries := make([]ConflictMatrixEntry, 0, len(matrix))
	for _, entry := range matrix {
		entries = append(entries, entry)
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": entries})
}

type upsertConflictReq struct {
	ResolutionType   ResolutionType `json:"resolution_type"`
	CustomRuleKey    string         `json:"custom_rule_key,omitempty"`
	PriorityOverride *int           `json:"priority_override,omitempty"`
}

func (h *HandlerV2) upsertConflictEntry(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}
	ruleSetKey := chi.URLParam(r, "ruleSetKey")
	field := chi.URLParam(r, "field")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req upsertConflictReq
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	// Validate resolution type
	switch req.ResolutionType {
	case ResolutionLastWriter, ResolutionFirstWriter, ResolutionMostRestrictive, ResolutionCustomRule:
		// valid
	default:
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid resolution_type"})
		return
	}

	if req.ResolutionType == ResolutionCustomRule && req.CustomRuleKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "custom_rule_key required for custom_rule resolution"})
		return
	}

	_, err := h.conflictResolver.pool.Exec(r.Context(), `
		INSERT INTO rule_conflict_matrix (tenant_id, rule_set_key, field_name, resolution_type, custom_rule_key, priority_override, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (tenant_id, rule_set_key, field_name)
		DO UPDATE SET resolution_type = $4, custom_rule_key = $5, priority_override = $6, updated_at = NOW()`,
		tID, ruleSetKey, field, req.ResolutionType, req.CustomRuleKey, req.PriorityOverride, userID)
	if err != nil {
		slog.Error("upsert conflict entry", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save conflict entry"})
		return
	}

	// Invalidate cache
	h.conflictResolver.InvalidateCache(tID, ruleSetKey)

	writeJSON(w, http.StatusOK, map[string]string{"status": "saved"})
}

func (h *HandlerV2) deleteConflictEntry(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	ruleSetKey := chi.URLParam(r, "ruleSetKey")
	field := chi.URLParam(r, "field")

	_, err := h.conflictResolver.pool.Exec(r.Context(), `
		DELETE FROM rule_conflict_matrix
		WHERE tenant_id = $1 AND rule_set_key = $2 AND field_name = $3`,
		tID, ruleSetKey, field)
	if err != nil {
		slog.Error("delete conflict entry", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete conflict entry"})
		return
	}

	h.conflictResolver.InvalidateCache(tID, ruleSetKey)
	w.WriteHeader(http.StatusNoContent)
}

// ─── Execution Log ───────────────────────────────────────────────────────────

func (h *HandlerV2) queryExecutionLog(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	ruleSetKey := r.URL.Query().Get("rule_set_key")
	entityType := r.URL.Query().Get("entity_type")
	entityID := r.URL.Query().Get("entity_id")
	simulationOnly := r.URL.Query().Get("simulation") == "true"
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 200 {
		limit = l
	}

	query := `
		SELECT id, tenant_id, rule_set_key, entity_type, entity_id, trigger_type,
		       fired_rules, mutations, violations, warnings,
		       field_behaviors, approval_requests, conflict_log,
		       execution_ms, is_simulation, created_at
		FROM rule_execution_log
		WHERE tenant_id = $1`
	args := []any{tID}
	argN := 2

	if ruleSetKey != "" {
		query += " AND rule_set_key = $" + strconv.Itoa(argN)
		args = append(args, ruleSetKey)
		argN++
	}
	if entityType != "" {
		query += " AND entity_type = $" + strconv.Itoa(argN)
		args = append(args, entityType)
		argN++
	}
	if entityID != "" {
		query += " AND entity_id = $" + strconv.Itoa(argN)
		args = append(args, entityID)
		argN++
	}
	if simulationOnly {
		query += " AND is_simulation = true"
	}
	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argN)
	args = append(args, limit)

	rows, err := h.conflictResolver.pool.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("query execution log", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to query execution log"})
		return
	}
	defer rows.Close()

	type logRow struct {
		ID               string          `json:"id"`
		TenantID         string          `json:"tenant_id"`
		RuleSetKey       string          `json:"rule_set_key"`
		EntityType       string          `json:"entity_type"`
		EntityID         string          `json:"entity_id"`
		TriggerType      string          `json:"trigger_type"`
		FiredRules       json.RawMessage `json:"fired_rules"`
		Mutations        json.RawMessage `json:"mutations"`
		Violations       json.RawMessage `json:"violations"`
		Warnings         json.RawMessage `json:"warnings"`
		FieldBehaviors   json.RawMessage `json:"field_behaviors"`
		ApprovalRequests json.RawMessage `json:"approval_requests"`
		ConflictLog      json.RawMessage `json:"conflict_log"`
		ExecutionMs      int             `json:"execution_ms"`
		IsSimulation     bool            `json:"is_simulation"`
		CreatedAt        string          `json:"created_at"`
	}

	var items []logRow
	for rows.Next() {
		var row logRow
		var createdAt interface{}
		if err := rows.Scan(
			&row.ID, &row.TenantID, &row.RuleSetKey, &row.EntityType, &row.EntityID,
			&row.TriggerType, &row.FiredRules, &row.Mutations, &row.Violations, &row.Warnings,
			&row.FieldBehaviors, &row.ApprovalRequests, &row.ConflictLog,
			&row.ExecutionMs, &row.IsSimulation, &createdAt,
		); err != nil {
			slog.Error("scan execution log row", "error", err)
			continue
		}
		if t, ok := createdAt.(interface{ String() string }); ok {
			row.CreatedAt = t.String()
		}
		items = append(items, row)
	}
	if items == nil {
		items = []logRow{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}

// ─── Classification-Filtered Listing ─────────────────────────────────────────

func (h *HandlerV2) listByClassification(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")
	classification := r.URL.Query().Get("classification")
	category := r.URL.Query().Get("category")
	if category == "" {
		category = classification
	}
	items, err := h.repo.ListV2(r.Context(), tID, entityType, category)
	if err != nil {
		slog.Error("list rules by classification", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list rules"})
		return
	}
	if items == nil {
		items = []RuleSetV2{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}
