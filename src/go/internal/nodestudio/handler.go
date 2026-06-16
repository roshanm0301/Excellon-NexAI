package nodestudio

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/excellon/nexai/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

type Handler struct {
	repo *Repo
}

func NewHandler(repo *Repo) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Get("/", h.list)
	r.With(middleware.RequireRole("designer")).Post("/", h.create)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant")
		return
	}

	items, err := h.repo.List(r.Context(), tenantID)
	if err != nil {
		slog.Error("nodestudio: list", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to list nodes")
		return
	}
	writeJSON(w, http.StatusOK, NodeListResponse{Items: items})
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	if tenantID == "" || userID == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant or user")
		return
	}

	var req CreateNodeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Name == "" || req.NodeType == "" {
		writeError(w, r, http.StatusUnprocessableEntity, "name and node_type are required")
		return
	}

	node, err := h.repo.Create(r.Context(), tenantID, userID, req)
	if err != nil {
		slog.Error("nodestudio: create", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to create node")
		return
	}
	writeJSON(w, http.StatusCreated, node)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("nodestudio: encode response", "error", err)
	}
}

func writeError(w http.ResponseWriter, r *http.Request, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"error": map[string]any{
			"code":     errorCodeForStatus(status),
			"message":  message,
			"trace_id": chimw.GetReqID(r.Context()),
		},
	})
}

func errorCodeForStatus(status int) string {
	switch status {
	case http.StatusBadRequest:
		return "BAD_REQUEST"
	case http.StatusForbidden:
		return "FORBIDDEN"
	case http.StatusUnprocessableEntity:
		return "VALIDATION_ERROR"
	default:
		if status >= 500 {
			return "INTERNAL_ERROR"
		}
		return "REQUEST_ERROR"
	}
}
