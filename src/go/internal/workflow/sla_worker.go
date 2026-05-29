package workflow

import (
	"context"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// SLAWorker is a background agent that checks for overdue SLAs and creates human tasks.
type SLAWorker struct {
	pool     *db.Pool
	interval time.Duration
	stop     chan struct{}
}

func NewSLAWorker(pool *db.Pool, interval time.Duration) *SLAWorker {
	if interval <= 0 {
		interval = 5 * time.Minute
	}
	return &SLAWorker{pool: pool, interval: interval, stop: make(chan struct{})}
}

// Start begins the background SLA checking loop. Call in a goroutine.
func (w *SLAWorker) Start(ctx context.Context) {
	ticker := time.NewTicker(w.interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := w.checkOverdue(ctx); err != nil {
				slog.Error("sla worker check", "error", err)
			}
		case <-w.stop:
			return
		case <-ctx.Done():
			return
		}
	}
}

// Stop signals the worker to stop.
func (w *SLAWorker) Stop() {
	close(w.stop)
}

func (w *SLAWorker) checkOverdue(ctx context.Context) error {
	rows, err := w.pool.Query(ctx, `
		SELECT id, tenant_id, entity_type, entity_id, sla_key
		FROM sla_record
		WHERE due_at < now() AND breached_at IS NULL AND resolved_at IS NULL
		LIMIT 100`)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var id, tenantID, entityType, entityID, slaKey string
		if err := rows.Scan(&id, &tenantID, &entityType, &entityID, &slaKey); err != nil {
			continue
		}

		// Mark as breached
		if _, err := w.pool.Exec(ctx, `UPDATE sla_record SET breached_at = now() WHERE id = $1`, id); err != nil {
			slog.Warn("sla mark breached", "id", id, "error", err)
			continue
		}

		// Create human task
		taskID := idgen.NewV4()
		title := "SLA breached: " + slaKey
		_, err = w.pool.Exec(ctx, `
			INSERT INTO human_task (id, tenant_id, entity_type, entity_id, task_type, title, status)
			VALUES ($1, $2, $3, $4, 'sla_breach', $5, 'open')`,
			taskID, tenantID, entityType, entityID, title)
		if err != nil {
			slog.Warn("sla create task", "error", err)
		} else {
			slog.Info("sla breach task created", "entity_type", entityType, "entity_id", entityID, "sla_key", slaKey)
		}
	}
	return rows.Err()
}
