package overlay

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// Cache wraps a Redis client for overlay resolution caching.
type Cache struct {
	client *redis.Client
}

// NewCache creates a Cache from a Redis URL. Returns nil (graceful degradation) on error.
func NewCache(redisURL string) (*Cache, error) {
	if redisURL == "" {
		return nil, fmt.Errorf("REDIS_URL not set")
	}
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("overlay cache: parse redis URL: %w", err)
	}
	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("overlay cache: redis ping: %w", err)
	}
	slog.Info("overlay cache: redis connected")
	return &Cache{client: client}, nil
}

// Get retrieves a cached overlay result. Returns (nil, false, nil) on cache miss.
func (c *Cache) Get(ctx context.Context, key string) (map[string]any, bool, error) {
	if c == nil || c.client == nil {
		return nil, false, nil
	}
	data, err := c.client.Get(ctx, key).Bytes()
	if err == redis.Nil {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, fmt.Errorf("overlay cache get: %w", err)
	}
	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, false, fmt.Errorf("overlay cache unmarshal: %w", err)
	}
	return result, true, nil
}

// Set stores an overlay result in the cache with the given TTL.
func (c *Cache) Set(ctx context.Context, key string, value map[string]any, ttl time.Duration) error {
	if c == nil || c.client == nil {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("overlay cache marshal: %w", err)
	}
	if err := c.client.Set(ctx, key, data, ttl).Err(); err != nil {
		return fmt.Errorf("overlay cache set: %w", err)
	}
	return nil
}

// Invalidate deletes cache keys matching the given pattern.
func (c *Cache) Invalidate(ctx context.Context, pattern string) error {
	if c == nil || c.client == nil {
		return nil
	}
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("overlay cache keys: %w", err)
	}
	if len(keys) == 0 {
		return nil
	}
	if err := c.client.Del(ctx, keys...).Err(); err != nil {
		return fmt.Errorf("overlay cache del: %w", err)
	}
	return nil
}
