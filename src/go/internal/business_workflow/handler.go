package business_workflow

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/middleware"
)

type Handler struct {
	engine *Engine
	repo   *Repo
}

func NewHandler(engine *Engine, pool *db.Pool) *Handler {
	return &Handler{engine: engine, repo: NewRepo(pool)}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/definitions", h.createDefinition)
	r.Get("/definitions", h.listDefinitions)
	r.Get("/definitions/{id}", h.getDefinition)

	r.Post("/instances", h.startInstance)
	r.Get("/instances", h.listInstances)
	r.Get("/instances/{id}", h.getInstance)
	r.Post("/instances/{id}/advance", h.advanceStep)
	r.Post("/instances/{id}/abort", h.abortInstance)
}

func (h *Handler) createDefinition(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var pd ProcessDefinition
	if err := json.Unmarshal(body, &pd); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	result, err := h.repo.CreateDefinition(r.Context(), tID, userID, &pd)
	if err != nil {
		slog.Error("business_workflow: create definition", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create definition"})
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *Handler) listDefinitions(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")

	defs, err := h.repo.ListDefinitions(r.Context(), tID, entityType)
	if err != nil {
		slog.Error("business_workflow: list definitions", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list definitions"})
		return
	}
	if defs == nil {
		defs = []ProcessDefinition{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": defs})
}

func (h *Handler) getDefinition(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	def, err := h.repo.GetDefinition(r.Context(), tID, id)
	if err != nil {
		slog.Error("business_workflow: get definition", "error", err, "id", id)
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "definition not found"})
		return
	}
	writeJSON(w, http.StatusOK, def)
}

func (h *Handler) startInstance(w http.ResponseWriter, r *http.Request) {
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

	inst, err := h.engine.StartProcess(r.Context(), tID, req.DefinitionID, req.EntityType, req.EntityID, req.Context)
	if err != nil {
		slog.Error("business_workflow: start instance", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to start process"})
		return
	}
	writeJSON(w, http.StatusCreated, inst)
}

func (h *Handler) listInstances(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entityType")
	entityID := r.URL.Query().Get("entityId")

	instances, err := h.repo.ListInstances(r.Context(), tID, entityType, entityID)
	if err != nil {
		slog.Error("business_workflow: list instances", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list instances"})
		return
	}
	if instances == nil {
		instances = []ProcessInstance{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": instances})
}

func (h *Handler) getInstance(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	inst, err := h.repo.GetInstance(r.Context(), tID, id)
	if err != nil {
		slog.Error("business_workflow: get instance", "error", err, "id", id)
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "instance not found"})
		return
	}
	writeJSON(w, http.StatusOK, inst)
}

func (h *Handler) advanceStep(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var data map[string]any
	if len(body) > 0 {
		json.Unmarshal(body, &data) //nolint
	}

	inst, err := h.engine.AdvanceStep(r.Context(), tID, id, data)
	if err != nil {
		slog.Error("business_workflow: advance step", "error", err, "id", id)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, inst)
}

func (h *Handler) abortInstance(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		Reason string `json:"reason"`
	}
	json.Unmarshal(body, &req) //nolint

	inst, err := h.engine.AbortProcess(r.Context(), tID, id, req.Reason)
	if err != nil {
		slog.Error("business_workflow: abort instance", "error", err, "id", id)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, inst)
}

func tenantID(r *http.Request) string {
	t := middleware.TenantID(r.Context())
	if t == "" {
		return "00000000-0000-0000-0000-000000000001"
	}
	return t
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}
