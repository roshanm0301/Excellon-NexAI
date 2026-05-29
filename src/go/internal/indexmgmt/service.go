package indexmgmt

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// IndexQueueItem represents a row in entity_index_queue.
type IndexQueueItem struct {
	ID           string     `json:"id"`
	TenantID     string     `json:"tenant_id"`
	EntityKey    string     `json:"entity_key"`
	IndexName    string     `json:"index_name"`
	DDL          string     `json:"ddl"`
	Status       string     `json:"status"`
	ErrorMessage string     `json:"error_message,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	AppliedAt    *time.Time `json:"applied_at,omitempty"`
}

// Service manages the entity_index_queue table.
type Service struct {
	pool *db.Pool
}

func NewService(pool *db.Pool) *Service {
	return &Service{pool: pool}
}

// QueueIndexes inserts DDL statements into the queue. index_name is extracted from the DDL.
func (s *Service) QueueIndexes(ctx context.Context, tenantID, entityKey string, ddlStatements []string) error {
	for _, ddl := range ddlStatements {
		indexName := extractIndexName(ddl)
		id := idgen.NewV4()
		_, err := s.pool.Exec(ctx, `
			INSERT INTO entity_index_queue (id, tenant_id, entity_key, index_name, ddl)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (entity_key, index_name, tenant_id) DO NOTHING`,
			id, tenantID, entityKey, indexName, ddl)
		if err != nil {
			return fmt.Errorf("indexmgmt queue %s: %w", indexName, err)
		}
	}
	return nil
}

// ApplyNext picks the next pending item and executes its DDL.
func (s *Service) ApplyNext(ctx context.Context) error {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("indexmgmt apply tx: %w", err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	var id, ddl string
	err = tx.QueryRow(ctx,
		`SELECT id, ddl FROM entity_index_queue WHERE status = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED`,
	).Scan(&id, &ddl)
	if err != nil {
		// No pending items — not an error
		return nil
	}

	// Execute DDL
	_, execErr := tx.Exec(ctx, ddl)

	if execErr != nil {
		errMsg := execErr.Error()
		_, _ = tx.Exec(ctx,
			`UPDATE entity_index_queue SET status = 'failed', error_message = $2 WHERE id = $1`,
			id, errMsg)
		if cErr := tx.Commit(ctx); cErr != nil {
			return fmt.Errorf("indexmgmt apply commit (fail): %w", cErr)
		}
		return fmt.Errorf("indexmgmt apply DDL: %w", execErr)
	}

	now := time.Now().UTC()
	_, err = tx.Exec(ctx,
		`UPDATE entity_index_queue SET status = 'applied', applied_at = $2 WHERE id = $1`,
		id, now)
	if err != nil {
		return fmt.Errorf("indexmgmt apply update: %w", err)
	}

	return tx.Commit(ctx)
}

// List returns queue items filtered by tenant and optionally entity_key.
func (s *Service) List(ctx context.Context, tenantID, entityKey string) ([]IndexQueueItem, error) {
	args := []any{tenantID}
	where := "tenant_id = $1"
	if entityKey != "" {
		where += " AND entity_key = $2"
		args = append(args, entityKey)
	}

	rows, err := s.pool.Query(ctx,
		fmt.Sprintf(`SELECT id, tenant_id, entity_key, index_name, ddl, status, COALESCE(error_message,''), created_at, applied_at
		             FROM entity_index_queue WHERE %s ORDER BY created_at DESC`, where), args...)
	if err != nil {
		return nil, fmt.Errorf("indexmgmt list: %w", err)
	}
	defer rows.Close()

	var items []IndexQueueItem
	for rows.Next() {
		var item IndexQueueItem
		if err := rows.Scan(&item.ID, &item.TenantID, &item.EntityKey, &item.IndexName,
			&item.DDL, &item.Status, &item.ErrorMessage, &item.CreatedAt, &item.AppliedAt); err != nil {
			return nil, fmt.Errorf("indexmgmt list scan: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

// Discard marks a queue item as discarded.
func (s *Service) Discard(ctx context.Context, id string) error {
	tag, err := s.pool.Exec(ctx,
		`UPDATE entity_index_queue SET status = 'discarded' WHERE id = $1 AND status = 'pending'`,
		id)
	if err != nil {
		return fmt.Errorf("indexmgmt discard: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("index queue item %s: not found or not pending", id)
	}
	return nil
}

// extractIndexName parses the index name from a CREATE INDEX [CONCURRENTLY] statement.
func extractIndexName(ddl string) string {
	upper := strings.ToUpper(ddl)
	// Find "INDEX" keyword
	idx := strings.Index(upper, "INDEX")
	if idx < 0 {
		return "unknown"
	}
	rest := strings.TrimSpace(ddl[idx+5:])
	// Skip optional CONCURRENTLY
	if strings.HasPrefix(strings.ToUpper(rest), "CONCURRENTLY") {
		rest = strings.TrimSpace(rest[12:])
	}
	// Skip optional IF NOT EXISTS
	if strings.HasPrefix(strings.ToUpper(rest), "IF NOT EXISTS") {
		rest = strings.TrimSpace(rest[13:])
	}
	// First token is the index name
	parts := strings.Fields(rest)
	if len(parts) == 0 {
		return "unknown"
	}
	return parts[0]
}
