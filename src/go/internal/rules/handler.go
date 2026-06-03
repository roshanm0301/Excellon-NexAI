package rules

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/middleware"
)

type Handler struct {
	repo      *Repo
	evaluator *ProductionEvaluator
}

func NewHandler(repo *Repo, evaluator *ProductionEvaluator) *Handler {
	return &Handler{repo: repo, evaluator: evaluator}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/", h.create)
	r.Get("/{id}", h.get)
	r.Put("/{id}", h.update)
	r.Delete("/{id}", h.delete)
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")
	rs, err := h.repo.GetByID(r.Context(), tID, id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "rule set not found"})
		return
	}
	writeJSON(w, http.StatusOK, rs)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	entityType := r.URL.Query().Get("entity_type")
	sets, err := h.repo.ListForEntity(r.Context(), tID, entityType)
	if err != nil {
		slog.Error("rules list", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list rules"})
		return
	}
	if sets == nil {
		sets = []RuleSet{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": sets})
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}
	var rs RuleSet
	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err := json.Unmarshal(body, &rs); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}
	rec, err := h.repo.Save(r.Context(), tID, userID, rs)
	if err != nil {
		slog.Error("rules create", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to save rule"})
		return
	}
	writeJSON(w, http.StatusCreated, rec)
}

func (h *Handler) update(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}
	var rs RuleSet
	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err := json.Unmarshal(body, &rs); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request"})
		return
	}
	rs.ID = chi.URLParam(r, "id")
	rec, err := h.repo.Save(r.Context(), tID, userID, rs)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update rule"})
		return
	}
	writeJSON(w, http.StatusOK, rec)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")
	if err := h.repo.Delete(r.Context(), tID, id); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete rule"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
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
