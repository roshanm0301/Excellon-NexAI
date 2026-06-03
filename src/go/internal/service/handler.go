package service

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/excellon/nexai/internal/middleware"
)

// Handler provides HTTP endpoints for the service layer.
type Handler struct {
	registry *Registry
}

// NewHandler creates a Handler with the given registry.
func NewHandler(registry *Registry) *Handler {
	return &Handler{registry: registry}
}

// RegisterRoutes mounts service endpoints on the chi router.
func (h *Handler) RegisterRoutes(r chi.Router) {
	// Service registrations
	r.Get("/services", h.listServices)
	r.Post("/services", h.createService)
	r.Get("/services/{key}", h.getService)
	r.Put("/services/{id}", h.updateService)
	r.Delete("/services/{id}", h.deleteService)

	// Invocation
	r.Post("/services/invoke", h.invokeService)
	r.Post("/services/{key}/invoke", h.invokeServiceByKey)

	// Logs
	r.Get("/services/{key}/logs", h.getInvocationLogs)
}

func (h *Handler) listServices(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)

	services, err := h.registry.ListServices(r.Context(), tID)
	if err != nil {
		slog.Error("service_handler: list services", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to list services"})
		return
	}
	if services == nil {
		services = []*ServiceRegistration{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": services})
}

func (h *Handler) createService(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	userID := middleware.UserID(r.Context())
	if userID == "" {
		userID = "00000000-0000-0000-0000-000000000001"
	}

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var reg ServiceRegistration
	if err := json.Unmarshal(body, &reg); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if reg.ServiceKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "serviceKey is required"})
		return
	}
	if reg.Name == "" {
		reg.Name = reg.ServiceKey
	}

	result, err := h.registry.CreateRegistration(r.Context(), tID, userID, &reg)
	if err != nil {
		slog.Error("service_handler: create service", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create service"})
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *Handler) getService(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	key := chi.URLParam(r, "key")

	svc, err := h.registry.GetService(r.Context(), tID, key)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "service not found"})
		return
	}
	writeJSON(w, http.StatusOK, svc)
}

func (h *Handler) updateService(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var reg ServiceRegistration
	if err := json.Unmarshal(body, &reg); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	reg.ID = id

	if err := h.registry.UpdateRegistration(r.Context(), tID, &reg); err != nil {
		slog.Error("service_handler: update service", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to update service"})
		return
	}
	writeJSON(w, http.StatusOK, reg)
}

func (h *Handler) deleteService(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	id := chi.URLParam(r, "id")

	if err := h.registry.DeleteRegistration(r.Context(), tID, id); err != nil {
		slog.Error("service_handler: delete service", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to delete service"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *Handler) invokeService(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req InvokeRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	req.TenantID = tID

	if req.ServiceKey == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "serviceKey is required"})
		return
	}
	if req.Method == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "method is required"})
		return
	}

	resp, err := h.registry.Invoke(r.Context(), &req)
	if err != nil {
		slog.Error("service_handler: invoke", "error", err, "service", req.ServiceKey)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	if resp.Success {
		writeJSON(w, http.StatusOK, resp)
	} else {
		writeJSON(w, http.StatusUnprocessableEntity, resp)
	}
}

func (h *Handler) invokeServiceByKey(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	key := chi.URLParam(r, "key")

	body, _ := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	var req struct {
		Method string         `json:"method"`
		Input  map[string]any `json:"input"`
		Caller string         `json:"caller"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Method == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "method is required"})
		return
	}

	invokeReq := &InvokeRequest{
		ServiceKey: key,
		Method:     req.Method,
		TenantID:   tID,
		Caller:     req.Caller,
		Input:      req.Input,
	}

	resp, err := h.registry.Invoke(r.Context(), invokeReq)
	if err != nil {
		slog.Error("service_handler: invoke by key", "error", err, "service", key)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	if resp.Success {
		writeJSON(w, http.StatusOK, resp)
	} else {
		writeJSON(w, http.StatusUnprocessableEntity, resp)
	}
}

func (h *Handler) getInvocationLogs(w http.ResponseWriter, r *http.Request) {
	tID := tenantID(r)
	key := chi.URLParam(r, "key")
	limitStr := r.URL.Query().Get("limit")
	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	logs, err := h.registry.GetInvocationLogs(r.Context(), tID, key, limit)
	if err != nil {
		slog.Error("service_handler: get logs", "error", err, "service", key)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get logs"})
		return
	}
	if logs == nil {
		logs = []InvocationLog{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"items": logs})
}

// --- Helpers ---

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
