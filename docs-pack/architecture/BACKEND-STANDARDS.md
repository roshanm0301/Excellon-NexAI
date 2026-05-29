# BACKEND-STANDARDS.md — Go Service Architecture & Conventions

> **Read before writing any Go code.**

---

## Package Structure

All packages live under `src/go/internal/`. Each package owns one subsystem. The rule: if two packages need to share a type, the type belongs in the package that owns it, and the other imports from there.

```
src/go/internal/
├── admin/               handler.go               Studio API (artifacts, nodes, attributes, indexes)
├── compiler/            entity_schema.go         6-step entity schema compilation
├── entityruntime/       handler.go, repo.go, computed.go   Entity record CRUD
├── expression/          engine.go, handler.go    JSONata via goja
├── rules/               production_evaluator.go  Rule evaluation
├── workflow/            production_runtime.go, loader.go, sla_worker.go
├── business_workflow/   engine.go, instance_repo.go, template_loader.go
├── overlay/             resolver.go              5-layer overlay merge
├── pii/                 service.go, crypto.go, kms.go, vault.go, masking.go
├── audit/               service.go, diff.go, partition.go
├── recycle/             service.go
├── retention/           service.go
├── purge/               agent.go
├── indexmgmt/           service.go
├── idgen/               idgen.go
└── nlp/                 handler.go
```

---

## Router Setup (chi)

```go
// cmd/server/main.go
r := chi.NewRouter()

// Global middleware — order matters
r.Use(middleware.RequestID)
r.Use(middleware.RealIP)
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Use(devContextMiddleware) // extracts x-tenant-id, x-user-id, x-role into context

// Route groups
r.Route("/api/v1", func(r chi.Router) {
    r.Mount("/artifacts", artifactHandler.Routes())
    r.Mount("/entities", entityRuntimeHandler.Routes())
    r.Mount("/admin", adminHandler.Routes())
    r.Mount("/expressions", expressionHandler.Routes())
    r.Mount("/admin/rules", rulesHandler.Routes())
    r.Mount("/admin/overlay-deltas", overlayHandler.Routes())
    r.Mount("/admin/nodes", nodeHandler.Routes())
    r.Mount("/admin/indexes", indexHandler.Routes())
    r.Mount("/processes", bwfHandler.Routes())
})
r.Mount("/api/nlp", nlpHandler.Routes())
r.Mount("/api/view-artifacts", viewArtifactHandler.Routes())
```

---

## Dev Context Middleware (No Auth)

This is the ONLY authentication mechanism in the initial build:

```go
// internal/middleware/devcontext.go
type ContextKey string

const (
    CtxTenantID ContextKey = "tenant_id"
    CtxUserID   ContextKey = "user_id"
    CtxRole     ContextKey = "role"
)

func DevContextMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        tenantID := r.Header.Get("x-tenant-id")
        userID := r.Header.Get("x-user-id")
        role := r.Header.Get("x-role")

        // Apply defaults if headers missing (dev convenience)
        if tenantID == "" { tenantID = "default-tenant" }
        if userID == "" { userID = "system" }
        if role == "" { role = "ADMIN" }

        ctx := context.WithValue(r.Context(), CtxTenantID, tenantID)
        ctx = context.WithValue(ctx, CtxUserID, userID)
        ctx = context.WithValue(ctx, CtxRole, role)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Helper extractors used in every handler
func TenantID(ctx context.Context) string { return ctx.Value(CtxTenantID).(string) }
func UserID(ctx context.Context) string   { return ctx.Value(CtxUserID).(string) }
func Role(ctx context.Context) string     { return ctx.Value(CtxRole).(string) }
```

**Every handler extracts context using these helpers. Never read headers directly inside handlers.**

---

## Handler Pattern

```go
// Canonical handler struct — constructor injection, no global state
type Handler struct {
    pool      *pgxpool.Pool
    repo      *Repo          // or interface if testing matters
    auditSvc  *audit.Service
    // add only what this handler needs
}

func NewHandler(pool *pgxpool.Pool, auditSvc *audit.Service) *Handler {
    return &Handler{
        pool:     pool,
        repo:     NewRepo(pool),
        auditSvc: auditSvc,
    }
}

func (h *Handler) Routes() chi.Router {
    r := chi.NewRouter()
    r.Post("/", h.create)
    r.Get("/", h.list)
    r.Get("/{id}", h.getByID)
    r.Patch("/{id}", h.update)
    r.Delete("/{id}", h.softDelete)
    return r
}

// Handler method pattern
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
    tenantID := middleware.TenantID(r.Context())
    userID := middleware.UserID(r.Context())

    var req CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, "invalid_request", err.Error())
        return
    }

    result, err := h.repo.Create(r.Context(), tenantID, userID, req)
    if err != nil {
        writeError(w, http.StatusInternalServerError, "create_failed", err.Error())
        return
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(result)
}
```

---

## Repository Pattern

```go
// No service layer for simple CRUD — handler calls repo directly
type Repo struct {
    pool *pgxpool.Pool
}

func NewRepo(pool *pgxpool.Pool) *Repo {
    return &Repo{pool: pool}
}

func (r *Repo) Create(ctx context.Context, tenantID, userID string, req CreateRequest) (*Record, error) {
    id := idgen.Generate("uuid_v7")

    const q = `
        INSERT INTO table_name (id, tenant_id, created_by, payload)
        VALUES ($1, $2, $3, $4)
        RETURNING id, tenant_id, created_at, created_by, payload`

    var rec Record
    err := r.pool.QueryRow(ctx, q, id, tenantID, userID, req.Payload).
        Scan(&rec.ID, &rec.TenantID, &rec.CreatedAt, &rec.CreatedBy, &rec.Payload)
    if err != nil {
        return nil, fmt.Errorf("repo.Create: %w", err)
    }
    return &rec, nil
}
```

