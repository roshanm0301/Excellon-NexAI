package viewstudio

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/excellon/nexai/internal/middleware"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

// Handler serves the View Studio API (designer + runtime).
type Handler struct {
	repo           *Repo
	pluginsEnabled bool
}

type HandlerOptions struct {
	PluginsEnabled bool
}

func NewHandler(repo *Repo, opts ...HandlerOptions) *Handler {
	h := &Handler{repo: repo}
	if len(opts) > 0 {
		h.pluginsEnabled = opts[0].PluginsEnabled
	}
	return h
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	// ─── Designer APIs ───────────────────────────────────────────────────────
	r.Get("/views", h.listViews)
	r.Get("/views/{viewKey}", h.getView)
	r.Get("/views/{viewKey}/versions", h.listVersions)
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole("designer"))
		r.Post("/views", h.createView)
		r.Put("/views/{viewKey}/draft", h.saveDraft)
		r.Post("/views/{viewKey}/publish", h.publishView)
		r.Post("/views/{viewKey}/rollback/{versionID}", h.rollbackView)
		r.Delete("/views/{viewKey}", h.archiveView)
	})

	// ─── Runtime APIs ────────────────────────────────────────────────────────
	r.Get("/runtime/views/{viewKey}", h.runtimeGetView)
	r.Get("/runtime/views/by-code/{viewCode}", h.runtimeGetViewByCode)

	// ─── Component Registry ──────────────────────────────────────────────────
	r.Get("/component-registry", h.listComponents)
	r.Get("/component-registry/{code}", h.getComponent)

	// ─── Plugins ─────────────────────────────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireRole("designer"))
		r.Get("/plugins", h.listPlugins)
		r.Post("/plugins", h.registerPlugin)
		r.Delete("/plugins/{pluginID}", h.removePlugin)
	})
}

// ─── Designer: list views ────────────────────────────────────────────────────

func (h *Handler) listViews(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		writeError(w, r, http.StatusBadRequest, "missing x-tenant-id header")
		return
	}

	surface := r.URL.Query().Get("surface")
	entity := r.URL.Query().Get("entity")
	status := r.URL.Query().Get("status")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	views, total, err := h.repo.ListViews(r.Context(), tenantID, surface, entity, status, limit, offset)
	if err != nil {
		slog.Error("viewstudio: list views", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to list views")
		return
	}
	writeJSON(w, http.StatusOK, ViewListResponse{Items: views, Total: total})
}

// ─── Designer: create view ───────────────────────────────────────────────────

func (h *Handler) createView(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	if tenantID == "" || userID == "" {
		writeError(w, r, http.StatusBadRequest, "missing x-tenant-id or x-user-id header")
		return
	}

	var req CreateViewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := validateCreateView(req); err != nil {
		writeError(w, r, http.StatusUnprocessableEntity, err.Error())
		return
	}

	view, err := h.repo.CreateView(r.Context(), tenantID, userID, req)
	if err != nil {
		slog.Error("viewstudio: create view", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to create view")
		return
	}
	writeJSON(w, http.StatusCreated, view)
}

// ─── Designer: get single view ───────────────────────────────────────────────

func (h *Handler) getView(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	if tenantID == "" || viewKey == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant or viewKey")
		return
	}

	view, ver, err := h.repo.GetViewWithPayload(r.Context(), tenantID, viewKey)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "view not found")
		return
	}

	type viewWithPayload struct {
		*View
		LatestPayload json.RawMessage `json:"latest_payload"`
	}
	writeJSON(w, http.StatusOK, viewWithPayload{View: view, LatestPayload: ver.Payload})
}

// ─── Designer: save draft ────────────────────────────────────────────────────

func (h *Handler) saveDraft(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	if tenantID == "" || userID == "" || viewKey == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant, user, or viewKey")
		return
	}

	var req SaveDraftRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Payload) == 0 {
		writeError(w, r, http.StatusUnprocessableEntity, "payload is required")
		return
	}

	ver, err := h.repo.SaveDraft(r.Context(), tenantID, viewKey, userID, req.Payload)
	if err != nil {
		slog.Error("viewstudio: save draft", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to save draft")
		return
	}
	writeJSON(w, http.StatusOK, ver)
}

// ─── Designer: publish ───────────────────────────────────────────────────────

func (h *Handler) publishView(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	if tenantID == "" || userID == "" || viewKey == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant, user, or viewKey")
		return
	}

	var req PublishRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	ver, err := h.repo.Publish(r.Context(), tenantID, viewKey, userID, req.Changelog)
	if err != nil {
		slog.Error("viewstudio: publish", "error", err)
		writeError(w, r, http.StatusConflict, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, ver)
}

// ─── Designer: rollback ──────────────────────────────────────────────────────

