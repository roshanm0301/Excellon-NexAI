package purge

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/retention"
)

// Agent is a background goroutine that runs lifecycle transitions.
type Agent struct {
	pool      *db.Pool
	retention *retention.Service
	interval  time.Duration
	stop      chan struct{}
}

func NewAgent(pool *db.Pool, ret *retention.Service) *Agent {
	return &Agent{
		pool:      pool,
		retention: ret,
		interval:  1 * time.Hour,
		stop:      make(chan struct{}),
	}
}

// Start runs the purge loop until the context is cancelled.
func (a *Agent) Start(ctx context.Context) {
	slog.Info("purge agent started", "interval", a.interval)
	ticker := time.NewTicker(a.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			slog.Info("purge agent stopped")
			return
		case <-a.stop:
			slog.Info("purge agent stopped")
			return
		case <-ticker.C:
			a.runCycle(ctx)
		}
	}
}

// Stop signals the agent to stop.
func (a *Agent) Stop() {
	select {
	case a.stop <- struct{}{}:
	default:
	}
}

func (a *Agent) runCycle(ctx context.Context) {
	slog.Debug("purge agent: starting cycle")

	rows, err := a.pool.Query(ctx, `
		SELECT DISTINCT tenant_id, entity_type
		FROM entity_record
		WHERE deleted_at IS NOT NULL`)
	if err != nil {
		slog.Warn("purge agent: query entity types failed", "error", err)
		return
	}

	type entityKey struct {
		tenantID   string
		entityType string
	}
	var keys []entityKey
	for rows.Next() {
		var k entityKey
		if err := rows.Scan(&k.tenantID, &k.entityType); err != nil {
			slog.Warn("purge agent: scan failed", "error", err)
			continue
		}
		keys = append(keys, k)
	}
	rows.Close()

	for _, k := range keys {
		policy := a.loadPolicy(ctx, k.tenantID, k.entityType)
		if policy.LegalHold {
			continue
		}

		retentionCutoff := time.Now().UTC().AddDate(0, 0, -policy.RetentionDays)
		a.moveToLifecycle(ctx, k.tenantID, k.entityType, retentionCutoff)

		if policy.PurgeDays > 0 {
			purgeCutoff := time.Now().UTC().AddDate(0, 0, -policy.PurgeDays)
			a.hardPurge(ctx, k.tenantID, k.entityType, purgeCutoff)
		}
	}
}

func (a *Agent) loadPolicy(ctx context.Context, tenantID, entityType string) retention.RetentionPolicy {
	var payloadBytes []byte
	err := a.pool.QueryRow(ctx,
		`SELECT payload FROM compiled_artifact WHERE artifact_key = $1 AND tenant_id = $2 AND artifact_type = 'entity_schema' AND status = 'active'`,
		entityType, tenantID).Scan(&payloadBytes)
	if err != nil {
		return a.retention.ResolvePolicy(nil)
	}

	var payload map[string]any
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return a.retention.ResolvePolicy(nil)
	}
	return a.retention.ResolvePolicy(payload)
}

func (a *Agent) moveToLifecycle(ctx context.Context, tenantID, entityType string, cutoff time.Time) {
	rows, err := a.pool.Query(ctx, `
		SELECT id FROM entity_record
		WHERE tenant_id = $1 AND entity_type = $2 AND deleted_at IS NOT NULL AND deleted_at < $3`,
		tenantID, entityType, cutoff)
	if err != nil {
		slog.Warn("purge agent: moveToLifecycle query failed", "error", err, "entity_type", entityType)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		_, _ = a.pool.Exec(ctx, `
			INSERT INTO entity_lifecycle (tenant_id, entity_type, entity_id, stage, moved_at)
			VALUES ($1, $2, $3, 'archived', NOW())
			ON CONFLICT DO NOTHING`,
			tenantID, entityType, id)
	}
}

func (a *Agent) hardPurge(ctx context.Context, tenantID, entityType string, cutoff time.Time) {
	tag, err := a.pool.Exec(ctx, `
		DELETE FROM entity_record
		WHERE tenant_id = $1 AND entity_type = $2 AND deleted_at IS NOT NULL AND deleted_at < $3`,
		tenantID, entityType, cutoff)
	if err != nil {
		slog.Warn("purge agent: hardPurge failed", "error", err, "entity_type", entityType)
		return
	}
	if tag.RowsAffected() > 0 {
		slog.Info("purge agent: hard-purged records",
			"entity_type", entityType, "tenant_id", tenantID, "count", tag.RowsAffected())
	}
}
