package recycle

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/middleware"
)

// Handler exposes HTTP routes for the recycle bin.
type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/", h.list)
	r.Post("/{id}/restore", h.restore)
	r.Post("/{id}/purge", h.purge)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	entityType := r.URL.Query().Get("entity_type")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	records, err := h.svc.List(r.Context(), tenantID, entityType, limit, offset)
	if err != nil {
		slog.Error("recycle list", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list recycle bin")
		return
	}
	if records == nil {
		records = []EntityRecord{}
	}
	writeJSON(w, http.StatusOK, records)
}

func (h *Handler) restore(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.Restore(r.Context(), tenantID, id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "restored"})
}

func (h *Handler) purge(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	id := chi.URLParam(r, "id")
	if err := h.svc.PurgeRecord(r.Context(), tenantID, id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("recycle response encode", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
