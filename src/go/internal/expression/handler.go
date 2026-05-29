package expression

import (
	"encoding/json"
	"io"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// Handler exposes HTTP routes for the expression engine.
type Handler struct {
	engine *Engine
}

func NewHandler(engine *Engine) *Handler {
	return &Handler{engine: engine}
}

func (h *Handler) RegisterRoutes(r chi.Router) {
	r.Post("/evaluate", h.evaluate)
	r.Post("/validate", h.validate)
}

type evaluateRequest struct {
	Expr string         `json:"expr"`
	Data map[string]any `json:"data"`
}

type validateRequest struct {
	Expr string `json:"expr"`
}

func (h *Handler) evaluate(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read body")
		return
	}
	var req evaluateRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Expr == "" {
		writeError(w, http.StatusBadRequest, "expr is required")
		return
	}

	result, err := h.engine.Evaluate(r.Context(), req.Expr, req.Data)
	if err != nil {
		slog.Warn("expression evaluate", "expr", req.Expr, "error", err)
		writeError(w, http.StatusUnprocessableEntity, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"result": result})
}

func (h *Handler) validate(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		writeError(w, http.StatusBadRequest, "failed to read body")
		return
	}
	var req validateRequest
	if err := json.Unmarshal(body, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	syntaxErr := h.engine.ValidateSyntax(r.Context(), req.Expr)
	if syntaxErr != nil {
		writeJSON(w, http.StatusOK, map[string]any{"valid": false, "error": syntaxErr.Error()})
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"valid": true})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("expression response encode", "error", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
