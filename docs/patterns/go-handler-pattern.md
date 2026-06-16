# Pattern: Go Chi Handler

> Canonical reference for GitHub Copilot. Read this before writing any new Go handler.

## What This Pattern Is

Every HTTP handler in this codebase follows the same structure:

- Constructor injection via `NewXxxHandler(repo *XxxRepo, ...) *XxxHandler`
- Route registration via `RegisterRoutes(r chi.Router)`
- Context extraction from the request context (never from headers directly in handlers)
- Shared helpers `writeJSON`, `writeError`, `decodeJSON` â€” never inline JSON encoding

## Canonical Example

Source: `src/go/internal/admin/artifact_handler.go`

```go
package admin

import (
    "log/slog"
    "net/http"

    "github.com/go-chi/chi/v5"
    "github.com/excellon/nexai/internal/middleware"
)

// 1. Struct â€” only injected dependencies, no globals
type ArtifactHandler struct {
    repo     *ArtifactRepo
    compiler *compiler.Service
}

// 2. Constructor â€” always returns pointer, never error
func NewArtifactHandler(repo *ArtifactRepo, svc *compiler.Service) *ArtifactHandler {
    return &ArtifactHandler{repo: repo, compiler: svc}
}

// 3. Route registration â€” all routes in one place
func (h *ArtifactHandler) RegisterRoutes(r chi.Router) {
    r.Post("/", h.create)
    r.Get("/", h.list)
    r.Get("/{id}", h.get)
    r.Put("/{id}", h.save)
    r.Post("/{id}/publish", h.publish)
    r.Delete("/{id}", h.delete)
}

// 4. Handler method â€” always (w http.ResponseWriter, r *http.Request)
func (h *ArtifactHandler) create(w http.ResponseWriter, r *http.Request) {
    // 4a. Context extraction â€” always via middleware helpers, never r.Header.Get() directly
    tenantID := middleware.TenantID(r.Context())
    userID   := middleware.UserID(r.Context())
    // 4b. Fallback for dev when header is absent â€” remove once auth middleware is in place
    if tenantID == "" {
        tenantID = "00000000-0000-0000-0000-000000000001"
    }

    // 4c. Decode request body
    var req CreateArtifactRequest
    if err := decodeJSON(r, &req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid request body")
        return
    }

    // 4d. Validate
    if req.EntityType == "" {
        writeError(w, http.StatusBadRequest, "entity_type is required")
        return
    }

    // 4e. Call repo
    a, err := h.repo.Create(r.Context(), tenantID, req.EntityType, userID, req.Payload)
    if err != nil {
        slog.Error("artifact create", "error", err)
        writeError(w, http.StatusInternalServerError, "failed to create artifact")
        return
    }

    // 4f. Respond
    writeJSON(w, http.StatusCreated, a)
}
```

## Shared Response Helpers

These three helpers live in `artifact_handler.go` and are copied (not imported) into new handler files in the same package:

```go
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
```

## Context Extraction

Context values are set by the `middleware.DevContext` middleware and read with typed helpers:

```go
tenantID := middleware.TenantID(r.Context())   // from x-tenant-id header
userID   := middleware.UserID(r.Context())     // from x-user-id header
role     := middleware.Role(r.Context())       // from x-role header
```

Never call `r.Header.Get("x-tenant-id")` directly inside a handler. Always go through the middleware helpers.

## Error Code Conventions

| Situation | HTTP status |
|-----------|------------|
| Missing/invalid request body | 400 Bad Request |
| Required field missing | 400 Bad Request |
| Record not found | 404 Not Found |
| Duplicate / constraint violation | 409 Conflict |
| Record not in editable state | 400 Bad Request |
| Compiler/validation error | 422 Unprocessable Entity |
| DB/internal error | 500 Internal Server Error |
| Soft-delete 204 | 204 No Content (no body) |

## What Copilot CAN Replicate

- Following the exact same struct/constructor/RegisterRoutes/handler method shape
- Adding new routes inside `RegisterRoutes`
- Using `writeJSON`, `writeError`, `decodeJSON` helpers exactly as shown
- Reading context with `middleware.TenantID`, `middleware.UserID`, `middleware.Role`
- Logging errors with `slog.Error("operation name", "error", err)`

## What Copilot Must NOT Do

- Do NOT write handlers that call `r.Header.Get(...)` directly â€” use middleware helpers
- Do NOT add JWT validation, token parsing, or Keycloak calls to any handler
- Do NOT add authorization / permission logic inside handler code â€” that belongs in middleware only
- Do NOT touch `src/go/internal/compiler/` â€” compiler internals are Claude Code territory
- Do NOT touch `src/go/internal/overlay/resolver.go` â€” overlay resolver is Claude Code territory
- Do NOT touch `src/go/internal/pii/` â€” PII encryption/masking is Claude Code territory
- Do NOT touch `src/go/internal/expression/` â€” JSONata VM pool is Claude Code territory
- Do NOT touch `src/go/internal/rules/production_evaluator.go` â€” rule evaluation is Claude Code territory
- Do NOT write inline SQL in handler methods â€” SQL belongs only in repo files
- Do NOT introduce global variables or `init()` functions
