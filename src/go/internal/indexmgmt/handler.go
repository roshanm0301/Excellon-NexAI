package indexmgmt

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/middleware"
)

// Handler exposes HTTP routes for the index management queue.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/{id}/apply", h.apply)
	r.Post("/{id}/discard", h.discard)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	entityKey := r.URL.Query().Get("entity_key")

	items, err := h.svc.List(r.Context(), tenantID, entityKey)
	if err != nil {
		slog.Error("indexmgmt list", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list index queue")
		return
	}
	if items == nil {
		items = []IndexQueueItem{}
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *Handler) apply(w http.ResponseWriter, r *http.Request) {
	if err := h.svc.ApplyNext(r.Context()); err != nil {
		slog.Error("indexmgmt apply", "error", err)
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "applied"})
}

func (h *Handler) discard(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.svc.Discard(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("indexmgmt response encode", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
