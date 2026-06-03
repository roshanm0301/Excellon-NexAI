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

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/middleware"
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
	ResolutionType ResolutionType `json:"resolution_type"`
	CustomRuleKey  string         `json:"custom_rule_key,omitempty"`
	PriorityOverride *int        `json:"priority_override,omitempty"`
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

	query := `
		SELECT id, tenant_id, entity_type, name, definition, enabled, content_type,
		       classifications, priority, hit_policy, created_at, updated_at
		FROM rule_set
		WHERE tenant_id = $1 AND deleted_at IS NULL`
	args := []any{tID}
	argN := 2

	if entityType != "" {
		query += " AND entity_type = $" + strconv.Itoa(argN)
		args = append(args, entityType)
		argN++
	}
	if classification != "" {
		query += " AND $" + strconv.Itoa(argN) + " = ANY(classifications)"
		args = append(args, classification)
		argN++
	}
	query += " ORDER BY priority ASC, created_at DESC"

	rows, err := h.conflictResolver.pool.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("list rules by classification", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list rules"})
		return
	}
	defer rows.Close()

	type ruleItem struct {
		ID              string   `json:"id"`
		TenantID        string   `json:"tenant_id"`
		EntityType      string   `json:"entity_type"`
		Name            string   `json:"name"`
		Enabled         bool     `json:"enabled"`
		ContentType     string   `json:"content_type"`
		Classifications []string `json:"classifications"`
		Priority        int      `json:"priority"`
		HitPolicy       *string  `json:"hit_policy"`
		CreatedAt       string   `json:"created_at"`
		UpdatedAt       string   `json:"updated_at"`
	}

	var items []ruleItem
	for rows.Next() {
		var item ruleItem
		var definition json.RawMessage
		var classifications []string
		var createdAt, updatedAt interface{}
		if err := rows.Scan(
			&item.ID, &item.TenantID, &item.EntityType, &item.Name,
			&definition, &item.Enabled, &item.ContentType,
			&classifications, &item.Priority, &item.HitPolicy,
			&createdAt, &updatedAt,
		); err != nil {
			slog.Error("scan rule item", "error", err)
			continue
		}
		item.Classifications = classifications
		if item.Classifications == nil {
			item.Classifications = []string{}
		}
		items = append(items, item)
	}
	if items == nil {
		items = []ruleItem{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": items})
}
