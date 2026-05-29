# Pattern: Go pgx/v5 Repository

> Canonical reference for GitHub Copilot. Read this before writing any new Go repository.

## What This Pattern Is

Every database repository in this codebase:

- Holds a single `*db.Pool` (which is `pgxpool.Pool`)
- Uses positional `$1`, `$2`, ... parameters — pgx does NOT support named parameters
- Uses `pgx.ErrNoRows` to detect not-found and convert to a domain error
- Uses `pool.Exec` + `tag.RowsAffected()` for soft-delete operations
- Uses a private `scanXxx(rowScanner)` helper so both `pgx.Row` and `pgx.Rows` can be scanned with one function
- Never uses an ORM

## Canonical Example

Source: `src/go/internal/admin/artifact_repo.go`

### Struct and constructor

```go
package admin

import (
    "context"
    "fmt"

    "github.com/jackc/pgx/v5"
    "github.com/excellon/nexai/internal/db"
    "github.com/excellon/nexai/internal/idgen"
)

type ArtifactRepo struct {
    pool *db.Pool
}

func NewArtifactRepo(pool *db.Pool) *ArtifactRepo {
    return &ArtifactRepo{pool: pool}
}
```

### Create — INSERT RETURNING

```go
func (r *ArtifactRepo) Create(ctx context.Context, tenantID, entityType, createdBy string, payload []byte) (*ArtifactVersion, error) {
    id := idgen.NewV4()
    const q = `
        INSERT INTO artifact_version (id, tenant_id, entity_type, version, status, payload, created_by)
        VALUES ($1, $2, $3, 1, 'draft', $4, $5)
        RETURNING id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at`
    row := r.pool.QueryRow(ctx, q, id, tenantID, entityType, payload, createdBy)
    return scanArtifact(row)
}
```

### GetByID — single row, not-found detection

```go
func (r *ArtifactRepo) GetByID(ctx context.Context, tenantID, id string) (*ArtifactVersion, error) {
    const q = `
        SELECT id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at
        FROM artifact_version
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`
    row := r.pool.QueryRow(ctx, q, id, tenantID)
    a, err := scanArtifact(row)
    if err == pgx.ErrNoRows {
        return nil, fmt.Errorf("artifact %s: not found", id)
    }
    return a, err
}
```

### List — dynamic WHERE, COUNT + paginated SELECT

```go
func (r *ArtifactRepo) List(ctx context.Context, tenantID, entityType, status string, limit, offset int) ([]ArtifactVersion, int, error) {
    args := []any{tenantID}
    where := "tenant_id = $1 AND deleted_at IS NULL"
    n := 2
    if entityType != "" {
        where += fmt.Sprintf(" AND entity_type = $%d", n)
        args = append(args, entityType)
        n++
    }
    if status != "" {
        where += fmt.Sprintf(" AND status = $%d", n)
        args = append(args, status)
        n++
    }

    var total int
    if err := r.pool.QueryRow(ctx, fmt.Sprintf(`SELECT COUNT(*) FROM artifact_version WHERE %s`, where), args...).Scan(&total); err != nil {
        return nil, 0, fmt.Errorf("artifact list count: %w", err)
    }

    args = append(args, limit, offset)
    rows, err := r.pool.Query(ctx, fmt.Sprintf(`
        SELECT id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at
        FROM artifact_version WHERE %s ORDER BY updated_at DESC LIMIT $%d OFFSET $%d`, where, n, n+1), args...)
    if err != nil {
        return nil, 0, fmt.Errorf("artifact list: %w", err)
    }
    defer rows.Close()

    var artifacts []ArtifactVersion
    for rows.Next() {
        a, err := scanArtifact(rows)
        if err != nil {
            return nil, 0, err
        }
        artifacts = append(artifacts, *a)
    }
    return artifacts, total, rows.Err()
}
```

### Update — UPDATE RETURNING

```go
func (r *ArtifactRepo) Save(ctx context.Context, tenantID, id string, payload []byte) (*ArtifactVersion, error) {
    const q = `
        UPDATE artifact_version SET payload = $3, updated_at = now()
        WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL AND status IN ('draft','in-review')
        RETURNING id, tenant_id, entity_type, version, status, payload, content_hash, created_by, created_at, updated_at`
    row := r.pool.QueryRow(ctx, q, id, tenantID, payload)
    a, err := scanArtifact(row)
    if err == pgx.ErrNoRows {
        return nil, fmt.Errorf("artifact %s: not found or not editable", id)
    }
    return a, err
}
```

### SoftDelete — Exec + RowsAffected

```go
func (r *ArtifactRepo) SoftDelete(ctx context.Context, tenantID, id string) error {
    tag, err := r.pool.Exec(ctx,
        `UPDATE artifact_version SET deleted_at = now() WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        id, tenantID)
    if err != nil {
        return fmt.Errorf("artifact delete: %w", err)
    }
    if tag.RowsAffected() == 0 {
        return fmt.Errorf("artifact %s: not found", id)
    }
    return nil
}
```

### Row scanner — shared between QueryRow and Rows

```go
// rowScanner works for both pgx.Row and pgx.Rows
type rowScanner interface {
    Scan(dest ...any) error
}

func scanArtifact(row rowScanner) (*ArtifactVersion, error) {
    var a ArtifactVersion
    var hash *string
    err := row.Scan(&a.ID, &a.TenantID, &a.EntityType, &a.Version, &a.Status, &a.Payload, &hash, &a.CreatedBy, &a.CreatedAt, &a.UpdatedAt)
    if err != nil {
        return nil, err
    }
    if hash != nil {
        a.ContentHash = *hash
    }
    return &a, nil
}
```

## Constraint Violation Handling (409 Conflict)

When a unique constraint is violated, pgx returns a `*pgconn.PgError` with `Code == "23505"`. Handle it in the handler (not the repo):

```go
import "github.com/jackc/pgx/v5/pgconn"

var pgErr *pgconn.PgError
if errors.As(err, &pgErr) && pgErr.Code == "23505" {
    writeError(w, http.StatusConflict, "duplicate: "+pgErr.ConstraintName)
    return
}
```

## Rules

- All queries use positional `$1`, `$2`, ... — pgx does not support `@named` parameters
- Always filter `AND deleted_at IS NULL` in SELECT and UPDATE queries for soft-deletable tables
- Always include `tenant_id` in every WHERE clause
- Error wrapping format: `fmt.Errorf("artifact list count: %w", err)`
- Use `idgen.NewV4()` for standard IDs; use `idgen.NewV7()` for high-insert-rate tables that benefit from time-ordering

## What Copilot CAN Replicate

- Additional repo structs for new resource types following this exact pattern
- `Create`, `GetByID`, `List`, `Save`, `SoftDelete`, `SetStatus` methods for new tables
- Additional filter parameters in List following the dynamic `$n` pattern
- `rowScanner` interface + `scanXxx` helper for new struct types

## What Copilot Must NOT Do

- Do NOT use an ORM or query builder library
- Do NOT write SQL inline inside handler methods — SQL belongs only in repo files
- Do NOT hard-delete rows — always use `deleted_at = now()`
- Do NOT omit `tenant_id` from WHERE clauses
- Do NOT create new tables for business entity types — all runtime data goes in `entity_record` with JSONB payload
- Do NOT write repo functions that read from `artifact_version.payload` for runtime use — runtime reads only `compiled_artifact`
- Do NOT add indexes inline in migrations for production data tables — use the index queue
