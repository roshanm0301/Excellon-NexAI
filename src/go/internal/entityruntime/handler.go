package entityruntime

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/audit"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/middleware"
)

type Handler struct {
	repo *Repo
	pool *db.Pool
}

func NewHandler(repo *Repo) *Handler {
	return &Handler{repo: repo}
}

func NewHandlerWithPool(repo *Repo, pool *db.Pool) *Handler {
	return &Handler{repo: repo, pool: pool}
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

	rec, err := h.repo.Create(r.Context(), tenantID, entityType, "", userID, req.Payload)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create record")
		return
	}

	if h.pool != nil {
		var afterMap map[string]any
		_ = json.Unmarshal(rec.Payload, &afterMap)
		go audit.Record(r.Context(), h.pool, audit.Event{
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

	rec, err := h.repo.Update(r.Context(), tenantID, entityType, id, userID, req.Payload)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	if h.pool != nil {
		var beforeMap, afterMap map[string]any
		if before != nil {
			_ = json.Unmarshal(before.Payload, &beforeMap)
		}
		_ = json.Unmarshal(rec.Payload, &afterMap)
		go audit.Record(r.Context(), h.pool, audit.Event{
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
		go audit.Record(r.Context(), h.pool, audit.Event{
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
		go audit.Record(r.Context(), h.pool, audit.Event{
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
