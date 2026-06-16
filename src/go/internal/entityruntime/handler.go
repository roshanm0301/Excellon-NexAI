package entityruntime

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/excellon/nexai/internal/audit"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/middleware"
	"github.com/go-chi/chi/v5"
)

const (
	TriggerOnCreate = "on_create"
	TriggerOnUpdate = "on_update"
)

type Handler struct {
	repo   *Repo
	pool   *db.Pool
	policy *RuntimePolicy
}

func NewHandler(repo *Repo) *Handler {
	return &Handler{repo: repo}
}

func NewHandlerWithPool(repo *Repo, pool *db.Pool) *Handler {
	return &Handler{repo: repo, pool: pool}
}

func (h *Handler) SetRuntimePolicy(policy *RuntimePolicy) {
	h.policy = policy
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/", h.create)
	r.Get("/", h.list)
	r.Get("/{id}", h.get)
	r.Put("/{id}", h.update)
	r.Delete("/{id}", h.delete)
	r.Post("/{id}/restore", h.restore)
	r.Get("/{id}/history", h.history)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	tenantID, userID, role := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")

	var req CreateEntityRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Payload == nil {
		req.Payload = []byte(`{}`)
	}

	status := "DRAFT"
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		status = strings.TrimSpace(*req.Status)
	}
	triggerType := req.TriggerType
	if triggerType == "" {
		triggerType = TriggerOnCreate
	}
	payload, ruleResult, err := h.evaluateWriteRules(r.Context(), tenantID, entityType, "", status, req.Payload, triggerType, nil)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	rec, err := h.repo.CreateWithStatus(r.Context(), tenantID, entityType, "", userID, payload, status)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create record")
		return
	}
	rec.RuleResult = ruleResult

	if h.pool != nil {
		var afterMap map[string]any
		_ = json.Unmarshal(rec.Payload, &afterMap)
		go audit.Record(context.Background(), h.pool, audit.Event{
			TenantID:   tenantID,
			EntityType: entityType,
			EntityID:   rec.ID,
			EventType:  "entity.create",
			ActorID:    userID,
			Role:       role,
			After:      afterMap,
		})
	}
	writeJSON(w, http.StatusCreated, rec)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tenantID, _, _ := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	records, total, err := h.repo.List(r.Context(), tenantID, entityType, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list records")
		return
	}
	if records == nil {
		records = []EntityRecord{}
	}
	writeJSON(w, http.StatusOK, EntityListResponse{Items: records, Total: total})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	tenantID, _, _ := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")
	rec, err := h.repo.GetByID(r.Context(), tenantID, entityType, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, rec)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	tenantID, userID, role := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")
	id := chi.URLParam(r, "id")

	before, _ := h.repo.GetByID(r.Context(), tenantID, entityType, id)

	var req UpdateEntityRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Payload == nil {
		if before != nil {
			req.Payload = before.Payload
		} else {
			req.Payload = []byte(`{}`)
		}
	}
	status := ""
	if before != nil {
		status = before.Status
	}
	if req.Status != nil && strings.TrimSpace(*req.Status) != "" {
		status = strings.TrimSpace(*req.Status)
	}
	triggerType := req.TriggerType
	if triggerType == "" {
		triggerType = TriggerOnUpdate
	}
	payload, ruleResult, err := h.evaluateWriteRules(r.Context(), tenantID, entityType, id, status, req.Payload, triggerType, nil)
	if err != nil {
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	rec, err := h.repo.UpdateWithStatus(r.Context(), tenantID, entityType, id, userID, payload, status)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	rec.RuleResult = ruleResult

	if h.pool != nil {
		var beforeMap, afterMap map[string]any
		if before != nil {
			_ = json.Unmarshal(before.Payload, &beforeMap)
		}
		_ = json.Unmarshal(rec.Payload, &afterMap)
		go audit.Record(context.Background(), h.pool, audit.Event{
			TenantID:   tenantID,
			EntityType: entityType,
			EntityID:   rec.ID,
			EventType:  "entity.update",
			ActorID:    userID,
			Role:       role,
			Before:     beforeMap,
			After:      afterMap,
		})
	}
	writeJSON(w, http.StatusOK, rec)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	tenantID, userID, role := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")
	id := chi.URLParam(r, "id")

	if err := h.repo.SoftDelete(r.Context(), tenantID, entityType, id, userID); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	if h.pool != nil {
		go audit.Record(context.Background(), h.pool, audit.Event{
			TenantID:   tenantID,
			EntityType: entityType,
			EntityID:   id,
			EventType:  "entity.delete",
			ActorID:    userID,
			Role:       role,
		})
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) restore(w http.ResponseWriter, r *http.Request) {
	tenantID, userID, role := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")
	id := chi.URLParam(r, "id")

	rec, err := h.repo.Restore(r.Context(), tenantID, entityType, id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	if h.pool != nil {
		var afterMap map[string]any
		_ = json.Unmarshal(rec.Payload, &afterMap)
		go audit.Record(context.Background(), h.pool, audit.Event{
			TenantID:   tenantID,
			EntityType: entityType,
			EntityID:   id,
			EventType:  "entity.restore",
			ActorID:    userID,
			Role:       role,
			After:      afterMap,
		})
	}
	writeJSON(w, http.StatusOK, rec)
}

func (h *Handler) history(w http.ResponseWriter, r *http.Request) {
	tenantID, _, _ := tenantUserRole(r)
	entityType := chi.URLParam(r, "entityType")
	id := chi.URLParam(r, "id")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	events, total, err := h.repo.GetHistory(r.Context(), tenantID, entityType, id, limit, offset)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get history")
		return
	}
	if events == nil {
		events = []AuditEventRecord{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": events, "total": total})
}

func (h *Handler) evaluateWriteRules(ctx context.Context, tenantID, entityType, entityID, status string, raw json.RawMessage, triggerType string, extraFacts map[string]any) (json.RawMessage, *EvalResultV2, error) {
	payloadMap := PayloadMap(raw)
	if h.policy == nil || h.policy.ruleEvaluator == nil {
		return PayloadBytes(payloadMap), nil, nil
	}
	facts := RuleFacts(entityType, entityID, status, payloadMap)
	for k, v := range extraFacts {
		facts[k] = v
	}
	result, err := h.policy.ruleEvaluator.Evaluate(ctx, tenantID, entityType, facts, triggerType)
	if err != nil {
		return nil, nil, err
	}
	if result.Blocked {
		msg := result.BlockMessage
		if msg == "" {
			msg = "record blocked by rule"
		}
		return nil, result, fmt.Errorf("%s", msg)
	}
	payloadMap = ApplyRuleMutations(payloadMap, result)
	if err := ValidateRequiredFields(payloadMap, result); err != nil {
		return nil, result, err
	}
	if err := h.executeRuleServiceInvocations(ctx, tenantID, entityType, entityID, result); err != nil {
		return nil, result, err
	}
	return PayloadBytes(payloadMap), result, nil
}

func tenantUserRole(r *http.Request) (string, string, string) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	role := middleware.Role(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}
	return tenantID, userID, role
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("response encode", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func decodeJSON(r *http.Request, v any) error {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		return err
	}
	return json.Unmarshal(body, v)
}