func (h *Handler) rollbackView(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	versionID := chi.URLParam(r, "versionID")
	if tenantID == "" || userID == "" || viewKey == "" || versionID == "" {
		writeError(w, r, http.StatusBadRequest, "missing required params")
		return
	}

	var req RollbackRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	ver, err := h.repo.Rollback(r.Context(), tenantID, viewKey, versionID, userID, req.Changelog)
	if err != nil {
		slog.Error("viewstudio: rollback", "error", err)
		writeError(w, r, http.StatusConflict, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, ver)
}

// ─── Designer: archive ───────────────────────────────────────────────────────

func (h *Handler) archiveView(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	if tenantID == "" || userID == "" || viewKey == "" {
		writeError(w, r, http.StatusBadRequest, "missing required params")
		return
	}

	if err := h.repo.ArchiveView(r.Context(), tenantID, viewKey, userID); err != nil {
		slog.Error("viewstudio: archive", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to archive view")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Designer: list versions ─────────────────────────────────────────────────

func (h *Handler) listVersions(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	if tenantID == "" || viewKey == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant or viewKey")
		return
	}

	versions, err := h.repo.ListVersions(r.Context(), tenantID, viewKey)
	if err != nil {
		slog.Error("viewstudio: list versions", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to list versions")
		return
	}
	writeJSON(w, http.StatusOK, VersionListResponse{Items: versions})
}

// ─── Runtime: get published view by artifact ID ──────────────────────────────

func (h *Handler) runtimeGetView(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	viewKey := chi.URLParam(r, "viewKey")
	if tenantID == "" || viewKey == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant or viewKey")
		return
	}

	ver, err := h.repo.GetPublishedView(r.Context(), tenantID, viewKey)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "no published version found")
		return
	}
	writeJSON(w, http.StatusOK, ver)
}

// ─── Runtime: get published view by view_code ────────────────────────────────

func (h *Handler) runtimeGetViewByCode(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	viewCode := chi.URLParam(r, "viewCode")
	entity := r.URL.Query().Get("entity")
	surface := r.URL.Query().Get("surface")
	if tenantID == "" || viewCode == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant or viewCode")
		return
	}
	if entity == "" || surface == "" {
		writeError(w, r, http.StatusBadRequest, "entity and surface query parameters are required for ViewCode runtime lookup")
		return
	}

	ver, err := h.repo.GetPublishedViewByCode(r.Context(), tenantID, viewCode, entity, surface)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "no published view for this code")
		return
	}
	writeJSON(w, http.StatusOK, ver)
}

// ─── Component Registry ──────────────────────────────────────────────────────

func (h *Handler) listComponents(w http.ResponseWriter, r *http.Request) {
	surface := r.URL.Query().Get("surface")
	category := r.URL.Query().Get("category")

	entries, err := h.repo.ListComponents(r.Context(), surface, category)
	if err != nil {
		slog.Error("viewstudio: list components", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to list components")
		return
	}
	writeJSON(w, http.StatusOK, entries)
}

func (h *Handler) getComponent(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")
	if code == "" {
		writeError(w, r, http.StatusBadRequest, "missing component code")
		return
	}

	entry, err := h.repo.GetComponent(r.Context(), code)
	if err != nil {
		writeError(w, r, http.StatusNotFound, "component not found")
		return
	}
	writeJSON(w, http.StatusOK, entry)
}

// ─── Plugins ─────────────────────────────────────────────────────────────────

func (h *Handler) listPlugins(w http.ResponseWriter, r *http.Request) {
	if !h.pluginsEnabled {
		writeError(w, r, http.StatusNotFound, "plugin management is disabled")
		return
	}
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		writeError(w, r, http.StatusBadRequest, "missing x-tenant-id")
		return
	}

	plugins, err := h.repo.ListPlugins(r.Context(), tenantID)
	if err != nil {
		slog.Error("viewstudio: list plugins", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to list plugins")
		return
	}
	writeJSON(w, http.StatusOK, plugins)
}

func (h *Handler) registerPlugin(w http.ResponseWriter, r *http.Request) {
	if !h.pluginsEnabled {
		writeError(w, r, http.StatusNotFound, "plugin management is disabled")
		return
	}
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		writeError(w, r, http.StatusBadRequest, "missing x-tenant-id")
		return
	}

	var req RegisterPluginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, r, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.PluginName == "" || req.Version == "" {
		writeError(w, r, http.StatusUnprocessableEntity, "plugin_name and version are required")
		return
	}

	plugin, err := h.repo.RegisterPlugin(r.Context(), tenantID, req)
	if err != nil {
		slog.Error("viewstudio: register plugin", "error", err)
		writeError(w, r, http.StatusInternalServerError, "failed to register plugin")
		return
	}
	writeJSON(w, http.StatusCreated, plugin)
}

func (h *Handler) removePlugin(w http.ResponseWriter, r *http.Request) {
	if !h.pluginsEnabled {
		writeError(w, r, http.StatusNotFound, "plugin management is disabled")
		return
	}
	tenantID := middleware.TenantID(r.Context())
	pluginID := chi.URLParam(r, "pluginID")
	if tenantID == "" || pluginID == "" {
		writeError(w, r, http.StatusBadRequest, "missing tenant or pluginID")
		return
	}

	if err := h.repo.RemovePlugin(r.Context(), tenantID, pluginID); err != nil {
		writeError(w, r, http.StatusNotFound, "plugin not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("viewstudio: encode response", "error", err)
	}
}

func writeError(w http.ResponseWriter, r *http.Request, status int, msg string, details ...any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	errBody := map[string]any{
		"code":     errorCodeForStatus(status),
		"message":  msg,
		"trace_id": chimw.GetReqID(r.Context()),
	}
	if len(details) > 0 && details[0] != nil {
		errBody["details"] = details[0]
	}
	_ = json.NewEncoder(w).Encode(map[string]any{"error": errBody})
}

func errorCodeForStatus(status int) string {
	switch status {
	case http.StatusBadRequest:
		return "BAD_REQUEST"
	case http.StatusUnauthorized:
		return "AUTH_REQUIRED"
	case http.StatusForbidden:
		return "FORBIDDEN"
	case http.StatusNotFound:
		return "NOT_FOUND"
	case http.StatusConflict:
		return "CONFLICT"
	case http.StatusUnprocessableEntity:
		return "VALIDATION_ERROR"
	default:
		if status >= 500 {
			return "INTERNAL_ERROR"
		}
		return "REQUEST_ERROR"
	}
}
