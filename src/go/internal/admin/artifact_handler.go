package admin

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/middleware"
)

type ArtifactHandler struct {
	repo     *ArtifactRepo
	compiler *compiler.Service
}

func NewArtifactHandler(repo *ArtifactRepo, svc *compiler.Service) *ArtifactHandler {
	return &ArtifactHandler{repo: repo, compiler: svc}
}

func (h *ArtifactHandler) RegisterRoutes(r chi.Router) {
	r.Post("/", h.create)
	r.Get("/", h.list)
	r.Get("/{id}", h.get)
	r.Put("/{id}", h.save)
	r.Post("/{id}/fork", h.fork)
	r.Post("/{id}/publish", h.publish)
}

func (h *ArtifactHandler) create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	var req CreateArtifactRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.ArtifactName == "" || req.ArtifactType == "" {
		writeError(w, http.StatusBadRequest, "artifact_name and artifact_type are required")
		return
	}

	a, err := h.repo.Create(r.Context(), tenantID, req.ArtifactName, req.ArtifactType, req.NodeID, userID, req.Payload)
	if err != nil {
		slog.Error("artifact create", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create artifact")
		return
	}
	writeJSON(w, http.StatusCreated, a)
}

func (h *ArtifactHandler) list(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}

	artifactType := r.URL.Query().Get("artifact_type")
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	items, total, err := h.repo.List(r.Context(), tenantID, artifactType, limit, offset)
	if err != nil {
		slog.Error("artifact list", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list artifacts")
		return
	}
	if items == nil {
		items = []ArtifactVersion{}
	}
	writeJSON(w, http.StatusOK, ArtifactListResponse{Items: items, Total: total})
}

func (h *ArtifactHandler) get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	a, err := h.repo.GetByID(r.Context(), tenantID, chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *ArtifactHandler) save(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	var req SaveArtifactRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	a, err := h.repo.Save(r.Context(), tenantID, chi.URLParam(r, "id"), req.Payload)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, a)
}

func (h *ArtifactHandler) fork(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}
	a, err := h.repo.Fork(r.Context(), tenantID, chi.URLParam(r, "id"), userID)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, a)
}

func (h *ArtifactHandler) publish(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r.Context())
	userID := middleware.UserID(r.Context())
	if tenantID == "" {
		tenantID = "00000000-0000-0000-0000-000000000001"
	}
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}
	id := chi.URLParam(r, "id")

	// First compile
	artifact, err := h.repo.GetByID(r.Context(), tenantID, id)
	if err != nil {
		writeError(w, http.StatusNotFound, err.Error())
		return
	}

	compiled, err := h.compiler.Compile(r.Context(), artifact)
	if err != nil {
		slog.Error("compiler failed", "version_id", id, "error", err)
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}

	// Then mark as published
	published, err := h.repo.Publish(r.Context(), tenantID, id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"artifact": published, "compiled": compiled})
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
