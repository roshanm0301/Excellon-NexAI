package overlay

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Handler struct {
	repo     *Repo
	resolver *Resolver
}

func NewHandler(repo *Repo, resolver *Resolver) *Handler {
	return &Handler{repo: repo, resolver: resolver}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/", h.create)
	r.Get("/", h.list)
	r.Delete("/{id}", h.delete)
}

func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var def OverlayDefinition
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read body")
		return
	}
	if err := json.Unmarshal(body, &def); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if def.TenantID == "" || def.EntityType == "" || def.Layer == "" {
		writeError(w, http.StatusBadRequest, "tenant_id, entity_type, and layer are required")
		return
	}
	if err := h.repo.Create(r.Context(), &def); err != nil {
		slog.Error("overlay create", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create overlay")
		return
	}
	writeJSON(w, http.StatusCreated, def)
}

func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tenantID := r.URL.Query().Get("tenant_id")
	entityType := r.URL.Query().Get("entity_type")
	if tenantID == "" || entityType == "" {
		writeError(w, http.StatusBadRequest, "tenant_id and entity_type query params required")
		return
	}
	defs, err := h.repo.List(r.Context(), tenantID, entityType)
	if err != nil {
		slog.Error("overlay list", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list overlays")
		return
	}
	if defs == nil {
		defs = []OverlayDefinition{}
	}
	writeJSON(w, http.StatusOK, defs)
}

func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if err := h.repo.Delete(r.Context(), id); err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("overlay response encode", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
