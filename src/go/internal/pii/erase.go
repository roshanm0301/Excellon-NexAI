package pii

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/excellon/nexai/internal/compiler"
	"github.com/excellon/nexai/internal/db"
)

// EraseRecord replaces all PII field values in the record's payload with an erasure marker.
func (s *Service) EraseRecord(ctx context.Context, pool *db.Pool, entityType, entityID string, schema *compiler.CompiledSchema) error {
	if schema == nil || !schema.HasPII {
		return nil
	}

	erased := map[string]any{}
	ts := time.Now().UTC().Format(time.RFC3339)
	marker := map[string]any{"erased": true, "ts": ts}

	for _, field := range schema.Fields {
		if field.PII {
			erased[field.Key] = marker
		}
	}

	patch, err := json.Marshal(erased)
	if err != nil {
		return fmt.Errorf("pii erase: marshal patch: %w", err)
	}

	_, err = pool.Exec(ctx,
		`UPDATE entity_record SET payload = payload || $1 WHERE id = $2 AND entity_type = $3`,
		patch, entityID, entityType)
	if err != nil {
		return fmt.Errorf("pii erase: update: %w", err)
	}
	return nil
}