---

## Error Response Format

Always use this shape:

```go
type ErrorResponse struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Field   string `json:"field,omitempty"` // for validation errors
}

func writeError(w http.ResponseWriter, status int, code, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(ErrorResponse{Code: code, Message: message})
}

// Common error codes
// entity.not_found            → 404
// entity.composite_key_violation → 409
// entity.schema_not_found     → 500
// entity.rule_violation       → 422
// entity.workflow_guard_failed → 403
// entity.invalid_transition   → 400
// expression.invalid          → 422
// request.invalid             → 400
```

---

## Pagination Pattern

```go
// Query params: ?page=1&page_size=25
type PaginationParams struct {
    Page     int
    PageSize int
    Offset   int
}

func parsePagination(r *http.Request) PaginationParams {
    page, _ := strconv.Atoi(r.URL.Query().Get("page"))
    if page < 1 { page = 1 }
    pageSize, _ := strconv.Atoi(r.URL.Query().Get("page_size"))
    if pageSize < 1 || pageSize > 100 { pageSize = 25 }
    return PaginationParams{Page: page, PageSize: pageSize, Offset: (page - 1) * pageSize}
}

// Response shape
type ListResponse[T any] struct {
    Items    []T `json:"items"`
    Total    int `json:"total"`
    Page     int `json:"page"`
    PageSize int `json:"page_size"`
}
```

---

## JSONB Query Patterns

All entity records use a `payload JSONB` column. These are the approved patterns:

```sql
-- Filter by a field inside payload
WHERE entity_type = $1 AND tenant_id = $2 AND deleted_at IS NULL
  AND (payload->>'status') = $3

-- Partial update (JSONB merge — does NOT remove existing keys)
UPDATE entity_record
SET payload = payload || $1::jsonb,
    version_no = version_no + 1,
    updated_at = NOW(),
    updated_by = $2
WHERE id = $3 AND tenant_id = $4 AND deleted_at IS NULL
RETURNING *

-- Composite key uniqueness check
SELECT id FROM entity_record
WHERE entity_type = $1 AND tenant_id = $2 AND deleted_at IS NULL
  AND (payload->>'field_name') = $3
LIMIT 1

-- Full-text search (optional)
WHERE entity_type = $1 AND tenant_id = $2 AND deleted_at IS NULL
  AND payload @@ plainto_tsquery('english', $3)
```

---

## Async Post-Operations Pattern

Audit recording, workflow post-actions, SLA creation, and outbox events are fire-and-forget:

```go
// CORRECT — fire and forget
go func() {
    if err := h.auditSvc.Record(context.Background(), event); err != nil {
        slog.Error("audit record failed", "err", err, "entity_id", entityID)
    }
}()

// NEVER wait for these — they must not block the main transaction
```

---

## Logging

```go
// Use slog structured logging throughout
slog.Info("entity created",
    "entity_type", entityType,
    "entity_id", id,
    "tenant_id", tenantID,
    "user_id", userID,
)

slog.Error("repo query failed",
    "err", err,
    "query", "Create",
    "tenant_id", tenantID,
)

// Never use fmt.Println or log.Printf in committed code
```

---

## Database Migration Rules

1. Files in `db/migrations/` — format: `{unix_timestamp}_{snake_case_description}.up.sql` + `.down.sql`
2. Always have a `.down.sql` that reverses the `.up.sql`
3. Never use `ALTER TABLE` to drop a column — deprecate first (rename to `_deprecated_colname`), deploy, then drop in a follow-up migration
4. Never add an index inline in a migration for production data tables — use the index queue
5. Every new table must include: `tenant_id`, `created_at`, `updated_at`, `created_by`
6. Run `golang-migrate up` on service startup in dev; separate job in production

---

## Dependency Injection — Main.go Pattern

```go
// main.go wires everything — no global singletons
pool, _ := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
redisClient := cache.NewRedis(os.Getenv("REDIS_URL"))  // optional

expressionEngine, _ := expression.NewEngine()
overlayResolver := overlay.NewResolver(pool, redisClient)
piiService := pii.NewService(pool, os.Getenv("ENCRYPTION_MASTER_KEY"))
auditService := audit.NewService(pool)
rulesEvaluator := rules.NewProductionEvaluator(pool)
workflowRuntime := workflow.NewProductionRuntime(pool, rulesEvaluator, auditService)
compiler_ := compiler.NewCompiler(pool)

entityHandler := entityruntime.NewHandler(pool, piiService, expressionEngine, rulesEvaluator, workflowRuntime, auditService)
adminHandler := admin.NewHandler(pool, overlayResolver, compiler_)
// ... etc
```

---

## Testing

```go
// Integration tests use testcontainers-go for real PostgreSQL
// Unit tests use interfaces + mocks

// Test file naming: {file}_test.go in same package
// Test function naming: TestHandlerCreate_Success, TestHandlerCreate_CompositeKeyViolation

// Always test the error path, not just the happy path
```
