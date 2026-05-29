package audit

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
	"github.com/excellon/nexai/internal/idgen"
)

// Event describes a single auditable action.
type Event struct {
	TenantID     string
	EntityType   string
	EntityID     string
	EventType    string
	ActorID      string
	Role         string
	Before       map[string]any
	After        map[string]any
	Purpose      string // DPDP/GDPR
	LawfulBasis  string
	DataCategory string
}

// AuditRecord is the stored audit event.
type AuditRecord struct {
	ID         string          `json:"id"`
	TenantID   string          `json:"tenant_id"`
	EventType  string          `json:"event_type"`
	EntityType string          `json:"entity_type"`
	EntityID   string          `json:"entity_id"`
	ActorID    string          `json:"actor_id"`
	BeforeData json.RawMessage `json:"before_data,omitempty"`
	AfterData  json.RawMessage `json:"after_data,omitempty"`
	Diff       json.RawMessage `json:"diff,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

// Record writes an audit event. Always call as: go audit.Record(ctx, pool, event)
func Record(ctx context.Context, pool *db.Pool, e Event) {
	id := idgen.NewV4()

	beforeDiff, afterDiff := diffPayloads(e.Before, e.After)

	beforeJSON, _ := json.Marshal(e.Before)
	afterJSON, _ := json.Marshal(e.After)
	diffJSON, _ := json.Marshal(map[string]any{"before": beforeDiff, "after": afterDiff})

	eventType := e.EventType
	if eventType == "" {
		eventType = "entity.change"
	}

	_, err := pool.Exec(ctx, `
		INSERT INTO audit_event (id, tenant_id, event_type, entity_type, entity_id, actor_id, before_data, after_data, diff, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
		id, e.TenantID, eventType, e.EntityType, e.EntityID, e.ActorID,
		nullIfEmpty(beforeJSON), nullIfEmpty(afterJSON), nullIfEmpty(diffJSON))
	if err != nil {
		slog.Warn("audit record failed (non-fatal)", "error", err, "entity_type", e.EntityType, "entity_id", e.EntityID, "event_type", eventType)
	}
}

// diffPayloads returns only the changed keys between before and after.
func diffPayloads(before, after map[string]any) (map[string]any, map[string]any) {
	if before == nil && after == nil {
		return nil, nil
	}
	if before == nil {
		return nil, after
	}
	if after == nil {
		return before, nil
	}

	beforeDiff := map[string]any{}
	afterDiff := map[string]any{}

	allKeys := map[string]bool{}
	for k := range before {
		allKeys[k] = true
	}
	for k := range after {
		allKeys[k] = true
	}

	for k := range allKeys {
		bv, bOk := before[k]
		av, aOk := after[k]
		if bOk && aOk {
			bj, _ := json.Marshal(bv)
			aj, _ := json.Marshal(av)
			if string(bj) != string(aj) {
				beforeDiff[k] = bv
				afterDiff[k] = av
			}
		} else if bOk {
			beforeDiff[k] = bv
		} else {
			afterDiff[k] = av
		}
	}
	return beforeDiff, afterDiff
}

func nullIfEmpty(b []byte) interface{} {
	if len(b) == 0 || string(b) == "null" || string(b) == "{}" {
		return nil
	}
	return b
}
