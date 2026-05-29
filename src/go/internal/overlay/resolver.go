package overlay

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/excellon/nexai/internal/db"
)

const cacheTTL = 6 * time.Hour

// Resolver resolves the merged overlay for a given context.
type Resolver struct {
	pool  *db.Pool
	cache *Cache
}

func NewResolver(pool *db.Pool, cache *Cache) *Resolver {
	return &Resolver{pool: pool, cache: cache}
}

// Resolve returns the merged overlay for the given tenant/artifactType/artifactKey/node/role context.
// Order: platform → vertical → tenant → node → role
func (r *Resolver) Resolve(ctx context.Context, tenantID, artifactType, artifactKey, nodeID, role string) (map[string]any, error) {
	cacheKey := fmt.Sprintf("overlay:%s:%s:%s:%s:%s", tenantID, artifactType, artifactKey, nodeID, role)

	// Try cache first
	if r.cache != nil {
		cached, hit, err := r.cache.Get(ctx, cacheKey)
		if err != nil {
			slog.Warn("overlay cache get error", "error", err)
		} else if hit {
			return cached, nil
		}
	}

	// Load all overlay layers from DB
	rows, err := r.pool.Query(ctx, `
		SELECT layer, delta_json
		FROM artifact_overlay_delta
		WHERE tenant_id = $1 AND artifact_type = $2 AND artifact_key = $3
		ORDER BY CASE layer
			WHEN 'platform' THEN 1
			WHEN 'vertical' THEN 2
			WHEN 'tenant'   THEN 3
			WHEN 'node'     THEN 4
			WHEN 'role'     THEN 5
		END`,
		tenantID, artifactType, artifactKey)
	if err != nil {
		return nil, fmt.Errorf("overlay resolve query: %w", err)
	}
	defer rows.Close()

	result := map[string]any{}
	for rows.Next() {
		var layer string
		var deltaRaw []byte
		if err := rows.Scan(&layer, &deltaRaw); err != nil {
			return nil, fmt.Errorf("overlay resolve scan: %w", err)
		}
		var delta map[string]any
		if err := json.Unmarshal(deltaRaw, &delta); err != nil {
			slog.Warn("overlay resolve: invalid delta JSON", "layer", layer, "error", err)
			continue
		}
		result = deepMerge(result, delta)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("overlay resolve rows: %w", err)
	}

	// Store in cache
	if r.cache != nil {
		if err := r.cache.Set(ctx, cacheKey, result, cacheTTL); err != nil {
			slog.Warn("overlay cache set error", "error", err)
		}
	}

	return result, nil
}
